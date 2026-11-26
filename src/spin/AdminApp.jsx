import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import QRCode from 'qrcode'
import { supabase } from './supabase'
import Wheel from './Wheel'
import SkyParty, { DroneCanvas } from './SkyParty'
import { confetti } from '../components/events/confetti'
import { ik } from '../cdn'
import './spin.css'

// #/spin-admin — for the stall team. Sign in with a Supabase Auth account
// that's listed in the `admins` table. Tabs:
//   Live round  start/end rounds, the round's leaderboard, mark prizes collected
//   Big screen  full-screen wheel that spins live for every spin + leaderboard
//   Players     everyone registered, their codes, (re)send code emails
//   Prizes      what's on the wheel: odds, stock, on/off
//   Email senders  the Gmail accounts the codes go out from
//   Reels       the #skyeyetechnology reel challenge: approve entries, set views
const PLAY_URL = 'https://www.skyeyetechnology.in/#/spin'
const logo = ik('site/logo-mark-light.png', 'h-96')

const fmtTime = (t) => {
  if (!t) return '—'
  const d = new Date(t)
  return `${d.toLocaleTimeString('en-IN', { hour12: false })}.${String(d.getMilliseconds()).padStart(3, '0')}`
}
const fullName = (p) => [p?.first_name, p?.last_name].filter(Boolean).join(' ') || '—'

/* ─── Data ─────────────────────────────────────────────────────────────── */

function useSpinData(enabled) {
  const [prizes, setPrizes] = useState([])
  const [sessions, setSessions] = useState([])
  const [spins, setSpins] = useState([])
  const [players, setPlayers] = useState([])
  const [viewId, setViewId] = useState(null) // which round the leaderboard shows

  const loadPrizes = useCallback(async () => {
    const { data } = await supabase.from('prizes').select('*').order('sort').order('id')
    if (data) setPrizes(data)
  }, [])
  const loadSessions = useCallback(async () => {
    const { data } = await supabase.from('sessions').select('*').order('started_at', { ascending: false })
    if (data) setSessions(data)
  }, [])
  const loadPlayers = useCallback(async () => {
    const { data } = await supabase.from('players').select('*, spins(is_winner, prize_name)').order('created_at', { ascending: false })
    if (data) setPlayers(data)
  }, [])

  const open = sessions.find((s) => s.status === 'open') || null
  const shownId = viewId ?? open?.id ?? sessions[0]?.id ?? null

  const loadSpins = useCallback(async () => {
    if (!shownId) return setSpins([])
    const { data } = await supabase
      .from('spins')
      .select('*, players(first_name, last_name, email, phone, college, code)')
      .eq('session_id', shownId)
      .order('rank')
    if (data) setSpins(data)
  }, [shownId])

  useEffect(() => {
    if (!enabled) return undefined
    loadPrizes()
    loadSessions()
    loadPlayers()
    const ch = supabase
      .channel('admin-live')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'sessions' }, loadSessions)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'players' }, loadPlayers)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'spins' }, () => {
        loadSpins()
        loadPlayers() // spin status per player
        loadPrizes() // stock changes
      })
      .subscribe()
    return () => supabase.removeChannel(ch)
  }, [enabled, loadPrizes, loadSessions, loadPlayers, loadSpins])

  useEffect(() => {
    if (enabled) loadSpins()
  }, [enabled, loadSpins])

  return { prizes, sessions, spins, players, open, shownId, setViewId, loadPrizes, loadSessions, loadSpins, loadPlayers }
}

/* ─── Login ────────────────────────────────────────────────────────────── */

function Login() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const submit = async (e) => {
    e.preventDefault()
    setBusy(true)
    setError('')
    const { error: err } = await supabase.auth.signInWithPassword({ email: email.trim(), password })
    if (err) setError(err.message === 'Invalid login credentials' ? 'Wrong email or password.' : err.message)
    setBusy(false)
  }
  return (
    <section className="sw-card sw-login">
      <DroneCanvas fleet={[{ hover: true, x: 0.5, y: 0.52, size: 0.98 }]} className="sa-login-drone" />
      <span className="sw-kicker">Staff only</span>
      <h1 className="sw-title sw-title--sm">
        Spin <span className="sw-grad">control room</span>
      </h1>
      <form onSubmit={submit} className="sw-form">
        <label className="sw-field">
          <span>Email</span>
          <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} autoComplete="username" />
        </label>
        <label className="sw-field">
          <span>Password</span>
          <input type="password" required value={password} onChange={(e) => setPassword(e.target.value)} autoComplete="current-password" />
        </label>
        {error && (
          <p className="sw-error" role="alert">
            {error}
          </p>
        )}
        <button className="sw-btn" disabled={busy}>
          {busy ? 'Signing in…' : 'Sign in'}
        </button>
      </form>
    </section>
  )
}

/* ─── Live round ───────────────────────────────────────────────────────── */

