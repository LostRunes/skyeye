import { useEffect, useRef, useState } from 'react'
import { clamp, piecewise, beatVisibility, smoothstep } from '../utils/motion'
import { CDN } from '../cdn'
import DriftWall from './DriftWall'
// Aurora + MoltenMetal WebGL hero backdrop, and the MaskedHeading
// video-in-text treatment — both commented out. Hero text is plain white;
// the plain video background stays active behind it.
// import Aurora from './Aurora'
// import MoltenMetal from './MoltenMetal'
// import MaskedHeading from './MaskedHeading'

// The hero-only WebGL backdrop unmounts once the drone starts its journey
// (with a little hysteresis so it doesn't mount/unmount on scroll jitter
// right at the boundary), and remounts if the user scrolls back up to it.
const HERO_FX_MOUNT_BELOW = 0.08
const HERO_FX_UNMOUNT_ABOVE = 0.11

// The journey is two acts sharing one scroll timeline. Act one (assembly)
// runs from 0 to SPLIT; act two (flight) takes over from SPLIT to 1 with a
// hard cut — the assembly sequence ends on an extreme close-up and the
// flight sequence picks up on its first frame right after.
const SPLIT = 0.72

// Act one frame position (0..1 across the assembly sequence). Frames up to
// roughly #64 play out while the drone is centered/moving left/holding
// left; the rest (the push into the close-up) are reserved for the
// move-right + arrival, so the final, tightest frame lands exactly at SPLIT.
const FRAME_CURVE_ASSEMBLY = [
  { p: 0, v: 0 },
  { p: 0.1, v: 0.02 },
  { p: 0.56, v: 0.708 },
  { p: SPLIT, v: 1 },
]

// Act two frame position (0..1 across the flight/fold sequence).
const FRAME_CURVE_FLIGHT = [
  { p: SPLIT, v: 0 },
  { p: 1, v: 1 },
]

// Horizontal position of the drone: -1 = left third, 0 = centered, 1 = right
// third. Act two starts back at center (a deliberate cut) then flicks left
// and right once — "moving around" — before settling.
const X_CURVE = [
  { p: 0, v: 0 },
  { p: 0.18, v: 0 },
  { p: 0.34, v: -1 },
  { p: 0.56, v: -1 },
  { p: SPLIT, v: 1 },
  { p: SPLIT, v: 0 },
  { p: SPLIT + 0.16 * (1 - SPLIT), v: -1 },
  { p: SPLIT + 0.55 * (1 - SPLIT), v: 1 },
  { p: 1, v: 1 },
]

// Punch in on the close-up right as act one ends, then cut back to normal
// framing for act two's fresh scene.
const ZOOM_CURVE = [
  { p: 0.6, v: 1 },
  { p: SPLIT, v: 1.85 },
  { p: SPLIT, v: 1 },
  { p: 1, v: 1 },
]

// The page opens on text alone — the drone fades in only once the user
// starts scrolling, rather than being visible on first paint.
const CANVAS_REVEAL_END = 0.05

// The drift-wall background only belongs to act two — it fades in right at
// the cut to the flight sequence and stays up through the rest of the build.
const BACKGROUND_REVEAL_START = SPLIT

const HERO_RANGE = [-0.05, 0.1]
const PANEL_1_RANGE = [0.2, 0.56]
const PANEL_2_RANGE = [0.56, SPLIT]

const SMOOTHING = 0.09
const SETTLE_EPSILON = 0.0006

