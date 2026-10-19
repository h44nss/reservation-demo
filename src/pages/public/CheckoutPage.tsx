import React, { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import {
  CreditCard,
  MapPin,
  Clock,
  Users,
  ShieldCheck,
  ShoppingBag,
  ArrowRight,
  AlertCircle,
  QrCode,
  Building2,
  Wallet,
  Receipt,
  CalendarCheck,
} from 'lucide-react'
import { useCart } from '@/contexts/CartContext'
import { restaurantService } from '@/services/restaurantService'
import { formatIDR } from '@/utils/formatters'
import { PaymentMethod } from '@/types/domain'
import { useToast } from '@/components/ui/Toast'

export const CheckoutPage: React.FC = () => {
  const navigate = useNavigate()
  const { items, subtotal, taxAmount, serviceAmount, grandTotal, clearCart } = useCart()
  const toast = useToast()

  // Retrieve pending reservation if available
  const pendingReservationStr = sessionStorage.getItem('kko_pending_reservation')
  const pendingReservation = pendingReservationStr ? JSON.parse(pendingReservationStr) : null

  // Customer state
  const [customerName, setCustomerName] = useState(pendingReservation?.customer_name || '')
  const [customerPhone, setCustomerPhone] = useState(pendingReservation?.customer_phone || '')
  const [customerEmail, setCustomerEmail] = useState(pendingReservation?.customer_email || '')
  const [reservationDate, setReservationDate] = useState(
    pendingReservation?.reservation_date || new Date().toISOString().split('T')[0]
  )
  const [startTime, setStartTime] = useState(pendingReservation?.start_time?.slice(0, 5) || '18:30')
  const [guestCount, setGuestCount] = useState<number>(pendingReservation?.guest_count || 2)
  const [notes, setNotes] = useState(pendingReservation?.notes || '')

  // Payment choice: online simulation vs pay onsite
  const [paymentChoice, setPaymentChoice] = useState<'online' | 'onsite'>('online')
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('qris')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)

  if (items.length === 0) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-20 text-center space-y-4">
        <ShoppingBag className="w-16 h-16 mx-auto text-neutral-300" />
        <h2 className="text-2xl font-bold font-serif text-charcoal-900">Keranjang Masih Kosong</h2>
        <p className="text-sm text-neutral-500">
          Silakan pilih hidangan lezat kami terlebih dahulu sebelum melakukan checkout.
        </p>
        <div className="pt-2">
          <Link
            to="/order"
            className="inline-flex items-center gap-2 px-6 py-3 bg-olive-700 hover:bg-olive-800 text-white rounded-xl text-sm font-bold transition shadow-sm"
          >
            Lihat Daftar Menu
          </Link>
        </div>
      </div>
    )
  }

  const handleCheckoutSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setErrorMsg(null)

    if (!customerName.trim() || !customerPhone.trim()) {
      setErrorMsg('Nama lengkap dan nomor telepon pemesan wajib diisi.')
      return
    }

    try {
      setIsSubmitting(true)

      const result = await restaurantService.createReservationAndOrder({
        customer_name: customerName.trim(),
        customer_phone: customerPhone.trim(),
        customer_email: customerEmail.trim() || undefined,
        reservation_date: reservationDate,
        start_time: startTime + ':00',
        guest_count: guestCount,
        table_id: pendingReservation?.table_id || null,
        notes: notes.trim() || undefined,
        order_type: 'dine_in',
        order_source: 'online',
        payment_method: paymentChoice === 'online' ? paymentMethod : 'cash',
        payment_type: paymentChoice === 'online' ? 'online_simulation' : 'onsite_cash',
        items: items.map((i) => ({
          menu_item_id: i.menuItem.id,
          quantity: i.quantity,
          notes: i.notes || undefined,
        })),
      })

      // Clean session storage & cart
      sessionStorage.removeItem('kko_pending_reservation')
      clearCart()

      if (paymentChoice === 'online' && result.payment_reference) {
        toast.info('Pesanan dibuat. Mengalihkan ke halaman simulasi pembayaran...')
        navigate(`/payment-simulation/${result.payment_reference}?booking=${result.booking_code}&token=${result.public_access_token}`)
      } else {
        toast.success(`Pesanan & Reservasi Berhasil! Kode: ${result.booking_code}`)
        navigate(`/booking-confirmation/${result.booking_code}?token=${result.public_access_token}`)
      }
    } catch (err: any) {
      console.error(err)
      setErrorMsg(err.message || 'Terjadi kesalahan saat memproses checkout. Silakan coba lagi.')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-14 space-y-8 pb-24">
      {/* Title */}
      <div className="text-center max-w-2xl mx-auto space-y-2">
        <h1 className="font-serif text-3xl sm:text-4xl font-bold text-charcoal-900">
          Checkout & Konfirmasi Pesanan
        </h1>
        <p className="text-sm text-neutral-500">
          Periksa kembali rincian reservasi dan daftar menu yang Anda pesan sebelum memproses pembayaran.
        </p>
      </div>

      {errorMsg && (
        <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-sm flex items-start gap-3">
          <AlertCircle className="w-5 h-5 shrink-0 mt-0.5 text-rose-600" />
          <span>{errorMsg}</span>
        </div>
      )}

      <form onSubmit={handleCheckoutSubmit} className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column: Guest & Payment Choice */}
        <div className="lg:col-span-2 space-y-6">
          {/* Reservation / Guest Details Card */}
          <div className="bg-white rounded-2xl border border-neutral-200 p-6 sm:p-8 space-y-5 shadow-subtle">
            <div className="flex items-center justify-between pb-4 border-b border-neutral-100">
              <h3 className="font-bold text-base text-charcoal-900 flex items-center gap-2">
                <CalendarCheck className="w-5 h-5 text-olive-700" />
                <span>Rincian Reservasi & Pemesan</span>
              </h3>
              {pendingReservation && (
                <span className="text-xs bg-olive-100 text-olive-800 font-bold px-2.5 py-1 rounded-full">
                  Terhubung Reservasi Meja
                </span>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-semibold text-neutral-700 mb-1">
                  Nama Pemesan *
                </label>
                <input
                  type="text"
                  required
                  placeholder="Cth: Budi Santoso"
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-neutral-50 border border-neutral-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-olive-600"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-neutral-700 mb-1">
                  Nomor WhatsApp *
                </label>
                <input
                  type="tel"
                  required
                  placeholder="Cth: 081234567890"
                  value={customerPhone}
                  onChange={(e) => setCustomerPhone(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-neutral-50 border border-neutral-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-olive-600"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-neutral-700 mb-1">
                  Email (Opsional)
                </label>
                <input
                  type="email"
                  placeholder="budi@email.com"
                  value={customerEmail}
                  onChange={(e) => setCustomerEmail(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-neutral-50 border border-neutral-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-olive-600"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
              <div>
                <label className="block text-xs font-semibold text-neutral-700 mb-1">
                  Tanggal Reservasi *
                </label>
                <input
                  type="date"
                  required
                  value={reservationDate}
                  onChange={(e) => setReservationDate(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-neutral-50 border border-neutral-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-olive-600"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-neutral-700 mb-1">
                  Waktu Tiba *
                </label>
                <input
                  type="time"
                  required
                  value={startTime}
                  onChange={(e) => setStartTime(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-neutral-50 border border-neutral-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-olive-600"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-neutral-700 mb-1">
                  Jumlah Tamu *
                </label>
                <input
                  type="number"
                  min="1"
                  max="30"
                  required
                  value={guestCount}
                  onChange={(e) => setGuestCount(parseInt(e.target.value) || 1)}
                  className="w-full px-3.5 py-2.5 bg-neutral-50 border border-neutral-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-olive-600"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-neutral-700 mb-1">
                Catatan Tambahan untuk Dapur / Meja
              </label>
              <textarea
                rows={2}
                placeholder="Cth: Sambal dipisah, perayaan ulang tahun..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-neutral-50 border border-neutral-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-olive-600"
              />
            </div>
          </div>

          {/* Payment Method Selector */}
          <div className="bg-white rounded-2xl border border-neutral-200 p-6 sm:p-8 space-y-5 shadow-subtle">
            <h3 className="font-bold text-base text-charcoal-900 flex items-center gap-2 pb-4 border-b border-neutral-100">
              <CreditCard className="w-5 h-5 text-olive-700" />
              <span>Pilihan Pembayaran</span>
            </h3>

            {/* Pay Online vs Pay Onsite */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div
                onClick={() => setPaymentChoice('online')}
                className={`p-4 rounded-xl border cursor-pointer transition flex flex-col justify-between ${
                  paymentChoice === 'online'
                    ? 'border-olive-600 bg-olive-50/50 ring-2 ring-olive-600/20'
                    : 'border-neutral-200 hover:bg-neutral-50'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-bold text-sm text-charcoal-900">Pay Online (Simulasi Demo)</span>
                    <span className="text-[10px] bg-olive-100 text-olive-800 font-bold px-2 py-0.5 rounded">
                      Instan
                    </span>
                  </div>
                  <p className="text-xs text-neutral-500">
                    Simulasikan pembayaran instan QRIS, Virtual Account, atau E-Wallet langsung di browser.
                  </p>
                </div>
              </div>

              <div
                onClick={() => setPaymentChoice('onsite')}
                className={`p-4 rounded-xl border cursor-pointer transition flex flex-col justify-between ${
                  paymentChoice === 'onsite'
                    ? 'border-olive-600 bg-olive-50/50 ring-2 ring-olive-600/20'
                    : 'border-neutral-200 hover:bg-neutral-50'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-bold text-sm text-charcoal-900">Pay Onsite at Venue</span>
                    <span className="text-[10px] bg-neutral-200 text-neutral-700 font-bold px-2 py-0.5 rounded">
                      Di Kasir
                    </span>
                  </div>
                  <p className="text-xs text-neutral-500">
                    Selesaikan reservasi sekarang dengan status awal Unpaid, dan bayar di kasir restoran nanti.
                  </p>
                </div>
              </div>
            </div>

            {/* Sub-options for Online Simulation */}
            {paymentChoice === 'online' && (
              <div className="pt-3 space-y-3">
                <span className="text-xs font-semibold text-neutral-700 block">
                  Metode Digital Simulasi:
                </span>
                <div className="grid grid-cols-3 gap-3">
                  <button
                    type="button"
                    onClick={() => setPaymentMethod('qris')}
                    className={`p-3 rounded-xl border text-center transition flex flex-col items-center gap-1.5 ${
                      paymentMethod === 'qris'
                        ? 'border-olive-600 bg-white ring-2 ring-olive-600/30'
                        : 'border-neutral-200 bg-neutral-50 hover:bg-white'
                    }`}
                  >
                    <QrCode className="w-5 h-5 text-olive-700" />
                    <span className="text-xs font-bold text-charcoal-900">QRIS Demo</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setPaymentMethod('bank_transfer')}
                    className={`p-3 rounded-xl border text-center transition flex flex-col items-center gap-1.5 ${
                      paymentMethod === 'bank_transfer'
                        ? 'border-olive-600 bg-white ring-2 ring-olive-600/30'
                        : 'border-neutral-200 bg-neutral-50 hover:bg-white'
                    }`}
                  >
                    <Building2 className="w-5 h-5 text-olive-700" />
                    <span className="text-xs font-bold text-charcoal-900">Virtual Account</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setPaymentMethod('e_wallet')}
                    className={`p-3 rounded-xl border text-center transition flex flex-col items-center gap-1.5 ${
                      paymentMethod === 'e_wallet'
                        ? 'border-olive-600 bg-white ring-2 ring-olive-600/30'
                        : 'border-neutral-200 bg-neutral-50 hover:bg-white'
                    }`}
                  >
                    <Wallet className="w-5 h-5 text-olive-700" />
                    <span className="text-xs font-bold text-charcoal-900">E-Wallet Demo</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Order Items Summary & Checkout Action */}
        <div className="space-y-6">
          <div className="bg-white rounded-2xl border border-neutral-200 p-6 space-y-5 shadow-subtle">
            <h3 className="font-bold text-sm text-charcoal-900 uppercase tracking-wider flex items-center gap-2 pb-3 border-b border-neutral-100">
              <Receipt className="w-4 h-4 text-olive-700" />
              <span>Rincian Tagihan</span>
            </h3>

            {/* Item list */}
            <div className="space-y-3 max-h-64 overflow-y-auto pr-1">
              {items.map((item) => (
                <div key={item.menuItem.id} className="flex justify-between text-xs py-1">
                  <div className="flex-1 pr-2">
                    <span className="font-bold text-charcoal-900">{item.menuItem.name}</span>
                    <span className="text-neutral-500 block">
                      {item.quantity}x @ {formatIDR(item.menuItem.price)}
                    </span>
                    {item.notes && <span className="text-[11px] text-olive-700 italic">"{item.notes}"</span>}
                  </div>
                  <span className="font-semibold text-charcoal-900 shrink-0">
                    {formatIDR(item.lineTotal)}
                  </span>
                </div>
              ))}
            </div>

            {/* Calculations */}
            <div className="pt-3 border-t border-neutral-200 space-y-2 text-xs text-neutral-600">
              <div className="flex justify-between">
                <span>Subtotal Makanan</span>
                <span className="font-semibold text-charcoal-900">{formatIDR(subtotal)}</span>
              </div>
              <div className="flex justify-between">
                <span>Pajak Restoran PB1 (10%)</span>
                <span className="font-semibold text-charcoal-900">{formatIDR(taxAmount)}</span>
              </div>
              <div className="flex justify-between">
                <span>Service Charge (5%)</span>
                <span className="font-semibold text-charcoal-900">{formatIDR(serviceAmount)}</span>
              </div>
              <div className="flex justify-between text-base font-extrabold text-charcoal-900 pt-3 border-t border-neutral-200">
                <span>Grand Total</span>
                <span className="text-olive-800 text-lg">{formatIDR(grandTotal)}</span>
              </div>
            </div>

            {/* Submit Action */}
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full py-3.5 px-6 bg-olive-700 hover:bg-olive-800 text-white rounded-xl text-sm font-bold transition flex items-center justify-center gap-2 shadow-md shadow-olive-700/20 disabled:opacity-50"
            >
              {isSubmitting ? (
                <span>Memproses Checkout...</span>
              ) : paymentChoice === 'online' ? (
                <>
                  <span>Lanjut ke Simulasi Pembayaran</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              ) : (
                <>
                  <span>Selesaikan Booking (Bayar di Resto)</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>

            <div className="flex items-center justify-center gap-1.5 text-[11px] text-neutral-400">
              <ShieldCheck className="w-3.5 h-3.5 text-olive-600" />
              <span>Data tervalidasi langsung di database Supabase</span>
            </div>
          </div>
        </div>
      </form>
    </div>
  )
}
