import React, { useEffect, useState } from 'react'
import { useParams, useSearchParams, Link } from 'react-router-dom'
import {
  CheckCircle2,
  CalendarDays,
  Clock,
  Users,
  MapPin,
  Download,
  Search,
  ArrowRight,
  FileText,
  CreditCard,
  Utensils,
  Share2,
} from 'lucide-react'
import { restaurantService } from '@/services/restaurantService'
import { ReservationWithDetails, RestaurantSettings } from '@/types/domain'
import {
  formatIDR,
  formatDate,
  formatTime,
  getReservationStatusConfig,
  getOrderStatusConfig,
  getPaymentStatusConfig,
} from '@/utils/formatters'
import { generateBookingPDF, generateBillPDF } from '@/utils/pdfGenerator'
import { useToast } from '@/components/ui/Toast'

export const BookingConfirmationPage: React.FC = () => {
  const { bookingCode } = useParams<{ bookingCode: string }>()
  const [searchParams] = useSearchParams()
  const token = searchParams.get('token') || ''
  const toast = useToast()

  const [reservation, setReservation] = useState<ReservationWithDetails | null>(null)
  const [settings, setSettings] = useState<RestaurantSettings | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!bookingCode) return

    Promise.all([
      restaurantService.getSettings(),
      restaurantService.getReservationById(bookingCode),
    ])
      .then(([set, res]) => {
        setSettings(set)
        setReservation(res)
      })
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [bookingCode])

  const handleDownloadBookingPDF = () => {
    if (!reservation || !settings) return
    generateBookingPDF(reservation, settings)
    toast.success('Dokumen Booking Confirmation PDF berhasil diunduh.')
  }

  const handleDownloadBillPDF = () => {
    if (!reservation?.order || !settings) return
    generateBillPDF(reservation.order, settings)
    toast.success('Dokumen Bill / Receipt PDF berhasil diunduh.')
  }

  if (loading) {
    return (
      <div className="min-h-[500px] flex items-center justify-center">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-olive-700"></div>
      </div>
    )
  }

  if (!reservation) {
    return (
      <div className="max-w-md mx-auto py-20 text-center space-y-4 px-4">
        <h2 className="text-xl font-bold text-charcoal-900">Reservasi Tidak Ditemukan</h2>
        <p className="text-sm text-neutral-500">
          Kode booking <code className="bg-neutral-100 px-2 py-0.5 rounded">{bookingCode}</code> tidak ada dalam sistem.
        </p>
        <Link
          to="/"
          className="inline-flex items-center gap-2 px-5 py-2.5 bg-olive-700 text-white rounded-xl text-xs font-bold"
        >
          Kembali ke Beranda
        </Link>
      </div>
    )
  }

  const resStatus = getReservationStatusConfig(reservation.status)
  const orderStatus = reservation.order ? getOrderStatusConfig(reservation.order.status) : null
  const paymentStatus = reservation.order ? getPaymentStatusConfig(reservation.order.payment_status) : null

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-10 sm:py-14 space-y-8 pb-24">
      {/* Success Badge Banner */}
      <div className="bg-emerald-50 border border-emerald-200 rounded-3xl p-6 sm:p-8 text-center space-y-3 shadow-subtle">
        <div className="w-16 h-16 rounded-full bg-emerald-600 text-white flex items-center justify-center mx-auto shadow-md shadow-emerald-600/30">
          <CheckCircle2 className="w-9 h-9" />
        </div>
        <h1 className="font-serif text-2xl sm:text-3xl font-bold text-emerald-950">
          Reservasi Anda Berhasil Terdaftar!
        </h1>
        <p className="text-xs sm:text-sm text-emerald-800 max-w-lg mx-auto">
          Terima kasih telah melakukan pemesanan di {settings?.restaurant_name || 'KKO Resto'}. Simpan kode booking Anda untuk konfirmasi saat kedatangan.
        </p>

        {/* Big Booking Code Display */}
        <div className="pt-2">
          <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-700 block mb-1">
            Kode Booking Resmi:
          </span>
          <span className="font-mono text-2xl sm:text-3xl font-extrabold text-charcoal-950 bg-white px-6 py-2.5 rounded-2xl border border-emerald-200 inline-block shadow-sm">
            {reservation.booking_code}
          </span>
        </div>
      </div>

      {/* Main Reservation Card */}
      <div className="bg-white rounded-3xl border border-neutral-200 p-6 sm:p-8 space-y-6 shadow-subtle">
        {/* Status Indicators */}
        <div className="flex flex-wrap items-center justify-between gap-3 pb-5 border-b border-neutral-100">
          <div className="flex items-center gap-2">
            <span className="text-xs text-neutral-500 font-medium">Status Reservasi:</span>
            <span className={`text-xs font-bold px-3 py-1 rounded-full border ${resStatus.bg}`}>
              {resStatus.label}
            </span>
          </div>

          {paymentStatus && (
            <div className="flex items-center gap-2">
              <span className="text-xs text-neutral-500 font-medium">Pembayaran:</span>
              <span className={`text-xs font-bold px-3 py-1 rounded-full border ${paymentStatus.bg}`}>
                {paymentStatus.label}
              </span>
            </div>
          )}
        </div>

        {/* Schedule & Table Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 p-4 rounded-2xl bg-cream-50 border border-cream-200 text-xs">
          <div>
            <span className="text-neutral-500 block mb-1 flex items-center gap-1">
              <CalendarDays className="w-3.5 h-3.5 text-olive-700" />
              <span>Tanggal</span>
            </span>
            <span className="font-bold text-charcoal-900 block text-sm">
              {formatDate(reservation.reservation_date)}
            </span>
          </div>

          <div>
            <span className="text-neutral-500 block mb-1 flex items-center gap-1">
              <Clock className="w-3.5 h-3.5 text-olive-700" />
              <span>Waktu Tiba</span>
            </span>
            <span className="font-bold text-charcoal-900 block text-sm">
              {formatTime(reservation.start_time)}
            </span>
          </div>

          <div>
            <span className="text-neutral-500 block mb-1 flex items-center gap-1">
              <Users className="w-3.5 h-3.5 text-olive-700" />
              <span>Jumlah Tamu</span>
            </span>
            <span className="font-bold text-charcoal-900 block text-sm">
              {reservation.guest_count} Orang
            </span>
          </div>

          <div>
            <span className="text-neutral-500 block mb-1 flex items-center gap-1">
              <MapPin className="w-3.5 h-3.5 text-olive-700" />
              <span>Meja</span>
            </span>
            <span className="font-bold text-charcoal-900 block text-sm">
              {reservation.table ? `${reservation.table.table_number} (${reservation.table.area})` : 'Ditentukan saat tiba'}
            </span>
          </div>
        </div>

        {/* Customer Info */}
        <div className="space-y-2 text-xs text-neutral-600">
          <div className="flex justify-between py-1 border-b border-neutral-100">
            <span>Nama Tamu:</span>
            <span className="font-bold text-charcoal-900">{reservation.customer_name}</span>
          </div>
          <div className="flex justify-between py-1 border-b border-neutral-100">
            <span>Nomor WhatsApp:</span>
            <span className="font-bold text-charcoal-900">{reservation.customer_phone}</span>
          </div>
          {reservation.notes && (
            <div className="flex justify-between py-1 border-b border-neutral-100">
              <span>Catatan:</span>
              <span className="font-medium text-charcoal-800 italic">"{reservation.notes}"</span>
            </div>
          )}
        </div>

        {/* Ordered Items Table if exists */}
        {reservation.order && (
          <div className="space-y-3 pt-3 border-t border-neutral-100">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-sm text-charcoal-900 flex items-center gap-2">
                <Utensils className="w-4 h-4 text-olive-700" />
                <span>Rincian Menu Pesanan ({reservation.order.order_number})</span>
              </h3>
              {orderStatus && (
                <span className={`text-[11px] font-bold px-2.5 py-0.5 rounded-full border ${orderStatus.bg}`}>
                  Status: {orderStatus.label}
                </span>
              )}
            </div>

            <div className="space-y-2 text-xs">
              {reservation.order.items.map((item) => (
                <div key={item.id} className="flex justify-between py-1.5 border-b border-neutral-100">
                  <div>
                    <span className="font-bold text-charcoal-900">{item.item_name_snapshot}</span>
                    <span className="text-neutral-500 block">
                      {item.quantity}x @ {formatIDR(item.unit_price_snapshot)}
                    </span>
                  </div>
                  <span className="font-semibold text-charcoal-900">{formatIDR(item.line_total)}</span>
                </div>
              ))}

              <div className="pt-2 space-y-1 text-neutral-600">
                <div className="flex justify-between">
                  <span>Subtotal</span>
                  <span>{formatIDR(reservation.order.subtotal)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Pajak Restoran PB1 (10%)</span>
                  <span>{formatIDR(reservation.order.tax_amount)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Service Charge (5%)</span>
                  <span>{formatIDR(reservation.order.service_charge_amount)}</span>
                </div>
                <div className="flex justify-between text-sm font-extrabold text-charcoal-900 pt-2 border-t border-neutral-200">
                  <span>Grand Total</span>
                  <span className="text-olive-800">{formatIDR(reservation.order.grand_total)}</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* PDF Download and Tracking Actions */}
        <div className="space-y-3 pt-4 border-t border-neutral-200">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <button
              onClick={handleDownloadBookingPDF}
              className="py-3 px-4 bg-olive-700 hover:bg-olive-800 text-white rounded-xl text-xs font-bold transition flex items-center justify-center gap-2 shadow-sm"
            >
              <Download className="w-4 h-4" />
              <span>Download Booking PDF</span>
            </button>

            {reservation.order && (
              <button
                onClick={handleDownloadBillPDF}
                className="py-3 px-4 bg-charcoal-900 hover:bg-charcoal-800 text-white rounded-xl text-xs font-bold transition flex items-center justify-center gap-2 shadow-sm"
              >
                <FileText className="w-4 h-4" />
                <span>
                  {reservation.order.payment_status === 'paid' ? 'Download Paid Receipt PDF' : 'Download Bill PDF'}
                </span>
              </button>
            )}
          </div>

          <div className="flex flex-col sm:flex-row gap-3 pt-2">
            <Link
              to={`/track-order?code=${encodeURIComponent(reservation.booking_code)}&phone=${encodeURIComponent(reservation.customer_phone)}`}
              className="flex-1 py-2.5 px-4 bg-neutral-100 hover:bg-neutral-200 text-neutral-800 rounded-xl text-xs font-semibold text-center transition flex items-center justify-center gap-2"
            >
              <Search className="w-3.5 h-3.5" />
              <span>Lacak Status Booking & Kitchen</span>
            </Link>

            <Link
              to="/"
              className="py-2.5 px-4 border border-neutral-300 hover:bg-neutral-50 text-neutral-700 rounded-xl text-xs font-semibold text-center transition"
            >
              Kembali ke Beranda
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
