import { useEffect, useRef, useState } from 'react'
import { CONTACTS } from '../cdn'
import { PHONE_PATTERN, PHONE_TITLE, SOURCE, cleanPhone, useLeadForm } from '../lib/zohoLead'
import { LeadSent } from './LeadStatus'
import { EVENTS, isPast, statusLabel } from '../data/event'
import Countdown from './events/Countdown'
import CatchGame from './events/CatchGame'
import DroneQuiz from './events/DroneQuiz'
import GoodiesShowcase from './events/GoodiesShowcase'
import ReelLeaderboard from './events/ReelLeaderboard'
import FairyLights from './events/FairyLights'
import './events/carnival.css'
import '../goodies.css'

// Events page: every event Sky Eye takes part in (src/data/event.js). Each
// gets a showcase — animated banner with a live countdown, a ticker, what
// the event is, and (where Sky Eye runs a stall) the "Sky Eye Arcade": demo
// versions of the stall games, the #skyeyetechnology reel leaderboard, then
// the sign-up for the real games. Sign-ups
// go to Zoho CRM as Leads (Lead Source "Website - MUN stall"); WhatsApp stays
// as a second way to register.

// "Open your inbox" buttons for the thank-you screen, picked by the email's
// domain. Gmail opens that exact account, searching for the spin-code mail
// (in Spam/Promotions too); on phones it usually hands over to the Gmail app.
function inboxLinks(email) {
  const e = String(email || '').trim().toLowerCase()
  const domain = e.split('@')[1] || ''
  const gmail = {
    label: 'Open Gmail',
    href: `https://mail.google.com/mail/?authuser=${encodeURIComponent(e)}#search/${encodeURIComponent('in:anywhere "Sky Eye spin code"')}`,
  }
  const outlook = { label: 'Open Outlook', href: 'https://outlook.live.com/mail/0/' }
  if (domain === 'gmail.com' || domain === 'googlemail.com') return [gmail]
  if (/^(outlook|hotmail|live|msn)\./.test(domain)) return [outlook]
  if (/^(yahoo|ymail|rocketmail)\./.test(domain)) return [{ label: 'Open Yahoo Mail', href: 'https://mail.yahoo.com/' }]
  if (domain === 'icloud.com' || domain === 'me.com') return [{ label: 'Open iCloud Mail', href: 'https://www.icloud.com/mail' }]
  // College and work addresses: could be either
  return [gmail, { label: 'Open Outlook', href: 'https://outlook.office.com/mail/' }]
}

// Common email-domain slips (seen in real sign-ups: gmai.com, gmail.clm…)
const DOMAIN_FIXES = {
  'gmai.com': 'gmail.com',
  'gmial.com': 'gmail.com',
  'gamil.com': 'gmail.com',
  'gmal.com': 'gmail.com',
  'gmil.com': 'gmail.com',
  'gnail.com': 'gmail.com',
  'gmaill.com': 'gmail.com',
  'gmail.co': 'gmail.com',
  'gmail.in': 'gmail.com',
  'gmail.om': 'gmail.com',
  gmail: 'gmail.com',
  'yaho.com': 'yahoo.com',
  'hotmial.com': 'hotmail.com',
  'kiit.ac': 'kiit.ac.in',
  'kiit.in': 'kiit.ac.in',
  'kitt.ac.in': 'kiit.ac.in',
  'kiit.ac.on': 'kiit.ac.in',
  'kiit.com': 'kiit.ac.in',
}
/** A likely-intended address for a mistyped one, or null. */
export function suggestEmail(email) {
  const e = String(email || '').trim().toLowerCase()
  const at = e.lastIndexOf('@')
  if (at < 1) return null
  const domain = e.slice(at + 1)
  if (DOMAIN_FIXES[domain]) return e.slice(0, at + 1) + DOMAIN_FIXES[domain]
  if (/\.(con|cm|clm|comm|vom|xom|cpm)$/.test(domain)) return e.slice(0, at + 1) + domain.replace(/\.[a-z]+$/, '.com')
  return null
}

