import { brochureCrop, photo, poster } from '../cdn'

// Drone as a Service — deliberately generic: what a client gets and which jobs
// we fly, with no aircraft models or manufacturing detail.
// The offering list is a first draft pending the team's confirmed DaaS list.
const INCLUDED = [
  { icon: 'flight', title: 'The right aircraft', desc: 'Matched to the job — spraying, mapping, filming, inspection or carrying a display.' },
  { icon: 'badge', title: 'Trained pilots', desc: 'An experienced crew flies, monitors and lands every mission.' },
  { icon: 'verified_user', title: 'Planning & safety', desc: 'Site checks, risk assessment and airspace permissions where required.' },
  { icon: 'inventory_2', title: 'The finished result', desc: 'Footage, maps, reports or a sprayed field — delivered, not just flown.' },
]

const STEPS = [
  { n: '01', title: 'Tell us the job', desc: 'What you need, where and when.' },
  { n: '02', title: 'We plan it', desc: 'Site check, flight plan, permissions and a clear scope.' },
  { n: '03', title: 'We fly it', desc: 'Our crew arrives with everything needed and runs the operation.' },
  { n: '04', title: 'You get the result', desc: 'Processed data, media or the completed work, handed over.' },
]

const OFFERINGS = [
  {
    id: 'skyvertising',
    title: 'Skyvertising',
    tag: 'Aerial advertising',
    desc: 'Banners and LED displays flown above events, launches and public gatherings.',
    img: brochureCrop('led-net-city', 'w-760,h-520,fo-auto,q-75'),
    link: '#/services/skyvertising',
  },
  {
    id: 'agriculture',
    title: 'Agricultural spraying',
    tag: 'Agriculture',
    desc: 'Even, fast spraying over crops, without anyone walking the field with a tank.',
    img: photo('agri', 141, 'w-760,h-520,fo-auto,q-75'),
  },
  {
    id: 'mapping',
    title: 'Mapping & surveying',
    tag: 'Survey',
    desc: 'Aerial maps, measurements and 3D models of land, sites and infrastructure.',
    img: photo('survey', 237, 'w-760,h-520,fo-auto,q-75'),
  },
  {
    id: 'inspection',
    title: 'Thermal & solar inspection',
    tag: 'Inspection',
    desc: 'Spot faults in solar panels, roofs and equipment without shutting anything down.',
    img: photo('survey', 475, 'w-760,h-520,fo-auto,q-80'),
  },
  {
    id: 'construction',
    title: 'Construction monitoring',
    tag: 'Infrastructure',
    desc: 'Regular flights over sites and corridors to track progress and record conditions.',
    img: photo('aerial', 648, 'w-760,h-520,fo-auto,q-75'),
  },
  {
    id: 'media',
    title: 'Aerial photography & video',
    tag: 'Events & media',
    desc: 'Weddings, events, venues and tourism — shots a crane or phone cannot get.',
    img: photo('aerial', 625, 'w-760,h-520,fo-auto,q-75'),
  },
  {
    id: 'fpv',
    title: 'FPV cinematography',
    tag: 'Events & media',
    desc: 'Fast, close, flowing first-person shots through venues and landscapes.',
    img: poster('fpv-resort'),
  },
  {
    id: 'safety',
    title: 'Surveillance support',
    tag: 'Public safety',
    desc: 'Eyes in the air for crowd monitoring, security and public-safety teams.',
    img: photo('govt', 580, 'w-760,h-520,fo-auto,q-75'),
  },
  {
    id: 'delivery',
    title: 'Payload drop & delivery',
    tag: 'Emergency',
    desc: 'Getting light equipment — like a life buoy — to a spot before a team can reach it.',
    img: photo('survey', 231, 'w-760,h-520,fo-auto,q-80'),
  },
]

export default function DroneService() {
  return (
    <section className="section-daas" id="drone-as-a-service">
      <div className="container py-2xl">
        <div className="daas-lead">
          <div>
            <span className="section-label">SERVICES / 03 · DRONE AS A SERVICE</span>
            <h2 className="section-h2">
              ALL THE DRONE.
              <br />
              NONE OF THE HASSLE.
            </h2>
          </div>
          <div className="daas-lead-copy">
            <p className="section-desc">
              Drone as a Service means you get the outcome — the advert in the sky, the sprayed
              field, the map, the footage — without buying, maintaining or flying a drone yourself.
            </p>
            <p className="section-desc">
              Sky Eye brings the aircraft, the crew, the planning and the permissions, and hands
              over the finished work. You pay for the job, not the equipment.
            </p>
            <a className="btn-request" href="#/contact" data-service="Drone as a Service">
              Request a service
              <span className="material-symbols-outlined" aria-hidden="true">arrow_forward</span>
            </a>
          </div>
        </div>

        <div className="daas-included">
          {INCLUDED.map((x) => (
            <div key={x.title} className="daas-included-item">
              <span className="material-symbols-outlined sky-icon" aria-hidden="true">{x.icon}</span>
              <h3>{x.title}</h3>
              <p>{x.desc}</p>
            </div>
          ))}
        </div>

        <div className="sky-block">
          <div className="sky-block-head">
            <span className="sky-kicker">WHAT WE OFFER</span>
            <h3 className="sky-h3">Drone as a Service, by job.</h3>
          </div>
          <div className="daas-grid">
            {OFFERINGS.map((o, i) => (
              <article key={o.id} id={`daas-${o.id}`} className="daas-card">
                <div className="daas-card-img">
                  <img src={o.img} alt="" loading="lazy" />
                  <span className="daas-card-num">{String(i + 1).padStart(2, '0')}</span>
                </div>
                <div className="daas-card-body">
                  <span className="daas-card-tag">{o.tag}</span>
                  <h4 className="daas-card-title">{o.title}</h4>
                  <p className="daas-card-desc">{o.desc}</p>
                  <div className="daas-card-actions">
                    <a className="btn-request btn-request--sm" href="#/contact" data-service={o.title}>
                      Request this service
                    </a>
                    {o.link && (
                      <a className="daas-card-more" href={o.link}>
                        Learn more →
                      </a>
                    )}
                  </div>
                </div>
              </article>
            ))}
          </div>
        </div>

        <div className="sky-block">
          <div className="sky-block-head">
            <span className="sky-kicker">HOW IT WORKS</span>
            <h3 className="sky-h3">From request to result in four steps.</h3>
          </div>
          <ol className="daas-steps">
            {STEPS.map((s) => (
              <li key={s.n}>
                <span className="daas-step-num">{s.n}</span>
                <h4>{s.title}</h4>
                <p>{s.desc}</p>
              </li>
            ))}
          </ol>
        </div>
      </div>
    </section>
  )
}
