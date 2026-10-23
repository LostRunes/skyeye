import { useEffect, useRef, useState } from 'react'
import { cloudVideo, FOOTAGE, ik } from '../cdn'
import useIsMobile from '../hooks/useIsMobile'

const heroPoster = ik('site/hero-video-poster.jpg', 'w-1600')
const VIDEO_SRC = cloudVideo(FOOTAGE.hero, 'q_auto:eco,w_1920')

const wantsReducedMotion = () =>
  typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches

export default function VideoHero() {
  const sectionRef = useRef(null)
  const videoRef = useRef(null)
  const mediaRef = useRef(null)
  const contentRef = useRef(null)
  const eyebrowRef = useRef(null)
  const titleRef = useRef(null)
  const bodyRef = useRef(null)
  const cueRef = useRef(null)
  const pausedByUser = useRef(false)
  const isMobile = useIsMobile()
  const [motion] = useState(() => !wantsReducedMotion())
  const [playing, setPlaying] = useState(motion)

  // Scroll + pointer parallax. Both feed one paint pass so the layers never fight
  // over the transform property, and nothing re-renders React on scroll.
  useEffect(() => {
    const section = sectionRef.current
    if (!section || !motion) return

    const clamp01 = v => (v < 0 ? 0 : v > 1 ? 1 : v)
    let scrolled = 0        // 0 at rest, 1 when the hero has scrolled fully away
    let pointerX = 0        // -1 .. 1
    let pointerY = 0
    let frame = 0

    const paint = () => {
      frame = 0
      const depth = 1 - scrolled

      if (mediaRef.current) {
        // Background drifts down slower than the page, so it lags behind the content.
        mediaRef.current.style.transform =
          `translate3d(${(pointerX * 14).toFixed(2)}px, ${(scrolled * 140 + pointerY * 10).toFixed(2)}px, 0) scale(${(1.14 + scrolled * 0.06).toFixed(4)})`
      }
      if (contentRef.current) {
        contentRef.current.style.opacity = clamp01(1 - scrolled * 1.45).toFixed(3)
      }
      // Each layer rises at its own rate — that difference is the parallax.
      const layers = [
        [eyebrowRef, 40, 5],
        [titleRef, 78, 9],
        [bodyRef, 112, 6],
        [cueRef, 150, 0]
      ]
      for (const [ref, rise, drift] of layers) {
        if (!ref.current) continue
        ref.current.style.transform =
          `translate3d(${(pointerX * drift * -1).toFixed(2)}px, ${(scrolled * -rise + pointerY * drift * -0.6).toFixed(2)}px, 0)`
      }
      if (cueRef.current) cueRef.current.style.opacity = clamp01(depth * 1.6 - 0.15).toFixed(3)
    }

    const request = () => {
      if (!frame) frame = requestAnimationFrame(paint)
    }

    const onScroll = () => {
      const height = section.offsetHeight || 1
      scrolled = clamp01(-section.getBoundingClientRect().top / height)
      request()
    }

    const onPointer = event => {
      const { innerWidth, innerHeight } = window
      pointerX = (event.clientX / innerWidth) * 2 - 1
      pointerY = (event.clientY / innerHeight) * 2 - 1
      request()
    }

    const finePointer = window.matchMedia('(hover: hover) and (pointer: fine)').matches

    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    window.addEventListener('resize', onScroll)
    if (finePointer) window.addEventListener('pointermove', onPointer, { passive: true })
    return () => {
      if (frame) cancelAnimationFrame(frame)
      window.removeEventListener('scroll', onScroll)
      window.removeEventListener('resize', onScroll)
      window.removeEventListener('pointermove', onPointer)
    }
  }, [motion])

  // Only stream the loop while the hero is actually on screen.
  useEffect(() => {
    const video = videoRef.current
    if (!video) return
    if (!motion) {
      pausedByUser.current = true
      video.pause()
      return
    }
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (pausedByUser.current) return
        if (entry.isIntersecting) video.play().catch(() => setPlaying(false))
        else video.pause()
      },
      { threshold: 0.1 }
    )
    observer.observe(video)
    return () => observer.disconnect()
  }, [motion])

  const toggle = () => {
    const video = videoRef.current
    if (!video) return
    if (video.paused) {
      pausedByUser.current = false
      video.play().catch(() => setPlaying(false))
    } else {
      pausedByUser.current = true
      video.pause()
    }
  }

  return (
    <section className="video-hero" ref={sectionRef}>
      <div className="vh-media" ref={mediaRef}>
        {isMobile ? (
          <img src={heroPoster} alt="Quadcopter hovering against an open sky, seen from below" />
        ) : (
        <video
          ref={videoRef}
          src={VIDEO_SRC}
          poster={heroPoster}
          autoPlay={motion}
          muted
          loop
          playsInline
          preload="metadata"
          onPlay={() => setPlaying(true)}
          onPause={() => setPlaying(false)}
          aria-label="Quadcopter hovering against an open sky, seen from below"
        />
        )}
      </div>
      {/* Blends the white header into the footage; stays put while the video parallaxes */}
      <div className="vh-topfade" />

      <div className="container vh-content" ref={contentRef}>
        <div className="vh-eyebrow" ref={eyebrowRef}>
          <span className="vh-eyebrow-dot" />
          <span>DRONES · ROBOTICS · INTELLIGENT SYSTEMS</span>
        </div>

        <h1 className="vh-title" ref={titleRef}>
          ENGINEERED<br />WITHOUT COMPROMISE.
        </h1>

        <div className="vh-body" ref={bodyRef}>
          <p className="vh-desc">
            High-endurance autonomous systems for survey, security and public-safety
            operations — designed, built and flown in India.
          </p>
          <div className="vh-ctas">
            <a className="vh-btn vh-btn-solid" href="#/services">[ Explore Services ]</a>
            <a className="vh-btn vh-btn-ghost" href="#/contact">[ Talk to Us ]</a>
          </div>
        </div>
      </div>

      <div className="vh-footer" ref={cueRef}>
        <span className="vh-coords">[ LAT 20.2961° N · LON 85.8245° E ]</span>
        {!isMobile && (
        <button
          className="vh-toggle"
          type="button"
          onClick={toggle}
          title={playing ? 'Pause background footage' : 'Play background footage'}
          aria-label={playing ? 'Pause background footage' : 'Play background footage'}
        >
          <span className="material-symbols-outlined" style={{ fontSize: '16px', display: 'block', lineHeight: 1 }}>
            {playing ? 'pause' : 'play_arrow'}
          </span>
        </button>
        )}
      </div>
    </section>
  )
}
