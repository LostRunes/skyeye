import { useCallback, useEffect, useRef, useState } from 'react'
import { REASONS, supabase } from './supabase'
import Wheel from './Wheel'
import SkyParty from './SkyParty'
import { confetti } from '../components/events/confetti'
import { ik } from '../cdn'
import './spin.css'

// #/spin — what the QR code at the stall opens. The player enters the code we
// emailed them (or arrives with ?code=XXXXXX from the email's button), spins,
// and sees what they landed on. The server picks the prize; the wheel just
// animates to it.
const CODE_KEY = 'skyeye-spin-code'
const logo = ik('site/logo-mark-light.png', 'h-96')

const codeFromHash = () => new URLSearchParams(window.location.hash.split('?')[1] || '').get('code') || ''
const stored = () => {
  try {
    return localStorage.getItem(CODE_KEY) || ''
  } catch {
    return ''
  }
}
const store = (c) => {
  try {
    localStorage.setItem(CODE_KEY, c)
  } catch {
    /* private mode: they'll just type it again */
  }
}
const clean = (v) => v.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 6)

// The carnival sign at the top of the code screen
function Marquee() {
  return (
    <div className="sw-marquee" aria-hidden="true">
      <div className="sw-marquee-sign">
        {Array.from({ length: 14 }, (_, i) => (
          <span key={i} className="sw-marquee-bulb" style={{ '--i': i }} />
        ))}
        <span className="sw-marquee-kicker">Sky Eye presents</span>
        <span className="sw-marquee-title">Spin &amp; Win</span>
      </div>
    </div>
  )
}

