import { useCallback, useEffect, useState } from 'react'
import './reels.css'

// The #skyeyetechnology reel challenge: approved reels ranked by views
// (Supabase view `reel_leaderboard`, see supabase/reels.sql), plus the form to
// submit a reel. Plain REST calls with the public key, so the main site
// doesn't load the whole Supabase client. Views are entered by the team in
// the admin panel's "Reels" tab.
const URL = 'https://jbzdkzajjgdhzokdscyz.supabase.co/rest/v1'
const KEY = 'sb_publishable_2TxN0jNSeUObU3Ou2I6tZw__OFka3NT'
const headers = { apikey: KEY, Authorization: `Bearer ${KEY}`, 'Content-Type': 'application/json' }

const REASONS = {
  handle: 'Enter your Instagram username (letters, numbers, . and _ only).',
  url: 'That doesn’t look like an Instagram reel link. Open the reel → Share → Copy link, and paste it here.',
  email: 'Check your email address.',
  exists: 'This reel is already entered. It’ll show on the board once the team approves it.',
  too_many: 'That account has already entered 5 reels.',
}

const compact = new Intl.NumberFormat('en', { notation: 'compact', maximumFractionDigits: 1 })
const full = new Intl.NumberFormat('en-IN')
const ago = (t) => {
  if (!t) return ''
  const m = Math.round((Date.now() - new Date(t).getTime()) / 60000)
  if (m < 1) return 'just now'
  if (m < 60) return `${m} min ago`
  const h = Math.round(m / 60)
  if (h < 24) return `${h} hr${h === 1 ? '' : 's'} ago`
  return new Date(t).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })
}

function useLeaderboard() {
  const [rows, setRows] = useState(null)
  const load = useCallback(async () => {
    try {
      const res = await fetch(`${URL}/reel_leaderboard?select=*&order=views.desc,id.asc&limit=50`, { headers })
      setRows(res.ok ? await res.json() : [])
    } catch {
      setRows((r) => r || [])
    }
  }, [])
  useEffect(() => {
    load()
    const t = setInterval(load, 60000)
    return () => clearInterval(t)
  }, [load])
  return rows
}

const MEDALS = ['gold', 'silver', 'bronze']

function Podium({ rows }) {
  // 2nd, 1st, 3rd so the winner stands in the middle
  const order = [rows[1], rows[0], rows[2]]
  return (
    <ol className="rl-podium">
      {order.map((r, i) =>
        r ? (
          <li key={r.id} className={`rl-step rl-step--${MEDALS[r.rank - 1] || 'bronze'}`} style={{ order: i }}>
            <span className="rl-medal" aria-label={`Rank ${r.rank}`}>
              {r.rank}
            </span>
            <a className="rl-handle" href={r.reel_url} target="_blank" rel="noreferrer noopener">
              @{r.handle}
            </a>
            <strong className="rl-views" title={`${full.format(r.views)} views`}>
              {compact.format(r.views)}
              <small>views</small>
            </strong>
            <a className="rl-watch" href={r.reel_url} target="_blank" rel="noreferrer noopener">
              <span className="material-symbols-outlined" aria-hidden="true">
                play_circle
              </span>
              Watch reel
            </a>
            <span className="rl-block" aria-hidden="true" />
          </li>
        ) : (
          <li key={`empty-${i}`} className="rl-step is-empty" style={{ order: i }} aria-hidden="true">
            <span className="rl-medal">{i === 0 ? 2 : i === 1 ? 1 : 3}</span>
            <span className="rl-handle">Your reel?</span>
            <span className="rl-block" />
          </li>
        ),
      )}
    </ol>
  )
}

