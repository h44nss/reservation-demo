import React, { useState } from 'react'
import { Outlet, Link, useLocation } from 'react-router-dom'
import { Utensils, CalendarDays, BookOpen, Search, ShoppingBag, LogIn, Clock, MapPin, Phone, ShieldCheck } from 'lucide-react'
import { useCart } from '@/contexts/CartContext'
import { CartDrawer } from '@/components/public/CartDrawer'

export const PublicLayout: React.FC = () => {
  const location = useLocation()
  const { itemCount } = useCart()
  const [isCartOpen, setIsCartOpen] = useState(false)

  const navLinks = [
    { to: '/', label: 'Beranda', icon: Utensils },
    { to: '/reservation', label: 'Reservasi Meja', icon: CalendarDays },
    { to: '/order', label: 'Daftar Menu', icon: BookOpen },
    { to: '/track-order', label: 'Lacak Pesanan', icon: Search },
  ]

  return (
    <div className="min-h-screen flex flex-col bg-cream-50 text-charcoal-900 font-sans">
      {/* Top Banner Notice */}
      <div className="bg-olive-900 text-cream-100 text-xs py-2 px-4 text-center flex items-center justify-between">
        <div className="hidden sm:flex items-center gap-2 mx-auto">
          <Clock className="w-3.5 h-3.5 text-olive-300" />
          <span>Buka Setiap Hari: 10:00 - 22:00 WIB | Senopati, Jakarta Selatan</span>
        </div>
        <div className="flex items-center gap-3 text-xs ml-auto">
          <Link to="/login" className="flex items-center gap-1 text-olive-200 hover:text-white transition">
            <LogIn className="w-3.5 h-3.5" />
            <span>Staff Portal (Admin / POS / Kitchen)</span>
          </Link>
        </div>
      </div>

      {/* Main Navbar */}
      <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-neutral-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
          {/* Logo & Brand */}
          <Link to="/" className="flex items-center gap-3 group">
            <div className="w-11 h-11 rounded-2xl bg-olive-700 flex items-center justify-center text-white shadow-md shadow-olive-700/20 group-hover:scale-105 transition">
              <Utensils className="w-6 h-6" />
            </div>
            <div>
              <span className="font-serif text-2xl font-bold tracking-tight text-charcoal-950 block leading-tight">
                KKO <span className="text-olive-700 font-sans font-semibold text-lg">Resto & Bistro</span>
              </span>
              <span className="text-[11px] text-neutral-500 tracking-wider uppercase font-medium">
                Indonesian Fusion & Specialty Coffee
              </span>
            </div>
          </Link>

          {/* Desktop Navigation Links */}
          <nav className="hidden md:flex items-center gap-1 bg-neutral-100/80 p-1.5 rounded-2xl border border-neutral-200/80">
            {navLinks.map((link) => {
              const Icon = link.icon
              const isActive = location.pathname === link.to
              return (
                <Link
                  key={link.to}
                  to={link.to}
                  className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition ${
                    isActive
                      ? 'bg-olive-700 text-white shadow-sm'
                      : 'text-neutral-700 hover:text-charcoal-950 hover:bg-white/60'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span>{link.label}</span>
                </Link>
              )
            })}
          </nav>

          {/* Right Actions: Cart & CTA */}
          <div className="flex items-center gap-3">
            <button
              onClick={() => setIsCartOpen(true)}
              className="relative p-2.5 rounded-xl border border-neutral-200 bg-white hover:bg-neutral-50 text-charcoal-800 transition shadow-sm"
              title="Buka Keranjang"
            >
              <ShoppingBag className="w-5 h-5 text-olive-800" />
              {itemCount > 0 && (
                <span className="absolute -top-1.5 -right-1.5 bg-olive-700 text-white text-[11px] font-extrabold w-5 h-5 rounded-full flex items-center justify-center animate-pulse">
                  {itemCount}
                </span>
              )}
            </button>

            <Link
              to="/reservation"
              className="hidden sm:inline-flex items-center gap-2 px-5 py-2.5 bg-olive-700 hover:bg-olive-800 text-white rounded-xl text-sm font-bold transition shadow-md shadow-olive-700/20"
            >
              <CalendarDays className="w-4 h-4" />
              <span>Book a Table</span>
            </Link>
          </div>
        </div>

        {/* Mobile Navigation bar */}
        <div className="md:hidden flex items-center justify-around border-t border-neutral-200 bg-white py-2 px-2 text-xs font-medium">
          {navLinks.map((link) => {
            const Icon = link.icon
            const isActive = location.pathname === link.to
            return (
              <Link
                key={link.to}
                to={link.to}
                className={`flex flex-col items-center gap-1 py-1 px-2.5 rounded-lg ${
                  isActive ? 'text-olive-700 font-bold' : 'text-neutral-600'
                }`}
              >
                <Icon className="w-4 h-4" />
                <span>{link.label}</span>
              </Link>
            )
          })}
        </div>
      </header>

      {/* Main Page Content */}
      <main className="flex-1">
        <Outlet />
      </main>

      {/* Cart Drawer */}
      <CartDrawer isOpen={isCartOpen} onClose={() => setIsCartOpen(false)} />

      {/* Footer */}
      <footer className="bg-charcoal-950 text-neutral-300 pt-16 pb-12 border-t border-charcoal-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 grid grid-cols-1 md:grid-cols-4 gap-10">
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-olive-600 flex items-center justify-center text-white">
                <Utensils className="w-5 h-5" />
              </div>
              <span className="font-serif text-2xl font-bold text-white tracking-tight">KKO Resto</span>
            </div>
            <p className="text-sm text-neutral-400 leading-relaxed">
              Warisan kuliner Nusantara autentik dipadukan dengan sentuhan modern serta suasana bistro yang hangat untuk momen berharga Anda.
            </p>
            <div className="flex items-center gap-2 text-xs text-olive-400 font-medium">
              <ShieldCheck className="w-4 h-4" />
              <span>Integrated Reservation & POS Engine</span>
            </div>
          </div>

          <div>
            <h4 className="text-white font-bold text-sm uppercase tracking-wider mb-4">Navigasi Restoran</h4>
            <ul className="space-y-2.5 text-sm">
              <li><Link to="/" className="hover:text-white transition">Beranda</Link></li>
              <li><Link to="/reservation" className="hover:text-white transition">Reservasi Meja</Link></li>
              <li><Link to="/order" className="hover:text-white transition">Menu & Pesan Online</Link></li>
              <li><Link to="/track-order" className="hover:text-white transition">Lacak Booking & Status</Link></li>
              <li><Link to="/login" className="hover:text-white transition">Portal Staff / Kasir</Link></li>
            </ul>
          </div>

          <div>
            <h4 className="text-white font-bold text-sm uppercase tracking-wider mb-4">Jam Operasional</h4>
            <ul className="space-y-2 text-sm text-neutral-400">
              <li className="flex justify-between">
                <span>Senin - Kamis:</span>
                <span className="text-white font-medium">10:00 - 22:00 WIB</span>
              </li>
              <li className="flex justify-between">
                <span>Jumat:</span>
                <span className="text-white font-medium">10:00 - 23:00 WIB</span>
              </li>
              <li className="flex justify-between">
                <span>Sabtu:</span>
                <span className="text-white font-medium">09:00 - 23:00 WIB</span>
              </li>
              <li className="flex justify-between">
                <span>Minggu:</span>
                <span className="text-white font-medium">09:00 - 22:00 WIB</span>
              </li>
            </ul>
          </div>

          <div className="space-y-3">
            <h4 className="text-white font-bold text-sm uppercase tracking-wider mb-4">Lokasi & Kontak</h4>
            <p className="flex items-start gap-2.5 text-sm text-neutral-400">
              <MapPin className="w-5 h-5 text-olive-500 shrink-0 mt-0.5" />
              <span>Jl. Senopati No. 88, Kebayoran Baru, Jakarta Selatan 12190</span>
            </p>
            <p className="flex items-center gap-2.5 text-sm text-neutral-400">
              <Phone className="w-4 h-4 text-olive-500 shrink-0" />
              <span>+62 812-3456-7890</span>
            </p>
            <div className="pt-2">
              <Link
                to="/reservation"
                className="inline-block w-full text-center py-2.5 px-4 bg-olive-700 hover:bg-olive-800 text-white rounded-xl text-xs font-bold transition"
              >
                Book a Table Now
              </Link>
            </div>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-12 pt-6 border-t border-charcoal-800 flex flex-col sm:flex-row items-center justify-between text-xs text-neutral-500">
          <p>© 2026 KKO Resto & Bistro. All rights reserved.</p>
          <div className="flex gap-4 mt-2 sm:mt-0">
            <Link to="/login" className="text-olive-400 hover:text-white transition">Login Staff (Admin / POS / KDS)</Link>
          </div>
        </div>
      </footer>
    </div>
  )
}