function RoundPanel({ data }) {
  const { sessions, spins, open, shownId, setViewId } = data
  const [name, setName] = useState('')
  const [max, setMax] = useState(10)
  const [busy, setBusy] = useState(false)
  const [msg, setMsg] = useState('')
  const shown = sessions.find((s) => s.id === shownId)
  const winners = spins.filter((s) => s.is_winner)

  const start = async () => {
    if (open && !window.confirm(`End ${open.name} and start a new round?`)) return
    setBusy(true)
    setMsg('')
    const { error } = await supabase.rpc('start_round', { p_name: name, p_max_winners: Number(max) || 10 })
    if (error) setMsg(error.message)
    else {
      setName('')
      setViewId(null)
    }
    setBusy(false)
  }
  const end = async () => {
    if (!window.confirm(`End ${open.name}? Nobody can spin until you start a new round.`)) return
    setBusy(true)
    const { error } = await supabase.rpc('end_round')
    if (error) setMsg(error.message)
    setBusy(false)
  }
  const toggleCollected = async (s) => {
    await supabase
      .from('spins')
      .update({ collected: !s.collected, collected_at: s.collected ? null : new Date().toISOString() })
      .eq('id', s.id)
  }

  return (
    <div className="sa-grid">
      <section className="sa-card sa-control">
        <h2>
          {open ? (
            <>
              <span className="sw-dot" /> {open.name} is live
            </>
          ) : (
            'No round running'
          )}
        </h2>
        {open && (
          <p className="sa-muted">
            Started {fmtTime(open.started_at)} · {winners.length}/{open.max_winners} goodies won · {spins.length} spins
          </p>
        )}
        <div className="sa-row">
          <label className="sw-field">
            <span>New round name (optional)</span>
            <input value={name} onChange={(e) => setName(e.target.value)} placeholder={`Round ${sessions.length + 1}`} />
          </label>
          <label className="sw-field sa-narrow">
            <span>Max goodies</span>
            <input type="number" min="1" max="200" value={max} onChange={(e) => setMax(e.target.value)} />
          </label>
        </div>
        <div className="sa-row">
          <button className="sw-btn" onClick={start} disabled={busy}>
            {open ? 'Start a new round' : 'Start round'}
          </button>
          {open && (
            <button className="sw-btn sw-btn--ghost" onClick={end} disabled={busy}>
              End round
            </button>
          )}
        </div>
        {msg && <p className="sw-error">{msg}</p>}
      </section>

      <section className="sa-card sa-board">
        <div className="sa-board-head">
          <h2>Leaderboard</h2>
          <select value={shownId ?? ''} onChange={(e) => setViewId(Number(e.target.value) || null)}>
            {sessions.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name}
                {s.status === 'open' ? ' (live)' : ''}
              </option>
            ))}
          </select>
        </div>
        {!shown ? (
          <p className="sa-muted">Start a round to see spins here.</p>
        ) : !spins.length ? (
          <p className="sa-muted">No spins in {shown.name} yet.</p>
        ) : (
          <div className="sa-table-wrap">
            <table className="sa-table">
              <thead>
                <tr>
                  <th>#</th>
                  <th>Name</th>
                  <th>College</th>
                  <th>Landed on</th>
                  <th>Time</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {spins.map((s) => (
                  <tr key={s.id} className={s.is_winner ? 'is-win' : 'is-miss'}>
                    <td className="sa-rank">{s.rank}</td>
                    <td>
                      <strong>{fullName(s.players)}</strong>
                      <span className="sa-muted sa-small">{s.players?.code}</span>
                    </td>
                    <td>{s.players?.college || '—'}</td>
                    <td>{s.prize_name}</td>
                    <td className="sa-mono">{fmtTime(s.created_at)}</td>
                    <td>
                      {s.is_winner ? (
                        <button className={`sa-pill ${s.collected ? 'is-done' : ''}`} onClick={() => toggleCollected(s)}>
                          {s.collected ? '✓ Collected' : 'Winner · mark collected'}
                        </button>
                      ) : (
                        <span className="sa-pill is-off">Too late</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  )
}

/* ─── Big screen ───────────────────────────────────────────────────────── */

function BigScreen({ data, onExit }) {
  const { prizes, spins, open } = data
  const active = useMemo(() => prizes.filter((p) => p.active), [prizes])
  const [qr, setQr] = useState('')
  const [queue, setQueue] = useState([])
  const [current, setCurrent] = useState(null)
  const [shown, setShown] = useState(null)
  const [spinKey, setSpinKey] = useState(0)
  const seen = useRef(new Set())
  const box = useRef(null)

  useEffect(() => {
    QRCode.toDataURL(PLAY_URL, { margin: 1, width: 360, color: { dark: '#0b0f1a', light: '#ffffff' } }).then(setQr)
  }, [])

  // Every spin that arrives while the screen is open joins the queue
  useEffect(() => {
    if (!seen.current.size && spins.length) {
      spins.forEach((s) => seen.current.add(s.id)) // don't replay spins from before the screen opened
      return
    }
    const fresh = spins.filter((s) => !seen.current.has(s.id))
    if (!fresh.length) return
    fresh.forEach((s) => seen.current.add(s.id))
    setQueue((q) => [...q, ...fresh])
  }, [spins])

  // Play the queue one spin at a time
  useEffect(() => {
    if (current || !queue.length) return
    const [next, ...rest] = queue
    setQueue(rest)
    setCurrent(next)
    setShown(null)
    setSpinKey((k) => k + 1)
  }, [queue, current])

  const landed = () => {
    setShown(current)
    if (current?.is_winner) {
      const r = box.current?.getBoundingClientRect()
      confetti({ x: r ? (r.left + r.width / 2) / innerWidth : 0.35, y: 0.35, count: 220 })
    }
    setTimeout(() => setCurrent(null), queue.length ? 2200 : 4200)
  }

  const winners = spins.filter((s) => s.is_winner)

  return (
    <div className="bs">
      <SkyParty fleet="screen" />
      <button className="bs-exit" onClick={onExit} title="Back to admin">
        ✕
      </button>
      <div className="bs-left" ref={box}>
        <Wheel prizes={active} landOn={current?.prize_id} spinKey={spinKey} onDone={landed} duration={queue.length ? 3200 : 4800} className="bs-wheel" />
        <div className={`bs-shout ${shown ? 'is-on' : ''} ${shown?.is_winner ? 'is-win' : 'is-miss'}`} aria-live="polite">
          {shown && (
            <>
              <strong>{fullName(shown.players)}</strong>
              <span>{shown.is_winner ? `wins: ${shown.prize_name} 🎉` : 'better luck next time!'}</span>
            </>
          )}
        </div>
      </div>
      <aside className="bs-right">
        <div className="bs-head">
          <img src={logo} alt="" />
          <div>
            <span className="bs-kicker">SKY EYE · SPIN THE WHEEL</span>
            <h1>{open ? open.name : 'Next round soon'}</h1>
            {open && (
              <p>
                {winners.length}/{open.max_winners} goodies won
              </p>
            )}
          </div>
        </div>
        <ol className="bs-board">
          {winners.slice(0, open?.max_winners || 10).map((s) => (
            <li key={s.id}>
              <span className="bs-rank">{s.rank}</span>
              <span className="bs-name">{fullName(s.players)}</span>
              <span className="bs-prize">{s.prize_name}</span>
            </li>
          ))}
          {!winners.length && <li className="bs-empty">Be the first to spin!</li>}
        </ol>
        <div className="bs-qr">
          {qr && <img src={qr} alt="QR code to the spin page" />}
          <div>
            <strong>Scan to play</strong>
            <span>Enter the code from your email</span>
            <span className="bs-url">skyeyetechnology.in/#/spin</span>
          </div>
        </div>
      </aside>
    </div>
  )
}

/* ─── Players ──────────────────────────────────────────────────────────── */

function PlayersPanel({ data, mail }) {
  const { players } = data
  const [q, setQ] = useState('')
  const [busy, setBusy] = useState('')
  const [msg, setMsg] = useState('')
  const [add, setAdd] = useState({ first: '', last: '', email: '', phone: '', college: '' })

  const [filter, setFilter] = useState('all')
  const spun = (p) => (p.spins?.length || 0) > 0
  const FILTERS = [
    ['all', 'All', () => true],
    ['emailed', 'Emailed', (p) => !!p.code_sent_at],
    ['unsent', 'Not emailed', (p) => !p.code_sent_at],
    ['spun', 'Already spun', spun],
    ['waiting', 'Not spun yet', (p) => !spun(p)],
  ]
  const test = FILTERS.find((f) => f[0] === filter)?.[2] || (() => true)
  const list = players
    .filter(test)
    .filter((p) => !q || `${fullName(p)} ${p.email} ${p.phone} ${p.college} ${p.code}`.toLowerCase().includes(q.toLowerCase()))
  // Ticked players (by id). Ticks survive filtering and searching.
  const [picked, setPicked] = useState(() => new Set())
  const toggle = (id) =>
    setPicked((s) => {
      const n = new Set(s)
      n.has(id) ? n.delete(id) : n.add(id)
      return n
    })
  const allShownPicked = list.length > 0 && list.every((p) => picked.has(p.id))
  const toggleShown = () =>
    setPicked((s) => {
      const n = new Set(s)
      list.forEach((p) => (allShownPicked ? n.delete(p.id) : n.add(p.id)))
      return n
    })

  // Who each bulk send goes to
  const GROUPS = [
    ['everyone', 'Everyone', players],
    ['unsent', 'Not emailed', players.filter((p) => !p.code_sent_at)],
    ['notspun', 'Not spun yet', players.filter((p) => !spun(p))],
    ['picked', 'Selected', players.filter((p) => picked.has(p.id))],
    ['except', 'All except selected', players.filter((p) => !picked.has(p.id))],
  ]

  // Emails these players their codes, 15 per request so a big send never
  // times out; shows progress as it goes.
  const send = async (targets, label, confirmText) => {
    if (!targets.length) return
    if (confirmText && !window.confirm(confirmText)) return
    setBusy(label)
    setMsg(`Sending 0/${targets.length}…`)
    const { data: s } = await supabase.auth.getSession()
    let sent = 0
    let failed = 0
    const errors = []
    try {
      for (let i = 0; i < targets.length; i += 15) {
        const ids = targets.slice(i, i + 15).map((p) => p.id)
        const res = await fetch('/api/spin-send', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${s.session?.access_token}` },
          body: JSON.stringify({ playerIds: ids }),
        })
        const out = await res.json().catch(() => ({}))
        if (!res.ok) throw new Error(out.error || `Failed (${res.status})`)
        sent += out.sent || 0
        failed += out.failed || 0
        errors.push(...(out.errors || []))
        setMsg(`Sending ${Math.min(i + 15, targets.length)}/${targets.length}…`)
      }
      mail?.load()
      setMsg(`Sent ${sent} email(s)${failed ? `, ${failed} failed (${errors.slice(0, 2).join('; ')})` : ''}.`)
    } catch (e) {
      setMsg(`Stopped after ${sent} sent: ${e.message || 'couldn’t reach the email service'}.`)
    }
    setBusy('')
  }

  const addPlayer = async (e) => {
    e.preventDefault()
    setBusy('add')
    setMsg('')
    try {
      const res = await fetch('/api/spin-register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ firstName: add.first, lastName: add.last, email: add.email, phone: add.phone, college: add.college, source: 'admin' }),
      })
      const out = await res.json().catch(() => ({}))
      if (res.ok) {
        setMsg(out.emailed ? `Added ${add.first}; code emailed.` : `Added ${add.first}. Email not sent: ${out.emailError || 'unknown'}`)
        setAdd({ first: '', last: '', email: '', phone: '', college: '' })
      } else setMsg(out.error || `Failed (${res.status}).`)
    } catch {
      setMsg('Couldn’t reach the registration service.')
    }
    setBusy('')
  }

  return (
    <div className="sa-grid sa-grid--stack">
      <section className="sa-card">
        <h2>Add a player at the stall</h2>
        <form className="sa-row sa-wrap" onSubmit={addPlayer}>
          <label className="sw-field">
            <span>First name *</span>
            <input required value={add.first} onChange={(e) => setAdd({ ...add, first: e.target.value })} />
          </label>
          <label className="sw-field">
            <span>Last name</span>
            <input value={add.last} onChange={(e) => setAdd({ ...add, last: e.target.value })} />
          </label>
          <label className="sw-field">
            <span>Email *</span>
            <input required type="email" value={add.email} onChange={(e) => setAdd({ ...add, email: e.target.value })} />
          </label>
          <label className="sw-field">
            <span>Phone</span>
            <input value={add.phone} onChange={(e) => setAdd({ ...add, phone: e.target.value })} />
          </label>
          <label className="sw-field">
            <span>College</span>
            <input value={add.college} onChange={(e) => setAdd({ ...add, college: e.target.value })} />
          </label>
          <button className="sw-btn" disabled={busy === 'add'}>
            {busy === 'add' ? 'Adding…' : 'Add + email code'}
          </button>
        </form>
      </section>

      <section className="sa-card sa-board">
        <div className="sa-board-head">
          <h2>Players ({players.length})</h2>
          <input className="sa-search" value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search name, email, code…" />
        </div>
        <div className="sa-send" role="group" aria-label="Email codes">
          <span className="sa-send-label">Email codes to:</span>
          {mail?.remaining != null && (
            <span className={`sa-capacity ${mail.remaining === 0 ? 'is-bad' : ''}`}>
              {mail.remaining === 0 ? 'No email account can send: see Email senders' : `≈${mail.remaining} left today`}
            </span>
          )}
          {GROUPS.map(([k, label, targets]) => (
            <button
              key={k}
              className="sa-pill"
              disabled={!targets.length || !!busy}
              onClick={() => send(targets, k, `Email spin codes to ${targets.length} player${targets.length === 1 ? '' : 's'} (${label.toLowerCase()})?`)}
            >
              {busy === k ? 'Sending…' : `${label} (${targets.length})`}
            </button>
          ))}
          {picked.size > 0 && (
            <button className="sa-link" onClick={() => setPicked(new Set())}>
              Clear selection
            </button>
          )}
        </div>
        <div className="sa-filters" role="group" aria-label="Filter players">
          {FILTERS.map(([k, label, fn]) => (
            <button key={k} className={filter === k ? 'is-on' : ''} onClick={() => setFilter(k)}>
              {label} <span>{players.filter(fn).length}</span>
            </button>
          ))}
        </div>
        {msg && <p className="sa-note">{msg}</p>}
        <div className="sa-table-wrap">
          <table className="sa-table">
            <thead>
              <tr>
                <th className="sa-check">
                  <input type="checkbox" checked={allShownPicked} onChange={toggleShown} aria-label="Select all shown" title="Select all shown" />
                </th>
                <th>Name</th>
                <th>Email / phone</th>
                <th>College</th>
                <th>Code</th>
                <th>Emailed</th>
                <th>Spin</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {list.map((p) => (
                <tr key={p.id} className={picked.has(p.id) ? 'is-picked' : ''}>
                  <td className="sa-check">
                    <input type="checkbox" checked={picked.has(p.id)} onChange={() => toggle(p.id)} aria-label={`Select ${fullName(p)}`} />
                  </td>
                  <td>
                    <strong>{fullName(p)}</strong>
                    <span className="sa-muted sa-small">{p.source}</span>
                  </td>
                  <td>
                    {p.email}
                    <span className="sa-muted sa-small">{p.phone || ''}</span>
                  </td>
                  <td>{p.college || '—'}</td>
                  <td className="sa-mono sa-code">{p.code}</td>
                  <td className="sa-small">{p.code_sent_at ? fmtTime(p.code_sent_at) : p.email_error ? <span className="sw-error">{p.email_error}</span> : 'Not yet'}</td>
                  <td className="sa-small">
                    {spun(p) ? (
                      <span className={`sa-pill ${p.spins[0].is_winner ? 'is-done' : 'is-off'}`}>
                        {p.spins[0].is_winner ? `Won · ${p.spins[0].prize_name}` : `Spun · ${p.spins[0].prize_name}`}
                      </span>
                    ) : (
                      'Not yet'
                    )}
                  </td>
                  <td>
                    <button className="sa-pill" disabled={!!busy} onClick={() => send([p], p.id)}>
                      {busy === p.id ? 'Sending…' : p.code_sent_at ? 'Resend' : 'Send code'}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  )
}

/* ─── Email senders ────────────────────────────────────────────────────── */

// Calls an admin-only API route with the signed-in user's token
async function adminApi(path, body) {
  const { data: s } = await supabase.auth.getSession()
  const res = await fetch(path, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${s.session?.access_token}` },
    body: JSON.stringify(body),
  })
  const out = await res.json().catch(() => ({}))
  if (!res.ok) throw new Error(out.error || `Failed (${res.status})`)
  return out
}

function useSenders(enabled) {
  const [senders, setSenders] = useState(null)
  const [error, setError] = useState('')
  const load = useCallback(async () => {
    try {
      const out = await adminApi('/api/spin-senders', { action: 'list' })
      setSenders(out.senders)
      setError('')
    } catch (e) {
      setError(e.message)
    }
  }, [])
  useEffect(() => {
    if (!enabled) return undefined
    load()
    const t = setInterval(load, 60000)
    return () => clearInterval(t)
  }, [enabled, load])
  const remaining = senders ? senders.reduce((n, s) => n + (s.remaining || 0), 0) : null
  return { senders, error, load, remaining }
}

const SENDER_STATUS = {
  active: ['Active', 'is-done'],
  limit_reached: ['Limit reached today', 'is-warn'],
  auth_failed: ['Login failed: needs a new app password', 'is-bad'],
  off: ['Off', 'is-off'],
}

function SendersPanel({ mail }) {
  const { senders, error, load, remaining } = mail
  const [add, setAdd] = useState({ email: '', password: '', limit: 450 })
  const [busy, setBusy] = useState('')
  const [msg, setMsg] = useState('')

  const act = async (label, body, done) => {
    setBusy(label)
    setMsg('')
    try {
      const out = await adminApi('/api/spin-senders', body)
      setMsg(out.message || done || 'Done.')
    } catch (e) {
      setMsg(e.message)
    }
    await load()
    setBusy('')
  }

  const submit = (e) => {
    e.preventDefault()
    act('add', { action: 'add', email: add.email, password: add.password, daily_limit: add.limit }, `Added ${add.email}. It will be used when the accounts above it run out.`).then(() =>
      setAdd({ email: '', password: '', limit: 450 }),
    )
  }

  return (
    <div className="sa-grid sa-grid--stack">
      <section className="sa-card">
        <h2>Email senders</h2>
        <p className="sa-muted">
          Each Gmail account can send about 500 emails a day. Codes go out from the first account below that still has room; when
          one hits Gmail’s limit or its login stops working, it’s marked here and the next account takes over automatically.
        </p>
        {remaining !== null && (
          <p className={`sa-note ${remaining === 0 ? 'is-bad' : remaining < 50 ? 'is-warn' : ''}`}>
            {remaining === 0
              ? 'No account can send right now. Add another Gmail account below.'
              : `Can still send about ${remaining} email${remaining === 1 ? '' : 's'} today across ${senders.filter((s) => s.remaining > 0).length} account(s).`}
          </p>
        )}
        {error && <p className="sw-error">{error}</p>}
        {msg && <p className="sa-note">{msg}</p>}
        <div className="sa-table-wrap">
          <table className="sa-table">
            <thead>
              <tr>
                <th>Account</th>
                <th>Sent today</th>
                <th>Status</th>
                <th>Last used</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {(senders || []).map((s) => {
                const [label, cls] = SENDER_STATUS[s.status] || [s.status, '']
                const pct = Math.min(100, Math.round((s.sent_today / s.daily_limit) * 100))
                return (
                  <tr key={s.id ?? s.email}>
                    <td>
                      <strong>{s.email}</strong>
                      <span className="sa-muted sa-small">{s.builtin ? 'Built-in (Vercel settings)' : 'Added here'}</span>
                    </td>
                    <td>
                      <span className="sa-mono">
                        {s.sent_today} / {s.daily_limit}
                      </span>
                      <span className="sa-meter">
                        <span style={{ width: `${pct}%` }} />
                      </span>
                    </td>
                    <td>
                      <span className={`sa-pill ${cls}`}>{label}</span>
                      {s.status_note && <span className="sa-muted sa-small sa-note-line">{s.status_note}</span>}
                    </td>
                    <td className="sa-small">{s.last_used_at ? fmtTime(s.last_used_at) : '—'}</td>
                    <td className="sa-actions">
                      {s.id && (
                        <>
                          <button className="sa-pill" disabled={!!busy} onClick={() => act(`t${s.id}`, { action: 'test', id: s.id })}>
                            {busy === `t${s.id}` ? 'Testing…' : 'Test'}
                          </button>
                          <button
                            className="sa-pill"
                            disabled={!!busy}
                            onClick={() => act(`o${s.id}`, { action: 'set', id: s.id, status: s.status === 'off' ? 'active' : 'off' })}
                          >
                            {s.status === 'off' ? 'Turn on' : s.status === 'active' ? 'Turn off' : 'Reset'}
                          </button>
                          {!s.builtin && (
                            <button
                              className="sa-pill"
                              disabled={!!busy}
                              onClick={() => window.confirm(`Remove ${s.email}?`) && act(`r${s.id}`, { action: 'remove', id: s.id }, `Removed ${s.email}.`)}
                            >
                              Remove
                            </button>
                          )}
                        </>
                      )}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </section>

      <section className="sa-card">
        <h2>Add a Gmail account</h2>
        <p className="sa-muted">
          On that Google account: turn on 2-Step Verification, then create an app password at myaccount.google.com → Security →
          App passwords. Paste it here; the login is checked before it’s saved. Adding an address that’s already listed updates its
          password (use this when one shows “Login failed”).
        </p>
        <form className="sa-row sa-wrap" onSubmit={submit}>
          <label className="sw-field">
            <span>Gmail address</span>
            <input type="email" required value={add.email} onChange={(e) => setAdd({ ...add, email: e.target.value })} autoComplete="off" />
          </label>
          <label className="sw-field">
            <span>App password</span>
            <input type="password" required value={add.password} onChange={(e) => setAdd({ ...add, password: e.target.value })} autoComplete="new-password" placeholder="16 letters" />
          </label>
          <label className="sw-field sa-narrow">
            <span>Daily limit</span>
            <input type="number" min="1" max="2000" value={add.limit} onChange={(e) => setAdd({ ...add, limit: e.target.value })} />
          </label>
          <button className="sw-btn" disabled={busy === 'add'}>
            {busy === 'add' ? 'Checking login…' : 'Add account'}
          </button>
        </form>
      </section>
    </div>
  )
}

/* ─── Prizes ───────────────────────────────────────────────────────────── */

function PrizesPanel({ data }) {
  const { prizes, loadPrizes } = data
  const [rows, setRows] = useState(prizes)
  const [msg, setMsg] = useState('')
  useEffect(() => setRows(prizes), [prizes])
  const total = rows.filter((r) => r.active).reduce((n, r) => n + (Number(r.weight) || 0), 0)
  const edit = (id, k, v) => setRows((rs) => rs.map((r) => (r.id === id ? { ...r, [k]: v } : r)))

  const save = async (r) => {
    setMsg('')
    const { error } = await supabase
      .from('prizes')
      .update({ name: r.name, icon: r.icon, color: r.color, weight: Number(r.weight) || 0, stock: r.stock === '' || r.stock === null ? null : Number(r.stock), active: r.active, sort: Number(r.sort) || 0 })
      .eq('id', r.id)
    setMsg(error ? error.message : `Saved ${r.name}.`)
    loadPrizes()
  }
  const addPrize = async () => {
    const { error } = await supabase.from('prizes').insert({ name: 'New prize', icon: 'redeem', color: '#5ef2ff', weight: 10, sort: rows.length + 1 })
    setMsg(error ? error.message : 'Added a prize: edit it below and save.')
    loadPrizes()
  }

  return (
    <section className="sa-card sa-board">
      <div className="sa-board-head">
        <h2>Prizes on the wheel</h2>
        <button className="sw-btn sw-btn--ghost" onClick={addPrize}>
          + Add prize
        </button>
      </div>
      <p className="sa-muted">
        Every spin is a weighted draw: a prize with weight 30 comes up three times as often as one with 10, and “Chance” shows the
        odds per spin (“1 in N”). The “Better luck next time” row is the blank slice, so keep it the biggest. Stock goes down each time
        a prize is won and a prize at 0 is skipped; leave stock empty for unlimited. Once a round has given out its “max goodies”,
        every spin in it lands on Better luck next time.
      </p>
      {msg && <p className="sa-note">{msg}</p>}
      <div className="sa-table-wrap">
        <table className="sa-table sa-prizes">
          <thead>
            <tr>
              <th>On</th>
              <th>Name</th>
              <th>Icon</th>
              <th>Colour</th>
              <th>Weight</th>
              <th>Chance</th>
              <th>Stock</th>
              <th>Order</th>
              <th />
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.id} className={r.active ? '' : 'is-miss'}>
                <td>
                  <input type="checkbox" checked={r.active} onChange={(e) => edit(r.id, 'active', e.target.checked)} />
                </td>
                <td>
                  <input value={r.name} onChange={(e) => edit(r.id, 'name', e.target.value)} />
                </td>
                <td>
                  <span className="material-symbols-outlined sa-icon">{r.icon}</span>
                  <input className="sa-w8" value={r.icon || ''} onChange={(e) => edit(r.id, 'icon', e.target.value)} />
                </td>
                <td>
                  <input type="color" value={r.color} onChange={(e) => edit(r.id, 'color', e.target.value)} />
                </td>
                <td>
                  <input className="sa-w5" type="number" min="0" value={r.weight} onChange={(e) => edit(r.id, 'weight', e.target.value)} />
                </td>
                <td className="sa-mono">
                  {r.active && total && Number(r.weight) > 0
                    ? `${(((Number(r.weight) || 0) / total) * 100).toFixed(1)}% · 1 in ${Math.max(1, Math.round(total / Number(r.weight)))}`
                    : '—'}
                </td>
                <td>
                  <input className="sa-w5" type="number" min="0" value={r.stock ?? ''} placeholder="∞" onChange={(e) => edit(r.id, 'stock', e.target.value)} />
                </td>
                <td>
                  <input className="sa-w4" type="number" value={r.sort} onChange={(e) => edit(r.id, 'sort', e.target.value)} />
                </td>
                <td>
                  <button className="sa-pill" onClick={() => save(r)}>
                    Save
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  )
}

/* ─── Reels (#skyeyetechnology challenge) ───────────────────────────────── */

const REEL_CODE = /instagram\.com\/(?:[A-Za-z0-9_.]+\/)?(?:reel|reels|p|tv)\/([A-Za-z0-9_-]+)/
const REEL_FILTERS = [
  ['pending', 'Waiting for review'],
  ['approved', 'On the board'],
  ['rejected', 'Rejected'],
  ['all', 'All'],
]

function ReelsPanel() {
  const [rows, setRows] = useState(null)
  const [views, setViews] = useState({})
  const [filter, setFilter] = useState('pending')
  const [msg, setMsg] = useState('')
  const [add, setAdd] = useState({ handle: '', url: '', views: '' })

  const load = useCallback(async () => {
    const { data, error } = await supabase.from('reel_entries').select('*').order('views', { ascending: false }).order('id')
    if (error) setMsg(error.message.includes('reel_entries') ? 'Run supabase/reels.sql in Supabase first.' : error.message)
    setRows(data || [])
  }, [])
  useEffect(() => {
    load()
    const ch = supabase
      .channel('reels-admin')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'reel_entries' }, load)
      .subscribe()
    return () => supabase.removeChannel(ch)
  }, [load])

  const update = async (r, body, done) => {
    setMsg('')
    const { error } = await supabase.from('reel_entries').update(body).eq('id', r.id)
    setMsg(error ? error.message : done)
    load()
  }
  const saveViews = (r) => {
    const v = Number(String(views[r.id] ?? r.views).replace(/[^\d]/g, ''))
    update(r, { views: v, views_at: new Date().toISOString() }, `@${r.handle}: ${v.toLocaleString('en-IN')} views saved.`)
    setViews((all) => {
      const next = { ...all }
      delete next[r.id]
      return next
    })
  }
  const remove = async (r) => {
    if (!window.confirm(`Delete the reel entry from @${r.handle}?`)) return
    const { error } = await supabase.from('reel_entries').delete().eq('id', r.id)
    setMsg(error ? error.message : `Deleted the entry from @${r.handle}.`)
    load()
  }
  const addReel = async (e) => {
    e.preventDefault()
    const code = add.url.match(REEL_CODE)?.[1]
    const handle = add.handle.trim().replace(/^@+/, '').toLowerCase()
    if (!code) return setMsg('That isn’t an Instagram reel link.')
    const { error } = await supabase.from('reel_entries').insert({
      handle,
      reel_url: `https://www.instagram.com/reel/${code}/`,
      shortcode: code,
      views: Number(add.views) || 0,
      views_at: add.views ? new Date().toISOString() : null,
      status: 'approved',
    })
    setMsg(error ? (error.code === '23505' ? 'That reel is already in the list.' : error.message) : `Added @${handle} to the board.`)
    if (!error) setAdd({ handle: '', url: '', views: '' })
    load()
  }

  const list = rows || []
  const count = (k) => (k === 'all' ? list.length : list.filter((r) => r.status === k).length)
  const shown = filter === 'all' ? list : list.filter((r) => r.status === filter)
  const approved = list.filter((r) => r.status === 'approved')
  const rankOf = (r) => (r.status === 'approved' ? approved.filter((a) => a.views > r.views).length + 1 : null)

  return (
    <div className="sa-grid sa-grid--stack">
      <section className="sa-card sa-board">
        <div className="sa-board-head">
          <h2>#skyeyetechnology reels</h2>
          <a className="sa-pill" href="https://www.instagram.com/explore/tags/skyeyetechnology/" target="_blank" rel="noreferrer noopener">
            See the hashtag on Instagram ↗
          </a>
        </div>
        <p className="sa-muted">
          Reels people submit on the Events page land in “Waiting for review”. Open each one, check it’s public and uses
          #skyeyetechnology, then approve it. Type in the view count Instagram shows and press Save: the board on the website
          updates within a minute. Instagram doesn’t let other apps read reel views, so they’re updated by hand here.
        </p>
        {msg && <p className="sa-note">{msg}</p>}
        <div className="sa-send">
          {REEL_FILTERS.map(([k, label]) => (
            <button key={k} className={`sa-pill ${filter === k ? 'is-done' : ''}`} onClick={() => setFilter(k)}>
              {label} · {count(k)}
            </button>
          ))}
        </div>
        <div className="sa-table-wrap">
          <table className="sa-table">
            <thead>
              <tr>
                <th>#</th>
                <th>Account</th>
                <th>Reel</th>
                <th>Views</th>
                <th>Status</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {shown.map((r) => (
                <tr key={r.id} className={r.status === 'rejected' ? 'is-miss' : ''}>
                  <td className="sa-rank">{rankOf(r) ?? '—'}</td>
                  <td>
                    <a href={`https://www.instagram.com/${r.handle}/`} target="_blank" rel="noreferrer noopener">
                      <strong>@{r.handle}</strong>
                    </a>
                    <span className="sa-muted sa-small">{r.email || 'added by the team'}</span>
                  </td>
                  <td>
                    <a className="sa-pill" href={r.reel_url} target="_blank" rel="noreferrer noopener">
                      Open reel ↗
                    </a>
                  </td>
                  <td>
                    <form
                      className="sa-views"
                      onSubmit={(e) => {
                        e.preventDefault()
                        saveViews(r)
                      }}
                    >
                      <input
                        inputMode="numeric"
                        value={views[r.id] ?? r.views}
                        onChange={(e) => setViews((v) => ({ ...v, [r.id]: e.target.value }))}
                        aria-label={`Views for @${r.handle}`}
                      />
                      <button className="sa-pill" disabled={views[r.id] === undefined}>
                        Save
                      </button>
                    </form>
                    <span className="sa-muted sa-small">
                      {r.views_at ? `updated ${new Date(r.views_at).toLocaleString('en-IN', { dateStyle: 'short', timeStyle: 'short' })}` : 'not updated yet'}
                    </span>
                  </td>
                  <td>
                    <span className={`sa-pill ${r.status === 'approved' ? 'is-done' : r.status === 'rejected' ? 'is-bad' : 'is-warn'}`}>
                      {r.status === 'approved' ? 'On the board' : r.status === 'rejected' ? 'Rejected' : 'Waiting'}
                    </span>
                  </td>
                  <td className="sa-actions">
                    {r.status !== 'approved' && (
                      <button className="sa-pill" onClick={() => update(r, { status: 'approved' }, `@${r.handle} is on the board.`)}>
                        Approve
                      </button>
                    )}
                    {r.status !== 'rejected' && (
                      <button className="sa-pill" onClick={() => update(r, { status: 'rejected' }, `@${r.handle} rejected.`)}>
                        Reject
                      </button>
                    )}
                    <button className="sa-pill" onClick={() => remove(r)}>
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
              {rows && !shown.length && (
                <tr>
                  <td colSpan={6} className="sa-muted">
                    Nothing here.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>

      <section className="sa-card">
        <h2>Add a reel yourself</h2>
        <p className="sa-muted">For reels you found on the hashtag that weren’t submitted. They go straight onto the board.</p>
        <form className="sa-row sa-wrap" onSubmit={addReel}>
          <label className="sw-field">
            <span>Instagram username</span>
            <input required value={add.handle} onChange={(e) => setAdd({ ...add, handle: e.target.value })} placeholder="@handle" />
          </label>
          <label className="sw-field">
            <span>Reel link</span>
            <input required value={add.url} onChange={(e) => setAdd({ ...add, url: e.target.value })} placeholder="https://www.instagram.com/reel/…" />
          </label>
          <label className="sw-field sa-narrow">
            <span>Views</span>
            <input inputMode="numeric" value={add.views} onChange={(e) => setAdd({ ...add, views: e.target.value.replace(/[^\d]/g, '') })} />
          </label>
          <button className="sw-btn">Add to board</button>
        </form>
      </section>
    </div>
  )
}

/* ─── Shell ────────────────────────────────────────────────────────────── */

const TABS = [
  ['round', 'Live round', 'bolt'],
  ['screen', 'Big screen', 'tv'],
  ['players', 'Players', 'group'],
  ['prizes', 'Prizes', 'redeem'],
  ['senders', 'Email senders', 'mail'],
  ['reels', 'Reels', 'movie'],
]

export default function AdminApp() {
  const [session, setSession] = useState(undefined)
  const [isAdmin, setIsAdmin] = useState(null)
  const [tab, setTab] = useState('round')

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => setSession(data.session))
    const { data } = supabase.auth.onAuthStateChange((_e, s) => setSession(s))
    return () => data.subscription.unsubscribe()
  }, [])

  useEffect(() => {
    if (!session) return setIsAdmin(null)
    supabase
      .from('admins')
      .select('user_id')
      .eq('user_id', session.user.id)
      .maybeSingle()
      .then(({ data }) => setIsAdmin(!!data))
  }, [session])

  const data = useSpinData(!!session && isAdmin === true)
  const mail = useSenders(!!session && isAdmin === true)

  if (tab === 'screen' && isAdmin) {
    return <BigScreen data={data} onExit={() => setTab('round')} />
  }

  return (
    <div className="sw-app sa-app">
      <SkyParty fleet="admin" quiet />
      <header className="sw-top">
        <span className="sw-brand">
          <img src={logo} alt="" />
          <span>
            SKY EYE <em>SPIN</em> · admin
          </span>
        </span>
        {session && (
          <button className="sw-chip sw-chip--btn" onClick={() => supabase.auth.signOut()}>
            Sign out
          </button>
        )}
      </header>
      <main className="sw-main sa-main">
        {session === undefined ? null : !session ? (
          <Login />
        ) : isAdmin === false ? (
          <section className="sw-card">
            <h1 className="sw-title sw-title--sm">Not an admin account</h1>
            <p className="sw-sub">{session.user.email} isn’t on the admin list. Ask the Sky Eye team to add it.</p>
          </section>
        ) : isAdmin ? (
          <>
            <nav className="sa-tabs">
              {TABS.map(([k, label, icon]) => (
                <button key={k} className={tab === k ? 'is-on' : ''} onClick={() => setTab(k)}>
                  <span className="material-symbols-outlined">{icon}</span>
                  {label}
                </button>
              ))}
            </nav>
            {tab === 'round' && <RoundPanel data={data} />}
            {tab === 'players' && <PlayersPanel data={data} mail={mail} />}
            {tab === 'senders' && <SendersPanel mail={mail} />}
            {tab === 'prizes' && <PrizesPanel data={data} />}
            {tab === 'reels' && <ReelsPanel />}
          </>
        ) : null}
      </main>
    </div>
  )
}
