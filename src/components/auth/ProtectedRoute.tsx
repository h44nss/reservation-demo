import React from 'react'
import { Navigate, useLocation } from 'react-router-dom'
import { useAuth } from '@/contexts/AuthContext'
import { UserRole } from '@/types/domain'

interface ProtectedRouteProps {
  children: React.ReactNode
  allowedRoles?: UserRole[]
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children, allowedRoles }) => {
  const { user, isLoading, hasRole } = useAuth()
  const location = useLocation()

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-cream-50">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-olive-700"></div>
      </div>
    )
  }

  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />
  }

  if (allowedRoles && allowedRoles.length > 0 && !hasRole(allowedRoles)) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-cream-50 p-6">
        <div className="max-w-md w-full bg-white rounded-2xl p-8 border border-neutral-200 shadow-xl text-center space-y-4">
          <div className="w-14 h-14 mx-auto rounded-full bg-rose-100 flex items-center justify-center text-rose-600 font-bold text-2xl">
            !
          </div>
          <h2 className="text-xl font-bold text-charcoal-900">Akses Terbatas</h2>
          <p className="text-sm text-neutral-600">
            Akun Anda dengan peran <span className="font-bold text-rose-600 uppercase">{user.role}</span> tidak memiliki izin untuk mengakses halaman ini.
          </p>
          <div className="pt-2">
            <Navigate to={user.role === 'kitchen' ? '/kitchen' : user.role === 'cashier' ? '/pos' : '/admin'} />
          </div>
        </div>
      </div>
    )
  }

  return <>{children}</>
}
