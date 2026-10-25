import { useEffect, useRef } from 'react'
import { brochureCrop, clip, poster } from '../cdn'
import useIsMobile from '../hooks/useIsMobile'

// The lead banner photo as a looping "living photo": slow push-in, the drone
// bobbing, the LEDs breathing and the city lights twinkling. Plays only while
// on screen; reduced-motion visitors get the still.
const LEAD_VIDEO = clip('led-net-city-live')
const LEAD_POSTER = poster('led-net-city-live')
const LEAD_ALT = 'Heavy-lift drone flying an LED net banner with the Sky Eye Technology logo over a night skyline'

function LeadVideo() {
  const ref = useRef(null)
  useEffect(() => {
    const v = ref.current
    if (!v) return
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return
    const io = new IntersectionObserver(([e]) => (e.isIntersecting ? v.play().catch(() => {}) : v.pause()), { threshold: 0.15 })
    io.observe(v)
    return () => io.disconnect()
  }, [])
  return <video ref={ref} src={LEAD_VIDEO} poster={LEAD_POSTER} muted loop playsInline preload="metadata" aria-label={LEAD_ALT} />
}

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

// "Skyvertising can include" and "Digital display features" — page 2 of the
// updated brochure.
const FORMATS = [
  { icon: 'flag', title: 'Banner Towing', desc: 'Large advertising banners carried across the sky, putting your message above the crowd.' },
  { icon: 'cloud', title: 'Skywriting', desc: 'Words, messages or logos written in the sky.' },
  { icon: 'flight', title: 'Aerial Advertising', desc: 'Promotional signs and branded messages displayed from above.' },
  { icon: 'scatter_plot', title: 'Drone Advertising', desc: 'Coordinated drones creating logos, text, symbols and animated formations in the night sky.' },
  { icon: 'auto_awesome', title: 'Sky Displays', desc: 'Illuminated, branded visual shows designed to draw attention and be remembered.' },
]

const DIGITAL = [
  'High-impact visuals & images',
  'Custom branding & logos',
  'Dynamic video displays',
  'Text, messages & announcements',
  'Animated graphics & motion visuals',
  'Interactive digital content',
  'Digital advertisements & promotions',
  'Real-time updates & information',
]

const USES = [
  { img: 'your-ad-here-led', title: 'Brand promotions', desc: 'Make your brand unmissable in the sky.' },
  { img: 'awareness', title: 'Awareness campaigns', desc: 'Spread important messages that reach further.' },
  { img: 'your-ad-here', title: 'Custom advertisements', desc: 'Any brand. Any message. Any size.' },
]

// Flights done in Odisha. Add { img, title, place } entries (images on
// ImageKit) once the photos are shared — the block appears automatically.
const ODISHA_WORK = []

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
            <span className="section-label">SERVICES / 01 · SKYVERTISING</span>
            <h2 className="section-h2">
              TAKE YOUR BRAND
              <br />
              TO THE SKY.
            </h2>
            <p className="section-desc">
              Skyvertising is advertising that takes your brand beyond traditional media and into
              the sky. Drones and aerial displays carry your brand, product, event or message above
              the crowd — a visual experience people see from the ground, photograph and remember.
              Instead of competing on crowded streets, screens and feeds, your brand gets a
              larger-than-life presence.
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
              <LeadVideo />
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

        {/* Can include + digital features */}
        <div className="sky-block">
          <div className="sky-block-head">
            <span className="sky-kicker">SKYVERTISING CAN INCLUDE</span>
            <h3 className="sky-h3">Five ways to take a brand into the sky.</h3>
          </div>
          <div className="sky-formats-grid">
            {FORMATS.map((f, i) => (
              <div key={f.title} className="sky-format-card">
                <span className="sky-format-num">{String(i + 1).padStart(2, '0')}</span>
                <span className="material-symbols-outlined sky-icon" aria-hidden="true">{f.icon}</span>
                <h4>{f.title}</h4>
                <p>{f.desc}</p>
              </div>
            ))}
          </div>
          <div className="sky-digital">
            <span className="sky-digital-label">DIGITAL DISPLAY FEATURES</span>
            <ul>
              {DIGITAL.map((d) => (
                <li key={d}>
                  <span className="material-symbols-outlined" aria-hidden="true">check_circle</span>
                  {d}
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Complete set + request */}
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

          <div className="sky-book">
            <span className="sky-kicker">BOOK A SHOW</span>
            <p className="sky-book-title">Your brand in the sky.</p>
            <p className="sky-book-text">
              Drones carrying posters or LED-lit displays, flown for your launch, festival, concert
              or public gathering — day or night, with your branding.
            </p>
            <a className="btn-request btn-request--invert" href="#/contact" data-service="Skyvertising">
              Request this service
              <span className="material-symbols-outlined" aria-hidden="true">arrow_forward</span>
            </a>
            <p className="sky-book-call">
              Or call <a href="tel:+918455041474">+91 84550 41474</a>
            </p>
          </div>
        </div>

        {ODISHA_WORK.length > 0 && (
          <div className="sky-block">
            <div className="sky-block-head">
              <span className="sky-kicker">FLOWN IN ODISHA</span>
              <h3 className="sky-h3">Our work, close to home.</h3>
            </div>
            <div className="sky-odisha">
              {ODISHA_WORK.map((w) => (
                <figure key={w.img} className="sky-odisha-item">
                  <img src={w.img} alt={w.title} loading="lazy" />
                  <figcaption>
                    <strong>{w.title}</strong>
                    <span>{w.place}</span>
                  </figcaption>
                </figure>
              ))}
            </div>
          </div>
        )}

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

        {/* Use cases */}
        <div className="sky-block">
          <div className="sky-block-head">
            <span className="sky-kicker">WHAT IT IS FOR</span>
            <h3 className="sky-h3">The sky becomes your billboard.</h3>
          </div>
          <div className="sky-uses">
            {USES.map((u) => (
              <figure key={u.img} className="sky-use">
                <img src={brochureCrop(u.img, 'w-700,q-78')} alt={u.title} loading="lazy" />
                <figcaption>
                  <h4>{u.title}</h4>
                  <p>{u.desc}</p>
                </figcaption>
              </figure>
            ))}
          </div>
        </div>

        {/* Sponsorship */}
        <div className="sky-sponsor sky-sponsor--wide">
          <img src={brochureCrop('led-tower', 'w-900,q-75')} alt="LED banner reading 'For an upgrade?' flown beside a lit residential tower" loading="lazy" />
          <div className="sky-sponsor-body">
            <span className="sky-kicker">EVENT SPONSORSHIPS</span>
            <h3 className="sky-h3">Sponsoring an event? Fly it.</h3>
            <p className="sky-p">
              From Model UN conferences and college fests to concerts and product launches, Sky Eye
              comes on board as an aerial sponsor — flying the event's and its partners' banners
              over the venue as the crowd arrives.
            </p>
            <a className="btn-request" href="#/contact" data-service="Skyvertising — event sponsorship">
              Partner with us
              <span className="material-symbols-outlined" aria-hidden="true">arrow_forward</span>
            </a>
          </div>
        </div>
      </div>
    </section>
  )
}
