import { brochureCrop, photo } from '../cdn'

const services = [
  {
    num: '01',
    href: '#/services/skyvertising',
    title: 'SKYVERTISING',
    desc: 'Advertising in the sky — banner towing, skywriting, drone advertising and illuminated sky displays for events, launches and campaigns.',
    img: brochureCrop('led-net-city', 'w-480,h-300,fo-auto'),
    alt: 'Heavy-lift drone carrying an LED net banner over a city skyline at night',
  },
  {
    num: '02',
    href: '#/services/courses',
    title: 'COURSES · LIVE',
    desc: 'Five live courses — Generative AI, Data Analytics, and drones from school basics to FPV and advanced engineering.',
    img: photo('course', 24, 'w-480,h-300,fo-auto'),
    alt: 'Speaker addressing a full lecture hall at KIIT University',
  },
  {
    num: '03',
    href: '#/services/drone-as-a-service',
    title: 'DRONE AS A SERVICE',
    desc: 'The outcome without owning a drone — spraying, mapping, inspection, filming, surveillance support and more, flown by our crew.',
    img: photo('agri', 141, 'w-480,h-300,fo-auto'),
    alt: 'Spraying drone flying low over a wheat field',
  },
]

export default function ServicesIntro() {
  return (
    <section className="section-what">
      <div className="container section-what-inner">
        <div className="section-header">
          <span className="section-label">OUR SERVICES</span>
          <h2 className="section-h2">THREE WAYS WE FLY FOR YOU.</h2>
          <p className="section-desc">
            Sky Eye Technology puts drones to work on your brand, in your classroom and on your
            site. Pick a service to see what it covers.
          </p>
        </div>

        <div className="category-list">
          {services.map((s) => (
            <a key={s.num} className="category-item" href={s.href}>
              <div className="category-grid">
                <div className="cat-num-title">
                  <span className="cat-num">{s.num}</span>
                  <h3 className="cat-title">{s.title}</h3>
                </div>
                <div className="cat-desc">
                  <p className="cat-desc-text">{s.desc}</p>
                </div>
                <div className="cat-img-wrap">
                  <div className="cat-img-box">
                    <img src={s.img} alt={s.alt} loading="lazy" />
                  </div>
                </div>
                <div className="cat-arrow">
                  <span className="cat-arrow-icon">→</span>
                </div>
              </div>
            </a>
          ))}
        </div>
      </div>
    </section>
  )
}
