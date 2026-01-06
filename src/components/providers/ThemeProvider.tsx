'use client'

import React, { createContext, useContext, useEffect, useState } from 'react'
import type { Theme, ThemeContextValue } from '@/types'

const ThemeContext = createContext<ThemeContextValue | undefined>(undefined)

interface ThemeProviderProps {
  children: React.ReactNode
  defaultTheme?: Theme
  storageKey?: string
}

export function ThemeProvider({
  children,
  defaultTheme = 'system',
  storageKey = 'palate-theme',
}: ThemeProviderProps) {
  const [theme, setThemeState] = useState<Theme>(defaultTheme)
  const [resolvedTheme, setResolvedTheme] = useState<'light' | 'dark'>('dark')
  const [mounted, setMounted] = useState(false)

  // Get system preference
  const getSystemTheme = (): 'light' | 'dark' => {
    if (typeof window === 'undefined') return 'dark'
    return window.matchMedia('(prefers-color-scheme: dark)').matches
      ? 'dark'
      : 'light'
  }

  // Resolve theme to actual light/dark value
  const resolveTheme = (theme: Theme): 'light' | 'dark' => {
    if (theme === 'system') {
      return getSystemTheme()
    }
    return theme
  }

  // Apply theme to document
  const applyTheme = (resolved: 'light' | 'dark') => {
    const root = document.documentElement
    root.classList.remove('light', 'dark')
    root.classList.add(resolved)
    
    // Update meta theme-color for mobile browsers
    const metaThemeColor = document.querySelector('meta[name="theme-color"]')
    if (metaThemeColor) {
      metaThemeColor.setAttribute(
        'content',
        resolved === 'dark' ? '#0A0A0A' : '#FAFAF9'
      )
    }
  }

  // Initialize theme from storage or system
  useEffect(() => {
    const stored = localStorage.getItem(storageKey) as Theme | null
    const initialTheme = stored || defaultTheme
    
    const getResolved = (t: Theme): 'light' | 'dark' => {
      if (t === 'system') {
        return getSystemTheme()
      }
      return t
    }
    
    const resolved = getResolved(initialTheme)
    
    setThemeState(initialTheme)
    setResolvedTheme(resolved)
    applyTheme(resolved)
    setMounted(true)
  }, [defaultTheme, storageKey])

  // Listen for system theme changes
  useEffect(() => {
    if (!mounted) return

    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)')
    
    const handleChange = () => {
      if (theme === 'system') {
        const resolved = getSystemTheme()
        setResolvedTheme(resolved)
        applyTheme(resolved)
      }
    }

    mediaQuery.addEventListener('change', handleChange)
    return () => mediaQuery.removeEventListener('change', handleChange)
  }, [theme, mounted])

  // Set theme function
  const setTheme = (newTheme: Theme) => {
    const resolved = resolveTheme(newTheme)
    
    setThemeState(newTheme)
    setResolvedTheme(resolved)
    applyTheme(resolved)
    localStorage.setItem(storageKey, newTheme)
  }

  // Prevent flash of wrong theme
  if (!mounted) {
    return (
      <div style={{ visibility: 'hidden' }}>
        {children}
      </div>
    )
  }

  return (
    <ThemeContext.Provider value={{ theme, resolvedTheme, setTheme }}>
      {children}
    </ThemeContext.Provider>
  )
}

export function useTheme(): ThemeContextValue {
  const context = useContext(ThemeContext)
  if (context === undefined) {
    // Return safe defaults if used outside provider (during SSR or initial render)
    return {
      theme: 'system',
      resolvedTheme: 'dark',
      setTheme: () => {},
    }
  }
  return context
}

// Hook to get just the resolved theme for simpler use cases
export function useResolvedTheme(): 'light' | 'dark' {
  const { resolvedTheme } = useTheme()
  return resolvedTheme
}