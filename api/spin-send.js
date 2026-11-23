// POST /api/spin-send — admin panel only. Emails spin codes:
//   { playerIds: [uuid, …] }  to these players (resend), or
//   { unsent: true }          to everyone who hasn't been emailed yet.
// The caller must be signed in as an admin (Authorization: Bearer <token>).
import { adminFrom, closeMailers, json, listSenders, readBody, rest, sendCode } from './_spin.js'

// Room for a batch of emails (the admin panel sends 15 per request)
export const config = { maxDuration: 60 }

export default async function handler(req, res) {
  if (req.method !== 'POST') return json(res, 405, { error: 'POST only' })
  try {
    if (!(await adminFrom(req))) return json(res, 401, { error: 'Admins only. Sign in again.' })
    const b = readBody(req)
    const cols = 'select=id,first_name,email,code,code_sent_at'
    let players = []
    if (Array.isArray(b.playerIds) && b.playerIds.length) {
      const ids = b.playerIds.slice(0, 200).map((id) => String(id).replace(/[^0-9a-f-]/gi, '')).join(',')
      players = await rest(`players?${cols}&id=in.(${ids})`)
    } else if (b.unsent) {
      players = await rest(`players?${cols}&code_sent_at=is.null&limit=200`)
    }

    let sent = 0
    let failed = 0
    const errors = []
    const senders = await listSenders() // shared, so the batch spreads across accounts
    for (const p of players) {
      const r = await sendCode(p, senders)
      if (r.ok) sent++
      else {
        failed++
        errors.push(`${p.email}: ${r.error}`)
      }
    }
    closeMailers()
    return json(res, 200, { ok: true, sent, failed, errors: errors.slice(0, 5) })
  } catch (e) {
    return json(res, 500, { error: String(e.message || e) })
  }
}
