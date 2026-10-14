import { useEffect, useState } from 'react'
import { CONTACTS, newPhoto } from '../cdn'
import { COURSES } from '../data/courses'
import { takePendingService } from '../router'

// A training-only enquiry form, kept separate from service requests so course
// and institution enquiries reach the team with the details they need.
// Like the main contact form there is no backend: the enquiry is composed and
// handed to the visitor's mail app or WhatsApp.
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
  const [form, setForm] = useState(() => ({
    name: '',
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
      `Name: ${form.name}`,
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

  const sendMail = (e) => {
    e.preventDefault()
    const subject = `Training enquiry — ${form.course}${form.org ? ` (${form.org})` : ''}`
    window.location.href = `mailto:${CONTACTS.email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body())}`
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

          <form className="contact-form te-form" onSubmit={sendMail}>
            <div className="contact-form-body">
              <span className="contact-form-title">TRAINING ENQUIRY</span>
              <div className="te-row">
                <label className="field">
                  <span>Name *</span>
                  <input required value={form.name} onChange={set('name')} autoComplete="name" />
                </label>
                <label className="field">
                  <span>Phone or email *</span>
                  <input required value={form.reach} onChange={set('reach')} autoComplete="email" />
                </label>
              </div>
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
                  <input inputMode="numeric" value={form.size} onChange={set('size')} placeholder="e.g. 40" />
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
              <div className="contact-form-actions">
                <button type="submit" className="btn-request">Send enquiry by email</button>
                <button type="button" className="btn-outline" onClick={sendWhatsApp}>
                  [ Send on WhatsApp ]
                </button>
              </div>
            </div>
          </form>
        </div>
      </div>
    </section>
  )
}
