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
 * Light is the default (Abinash's design); dark swaps the colour tokens.
 * Switching theme never moves the reader: same page, same scroll position.
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

  const toggle = useCallback(() => setTheme((t) => (t === 'dark' ? 'light' : 'dark')), [])

  return createElement(ThemeContext.Provider, { value: { theme, toggle } }, children)
}

export const useTheme = () => useContext(ThemeContext)
