import { useEffect, useRef, useState } from 'react'
import { CONTACTS } from '../cdn'
import { EVENTS, isPast, statusLabel } from '../data/event'
import Countdown from './events/Countdown'
import SpinWheel from './events/SpinWheel'
import CatchGame from './events/CatchGame'
import DroneQuiz from './events/DroneQuiz'

// Events page: every event Sky Eye takes part in (src/data/event.js). Each
// gets a showcase — animated banner with a live countdown, a ticker, what
// the event is, and (where Sky Eye runs a stall) the "Sky Eye Arcade": demo
// versions of the stall games, then the sign-up for the real ones. Like the
// other forms there is no backend: the registration is composed and handed
// to the visitor's WhatsApp or mail app.

function StallRegister({ event }) {
  const [form, setForm] = useState({ name: '', phone: '', email: '', college: '', day: 'Any day', message: '' })
  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }))
  const dayOptions = ['Any day', ...event.days.map((d) => `${d} ${event.month}`)]

  const body = () =>
    [
      `STALL GAMES REGISTRATION — ${event.short || event.title}`,
      `Name: ${form.name}`,
      `Phone: ${form.phone}`,
      `Email: ${form.email || '—'}`,
      `College / institution: ${form.college || '—'}`,
      `Visiting: ${form.day}`,
      form.message ? `\n${form.message}` : '',
    ].join('\n')

  const sendWhatsApp = (e) => {
    e.preventDefault()
    window.open(`${CONTACTS.whatsapp}&text=${encodeURIComponent(body())}`, '_blank', 'noopener')
  }

  const sendMail = (e) => {
    const f = e.currentTarget.form
    if (f && !f.reportValidity()) return
    const subject = `Stall games registration — ${form.name}`
    window.location.href = `mailto:${CONTACTS.email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body())}`
  }

  return (
    <div className="ev-register" id="stall-register">
      <div className="ev-register-intro">
        <span className="section-label">REGISTER TO PLAY</span>
        <h3 className="ev-h3">Sign up for the stall games.</h3>
        <ol className="ev-steps">
          <li>
            <strong>Register here</strong> — it takes a minute, and goes straight to the Sky Eye team.
          </li>
          <li>
            <strong>Come to the stall</strong> — {event.stall.where}.
          </li>
          <li>
            <strong>Give your name at the stall</strong>, spin the wheel, play and win goodies.
          </li>
        </ol>
      </div>

      <form className="contact-form ev-form" onSubmit={sendWhatsApp}>
        <div className="contact-form-body">
          <span className="contact-form-title">STALL GAMES · {event.short || event.title}</span>
          <div className="te-row">
            <label className="field">
              <span>Name *</span>
              <input required value={form.name} onChange={set('name')} autoComplete="name" />
            </label>
            <label className="field">
              <span>Phone *</span>
              <input required type="tel" value={form.phone} onChange={set('phone')} autoComplete="tel" inputMode="tel" />
            </label>
          </div>
          <div className="te-row">
            <label className="field">
              <span>Email</span>
              <input type="email" value={form.email} onChange={set('email')} autoComplete="email" />
            </label>
            <label className="field">
              <span>College / institution</span>
              <input value={form.college} onChange={set('college')} autoComplete="organization" />
            </label>
          </div>
          <label className="field">
            <span>Which day will you visit?</span>
            <select value={form.day} onChange={set('day')}>
              {dayOptions.map((o) => (
                <option key={o}>{o}</option>
              ))}
            </select>
          </label>
          <label className="field">
            <span>Anything else</span>
            <textarea rows={2} value={form.message} onChange={set('message')} placeholder="Questions about the games or Sky Eye…" />
          </label>
          <div className="contact-form-actions">
            <button type="submit" className="btn-request">Register on WhatsApp</button>
            <button type="button" className="btn-outline" onClick={sendMail}>
              [ Register by email ]
            </button>
          </div>
        </div>
      </form>
    </div>
  )
}

