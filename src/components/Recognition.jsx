import { useEffect, useRef, useState } from 'react'
import { ik } from '../cdn'

const mil1 = ik('site/mil-1.jpg', 'w-1000,q-75')
const mil2 = ik('site/mil-2.jpg', 'w-1000,q-75')
const mil3 = ik('site/mil-3.jpg', 'w-1000,q-75')
const mil4 = ik('site/mil-4.jpg', 'w-1000,q-75')
const dir1 = ik('site/dir-1.jpg', 'w-1000,q-75')
const dir2 = ik('site/dir-2.jpg', 'w-1000,q-75')
const dir3 = ik('site/dir-3.jpg', 'w-1000,q-75')
const dir4 = ik('site/dir-4.jpg', 'w-1000,q-75')
const dir5 = ik('site/dir-5.jpg', 'w-1000,q-75')
const dir6 = ik('site/dir-6.jpg', 'w-1000,q-75')
const dir7 = ik('site/dir-7.jpg', 'w-1000,q-75')
const dir8 = ik('site/dir-8.jpg', 'w-1000,q-75')

const groups = [
  {
    name: 'Government Awards',
    left: {
      img: mil1,
      label: 'On record',
      alt: 'Sky Eye Technology founders on stage at a government startup awards ceremony holding certificates',
      caption: 'Recognised on stage at a state startup programme alongside the cohort of selected ventures.'
    },
    right: {
      img: mil2,
      label: 'In service',
      alt: 'Army personnel seated in a Sky Eye Technology classroom session on drone fundamentals',
      caption: 'The same programme now runs as structured drone instruction for uniformed services.'
    }
  },
  {
    name: 'Gov Approved',
    left: {
      img: mil3,
      label: 'On record',
      alt: 'Sky Eye Technology team briefing police officers outside a district police station',
      caption: 'Cleared for operational briefings with district police leadership before deployment.'
    },
    right: {
      img: mil4,
      label: 'In service',
      alt: 'Sky Eye Technology drone airborne during a live demonstration for police personnel',
      caption: 'Airborne on approved duty — live surveillance demonstration flown for the unit.'
    }
  },
  {
    name: 'Campus Builds',
    left: {
      img: dir1,
      label: 'The build',
      alt: 'Student holding a hand-built fixed-wing UAV with a solar-panelled wing on a campus lawn',
      caption: 'Fixed-wing airframes built end to end by students on our campus programme.'
    },
    right: {
      img: dir2,
      label: 'The handover',
      alt: 'School students gathered around a drone during a Sky Eye Technology campus session',
      caption: 'Handed to the next batch at International Delhi Public School — controls, checks, first flight.'
    }
  },
  {
    name: 'Build Labs',
    left: {
      img: dir3,
      label: 'The bench',
      alt: 'School students leaning over a workbench wiring a drone motor and electronic speed controller',
      caption: 'Motors, ESCs and wiring diagrams — students assemble the airframe themselves.'
    },
    right: {
      img: dir4,
      label: 'The floor',
      alt: 'Two Sky Eye Technology engineers assembling a carbon fibre drone frame in the workshop',
      caption: 'The same build discipline our engineers run on the production floor.'
    }
  },
  {
    name: 'Flight Training',
    left: {
      img: dir5,
      label: 'Live flight',
      alt: 'Trainees standing around two quadcopters preparing to launch on an open ground',
      caption: 'Supervised line-of-sight sorties on open ground, one airframe per trainee group.'
    },
    right: {
      img: dir6,
      label: 'Simulator lab',
      alt: 'School computer lab full of students running drone flight simulator software',
      caption: 'Every sortie is rehearsed first in the simulator lab — failures cost nothing there.'
    }
  },
  {
    name: 'School Assemblies',
    left: {
      img: dir7,
      label: 'The briefing',
      alt: 'Sky Eye Technology instructor addressing a full school auditorium of students',
      caption: 'Full-school briefings on how drones fly, what they carry and where they work.'
    },
    right: {
      img: dir8,
      label: 'The room',
      alt: 'Packed school auditorium of students watching a Sky Eye Technology drone demonstration',
      caption: 'Hundreds of students per session, across schools in the region.'
    }
  }
]

