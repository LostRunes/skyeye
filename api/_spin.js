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
      html: `<div style="background:#0b0f1a;padding:32px 16px;font-family:Arial,Helvetica,sans-serif">
  <div style="max-width:480px;margin:0 auto;background:#121a2b;border-radius:20px;padding:32px 24px;text-align:center;color:#e8eef6">
    <div style="font-size:13px;letter-spacing:3px;color:#5ef2ff;font-weight:bold">SKY EYE · SPIN THE WHEEL</div>
    <h1 style="margin:16px 0 8px;font-size:24px;color:#ffffff">Hi ${name}, you're in! 🎡</h1>
    <p style="margin:0 0 24px;color:#a9b4bf;font-size:15px;line-height:1.5">Thanks for registering for the Sky Eye stall games at KIIT MUN. Here's your spin code:</p>
    <div style="display:inline-block;background:#ffffff;color:#0b0f1a;font-size:34px;font-weight:bold;letter-spacing:8px;padding:14px 22px 14px 30px;border-radius:14px;font-family:'Courier New',monospace">${esc(player.code)}</div>
    <p style="margin:24px 0;color:#a9b4bf;font-size:15px;line-height:1.5">When a round starts, scan the QR code at the stall, enter your code and spin. <b style="color:#ffd166">The first spinners of each round win Sky Eye goodies.</b> Each code spins once, so be quick!</p>
    <a href="${link}" style="display:inline-block;background:#5ef2ff;color:#0b0f1a;text-decoration:none;font-weight:bold;padding:14px 28px;border-radius:999px;font-size:16px">Open the wheel →</a>
    <p style="margin:28px 0 0;color:#6b778a;font-size:12px">Sky Eye Technology (SET) Pvt. Ltd. · Bhubaneswar · skyeyetechnology.in</p>
  </div>
</div>`,
    })
    await rest(`players?id=eq.${player.id}`, { method: 'PATCH', body: { code_sent_at: new Date().toISOString(), email_error: null } })
    return { ok: true }
  } catch (e) {
    const msg = String(e.message || e).slice(0, 200)
    await rest(`players?id=eq.${player.id}`, { method: 'PATCH', body: { email_error: msg } }).catch(() => {})
    return { ok: false, error: msg }
  }
}
