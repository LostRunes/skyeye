// Shared helpers for the spin-the-wheel serverless functions (Vercel treats
// files starting with "_" as helpers, not routes).
//
// Environment variables (Vercel → Project → Settings → Environment Variables):
//   SUPABASE_SECRET_KEY   Supabase secret key (sb_secret_…). Server only.
//   SMTP_HOST             e.g. smtp.zoho.in or smtp.gmail.com
//   SMTP_PORT             465 (SSL) unless your provider says otherwise
//   SMTP_USER             the mailbox that sends the codes
//   SMTP_PASS             its app password
//   MAIL_FROM             optional, e.g. "Sky Eye Technology <hello@skyeyetechnology.in>"
import nodemailer from 'nodemailer'

export const SUPABASE_URL = process.env.SUPABASE_URL || 'https://jbzdkzajjgdhzokdscyz.supabase.co'
export const PLAY_URL = 'https://www.skyeyetechnology.in/#/spin'
const KEY = () => {
  const k = process.env.SUPABASE_SECRET_KEY
  if (!k) throw new Error('SUPABASE_SECRET_KEY is not set')
  return k
}

export const json = (res, status, body) => res.status(status).json(body)

export const readBody = (req) => {
  if (req.body && typeof req.body === 'object') return req.body
  try {
    return JSON.parse(req.body || '{}')
  } catch {
    return {}
  }
}

const headers = () => ({ apikey: KEY(), Authorization: `Bearer ${KEY()}`, 'Content-Type': 'application/json' })

/** Calls a Postgres function with the secret key. */
export async function rpc(fn, args) {
  const r = await fetch(`${SUPABASE_URL}/rest/v1/rpc/${fn}`, { method: 'POST', headers: headers(), body: JSON.stringify(args) })
  const out = await r.json().catch(() => null)
  if (!r.ok) throw new Error(out?.message || `${fn} failed (${r.status})`)
  return out
}

/** Minimal REST access to a table with the secret key. */
export async function rest(path, { method = 'GET', body } = {}) {
  const r = await fetch(`${SUPABASE_URL}/rest/v1/${path}`, {
    method,
    headers: { ...headers(), Prefer: 'return=representation' },
    body: body ? JSON.stringify(body) : undefined,
  })
  const out = await r.json().catch(() => null)
  if (!r.ok) throw new Error(out?.message || `${path} failed (${r.status})`)
  return out
}

/** The signed-in user's id if their access token belongs to an admin. */
export async function adminFrom(req) {
  const token = (req.headers.authorization || '').replace(/^Bearer\s+/i, '')
  if (!token) return null
  const u = await fetch(`${SUPABASE_URL}/auth/v1/user`, { headers: { apikey: KEY(), Authorization: `Bearer ${token}` } })
  if (!u.ok) return null
  const user = await u.json()
  const rows = await rest(`admins?select=user_id&user_id=eq.${encodeURIComponent(user.id)}`)
  return rows?.length ? user.id : null
}

let transport
const mailer = () => {
  if (!process.env.SMTP_HOST || !process.env.SMTP_USER || !process.env.SMTP_PASS) {
    throw new Error('Email is not set up yet (SMTP settings missing)')
  }
  transport ??= nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT || 465),
    secure: Number(process.env.SMTP_PORT || 465) === 465,
    auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS },
  })
  return transport
}

const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c])

