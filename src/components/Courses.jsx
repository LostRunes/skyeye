import { useEffect, useRef, useState } from 'react'
import { clip, photo, poster } from '../cdn'
import useIsMobile from '../hooks/useIsMobile'

const COURSES = [
  {
    id: 'genai',
    tag: 'UNIVERSITY',
    title: 'Generative AI — from LLMs to AI agents',
    desc: 'A hands-on workshop on large language models and agentic AI, run live in the lecture hall with students building alongside the session.',
    meta: ['Live workshop', 'Laptops in hall', 'Q&A on the floor'],
    where: 'Delivered at KIIT University, Bhubaneswar',
    img: photo('course', 36, 'w-1200,q-75'),
  },
  {
    id: 'drone',
    tag: 'SCHOOLS · COLLEGES',
    title: 'Drone technology & piloting',
    desc: 'How drones fly, what they carry and where they work — then students wire motors, assemble airframes and rehearse in the simulator before supervised flights on open ground.',
    meta: ['Build kits', 'Simulator lab', 'Line-of-sight flights'],
    where: 'Delivered at International Delhi Public School and partner schools',
    img: photo('edu', 356, 'w-1200,q-75'),
  },
  {
    id: 'forces',
    tag: 'POLICE · ARMED FORCES',
    title: 'Drone operations for uniformed services',
    desc: 'Classroom fundamentals followed by live surveillance demonstrations, flown for and with police and paramilitary units.',
    meta: ['Briefing', 'Live demo flights', 'Operational use cases'],
    where: 'Delivered for police and CRPF personnel',
    img: photo('govt', 569, 'w-1200,q-75'),
  },
  {
    id: 'labs',
    tag: 'INSTITUTIONS',
    title: 'Drone labs (D Labs) & robotics',
    desc: 'Permanent lab set-ups with training benches, airframes, controllers and curriculum — robotics, firmware and edge AI alongside UAVs.',
    meta: ['Lab set-up', 'Training benches', 'Robotics & edge AI'],
    where: 'Set up on partner campuses',
    img: photo('labs', 592, 'w-1200,q-75'),
  },
]

const STRIP = [
  ['course', 64, 'Sky Eye team with KIIT students after the generative-AI workshop'],
  ['edu', 325, 'Army personnel in a "What is a drone" classroom session'],
  ['edu', 335, 'Student soldering a drone frame on the bench'],
  ['govt', 580, 'Drone airborne during a live demonstration for police officers'],
  ['edu', 350, 'Students at International Delhi Public School holding drone parts'],
  ['labs', 596, 'Controllers, frames and propellers laid out in a drone lab'],
  ['course', 76, 'Sky Eye instructor helping students during a live session'],
  ['edu', 371, 'Sky Eye team on stage at a startup awards ceremony'],
]

function CourseMedia({ course }) {
  const ref = useRef(null)
  const isMobile = useIsMobile()
  useEffect(() => {
    const v = ref.current
    if (!v || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return
    const io = new IntersectionObserver(([e]) => (e.isIntersecting ? v.play().catch(() => {}) : v.pause()), {
      threshold: 0.25,
    })
    io.observe(v)
    return () => io.disconnect()
  }, [course.id, isMobile])

  if (course.video && !isMobile) {
    return (
      <video
        key={course.id}
        ref={ref}
        src={clip(course.video)}
        poster={poster(course.video)}
        muted
        loop
        playsInline
        preload="none"
        aria-label={course.title}
      />
    )
  }
  return <img key={course.id} src={course.img} alt={course.title} loading="lazy" />
}

export default function Courses() {
  const [active, setActive] = useState(0)
  const course = COURSES[active]

  return (
    <section className="section-courses" id="courses">
      <div className="container py-2xl">
        <div className="courses-head">
          <div>
            <span className="section-label">06.2 / COURSES</span>
            <h2 className="section-h2">DON'T JUST LEARN TECHNOLOGY. BUILD IT.</h2>
          </div>
          <p className="section-desc">
            Live, in-person programmes across drones, robotics and AI. Students, engineers and
            uniformed services get real hardware in hand — assembly, simulation and flight, not
            slides about them.
          </p>
        </div>

        <div className="courses-board">
          <div className="courses-tabs" role="tablist" aria-label="Courses">
            {COURSES.map((c, i) => (
              <button
                key={c.id}
                role="tab"
                id={`course-tab-${c.id}`}
                aria-selected={i === active}
                aria-controls="course-panel"
                className={`course-tab${i === active ? ' is-active' : ''}`}
                onClick={() => setActive(i)}
              >
                <span className="course-tab-top">
                  <span className="course-tab-tag">{c.tag}</span>
                  <span className="course-live">
                    <span className="course-live-dot" />
                    LIVE
                  </span>
                </span>
                <span className="course-tab-title">{c.title}</span>
              </button>
            ))}
          </div>

          <div className="course-panel" id="course-panel" role="tabpanel" aria-labelledby={`course-tab-${course.id}`}>
            <div className="course-media">
              <CourseMedia course={course} />
              <span className="course-media-badge">● LIVE · ENROLLING</span>
            </div>
            <div className="course-body">
              <h3 className="course-title">{course.title}</h3>
              <p className="course-desc">{course.desc}</p>
              <ul className="course-meta">
                {course.meta.map((m) => (
                  <li key={m}>{m}</li>
                ))}
              </ul>
              <div className="course-foot">
                <span className="course-where">{course.where}</span>
                <a className="btn-primary" href="#contact" data-service="Courses">
                  [ Enquire about this course → ]
                </a>
              </div>
            </div>
          </div>
        </div>

        <div className="courses-strip" aria-label="From our sessions">
          {STRIP.map(([cat, n, alt]) => (
            <figure key={`${cat}-${n}`} className="courses-strip-item">
              <img src={photo(cat, n, 'w-520,h-360,fo-auto,q-70')} alt={alt} loading="lazy" />
            </figure>
          ))}
        </div>
      </div>
    </section>
  )
}
