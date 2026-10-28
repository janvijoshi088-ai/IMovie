import { createContext, useEffect, useState } from 'react'
import api from '../api/client'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [token, setToken] = useState(() => localStorage.getItem('imovies_token'))
  const [loading, setLoading] = useState(true)

  // Sync token to axios headers
  useEffect(() => {
    if (token) {
      api.defaults.headers.common['Authorization'] = `Bearer ${token}`
    } else {
      delete api.defaults.headers.common['Authorization']
    }
  }, [token])

  // Verify session on initial load
  useEffect(() => {
    async function loadUser() {
      const storedToken = localStorage.getItem('imovies_token')
      if (!storedToken) {
        setLoading(false)
        return
      }

      try {
        api.defaults.headers.common['Authorization'] = `Bearer ${storedToken}`
        const res = await api.get('/auth/me')
        setUser(res.data.user)
        setToken(storedToken)
      } catch (err) {
        console.warn('Session verification failed or expired:', err.message)
        localStorage.removeItem('imovies_token')
        delete api.defaults.headers.common['Authorization']
        setUser(null)
        setToken(null)
      } finally {
        setLoading(false)
      }
    }

    loadUser()
  }, [])

  async function login(email, password) {
    try {
      const res = await api.post('/auth/login', { email, password })
      const { token: receivedToken, user: receivedUser } = res.data

      localStorage.setItem('imovies_token', receivedToken)
      api.defaults.headers.common['Authorization'] = `Bearer ${receivedToken}`
      setToken(receivedToken)
      setUser(receivedUser)
      return { success: true, user: receivedUser }
    } catch (err) {
      const message =
        err.response?.data?.message ||
        err.response?.data?.error ||
        'Failed to connect to authentication server. Make sure the backend is running.'
      throw new Error(message)
    }
  }

  async function register(userData) {
    try {
      const res = await api.post('/auth/register', userData)
      const { token: receivedToken, user: receivedUser } = res.data

      localStorage.setItem('imovies_token', receivedToken)
      api.defaults.headers.common['Authorization'] = `Bearer ${receivedToken}`
      setToken(receivedToken)
      setUser(receivedUser)
      return { success: true, user: receivedUser }
    } catch (err) {
      const message =
        err.response?.data?.message ||
        err.response?.data?.error ||
        'Registration failed. Please verify your details.'
      throw new Error(message)
    }
  }

  function logout() {
    localStorage.removeItem('imovies_token')
    delete api.defaults.headers.common['Authorization']
    setUser(null)
    setToken(null)
  }

  const value = {
    user,
    token,
    loading,
    isAuthenticated: Boolean(user),
    isAdmin: user?.role === 'admin',
    login,
    register,
    logout,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export default AuthContext
