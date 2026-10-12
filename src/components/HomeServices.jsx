import { brochureCrop, newPhoto, photo } from '../cdn'

// Home-page summary of the three services. Each block gives the gist and
// links through to its full page.
const BLOCKS = [
  {
    num: '01',
    kicker: 'SKYVERTISING',
    title: 'Your brand in the sky.',
    text: 'Advertising that takes your brand beyond traditional media — banners and LED displays flown above events, launches and public gatherings, day or night.',
    chips: ['Banner Towing', 'Skywriting', 'Aerial Advertising', 'Drone Advertising', 'Sky Displays'],
    img: brochureCrop('led-net-city', 'w-1100,h-760,fo-auto,q-78'),
    alt: 'Drone flying an LED net with the Sky Eye logo over a night skyline',
    page: '#/services/skyvertising',
    service: 'Skyvertising',
  },
  {
    num: '02',
    kicker: 'DRONE AS A SERVICE',
    title: 'All the drone. None of the hassle.',
    text: 'The outcome without owning a drone. We bring the aircraft, the crew, the planning and the permissions — and hand over the finished work.',
    chips: ['Agricultural spraying', 'Mapping & survey', 'Thermal inspection', 'Construction monitoring', 'Aerial photo & video', 'Surveillance support'],
    img: photo('agri', 141, 'w-1100,h-760,fo-auto,q-78'),
    alt: 'Spraying drone flying low over a wheat field',
    page: '#/services/drone-as-a-service',
    service: 'Drone as a Service',
  },
  {
    num: '03',
    kicker: 'COURSES',
    title: "Don't just learn it. Build it.",
    text: 'Five live, hands-on courses for schools, colleges, professionals and defence training units.',
    chips: ['Generative AI', 'Data Analytics', 'Drone Basics & Assembly', 'FPV Operations & R&D', 'Advanced Drone Engineering'],
    img: newPhoto('genai-speaker', 'w-1100,h-760,fo-auto,q-78'),
    alt: 'Instructor explaining generative AI to a class',
    page: '#/services/courses',
    service: 'Courses',
  },
]

export default function HomeServices() {
  return (
    <section className="home-services" id="home-services">
      <div className="container py-2xl">
        <div className="home-services-head">
          <div>
            <span className="section-label">02 / OUR SERVICES</span>
            <h2 className="section-h2">THREE WAYS WE FLY FOR YOU.</h2>
          </div>
          <p className="section-desc">
            On your brand, on your site and in your classroom. Each service has its own page with the
            full details.
          </p>
        </div>

        <div className="home-services-list">
          {BLOCKS.map((b, i) => (
            <article key={b.num} className={`hs-block${i % 2 ? ' hs-block--flip' : ''}`}>
              <a className="hs-media" href={b.page} aria-label={`${b.kicker} — full page`}>
                <img src={b.img} alt={b.alt} loading="lazy" />
                <span className="hs-num">{b.num}</span>
              </a>
              <div className="hs-body">
                <span className="sky-kicker">{b.kicker}</span>
                <h3 className="hs-title">{b.title}</h3>
                <p className="hs-text">{b.text}</p>
                <ul className="hs-chips">
                  {b.chips.map((c) => (
                    <li key={c}>{c}</li>
                  ))}
                </ul>
                <div className="hs-actions">
                  <a className="btn-request btn-request--sm" href="#/contact" data-service={b.service}>
                    Request this service
                  </a>
                  <a className="hs-more" href={b.page}>
                    View full page →
                  </a>
                </div>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  )
}