// Adds .is-in to every [data-reveal] inside the returned ref as it scrolls into view
function useReveal() {
  const ref = useRef(null)
  useEffect(() => {
    const els = ref.current?.querySelectorAll('[data-reveal]') || []
    const io = new IntersectionObserver(
      (entries) =>
        entries.forEach((e) => {
          if (!e.isIntersecting) return
          e.target.classList.add('is-in')
          io.unobserve(e.target)
        }),
      { rootMargin: '0px 0px -12% 0px' }
    )
    els.forEach((el) => io.observe(el))
    return () => io.disconnect()
  }, [])
  return ref
}

// Wireframe globe: meridians squash and stretch out of phase to read as spin
function Globe() {
  return (
    <svg className="evx-globe" viewBox="0 0 200 200" aria-hidden="true">
      <circle cx="100" cy="100" r="92" className="evx-globe-rim" />
      {[-60, -30, 0, 30, 60].map((lat) => {
        const y = 100 - 92 * Math.sin((lat * Math.PI) / 180)
        const rx = 92 * Math.cos((lat * Math.PI) / 180)
        return <ellipse key={lat} cx="100" cy={y} rx={rx} ry={rx * 0.18} className="evx-globe-lat" />
      })}
      {[0, 1, 2, 3, 4, 5].map((i) => (
        <ellipse key={i} cx="100" cy="100" rx="92" ry="92" className="evx-globe-mer" style={{ animationDelay: `${-i * 1.2}s` }} />
      ))}
      <circle cx="100" cy="100" r="3" className="evx-globe-core" />
    </svg>
  )
}

const STEPS = [
  { icon: 'travel_explore', title: 'Research', text: 'Each delegate gets a country and a committee, and digs into its position on the agenda.' },
  { icon: 'record_voice_over', title: 'Debate', text: 'Formal speeches and moderated debate — making your country’s case to the room.' },
  { icon: 'handshake', title: 'Lobby', text: 'Unmoderated caucus: building alliances and finding common ground.' },
  { icon: 'gavel', title: 'Resolve', text: 'Drafting resolutions, amending them, and putting them to the vote.' },
]