// Creates the player in the spin database and emails their code. Retries a
// couple of times (patchy campus data), so a sign-up is never silently lost.
async function registerPlayer(body) {
  let last = 'We couldn’t reach our server.'
  for (let i = 0; i < 3; i++) {
    try {
      const res = await fetch('/api/spin-register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
        keepalive: true,
      })
      const out = await res.json().catch(() => ({}))
      if (res.ok && out.ok) return { ok: true, emailed: out.emailed !== false }
      if (res.status === 400) return { ok: false, error: out.error || 'Please check your details.' }
      last = out.error ? 'Our server had a problem.' : `Our server had a problem (${res.status}).`
    } catch {
      /* network: try again */
    }
    if (i < 2) await new Promise((r) => setTimeout(r, 800 * (i + 1)))
  }
  return { ok: false, error: last }
}

function StallRegister({ event }) {
  const lead = useLeadForm()
  const [form, setForm] = useState({ first: '', last: '', phone: '', email: '', college: '', day: 'Any day', message: '' })
  const [reg, setReg] = useState({ status: 'idle', error: '', emailed: true })
  const [warned, setWarned] = useState(false)
  const set = (k) => (e) => {
    if (k === 'email') setWarned(false)
    setForm((f) => ({ ...f, [k]: e.target.value }))
  }
  const emailFix = suggestEmail(form.email)
  const setPhone = (e) => setForm((f) => ({ ...f, phone: cleanPhone(e.target.value) }))
  const dayOptions = ['Any day', ...event.days.map((d) => `${d} ${event.month}`)]
  const name = event.short || event.title

  const body = () =>
    [
      `STALL GAMES REGISTRATION — ${name}`,
      `Name: ${form.first} ${form.last}`.trim(),
      `Phone: ${form.phone || '—'}`,
      `Email: ${form.email || '—'}`,
      `College / institution: ${form.college || '—'}`,
      `Visiting: ${form.day}`,
      form.message ? `\n${form.message}` : '',
    ].join('\n')

  const submit = async (e) => {
    e.preventDefault()
    if (reg.status === 'sending') return
    // Looks like a typo in the email: point it out once before sending
    if (emailFix && !warned) {
      setWarned(true)
      return
    }
    setReg({ status: 'sending', error: '', emailed: true })
    // The spin-the-wheel registration (api/spin-register.js → Supabase, which
    // emails the code) is what the form waits on; the Zoho CRM lead goes in
    // alongside it.
    const pending = registerPlayer({ firstName: form.first, lastName: form.last, email: form.email, phone: form.phone, college: form.college })
    lead.send({
      firstName: form.first,
      lastName: form.last,
      mobile: form.phone,
      email: form.email,
      company: form.college,
      description: body(),
      source: SOURCE.stall,
    })
    const r = await pending
    setReg(r.ok ? { status: 'ok', error: '', emailed: r.emailed } : { status: 'error', error: r.error, emailed: true })
  }

  const sendWhatsApp = (e) => {
    const f = e.currentTarget.form
    if (f && !f.reportValidity()) return
    window.open(`${CONTACTS.whatsapp}&text=${encodeURIComponent(body())}`, '_blank', 'noopener')
  }

  return (
    <div className="ev-register ev-carnival" id="stall-register">
      <FairyLights />
      <div className="ev-register-intro">
        <span className="ev-carnival-tag">STALL GAMES · {name.toUpperCase()}</span>
        <h3 className="ev-carnival-title">Spin the wheel!</h3>
        <p className="ev-carnival-sub">Register here and we’ll email you your spin code.</p>
        <ol className="ev-steps">
          <li>
            <strong>Register here</strong> — your personal spin code lands in your email.
          </li>
          <li>
            <strong>Come to the stall</strong> — {event.stall.where}.
          </li>
          <li>
            <strong>Scan the QR, enter your code and spin</strong> — and try your luck for Sky Eye goodies.
          </li>
        </ol>
      </div>

      <form className="contact-form ev-form" onSubmit={submit}>
        {reg.status === 'ok' ? (
          <LeadSent
            className="contact-form-body"
            title="You’re registered!"
            text={
              reg.emailed
                ? `Bring the code to the Sky Eye stall, ${event.stall.where}: scan the QR, enter the code and spin!`
                : `Your email is running a little late. If it hasn’t arrived in a few minutes, show this screen at the Sky Eye stall and the team will find your code.`
            }
            onReset={() => {
              setForm({ first: '', last: '', phone: '', email: '', college: '', day: 'Any day', message: '' })
              setReg({ status: 'idle', error: '', emailed: true })
              lead.reset()
            }}
          >
            <div className="lead-sent-callout">
              <span className="material-symbols-outlined" aria-hidden="true">
                mark_email_unread
              </span>
              <strong>Check your email</strong>
              <span className="lead-sent-callout-sub">to spin the wheel!</span>
              <span className="lead-sent-inbox">
                {inboxLinks(form.email).map((l) => (
                  <a key={l.label} className="lead-sent-inbox-btn" href={l.href} target="_blank" rel="noreferrer noopener">
                    <span className="material-symbols-outlined" aria-hidden="true">
                      inbox
                    </span>
                    {l.label}
                  </a>
                ))}
              </span>
              <small>
                Your spin code is on its way to <b>{form.email}</b>. Not there in a minute? Look in Spam or Promotions.
              </small>
            </div>
          </LeadSent>
        ) : (
          <div className="contact-form-body">
            <span className="contact-form-title">STALL GAMES · {name}</span>
            <div className="te-row">
              <label className="field">
                <span>First name *</span>
                <input required value={form.first} onChange={set('first')} autoComplete="given-name" />
              </label>
              <label className="field">
                <span>Last name</span>
                <input value={form.last} onChange={set('last')} autoComplete="family-name" />
              </label>
            </div>
            <div className="te-row">
              <label className="field">
                <span>Phone</span>
                <input type="tel" value={form.phone} onChange={setPhone} autoComplete="tel" inputMode="tel" pattern={PHONE_PATTERN} title={PHONE_TITLE} />
              </label>
              <label className="field">
                <span>Email *</span>
                <input
                  required
                  type="email"
                  value={form.email}
                  onChange={set('email')}
                  autoComplete="email"
                  pattern="[^@\s]+@[^@\s]+\.[^@\s]{2,}"
                  title="Enter your full email address, e.g. name@gmail.com"
                />
                {emailFix && (
                  <span className={`ev-email-hint${warned ? ' is-warned' : ''}`} role={warned ? 'alert' : undefined}>
                    Did you mean{' '}
                    <button
                      type="button"
                      onClick={() => {
                        setForm((f) => ({ ...f, email: emailFix }))
                        setWarned(false)
                      }}
                    >
                      {emailFix}
                    </button>
                    ?{warned && ' Tap it to fix, or tap Register again if yours is right.'}
                  </span>
                )}
              </label>
            </div>
            <div className="te-row">
              <label className="field">
                <span>College / institution</span>
                <input value={form.college} onChange={set('college')} autoComplete="organization" />
              </label>
              <label className="field">
                <span>Which day will you visit?</span>
                <select value={form.day} onChange={set('day')}>
                  {dayOptions.map((o) => (
                    <option key={o}>{o}</option>
                  ))}
                </select>
              </label>
            </div>
            <label className="field">
              <span>Anything else</span>
              <textarea rows={2} value={form.message} onChange={set('message')} placeholder="Questions about the games or Sky Eye…" />
            </label>
            {reg.status === 'error' && (
              <p className="lead-error" role="alert">
                <b>You’re not registered yet.</b> {reg.error} Check your internet and tap Register again, or register on
                WhatsApp below.
              </p>
            )}
            <div className="contact-form-actions">
              <button type="submit" className="btn-request" disabled={reg.status === 'sending'}>
                {reg.status === 'sending' ? 'Registering…' : 'Register'}
              </button>
              <button type="button" className="btn-outline" onClick={sendWhatsApp}>
                [ Register on WhatsApp ]
              </button>
            </div>
          </div>
        )}
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

            {event.stall.prizes && (
              <div className="evx-prizes" data-reveal>
                <span className="section-label">WHAT YOU CAN WIN</span>
                <GoodiesShowcase />
              </div>
            )}

            {event.stall.shop && (
              <div className="evx-shop" data-reveal>
                <span className="material-symbols-outlined" aria-hidden="true">
                  shopping_bag
                </span>
                <div>
                  <h4>{event.stall.shop.title}</h4>
                  <p>{event.stall.shop.text}</p>
                </div>
              </div>
            )}

            <div className="arcade-grid arcade-grid--two">
              <div data-reveal>
                <CatchGame />
              </div>
              <div data-reveal style={{ transitionDelay: '0.08s' }}>
                <DroneQuiz />
              </div>
            </div>
          </div>
        </section>
      )}

      {event.reels && <ReelLeaderboard reels={event.reels} />}

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
