import { useEffect, useRef, useState } from 'react'
import { useTheme } from '../hooks/useTheme'

// About-page opener: the live 3D drone. The stage is pinned while the section
// scrolls; scroll turns the aircraft and swaps the copy beside it, and the
// gimbal camera follows the pointer the whole time.
const BEATS = [
  {
    kicker: '01 / ABOUT US',
    title: ['WE PUT DRONES', 'TO WORK.'],
    text: 'Sky Eye Technology (SET) Pvt. Ltd. is a Bhubaneswar, Odisha-based company working across drones, robotics and artificial intelligence — from research and training to real-world deployment.',
  },
  {
    kicker: 'WHAT WE DO',
    title: ['IN THE SKY.', 'ON THE GROUND.'],
    text: 'Skyvertising for brands and events, Drone as a Service for farms, sites and infrastructure, and live courses that teach people to build and fly it themselves.',
    stats: [
      ['Skyvertising', 'Aerial advertising'],
      ['DaaS', 'Drone as a Service'],
      ['5', 'Live courses'],
    ],
  },
  {
    kicker: 'HOW WE WORK',
    title: ['MANUFACTURING LOCALLY.', 'TRAINING NATIONALLY.'],
    text: 'Designed, assembled, tested and flown by our own team — and taught in schools, universities and training units across India.',
    stats: [
      ['2022', 'Incorporated'],
      ['Bhubaneswar', 'Odisha, India'],
    ],
  },
]

export default function Drone3D({ more }) {
  const { theme } = useTheme()
  const sectionRef = useRef(null)
  const canvasRef = useRef(null)
  const sceneRef = useRef(null)
  const [beat, setBeat] = useState(0)
  const [failed, setFailed] = useState(false)

  // Load three.js only when the section is near
  useEffect(() => {
    const el = sectionRef.current
    let cancelled = false
    const io = new IntersectionObserver(
      ([e]) => {
        if (!e.isIntersecting || sceneRef.current) return
        io.disconnect()
        import('../three/droneScene.js')
          .then(({ mountDrone }) => {
            if (cancelled || !canvasRef.current) return
            sceneRef.current = mountDrone(canvasRef.current, {
              dark: document.documentElement.dataset.theme === 'dark',
            })
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

  // Scroll progress through the pinned section
  useEffect(() => {
    let frame = 0
    const update = () => {
      frame = 0
      const el = sectionRef.current
      if (!el) return
      const r = el.getBoundingClientRect()
      const total = r.height - window.innerHeight
      const p = total > 0 ? Math.min(Math.max(-r.top / total, 0), 1) : 0
      sceneRef.current?.setProgress(p)
      setBeat(Math.min(BEATS.length - 1, Math.floor(p * BEATS.length * 0.999)))
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

  return (
    <section className="drone3d" ref={sectionRef} aria-label="About Sky Eye Technology">
      <div className="drone3d-stage">
        <div className="drone3d-canvas" ref={canvasRef} aria-hidden="true" />
        {failed && <p className="drone3d-fallback">3D view unavailable on this device.</p>}

        <div className="drone3d-hud" aria-hidden="true">
          <span>[ SKY EYE · UAV ]</span>
          <span className="drone3d-hud-hint">MOVE YOUR CURSOR — THE CAMERA FOLLOWS</span>
          <span>[ {String(beat + 1).padStart(2, '0')} / {String(BEATS.length).padStart(2, '0')} ]</span>
        </div>

        <div className="drone3d-copy">
          {BEATS.map((b, i) => (
            <div key={b.kicker} className={`drone3d-beat${i === beat ? ' is-on' : ''}`} aria-hidden={i !== beat}>
              <span className="section-label">{b.kicker}</span>
              <h2 className="drone3d-title">
                {b.title[0]}
                <br />
                {b.title[1]}
              </h2>
              <p className="drone3d-text">{b.text}</p>
              {more && i === BEATS.length - 1 && (
                <a className="hs-more drone3d-more" href={more}>
                  More about us →
                </a>
              )}
              {b.stats && (
                <div className="drone3d-stats">
                  {b.stats.map(([v, l]) => (
                    <div key={l}>
                      <span className="drone3d-stat-v">{v}</span>
                      <span className="drone3d-stat-l">{l}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>

        <div className="drone3d-progress" aria-hidden="true">
          {BEATS.map((b, i) => (
            <span key={b.kicker} className={i <= beat ? 'is-on' : ''} />
          ))}
        </div>
      </div>
    </section>
  )
}