function EventShowcase({ event }) {
  const past = isPast(event)
  const ref = useReveal()
  const name = event.short || event.title
  const ticker = [
    `${event.days.join(' · ')} ${event.month.split(' ')[0]}`,
    event.venue,
    'Spin the wheel',
    'Win goodies',
    'Debate',
    'Diplomacy',
    'Drone games',
    'Sky Eye stall',
  ].filter(Boolean)

  return (
    <article className="evx" ref={ref} aria-labelledby={`ev-${event.id}`}>
      {/* Banner */}
      <header className="evx-hero">
        <div className="evx-orbs" aria-hidden="true">
          <span />
          <span />
          <span />
        </div>
        <div className="evx-grid" aria-hidden="true" />
        <Globe />
        <div className="container evx-hero-inner">
          <span className={`ev-status evx-status${past ? ' is-past' : ''}`}>
            <span className="event-dot" aria-hidden="true" />
            {past ? 'Past event' : statusLabel(event)}
          </span>
          <h2 className="evx-title" id={`ev-${event.id}`}>
            <span className="evx-letters" aria-hidden="true" style={{ '--len': name.length }}>
              {[...name].map((ch, i) => (
                <span key={i} style={{ animationDelay: `${0.1 + i * 0.12}s` }}>
                  {ch}
                </span>
              ))}
            </span>
            <span className="visually-hidden">{name} — </span>
            <span className="evx-subtitle">{event.title}</span>
          </h2>
          <div className="evx-dates">
            {event.days.map((d, i) => (
              <span key={d} className="evx-day" style={{ animationDelay: `${0.5 + i * 0.1}s` }}>
                {d}
              </span>
            ))}
            <span className="evx-month">
              {event.month}
              {event.venue && (
                <>
                  <br />
                  {event.venue}
                </>
              )}
            </span>
          </div>
          {event.startsAt && <Countdown start={event.startsAt} end={`${event.endsOn}T23:59:59+05:30`} days={event.days.length} />}
          <div className="evx-ctas">
            {event.stall && !past && (
              <a className="evx-btn evx-btn--hot" href="#/events?to=stall-register">
                Register for the games →
              </a>
            )}
            {event.registerUrl ? (
              <a className="evx-btn" href={event.registerUrl} target="_blank" rel="noreferrer noopener">
                Register for {name} ↗
              </a>
            ) : (
              <span className="evx-btn is-soon" aria-disabled="true">
                {name} registration · link coming soon
              </span>
            )}
          </div>
        </div>
      </header>

      {/* Ticker */}
      <div className="evx-marquee" aria-hidden="true">
        <div className="evx-marquee-track">
          {[0, 1].map((copy) => (
            <span key={copy}>
              {ticker.map((t) => (
                <span key={t} className="evx-marquee-item">
                  {t}
                  <i>✦</i>
                </span>
              ))}
            </span>
          ))}
        </div>
      </div>

      {/* What it is */}
      <div className="container evx-about">
        <div className="evx-about-copy" data-reveal>
          <span className="section-label">THE EVENT</span>
          <h3 className="evx-h3">What is {event.kind ? `a ${event.kind}` : name}?</h3>
          {event.whatIs.map((p) => (
            <p key={p.slice(0, 24)} className="ev-p">
              {p}
            </p>
          ))}
          <p className="ev-p">{event.about}</p>
          <p className="ev-note">Delegate registration is handled by the {name} organisers.</p>
        </div>
        <ol className="evx-steps">
          {STEPS.map((st, i) => (
            <li key={st.title} data-reveal style={{ transitionDelay: `${i * 0.08}s` }}>
              <span className="evx-step-n">{String(i + 1).padStart(2, '0')}</span>
              <span className="material-symbols-outlined" aria-hidden="true">
                {st.icon}
              </span>
              <strong>{st.title}</strong>
              <span>{st.text}</span>
            </li>
          ))}
        </ol>
      </div>

      {/* Sky Eye stall + arcade */}
      {event.stall && (
        <section className="evx-arcade" aria-labelledby={`arcade-${event.id}`}>
          <div className="container">
            <div className="evx-arcade-head" data-reveal>
              <span className="section-label">FROM SKY EYE · {event.stall.where.toUpperCase()}</span>
              <h3 className="evx-arcade-title" id={`arcade-${event.id}`}>
                THE SKY EYE <em>ARCADE</em>
              </h3>
              <p className="ev-p">{event.stall.text} Warm up with the demos below, then come play for real.</p>
              <ul className="evx-perks">
                {event.stall.games.map((g) => (
                  <li key={g.title}>
                    <span className="material-symbols-outlined" aria-hidden="true">
                      {g.icon}
                    </span>
                    {g.title}
                  </li>
                ))}
              </ul>
            </div>
            <div className="arcade-grid">
              <div data-reveal>
                <SpinWheel />
              </div>
              <div data-reveal style={{ transitionDelay: '0.08s' }}>
                <CatchGame />
              </div>
              <div data-reveal style={{ transitionDelay: '0.16s' }}>
                <DroneQuiz />
              </div>
            </div>
          </div>
        </section>
      )}

      {event.stall && !past && (
        <div className="container">
          <StallRegister event={event} />
        </div>
      )}
    </article>
  )
}

export default function Events() {
  return (
    <section className="events" id="events" aria-labelledby="events-title">
      <div className="container events-intro">
        <span className="section-label">EVENTS</span>
        <h1 className="section-h2" id="events-title">WHERE YOU’LL FIND SKY EYE.</h1>
        <p className="section-desc">
          Fests, conferences and campus events Sky Eye is part of, and what we’re running at each
          one.
        </p>
      </div>
      {EVENTS.map((e) => (
        <EventShowcase key={e.id} event={e} />
      ))}
    </section>
  )
}
