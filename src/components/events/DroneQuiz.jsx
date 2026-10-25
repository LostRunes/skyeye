import { useState } from 'react'
import { confetti } from './confetti'

// Five quick drone questions — the kind asked at the stall.
const QUESTIONS = [
  { q: 'What does UAV stand for?', options: ['Unmanned Aerial Vehicle', 'Universal Air Vessel', 'Ultra Agile Vehicle'], a: 0 },
  { q: 'How many propellers does a quadcopter have?', options: ['Two', 'Four', 'Six'], a: 1 },
  { q: 'What keeps a drone’s camera steady in flight?', options: ['The landing gear', 'A gimbal', 'The GPS'], a: 1 },
  { q: 'What does FPV stand for?', options: ['Fast Propeller Velocity', 'Flight Path Vector', 'First-Person View'], a: 2 },
  {
    q: 'How does a quadcopter turn on the spot?',
    options: ['It tilts its arms', 'It speeds up one pair of props over the other', 'It uses a rudder'],
    a: 1,
  },
]

export default function DroneQuiz() {
  const [i, setI] = useState(0)
  const [picked, setPicked] = useState(null)
  const [score, setScore] = useState(0)
  const done = i >= QUESTIONS.length

  const choose = (k) => {
    if (picked !== null) return
    setPicked(k)
    if (k === QUESTIONS[i].a) setScore((s) => s + 1)
  }

  const next = (e) => {
    const last = i === QUESTIONS.length - 1
    const final = score
    setPicked(null)
    setI(i + 1)
    if (last && final === QUESTIONS.length) {
      const r = e.currentTarget.getBoundingClientRect()
      confetti({ x: (r.left + r.width / 2) / innerWidth, y: r.top / innerHeight })
    }
  }

  const restart = () => {
    setI(0)
    setScore(0)
    setPicked(null)
  }

  return (
    <div className="arcade-card arcade-quiz">
      <div className="arcade-card-head">
        <span className="arcade-tag">GAME 03 · DEMO</span>
        <h4>Drone quiz</h4>
        <p>Five questions. Get them all right and you’re ready for the stall.</p>
      </div>

      <div className="quiz-progress" aria-hidden="true">
        {QUESTIONS.map((_, k) => (
          <span key={k} className={k < i ? 'is-done' : k === i && !done ? 'is-now' : ''} />
        ))}
      </div>

      {done ? (
        <div className="quiz-end">
          <p className="quiz-score">
            {score}
            <span>/{QUESTIONS.length}</span>
          </p>
          <p>{score === QUESTIONS.length ? 'Perfect score — drone pilot material.' : score >= 3 ? 'Nice! Nearly there.' : 'Come learn more at the stall.'}</p>
          <button type="button" className="btn-outline" onClick={restart}>
            [ Try again ]
          </button>
        </div>
      ) : (
        <div className="quiz-q" key={i}>
          <p className="quiz-question">
            <span>Q{i + 1}.</span> {QUESTIONS[i].q}
          </p>
          <div className="quiz-options">
            {QUESTIONS[i].options.map((o, k) => {
              const state = picked === null ? '' : k === QUESTIONS[i].a ? ' is-right' : k === picked ? ' is-wrong' : ' is-dim'
              return (
                <button key={o} type="button" className={`quiz-option${state}`} onClick={() => choose(k)} disabled={picked !== null}>
                  {o}
                </button>
              )
            })}
          </div>
          <button type="button" className="btn-request btn-request--sm quiz-next" onClick={next} disabled={picked === null}>
            {i === QUESTIONS.length - 1 ? 'See score' : 'Next'}
          </button>
        </div>
      )}
    </div>
  )
}
