import { useEffect, useRef, useState } from 'react'
import { ik } from '../cdn'
import useIsMobile from '../hooks/useIsMobile'

// Abinash's original strip footage, hosted on his ImageKit account.
const VIDEO_SRC = 'https://ik.imagekit.io/tm5te9cjl/skyeye/13623219_3840_2160_30fps.mp4'
const videoPoster = ik('site/video-poster.jpg', 'w-1600')

const wantsReducedMotion = () =>
  typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches

export default function VideoStrip() {
  const isMobile = useIsMobile()
  const videoRef = useRef(null)
  const pausedByUser = useRef(false)
  // Decided once, at first render: pausing a video that has not started yet fires
  // no event, so the button has to start in the right state rather than be corrected.
  const [autoplayAllowed] = useState(() => !wantsReducedMotion())
  const [playing, setPlaying] = useState(autoplayAllowed)

  // A 4K loop is not worth streaming while it is off screen, and autoplay is not
  // worth forcing on someone who asked for reduced motion.
  useEffect(() => {
    const video = videoRef.current
    if (!video) return

    if (!autoplayAllowed) {
      pausedByUser.current = true
      video.pause()
      return
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (pausedByUser.current) return
        if (entry.isIntersecting) {
          video.play().catch(() => setPlaying(false))
        } else {
          video.pause()
        }
      },
      { threshold: 0.15 }
    )
    observer.observe(video)
    return () => observer.disconnect()
  }, [autoplayAllowed])

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
    <section className="section-video-strip">
      <div className="container">
        <div className="video-strip-frame">
          {/* Main cinematic flight footage */}
          <div className="video-strip-canvas">
            {isMobile ? (
              <img src={videoPoster} alt="Monochrome aerial drone footage over a main road through a residential area" />
            ) : (
            <video
              ref={videoRef}
              src={VIDEO_SRC}
              poster={videoPoster}
              autoPlay={autoplayAllowed}
              muted
              loop
              playsInline
              preload="metadata"
              onPlay={() => setPlaying(true)}
              onPause={() => setPlaying(false)}
              aria-label="Monochrome aerial drone footage tracking traffic along a main road through a residential area"
            />
            )}
            <div className="video-strip-gradient" />

            <div className="video-strip-overlay">
              <div>
                <span className="vs-badge">FLIGHT CAM 04 // ACTIVE RUN</span>
                <p className="vs-title">HIGH-ENDURANCE FIELD RECONNAISSANCE</p>
              </div>
              {!isMobile && (
              <button
                className="vs-play-btn"
                type="button"
                onClick={toggle}
                title={playing ? 'Pause Stream' : 'Play Stream'}
                aria-label={playing ? 'Pause flight footage' : 'Play flight footage'}
              >
                <span className="material-symbols-outlined" style={{ fontSize: '18px', display: 'block', lineHeight: 1 }}>
                  {playing ? 'pause' : 'play_arrow'}
                </span>
              </button>
              )}
            </div>
          </div>

          {/* Telemetry Bar */}
          <div className="video-strip-telemetry">
            <div className="vst-col-1">
              <span className="vst-h">01 — AERIAL SYSTEMS</span>
              <span className="vst-v">Professional UAV platforms for practical deployment.</span>
            </div>
            <div className="vst-col-2">
              FLIGHT DURATION: 01:42:19 · AUTONOMY: LVL 4
            </div>
            <div className="vst-col-3">
              <span className="vst-sec">▪ ALT: 120M</span> · VEL: 14.2 M/S · SENSORS: ACTIVE
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
