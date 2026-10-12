import { useEffect, useRef } from 'react'
import { scramble } from '../utils/scramble'

/**
 * Text that decodes out of noise. A hidden copy of the final text holds the
 * width (the trick anduril.com uses), so the noise can never nudge the layout.
 *
 * Replays whenever `text` or `replay` changes, and on hover when `hover` is set
 * — either on itself or, via `hoverRef`, on a parent such as a whole link.
 */
export default function Scramble({ text, replay, hover = false, hoverRef, duration, className = '' }) {
  const liveRef = useRef(null)
  const cancelRef = useRef(() => {})

  const play = () => {
    cancelRef.current()
    cancelRef.current = scramble(liveRef.current, text, { duration })
  }

  useEffect(() => {
    play()
    return () => cancelRef.current()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [text, replay])

  useEffect(() => {
    const host = hoverRef?.current
    if (!hover || !host) return
    host.addEventListener('mouseenter', play)
    host.addEventListener('focus', play)
    return () => {
      host.removeEventListener('mouseenter', play)
      host.removeEventListener('focus', play)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hover, hoverRef, text])

  return (
    <span
      className={`scramble ${className}`}
      onMouseEnter={hover && !hoverRef ? play : undefined}
      aria-label={text}
    >
      <span className="scramble-size" aria-hidden="true">
        {text}
      </span>
      <span className="scramble-live" ref={liveRef} aria-hidden="true">
        {text}
      </span>
    </span>
  )
}
