import React, { useState } from 'react'
import { useNavigate, useLocation, Link } from 'react-router-dom'
import {
  Utensils,
  ShieldCheck,
  Store,
  ChefHat,
  ArrowRight,
  Lock,
  Mail,
  Sparkles,
} from 'lucide-react'
import { useAuth } from '@/contexts/AuthContext'
import { UserRole } from '@/types/domain'
import { useToast } from '@/components/ui/Toast'

export const LoginPage: React.FC = () => {
  const navigate = useNavigate()
  const location = useLocation()
  const { loginAsDemo, user } = useAuth()
  const toast = useToast()

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')

  const from = (location.state as any)?.from?.pathname || null

  const handleDemoLogin = (role: UserRole) => {
    loginAsDemo(role)
    toast.success(`Berhasil login sebagai ${role.toUpperCase()}`)

    if (from) {
      navigate(from, { replace: true })
    } else {
      if (role === 'admin') navigate('/admin')
      else if (role === 'cashier') navigate('/pos')
      else if (role === 'kitchen') navigate('/kitchen')
      else navigate('/admin')
    }
  }

  const handleStandardSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    // For demo purposes, match email domain or keyword
    const lower = email.toLowerCase()
    let chosenRole: UserRole = 'admin'
    if (lower.includes('cashier') || lower.includes('kasir')) chosenRole = 'cashier'
    else if (lower.includes('kitchen') || lower.includes('dapur')) chosenRole = 'kitchen'

    handleDemoLogin(chosenRole)
  }

  return (
    <div className="min-h-screen bg-cream-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center space-y-3">
        <Link to="/" className="inline-flex items-center gap-3 group">
          <div className="w-12 h-12 rounded-2xl bg-olive-700 flex items-center justify-center text-white shadow-md shadow-olive-700/20 group-hover:scale-105 transition">
            <Utensils className="w-6 h-6" />
          </div>
        </Link>
        <h2 className="font-serif text-3xl font-bold tracking-tight text-charcoal-950">
          Staff & Operations Portal
        </h2>
        <p className="text-xs text-neutral-500">
          KKO Resto & Bistro — Management System
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md px-4 sm:px-0 space-y-6">
        {/* Quick Demo One-Click Login Cards */}
        <div className="bg-white p-6 sm:p-8 rounded-3xl border border-neutral-200/90 shadow-elevated space-y-5">
          <div className="flex items-center gap-2 pb-3 border-b border-neutral-100">
            <Sparkles className="w-4 h-4 text-olive-600" />
            <span className="text-xs font-bold uppercase tracking-wider text-charcoal-900">
              Akses Cepat Demo Client (1-Click)
            </span>
          </div>

          <p className="text-xs text-neutral-500 leading-relaxed">
            Pilih salah satu peran di bawah ini untuk mendemonstrasikan sistem tanpa perlu mengetik kredensial manual:
          </p>

          <div className="space-y-3">
            <button
              onClick={() => handleDemoLogin('admin')}
              className="w-full p-3.5 rounded-2xl border border-olive-200 bg-olive-50/70 hover:bg-olive-100/80 transition flex items-center justify-between text-left group"
            >
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-olive-700 text-white flex items-center justify-center font-bold text-xs shrink-0">
                  <ShieldCheck className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-charcoal-900">Super Admin / Manajer</h4>
                  <p className="text-[11px] text-neutral-500">Akses penuh: Dashboard, Reservasi, Menu, Meja & Laporan</p>
                </div>
              </div>
              <ArrowRight className="w-4 h-4 text-olive-700 group-hover:translate-x-1 transition" />
            </button>

            <button
              onClick={() => handleDemoLogin('cashier')}
              className="w-full p-3.5 rounded-2xl border border-emerald-200 bg-emerald-50/70 hover:bg-emerald-100/80 transition flex items-center justify-between text-left group"
            >
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-emerald-700 text-white flex items-center justify-center font-bold text-xs shrink-0">
                  <Store className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-charcoal-900">Kasir / POS Tablet</h4>
                  <p className="text-[11px] text-neutral-500">Order Walk-in, Meja, Pembayaran Cash/Digital & Struk</p>
                </div>
              </div>
              <ArrowRight className="w-4 h-4 text-emerald-700 group-hover:translate-x-1 transition" />
            </button>

            <button
              onClick={() => handleDemoLogin('kitchen')}
              className="w-full p-3.5 rounded-2xl border border-amber-200 bg-amber-50/70 hover:bg-amber-100/80 transition flex items-center justify-between text-left group"
            >
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-amber-600 text-white flex items-center justify-center font-bold text-xs shrink-0">
                  <ChefHat className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-charcoal-900">Kitchen Display Staff (KDS)</h4>
                  <p className="text-[11px] text-neutral-500">Layar Fullscreen Dapur: Mulai Masak & Siap Disajikan</p>
                </div>
              </div>
              <ArrowRight className="w-4 h-4 text-amber-700 group-hover:translate-x-1 transition" />
            </button>
          </div>

          {/* Form manual credentials fallback */}
          <div className="pt-4 border-t border-neutral-100">
            <span className="text-[11px] font-semibold text-neutral-400 uppercase tracking-wider block mb-3 text-center">
              Atau Masuk dengan Akun Manual
            </span>

            <form onSubmit={handleStandardSubmit} className="space-y-3">
              <div>
                <input
                  type="email"
                  required
                  placeholder="Email staff (cth: admin@kko.resto)"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-neutral-50 border border-neutral-300 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-olive-600"
                />
              </div>

              <div>
                <input
                  type="password"
                  required
                  placeholder="Password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-neutral-50 border border-neutral-300 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-olive-600"
                />
              </div>

              <button
                type="submit"
                className="w-full py-2.5 px-4 bg-charcoal-900 hover:bg-charcoal-800 text-white rounded-xl text-xs font-bold transition"
              >
                Masuk
              </button>
            </form>
          </div>
        </div>

        <div className="text-center text-xs text-neutral-500">
          <Link to="/" className="text-olive-700 hover:underline font-semibold">
            ← Kembali ke Website Restoran
          </Link>
        </div>
      </div>
    </div>
  )
}
