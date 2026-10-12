import { useEffect, useState } from 'react'

// 900px is where this site's layouts already collapse to a single column.
const MOBILE_QUERY = '(max-width: 900px)'

/**
 * True on mobile-width viewports. Used to swap background and preview videos
 * for their cover frames: a phone should not be made to stream 4K clips it
 * cannot show at size, and autoplaying video there costs data for nothing.
 */
export default function useIsMobile() {
  const [isMobile, setIsMobile] = useState(
    () => typeof window !== 'undefined' && window.matchMedia(MOBILE_QUERY).matches
  )

  useEffect(() => {
    const mq = window.matchMedia(MOBILE_QUERY)
    const sync = event => setIsMobile(event.matches)
    mq.addEventListener('change', sync)
    return () => mq.removeEventListener('change', sync)
  }, [])

  return isMobile
}
