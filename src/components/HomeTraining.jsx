import { newPhoto } from '../cdn'
import { COURSES } from '../data/courses'

// Home-page summary of Education & Training — its own section, separate from
// the services. Each course links straight to its tab on the Training page.
export default function HomeTraining() {
  return (
    <section className="home-training" id="home-training">
      <div className="container py-2xl">
        <div className="home-services-head">
          <div>
            <span className="section-label">03 / EDUCATION &amp; TRAINING</span>
            <h2 className="section-h2">DON'T JUST LEARN IT. BUILD IT.</h2>
          </div>
          <p className="section-desc">
            Live, hands-on training in drones and AI for schools, colleges, professionals and defence
            training units — real hardware and real projects, taught in person.
          </p>
        </div>

        <div className="ht-grid">
          <figure className="ht-media">
            <img src={newPhoto('classroom-hall', 'w-1200,q-78')} alt="Full lecture hall of students during a Sky Eye session" loading="lazy" />
            <figcaption>
              <span className="course-live">
                <span className="course-live-dot" />
                LIVE · IN PERSON
              </span>
            </figcaption>
          </figure>

          <ol className="ht-list">
            {COURSES.map((c, i) => (
              <li key={c.id}>
                <a className="ht-course" href={`#/training?to=course-tab-${c.id}`}>
                  <span className="ht-num">{String(i + 1).padStart(2, '0')}</span>
                  <span className="ht-body">
                    <span className="ht-tag">
                      {c.level} · {c.audience}
                    </span>
                    <span className="ht-title">{c.title}</span>
                  </span>
                  <span className="ht-arrow" aria-hidden="true">→</span>
                </a>
              </li>
            ))}
          </ol>
        </div>

        <div className="hs-actions ht-actions">
          <a className="btn-request btn-request--sm" href="#/contact" data-service="Training">
            Enquire about training
          </a>
          <a className="hs-more" href="#/training">
            View all courses →
          </a>
        </div>
      </div>
    </section>
  )
}
