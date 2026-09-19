import { useEffect, useRef, useState } from 'react'

/**
 * Preloads a numbered sequence of images (frame_0001.ext ... frame_NNNN.ext)
 * and reports aggregate progress across one or more sequences.
 */
export function useImageSequence(sequences) {
  const [progress, setProgress] = useState(0)
  const [ready, setReady] = useState(false)
  const imagesRef = useRef({})

  useEffect(() => {
    let cancelled = false
    const totalFrames = sequences.reduce((sum, s) => sum + s.count, 0)
    let loaded = 0

    const result = {}
    sequences.forEach((s) => {
      result[s.key] = new Array(s.count)
    })
    imagesRef.current = result

    const pad = (n) => String(n).padStart(4, '0')

    const onOneLoaded = () => {
      loaded += 1
      if (!cancelled) setProgress(loaded / totalFrames)
      if (loaded >= totalFrames && !cancelled) setReady(true)
    }

    sequences.forEach((s) => {
      for (let i = 1; i <= s.count; i++) {
        const img = new Image()
        img.decoding = 'async'
        img.src = `${s.folder}/frame_${pad(i)}.${s.ext ?? 'webp'}`
        img.onload = () => {
          result[s.key][i - 1] = img
          onOneLoaded()
        }
        img.onerror = () => {
          // Don't let a single missing frame block the whole sequence.
          result[s.key][i - 1] = null
          onOneLoaded()
        }
      }
    })

    return () => {
      cancelled = true
    }
    // sequences is expected to be a stable, static config — intentionally not in deps.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return { images: imagesRef.current, progress, ready }
}
