import { useEffect, useRef, useState } from 'react'
import { useTheme } from '../hooks/useTheme'

// About Us opener: the drone assembles itself as you scroll — exploded
// blueprint first, then each part flies into place with a spec callout,
// then it lifts off. Rendered live in 3D (src/three/assemblyScene.js).
const STEPS = [
  {
    key: 'intro',
    at: 0,
    kicker: '01 / ABOUT US',
    title: ['BUILT HERE.', 'PART BY PART.'],
    text: 'Sky Eye Technology (SET) Pvt. Ltd. designs, assembles and tests its drones in Bhubaneswar, Odisha. Scroll to build one.',
  },
  {
    key: 'airframe',
    at: 0.08,
    kicker: 'PART 01 · AIRFRAME',
    title: ['THE AIRFRAME'],
    text: 'A rigid, lightweight body that carries the battery, flight controller and sensors, with forward and downward vision.',
    chips: ['Flight controller', 'Battery bay', 'Vision sensors'],
  },
  {
    key: 'arms',
    at: 0.24,
    kicker: 'PART 02 · ARMS',
    title: ['FOLDING ARMS'],
    text: 'Four arms on hinges, so the drone folds down for transport and opens out ready to fly.',
    chips: ['Hinged joints', 'Fold-out design'],
  },
  {
    key: 'motors',
    at: 0.4,
    kicker: 'PART 03 · PROPULSION',
    title: ['MOTORS & LANDING GEAR'],
    text: 'Brushless motors with cooling fins at each corner, with landing legs and navigation lights beneath them.',
    chips: ['Brushless motors', 'Landing legs', 'Nav lights'],
  },
  {
    key: 'props',
    at: 0.56,
    kicker: 'PART 04 · PROPELLERS',
    title: ['PROPELLERS'],
    text: 'Shaped blades in counter-rotating pairs, which keeps the drone stable and lets it turn on the spot.',
    chips: ['Counter-rotating', 'Airfoil blades'],
  },
  {
    key: 'camera',
    at: 0.7,
    kicker: 'PART 05 · PAYLOAD',
    title: ['GIMBAL CAMERA'],
    text: 'A stabilised camera that holds steady footage while the drone moves — for mapping, inspection and filming.',
    chips: ['Stabilised gimbal', 'Survey & media'],
  },
  {
    key: 'flight',
    at: 0.84,
    kicker: 'READY TO FLY',
    title: ['ASSEMBLED.', 'TESTED. FLOWN.'],
    text: 'The same build discipline goes into every drone we fly for clients and every drone our students build in class.',
    chips: ['Manufacturing locally', 'Training nationally'],
  },
]
const PART_LIST = STEPS.filter((s) => s.kicker.startsWith('PART'))

export default function DroneAssembly() {
  const { theme } = useTheme()
  const sectionRef = useRef(null)
  const canvasRef = useRef(null)
  const sceneRef = useRef(null)
  const [p, setP] = useState(0)
  const [failed, setFailed] = useState(false)

  useEffect(() => {
    const el = sectionRef.current
    let cancelled = false
    const io = new IntersectionObserver(
      ([e]) => {
        if (!e.isIntersecting || sceneRef.current) return
        io.disconnect()
        import('../three/assemblyScene.js')
          .then(({ mountAssembly }) => {
            if (cancelled || !canvasRef.current) return
            sceneRef.current = mountAssembly(canvasRef.current, { dark: document.documentElement.dataset.theme === 'dark' })
          })
          .catch(() => setFailed(true))
      },
      { rootMargin: '200px' }
    )
    io.observe(el)
    return () => {
      cancelled = true
      io.disconnect()
      sceneRef.current?.dispose()
      sceneRef.current = null
    }
  }, [])

  useEffect(() => {
    sceneRef.current?.setTheme(theme === 'dark')
  }, [theme])

  useEffect(() => {
    let frame = 0
    const update = () => {
      frame = 0
      const el = sectionRef.current
      if (!el) return
      const r = el.getBoundingClientRect()
      const total = r.height - window.innerHeight
      const v = total > 0 ? Math.min(Math.max(-r.top / total, 0), 1) : 0
      sceneRef.current?.setProgress(v)
      setP(v)
    }
    const onScroll = () => {
      if (!frame) frame = requestAnimationFrame(update)
    }
    update()
    window.addEventListener('scroll', onScroll, { passive: true })
    window.addEventListener('resize', onScroll)
    return () => {
      cancelAnimationFrame(frame)
      window.removeEventListener('scroll', onScroll)
      window.removeEventListener('resize', onScroll)
    }
  }, [])

  const step = STEPS.reduce((cur, s, i) => (p >= s.at ? i : cur), 0)
  const built = PART_LIST.filter((s) => p >= s.at + 0.12).length

  return (
    <section className="assembly" ref={sectionRef} aria-label="About Sky Eye Technology — drone assembly">
      <div className="assembly-stage">
        <div className="assembly-grid" aria-hidden="true" />
        <div className="assembly-canvas" ref={canvasRef} aria-hidden="true" />
        {failed && <p className="drone3d-fallback">3D view unavailable on this device.</p>}

        <div className="assembly-hud" aria-hidden="true">
          <span>[ SKY EYE · UAV BUILD ]</span>
          <span>[ {String(built).padStart(2, '0')} / {String(PART_LIST.length).padStart(2, '0')} PARTS ]</span>
        </div>

        <div className="assembly-copy">
          {STEPS.map((s, i) => (
            <div key={s.key} className={`assembly-beat${i === step ? ' is-on' : ''}`} aria-hidden={i !== step}>
              <span className="section-label">{s.kicker}</span>
              <h2 className="assembly-title">
                {s.title.map((line, j) => (
                  <span key={line}>
                    {line}
                    {j < s.title.length - 1 && <br />}
                  </span>
                ))}
              </h2>
              <p className="assembly-text">{s.text}</p>
              {s.chips && (
                <ul className="assembly-chips">
                  {s.chips.map((c) => (
                    <li key={c}>{c}</li>
                  ))}
                </ul>
              )}
            </div>
          ))}
        </div>

        <ol className="assembly-parts" aria-label="Build progress">
          {PART_LIST.map((s, i) => (
            <li key={s.key} className={i < built ? 'is-done' : i === built && p > 0.05 ? 'is-now' : ''}>
              <span className="assembly-part-n">{String(i + 1).padStart(2, '0')}</span>
              <span className="assembly-part-name">{s.title[0]}</span>
            </li>
          ))}
        </ol>

        <div className="assembly-progress" aria-hidden="true">
          <span style={{ transform: `scaleX(${p})` }} />
        </div>
      </div>
    </section>
  )
}
