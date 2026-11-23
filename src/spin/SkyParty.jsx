import { useEffect, useRef } from 'react'
import { importScene, resilient } from '../three/resilient'

// The backdrop for every spin page: a soft painted sunset (heather → candy →
// peach), drifting clouds, a carnival skyline (Ferris wheel + carousel) on the
// horizon, and Sky Eye drones wrapped in fairy lights flying across it.
// Decorative only (aria-hidden).

const FLEETS = {
  play: [
    { y: 0.13, size: 120, speed: 0.018, dir: 1, wave: 0.025, offset: 0.1 },
    { y: 0.36, size: 78, speed: 0.024, dir: -1, wave: 0.03, offset: 0.55 },
    { y: 0.7, size: 96, speed: 0.015, dir: 1, wave: 0.02, offset: 0.75 },
  ],
  admin: [
    { y: 0.12, size: 90, speed: 0.012, dir: 1, wave: 0.02, offset: 0.2 },
    { y: 0.5, size: 64, speed: 0.016, dir: -1, wave: 0.02, offset: 0.65 },
  ],
  screen: [
    { y: 0.1, size: 130, speed: 0.012, dir: 1, wave: 0.02, offset: 0.15 },
    { y: 0.86, size: 100, speed: 0.016, dir: -1, wave: 0.02, offset: 0.6 },
  ],
}

/** A canvas of fairy-lit 3D drones. `fleet` as in three/spinSky.js. */
export function DroneCanvas({ fleet, className = '' }) {
  const ref = useRef(null)
  useEffect(() => {
    let scene = null
    let gone = false
    importScene(() => import('../three/spinSky.js'))
      .then(({ mountSpinSky }) => {
        if (gone || !ref.current) return
        try {
          scene = resilient(mountSpinSky, ref.current, { fleet })
        } catch {
          /* no WebGL: the sky still looks fine without drones */
        }
      })
      .catch(() => {})
    return () => {
      gone = true
      scene?.dispose()
    }
    // The fleet is fixed for the life of the canvas
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])
  return <div ref={ref} className={`sk-drones ${className}`} aria-hidden="true" />
}

function Skyline() {
  // Ferris wheel spokes and cabins
  const spokes = Array.from({ length: 12 }, (_, i) => (i * Math.PI) / 6)
  return (
    <svg className="sk-skyline" viewBox="0 0 1200 260" preserveAspectRatio="xMidYMax slice" aria-hidden="true">
      <g className="sk-wheel">
        <circle cx="930" cy="120" r="104" fill="none" strokeWidth="5" />
        <circle cx="930" cy="120" r="70" fill="none" strokeWidth="2" />
        {spokes.map((a) => (
          <line key={a} x1="930" y1="120" x2={930 + 104 * Math.cos(a)} y2={120 + 104 * Math.sin(a)} strokeWidth="2" />
        ))}
        {spokes.map((a) => (
          <rect key={`c${a}`} x={930 + 104 * Math.cos(a) - 9} y={120 + 104 * Math.sin(a) + 2} width="18" height="15" rx="4" className="sk-cabin" />
        ))}
      </g>
      <path d="M930 120 L862 260 M930 120 L998 260" strokeWidth="6" className="sk-leg" />
      {/* carousel */}
      <path d="M180 170 L250 120 L320 170 Z" className="sk-solid" />
      <rect x="186" y="170" width="128" height="10" className="sk-solid" />
      {[196, 228, 260, 292].map((x) => (
        <line key={x} x1={x + 6} y1="180" x2={x + 6} y2="235" strokeWidth="3" className="sk-leg" />
      ))}
      <rect x="176" y="235" width="148" height="25" className="sk-solid" />
      <path d="M250 120 L250 104" strokeWidth="3" className="sk-leg" />
      <path d="M250 104 L266 110 L250 116 Z" className="sk-flag" />
      {/* tents + ground */}
      <path d="M430 260 L480 196 L530 260 Z M560 260 L600 214 L640 260 Z" className="sk-solid" />
      <rect x="0" y="252" width="1200" height="8" className="sk-solid" />
    </svg>
  )
}

export default function SkyParty({ fleet = 'play', quiet = false }) {
  return (
    <div className={`sk-sky ${quiet ? 'is-quiet' : ''}`} aria-hidden="true">
      <span className="sk-cloud sk-cloud--a" />
      <span className="sk-cloud sk-cloud--b" />
      <span className="sk-cloud sk-cloud--c" />
      <span className="sk-cloud sk-cloud--d" />
      <span className="sk-star" style={{ top: '9%', left: '18%' }} />
      <span className="sk-star" style={{ top: '6%', left: '64%' }} />
      <span className="sk-star" style={{ top: '22%', left: '86%' }} />
      <span className="sk-star" style={{ top: '30%', left: '8%' }} />
      <Skyline />
      <DroneCanvas fleet={FLEETS[fleet] || FLEETS.play} />
      <div className="sk-grain" />
    </div>
  )
}
