import { useEffect, useRef } from 'react'
import { brochureCrop, clip, poster } from '../cdn'
import useIsMobile from '../hooks/useIsMobile'

// Content from the Sky Eye Skyvertising brochure.
const CREATE = [
  { icon: 'flight', title: 'Drone formations', desc: 'Logos, symbols, patterns and visual formations in the sky.' },
  { icon: 'campaign', title: 'Brand displays', desc: 'Your brand, campaign or message above the crowd.' },
  { icon: 'celebration', title: 'Event experiences', desc: 'Unforgettable moments for launches, festivals and special events.' },
  { icon: 'groups', title: 'Brand promotions', desc: 'A campaign people will notice, photograph and share.' },
]

const KIT = [
  { n: '01', title: '1 heavy-payload drone', desc: 'High lift capacity for large banners and LED screens.' },
  { n: '02', title: 'Big banner for advertisement', desc: 'Custom-size banners for maximum brand visibility.' },
  { n: '03', title: 'A uniquely aerial method', desc: 'Stand out with an innovative aerial display experience.' },
]

const WHY = [
  { icon: 'visibility', title: 'High visibility', desc: 'Reach large audiences from long distances.' },
  { icon: 'auto_awesome', title: 'Unique impact', desc: 'A modern, innovative way to showcase your brand.' },
  { icon: 'tune', title: 'Flexible options', desc: 'Posters or LED-lit posters, as your event needs.' },
  { icon: 'palette', title: 'Custom designs', desc: 'Your logo, message or creative, flown as designed.' },
  { icon: 'event', title: 'Perfect for events', desc: 'Concerts, festivals, product launches and public gatherings.' },
  { icon: 'contrast', title: 'Day & night shows', desc: 'Effective visibility in daylight and after dark.' },
]

const FORMATS = [
  { title: 'Drone advertising', desc: 'Coordinated drones carrying logos, text and branded visuals.' },
  { title: 'Sky displays', desc: 'Illuminated drones creating branded shows after dark.' },
  { title: 'Banner flights', desc: 'Large printed banners carried over the crowd.' },
  { title: 'Awareness campaigns', desc: 'Public messages that travel further than a hoarding.' },
  { title: 'Custom advertisements', desc: 'Any brand. Any message. Any size.' },
]

const WALL = [
  { img: 'sky-is-live', alt: 'LED banner reading "Sky is live" flown above a crowd at dusk' },
  { img: 'your-ad-here-led', alt: 'Glowing "Your ad here" sign carried by a drone over an industrial site' },
  { img: 'flag-flight', alt: 'Drone flying the Indian national flag against a blue sky' },
  { img: 'phone-promo', alt: 'Drone carrying an illuminated phone-shaped promotional banner at night' },
  { img: 'awareness', alt: 'Lit "Stop rhino poaching" awareness banner flown at sunset' },
  { img: 'ai-face', alt: 'Banner with a digital face artwork carried at dusk' },
  { img: 'banner-tow', alt: 'Hexacopter carrying a printed vertical banner' },
  { img: 'vertical-logo', alt: 'Vertical Sky Eye Technology banner lit against a night skyline' },
  { img: 'your-ad-here', alt: 'Drone carrying a printed "Your ad here" banner against a blue sky' },
  { img: 'led-net-logo', alt: 'Heavy-lift drone flying an LED net with the Sky Eye logo at night' },
]

