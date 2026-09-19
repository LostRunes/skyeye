import Reveal from './Reveal'
import ScrambleText from './ScrambleText'
import { CDN } from '../cdn'

// Original 6-item spec-sheet list — commented out while trying the 4-item
// video grid below. Restore by swapping which block COMPONENTS points to.
// const COMPONENTS = [
//   { n: '01', label: 'Airframe', desc: 'Carbon-reinforced shell, folded for transport.' },
//   { n: '02', label: 'Propulsion', desc: 'Brushless motors tuned for quiet, efficient lift.' },
//   { n: '03', label: 'Camera system', desc: 'Stabilized 3-axis gimbal, 4K sensor.' },
//   { n: '04', label: 'Flight controller', desc: 'Redundant sensor fusion for stable autonomy.' },
//   { n: '05', label: 'Battery', desc: 'High-density cells, hot-swappable.' },
//   { n: '06', label: 'Communication', desc: 'Long-range, low-latency digital link.' },
// ]

const COMPONENTS = [
  {
    n: '01',
    label: 'Airframe',
    desc: 'Carbon-reinforced shell, folded for transport.',
    video: `${CDN}/videos/component-01.mp4`,
  },
  {
    n: '02',
    label: 'Propulsion',
    desc: 'Brushless motors tuned for quiet, efficient lift.',
    video: `${CDN}/videos/component-02.mp4`,
  },
  {
    n: '03',
    label: 'Camera system',
    desc: 'Stabilized 3-axis gimbal, 4K sensor.',
    video: `${CDN}/videos/component-03.mp4`,
  },
  {
    n: '04',
    label: 'Flight controller',
    desc: 'Redundant sensor fusion for stable autonomy.',
    video: `${CDN}/videos/component-04.mp4`,
  },
]

export default function ProductSection() {
  return (
    <section className="product" id="aircraft">
      <Reveal as="h2" className="display-lg product__headline">
        ENGINEERED FROM
        <br />
        THE GROUND UP.
      </Reveal>
      <Reveal as="p" className="product__lede" delay={60}>
        Designed, assembled, manufactured, tested and commissioned in Bhubaneswar, Odisha.
      </Reveal>

      <Reveal className="product__visual" delay={100}>
        {/* <img src={`${CDN}/frames/frame_0045.webp`} alt="SkyEye aircraft, fully unfolded" loading="lazy" /> */}
        <img src={`${CDN}/frames2/frame_0070.webp`} alt="SkyEye aircraft, fully assembled" loading="lazy" />
      </Reveal>

      {/* Original hairline spec-sheet layout — commented out with COMPONENTS above.
      <div className="component-line" role="list">
        {COMPONENTS.map((c, i) => (
          <Reveal as="div" className="component-line__item" key={c.n} delay={i * 60} role="listitem">
            <span className="component-line__num">{c.n}</span>
            <span className="component-line__label">{c.label}</span>
            <span className="component-line__desc">{c.desc}</span>
          </Reveal>
        ))}
      </div>
      */}

      <div className="component-grid" role="list">
        {COMPONENTS.map((c, i) => (
          <Reveal
            as="div"
            className="component-grid__item"
            key={c.n}
            delay={i * 80}
            role="listitem"
          >
            <video
              className="component-grid__video"
              src={c.video}
              autoPlay
              muted
              loop
              playsInline
              preload="metadata"
            />
            <div className="component-grid__scrim" />
            <div className="component-grid__text">
              <span className="component-grid__num">{c.n}</span>
              <h3 className="component-grid__label">{c.label}</h3>
              <ScrambleText as="p" className="component-grid__desc" text={c.desc} trigger="hover" />
            </div>
          </Reveal>
        ))}
      </div>
    </section>
  )
}
