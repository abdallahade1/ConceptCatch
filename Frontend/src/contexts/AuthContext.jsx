import { createContext, useContext, useState, useEffect } from 'react'
import axios from 'axios'

const AuthContext = createContext()

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}

const API_BASE = 'http://127.0.0.1:8000'

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  // Configure axios defaults
  axios.defaults.baseURL = API_BASE

  useEffect(() => {
    // Check for stored user data on app load
    const storedUser = localStorage.getItem('conceptcatch_user')
    const storedToken = localStorage.getItem('conceptcatch_token')
    
    if (storedUser && storedToken) {
      const userData = JSON.parse(storedUser)
      setUser(userData)
      // Set authorization header
      axios.defaults.headers.common['Authorization'] = `Bearer ${storedToken}`
    }
    
    setLoading(false)
  }, [])

  const login = async (userId) => {
    try {
      const response = await axios.post('/users/login', 
        new URLSearchParams({ user_id: userId }),
        {
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
          },
        }
      )
      
      const { user: userData, token } = response.data
      
      // Store user data and token
      localStorage.setItem('conceptcatch_user', JSON.stringify(userData))
      localStorage.setItem('conceptcatch_token', token)
      
      // Set authorization header
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`
      
      setUser(userData)
      return userData
    } catch (error) {
      console.error('Login error:', error)
      throw new Error(error.response?.data?.detail || 'Login failed')
    }
  }

  const logout = () => {
    // Clear stored data
    localStorage.removeItem('conceptcatch_user')
    localStorage.removeItem('conceptcatch_token')
    
    // Clear authorization header
    delete axios.defaults.headers.common['Authorization']
    
    setUser(null)
  }

  const getCurrentUser = async () => {
    try {
      const response = await axios.get('/users/me')
      return response.data.user
    } catch (error) {
      console.error('Get current user error:', error)
      // If token is invalid, logout
      if (error.response?.status === 401) {
        logout()
      }
      return null
    }
  }

  const value = {
    user,
    login,
    logout,
    getCurrentUser,
    loading,
    isAuthenticated: !!user,
    isTeacher: user?.role === 'teacher',
    isStudent: user?.role === 'student'
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}
