import { useRef } from 'react'
import useIsMobile from '../hooks/useIsMobile'
import { clip, poster } from '../cdn'

// Sky Eye's own airframes and footage, cut down to 960px on delivery.
const techItems = [
  {
    num: '01',
    title: 'HEAVY-LIFT MULTIROTORS',
    desc: 'Hexacopter and octocopter platforms built in-house for spraying, payload drops and banner flights.',
    spec: 'BUILT IN BHUBANESWAR',
    video: clip('rnd-hexacopter'),
    poster: poster('rnd-hexacopter'),
    alt: 'Hexacopter hovering during a test flight'
  },
  {
    num: '02',
    title: 'AGRICULTURAL SPRAYERS',
    desc: 'Tank-carrying sprayers flown over wheat and mustard, with demonstrations run alongside the farmers who will use them.',
    spec: 'FIELD-PROVEN · HARYANA',
    video: clip('agri-spray-2'),
    poster: poster('agri-spray-2'),
    alt: 'Spraying drone in flight over a crop field'
  },
  {
    num: '03',
    title: 'FPV & CINEMATIC',
    desc: 'FPV and cinematic rigs for events, resorts and venues — fast, close, low passes no crane can match.',
    spec: 'DAY & NIGHT',
    video: clip('fpv-resort'),
    poster: poster('fpv-resort'),
    alt: 'FPV drone footage diving over a resort pool'
  },
  {
    num: '04',
    title: 'CUSTOM ENGINEERING',
    desc: 'Application-specific payload integration, custom framing and purpose-built airframes around a specific requirement.',
    spec: 'BESPOKE INTEGRATION',
    video: clip('rnd-flight'),
    poster: poster('rnd-flight'),
    alt: 'Custom-built multirotor in a test flight'
  }
]

export default function Technology() {
  const isMobile = useIsMobile()
  const videosRef = useRef([])

  const start = i => {
    const video = videosRef.current[i]
    if (!video) return
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return
    video.play().catch(() => {})
  }

  // Rewind on the way out, so the row goes back to the cover frame rather than
  // freezing on wherever the clip happened to be.
  const stop = i => {
    const video = videosRef.current[i]
    if (!video) return
    video.pause()
    video.currentTime = 0
  }

  return (
    <section className="section-tech" id="platforms">
      <div className="container py-2xl">
        <div className="section-header">
          <span className="section-label">06.4 / PLATFORMS</span>
          <h2 className="section-h2">FROM AIR TO INTELLIGENCE.</h2>
          <p className="section-desc">
            The airframes behind the services — designed, assembled and flown by the same team. Hover a row to play its footage.
          </p>
        </div>

        <div className="tech-list">
          {techItems.map((item, i) => (
            <article
              key={item.num}
              className="tech-item"
              onMouseEnter={() => start(i)}
              onMouseLeave={() => stop(i)}
            >
              <div className="tech-media">
                {isMobile || !item.video ? (
                  <img src={item.poster} alt={item.alt} loading="lazy" />
                ) : (
                <video
                  ref={el => { videosRef.current[i] = el }}
                  src={item.video}
                  poster={item.poster}
                  muted
                  loop
                  playsInline
                  preload="none"
                  aria-label={item.alt}
                />
                )}
                {!isMobile && item.video && <span className="tech-media-cue">Hover to play</span>}
              </div>

              <div className="tech-body">
                <span className="tech-num">{item.num}</span>
                <h3 className="tech-h3">{item.title}</h3>
                <p className="tech-sub">{item.desc}</p>
                <div className="tech-meta">
                  <span className="tech-spec">{item.spec}</span>
                  <span className="tech-arrow">→</span>
                </div>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  )
}
