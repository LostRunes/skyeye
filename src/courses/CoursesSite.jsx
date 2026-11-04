import { useEffect, useRef, useState } from 'react'
import { gsap } from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { CONTACTS, ik } from '../cdn'
import { COURSES, GROUPS } from '../data/courses'
import useSmoothScroll from '../hooks/useSmoothScroll'
import CourseDroneJourney from './CourseDroneJourney'
import CourseCarousel from './CourseCarousel'
import FlyingButton from '../components/reactbits/FlyingButton'
import CoursePoster from './CoursePoster'
import './courses.css'

gsap.registerPlugin(ScrollTrigger)

// courses.skyeyetechnology.in — a standalone site for the training courses:
// an animated hero, the scroll-scrubbed drone, a 3D course carousel with
// the chosen course's full detail below it (curriculum, format, who it's
// for, instructor), how enrolment works, FAQs
// and the enrolment form. Course content lives in src/data/courses.js, the
// same file the main site's Training page uses.
//
// Online payment is not wired up yet: the form collects details and hands
// them to the team by WhatsApp/email until the Zoho Forms + payment step is
// connected (see ENROL below).

const MAIN_SITE = 'https://skyeyetechnology.in'
const logo = ik('site/logo-mark-light.png', 'h-96')

// Flip `online` to true and set `url` once the Zoho form with payment exists;
// the Enrol buttons then open it instead of the interim form.
const ENROL = { online: false, url: '' }

const STEPS = [
  { icon: 'touch_app', title: 'Pick a course', text: 'Explore the curriculum below and choose the course that fits you.' },
  { icon: 'edit_note', title: 'Enrol & pay online', text: 'Fill in your details and pay securely online to reserve your seat.' },
  { icon: 'mark_email_read', title: 'Get your joining details', text: 'We confirm your seat and send the batch dates, venue and what to bring.' },
  { icon: 'flight_takeoff', title: 'Start learning', text: 'Live, hands-on sessions with real hardware, real tools and real projects.' },
]

const FAQS = [
  {
    q: 'Do I need any prior experience?',
    a: 'No for most courses. Drone Explorer, Data Analytics and FPV Flight Academy start from the basics. Generative AI suits all levels, and the UAV Masterclass is built for undergraduate students ready for design and build work.',
  },
  {
    q: 'Are the classes live?',
    a: 'Yes. Every course is taught live and hands-on: assembling and flying real drones, or building along on your own laptop for the AI and data courses.',
  },
  {
    q: 'What do I need to bring?',
    a: 'For Generative AI and Data Analytics, a laptop. For the drone courses, just yourself: kits, simulators and drones are provided during the sessions.',
  },
  {
    q: 'How do I pay?',
    a: 'Online, when you enrol. You will get a confirmation along with the batch details once your payment goes through.',
  },
  {
    q: 'Can my school, college or company book a batch?',
    a: 'Yes. We run courses for schools, colleges, companies and training units. Use the institution enquiry on our main website and the team will plan a batch for your group.',
  },
  {
    q: 'Who teaches the courses?',
    a: 'Sky Eye’s own engineers and trainers: the same team that designs, builds and flies drones for real-world work.',
  },
]

const trackLabel = (key) => GROUPS.find((g) => g.key === key)?.label || key

