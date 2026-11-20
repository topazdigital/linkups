import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from 'react'

export type AuthModalMode = 'login' | 'register'

type AuthModalContextValue = {
  mode: AuthModalMode | null
  openAuth: (mode: AuthModalMode) => void
  closeAuth: () => void
  setAuthMode: (mode: AuthModalMode) => void
}

const AuthModalContext = createContext<AuthModalContextValue | null>(null)

export function AuthModalProvider({ children }: { children: ReactNode }) {
  const [mode, setMode] = useState<AuthModalMode | null>(null)
  const openAuth = useCallback((nextMode: AuthModalMode) => setMode(nextMode), [])
  const closeAuth = useCallback(() => setMode(null), [])
  const setAuthMode = useCallback((nextMode: AuthModalMode) => setMode(nextMode), [])
  const value = useMemo(
    () => ({ mode, openAuth, closeAuth, setAuthMode }),
    [mode, openAuth, closeAuth, setAuthMode],
  )

  return <AuthModalContext.Provider value={value}>{children}</AuthModalContext.Provider>
}

export function useAuthModal() {
  const context = useContext(AuthModalContext)
  if (!context) throw new Error('useAuthModal must be used within AuthModalProvider')
  return context
}