function SubmitReel({ hashtag }) {
  const [form, setForm] = useState({ handle: '', url: '', email: '' })
  const [state, setState] = useState({ status: 'idle', error: '' })
  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }))

  const submit = async (e) => {
    e.preventDefault()
    setState({ status: 'sending', error: '' })
    try {
      const res = await fetch(`${URL}/rpc/submit_reel`, {
        method: 'POST',
        headers,
        body: JSON.stringify({ p_handle: form.handle, p_url: form.url, p_email: form.email }),
      })
      const out = await res.json().catch(() => ({}))
      if (res.ok && out.ok) setState({ status: 'sent', error: '' })
      else setState({ status: 'idle', error: REASONS[out.reason] || 'Couldn’t submit right now. Please try again in a bit.' })
    } catch {
      setState({ status: 'idle', error: 'Couldn’t reach the server. Check your connection and try again.' })
    }
  }

  if (state.status === 'sent')
    return (
      <div className="rl-form rl-form--done" role="status">
        <span className="material-symbols-outlined" aria-hidden="true">
          task_alt
        </span>
        <h4>Reel submitted!</h4>
        <p>The Sky Eye team will check it and add it to the board. Keep sharing it — every view counts.</p>
        <button
          type="button"
          className="rl-btn rl-btn--ghost"
          onClick={() => {
            setForm((f) => ({ ...f, url: '' }))
            setState({ status: 'idle', error: '' })
          }}
        >
          Submit another reel
        </button>
      </div>
    )

  return (
    <form className="rl-form" onSubmit={submit}>
      <h4>Enter your reel</h4>
      <label className="rl-field">
        <span>Instagram username</span>
        <div className="rl-at">
          <i aria-hidden="true">@</i>
          <input required value={form.handle} onChange={set('handle')} placeholder="yourhandle" autoComplete="off" autoCapitalize="none" spellCheck="false" />
        </div>
      </label>
      <label className="rl-field">
        <span>Reel link</span>
        <input required type="url" value={form.url} onChange={set('url')} placeholder="https://www.instagram.com/reel/…" inputMode="url" />
      </label>
      <label className="rl-field">
        <span>Email (so we can reach you if you win)</span>
        <input required type="email" value={form.email} onChange={set('email')} autoComplete="email" />
      </label>
      {state.error && (
        <p className="rl-error" role="alert">
          {state.error}
        </p>
      )}
      <button className="rl-btn" disabled={state.status === 'sending'}>
        {state.status === 'sending' ? 'Submitting…' : 'Submit reel'}
      </button>
      <p className="rl-fine">The reel must be public and use {hashtag}. We never show your email.</p>
    </form>
  )
}

export default function ReelLeaderboard({ reels }) {
  const rows = useLeaderboard()
  const top = rows?.[0]?.views || 0
  const rest = rows ? rows.slice(3) : []
  const updated = rows?.reduce((t, r) => (r.views_at && (!t || r.views_at > t) ? r.views_at : t), null)

  return (
    <section className="rl" aria-labelledby="rl-title">
      <div className="container">
        <div className="rl-head" data-reveal>
          <span className="section-label">REEL CHALLENGE</span>
          <h3 className="rl-title" id="rl-title">
            {reels.hashtag}
          </h3>
          <p className="rl-lede">{reels.text}</p>
          <ul className="rl-facts">
            {reels.facts.map((f) => (
              <li key={f.text}>
                <span className="material-symbols-outlined" aria-hidden="true">
                  {f.icon}
                </span>
                {f.text}
              </li>
            ))}
          </ul>
        </div>

        <div className="rl-layout">
          <div className="rl-board" data-reveal>
            <div className="rl-board-head">
              <h4>Leaderboard</h4>
              <span className="rl-live">
                <span className="rl-dot" aria-hidden="true" />
                {updated ? `Views updated ${ago(updated)}` : 'Updated through the event'}
              </span>
            </div>

            {rows === null ? (
              <p className="rl-empty">Loading the board…</p>
            ) : (
              <>
                <Podium rows={rows} />
                {rest.length > 0 && (
                  <ol className="rl-list" start={4}>
                    {rest.map((r) => (
                      <li key={r.id}>
                        <span className="rl-rank">{r.rank}</span>
                        <a className="rl-name" href={r.reel_url} target="_blank" rel="noreferrer noopener">
                          @{r.handle}
                        </a>
                        <span className="rl-bar" aria-hidden="true">
                          <span style={{ width: `${top ? Math.max(3, (r.views / top) * 100) : 0}%` }} />
                        </span>
                        <span className="rl-count" title={`${full.format(r.views)} views`}>
                          {compact.format(r.views)}
                        </span>
                      </li>
                    ))}
                  </ol>
                )}
                {rows.length === 0 && <p className="rl-empty">No reels on the board yet. Post yours and be the first!</p>}
              </>
            )}
          </div>

          <div className="rl-side" data-reveal style={{ transitionDelay: '0.08s' }}>
            <ol className="rl-how">
              {reels.steps.map((s, i) => (
                <li key={s}>
                  <span>{i + 1}</span>
                  {s}
                </li>
              ))}
            </ol>
            <SubmitReel hashtag={reels.hashtag} />
          </div>
        </div>
      </div>
    </section>
  )
}
