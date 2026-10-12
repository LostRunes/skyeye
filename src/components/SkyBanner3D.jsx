import { useEffect, useRef, useState } from 'react'
import { useTheme } from '../hooks/useTheme'

// Opens the Skyvertising page: the drone flies in towing a cloth banner.
// Touch or hover the banner and it ripples, flips and flows.
export default function SkyBanner3D() {
  const { theme } = useTheme()
  const stageRef = useRef(null)
  const sceneRef = useRef(null)
  const [failed, setFailed] = useState(false)

  useEffect(() => {
    const el = stageRef.current
    let cancelled = false
    const io = new IntersectionObserver(
      ([e]) => {
        if (!e.isIntersecting || sceneRef.current) return
        io.disconnect()
        import('../three/bannerScene.js')
          .then(({ mountBanner }) => {
            if (cancelled || !stageRef.current) return
            sceneRef.current = mountBanner(stageRef.current, {
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

  return (
    <section className="skybanner" aria-label="Skyvertising — a drone towing a banner">
      <div className="skybanner-stage" ref={stageRef}>
        {failed && <p className="drone3d-fallback">3D view unavailable on this device.</p>}
      </div>
      <div className="skybanner-hud" aria-hidden="true">
        <span>[ SKYVERTISING · LIVE ]</span>
        <span className="skybanner-hint">HOVER THE BANNER</span>
        <span>[ YOUR BRAND HERE ]</span>
      </div>
    </section>
  )
}
