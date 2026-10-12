import { useEffect, useRef, useState } from 'react'
import { gsap } from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { ik } from '../cdn'

const logoMarkLight = ik('site/logo-mark-light.png', 'h-200')

gsap.registerPlugin(ScrollTrigger)

// Field imagery from the stock library — deployments, training programmes,
// lab benches and hand-overs — cycled across the scatter/line/circle formation.
// `title`/`desc` feed the hover preview panel on the left.
const GALLERY_IMAGES = [
  {
    src: ik('stock/field-01.jpg', 'w-640,q-70'),
    title: 'Recognition On Stage',
    desc: 'The Sky Eye team collecting certificates at a state startup showcase — the programme that opened our first school partnerships.',
    alt: 'Sky Eye team lined up on stage holding certificates at a startup showcase',
  },
  {
    src: ik('stock/field-02.jpg', 'w-640,q-70'),
    title: 'Full-House Briefing',
    desc: 'A school hall packed for an introductory session on autonomous flight, sensing and what a drone actually has to survive in the field.',
    alt: 'Students seated across a school hall during an introductory drone session',
  },
  {
    src: ik('stock/field-03.jpg', 'w-640,q-70'),
    title: 'Classroom Session',
    desc: 'An engineer walking a mixed-age classroom through airframe design, flight controllers and the trade-offs behind endurance.',
    alt: 'Instructor addressing a crowded classroom of students',
  },
  {
    src: ik('stock/field-04.jpg', 'w-640,q-70'),
    title: 'Outreach Programme',
    desc: 'Regional outreach: bringing working hardware into classrooms that would otherwise only ever see a drone on a screen.',
    alt: 'Students seated in a classroom during a Sky Eye outreach programme',
  },
  {
    src: ik('stock/field-05.jpg', 'w-640,q-70'),
    title: 'Computer Lab Briefing',
    desc: 'Ground-station and mission-planning software demonstrated station by station, one workstation per pair of students.',
    alt: 'Rows of students at monitors in a school computer lab',
  },
  {
    src: ik('stock/field-06.jpg', 'w-640,q-70'),
    title: 'Demo Bench Set Up',
    desc: 'The travelling demonstration bench going in before a session — airframe, controller, telemetry link and display.',
    alt: 'Demonstration bench being set up in a training lab',
  },
  {
    src: ik('stock/field-07.jpg', 'w-640,q-70'),
    title: 'Kit Distribution',
    desc: 'Build kits handed out across the lab. Every participant gets components in hand rather than a slide about them.',
    alt: 'Students receiving build kits at lab workstations',
  },
  {
    src: ik('stock/field-08.jpg', 'w-640,q-70'),
    title: 'Hands-On Build',
    desc: 'Working through the assembly sheet in small groups — motor mounts, wiring order, and where the centre of gravity has to land.',
    alt: 'Students working through an assembly sheet around a lab desk',
  },
  {
    src: ik('stock/field-09.jpg', 'w-640,q-70'),
    title: 'First Assembled Airframe',
    desc: 'A group holding up the quadcopter they built from parts that morning, ahead of its first tethered power-up.',
    alt: 'Students holding up a drone they assembled during a workshop',
  },
  {
    src: ik('stock/field-10.jpg', 'w-640,q-70'),
    title: 'Indoor Flight Area',
    desc: 'The turfed indoor flight space used for first flights — contained, repeatable, and safe enough for students to stand close.',
    alt: 'Presenter standing on an indoor turf flight area',
  },
  {
    src: ik('stock/field-11.jpg', 'w-640,q-70'),
    title: 'Flight Demonstration',
    desc: 'A live demonstration for a seated cohort: take-off, hold, waypoint run and return, narrated as it happens.',
    alt: 'Sky Eye staff member running a flight demonstration for seated students',
  },
  {
    src: ik('stock/field-12.jpg', 'w-640,q-70'),
    title: 'School Partnership',
    desc: 'Programme hand-over at a partner school — the point where a workshop becomes a standing part of the curriculum.',
    alt: 'Group photograph of students and staff outside a partner school',
  },
  {
    src: ik('stock/field-13.jpg', 'w-640,q-70'),
    title: 'Build Table',
    desc: 'Heads down over a shared build table, components laid out and the instruction sheet somewhere under all of it.',
    alt: 'Overhead view of students crowded around a build table with components',
  },
  {
    src: ik('stock/field-14.jpg', 'w-640,q-70'),
    title: 'Guided Assembly',
    desc: 'Assembly with an engineer on the floor, moving desk to desk as each group hits a different problem.',
    alt: 'Engineer guiding students through assembly at lab desks',
  },
  {
    src: ik('stock/field-15.jpg', 'w-640,q-70'),
    title: 'Completed Build',
    desc: 'The finished airframe passed around for inspection before flight checks — props off, battery out, everything visible.',
    alt: 'Students inspecting a completed drone build up close',
  },
  {
    src: ik('stock/field-16.jpg', 'w-640,q-70'),
    title: 'Junior Workshop',
    desc: 'The younger cohort working with simplified modules — sensors, motors and a controller they can wire without solder.',
    alt: 'Young students working with electronics modules at a table',
  },
  {
    src: ik('stock/field-17.jpg', 'w-640,q-70'),
    title: 'Lecture Hall Session',
    desc: 'The theory half: airframe classes, payload limits, regulation and where autonomy genuinely beats a human operator.',
    alt: 'Presentation underway in a lecture hall of seated students',
  },
  {
    src: ik('stock/field-18.jpg', 'w-640,q-70'),
    title: 'Facility Inauguration',
    desc: 'Opening a new lab with partner institutions — permanent bench space, tooling and a place for builds to stay put.',
    alt: 'Inauguration ceremony with the Sky Eye team and partner institutions',
  },
  {
    src: ik('stock/field-19.jpg', 'w-640,q-70'),
    title: 'Bench Soldering',
    desc: 'Avionics work at the bench. Power distribution and signal lines are soldered and inspected in-house, not outsourced.',
    alt: 'Engineer soldering an avionics board at a workbench',
  },
  {
    src: ik('stock/field-20.jpg', 'w-640,q-70'),
    title: 'Assembly & Test Lab',
    desc: 'The Bhubaneswar assembly and test lab, where every unit is built up, instrumented and run before it ships.',
    alt: 'Assembly and test work underway in the Sky Eye lab',
  },
]

