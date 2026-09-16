import { createContext, useContext, useEffect, useState, useCallback } from 'react'
import { authApi } from '../services/api.js'

const AuthContext = createContext(null)

const TOKEN_KEY = 'fg_access_token'
const USER_KEY = 'fg_user'

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    const raw = localStorage.getItem(USER_KEY)
    return raw ? JSON.parse(raw) : null
  })
  const [token, setToken] = useState(() => localStorage.getItem(TOKEN_KEY))
  // Guards ProtectedRoute while we double-check the token on first load
  const [initializing, setInitializing] = useState(true)

  const persistSession = useCallback((nextToken, nextUser) => {
    if (nextToken) {
      localStorage.setItem(TOKEN_KEY, nextToken)
      setToken(nextToken)
    }
    if (nextUser) {
      localStorage.setItem(USER_KEY, JSON.stringify(nextUser))
      setUser(nextUser)
    }
  }, [])

  const logout = useCallback(() => {
    localStorage.removeItem(TOKEN_KEY)
    localStorage.removeItem(USER_KEY)
    setToken(null)
    setUser(null)
  }, [])

  // On first mount, verify any stored token is still valid before letting
  // ProtectedRoute trust it.
  useEffect(() => {
    let cancelled = false

    async function checkSession() {
      if (!token) {
        setInitializing(false)
        return
      }
      try {
        const { data } = await authApi.me()
        if (!cancelled) {
          setUser(data.user)
          localStorage.setItem(USER_KEY, JSON.stringify(data.user))
        }
      } catch {
        if (!cancelled) logout()
      } finally {
        if (!cancelled) setInitializing(false)
      }
    }

    checkSession()
    return () => {
      cancelled = true
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const value = {
    user,
    token,
    isAuthenticated: Boolean(token && user),
    initializing,
    login: (nextToken, nextUser) => persistSession(nextToken, nextUser),
    logout,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth phải được dùng bên trong <AuthProvider>')
  return ctx
}
