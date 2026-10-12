import { brochureCrop, photo } from '../cdn'

const services = [
  {
    num: '06.1',
    href: '#skyvertising',
    title: 'SKYVERTISING',
    desc: 'Drone advertisement shows — posters and LED-lit banners flown above events, festivals and public gatherings.',
    img: brochureCrop('led-net-city', 'w-480,h-300,fo-auto'),
    alt: 'Heavy-lift drone carrying an LED net banner over a city skyline at night',
  },
  {
    num: '06.2',
    href: '#courses',
    title: 'COURSES · LIVE',
    desc: 'Live drone, robotics and generative-AI programmes for schools, universities, police and the armed forces.',
    img: photo('course', 24, 'w-480,h-300,fo-auto'),
    alt: 'Speaker addressing a full lecture hall at KIIT University',
  },
  {
    num: '06.3',
    href: '#drone-services',
    title: 'DRONE SERVICES',
    desc: 'Agricultural spraying, mapping and survey, thermal inspection, public safety and aerial cinematography.',
    img: photo('agri', 141, 'w-480,h-300,fo-auto'),
    alt: 'Spraying drone flying low over a wheat field',
  },
]

export default function ServicesIntro() {
  return (
    <section className="section-what">
      <div className="container section-what-inner">
        <div className="section-header">
          <span className="section-label">06 / OUR SERVICES</span>
          <h2 className="section-h2">THREE WAYS WE FLY FOR YOU.</h2>
          <p className="section-desc">
            Sky Eye Technology puts the same airframes and the same team to work on your brand, in
            your classroom and over your site.
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
