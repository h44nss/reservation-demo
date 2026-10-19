import React from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider } from '@/contexts/AuthContext'
import { CartProvider } from '@/contexts/CartContext'
import { ToastProvider } from '@/components/ui/Toast'
import { ProtectedRoute } from '@/components/auth/ProtectedRoute'

// Layouts
import { PublicLayout } from '@/layouts/PublicLayout'
import { AdminLayout } from '@/layouts/AdminLayout'

// Public Pages
import { LandingPage } from '@/pages/public/LandingPage'
import { ReservationPage } from '@/pages/public/ReservationPage'
import { MenuPage } from '@/pages/public/MenuPage'
import { CheckoutPage } from '@/pages/public/CheckoutPage'
import { PaymentSimulationPage } from '@/pages/public/PaymentSimulationPage'
import { BookingConfirmationPage } from '@/pages/public/BookingConfirmationPage'
import { TrackOrderPage } from '@/pages/public/TrackOrderPage'

// Auth Pages
import { LoginPage } from '@/pages/auth/LoginPage'

// Admin Pages
import { AdminDashboardPage } from '@/pages/admin/AdminDashboardPage'
import { ReservationManagementPage } from '@/pages/admin/ReservationManagementPage'
import { OrderManagementPage } from '@/pages/admin/OrderManagementPage'
import { MenuManagementPage } from '@/pages/admin/MenuManagementPage'
import { TableManagementPage } from '@/pages/admin/TableManagementPage'
import { PaymentManagementPage } from '@/pages/admin/PaymentManagementPage'
import { ReportsPage } from '@/pages/admin/ReportsPage'
import { SettingsPage } from '@/pages/admin/SettingsPage'
import { UserManagementPage } from '@/pages/admin/UserManagementPage'

// POS & Kitchen Pages
import { POSPage } from '@/pages/pos/POSPage'
import { KDSPage } from '@/pages/kitchen/KDSPage'

export const App: React.FC = () => {
  return (
    <BrowserRouter>
      <ToastProvider>
        <AuthProvider>
          <CartProvider>
            <Routes>
              {/* Public Routes */}
              <Route element={<PublicLayout />}>
                <Route path="/" element={<LandingPage />} />
                <Route path="/reservation" element={<ReservationPage />} />
                <Route path="/order" element={<MenuPage />} />
                <Route path="/checkout" element={<CheckoutPage />} />
                <Route path="/payment-simulation/:paymentRef" element={<PaymentSimulationPage />} />
                <Route path="/booking-confirmation/:bookingCode" element={<BookingConfirmationPage />} />
                <Route path="/track-order" element={<TrackOrderPage />} />
              </Route>

              {/* Authentication */}
              <Route path="/login" element={<LoginPage />} />

              {/* Admin Protected Routes */}
              <Route
                path="/admin"
                element={
                  <ProtectedRoute allowedRoles={['admin']}>
                    <AdminLayout />
                  </ProtectedRoute>
                }
              >
                <Route index element={<AdminDashboardPage />} />
                <Route path="reservations" element={<ReservationManagementPage />} />
                <Route path="orders" element={<OrderManagementPage />} />
                <Route path="menu" element={<MenuManagementPage />} />
                <Route path="tables" element={<TableManagementPage />} />
                <Route path="payments" element={<PaymentManagementPage />} />
                <Route path="reports" element={<ReportsPage />} />
                <Route path="settings" element={<SettingsPage />} />
                <Route path="users" element={<UserManagementPage />} />
              </Route>

              {/* POS Cashier System (Admin & Cashier) */}
              <Route
                path="/pos"
                element={
                  <ProtectedRoute allowedRoles={['admin', 'cashier']}>
                    <POSPage />
                  </ProtectedRoute>
                }
              />

              {/* Kitchen Display System (Admin & Kitchen) */}
              <Route
                path="/kitchen"
                element={
                  <ProtectedRoute allowedRoles={['admin', 'kitchen']}>
                    <KDSPage />
                  </ProtectedRoute>
                }
              />

              {/* Catch-all Fallback */}
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </CartProvider>
        </AuthProvider>
      </ToastProvider>
    </BrowserRouter>
  )
}

export default App
