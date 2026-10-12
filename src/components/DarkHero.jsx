import { useEffect, useRef } from 'react'
import { CDN } from '../cdn'

// The Yogisha hero, lifted out of the drone journey so it can stand in for
// the home hero in dark mode: looping footage, a scrim, and plain white type.
export default function DarkHero() {
  const videoRef = useRef(null)

  useEffect(() => {
    const video = videoRef.current
    if (!video) return
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      video.pause()
      return
    }
    const observer = new IntersectionObserver(
      ([entry]) => (entry.isIntersecting ? video.play().catch(() => {}) : video.pause()),
      { threshold: 0.1 }
    )
    observer.observe(video)
    return () => observer.disconnect()
  }, [])

  return (
    <section className="yg-hero">
      <video
        ref={videoRef}
        className="yg-hero-video"
        src={`${CDN}/videos/hero-background.mp4`}
        autoPlay
        muted
        loop
        playsInline
        preload="auto"
        aria-hidden="true"
      />
      <div className="yg-hero-scrim" />

      <div className="yg-hero-inner">
        <p className="yg-eyebrow">Sky Eye Technology — Bhubaneswar, Odisha</p>
        <h1 className="yg-display-xl">
          THE FUTURE
          <br />
          OF FLIGHT.
        </h1>
        <p className="yg-hero-sub">
          Professional-grade drones, robotics and AI — unfolding the unfiltered.
        </p>
        <div className="yg-hero-ctas">
          <a className="yg-btn yg-btn--primary" href="#services">
            Explore services
          </a>
          <a className="yg-btn yg-btn--ghost" href="#contact">
            Contact us
          </a>
        </div>
      </div>

      <a className="yg-hero-cue" href="#overview" aria-label="Scroll to overview">
        Scroll
        <span className="yg-hero-cue-line" />
      </a>
    </section>
  )
}
