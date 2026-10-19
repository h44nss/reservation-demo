import React, { useState, useEffect } from 'react'
import { useSearchParams, Link } from 'react-router-dom'
import {
  Search,
  AlertCircle,
  ChefHat,
  ArrowRight,
  ShieldCheck,
} from 'lucide-react'
import { restaurantService } from '@/services/restaurantService'
import { PublicBookingTrackingResult } from '@/types/domain'
import {
  formatIDR,
  formatDate,
  formatTime,
  getReservationStatusConfig,
} from '@/utils/formatters'

export const TrackOrderPage: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams()

  const [bookingCode, setBookingCode] = useState(searchParams.get('code') || '')
  const [identifier, setIdentifier] = useState(searchParams.get('phone') || searchParams.get('token') || '')
  const [trackingResult, setTrackingResult] = useState<PublicBookingTrackingResult | null>(null)
  const [loading, setLoading] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  useEffect(() => {
    const code = searchParams.get('code')
    const phone = searchParams.get('phone') || searchParams.get('token')
    if (code && phone) {
      performTracking(code, phone)
    }
  }, [searchParams])

  const performTracking = async (code: string, idVal: string) => {
    setErrorMessage(null)
    setLoading(true)
    try {
      const res = await restaurantService.getPublicBookingTracking(code, idVal)
      setTrackingResult(res)
    } catch (err: any) {
      setTrackingResult(null)
      setErrorMessage(err.message || 'Data tidak ditemukan atau nomor verifikasi tidak cocok.')
    } finally {
      setLoading(false)
    }
  }

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!bookingCode.trim() || !identifier.trim()) {
      setErrorMessage('Harap masukkan Kode Booking dan Nomor Telepon pemesan.')
      return
    }
    setSearchParams({ code: bookingCode.trim(), phone: identifier.trim() })
    performTracking(bookingCode.trim(), identifier.trim())
  }

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-10 sm:py-14 space-y-8 pb-24">
      {/* Header */}
      <div className="text-center max-w-xl mx-auto space-y-2">
        <h1 className="font-serif text-3xl font-bold text-charcoal-900">
          Lacak Reservasi & Pesanan
        </h1>
        <p className="text-sm text-neutral-500">
          Cek status terkini reservasi meja, progres masakan di dapur, dan status pembayaran Anda secara real-time.
        </p>
      </div>

      {/* Verification Search Form */}
      <div className="bg-white rounded-2xl border border-neutral-200 p-6 shadow-subtle">
        <form onSubmit={handleSearchSubmit} className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div>
            <label className="block text-xs font-semibold text-neutral-700 mb-1">
              Kode Booking *
            </label>
            <input
              type="text"
              required
              placeholder="Cth: BK-20261019-A8F2"
              value={bookingCode}
              onChange={(e) => setBookingCode(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-neutral-50 border border-neutral-300 rounded-xl text-sm uppercase focus:outline-none focus:ring-2 focus:ring-olive-600"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-neutral-700 mb-1">
              No. Telepon / Token *
            </label>
            <input
              type="text"
              required
              placeholder="Nomor HP saat booking"
              value={identifier}
              onChange={(e) => setIdentifier(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-neutral-50 border border-neutral-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-olive-600"
            />
          </div>

          <div className="flex items-end">
            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 px-4 bg-olive-700 hover:bg-olive-800 text-white rounded-xl text-sm font-bold transition flex items-center justify-center gap-2 shadow-sm disabled:opacity-50"
            >
              <Search className="w-4 h-4" />
              <span>{loading ? 'Mencari...' : 'Cari Data'}</span>
            </button>
          </div>
        </form>

        <div className="mt-3 flex items-center gap-1.5 text-[11px] text-neutral-400">
          <ShieldCheck className="w-3.5 h-3.5 text-olive-600" />
          <span>Keamanan: Data privasi terlindungi dan membutuhkan verifikasi nomor pemesan.</span>
        </div>
      </div>

      {errorMessage && (
        <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-sm flex items-start gap-3">
          <AlertCircle className="w-5 h-5 shrink-0 mt-0.5 text-rose-600" />
          <span>{errorMessage}</span>
        </div>
      )}

      {/* Tracking Result View */}
      {trackingResult && (
        <div className="bg-white rounded-3xl border border-neutral-200 p-6 sm:p-8 space-y-6 shadow-subtle animate-fade-in">
          {/* Header Card */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-5 border-b border-neutral-100 gap-4">
            <div>
              <span className="text-xs text-neutral-500 block">Kode Booking</span>
              <span className="font-mono text-xl font-bold text-charcoal-900">
                {trackingResult.reservation.booking_code}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs text-neutral-500">Status Meja:</span>
              <span
                className={`text-xs font-bold px-3 py-1 rounded-full border ${
                  getReservationStatusConfig(trackingResult.reservation.status).bg
                }`}
              >
                {getReservationStatusConfig(trackingResult.reservation.status).label}
              </span>
            </div>
          </div>

          {/* Details Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 p-4 rounded-2xl bg-cream-50 border border-cream-200 text-xs">
            <div>
              <span className="text-neutral-500 block mb-1">Nama Tamu</span>
              <span className="font-bold text-charcoal-900">{trackingResult.reservation.customer_name}</span>
            </div>
            <div>
              <span className="text-neutral-500 block mb-1">Tanggal & Waktu</span>
              <span className="font-bold text-charcoal-900">
                {formatDate(trackingResult.reservation.reservation_date)}, {formatTime(trackingResult.reservation.start_time)}
              </span>
            </div>
            <div>
              <span className="text-neutral-500 block mb-1">Jumlah Tamu</span>
              <span className="font-bold text-charcoal-900">{trackingResult.reservation.guest_count} Orang</span>
            </div>
            <div>
              <span className="text-neutral-500 block mb-1">Meja Alokasi</span>
              <span className="font-bold text-charcoal-900">
                {trackingResult.reservation.table_number
                  ? `${trackingResult.reservation.table_number} (${trackingResult.reservation.area || 'Main'})`
                  : 'Ditentukan saat tiba'}
              </span>
            </div>
          </div>

          {/* Kitchen / Order Live Progress Timeline */}
          {trackingResult.order && (
            <div className="space-y-4 pt-2">
              <h3 className="font-bold text-sm text-charcoal-900 flex items-center gap-2">
                <ChefHat className="w-4 h-4 text-olive-700" />
                <span>Status Pemrosesan Pesanan ({trackingResult.order.order_number})</span>
              </h3>

              {/* Status Step Bar */}
              <div className="grid grid-cols-4 gap-2 text-center text-xs">
                <div
                  className={`p-2.5 rounded-xl border font-bold ${
                    ['pending', 'confirmed', 'in_preparation', 'ready', 'served'].includes(
                      trackingResult.order.status
                    )
                      ? 'bg-olive-700 text-white border-olive-800'
                      : 'bg-neutral-100 text-neutral-400'
                  }`}
                >
                  1. Diterima
                </div>
                <div
                  className={`p-2.5 rounded-xl border font-bold ${
                    ['in_preparation', 'ready', 'served'].includes(trackingResult.order.status)
                      ? 'bg-olive-700 text-white border-olive-800'
                      : 'bg-neutral-100 text-neutral-400'
                  }`}
                >
                  2. Dimasak
                </div>
                <div
                  className={`p-2.5 rounded-xl border font-bold ${
                    ['ready', 'served'].includes(trackingResult.order.status)
                      ? 'bg-emerald-600 text-white border-emerald-700'
                      : 'bg-neutral-100 text-neutral-400'
                  }`}
                >
                  3. Siap Disajikan
                </div>
                <div
                  className={`p-2.5 rounded-xl border font-bold ${
                    ['served', 'completed'].includes(trackingResult.order.status)
                      ? 'bg-teal-700 text-white border-teal-800'
                      : 'bg-neutral-100 text-neutral-400'
                  }`}
                >
                  4. Disajikan
                </div>
              </div>

              {/* Items List */}
              <div className="space-y-2 pt-2 border-t border-neutral-100 text-xs">
                {trackingResult.items.map((item) => (
                  <div key={item.id} className="flex justify-between items-center py-1">
                    <div>
                      <span className="font-semibold text-charcoal-900">{item.item_name}</span>
                      <span className="text-neutral-500 ml-2">x{item.quantity}</span>
                    </div>
                    <span className="font-bold text-charcoal-900">{formatIDR(item.line_total)}</span>
                  </div>
                ))}
                <div className="pt-2 border-t border-neutral-200 flex justify-between font-extrabold text-sm text-charcoal-900">
                  <span>Grand Total</span>
                  <span className="text-olive-800">{formatIDR(trackingResult.order.grand_total)}</span>
                </div>
              </div>
            </div>
          )}

          {/* Bottom Actions */}
          <div className="pt-4 border-t border-neutral-100 flex flex-wrap gap-3">
            <Link
              to={`/booking-confirmation/${trackingResult.reservation.booking_code}?token=${trackingResult.reservation.public_access_token}`}
              className="py-2.5 px-4 bg-olive-700 hover:bg-olive-800 text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5"
            >
              <span>Halaman Rincian Booking & Download PDF</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>
      )}
    </div>
  )
}
