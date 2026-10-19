import React, { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import {
  CalendarDays,
  ShoppingBag,
  DollarSign,
  Layers,
  ChefHat,
  Clock,
  ArrowUpRight,
  TrendingUp,
  AlertCircle,
  CreditCard,
  CheckCircle2,
  Store,
  ExternalLink,
} from 'lucide-react'
import { restaurantService } from '@/services/restaurantService'
import { DashboardStats, OrderWithDetails, ReservationWithDetails } from '@/types/domain'
import {
  formatIDR,
  formatDate,
  formatTime,
  getReservationStatusConfig,
  getOrderStatusConfig,
  getPaymentStatusConfig,
} from '@/utils/formatters'

export const AdminDashboardPage: React.FC = () => {
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [recentOrders, setRecentOrders] = useState<OrderWithDetails[]>([])
  const [todayReservations, setTodayReservations] = useState<ReservationWithDetails[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadDashboardData()
  }, [])

  const loadDashboardData = async () => {
    try {
      const [st, ords, res] = await Promise.all([
        restaurantService.getDashboardStats(),
        restaurantService.getOrders(),
        restaurantService.getReservations({ date: new Date().toISOString().split('T')[0] }),
      ])
      setStats(st)
      setRecentOrders(ords.slice(0, 5))
      setTodayReservations(res.slice(0, 5))
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-8">
      {/* Page Title & Subsystem Quick Links */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold font-serif text-charcoal-900">
            Overview & Operasional Restoran
          </h1>
          <p className="text-xs text-neutral-500 mt-1">
            Pantau kinerja penjualan, reservasi tamu, meja aktif, dan pesanan dapur secara real-time.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Link
            to="/pos"
            className="flex items-center gap-2 px-4 py-2 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl text-xs font-bold transition shadow-sm"
          >
            <Store className="w-4 h-4" />
            <span>Buka Kasir POS</span>
          </Link>

          <Link
            to="/kitchen"
            className="flex items-center gap-2 px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-xs font-bold transition shadow-sm"
          >
            <ChefHat className="w-4 h-4" />
            <span>Buka Kitchen Display</span>
          </Link>
        </div>
      </div>

      {/* Primary KPI Metrics Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {/* Revenue Card (PAID ONLY) */}
        <div className="bg-white p-5 rounded-2xl border border-neutral-200/90 shadow-subtle flex flex-col justify-between space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-neutral-500">
              Penjualan Hari Ini (Paid)
            </span>
            <div className="w-9 h-9 rounded-xl bg-emerald-100 text-emerald-800 flex items-center justify-center font-bold">
              <DollarSign className="w-5 h-5" />
            </div>
          </div>
          <div>
            <div className="text-2xl font-black text-charcoal-900 tracking-tight">
              {formatIDR(stats?.todaySalesAmount || 0)}
            </div>
            <div className="text-[11px] text-emerald-600 font-semibold mt-1 flex items-center gap-1">
              <TrendingUp className="w-3.5 h-3.5" />
              <span>Hanya menghitung pembayaran lunas</span>
            </div>
          </div>
        </div>

        {/* Reservations Today */}
        <div className="bg-white p-5 rounded-2xl border border-neutral-200/90 shadow-subtle flex flex-col justify-between space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-neutral-500">
              Reservasi Hari Ini
            </span>
            <div className="w-9 h-9 rounded-xl bg-olive-100 text-olive-800 flex items-center justify-center font-bold">
              <CalendarDays className="w-5 h-5" />
            </div>
          </div>
          <div>
            <div className="text-2xl font-black text-charcoal-900 tracking-tight">
              {stats?.todayReservationsCount || 0} Booking
            </div>
            <div className="text-[11px] text-amber-700 font-semibold mt-1 flex items-center gap-1">
              <Clock className="w-3.5 h-3.5" />
              <span>{stats?.pendingReservationsCount || 0} menunggu konfirmasi</span>
            </div>
          </div>
        </div>

        {/* Unpaid Transactions */}
        <div className="bg-white p-5 rounded-2xl border border-neutral-200/90 shadow-subtle flex flex-col justify-between space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-neutral-500">
              Tagihan Belum Lunas
            </span>
            <div className="w-9 h-9 rounded-xl bg-rose-100 text-rose-800 flex items-center justify-center font-bold">
              <AlertCircle className="w-5 h-5" />
            </div>
          </div>
          <div>
            <div className="text-2xl font-black text-rose-700 tracking-tight">
              {formatIDR(stats?.unpaidOrdersAmount || 0)}
            </div>
            <div className="text-[11px] text-neutral-500 font-semibold mt-1">
              Dari {stats?.unpaidOrdersCount || 0} pesanan aktif belum bayar
            </div>
          </div>
        </div>

        {/* Tables & Kitchen Operations */}
        <div className="bg-white p-5 rounded-2xl border border-neutral-200/90 shadow-subtle flex flex-col justify-between space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-neutral-500">
              Status Operasional
            </span>
            <div className="w-9 h-9 rounded-xl bg-indigo-100 text-indigo-800 flex items-center justify-center font-bold">
              <Layers className="w-5 h-5" />
            </div>
          </div>
          <div className="space-y-1.5 text-xs">
            <div className="flex justify-between">
              <span className="text-neutral-500">Meja Tersedia:</span>
              <span className="font-bold text-charcoal-900">
                {stats?.availableTablesCount} / {stats?.totalTablesCount}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-neutral-500">Dapur Memasak:</span>
              <span className="font-bold text-amber-700">{stats?.preparingOrdersCount} pesanan</span>
            </div>
            <div className="flex justify-between">
              <span className="text-neutral-500">Makanan Siap:</span>
              <span className="font-bold text-emerald-700">{stats?.readyOrdersCount} pesanan</span>
            </div>
          </div>
        </div>
      </div>

      {/* Two Column Layout: Recent Orders & Today's Reservations */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Today's Reservations List */}
        <div className="bg-white rounded-2xl border border-neutral-200/90 p-6 space-y-4 shadow-subtle">
          <div className="flex items-center justify-between pb-3 border-b border-neutral-100">
            <h3 className="font-bold text-base text-charcoal-900 flex items-center gap-2">
              <CalendarDays className="w-4 h-4 text-olive-700" />
              <span>Reservasi Meja Hari Ini</span>
            </h3>
            <Link
              to="/admin/reservations"
              className="text-xs font-bold text-olive-800 hover:text-olive-900 flex items-center gap-1"
            >
              <span>Kelola Semua</span>
              <ArrowUpRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="space-y-3">
            {todayReservations.length === 0 ? (
              <p className="text-xs text-neutral-400 py-6 text-center">Belum ada reservasi untuk hari ini.</p>
            ) : (
              todayReservations.map((res) => {
                const conf = getReservationStatusConfig(res.status)
                return (
                  <div
                    key={res.id}
                    className="p-3.5 rounded-xl bg-neutral-50 border border-neutral-200/80 flex items-center justify-between text-xs"
                  >
                    <div className="space-y-0.5">
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-bold text-olive-800">{res.booking_code}</span>
                        <span className="font-bold text-charcoal-900">{res.customer_name}</span>
                      </div>
                      <div className="text-neutral-500 flex items-center gap-3">
                        <span>{formatTime(res.start_time)}</span>
                        <span>•</span>
                        <span>{res.guest_count} Tamu</span>
                        <span>•</span>
                        <span>{res.table ? res.table.table_number : 'Belum Ditentukan'}</span>
                      </div>
                    </div>
                    <span className={`px-2.5 py-0.5 rounded-full font-bold border text-[11px] ${conf.bg}`}>
                      {conf.label}
                    </span>
                  </div>
                )
              })
            )}
          </div>
        </div>

        {/* Recent Transactions & Orders */}
        <div className="bg-white rounded-2xl border border-neutral-200/90 p-6 space-y-4 shadow-subtle">
          <div className="flex items-center justify-between pb-3 border-b border-neutral-100">
            <h3 className="font-bold text-base text-charcoal-900 flex items-center gap-2">
              <ShoppingBag className="w-4 h-4 text-olive-700" />
              <span>Pesanan & Transaksi Terbaru</span>
            </h3>
            <Link
              to="/admin/orders"
              className="text-xs font-bold text-olive-800 hover:text-olive-900 flex items-center gap-1"
            >
              <span>Lihat Semua</span>
              <ArrowUpRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="space-y-3">
            {recentOrders.length === 0 ? (
              <p className="text-xs text-neutral-400 py-6 text-center">Belum ada pesanan terbaru.</p>
            ) : (
              recentOrders.map((ord) => {
                const ordConf = getOrderStatusConfig(ord.status)
                const payConf = getPaymentStatusConfig(ord.payment_status)
                return (
                  <div
                    key={ord.id}
                    className="p-3.5 rounded-xl bg-neutral-50 border border-neutral-200/80 flex items-center justify-between text-xs"
                  >
                    <div className="space-y-0.5">
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-bold text-charcoal-900">{ord.order_number}</span>
                        <span className="text-neutral-500">({ord.customer_name})</span>
                      </div>
                      <div className="text-neutral-500 flex items-center gap-2">
                        <span className="font-bold text-charcoal-900">{formatIDR(ord.grand_total)}</span>
                        <span>•</span>
                        <span className="capitalize">{ord.source}</span>
                      </div>
                    </div>
                    <div className="flex flex-col items-end gap-1">
                      <span className={`px-2 py-0.5 rounded-full font-bold border text-[10px] ${ordConf.bg}`}>
                        {ordConf.label}
                      </span>
                      <span className={`px-2 py-0.5 rounded-full font-bold border text-[10px] ${payConf.bg}`}>
                        {payConf.label}
                      </span>
                    </div>
                  </div>
                )
              })
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
