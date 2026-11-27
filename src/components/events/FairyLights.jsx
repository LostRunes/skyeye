// Strings of fairy lights swagged along the four edges of their (position:
// relative) parent. Each string is a thin wire drawn as quadratic swags with a
// bulb at evenly spaced points on it; the bulbs twinkle out of step.
const COLOURS = ['#ffd27a', '#ff9b7a', '#fff3d6', '#9fd6c8', '#f2a7b8', '#ffc457']
const SAG = 14 // px a swag hangs

function Edge({ side, bulbs, swags }) {
  const vertical = side === 'left' || side === 'right'
  // The wire, in a 100 x SAG+8 box stretched along the edge (stroke kept 1.5px)
  const d = Array.from({ length: swags }, (_, i) => {
    const a = (i * 100) / swags
    const b = ((i + 1) * 100) / swags
    return `${i ? '' : `M${a},4 `}Q${(a + b) / 2},${4 + 2 * SAG} ${b},4`
  }).join(' ')
  return (
    <div className={`fl-edge fl-edge--${side}`} aria-hidden="true">
      <svg viewBox={vertical ? `0 0 ${SAG + 8} 100` : `0 0 100 ${SAG + 8}`} preserveAspectRatio="none">
        <path d={vertical ? d.replace(/(-?[\d.]+),(-?[\d.]+)/g, '$2,$1') : d} fill="none" stroke="#2f2926" strokeWidth="1.5" vectorEffect="non-scaling-stroke" />
      </svg>
      {Array.from({ length: bulbs }, (_, i) => {
        const along = (i + 0.5) / bulbs // 0..1 along the edge
        const t = (along * swags) % 1 // position within its swag
        const hang = 4 + 4 * SAG * t * (1 - t) // matches the quadratic wire
        const style = {
          '--c': COLOURS[i % COLOURS.length],
          animationDelay: `${((i * 0.37) % 2.4).toFixed(2)}s`,
          ...(vertical ? { top: `${along * 100}%`, left: `${hang}px` } : { left: `${along * 100}%`, top: `${hang}px` }),
        }
        return <span key={i} className="fl-bulb" style={style} />
      })}
    </div>
  )
}

export default function FairyLights() {
  return (
    <>
      <Edge side="top" bulbs={26} swags={5} />
      <Edge side="bottom" bulbs={26} swags={5} />
      <Edge side="left" bulbs={10} swags={3} />
      <Edge side="right" bulbs={10} swags={3} />
    </>
  )
}
