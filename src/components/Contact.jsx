import { useEffect, useState } from 'react'
import { CONTACTS, brochureCrop } from '../cdn'

const SERVICES = ['Skyvertising', 'Courses', 'Drone Services', 'Something else']

// There is no backend, so the form composes the enquiry and hands it to the
// visitor's mail app or WhatsApp — either way it lands with the team.
export default function Contact() {
  const [form, setForm] = useState({ name: '', reach: '', service: SERVICES[0], message: '' })

  // Any "[ Book … ]" / "[ Enquire … ]" link elsewhere on the page carries a
  // data-service, so the form arrives with the right service already picked.
  useEffect(() => {
    const onClick = (e) => {
      const a = e.target.closest?.('a[data-service]')
      if (a) setForm((f) => ({ ...f, service: a.dataset.service }))
    }
    document.addEventListener('click', onClick)
    return () => document.removeEventListener('click', onClick)
  }, [])

  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }))

  const body = () =>
    `Name: ${form.name}\nContact: ${form.reach}\nService: ${form.service}\n\n${form.message}`

  const sendMail = (e) => {
    e.preventDefault()
    const subject = `Enquiry — ${form.service}`
    window.location.href = `mailto:${CONTACTS.email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body())}`
  }

  const sendWhatsApp = () => {
    window.open(`${CONTACTS.whatsapp}&text=${encodeURIComponent(body())}`, '_blank', 'noopener')
  }

  return (
    <section className="section-cta" id="contact">
      <div className="container py-2xl">
        <div className="cta-grid">
          <div className="cta-left contact-left">
            <span className="section-label">08 / CONTACT US</span>
            <h2 className="cta-h2">
              WHAT ARE
              <br />
              WE BUILDING
              <br />
              NEXT?
            </h2>
            <p className="section-desc contact-lede">
              A drone ad show, a course for your institution, a survey over your site — or something
              we haven't flown yet. Tell us what you need.
            </p>

            <div className="contact-cards">
              {CONTACTS.people.map((p) => (
                <a key={p.tel} className="contact-card" href={`tel:${p.tel}`}>
                  <span className="contact-card-label">CALL</span>
                  <span className="contact-card-name">{p.name}</span>
                  <span className="contact-card-value">{p.phone}</span>
                </a>
              ))}
              <a className="contact-card" href={`mailto:${CONTACTS.email}`}>
                <span className="contact-card-label">EMAIL</span>
                <span className="contact-card-value contact-card-email">{CONTACTS.email}</span>
              </a>
              <a className="contact-card" href={CONTACTS.whatsapp} target="_blank" rel="noreferrer noopener">
                <span className="contact-card-label">WHATSAPP</span>
                <span className="contact-card-value">Message us →</span>
              </a>
            </div>
          </div>

          <div className="cta-right">
            <form className="contact-form" onSubmit={sendMail}>
              <div className="contact-form-media" aria-hidden="true">
                <img src={brochureCrop('led-net-city', 'w-900,h-360,fo-auto,q-75')} alt="" loading="lazy" />
              </div>
              <div className="contact-form-body">
                <span className="contact-form-title">SEND AN ENQUIRY</span>
                <label className="field">
                  <span>Name</span>
                  <input required value={form.name} onChange={set('name')} autoComplete="name" />
                </label>
                <label className="field">
                  <span>Phone or email</span>
                  <input required value={form.reach} onChange={set('reach')} autoComplete="email" />
                </label>
                <label className="field">
                  <span>Service</span>
                  <select value={form.service} onChange={set('service')}>
                    {SERVICES.map((s) => (
                      <option key={s}>{s}</option>
                    ))}
                  </select>
                </label>
                <label className="field">
                  <span>Message</span>
                  <textarea rows={4} value={form.message} onChange={set('message')} placeholder="Event date, location, group size…" />
                </label>
                <div className="contact-form-actions">
                  <button type="submit" className="btn-primary">[ Send by email → ]</button>
                  <button type="button" className="btn-outline" onClick={sendWhatsApp}>
                    [ Send on WhatsApp ]
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      </div>
    </section>
  )
}
