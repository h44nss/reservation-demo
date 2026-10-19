import React, { useState } from 'react'
import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom'
import {
  LayoutDashboard,
  CalendarDays,
  ShoppingBag,
  UtensilsCrossed,
  Layers,
  CreditCard,
  BarChart3,
  Settings,
  Users,
  Store,
  ChefHat,
  LogOut,
  Menu as MenuIcon,
  X,
  ExternalLink,
} from 'lucide-react'
import { useAuth } from '@/contexts/AuthContext'

export const AdminLayout: React.FC = () => {
  const location = useLocation()
  const navigate = useNavigate()
  const { user, logout, loginAsDemo } = useAuth()
  const [isSidebarOpen, setIsSidebarOpen] = useState(false)

  const navItems = [
    { to: '/admin', label: 'Overview', icon: LayoutDashboard },
    { to: '/admin/reservations', label: 'Reservasi Meja', icon: CalendarDays },
    { to: '/admin/orders', label: 'Manajemen Order', icon: ShoppingBag },
    { to: '/admin/menu', label: 'Menu & Kategori', icon: UtensilsCrossed },
    { to: '/admin/tables', label: 'Denah Meja', icon: Layers },
    { to: '/admin/payments', label: 'Pembayaran', icon: CreditCard },
    { to: '/admin/reports', label: 'Laporan Penjualan', icon: BarChart3 },
    { to: '/admin/settings', label: 'Pengaturan Resto', icon: Settings },
    { to: '/admin/users', label: 'Staff & Akun', icon: Users },
  ]

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  return (
    <div className="min-h-screen bg-neutral-100 flex text-charcoal-900 font-sans">
      {/* Mobile Sidebar Backdrop */}
      {isSidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 md:hidden"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed md:sticky top-0 z-50 h-screen w-64 bg-charcoal-950 text-neutral-300 flex flex-col transition-transform duration-300 ease-in-out ${
          isSidebarOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'
        }`}
      >
        {/* Brand */}
        <div className="p-5 border-b border-charcoal-800 flex items-center justify-between">
          <Link to="/admin" className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-olive-600 flex items-center justify-center text-white shadow-md">
              <Store className="w-5 h-5" />
            </div>
            <div>
              <span className="font-bold text-white tracking-tight block text-base">KKO Resto</span>
              <span className="text-[10px] text-olive-400 font-semibold uppercase tracking-wider block">
                Admin Console
              </span>
            </div>
          </Link>
          <button
            onClick={() => setIsSidebarOpen(false)}
            className="md:hidden text-neutral-400 hover:text-white"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation */}
        <div className="flex-1 overflow-y-auto px-3 py-4 space-y-1">
          <div className="text-[10px] font-bold uppercase tracking-wider text-neutral-500 px-3 mb-2">
            Main Management
          </div>
          {navItems.map((item) => {
            const Icon = item.icon
            const isActive = location.pathname === item.to || (item.to !== '/admin' && location.pathname.startsWith(item.to))
            return (
              <Link
                key={item.to}
                to={item.to}
                onClick={() => setIsSidebarOpen(false)}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-semibold transition ${
                  isActive
                    ? 'bg-olive-700 text-white shadow-sm'
                    : 'text-neutral-400 hover:text-white hover:bg-charcoal-800'
                }`}
              >
                <Icon className="w-4 h-4 shrink-0" />
                <span>{item.label}</span>
              </Link>
            )
          })}

          <div className="pt-4 text-[10px] font-bold uppercase tracking-wider text-neutral-500 px-3 mb-2">
            System Subsystems
          </div>

          <Link
            to="/pos"
            className="flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-semibold text-emerald-400 hover:bg-charcoal-800 transition"
          >
            <div className="flex items-center gap-3">
              <Store className="w-4 h-4" />
              <span>POS Cashier</span>
            </div>
            <ExternalLink className="w-3.5 h-3.5 text-neutral-500" />
          </Link>

          <Link
            to="/kitchen"
            className="flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-semibold text-amber-400 hover:bg-charcoal-800 transition"
          >
            <div className="flex items-center gap-3">
              <ChefHat className="w-4 h-4" />
              <span>Kitchen Display (KDS)</span>
            </div>
            <ExternalLink className="w-3.5 h-3.5 text-neutral-500" />
          </Link>
        </div>

        {/* User Card & Logout */}
        <div className="p-3 border-t border-charcoal-800 bg-charcoal-900/60">
          <div className="p-2.5 rounded-xl bg-charcoal-800/80 mb-2">
            <div className="flex items-center justify-between">
              <div className="text-xs font-bold text-white truncate">{user?.full_name || 'Staff User'}</div>
              <span className="text-[10px] px-2 py-0.5 rounded bg-olive-900/80 text-olive-300 font-bold uppercase">
                {user?.role || 'admin'}
              </span>
            </div>
            <div className="text-[11px] text-neutral-400 truncate mt-0.5">{user?.email || 'admin@kko.resto'}</div>
          </div>

          <div className="flex gap-2">
            <Link
              to="/"
              className="flex-1 py-1.5 px-2 bg-charcoal-800 hover:bg-charcoal-700 text-neutral-300 hover:text-white rounded-lg text-[11px] font-semibold text-center transition"
            >
              Public Web
            </Link>
            <button
              onClick={handleLogout}
              className="flex items-center justify-center gap-1.5 py-1.5 px-3 bg-rose-950/40 hover:bg-rose-900/60 text-rose-300 rounded-lg text-[11px] font-semibold transition"
              title="Logout"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>Keluar</span>
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top bar */}
        <header className="sticky top-0 z-30 bg-white border-b border-neutral-200 px-4 sm:px-6 h-16 flex items-center justify-between shadow-sm">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setIsSidebarOpen(true)}
              className="md:hidden p-2 rounded-lg text-neutral-600 hover:bg-neutral-100"
            >
              <MenuIcon className="w-5 h-5" />
            </button>
            <div className="text-sm font-semibold text-charcoal-900">
              Admin & Operations Dashboard
            </div>
          </div>

          {/* Quick Demo Switcher */}
          <div className="flex items-center gap-2">
            <span className="hidden sm:inline text-xs text-neutral-500 font-medium">Demo Role:</span>
            <div className="flex bg-neutral-100 p-1 rounded-xl border border-neutral-200 text-xs">
              <button
                onClick={() => loginAsDemo('admin')}
                className={`px-2.5 py-1 rounded-lg font-bold transition ${
                  user?.role === 'admin' ? 'bg-olive-700 text-white shadow-sm' : 'text-neutral-600 hover:text-charcoal-900'
                }`}
              >
                Admin
              </button>
              <button
                onClick={() => loginAsDemo('cashier')}
                className={`px-2.5 py-1 rounded-lg font-bold transition ${
                  user?.role === 'cashier' ? 'bg-emerald-700 text-white shadow-sm' : 'text-neutral-600 hover:text-charcoal-900'
                }`}
              >
                Cashier
              </button>
              <button
                onClick={() => loginAsDemo('kitchen')}
                className={`px-2.5 py-1 rounded-lg font-bold transition ${
                  user?.role === 'kitchen' ? 'bg-amber-600 text-white shadow-sm' : 'text-neutral-600 hover:text-charcoal-900'
                }`}
              >
                Kitchen
              </button>
            </div>
          </div>
        </header>

        {/* Page Outlet */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