export default function PlayPage() {
  const [prizes, setPrizes] = useState([])
  const [code, setCode] = useState(() => clean(codeFromHash() || stored()))
  const [stage, setStage] = useState('enter') // enter | checking | ready | spinning | result | blocked
  const [info, setInfo] = useState(null)
  const [result, setResult] = useState(null)
  const [spinKey, setSpinKey] = useState(0)
  const [error, setError] = useState('')
  const wheelBox = useRef(null)

  useEffect(() => {
    supabase
      .from('prizes')
      .select('id, name, icon, color')
      .eq('active', true)
      .order('sort')
      .order('id')
      .then(({ data }) => data && setPrizes(data))
  }, [])

  const check = useCallback(async (c) => {
    if (c.length !== 6) {
      setError('Your code has 6 letters and numbers.')
      return
    }
    setStage((s) => (s === 'blocked' ? s : 'checking'))
    setError('')
    const { data, error: err } = await supabase.rpc('check_code', { p_code: c })
    if (err) {
      setError('Couldn’t reach the server. Check your internet and try again.')
      setStage('enter')
      return
    }
    setInfo(data)
    if (data.ok) {
      store(c)
      setStage('ready')
    } else if (data.reason === 'invalid') {
      setError(REASONS.invalid)
      setStage('enter')
    } else {
      store(c)
      setStage('blocked')
    }
  }, [])

  // Arriving from the email link (or a saved code): check it straight away
  useEffect(() => {
    if (code.length === 6) check(code)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // No round running yet: re-check as soon as staff start one, so the wheel
  // appears by itself. (Each code spins once, so nothing else waits.)
  const waiting = stage === 'blocked' && info?.reason === 'no_round'
  useEffect(() => {
    if (!waiting) return undefined
    const channel = supabase
      .channel(`rounds-${Date.now()}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'sessions' }, () => check(code))
      .subscribe()
    const poll = setInterval(() => check(code), 15000)
    return () => {
      supabase.removeChannel(channel)
      clearInterval(poll)
    }
  }, [waiting, code, check])

  const spin = async () => {
    if (stage !== 'ready') return
    setStage('spinning')
    setError('')
    const { data, error: err } = await supabase.rpc('spin', { p_code: code })
    if (err) {
      setError('Couldn’t reach the server. Try again.')
      setStage('ready')
      return
    }
    if (!data.ok) {
      setInfo(data)
      setStage('blocked')
      return
    }
    setResult(data)
    setSpinKey((k) => k + 1)
  }

  const landed = () => {
    setStage('result')
    if (result?.is_winner) {
      const r = wheelBox.current?.getBoundingClientRect()
      confetti({ x: r ? (r.left + r.width / 2) / innerWidth : 0.5, y: r ? (r.top + r.height / 3) / innerHeight : 0.4, count: 180 })
    }
  }

  const prize = result && prizes.find((p) => p.id === result.prize_id)
  const name = info?.first_name || result?.first_name

  return (
    <div className="sw-app">
      <SkyParty />
      <header className="sw-top">
        <a className="sw-brand" href="https://www.skyeyetechnology.in/#/events">
          <img src={logo} alt="" />
          <span>
            SKY EYE <em>SPIN</em>
          </span>
        </a>
        <span className="sw-chip">KIIT MUN · Campus 6</span>
      </header>

      <main className="sw-main">
        {(stage === 'enter' || stage === 'checking') && (
          <section className="sw-card sw-enter">
            <Marquee />
            <h1 className="sw-title">
              Got your <span className="sw-grad">spin code?</span>
            </h1>
            <p className="sw-sub">We emailed it to you when you registered for the Sky Eye stall games.</p>
            <form
              className="sw-code-form"
              onSubmit={(e) => {
                e.preventDefault()
                check(code)
              }}
            >
              <label className="sw-code-label" htmlFor="sw-code">
                Your 6-character code
              </label>
              <input
                id="sw-code"
                className="sw-code"
                value={code}
                onChange={(e) => setCode(clean(e.target.value))}
                placeholder="K7QX2M"
                autoComplete="one-time-code"
                autoCapitalize="characters"
                spellCheck="false"
                inputMode="text"
                maxLength={6}
              />
              {error && (
                <p className="sw-error" role="alert">
                  {error}
                </p>
              )}
              <button className="sw-btn" disabled={stage === 'checking' || code.length !== 6}>
                {stage === 'checking' ? 'Checking…' : 'Let’s spin →'}
              </button>
            </form>
            <p className="sw-fine">
              No code yet?{' '}
              <a href="https://www.skyeyetechnology.in/#/events?to=stall-register">Register for the stall games</a> and
              check your inbox.
            </p>
          </section>
        )}

        {(stage === 'ready' || stage === 'spinning') && (
          <section className="sw-play">
            <h1 className="sw-title sw-title--sm">
              Hey <span className="sw-grad">{name}</span>! 👋
            </h1>
            <p className="sw-sub">
              {info?.round} · the first {info?.max_winners ?? 10} spins win a goodie. Fastest fingers first!
            </p>
            <div ref={wheelBox}>
              <Wheel
                prizes={prizes}
                landOn={result?.prize_id}
                spinKey={spinKey}
                onDone={landed}
                hub={
                  <button className="sw-hub-btn" onClick={spin} disabled={stage !== 'ready'}>
                    {stage === 'spinning' ? '…' : 'SPIN'}
                  </button>
                }
              />
            </div>
            {error && (
              <p className="sw-error" role="alert">
                {error}
              </p>
            )}
            <button className="sw-btn sw-btn--big" onClick={spin} disabled={stage !== 'ready'}>
              {stage === 'spinning' ? 'Spinning…' : 'Spin the wheel!'}
            </button>
          </section>
        )}

        {stage === 'result' && result && (
          <section className={`sw-card sw-result ${result.is_winner ? 'is-win' : 'is-miss'}`} aria-live="polite">
            {result.is_winner ? (
              <>
                <span className="sw-badge">#{result.rank} this round</span>
                <span className="material-symbols-outlined sw-prize-icon" style={{ color: prize?.color }}>
                  {prize?.icon || 'redeem'}
                </span>
                <h1 className="sw-title">
                  You won!
                  <span className="sw-grad sw-prize-name">{result.prize_name}</span>
                </h1>
                <p className="sw-sub">Show this screen at the Sky Eye stall to collect your goodie.</p>
                <dl className="sw-ticket">
                  <div>
                    <dt>Name</dt>
                    <dd>{name}</dd>
                  </div>
                  <div>
                    <dt>Code</dt>
                    <dd>{code}</dd>
                  </div>
                  <div>
                    <dt>Round</dt>
                    <dd>{result.round}</dd>
                  </div>
                </dl>
              </>
            ) : (
              <>
                <span className="sw-emblem sw-emblem--miss">
                  <span className="material-symbols-outlined">sentiment_satisfied</span>
                </span>
                <h1 className="sw-title sw-title--sm">
                  You landed on <span className="sw-grad">{result.prize_name}</span>…
                </h1>
                <p className="sw-sub">
                  …but the first {result.max_winners} spots this round were already taken (you were #{result.rank}).
                  Thanks for playing, and come say hi at the Sky Eye stall!
                </p>
              </>
            )}
          </section>
        )}

        {stage === 'blocked' && (
          <section className="sw-card sw-blocked" aria-live="polite">
            <span className={`sw-emblem sw-emblem--${info?.reason || 'wait'}`}>
              <span className="material-symbols-outlined">
                {info?.reason === 'already_won' ? 'emoji_events' : info?.reason === 'already_spun' ? 'confirmation_number' : 'hourglass_top'}
              </span>
            </span>
            <h1 className="sw-title sw-title--sm">{name ? `Hey ${name}!` : 'Hang on!'}</h1>
            <p className="sw-sub">{REASONS[info?.reason] || 'Something went wrong. Ask the stall team.'}</p>
            {info?.reason === 'no_round' && (
              <p className="sw-fine sw-live">
                <span className="sw-dot" /> This page updates by itself when the next round starts.
              </p>
            )}
          </section>
        )}
      </main>
    </div>
  )
}