const TOTAL_CARDS = 24
const CARDS = Array.from({ length: TOTAL_CARDS }, (_, i) => i % GALLERY_IMAGES.length)

export default function ImageMorphGallery() {
  const containerRef = useRef(null)
  const visualColRef = useRef(null)
  const cardsWrapRef = useRef(null)
  const introRef = useRef(null)
  const exploreRef = useRef(null)
  const logoRef = useRef(null)

  // `index` is kept on mouse-out and only replaced on the next mouse-in, so the
  // panel fades out with its content intact instead of blanking halfway
  // through the transition.
  const [preview, setPreview] = useState({ index: 0, active: false })
  const [canHover, setCanHover] = useState(false)

  useEffect(() => {
    // Hover preview is a fine-pointer affordance only — on touch there is no
    // hover state to drive it and the panel would cover the headline.
    const mq = window.matchMedia('(pointer: fine)')
    const sync = () => setCanHover(mq.matches)
    sync()
    mq.addEventListener('change', sync)
    return () => mq.removeEventListener('change', sync)
  }, [])

  useEffect(() => {
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    const container = containerRef.current
    const visualCol = visualColRef.current
    const cardsWrap = cardsWrapRef.current
    const intro = introRef.current
    const explore = exploreRef.current
    const logo = logoRef.current
    if (!container || !visualCol || !cardsWrap || !intro || !explore || !logo) return undefined

    if (prefersReducedMotion) {
      // Static, legible fallback: lay the cards out in a simple grid, no motion.
      const cards = cardsWrap.querySelectorAll('.morph-card-wrap')
      gsap.set(cards, { opacity: 1, x: 0, y: 0, rotation: 0, scale: 1, clearProps: 'transform' })
      return undefined
    }

    // The circle/line formation is sized against the visual column itself
    // (not the whole window) so it sits centered in its own half of the
    // section regardless of how much room the text column takes up.
    const getVisualSize = () => {
      const rect = visualCol.getBoundingClientRect()
      return { w: rect.width || window.innerWidth, h: rect.height || window.innerHeight }
    }

    // Sized to fill a good share of the visual column, but capped so the
    // ring's own cards (measured, since their height is responsive) never
    // clip against the column's overflow: hidden edges, top or bottom.
    const getRadius = () => {
      const { w, h } = getVisualSize()
      const sampleCard = cardsWrap.querySelector('.morph-card-wrap')
      const cardH = sampleCard ? sampleCard.getBoundingClientRect().height : 150
      const maxByHeight = h / 2 - cardH / 2 - 16
      return Math.max(110, Math.min(260, w * 0.3, maxByHeight))
    }

    const ctx = gsap.context(() => {
      const cards = cardsWrap.querySelectorAll('.morph-card-wrap')

      gsap.set(cards, {
        x: () => (Math.random() - 0.5) * getVisualSize().w * 0.9,
        y: () => (Math.random() - 0.5) * getVisualSize().h * 0.9,
        rotation: () => (Math.random() - 0.5) * 80,
        scale: () => 0.4 + Math.random() * 0.3,
        opacity: 0,
      })
      gsap.set(logo, { opacity: 0, scale: 0.55 })

      const introTimeline = gsap.timeline({ paused: true })

      introTimeline.to(cards, {
        opacity: 1,
        duration: 0.8,
        stagger: 0.02,
        ease: 'power2.out',
      })

      // Scatter -> line
      introTimeline.to(
        cards,
        {
          x: (i) => {
            const spacing = getVisualSize().w < 420 ? 13 : 24
            return (i - (TOTAL_CARDS - 1) / 2) * spacing
          },
          y: 0,
          rotation: 0,
          scale: 1,
          duration: 1.2,
          stagger: 0.02,
          ease: 'power3.inOut',
        },
        '+=0.4'
      )

      // Line -> circle
      introTimeline.to(
        cards,
        {
          x: (i) => {
            const R = getRadius()
            const angle = (i / TOTAL_CARDS) * 2 * Math.PI
            return R * Math.cos(angle)
          },
          y: (i) => {
            const R = getRadius()
            const angle = (i / TOTAL_CARDS) * 2 * Math.PI
            return R * Math.sin(angle)
          },
          rotation: (i) => {
            const angle = (i / TOTAL_CARDS) * 2 * Math.PI
            return Math.sin(angle) * 15
          },
          scale: 1,
          duration: 1.4,
          stagger: 0.015,
          ease: 'elastic.out(1, 0.85)',
        },
        '+=1.0'
      )

      // Mark settles into the hole once the ring has closed around it.
      introTimeline.to(
        logo,
        { opacity: 1, scale: 1, duration: 0.9, ease: 'back.out(1.6)' },
        '-=0.75'
      )

      const scrollTimeline = gsap.timeline({
        scrollTrigger: {
          trigger: container,
          start: 'top top',
          end: 'bottom bottom',
          scrub: 0.6,
          invalidateOnRefresh: true,
        },
      })

      scrollTimeline.to(intro, { opacity: 0, y: -30, duration: 0.35 }, 0)
      scrollTimeline.to(explore, { opacity: 1, y: 0, duration: 0.45 }, 0.15)

      scrollTimeline.to(cardsWrap, { rotation: 180, ease: 'none', duration: 2.0 }, 0)

      scrollTimeline.to(
        cards,
        {
          rotation: (i) => {
            const angle = (i / TOTAL_CARDS) * 2 * Math.PI
            const initialRot = Math.sin(angle) * 15
            return initialRot - 180
          },
          ease: 'none',
          duration: 2.0,
        },
        0
      )

      const xTo = gsap.quickTo(cardsWrap, 'x', { duration: 0.8, ease: 'power2.out' })
      const handlePointerMove = (e) => {
        const px = (e.clientX / window.innerWidth) * 2 - 1
        xTo(px * 30)
      }
      window.addEventListener('pointermove', handlePointerMove, { passive: true })

      // ScrollTrigger (rather than a plain IntersectionObserver) so a scroll
      // that jumps straight past this section in one commit — a restored
      // scroll position, an anchor jump, etc. — still resolves correctly:
      // it evaluates the trigger's state against the current scroll position
      // immediately, instead of only reacting to a future intersection change.
      const entryTrigger = ScrollTrigger.create({
        trigger: container,
        start: 'top bottom',
        once: true,
        onEnter: () => introTimeline.play(),
        onRefresh: (self) => {
          if (self.progress > 0) introTimeline.progress(1)
        },
      })

      return () => {
        entryTrigger.kill()
        window.removeEventListener('pointermove', handlePointerMove)
      }
    }, containerRef)

    return () => ctx.revert()
  }, [])

  const shown = GALLERY_IMAGES[preview.index]
  const isPreviewing = canHover && preview.active

  return (
    <div ref={containerRef} className="morph-page-container" >
      <div className="morph-viewport">
        <div className="morph-text-col">
          <div ref={introRef} className="morph-text-overlay">
            <span className="section-label">01 / GALLERY</span>
            <h2>ONE PLATFORM. EVERY ENVIRONMENT.</h2>
            <p>{canHover ? 'Hover any frame to preview · Scroll to explore' : 'Scroll to explore'}</p>
          </div>

          <div ref={exploreRef} className="morph-text-overlay morph-text-overlay--explore">
            <span className="section-label">SKY EYE TECHNOLOGY</span>
            <h2>LABS. CLASSROOMS. FIELD DEPLOYMENTS.</h2>
            <p>From bench assembly to live flight operations</p>
          </div>

          <div className={`morph-preview${isPreviewing ? ' is-active' : ''}`} aria-hidden="true">
            <div className="morph-preview__frame">
              <img key={preview.index} src={shown.src} alt="" />
              <span className="morph-preview__index">
                {String(preview.index + 1).padStart(2, '0')} / {String(GALLERY_IMAGES.length).padStart(2, '0')}
              </span>
            </div>
            <div className="morph-preview__meta">
              <h3 className="morph-preview__title">{shown.title}</h3>
              <p className="morph-preview__desc">{shown.desc}</p>
            </div>
          </div>
        </div>

        <div className="morph-visual-col" ref={visualColRef}>
          <div
            ref={cardsWrapRef}
            className={`morph-cards-inner-wrap${isPreviewing ? ' is-focused' : ''}`}
            aria-hidden="true"
          >
            {CARDS.map((imgIndex, i) => (
              <div
                key={i}
                className="morph-card-wrap"
                onMouseEnter={canHover ? () => setPreview({ index: imgIndex, active: true }) : undefined}
                onMouseLeave={canHover ? () => setPreview((p) => ({ ...p, active: false })) : undefined}
              >
                <div className="morph-card-inner">
                  <img src={GALLERY_IMAGES[imgIndex].src} alt="" loading="lazy" />
                </div>
              </div>
            ))}
          </div>

          <div className="morph-ring-logo" aria-hidden="true">
            <img ref={logoRef} src={logoMarkLight} alt="" />
          </div>
        </div>
      </div>
    </div>
  )
}
