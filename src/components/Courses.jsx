import { useEffect, useState } from 'react'
import { parseHash } from '../router'
import { COURSES, GROUPS } from '../data/courses'
import { photo } from '../cdn'


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

// A link like #/training?to=course-tab-drone-fpv opens that course's tab
const courseFromHash = () => {
  const to = parseHash().to || ''
  const i = COURSES.findIndex((c) => `course-tab-${c.id}` === to)
  return i < 0 ? null : i
}

export default function Courses() {
  const [active, setActive] = useState(() => courseFromHash() ?? 0)

  useEffect(() => {
    const onHash = () => {
      const i = courseFromHash()
      if (i !== null) setActive(i)
    }
    window.addEventListener('hashchange', onHash)
    return () => window.removeEventListener('hashchange', onHash)
  }, [])
  const course = COURSES[active]

  return (
    <section className="section-courses" id="training">
      <div className="container py-2xl">
        <div className="courses-head">
          <div>
            <span className="section-label">EDUCATION &amp; TRAINING</span>
            <h2 className="section-h2">DON'T JUST LEARN TECHNOLOGY. BUILD IT.</h2>
          </div>
          <p className="section-desc">
            Five live, in-person courses — two in AI and data, three in drones from school basics
            to FPV and advanced engineering. Real hardware and real projects, not slides about them.
          </p>
        </div>

        <div className="courses-board">
          <div className="courses-tabs" role="tablist" aria-label="Courses">
            {GROUPS.map((g) => (
              <div key={g.key} className="course-group">
                <span className="course-group-label">{g.label}</span>
                {COURSES.map((c, i) =>
                  c.group !== g.key ? null : (
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
                        <span className="course-tab-tag">{c.level.toUpperCase()}</span>
                        <span className="course-live">
                          <span className="course-live-dot" />
                          LIVE
                        </span>
                      </span>
                      <span className="course-tab-title">{c.title}</span>
                      {c.program && <span className="course-tab-program">{c.program}</span>}
                    </button>
                  )
                )}
              </div>
            ))}
          </div>

          <div className="course-panel" id="course-panel" role="tabpanel" aria-labelledby={`course-tab-${course.id}`}>
            <div className="course-media">
              <img key={course.id} src={course.img} alt={course.title} loading="lazy" />
              <span className="course-media-badge">● LIVE · {course.level.toUpperCase()}</span>
              {course.instructor && (
                <div className="course-instructor">
                  <img src={course.instructor.img} alt="" />
                  <span>
                    <strong>{course.instructor.name}</strong>
                    {course.instructor.role}
                  </span>
                </div>
              )}
            </div>
            <div className="course-body">
              <span className="course-audience">FOR · {course.audience.toUpperCase()}</span>
              <h3 className="course-title">{course.title}</h3>
              {course.program && <p className="course-program">{course.program}</p>}
              <p className="course-desc">{course.desc}</p>

              <div className="course-modules">
                <span className="course-modules-label">WHAT YOU WILL LEARN</span>
                <ol>
                  {course.modules.map(([t, d], i) => (
                    <li key={t}>
                      <span className="course-module-num">{String(i + 1).padStart(2, '0')}</span>
                      <span>
                        <strong>{t}</strong>
                        {d}
                      </span>
                    </li>
                  ))}
                </ol>
              </div>

              <ul className="course-meta">
                {course.format.map((m) => (
                  <li key={m}>{m}</li>
                ))}
              </ul>
              <div className="course-foot">
                <a className="btn-request" href="#/training?to=training-enquiry" data-service={`Course: ${course.title}`}>
                  Enquire about this course
                  <span className="material-symbols-outlined" aria-hidden="true">arrow_forward</span>
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