// Section-level scroll animations; everything respects reduced motion
function useCourseAnimations(rootRef) {
  useEffect(() => {
    const root = rootRef.current
    if (!root || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return
    const ctx = gsap.context(() => {
      gsap.from('.cs-hero-word', { yPercent: 110, opacity: 0, duration: 1, stagger: 0.08, ease: 'expo.out', delay: 0.15 })
      gsap.from('.cs-hero-sub, .cs-hero-ctas, .cs-hero-stats li', { y: 24, opacity: 0, duration: 0.8, stagger: 0.08, ease: 'power3.out', delay: 0.6 })
      gsap.utils.toArray('[data-cs-reveal]').forEach((el) =>
        gsap.from(el, { y: 40, opacity: 0, duration: 0.9, ease: 'power3.out', scrollTrigger: { trigger: el, start: 'top 86%' } })
      )
    }, root)
    return () => ctx.revert()
  }, [rootRef])
}

function Header() {
  const [scrolled, setScrolled] = useState(false)
  useEffect(() => {
    const on = () => setScrolled(window.scrollY > 40)
    on()
    window.addEventListener('scroll', on, { passive: true })
    return () => window.removeEventListener('scroll', on)
  }, [])
  return (
    <header className={`cs-header${scrolled ? ' is-scrolled' : ''}`}>
      <a className="cs-brand" href={MAIN_SITE} aria-label="Sky Eye Technology main website">
        <img src={logo} alt="" />
        <span>
          SKY EYE
          <em>COURSES</em>
        </span>
      </a>
      <nav className="cs-nav" aria-label="Courses site">
        <a href="#courses">Courses</a>
        <a href="#how">How it works</a>
        <a href="#faq">FAQ</a>
      </nav>
      <a className="cs-btn cs-btn--hot cs-header-cta" href="#enrol">
        Enrol now
      </a>
    </header>
  )
}

function Hero() {
  const words = ['LEARN', 'TO', 'BUILD', 'THE', 'FUTURE.']
  return (
    <section className="cs-hero">
      <div className="cs-hero-grid" aria-hidden="true" />
      <div className="cs-hero-glow" aria-hidden="true" />
      {/* A drone's flight path loops across the hero */}
      <svg className="cs-hero-path" viewBox="0 0 1200 600" preserveAspectRatio="xMidYMid slice" aria-hidden="true">
        <path id="cs-flight" d="M-40 470 C 220 250, 380 560, 620 330 S 980 80, 1240 210" />
        {/* A quadcopter, seen from above, flying the dotted path */}
        <g className="cs-hero-drone">
          <animateMotion dur="11s" repeatCount="indefinite" rotate="auto">
            <mpath href="#cs-flight" />
          </animateMotion>
          <g className="cs-drone-arms">
            <line x1="-12" y1="-12" x2="12" y2="12" />
            <line x1="-12" y1="12" x2="12" y2="-12" />
          </g>
          {[
            [-12, -12],
            [12, -12],
            [-12, 12],
            [12, 12],
          ].map(([x, y]) => (
            <g key={`${x}${y}`} transform={`translate(${x} ${y})`}>
              <circle r="8" className="cs-drone-rotor" />
              <circle r="2" className="cs-drone-motor" />
            </g>
          ))}
          <rect x="-6" y="-5" width="12" height="10" rx="3" className="cs-drone-body" />
          <circle cx="5" cy="0" r="1.4" className="cs-drone-led" />
        </g>
      </svg>
      <div className="cs-wrap cs-hero-inner">
        <span className="cs-kicker">
          <span className="cs-live-dot" /> SKY EYE TECHNOLOGY · LIVE TRAINING
        </span>
        <h1 className="cs-hero-title">
          {words.map((w) => (
            <span key={w} className="cs-hero-mask">
              <span className={`cs-hero-word${w === 'FUTURE.' ? ' is-hot' : ''}`}>{w}</span>
            </span>
          ))}
        </h1>
        <p className="cs-hero-sub">
          Hands-on courses in drones and AI, taught live by the engineers who build and fly them. From your first
          assembly to AI agents, from simulator to FPV.
        </p>
        <div className="cs-hero-ctas">
          <a className="cs-btn cs-btn--hot" href="#courses">
            Explore courses ↓
          </a>
          <a className="cs-btn" href="#enrol">
            Enrol now
          </a>
        </div>
        <ul className="cs-hero-stats">
          <li>
            <strong>{COURSES.length}</strong> courses
          </li>
          <li>
            <strong>{GROUPS.length}</strong> tracks: {GROUPS.map((g) => g.label).join(' & ')}
          </li>
          <li>
            <strong>100%</strong> live & hands-on
          </li>
        </ul>
      </div>
      <div className="cs-marquee" aria-hidden="true">
        <div className="cs-marquee-track">
          {[0, 1].map((k) => (
            <span key={k}>
              {COURSES.map((c) => (
                <span key={c.id} className="cs-marquee-item">
                  {c.short || c.title}
                  <i>✦</i>
                </span>
              ))}
            </span>
          ))}
        </div>
      </div>
    </section>
  )
}

const pad = (n) => String(n).padStart(2, '0')

// Courses shown with an illustrated poster instead of a photo
const hasPoster = (id) => id === 'genai' || id === 'data'

// Moving from course `prev.i` to `i`: remember which way, for the detail's entrance
const towards = (prev, i) => {
  if (prev.i === i) return prev
  let d = i - prev.i
  if (d > COURSES.length / 2) d -= COURSES.length
  if (d < -COURSES.length / 2) d += COURSES.length
  return { i, dir: Math.sign(d) || 1 }
}

// The flying enrol buttons, in the site's soft orange
const FLY = {
  theme: 'dark',
  size: 'large',
  hoverTime: 2.2,
  buttonColor: '#e08a5c',
  textColor: '#1a1412',
  thrustColor: '#f2b48a',
  smokeColor: '#efe4d8',
}

const scrollToId = (id, offset = -70) => {
  const el = document.getElementById(id)
  if (!el) return
  if (window.__lenis) window.__lenis.scrollTo(el, { offset })
  else el.scrollIntoView({ behavior: 'smooth' })
}

// The chosen course: poster or photo held in place while the learning path
// beside it fills in on scroll. Remounted per course, entering from the side
// the carousel turned towards.
function CourseDetail({ c, i, dir, onEnrol, onStep }) {
  const ref = useRef(null)
  const n = COURSES.length
  const prev = COURSES[(i - 1 + n) % n]
  const next = COURSES[(i + 1) % n]

  useEffect(() => {
    const root = ref.current
    if (!root || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return
    const ctx = gsap.context(() => {
      gsap.from('.cs-detail-in', { x: dir * 70, opacity: 0, duration: 0.75, stagger: 0.07, ease: 'power3.out' })
      gsap.fromTo(
        '.cs-curriculum-line',
        { scaleY: 0 },
        { scaleY: 1, ease: 'none', scrollTrigger: { trigger: '.cs-curriculum', start: 'top 72%', end: 'bottom 62%', scrub: true } }
      )
      // Each stop on the path lights up as the line reaches it
      gsap.utils.toArray('.cs-module').forEach((m) =>
        ScrollTrigger.create({
          trigger: m,
          start: 'top 68%',
          onEnter: () => m.classList.add('is-on'),
          onLeaveBack: () => m.classList.remove('is-on'),
        })
      )
    }, root)
    const raf = requestAnimationFrame(() => ScrollTrigger.refresh())
    return () => {
      cancelAnimationFrame(raf)
      ctx.revert()
    }
  }, [dir])

  // The poster leans towards the pointer
  const tilt = (e) => {
    const el = e.currentTarget
    const r = el.getBoundingClientRect()
    el.style.setProperty('--px', (((e.clientX - r.left) / r.width) * 2 - 1).toFixed(3))
    el.style.setProperty('--py', (((e.clientY - r.top) / r.height) * 2 - 1).toFixed(3))
  }
  const untilt = (e) => {
    e.currentTarget.style.setProperty('--px', '0')
    e.currentTarget.style.setProperty('--py', '0')
  }

  return (
    <section className="cs-course cs-detail" id="course" ref={ref} aria-labelledby="cs-detail-title">
      <div className="cs-wrap cs-course-inner">
        <div className="cs-course-media cs-detail-in">
          {hasPoster(c.id) ? (
            <div className="cs-course-frame is-poster" onPointerMove={tilt} onPointerLeave={untilt}>
              <CoursePoster c={c} i={i} total={n} />
            </div>
          ) : (
            <div className="cs-course-frame">
              <img src={c.img} alt={c.title} />
            </div>
          )}
          <span className="cs-course-num">{pad(i + 1)}</span>
        </div>

        <div className="cs-course-body">
          <div className="cs-detail-in">
            <span className="cs-kicker">
              {trackLabel(c.group)} · {c.level}
            </span>
            <h2 className="cs-course-title" id="cs-detail-title">
              {c.title}
            </h2>
            {c.program && <p className="cs-course-program">{c.program}</p>}
            <p className="cs-lead">{c.desc}</p>
            <dl className="cs-facts">
              <div>
                <dt>Who it’s for</dt>
                <dd>{c.audience}</dd>
              </div>
              <div>
                <dt>Level</dt>
                <dd>{c.level}</dd>
              </div>
              <div>
                <dt>Format</dt>
                <dd>{c.format.join(' · ')}</dd>
              </div>
            </dl>
          </div>

          <div className="cs-curriculum">
            <h3 className="cs-h3">Your learning path</h3>
            <span className="cs-curriculum-line" aria-hidden="true" />
            <ol className="cs-modules">
              {c.modules.map(([t, d], k) => (
                <li key={t} className="cs-module">
                  <span className="cs-module-n">{pad(k + 1)}</span>
                  <div>
                    <strong>{t}</strong>
                    <span>{d}</span>
                  </div>
                </li>
              ))}
            </ol>
          </div>

          {c.instructor && (
            <div className="cs-teacher">
              <img src={c.instructor.img} alt={c.instructor.name || 'Course instructor'} loading="lazy" />
              <div>
                <span className="cs-kicker">YOUR INSTRUCTOR</span>
                <strong>{c.instructor.name || c.instructor.role}</strong>
                <ul>
                  {c.instructor.quals.map((q) => (
                    <li key={q}>{q}</li>
                  ))}
                </ul>
              </div>
            </div>
          )}

          {/* Hover and it lifts off on its thrusters; click to go and enrol */}
          <div className="cs-launch">
            <FlyingButton {...FLY} altitude={150} onClick={() => onEnrol(c.id)}>
              Enrol in {c.short || c.title} →
            </FlyingButton>
          </div>

          <nav className="cs-detail-nav" aria-label="Other courses">
            <button type="button" onClick={() => onStep(-1)}>
              <small>← Previous course</small>
              <strong>{prev.short || prev.title}</strong>
            </button>
            <button type="button" onClick={() => onStep(1)}>
              <small>Next course →</small>
              <strong>{next.short || next.title}</strong>
            </button>
          </nav>
        </div>
      </div>
    </section>
  )
}

function Explorer({ sel, setSel, onEnrol }) {
  const c = COURSES[sel.i]
  const step = (delta) => {
    setSel((p) => towards(p, (p.i + delta + COURSES.length) % COURSES.length))
    scrollToId('courses', -40)
  }
  return (
    <>
      <section className="cs-explorer" id="courses">
        <div className="cs-wrap">
          <div className="cs-section-head" data-cs-reveal>
            <span className="cs-kicker">THE COURSES</span>
            <h2 className="cs-h2">Pick your path.</h2>
            <p className="cs-lead">
              Two tracks, five courses. Spin through them, pick one, and scroll down for everything it covers.
            </p>
          </div>
        </div>
        <CourseCarousel
          courses={COURSES}
          active={sel.i}
          onChange={(i) => setSel((p) => towards(p, i))}
          onOpen={() => scrollToId('course')}
          trackLabel={trackLabel}
        />
      </section>
      <CourseDetail key={c.id} c={c} i={sel.i} dir={sel.dir} onEnrol={onEnrol} onStep={step} />
    </>
  )
}

function HowItWorks() {
  return (
    <section className="cs-how" id="how">
      <div className="cs-wrap">
        <div className="cs-section-head" data-cs-reveal>
          <span className="cs-kicker">HOW ENROLMENT WORKS</span>
          <h2 className="cs-h2">Four steps to your first class.</h2>
        </div>
        <ol className="cs-steps">
          {STEPS.map((s, i) => (
            <li key={s.title} data-cs-reveal style={{ transitionDelay: `${i * 0.06}s` }}>
              <span className="cs-step-n">{String(i + 1).padStart(2, '0')}</span>
              <span className="material-symbols-outlined" aria-hidden="true">
                {s.icon}
              </span>
              <strong>{s.title}</strong>
              <span>{s.text}</span>
            </li>
          ))}
        </ol>
      </div>
    </section>
  )
}

function Faq() {
  const [open, setOpen] = useState(0)
  return (
    <section className="cs-faq" id="faq">
      <div className="cs-wrap cs-faq-inner">
        <div className="cs-section-head" data-cs-reveal>
          <span className="cs-kicker">FAQ</span>
          <h2 className="cs-h2">Good questions.</h2>
          <p className="cs-lead">
            Anything else? Call {CONTACTS.people[0].name.split(' ')[0]} on{' '}
            <a href={`tel:${CONTACTS.people[0].tel}`}>{CONTACTS.people[0].phone}</a>.
          </p>
        </div>
        <div className="cs-faq-list">
          {FAQS.map((f, i) => (
            <div key={f.q} className={`cs-faq-item${open === i ? ' is-open' : ''}`}>
              <button type="button" aria-expanded={open === i} onClick={() => setOpen(open === i ? -1 : i)}>
                {f.q}
                <span className="cs-faq-plus" aria-hidden="true" />
              </button>
              <div className="cs-faq-a">
                <p>{f.a}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

function Enrol({ course, setCourse }) {
  const [form, setForm] = useState({ name: '', phone: '', email: '', org: '', city: '', note: '' })
  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }))
  const formRef = useRef(null)
  const picked = COURSES.find((c) => c.id === course) || COURSES[0]

  const body = () =>
    [
      'COURSE ENROLMENT',
      `Course: ${picked.title}`,
      `Name: ${form.name}`,
      `Phone: ${form.phone}`,
      `Email: ${form.email}`,
      `School / college / company: ${form.org || '—'}`,
      `City: ${form.city || '—'}`,
      form.note ? `\n${form.note}` : '',
    ].join('\n')

  const submit = (e) => {
    e.preventDefault()
    if (ENROL.online && ENROL.url) {
      window.open(ENROL.url, '_blank', 'noopener')
      return
    }
    window.open(`${CONTACTS.whatsapp}&text=${encodeURIComponent(body())}`, '_blank', 'noopener')
  }

  return (
    <section className="cs-enrol" id="enrol">
      <div className="cs-wrap cs-enrol-inner">
        <div className="cs-enrol-intro" data-cs-reveal>
          <span className="cs-kicker">ENROL</span>
          <h2 className="cs-h2">Reserve your seat.</h2>
          <p className="cs-lead">Choose a course and tell us about yourself. Seats in each batch are limited.</p>
          <div className="cs-enrol-course">
            <img src={picked.img} alt="" />
            <div>
              <span className="cs-kicker">{trackLabel(picked.group)}</span>
              <strong>{picked.title}</strong>
              <span>{picked.audience}</span>
            </div>
          </div>
          {!ENROL.online && (
            <p className="cs-enrol-note">
              <span className="material-symbols-outlined" aria-hidden="true">
                info
              </span>
              Online payment is launching soon. For now, send your details and our team will call you to confirm your seat
              and payment.
            </p>
          )}
        </div>

        <form className="cs-form" ref={formRef} onSubmit={submit} data-cs-reveal>
          <label className="cs-field cs-field--full">
            <span>Course</span>
            <select value={picked.id} onChange={(e) => setCourse(e.target.value)}>
              {GROUPS.map((g) => (
                <optgroup key={g.key} label={g.label}>
                  {COURSES.filter((c) => c.group === g.key).map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.title}
                    </option>
                  ))}
                </optgroup>
              ))}
            </select>
          </label>
          <label className="cs-field">
            <span>Full name *</span>
            <input required value={form.name} onChange={set('name')} autoComplete="name" />
          </label>
          <label className="cs-field">
            <span>Phone *</span>
            <input required type="tel" inputMode="tel" value={form.phone} onChange={set('phone')} autoComplete="tel" />
          </label>
          <label className="cs-field">
            <span>Email *</span>
            <input required type="email" value={form.email} onChange={set('email')} autoComplete="email" />
          </label>
          <label className="cs-field">
            <span>School / college / company</span>
            <input value={form.org} onChange={set('org')} autoComplete="organization" />
          </label>
          <label className="cs-field">
            <span>City</span>
            <input value={form.city} onChange={set('city')} autoComplete="address-level2" />
          </label>
          <label className="cs-field cs-field--full">
            <span>Anything we should know?</span>
            <textarea rows={3} value={form.note} onChange={set('note')} placeholder="Experience, preferred dates, questions…" />
          </label>
          <div className="cs-launch cs-launch--form cs-field--full">
            <FlyingButton {...FLY} altitude={130} onClick={() => formRef.current?.requestSubmit()}>
              {ENROL.online ? 'Continue to payment →' : 'Send enrolment request →'}
            </FlyingButton>
          </div>
        </form>
      </div>
    </section>
  )
}

function Footer() {
  return (
    <footer className="cs-footer">
      <div className="cs-wrap cs-footer-inner">
        <div>
          <a className="cs-brand" href={MAIN_SITE}>
            <img src={logo} alt="" />
            <span>
              SKY EYE
              <em>COURSES</em>
            </span>
          </a>
          <p>Training by Sky Eye Technology (SET) Pvt. Ltd. · {CONTACTS.address}</p>
        </div>
        <ul>
          {CONTACTS.people.map((p) => (
            <li key={p.tel}>
              <a href={`tel:${p.tel}`}>
                {p.name} · {p.phone}
              </a>
            </li>
          ))}
          <li>
            <a href={`mailto:${CONTACTS.email}`}>{CONTACTS.email}</a>
          </li>
          <li>
            <a href={MAIN_SITE}>skyeyetechnology.in →</a>
          </li>
        </ul>
      </div>
    </footer>
  )
}

export default function CoursesSite() {
  useSmoothScroll()
  const rootRef = useRef(null)
  // The chosen course; a #course-<id> link (e.g. from the main site) opens it
  const [sel, setSel] = useState(() => {
    const m = /^#course-(.+)$/.exec(window.location.hash)
    return { i: Math.max(m ? COURSES.findIndex((c) => c.id === m[1]) : 0, 0), dir: 1 }
  })
  const [course, setCourse] = useState(COURSES[0].id)
  useCourseAnimations(rootRef)

  useEffect(() => {
    if (!/^#course-/.test(window.location.hash)) return
    const t = setTimeout(() => scrollToId('courses', -40), 500)
    return () => clearTimeout(t)
  }, [])

  useEffect(() => {
    document.title = 'Courses — Sky Eye Technology'
  }, [])

  // Smooth in-page anchor scrolling through Lenis
  useEffect(() => {
    const onClick = (e) => {
      const a = e.target.closest?.('a[href^="#"]')
      if (!a) return
      const href = a.getAttribute('href')
      const m = /^#course-(.+)$/.exec(href)
      if (m) {
        const idx = COURSES.findIndex((c) => c.id === m[1])
        if (idx < 0) return
        e.preventDefault()
        setSel((p) => towards(p, idx))
        scrollToId('courses', -40)
        return
      }
      const el = document.getElementById(href.slice(1))
      if (!el) return
      e.preventDefault()
      if (window.__lenis) window.__lenis.scrollTo(el, { offset: -70 })
      else el.scrollIntoView({ behavior: 'smooth' })
    }
    document.addEventListener('click', onClick)
    return () => document.removeEventListener('click', onClick)
  }, [])

  const enrolIn = (id) => {
    setCourse(id)
    const el = document.getElementById('enrol')
    if (window.__lenis) window.__lenis.scrollTo(el, { offset: -70 })
    else el?.scrollIntoView({ behavior: 'smooth' })
  }

  return (
    <div className="cs-root" ref={rootRef}>
      <Header />
      <main>
        <Hero />
        <CourseDroneJourney />
        <Explorer sel={sel} setSel={setSel} onEnrol={enrolIn} />
        <HowItWorks />
        <Faq />
        <Enrol course={course} setCourse={setCourse} />
      </main>
      <Footer />
    </div>
  )
}