export default function DroneJourney({ assemblyImages, flightImages, scrollLength = 600 }) {
  const containerRef = useRef(null)
  const backgroundRef = useRef(null)
  const canvasRef = useRef(null)
  const wrapRef = useRef(null)
  const heroRef = useRef(null)
  const heroFxRef = useRef(null)
  const panel1Ref = useRef(null)
  const panel2Ref = useRef(null)
  const cueRef = useRef(null)

  const [heroFxMounted, setHeroFxMounted] = useState(true)
  const heroFxMountedRef = useRef(true)

  const rawRef = useRef(0)
  const smoothedRef = useRef(0)
  const runningRef = useRef(false)
  const sizeRef = useRef({ w: 0, h: 0, dpr: 1 })
  const reducedMotionRef = useRef(false)

  const assemblyCount = assemblyImages.length
  const flightCount = flightImages.length

  useEffect(() => {
    reducedMotionRef.current = window.matchMedia('(prefers-reduced-motion: reduce)').matches
  }, [])

  const applyBeat = (el, range) => {
    if (!el) return
    const { opacity, translate } = beatVisibility(smoothedRef.current, range)
    el.style.opacity = opacity
    el.style.transform = `translateY(${translate}px)`
    el.style.pointerEvents = opacity > 0.5 ? 'auto' : 'none'
  }

  const render = () => {
    const canvas = canvasRef.current
    const wrap = wrapRef.current
    const background = backgroundRef.current
    if (!canvas || !wrap) return
    const { w, h, dpr } = sizeRef.current
    const p = smoothedRef.current

    const useFlight = p >= SPLIT
    const activeImages = useFlight ? flightImages : assemblyImages
    const activeCount = useFlight ? flightCount : assemblyCount
    const activeCurve = useFlight ? FRAME_CURVE_FLIGHT : FRAME_CURVE_ASSEMBLY

    if (w > 0 && h > 0 && activeCount > 0) {
      const idx = clamp(
        Math.round(piecewise(p, activeCurve) * (activeCount - 1)),
        0,
        activeCount - 1,
      )
      const img = activeImages[idx]
      const ctx = canvas.getContext('2d')
      ctx.setTransform(1, 0, 0, 1, 0, 0)
      ctx.clearRect(0, 0, canvas.width, canvas.height)
      if (img) {
        const iw = img.naturalWidth || img.width
        const ih = img.naturalHeight || img.height
        if (iw && ih) {
          const scale = Math.min(w / iw, h / ih)
          const dw = iw * scale
          const dh = ih * scale
          const dx = (w - dw) / 2
          const dy = (h - dh) / 2
          ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
          ctx.drawImage(img, dx, dy, dw, dh)
        }
      }
    }

    const mobile = window.innerWidth <= 820
    const maxOffset = mobile ? 0 : Math.min(window.innerWidth * 0.29, 460)
    const xValue = piecewise(p, X_CURVE)
    const zoomValue = mobile ? 1 : piecewise(p, ZOOM_CURVE)
    wrap.style.transform = `translate(-50%, -50%) translateX(${xValue * maxOffset}px) scale(${zoomValue})`
    wrap.style.opacity = smoothstep(0, CANVAS_REVEAL_END, p)

    if (background) {
      background.style.opacity = smoothstep(
        BACKGROUND_REVEAL_START,
        BACKGROUND_REVEAL_START + 0.03,
        p,
      )
    }

    applyBeat(heroRef.current, HERO_RANGE)
    applyBeat(cueRef.current, HERO_RANGE)
    if (heroFxRef.current) {
      heroFxRef.current.style.opacity = beatVisibility(p, HERO_RANGE).opacity
    }
    applyBeat(panel1Ref.current, PANEL_1_RANGE)
    applyBeat(panel2Ref.current, PANEL_2_RANGE)

    if (heroFxMountedRef.current && p > HERO_FX_UNMOUNT_ABOVE) {
      heroFxMountedRef.current = false
      setHeroFxMounted(false)
    } else if (!heroFxMountedRef.current && p < HERO_FX_MOUNT_BELOW) {
      heroFxMountedRef.current = true
      setHeroFxMounted(true)
    }
  }

  const tick = () => {
    const raw = rawRef.current
    const smoothed = smoothedRef.current
    const factor = reducedMotionRef.current ? 1 : SMOOTHING
    const next = smoothed + (raw - smoothed) * factor

    if (Math.abs(raw - next) < SETTLE_EPSILON) {
      smoothedRef.current = raw
      render()
      runningRef.current = false
      return
    }

    smoothedRef.current = next
    render()
    requestAnimationFrame(tick)
  }

  const ensureRunning = () => {
    if (!runningRef.current) {
      runningRef.current = true
      requestAnimationFrame(tick)
    }
  }

  useEffect(() => {
    const measure = () => {
      const el = containerRef.current
      if (!el) return
      const rect = el.getBoundingClientRect()
      const total = rect.height - window.innerHeight
      const raw = total > 0 ? clamp(-rect.top / total) : rect.top <= 0 ? 1 : 0
      rawRef.current = raw
      ensureRunning()
    }

    const resize = () => {
      const canvas = canvasRef.current
      if (!canvas) return
      const rect = canvas.getBoundingClientRect()
      const dpr = Math.min(window.devicePixelRatio || 1, 2)
      canvas.width = Math.round(rect.width * dpr)
      canvas.height = Math.round(rect.height * dpr)
      sizeRef.current = { w: rect.width, h: rect.height, dpr }
    }

    resize()
    measure()
    render()

    let ticking = false
    const onScroll = () => {
      if (!ticking) {
        ticking = true
        requestAnimationFrame(() => {
          ticking = false
          measure()
        })
      }
    }
    const onResize = () => {
      resize()
      measure()
    }

    const ro = new ResizeObserver(onResize)
    if (canvasRef.current) ro.observe(canvasRef.current)

    window.addEventListener('scroll', onScroll, { passive: true })
    window.addEventListener('resize', onResize)

    return () => {
      window.removeEventListener('scroll', onScroll)
      window.removeEventListener('resize', onResize)
      ro.disconnect()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [assemblyCount, flightCount])

  return (
    <section id="hero" ref={containerRef} className="journey" style={{ height: `${scrollLength}vh` }}>
      <div className="journey__stage">
        <div className="journey__background" ref={backgroundRef}>
          <DriftWall
            columns={5}
            tileWidth={200}
            tileHeight={132}
            gap={18}
            tilt={16}
            turn={-14}
            perspective={1200}
            depth={120}
            speed={42}
            direction="up"
            variance={0.45}
            parallax={0.6}
            lift={64}
            fade={0.6}
            dim={0.55}
            overlayColor="#0b0b0c"
            radius={14}
            roll={0}
            pauseOnHover={false}
            grayscale
          />
        </div>

        {heroFxMounted && (
          <div className="journey__hero-fx" ref={heroFxRef}>
            {/* Aurora + MoltenMetal WebGL backdrop — commented out while trying
            a plain video background below. Uncomment to switch back.
            <Aurora colorStops={['#111214', '#c9793f', '#2a2d33']} blend={0.55} amplitude={0.8} speed={0.7} />
            <div className="journey__hero-fx-metal">
              <MoltenMetal
                color1="#0b0b0c"
                color2="#8a4a24"
                color3="#e0985a"
                speed={0.3}
                scale={4}
                detail={3}
                glow={1.4}
                coreSize={0.1}
                swirl={1}
                fold={-0.2}
                blackPoint={0.05}
                brightness={1.1}
                colorMode="molten"
                grain
                grainIntensity={0.05}
                mouseInteraction
                mouseStrength={0.25}
                opacity={0.8}
              />
            </div>
            */}
            <video
              className="journey__hero-fx-video"
              src={`${CDN}/videos/hero-background.mp4`}
              autoPlay
              muted
              loop
              playsInline
              preload="auto"
            />
            <div className="journey__hero-fx-scrim" />
          </div>
        )}

        <div className="journey__canvas-wrap" ref={wrapRef}>
          <canvas ref={canvasRef} className="journey__canvas" aria-hidden="true" />
        </div>

        <div className="journey__hero" ref={heroRef}>
          <div className="journey__hero-inner">
            <p className="eyebrow">Sky Eye Technology — Bhubaneswar, Odisha</p>
            {/* Video-in-text MaskedHeading treatment — commented out per
            request; plain white heading restored below. Re-enable by
            swapping the h1 for the MaskedHeading block (see git history /
            earlier version) if this comes back. */}
            <h1 className="display-xl">
              THE FUTURE
              <br />
              OF FLIGHT.
            </h1>
            <p className="journey__hero-sub">
              Professional-grade drones, robotics and AI — unfolding the unfiltered.
            </p>
          </div>
        </div>

        <div className="journey__panel journey__panel--right" ref={panel1Ref}>
          <div className="journey__panel-inner">
            <span className="journey__index">01</span>
            <h2 className="display-md">
              BUILT FOR
              <br />
              PRECISION
            </h2>
            <p className="journey__copy">
              Every flight begins with engineering discipline — from design and assembly
              through testing and commissioning.
            </p>
            <div className="spec-list">
              <div className="spec-list__item">
                <span className="spec-list__value">UAVs</span>
                <span className="spec-list__label">Professional drones</span>
              </div>
              <div className="spec-list__item">
                <span className="spec-list__value">Robotics</span>
                <span className="spec-list__label">BOT systems</span>
              </div>
              <div className="spec-list__item">
                <span className="spec-list__value">AI</span>
                <span className="spec-list__label">Generative AI</span>
              </div>
            </div>
          </div>
        </div>

        <div className="journey__panel journey__panel--left" ref={panel2Ref}>
          <div className="journey__panel-inner">
            <span className="journey__index">02</span>
            <h2 className="display-md">
              INTELLIGENCE
              <br />
              IN THE AIR
            </h2>
            <p className="journey__copy">
              Autonomous systems that turn complex aerial environments into actionable
              information.
            </p>
            <div className="capability-list">
              <div className="capability-list__item">
                <span className="capability-list__num">01 — ROBOTICS</span>
                <h3 className="capability-list__title">Robotic systems</h3>
                <p className="capability-list__desc">
                  BOT development and UAV/robot integration and research.
                </p>
              </div>
              <div className="capability-list__item">
                <span className="capability-list__num">02 — AI</span>
                <h3 className="capability-list__title">Artificial intelligence</h3>
                <p className="capability-list__desc">
                  Generative AI awareness, training and applied research.
                </p>
              </div>
              <div className="capability-list__item">
                <span className="capability-list__num">03 — R&D</span>
                <h3 className="capability-list__title">Research &amp; development</h3>
                <p className="capability-list__desc">
                  UAV and robotics research for defence and public-sector applications.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Scroll cue removed per request — kept here, disabled, for easy re-enable.
        <div className="journey__cue" ref={cueRef}>
          SCROLL TO EXPLORE
          <span className="journey__cue-line" />
        </div>
        */}
      </div>
    </section>
  )
}
