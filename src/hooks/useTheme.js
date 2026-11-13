import { createContext, createElement, useCallback, useContext, useEffect, useState } from 'react'

// Only a visitor's own choice from the toggle is saved. (The old key,
// 'skyeye-theme', was written on every visit, so it can't tell a real choice
// from the old light default; it is ignored.)
const STORAGE_KEY = 'skyeye-theme-choice'
const DEFAULT = 'dark'
const ThemeContext = createContext({ theme: DEFAULT, toggle: () => {} })

const readStored = () => {
  try {
    const v = localStorage.getItem(STORAGE_KEY)
    return v === 'dark' || v === 'light' ? v : DEFAULT
  } catch {
    return DEFAULT
  }
}

/**
 * Dark is the default; light swaps the colour tokens back to the original
 * light design. Switching theme never moves the reader: same page, same
 * scroll position.
 */
export function ThemeProvider({ children }) {
  const [theme, setTheme] = useState(readStored)

  useEffect(() => {
    document.documentElement.dataset.theme = theme
  }, [theme])

  const toggle = useCallback(() => {
    setTheme((t) => {
      const next = t === 'dark' ? 'light' : 'dark'
      try {
        localStorage.setItem(STORAGE_KEY, next)
      } catch {
        /* private mode — the toggle still works for this visit */
      }
      return next
    })
  }, [])

  return createElement(ThemeContext.Provider, { value: { theme, toggle } }, children)
}

export const useTheme = () => useContext(ThemeContext)
