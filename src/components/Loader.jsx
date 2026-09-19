export default function Loader({ progress }) {
  const pct = Math.round(progress * 100)
  return (
    <div className="loader" aria-live="polite">
      <div className="loader__mark">SKY EYE</div>
      <div className="loader__bar">
        <div className="loader__bar-fill" style={{ width: `${pct}%` }} />
      </div>
      <div className="loader__pct">{pct}%</div>
    </div>
  )
}