export default function Recognition() {
  const sectionRef = useRef(null)
  const stageRef = useRef(null)
  const [active, setActive] = useState(0)

  // One scroll step per pair, switched sharply: the index comes from which step
  // of the pinned section the scroll is in, and the pairs hard-cut between them.
  useEffect(() => {
    const section = sectionRef.current
    const stage = stageRef.current
    if (!section || !stage) return

    const last = groups.length - 1
    const root = document.documentElement
    const pinned = () => window.matchMedia('(min-width: 900px)').matches
    const canSnap = () =>
      pinned() && !window.matchMedia('(prefers-reduced-motion: reduce)').matches
    let frame = 0

    const update = () => {
      frame = 0
      if (!pinned()) {
        stage.style.setProperty('--pos', '0')
        stage.style.setProperty('--index', '0')
        root.classList.remove('rec-snapping')
        setActive(0)
        return
      }
      const rect = section.getBoundingClientRect()
      const step = (rect.height - window.innerHeight) / last
      // Two readings of the same scroll: a continuous one the centre names glide
      // along, and a rounded one the photographs cut on.
      const progress = step > 0
        ? Math.min(Math.max(-rect.top / step, 0), last)
        : 0
      const index = Math.round(progress)
      stage.style.setProperty('--pos', progress.toFixed(4))
      stage.style.setProperty('--index', String(index))
      setActive(index)

      // Snap only while between the first and last pair, with a few pixels of
      // release at each end — otherwise the outermost snap point keeps pulling the
      // page back and there is no way to scroll out of the section.
      const travelled = -rect.top
      const travel = rect.height - window.innerHeight
      const owns = travelled > 6 && travelled < travel - 6
      root.classList.toggle('rec-snapping', owns && canSnap())
    }

    const onScroll = () => {
      if (!frame) frame = requestAnimationFrame(update)
    }

    update()
    window.addEventListener('scroll', onScroll, { passive: true })
    window.addEventListener('resize', onScroll)
    return () => {
      if (frame) cancelAnimationFrame(frame)
      window.removeEventListener('scroll', onScroll)
      window.removeEventListener('resize', onScroll)
      root.classList.remove('rec-snapping')
    }
  }, [])

  return (
    <section
      className="section-recognition"
      id="track-record"
      ref={sectionRef}
      style={{ '--slides': groups.length }}
    >
      {groups.map((group, i) => (
        <span
          key={`snap-${group.name}`}
          className="rec-snap"
          style={{ top: `calc(${i} * (100% - 100vh) / ${groups.length - 1})` }}
          aria-hidden="true"
        />
      ))}
      <div className="rec-sticky">
        <div className="container rec-container">
          <div className="section-header rec-header">
            <span className="section-label">04 / TRACK RECORD</span>
            <h2 className="section-h2">ON RECORD. ON DUTY. ON CAMPUS.</h2>
          </div>

          <div className="rec-stage" ref={stageRef}>
            {groups.map((group, i) => (
              <div
                key={group.name}
                className={`rec-slide${i === active ? ' is-active' : ''}`}
                aria-hidden={i === active ? undefined : true}
              >
                <figure className="rec-frame">
                  <figcaption className="rec-frame-label">{group.left.label}</figcaption>
                  <div className="rec-frame-img">
                    <img src={group.left.img} alt={group.left.alt} loading="lazy" />
                  </div>
                  <figcaption className="rec-frame-caption">{group.left.caption}</figcaption>
                </figure>

                <p className="rec-slide-name">{group.name}</p>

                <figure className="rec-frame">
                  <figcaption className="rec-frame-label">{group.right.label}</figcaption>
                  <div className="rec-frame-img">
                    <img src={group.right.img} alt={group.right.alt} loading="lazy" />
                  </div>
                  <figcaption className="rec-frame-caption">{group.right.caption}</figcaption>
                </figure>
              </div>
            ))}

            <div className="rec-names" aria-hidden="true">
              <div className="rec-names-track">
                {groups.map((group, i) => (
                  <span
                    key={group.name}
                    className={`rec-name${i === active ? ' is-active' : ''}`}
                  >
                    {group.name}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
