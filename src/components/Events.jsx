import { useState } from 'react'
import { CONTACTS } from '../cdn'
import { EVENTS, isPast } from '../data/event'

// Events page: every event Sky Eye takes part in (src/data/event.js), newest
// first. Each one explains the event, links to the organisers' own
// registration, and — where Sky Eye runs a stall — takes sign-ups for the
// stall games. Like the other forms there is no backend: the registration is
// composed and handed to the visitor's WhatsApp or mail app.

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

function EventFeature({ event }) {
  const past = isPast(event)
  return (
    <article className="ev-event" aria-labelledby={`ev-${event.id}`}>
      <header className="ev-head">
        <span className={`ev-status${past ? ' is-past' : ''}`}>
          <span className="event-dot" aria-hidden="true" />
          {past ? 'Past event' : event.kicker}
        </span>
        <h2 className="ev-title" id={`ev-${event.id}`}>
          {event.short && <span className="ev-short">{event.short}</span>}
          {event.title}
        </h2>
        <div className="event-dates" aria-label={`${event.days.join(', ')} ${event.month}`}>
          {event.days.map((d) => (
            <span key={d} className="event-day">{d}</span>
          ))}
          <span className="event-month">
            {event.month}
            {event.venue && <> · {event.venue}</>}
          </span>
        </div>
      </header>

      <div className="ev-cols">
        <div className="ev-about">
          <h3 className="ev-h3">What is {event.short || event.title}?</h3>
          {event.whatIs.map((p) => (
            <p key={p.slice(0, 24)} className="ev-p">{p}</p>
          ))}
          <p className="ev-p">{event.about}</p>
          <div className="ev-actions">
            {event.registerUrl ? (
              <a className="btn-request btn-request--sm" href={event.registerUrl} target="_blank" rel="noreferrer noopener">
                Register for {event.short || 'the event'} ↗
              </a>
            ) : (
              <span className="btn-outline ev-soon" aria-disabled="true">
                [ {event.short || 'Event'} registration link coming soon ]
              </span>
            )}
            <span className="ev-note">Delegate registration is handled by the {event.short || 'event'} organisers.</span>
          </div>
        </div>

        {event.stall && (
          <aside className="ev-stall" aria-label={event.stall.title}>
            <span className="section-label">FROM SKY EYE</span>
            <h3 className="ev-h3">{event.stall.title}</h3>
            <span className="event-stall-where">{event.stall.where}</span>
            <p className="ev-p">{event.stall.text}</p>
            <ul className="ev-games">
              {event.stall.games.map((g) => (
                <li key={g.title}>
                  <span className="material-symbols-outlined" aria-hidden="true">{g.icon}</span>
                  <div>
                    <strong>{g.title}</strong>
                    <span>{g.text}</span>
                  </div>
                </li>
              ))}
            </ul>
            {!past && (
              <a className="btn-request btn-request--sm" href="#/events?to=stall-register">
                Register for the games
              </a>
            )}
          </aside>
        )}
      </div>

      {event.stall && !past && <StallRegister event={event} />}
    </article>
  )
}

export default function Events() {
  return (
    <section className="events" id="events" aria-labelledby="events-title">
      <div className="container py-2xl">
        <span className="section-label">EVENTS</span>
        <h1 className="section-h2" id="events-title">WHERE YOU’LL FIND SKY EYE.</h1>
        <p className="section-desc">
          Fests, conferences and campus events Sky Eye is part of, and what we’re running at each
          one.
        </p>
        {EVENTS.map((e) => (
          <EventFeature key={e.id} event={e} />
        ))}
      </div>
    </section>
  )
}
