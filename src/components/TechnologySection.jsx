import Reveal from './Reveal'

const CAPABILITIES = [
  {
    label: 'Autonomous flight',
    desc: 'Flight paths planned and adjusted in real time, without manual input.',
  },
  {
    label: 'Real-time data',
    desc: 'Telemetry and imagery streamed the instant they are captured.',
  },
  {
    label: 'Precision navigation',
    desc: 'Multi-sensor positioning holds course in GPS-denied environments.',
  },
  {
    label: 'Generative AI',
    desc: 'Applied research and training in generative AI alongside the team’s core UAV and robotics work.',
  },
]

function RadarGraphic() {
  return (
    <svg className="tech-graphic" viewBox="0 0 400 400" role="presentation" aria-hidden="true">
      <circle cx="200" cy="200" r="180" className="tech-graphic__ring" />
      <circle cx="200" cy="200" r="130" className="tech-graphic__ring" />
      <circle cx="200" cy="200" r="80" className="tech-graphic__ring" />
      <line x1="200" y1="8" x2="200" y2="32" className="tech-graphic__tick" />
      <line x1="200" y1="368" x2="200" y2="392" className="tech-graphic__tick" />
      <line x1="8" y1="200" x2="32" y2="200" className="tech-graphic__tick" />
      <line x1="368" y1="200" x2="392" y2="200" className="tech-graphic__tick" />
      <g className="tech-graphic__sweep">
        <line x1="200" y1="200" x2="200" y2="20" className="tech-graphic__sweep-line" />
      </g>
      <circle cx="200" cy="200" r="4" className="tech-graphic__core" />
    </svg>
  )
}

export default function TechnologySection() {
  return (
    <section className="technology" id="technology">
      <div className="technology__grid">
        <div className="technology__intro">
          <Reveal as="h2" className="display-lg">
            INTELLIGENCE
            <br />
            BEYOND FLIGHT.
          </Reveal>
          <Reveal as="p" className="technology__lede" delay={80}>
            Every aircraft carries a layer of onboard intelligence — the same research the
            team applies across robotics, UAV integration and generative AI.
          </Reveal>

          <div className="technology__list">
            {CAPABILITIES.map((c, i) => (
              <Reveal as="div" className="technology__item" key={c.label} delay={i * 70}>
                <h3>{c.label}</h3>
                <p>{c.desc}</p>
              </Reveal>
            ))}
          </div>
        </div>

        <Reveal className="technology__visual" delay={120}>
          <RadarGraphic />
        </Reveal>
      </div>
    </section>
  )
}
