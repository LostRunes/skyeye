import { CuteDrone } from '../components/LeadStatus'

// The animated sky behind every spin page: drifting glow blobs, twinkling
// stars and a little squadron of drone characters flying their own loops.
// Purely decorative (aria-hidden); motion stops for reduced-motion users.
const SQUAD = [
  { glow: '#5ef2ff', accent: '#22d3ee', size: 120, top: '8%', dur: 26, delay: 0, path: 'a' },
  { glow: '#ff6b9d', accent: '#ff6b9d', size: 84, top: '24%', dur: 34, delay: -12, path: 'b' },
  { glow: '#ffd166', accent: '#ffd166', size: 64, top: '62%', dur: 30, delay: -6, path: 'a' },
  { glow: '#7c5cff', accent: '#7c5cff', size: 96, top: '78%', dur: 38, delay: -20, path: 'b' },
  { glow: '#4ade80', accent: '#4ade80', size: 56, top: '44%', dur: 22, delay: -15, path: 'c' },
]

const BUBBLES = { 0: 'good luck!', 1: 'wheee!', 3: 'spin it!' }

export default function SkyParty({ quiet = false }) {
  return (
    <div className={`sp-sky ${quiet ? 'is-quiet' : ''}`} aria-hidden="true">
      <span className="sp-blob sp-blob--a" />
      <span className="sp-blob sp-blob--b" />
      <span className="sp-blob sp-blob--c" />
      <div className="sp-stars" />
      {SQUAD.map((d, i) => (
        <div
          key={i}
          className={`sp-drone sp-drone--${d.path}`}
          style={{ top: d.top, width: d.size, animationDuration: `${d.dur}s`, animationDelay: `${d.delay}s` }}
        >
          <div className="sp-drone-bob" style={{ animationDelay: `${d.delay / 3}s` }}>
            <CuteDrone text={false} glow={d.glow} accent={d.accent} />
            {!quiet && BUBBLES[i] && <span className="sp-bubble">{BUBBLES[i]}</span>}
          </div>
        </div>
      ))}
    </div>
  )
}
