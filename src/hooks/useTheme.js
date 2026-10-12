import { createContext, createElement, useCallback, useContext, useEffect, useState } from 'react'

const STORAGE_KEY = 'skyeye-theme'
const ThemeContext = createContext({ theme: 'light', toggle: () => {} })

const readStored = () => {
  try {
    const v = localStorage.getItem(STORAGE_KEY)
    return v === 'dark' || v === 'light' ? v : 'light'
  } catch {
    return 'light'
  }
}

/**
 * Light is the default (Abinash's design). Dark swaps the colour tokens and
 * replaces the home hero with the Yogisha "future of flight" hero, so turning
 * it on also takes the reader back up to that hero.
 */
export function ThemeProvider({ children }) {
  const [theme, setTheme] = useState(readStored)

  useEffect(() => {
    document.documentElement.dataset.theme = theme
    try {
      localStorage.setItem(STORAGE_KEY, theme)
    } catch {
      /* private mode — the toggle still works for this visit */
    }
  }, [theme])

  const toggle = useCallback(() => {
    setTheme((t) => {
      const next = t === 'dark' ? 'light' : 'dark'
      if (next === 'dark') {
        requestAnimationFrame(() =>
          document.getElementById('home')?.scrollIntoView({ behavior: 'smooth' })
        )
      }
      return next
    })
  }, [])

  return createElement(ThemeContext.Provider, { value: { theme, toggle } }, children)
}

export const useTheme = () => useContext(ThemeContext)
