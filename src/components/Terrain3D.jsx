import { useEffect, useRef, useState } from 'react'
import { useTheme } from '../hooks/useTheme'

// Closing piece of the home page: a generated mountain range with glowing
// contour lines, a scanning sweep and service pins — "mapped from the air".
const PINS = [
  {
    x: -2.4, z: 0.6, label: 'Mapping & survey',
    text: 'Aerial maps, measurements and 3D models of land, sites and infrastructure.',
    href: '#/services/drone-as-a-service?to=daas-mapping',
  },
  {
    x: 0.4, z: -0.8, label: 'Skyvertising',
    text: 'Banners and LED displays flown above events, launches and public gatherings.',
    href: '#/services/skyvertising',
  },
  {
    x: 2.6, z: 0.9, label: 'Inspection',
    text: 'Thermal and solar inspection — find faults without shutting anything down.',
    href: '#/services/drone-as-a-service?to=daas-inspection',
  },
  {
    x: -0.6, z: 2.4, label: 'Agriculture',
    text: 'Even, fast crop spraying without anyone walking the field with a tank.',
    href: '#/services/drone-as-a-service?to=daas-agriculture',
  },
]

export default function Terrain3D() {
  const { theme } = useTheme()
  const sectionRef = useRef(null)
  const canvasRef = useRef(null)
  const sceneRef = useRef(null)
  const pinRefs = useRef([])
  const [failed, setFailed] = useState(false)

  useEffect(() => {
    const el = sectionRef.current
    let cancelled = false
    const io = new IntersectionObserver(
      ([e]) => {
        if (!e.isIntersecting || sceneRef.current) return
        io.disconnect()
        import('../three/terrainScene.js')
          .then(({ mountTerrain }) => {
            if (cancelled || !canvasRef.current) return
            const s = mountTerrain(canvasRef.current, {
              dark: document.documentElement.dataset.theme === 'dark',
              pins: PINS,
            })
            // Pins are plain HTML, moved straight from the render loop
            s.onPins((pts) =>
              pts.forEach((p, i) => {
                const node = pinRefs.current[i]
                if (!node) return
                node.style.transform = `translate(${p.x}px, ${p.y}px)`
                node.style.opacity = p.hidden ? '0' : '1'
              })
            )
            sceneRef.current = s
          })
          .catch(() => setFailed(true))
      },
      { rootMargin: '300px' }
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
      const p = Math.min(Math.max((window.innerHeight - r.top) / (r.height + window.innerHeight), 0), 1)
      sceneRef.current?.setProgress(p)
    }
    const onScroll = () => {
      if (!frame) frame = requestAnimationFrame(update)
    }
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => {
      cancelAnimationFrame(frame)
      window.removeEventListener('scroll', onScroll)
    }
  }, [])

  return (
    <section className="terrain3d" ref={sectionRef} aria-label="Mapped from the air">
      <div className="container terrain3d-head">
        <div>
          <span className="section-label">FROM THE AIR</span>
          <h2 className="section-h2">MAPPED FROM ABOVE.</h2>
        </div>
        <p className="section-desc">
          Every flight turns into something you can use — maps, models, footage or a message in the
          sky. Wherever the job is, we fly it.
        </p>
      </div>

      <div className="terrain3d-stage">
        <div className="terrain3d-canvas" ref={canvasRef} aria-hidden="true" />
        {!failed &&
          PINS.map((p, i) => (
            <div key={p.label} className="terrain3d-pin" ref={(el) => (pinRefs.current[i] = el)}>
              <a className="terrain3d-pin-hit" href={p.href} aria-label={`${p.label}: ${p.text}`}>
                <span className="terrain3d-pin-card" aria-hidden="true">
                  <strong>{p.label}</strong>
                  <span>{p.text}</span>
                  <em>Learn more →</em>
                </span>
                <span className="terrain3d-pin-label" aria-hidden="true">{p.label}</span>
                <span className="terrain3d-pin-dot" aria-hidden="true">+</span>
              </a>
              <span className="terrain3d-pin-stem" aria-hidden="true" />
            </div>
          ))}
        <div className="terrain3d-hud" aria-hidden="true">
          <span>[ SURVEY ]</span>
          <span>[ LAT 20.2961° N · LON 85.8245° E ]</span>
        </div>
      </div>
    </section>
  )
}