function LoopVideo({ name, label }) {
  const ref = useRef(null)
  const isMobile = useIsMobile()
  useEffect(() => {
    const v = ref.current
    if (!v || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return
    const io = new IntersectionObserver(([e]) => (e.isIntersecting ? v.play().catch(() => {}) : v.pause()), {
      threshold: 0.2,
    })
    io.observe(v)
    return () => io.disconnect()
  }, [isMobile])
  if (isMobile) return <img src={poster(name)} alt={label} loading="lazy" />
  return <video ref={ref} src={clip(name)} poster={poster(name)} muted loop playsInline preload="none" aria-label={label} />
}

export default function Skyvertising() {
  return (
    <section className="section-sky" id="skyvertising">
      <div className="container py-2xl">
        {/* Lead */}
        <div className="sky-lead">
          <div className="sky-lead-text">
            <span className="section-label">06.1 / SKYVERTISING</span>
            <h2 className="section-h2">
              TAKE YOUR BRAND
              <br />
              TO THE SKY.
            </h2>
            <p className="section-desc">
              Skyvertising is advertising in the sky — drones and aerial technology carrying posters
              or LED-lit banners to create brand experiences people see from the ground, photograph
              and remember. Instead of competing on crowded streets, screens and feeds, your brand
              gets a larger-than-life presence above the event.
            </p>
            <div className="sky-equation">
              <span>SKY</span>
              <span className="sky-equation-op">+</span>
              <span>ADVERTISING</span>
              <span className="sky-equation-op">=</span>
              <span className="sky-equation-result">SKYVERTISING</span>
            </div>
          </div>
          <figure className="sky-lead-frame">
            <div className="sky-lead-img">
              <img src={brochureCrop('led-net-city', 'w-1200,q-80')} alt="Heavy-lift drone flying an LED net banner with the Sky Eye Technology logo over a night skyline" />
              <span className="sky-badge">DRONE ADVERTISEMENT SHOW</span>
            </div>
            <figcaption className="sky-lead-bar">
              <span>YOUR BRAND IN THE SKY</span>
              <span>DAY · NIGHT · LED · PRINT</span>
            </figcaption>
          </figure>
        </div>

        {/* What we create */}
        <div className="sky-block">
          <div className="sky-block-head">
            <span className="sky-kicker">WHAT WE DO</span>
            <h3 className="sky-h3">What can we create?</h3>
          </div>
          <div className="sky-create">
            {CREATE.map((c) => (
              <div key={c.title} className="sky-create-item">
                <span className="material-symbols-outlined sky-icon" aria-hidden="true">{c.icon}</span>
                <h4>{c.title}</h4>
                <p>{c.desc}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Wall of flights */}
        <div className="sky-wall" role="list">
          <figure className="sky-wall-item sky-wall-item--video" role="listitem">
            <LoopVideo name="drone-promotion" label="Sky Eye drone carrying a promotional banner" />
            <figcaption>LIVE FLIGHT · DRONE PROMOTION</figcaption>
          </figure>
          {WALL.map((w) => (
            <figure key={w.img} className="sky-wall-item" role="listitem">
              <img src={brochureCrop(w.img, 'w-560,q-75')} alt={w.alt} loading="lazy" />
            </figure>
          ))}
          <figure className="sky-wall-item sky-wall-item--video sky-wall-item--video-b" role="listitem">
            <LoopVideo name="night-drone-crowd" label="Lit drone hovering over a crowd at a night event" />
            <figcaption>NIGHT SHOW · LIVE CROWD</figcaption>
          </figure>
        </div>

        {/* Complete set + pricing */}
        <div className="sky-kit">
          <div className="sky-kit-left">
            <span className="sky-kicker">WHAT SET WILL PROVIDE</span>
            <h3 className="sky-h3">A complete ad display set.</h3>
            <p className="sky-p">Everything you need for a stunning aerial advertisement, delivered as one set.</p>
            <ol className="sky-kit-list">
              {KIT.map((k) => (
                <li key={k.n}>
                  <span className="sky-kit-num">{k.n}</span>
                  <div>
                    <h4>{k.title}</h4>
                    <p>{k.desc}</p>
                  </div>
                </li>
              ))}
            </ol>
          </div>

          <div className="sky-price">
            <span className="sky-kicker">OUR PRICING</span>
            <p className="sky-price-amount">
              ₹89,999 <span>+ GST</span>
            </p>
            <div className="sky-price-meta">
              <div>
                <span className="material-symbols-outlined" aria-hidden="true">schedule</span>
                60-minute show
              </div>
              <div>
                <span className="material-symbols-outlined" aria-hidden="true">brush</span>
                Your branding
              </div>
            </div>
            <p className="sky-price-book">
              Bookings: <a href="tel:+918455041474">+91 84550 41474</a>
            </p>
            <a className="btn-primary sky-price-cta" href="#contact" data-service="Skyvertising">
              [ Book a drone ad show → ]
            </a>
          </div>
        </div>

        {/* Why */}
        <div className="sky-block">
          <div className="sky-block-head">
            <span className="sky-kicker">WHY SKY EYE</span>
            <h3 className="sky-h3">Why choose our drone advertisement shows?</h3>
          </div>
          <div className="sky-why">
            {WHY.map((w) => (
              <div key={w.title} className="sky-why-item">
                <span className="material-symbols-outlined sky-icon" aria-hidden="true">{w.icon}</span>
                <h4>{w.title}</h4>
                <p>{w.desc}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Formats + sponsorship */}
        <div className="sky-formats">
          <div className="sky-formats-list">
            <span className="sky-kicker">FORMATS</span>
            {FORMATS.map((f) => (
              <div key={f.title} className="sky-format">
                <h4>{f.title}</h4>
                <p>{f.desc}</p>
              </div>
            ))}
          </div>
          <div className="sky-sponsor">
            <img src={brochureCrop('led-tower', 'w-900,q-75')} alt="LED banner reading 'For an upgrade?' flown beside a lit residential tower" loading="lazy" />
            <div className="sky-sponsor-body">
              <span className="sky-kicker">EVENT SPONSORSHIPS</span>
              <h3 className="sky-h3">Sponsoring an event? Fly it.</h3>
              <p className="sky-p">
                From Model UN conferences and college fests to concerts and product launches, Sky Eye
                comes on board as an aerial sponsor — flying the event's and its partners' banners
                over the venue as the crowd arrives.
              </p>
              <a className="btn-outline" href="#contact" data-service="Skyvertising">
                [ Partner with us → ]
              </a>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
