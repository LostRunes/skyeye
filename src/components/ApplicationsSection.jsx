import Reveal from './Reveal'
import { CDN } from '../cdn'

// Default (frames/) stills — commented out while trying frames2 below.
// const APPLICATIONS = [
//   {
//     n: '01',
//     title: 'Inspection',
//     desc: 'Mapping infrastructure, industrial sites and difficult-to-access environments.',
//     img: '/frames/frame_0001.webp',
//   },
//   {
//     n: '02',
//     title: 'Surveying',
//     desc: 'Rapid aerial data collection and terrain analysis.',
//     img: '/frames/frame_0045.webp',
//   },
//   {
//     n: '03',
//     title: 'Security',
//     desc: 'Persistent aerial monitoring and situational awareness.',
//     img: '/frames/frame_0020.webp',
//   },
//   {
//     n: '04',
//     title: 'Emergency response',
//     desc: 'Rapid deployment for aerial assessment.',
//     img: '/frames/frame_0055.webp',
//   },
// ]

// Sectors as publicly described in the company's Startup India listing.
const APPLICATIONS = [
  {
    n: '01',
    title: 'Industrial inspection',
    desc: 'Drone-based technology for inspecting infrastructure and industrial environments.',
    img: `${CDN}/images/applications/industrial-inspection.png`,
  },
  {
    n: '02',
    title: 'Agriculture',
    desc: 'Aerial technology for agricultural services and field operations.',
    img: `${CDN}/images/applications/agriculture.png`,
  },
  {
    n: '03',
    title: 'Hospitality',
    desc: 'Exploration of drone and emerging technology applications within hospitality.',
    img: `${CDN}/images/applications/hospitality.png`,
  },
  {
    n: '04',
    title: 'Public services',
    desc: 'Technology designed for applications within public-sector operations.',
    img: `${CDN}/images/applications/public-services.png`,
  },
  {
    n: '05',
    title: 'Homeland security',
    desc: 'Aerial and robotic technologies for security-oriented applications.',
    img: `${CDN}/images/applications/homeland-security.png`,
  },
  {
    n: '06',
    title: 'Defence',
    desc: 'Research and development of UAV and robotic technologies for defence-related requirements.',
    img: `${CDN}/images/applications/defence.png`,
  },
  {
    n: '07',
    title: 'Government & private sector',
    desc: 'Development of technology solutions for both government and private-sector applications.',
    // No dedicated photo supplied for this sector — reusing an aircraft still.
    img: `${CDN}/frames2/frame_0070.webp`,
  },
]

export default function ApplicationsSection() {
  return (
    <section className="applications" id="applications">
      <Reveal as="p" className="eyebrow applications__eyebrow">
        Applications
      </Reveal>

      {APPLICATIONS.map((a, i) => (
        <Reveal
          as="article"
          key={a.n}
          className={`application ${i % 2 === 1 ? 'application--reverse' : ''}`}
        >
          <div className="application__text">
            <span className="application__num">{a.n}</span>
            <h3 className="display-md">{a.title}</h3>
            <p>{a.desc}</p>
          </div>
          <div className="application__image">
            <img src={a.img} alt="" loading="lazy" />
          </div>
        </Reveal>
      ))}
    </section>
  )
}
