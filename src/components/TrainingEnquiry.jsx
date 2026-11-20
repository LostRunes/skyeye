import { useEffect, useState } from 'react'
import { CONTACTS, newPhoto } from '../cdn'
import { COURSES } from '../data/courses'
import { takePendingService } from '../router'
import { REACH_PATTERN, REACH_TITLE, SOURCE, reachFields, useLeadForm } from '../lib/zohoLead'
import { LeadError, LeadSent } from './LeadStatus'

// A training-only enquiry form, kept separate from service requests so course
// and institution enquiries reach the team with the details they need. It goes
// to Zoho CRM as a Lead (Lead Source "Website - Training"); WhatsApp stays as
// a second way to send it.
const NOT_SURE = 'Not sure yet — please advise'
const COURSE_OPTIONS = [...COURSES.map((c) => c.title), NOT_SURE]
const FOR_OPTIONS = ['School', 'College / University', 'Company / Professionals', 'Police / Defence / Govt', 'Individual']

// "Enquire about this course" buttons carry data-service="Course: <title>"
const courseFrom = (service) => {
  if (!service || !service.startsWith('Course: ')) return null
  const title = service.slice('Course: '.length)
  return COURSE_OPTIONS.includes(title) ? title : null
}

export default function TrainingEnquiry() {
  const lead = useLeadForm()
  const [form, setForm] = useState(() => ({
    first: '',
    last: '',
    reach: '',
    org: '',
    audience: FOR_OPTIONS[0],
    course: courseFrom(takePendingService()) || COURSE_OPTIONS[0],
    size: '',
    when: '',
    city: '',
    message: '',
  }))

  // On the Training page itself, a course button picks that course here
  useEffect(() => {
    const onClick = (e) => {
      const a = e.target.closest?.('a[data-service]')
      const course = a && courseFrom(a.dataset.service)
      if (!course) return
      takePendingService() // handled here; don't carry it to the service form
      setForm((f) => ({ ...f, course }))
    }
    document.addEventListener('click', onClick)
    return () => document.removeEventListener('click', onClick)
  }, [])

  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }))

  const body = () =>
    [
      'TRAINING ENQUIRY',
      `Name: ${form.first} ${form.last}`.trim(),
      `Contact: ${form.reach}`,
      `Institution / organisation: ${form.org || '—'}`,
      `Training for: ${form.audience}`,
      `Course: ${form.course}`,
      `Participants: ${form.size || '—'}`,
      `Preferred dates: ${form.when || '—'}`,
      `City: ${form.city || '—'}`,
      '',
      form.message,
    ].join('\n')

  const submit = (e) => {
    e.preventDefault()
    lead.send({
      firstName: form.first,
      lastName: form.last,
      ...reachFields(form.reach),
      company: form.org,
      city: form.city,
      description: body(),
      source: SOURCE.training,
    })
  }

  const sendWhatsApp = (e) => {
    const f = e.currentTarget.form
    if (f && !f.reportValidity()) return
    window.open(`${CONTACTS.whatsapp}&text=${encodeURIComponent(body())}`, '_blank', 'noopener')
  }

  return (
    <section className="training-enquiry" id="training-enquiry" aria-label="Training enquiry">
      <div className="container py-2xl">
        <div className="te-grid">
          <div className="te-intro">
            <span className="section-label">TRAINING ENQUIRY</span>
            <h2 className="section-h2">BRING A COURSE TO YOUR PEOPLE.</h2>
            <p className="section-desc">
              For schools, colleges, companies and training units. Tell us the course, the group and
              the dates, and the team will get back with a plan.
            </p>
            <figure className="te-photo">
              <img src={newPhoto('genai-speaker', 'w-900,q-78')} alt="Sky Eye instructor teaching a live generative-AI session" loading="lazy" />
            </figure>
            <p className="te-alt">
              Looking for Skyvertising or a drone service instead?{' '}
              <a href="#/contact">Use the service request form →</a>
            </p>
          </div>

          <form className="contact-form te-form" onSubmit={submit}>
            {lead.status === 'sent' ? (
              <LeadSent
                className="contact-form-body"
                text={`We’ve got your enquiry about ${form.course === NOT_SURE ? 'training' : form.course}. The team will get back to you with a plan within a day.`}
                onReset={lead.reset}
              />
            ) : (
            <div className="contact-form-body">
              <span className="contact-form-title">TRAINING ENQUIRY</span>
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
              <label className="field">
                <span>Phone or email *</span>
                <input required value={form.reach} onChange={set('reach')} autoComplete="email" pattern={REACH_PATTERN} title={REACH_TITLE} />
              </label>
              <div className="te-row">
                <label className="field">
                  <span>Institution / organisation</span>
                  <input value={form.org} onChange={set('org')} autoComplete="organization" />
                </label>
                <label className="field">
                  <span>Training for</span>
                  <select value={form.audience} onChange={set('audience')}>
                    {FOR_OPTIONS.map((o) => (
                      <option key={o}>{o}</option>
                    ))}
                  </select>
                </label>
              </div>
              <label className="field">
                <span>Course</span>
                <select value={form.course} onChange={set('course')}>
                  {COURSE_OPTIONS.map((o) => (
                    <option key={o}>{o}</option>
                  ))}
                </select>
              </label>
              <div className="te-row te-row--3">
                <label className="field">
                  <span>Participants</span>
                  <input type="number" min="1" inputMode="numeric" value={form.size} onChange={set('size')} placeholder="e.g. 40" />
                </label>
                <label className="field">
                  <span>Preferred dates</span>
                  <input value={form.when} onChange={set('when')} placeholder="e.g. mid-December" />
                </label>
                <label className="field">
                  <span>City</span>
                  <input value={form.city} onChange={set('city')} autoComplete="address-level2" />
                </label>
              </div>
              <label className="field">
                <span>Anything else</span>
                <textarea rows={3} value={form.message} onChange={set('message')} placeholder="Age group, prior experience, venue…" />
              </label>
              {lead.status === 'error' && <LeadError whatsappHref={`${CONTACTS.whatsapp}&text=${encodeURIComponent(body())}`} />}
              <div className="contact-form-actions">
                <button type="submit" className="btn-request" disabled={lead.status === 'sending'}>
                  {lead.status === 'sending' ? 'Sending…' : 'Send enquiry'}
                </button>
                <button type="button" className="btn-outline" onClick={sendWhatsApp}>
                  [ Send on WhatsApp ]
                </button>
              </div>
            </div>
            )}
          </form>
        </div>
      </div>
    </section>
  )
}
