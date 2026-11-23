// POST /api/spin-senders — admin panel only. Manages the Gmail accounts the
// spin codes are sent from (table mail_senders). Passwords go in, but never
// come back out: `list` returns everything except app_password.
//   { action: 'list' }
//   { action: 'add', email, password, daily_limit }   checks the login first
//   { action: 'test', id }                            logs in + emails itself
//   { action: 'set', id, status?: 'active'|'off', daily_limit?, sort? }
//   { action: 'remove', id }
import nodemailer from 'nodemailer'
import { adminFrom, classify, closeMailers, fromFor, json, listSenders, mailerFor, markSender, readBody, remainingToday, rest, todayIST } from './_spin.js'

const EMAIL = /^[^@\s]+@[^@\s]+\.[^@\s]+$/

const publicRow = (r) => ({
  id: r.id,
  email: r.email,
  builtin: !r.app_password,
  daily_limit: r.daily_limit,
  sent_today: r.sent_date === todayIST() ? r.sent_count : 0,
  remaining: remainingToday(r),
  status: r.status,
  status_note: r.status_note,
  status_at: r.status_at,
  last_used_at: r.last_used_at,
  sort: r.sort,
})

export default async function handler(req, res) {
  if (req.method !== 'POST') return json(res, 405, { error: 'POST only' })
  try {
    if (!(await adminFrom(req))) return json(res, 401, { error: 'Admins only. Sign in again.' })
    const b = readBody(req)

    if (b.action === 'list') {
      const rows = await listSenders()
      return json(res, 200, { senders: rows.map(publicRow) })
    }

    if (b.action === 'add') {
      const email = String(b.email || '').trim().toLowerCase()
      const password = String(b.password || '').replace(/\s+/g, '') // Google shows app passwords in groups of 4
      const limit = Math.max(1, Math.min(2000, Number(b.daily_limit) || 450))
      if (!EMAIL.test(email) || !password) return json(res, 400, { error: 'Enter the Gmail address and its app password.' })
      // Check the login before saving
      const t = nodemailer.createTransport({ host: 'smtp.gmail.com', port: 465, secure: true, auth: { user: email, pass: password } })
      try {
        await t.verify()
      } catch (e) {
        return json(res, 400, { error: `Gmail refused this login: ${String(e.response || e.message).slice(0, 160)}` })
      } finally {
        t.close()
      }
      const existing = await rest(`mail_senders?select=id&email=ilike.${encodeURIComponent(email)}`)
      const body = { email, app_password: password, host: 'smtp.gmail.com', port: 465, daily_limit: limit, status: 'active', status_note: null, status_at: null }
      if (existing.length) await rest(`mail_senders?id=eq.${existing[0].id}`, { method: 'PATCH', body })
      else {
        const rows = await listSenders()
        await rest('mail_senders', { method: 'POST', body: { ...body, sort: rows.length + 1 } })
      }
      return json(res, 200, { ok: true })
    }

    const id = Number(b.id)
    const rows = await listSenders()
    const row = rows.find((r) => r.id === id)
    if (!row) return json(res, 404, { error: 'No such sender.' })

    if (b.action === 'test') {
      try {
        await mailerFor(row).sendMail({
          from: fromFor(row),
          to: row.email,
          subject: 'Sky Eye spin: sender test ✔',
          text: `This account (${row.email}) can send the spin-code emails. Sent ${new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })}.`,
        })
        await rest(`mail_senders?id=eq.${id}`, { method: 'PATCH', body: { status: row.status === 'off' ? 'off' : 'active', status_note: 'Test email sent OK', status_at: new Date().toISOString() } })
        closeMailers()
        return json(res, 200, { ok: true, message: `Test email sent from ${row.email} to itself.` })
      } catch (e) {
        const kind = classify(e)
        if (kind === 'auth_failed' || kind === 'limit_reached') await markSender(row, kind, e.response || e.message)
        return json(res, 200, { ok: false, message: `Failed: ${String(e.response || e.message).slice(0, 200)}` })
      }
    }

    if (b.action === 'set') {
      const body = {}
      if (b.status === 'active' || b.status === 'off') Object.assign(body, { status: b.status, status_note: null, status_at: new Date().toISOString() })
      if (b.daily_limit) body.daily_limit = Math.max(1, Math.min(2000, Number(b.daily_limit)))
      if (b.sort !== undefined) body.sort = Number(b.sort) || 0
      await rest(`mail_senders?id=eq.${id}`, { method: 'PATCH', body })
      return json(res, 200, { ok: true })
    }

    if (b.action === 'remove') {
      if (!row.app_password) return json(res, 400, { error: 'The built-in account comes from Vercel settings: turn it off instead.' })
      await rest(`mail_senders?id=eq.${id}`, { method: 'DELETE' })
      return json(res, 200, { ok: true })
    }

    return json(res, 400, { error: 'Unknown action.' })
  } catch (e) {
    return json(res, 500, { error: String(e.message || e) })
  }
}
