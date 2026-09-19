import Reveal from './Reveal'

const STATS = [
  { value: '2022', label: 'Incorporated' },
  { value: 'Bhubaneswar', label: 'Headquarters, Odisha' },
  { value: 'Aviation & Aerospace', label: 'Industry' },
]

export default function CompanySection() {
  return (
    <section className="company" id="about">
      <Reveal as="p" className="eyebrow">
        Sky Eye Technology (SET) Pvt. Ltd.
      </Reveal>
      <Reveal as="h2" className="display-lg" delay={40}>
        WE BUILD SYSTEMS
        <br />
        THAT MOVE.
      </Reveal>
      <Reveal as="p" className="company__lede" delay={80}>
        Sky Eye Technology is a Bhubaneswar, Odisha-based startup working across drones,
        robotics, artificial intelligence and emerging technology — designing, assembling,
        manufacturing, testing and commissioning professional-grade UAVs and robotic
        systems for industrial, agricultural, public-sector, security and defence
        applications.
      </Reveal>
      <Reveal as="p" className="company__lede company__lede--tagline" delay={110}>
        Manufacturing locally. Training nationally. Innovating globally.
      </Reveal>

      <Reveal className="company__stats" delay={140}>
        <div className="company__stats-row">
          {STATS.map((s) => (
            <div className="company__stat" key={s.label}>
              <span className="company__stat-value">{s.value}</span>
              <span className="company__stat-label">{s.label}</span>
            </div>
          ))}
        </div>
      </Reveal>
    </section>
  )
}
