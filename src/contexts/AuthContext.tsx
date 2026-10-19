import React, { createContext, useContext, useState, useEffect } from 'react'
import { StaffUser, UserRole } from '@/types/domain'
import { DEMO_USERS } from '@/services/mockData'

interface AuthContextType {
  user: StaffUser | null
  isLoading: boolean
  loginAsDemo: (role: UserRole) => void
  logout: () => void
  hasRole: (allowedRoles: UserRole[]) => boolean
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

const AUTH_STORAGE_KEY = 'kko_current_auth_user'

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<StaffUser | null>(() => {
    try {
      const saved = localStorage.getItem(AUTH_STORAGE_KEY)
      if (saved) return JSON.parse(saved)
    } catch {
      // fallback
    }
    // Default demo user for instant accessibility
    return DEMO_USERS[0] // Admin
  })
  const [isLoading, setIsLoading] = useState(false)

  useEffect(() => {
    if (user) {
      localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(user))
    } else {
      localStorage.removeItem(AUTH_STORAGE_KEY)
    }
  }, [user])

  const loginAsDemo = (role: UserRole) => {
    setIsLoading(true)
    const matched = DEMO_USERS.find((u) => u.role === role) || DEMO_USERS[0]
    setUser(matched)
    setIsLoading(false)
  }

  const logout = () => {
    setUser(null)
    localStorage.removeItem(AUTH_STORAGE_KEY)
  }

  const hasRole = (allowedRoles: UserRole[]): boolean => {
    if (!user) return false
    return allowedRoles.includes(user.role)
  }

  return (
    <AuthContext.Provider value={{ user, isLoading, loginAsDemo, logout, hasRole }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}
