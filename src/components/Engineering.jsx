import { photo } from '../cdn'

const WORKSHOP_IMG = photo('labs', 590, 'w-1600,q-75')

const phases = [
  {
    phase: 'PHASE 01',
    title: 'RESEARCH',
    desc: 'Aerodynamic analysis & structural FEA models.'
  },
  {
    phase: 'PHASE 02',
    title: 'DESIGN',
    desc: 'Precision CAD, CNC machining specs, and schematics.'
  },
  {
    phase: 'PHASE 03',
    title: 'BUILD',
    desc: 'Carbon fiber lamination, harness wiring & assembly.'
  },
  {
    phase: 'PHASE 04',
    title: 'TEST',
    desc: 'Bench calibration, rotor vibration and environmental test.'
  },
  {
    phase: 'PHASE 05',
    title: 'DEPLOY',
    desc: 'Pilot integration, fleet dispatch & operations.'
  },
  {
    phase: 'PHASE 06',
    title: 'ITERATE',
    desc: 'Telemetry analysis, firmware upgrades & optimization.'
  }
]

export default function Engineering() {
  return (
    <section className="section-engineering" id="engineering">
      <div className="container py-2xl">
        <div className="section-header">
          <span className="section-label">03 / ENGINEERING</span>
          <h2 className="section-h2">FROM IDEA TO FLIGHT.</h2>
          <p className="section-desc">
            A relentless lifecycle of physical prototyping, stress analysis, and software simulation. We do not ship concepts; we build, break, and validate real machines.
          </p>
        </div>

        {/* Phase Pipeline */}
        <div className="phases-grid">
          {phases.map((p) => (
            <div key={p.phase} className="phase-cell">
              <span className="phase-label">{p.phase}</span>
              <h4 className="phase-h4">{p.title}</h4>
              <p className="phase-desc">{p.desc}</p>
            </div>
          ))}
        </div>

        {/* Workshop Image */}
        <div className="workshop-frame">
          <div className="workshop-img">
            <img
              src={WORKSHOP_IMG}
              alt="Drone frames, motors and propellers laid out on a Sky Eye D Lab workbench"
            />
            <div className="workshop-badge">HANGAR LAB 01 · INTEGRATION FACILITY</div>
          </div>
          <div className="workshop-bar">
            <span>BUILT, TESTED AND REFINED IN THE REAL WORLD.</span>
            <span className="workshop-tolerance">INTERNAL BENCH TOLERANCE &lt; 0.05 MM</span>
          </div>
        </div>
      </div>
    </section>
  )
}