// The code email, in the spin pages' carnival look: sunset backdrop, a
// parchment card in an ink outline under a crimson-and-cream awning, a
// ticket-stub code and a crimson button. Tables + inline styles so it holds
// up in Gmail/Outlook; the retro face (Shrikhand) falls back to Georgia
// where email clients don't load web fonts.
const emailHtml = ({ name, code, link }) => {
  const ink = '#2f2926'
  const parch = '#f4ecd9'
  const paper = '#fffaf0'
  const crimson = '#b22026'
  const teal = '#3f7373'
  const mustard = '#dda94b'
  const muted = '#6f6259'
  const display = "'Shrikhand', Georgia, 'Times New Roman', serif"
  const body = "'Helvetica Neue', Arial, sans-serif"
  const stripes = Array.from(
    { length: 12 },
    (_, i) => `<td width="8.33%" height="26" style="background:${i % 2 ? paper : crimson};font-size:0;line-height:0">&nbsp;</td>`,
  ).join('')
  const step = (n, text) => `<tr>
    <td width="34" valign="top" style="padding:0 0 10px">
      <div style="width:26px;height:26px;line-height:26px;border-radius:13px;background:${mustard};border:2px solid ${ink};text-align:center;font:bold 13px ${body};color:${ink}">${n}</div>
    </td>
    <td valign="top" style="padding:3px 0 10px;font:15px/1.45 ${body};color:${ink};text-align:left">${text}</td>
  </tr>`

  return `<!doctype html>
<html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<link href="https://fonts.googleapis.com/css2?family=Shrikhand&display=swap" rel="stylesheet"></head>
<body style="margin:0;padding:0;background:#f1c79c">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#d9989c;background-image:linear-gradient(180deg,#6c6190 0%,#9c7ea3 30%,#d9989c 62%,#f1c79c 100%)">
<tr><td align="center" style="padding:30px 14px 36px">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:480px">
    <tr><td align="center" style="padding:0 0 18px;font-family:${display};font-size:28px;color:${paper};text-shadow:2px 2px 0 ${ink}">
      Sky Eye <span style="color:${mustard}">Spin</span>
    </td></tr>
    <tr><td style="background:${parch};border:3px solid ${ink};border-radius:18px;overflow:hidden;box-shadow:6px 6px 0 ${ink}">
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0"><tr>${stripes}</tr></table>
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0"><tr><td style="border-top:3px solid ${ink};font-size:0;line-height:0">&nbsp;</td></tr></table>
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
        <tr><td align="center" style="padding:22px 24px 6px">
          <table role="presentation" cellpadding="0" cellspacing="0"><tr>
            <td align="center" style="background:${crimson};border:3px solid ${ink};border-radius:90px 90px 12px 12px;padding:16px 30px 12px;box-shadow:4px 4px 0 ${ink}">
              <div style="font:bold 11px ${body};letter-spacing:3px;color:#e9dbbd">SKY EYE PRESENTS</div>
              <div style="font-family:${display};font-size:36px;line-height:1.1;color:${paper};text-shadow:2px 2px 0 ${ink}">Spin &amp; Win</div>
            </td>
          </tr></table>
        </td></tr>
        <tr><td align="center" style="padding:18px 24px 0">
          <div style="font-family:${display};font-size:28px;line-height:1.15;color:${crimson}">Hi ${name}, you're in!</div>
          <p style="margin:10px 0 0;font:15px/1.5 ${body};color:${muted}">Thanks for registering for the Sky Eye stall games at <b style="color:${ink}">KIIT MUN</b>. Here's your spin code:</p>
        </td></tr>
        <tr><td align="center" style="padding:20px 24px 4px">
          <table role="presentation" cellpadding="0" cellspacing="0"><tr>
            <td style="background:${paper};border:3px solid ${ink};border-radius:12px;padding:6px;box-shadow:4px 4px 0 ${ink}">
              <div style="border:2px dashed ${mustard};border-radius:8px;padding:12px 18px 12px 26px;font:bold 34px 'Courier New',Courier,monospace;letter-spacing:8px;color:${ink}">${code}</div>
            </td>
          </tr></table>
          <div style="padding:8px 0 0;font:bold 11px ${body};letter-spacing:2px;color:${teal}">ONE CODE · ONE SPIN</div>
        </td></tr>
        <tr><td style="padding:20px 28px 4px">
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
            ${step(1, 'Come to the <b>Sky Eye stall</b>, Campus 6.')}
            ${step(2, 'When a round starts, scan the <b>QR code</b> at the stall.')}
            ${step(3, `Enter your code and spin. <b style="color:${crimson}">The first spinners of each round win Sky Eye goodies!</b>`)}
          </table>
        </td></tr>
        <tr><td align="center" style="padding:10px 24px 26px">
          <a href="${link}" style="display:inline-block;background:${crimson};color:${paper};text-decoration:none;font:bold 16px ${body};padding:14px 30px;border:3px solid ${ink};border-radius:999px;box-shadow:4px 4px 0 ${ink}">Open the wheel &rarr;</a>
        </td></tr>
      </table>
    </td></tr>
    <tr><td align="center" style="padding:20px 10px 0;font:12px/1.5 ${body};color:${paper}">
      Sky Eye Technology (SET) Pvt. Ltd. · Bhubaneswar, Odisha · <a href="https://www.skyeyetechnology.in" style="color:${paper}">skyeyetechnology.in</a>
    </td></tr>
  </table>
</td></tr></table>
</body></html>`
}

/** Emails a player their spin code, then records when it went out. */
export async function sendCode(player) {
  const link = `${PLAY_URL}?code=${player.code}`
  const name = esc(player.first_name)
  try {
    await mailer().sendMail({
      from: process.env.MAIL_FROM || `Sky Eye Technology <${process.env.SMTP_USER}>`,
      to: player.email,
      subject: `Your Sky Eye spin code: ${player.code} 🎡`,
      text: `Hi ${player.first_name},\n\nThanks for registering for the Sky Eye stall games at KIIT MUN!\n\nYour spin code: ${player.code}\n\nWhen the round starts, scan the QR code at the stall (or open ${link}), enter your code and spin. The first spinners of each round win Sky Eye goodies. Each code spins once, so be quick!\n\nSee you at the stall,\nTeam Sky Eye Technology`,
      html: emailHtml({ name, code: esc(player.code), link }),
    })
    await rest(`players?id=eq.${player.id}`, { method: 'PATCH', body: { code_sent_at: new Date().toISOString(), email_error: null } })
    return { ok: true }
  } catch (e) {
    const msg = String(e.message || e).slice(0, 200)
    await rest(`players?id=eq.${player.id}`, { method: 'PATCH', body: { email_error: msg } }).catch(() => {})
    return { ok: false, error: msg }
  }
}
