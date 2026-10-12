import { useEffect, useRef } from 'react'
import { CDN } from '../cdn'

// Dark-mode home hero. Same layout, type and buttons as the light VideoHero so
// the two themes read as one site; only the footage, headline and colours change.
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
    <section className="video-hero video-hero--dark">
      <div className="vh-media">
        <video
          ref={videoRef}
          src={`${CDN}/videos/hero-background.mp4`}
          autoPlay
          muted
          loop
          playsInline
          preload="auto"
          aria-label="Drone flying against a dusk sky"
        />
      </div>
      <div className="vh-topfade" />

      <div className="container vh-content">
        <div className="vh-eyebrow">
          <span className="vh-eyebrow-dot" />
          <span>DRONES · ROBOTICS · INTELLIGENT SYSTEMS</span>
        </div>

        <h1 className="vh-title">
          THE FUTURE
          <br />
          OF FLIGHT.
        </h1>

        <div className="vh-body">
          <p className="vh-desc">
            Professional-grade drones, robotics and AI — designed, built and flown from Bhubaneswar,
            Odisha.
          </p>
          <div className="vh-ctas">
            <a className="vh-btn vh-btn-solid" href="#/services">[ Explore Services ]</a>
            <a className="vh-btn vh-btn-ghost" href="#/contact">[ Talk to Us ]</a>
          </div>
        </div>
      </div>

      <div className="vh-footer">
        <span className="vh-coords">[ LAT 20.2961° N · LON 85.8245° E ]</span>
      </div>
    </section>
  )
}
