import { useEffect } from 'react'
import Lenis from 'lenis'
import { ScrollTrigger } from 'gsap/ScrollTrigger'

// Lenis eases wheel and trackpad input into a smooth glide — the "no lag"
// feel of drone.riotters.com. Touch screens keep native scrolling.
// Other code reaches it through window.__lenis (see router.js).
export default function useSmoothScroll() {
  useEffect(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return

    const lenis = new Lenis({ lerp: 0.085, wheelMultiplier: 1, smoothWheel: true })
    window.__lenis = lenis
    lenis.on('scroll', ScrollTrigger.update)

    const root = document.documentElement
    let raf = 0
    const loop = (time) => {
      // Open menus and the photo viewer lock the page
      const locked = root.classList.contains('menu-locked')
      if (locked && !lenis.isStopped) lenis.stop()
      if (!locked && lenis.isStopped) lenis.start()
      lenis.raf(time)
      raf = requestAnimationFrame(loop)
    }
    raf = requestAnimationFrame(loop)

    return () => {
      cancelAnimationFrame(raf)
      lenis.destroy()
      delete window.__lenis
    }
  }, [])
}
