// POST /api/spin-register — called by the MUN stall form on the website (and
// the admin panel's "Add a player"). Creates or updates the player in
// Supabase and emails them their spin code. The code itself is never sent
// back to the browser: only the owner of the email gets it.
import { closeMailers, json, readBody, rpc, sendCode } from './_spin.js'

const EMAIL = /^[^@\s]+@[^@\s]+\.[^@\s]+$/

export default async function handler(req, res) {
  if (req.method !== 'POST') return json(res, 405, { error: 'POST only' })
  const b = readBody(req)
  const first = String(b.firstName || '').trim().slice(0, 60)
  const email = String(b.email || '').trim().toLowerCase().slice(0, 120)
  if (!first || !EMAIL.test(email)) return json(res, 400, { error: 'A first name and a valid email are needed.' })

  try {
    const player = await rpc('register_player', {
      p_first: first,
      p_last: String(b.lastName || '').trim().slice(0, 60),
      p_email: email,
      p_phone: String(b.phone || '').trim().slice(0, 20),
      p_college: String(b.college || '').trim().slice(0, 120),
      p_source: b.source === 'admin' ? 'admin' : 'website',
      p_zoho_lead_id: null,
    })

    // One email per address every 2 minutes (re-registering resends the same code)
    const recent = player.code_sent_at && Date.now() - new Date(player.code_sent_at).getTime() < 120000
    if (recent) return json(res, 200, { ok: true, emailed: true, already: true })

    const sent = await sendCode(player)
    closeMailers()
    return json(res, 200, { ok: true, emailed: sent.ok, emailError: sent.error })
  } catch (e) {
    return json(res, 500, { error: String(e.message || e) })
  }
}
