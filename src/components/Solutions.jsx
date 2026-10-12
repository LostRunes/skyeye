import { useState } from 'react'
import { clip, photo } from '../cdn'
import useIsMobile from '../hooks/useIsMobile'

const solutions = {
  agri: {
    app: 'APP // 01',
    title: 'AGRICULTURE',
    panelTitle: 'SERVICE PROFILE: PRECISION SPRAYING',
    coords: 'FIELD OPS · SONIPAT, HARYANA',
    desc: 'Autonomous spraying over wheat and mustard with farmer-side demonstrations — uniform coverage, less chemical, no one walking the crop with a tank.',
    video: clip('agri-spray-1'),
    img: photo('agri', 141, 'w-1200,q-75'),
    alt: 'Spraying drone flying low over a wheat field'
  },
  inspection: {
    app: 'APP // 02',
    title: 'THERMAL INSPECTION',
    panelTitle: 'SERVICE PROFILE: SOLAR & INDUSTRIAL INSPECTION',
    coords: 'RADIOMETRIC THERMAL + VISUAL PAIRS',
    desc: 'Paired thermal and visual passes over solar arrays and industrial roofs to find hot cells, faults and damage without shutting anything down.',
    img: photo('survey', 475, 'w-1200,q-80'),
    alt: 'Thermal image of a rooftop solar array'
  },
  mapping: {
    app: 'APP // 03',
    title: 'MAPPING & SURVEYING',
    panelTitle: 'SERVICE PROFILE: MAPPING & SURVEY',
    coords: 'ORTHOMOSAIC · DSM · 3D MODEL',
    desc: 'Fixed-wing and multirotor survey producing orthomosaics, digital surface models and 3D models — plus AI-based road surveys that flag potholes from the air.',
    video: clip('survey-pothole-ai'),
    img: photo('survey', 237, 'w-1200,q-75'),
    alt: 'AI-based aerial road survey marking potholes'
  },
  infra: {
    app: 'APP // 04',
    title: 'INFRASTRUCTURE',
    panelTitle: 'SERVICE PROFILE: CONSTRUCTION & INFRA',
    coords: 'PROGRESS MONITORING · DAY & NIGHT',
    desc: 'Repeatable flights over construction sites, corridors and city infrastructure to track progress and document conditions, day or night.',
    img: photo('aerial', 648, 'w-1200,q-75'),
    alt: 'Aerial view of a building under construction beside a highway'
  },
  public: {
    app: 'APP // 05',
    title: 'PUBLIC SAFETY',
    panelTitle: 'SERVICE PROFILE: PUBLIC SERVICES & SECURITY',
    coords: 'SURVEILLANCE · PAYLOAD DROP',
    desc: 'Surveillance demonstrations for police units and payload drops such as life-buoy delivery — getting eyes and equipment to a scene before a team can.',
    img: photo('survey', 231, 'w-1000,q-80'),
    alt: 'Heavy-lift drone carrying an orange life buoy'
  },
  events: {
    app: 'APP // 06',
    title: 'AERIAL CINEMATOGRAPHY',
    panelTitle: 'SERVICE PROFILE: EVENTS, WEDDINGS & FPV',
    coords: 'CINEMATIC · FPV · NIGHT',
    desc: 'Cinematic and FPV flights for weddings, pre-wedding shoots, resorts and live events — the shots a crane or a phone cannot get.',
    video: clip('fpv-resort'),
    img: photo('aerial', 625, 'w-1200,q-75'),
    alt: 'Aerial view of a decorated wedding stage at night'
  }
}

const keys = Object.keys(solutions)

export default function Solutions() {
  const isMobile = useIsMobile()
  const [active, setActive] = useState('agri')
  const current = solutions[active]

  return (
    <section className="section-solutions" id="drone-services">
      <div className="container py-2xl">
        <div className="section-header">
          <span className="section-label">06.3 / DRONE SERVICES</span>
          <h2 className="section-h2">BUILT FOR THE REAL WORLD.</h2>
          <p className="section-desc">
            Pick a service to see how we fly it. Every profile below is work the team has flown in the field.
          </p>
        </div>

        <div className="solutions-board">
          {/* Left Tabs */}
          <div className="sol-tabs">
            {keys.map((key) => {
              const s = solutions[key]
              const isActive = key === active
              return (
                <button
                  key={key}
                  className={`sol-tab ${isActive ? 'active' : 'inactive'}`}
                  onClick={() => setActive(key)}
                >
                  <div>
                    <span className="sol-tab-app">{s.app}</span>
                    <span className="sol-tab-title">{s.title}</span>
                  </div>
                  <span className="sol-tab-status">
                    {isActive ? '[ACTIVE]' : '[LOAD]'}
                  </span>
                </button>
              )
            })}
          </div>

          {/* Right Preview */}
          <div className="sol-preview">
            <div className="sol-preview-img-wrap">
              {current.video && !isMobile ? (
                // Keyed on the profile so switching tabs remounts and restarts it.
                <video
                  key={active}
                  src={current.video}
                  poster={current.img}
                  autoPlay
                  muted
                  loop
                  playsInline
                  preload="metadata"
                  aria-label={current.alt}
                />
              ) : (
                <img src={current.img} alt={current.alt} />
              )}
              <div className="sol-preview-badge">FIELD FOOTAGE</div>
            </div>

            <div className="sol-info">
              <div className="sol-info-row">
                <span>{current.panelTitle}</span>
                <span>{current.coords}</span>
              </div>
              <p className="sol-desc">{current.desc}</p>
              <a className="sol-cta" href="#contact" data-service="Drone Services">[ Request this service → ]</a>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
