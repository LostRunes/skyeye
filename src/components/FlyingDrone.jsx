import { useEffect, useRef } from 'react'
import { createPortal } from 'react-dom'
import { useTheme } from '../hooks/useTheme'
import { importScene, resilient } from '../three/resilient'

// The home page's drone, after drone.riotters.com: one aircraft in a fixed
// layer over the page that flies down with you. It enters as you leave the
// hero, climbs out of frame while the About section assembles its own drone,
// then descends to hover over the mountain.
// Positions are waypoints tied to page sections; the scene eases between them
// and banks/pitches from its own velocity, so it reads as flight.

const smooth = (t) => t * t * (3 - 2 * t)
const lerp = (a, b, t) => a + (b - a) * t

// Each waypoint: an anchor (element id or selector), where in the page it
// applies, and the pose there. x/y are viewport units (-1..1).
function waypoints(wide) {
  const W = (desk, phone) => (wide ? desk : phone)
  return [
    { at: () => 0, pose: { x: W(0.6, 0.3), y: 1.6, scale: 0.7, yaw: -0.7 } },
    { el: '#overview', at: 'center', pose: { x: W(0.72, 0.4), y: W(0.62, 0.7), scale: W(0.55, 0.5), yaw: -0.5 } },
    { el: '#home-about', at: 'pin-start', pose: { x: W(0.9, 0.5), y: 1.7, scale: 0.6, yaw: 0.4 } },
    { el: '#home-services', at: 'top-center', pose: { x: W(1.1, 0.6), y: 1.55, scale: 0.6, yaw: 0.9 } },
    { el: '.terrain3d', at: 'top', pose: { x: W(-0.2, 0), y: 1.55, scale: 0.55, yaw: -0.3 } },
    { el: '.terrain3d-stage', at: 'center', pose: { x: W(0.6, 0.25), y: W(-0.3, -0.42), scale: W(0.5, 0.38), yaw: -0.2 } },
    { el: '#home-contact', at: 'top-center', pose: { x: W(0.25, 0.2), y: -1.7, scale: 0.5, yaw: 0.3 } },
  ]
}

// Scroll position at which a waypoint applies
function keyFor(w) {
  if (w.at instanceof Function) return w.at()
  const el = document.querySelector(w.el)
  if (!el) return null
  const top = el.getBoundingClientRect().top + window.scrollY
  const h = el.offsetHeight
  const vh = window.innerHeight
  switch (w.at) {
    case 'center':
      return top + h / 2 - vh / 2
    case 'top':
      return top - vh
    case 'top-center':
      return top - vh / 2
    case 'pin-start':
      return top
    case 'pin-mid':
      return top + (h - vh) / 2
    case 'pin-end':
      return top + h - vh
    default:
      return top
  }
}

export default function FlyingDrone() {
  const { theme } = useTheme()
  const layerRef = useRef(null)
  const sceneRef = useRef(null)

  useEffect(() => {
    let cancelled = false
    let keys = []
    let frame = 0

    const measure = () => {
      const wide = window.innerWidth / window.innerHeight > 1.1
      keys = waypoints(wide)
        .map((w) => ({ k: keyFor(w), pose: w.pose }))
        .filter((w) => w.k !== null)
        .sort((a, b) => a.k - b.k)
    }

    const update = () => {
      frame = 0
      const s = sceneRef.current
      if (!s || !keys.length) return
      const y = window.scrollY
      let pose = keys[keys.length - 1].pose
      if (y <= keys[0].k) pose = keys[0].pose
      else {
        for (let i = 0; i < keys.length - 1; i++) {
          const a = keys[i]
          const b = keys[i + 1]
          if (y >= a.k && y <= b.k) {
            const t = smooth((y - a.k) / Math.max(b.k - a.k, 1))
            pose = {}
            for (const p of Object.keys(a.pose)) pose[p] = lerp(a.pose[p], b.pose[p], t)
            break
          }
        }
      }
      s.setPose(pose)
    }
    const onScroll = () => {
      if (!frame) frame = requestAnimationFrame(update)
    }
    const onResize = () => {
      measure()
      onScroll()
    }

    importScene(() => import('../three/droneScene.js')).then(({ mountDrone }) => {
      if (cancelled || !layerRef.current) return
      sceneRef.current = resilient(mountDrone, layerRef.current, {
        dark: document.documentElement.dataset.theme === 'dark',
        flight: true,
      })
      measure()
      update()
    })

    // Sections settle (images, lazy 3D) after mount — re-measure a few times
    const ro = new ResizeObserver(onResize)
    ro.observe(document.body)
    window.addEventListener('scroll', onScroll, { passive: true })
    window.addEventListener('resize', onResize)
    return () => {
      cancelled = true
      cancelAnimationFrame(frame)
      ro.disconnect()
      window.removeEventListener('scroll', onScroll)
      window.removeEventListener('resize', onResize)
      sceneRef.current?.dispose()
      sceneRef.current = null
    }
  }, [])

  useEffect(() => {
    sceneRef.current?.setTheme(theme === 'dark')
  }, [theme])

  // Portalled to <body>: the page wrapper animates with a transform, which
  // would otherwise make this "fixed" layer scroll with the page.
  return createPortal(<div className="flying-drone" ref={layerRef} aria-hidden="true" />, document.body)
}
