import React, { useState, useEffect } from 'react'
import { useParams, useSearchParams, useNavigate } from 'react-router-dom'
import {
  QrCode,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Copy,
  ArrowRight,
  ShieldAlert,
} from 'lucide-react'
import { restaurantService } from '@/services/restaurantService'
import { Payment, OrderWithDetails } from '@/types/domain'
import { formatIDR } from '@/utils/formatters'
import { useToast } from '@/components/ui/Toast'

export const PaymentSimulationPage: React.FC = () => {
  const { paymentRef } = useParams<{ paymentRef: string }>()
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const toast = useToast()

  const bookingCode = searchParams.get('booking') || ''
  const token = searchParams.get('token') || ''

  const [payment, setPayment] = useState<Payment | null>(null)
  const [order, setOrder] = useState<OrderWithDetails | null>(null)
  const [loading, setLoading] = useState(true)
  const [actionLoading, setActionLoading] = useState(false)
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    if (!paymentRef) return

    restaurantService.getPayments().then(async (payments) => {
      const found = payments.find((p) => p.payment_reference === paymentRef)
      if (found) {
        setPayment(found)
        const ord = await restaurantService.getOrderById(found.order_id)
        setOrder(ord)
      }
      setLoading(false)
    }).catch(console.error)
  }, [paymentRef])

  const handleSimulate = async (action: 'success' | 'failed' | 'cancel') => {
    if (!paymentRef) return

    try {
      setActionLoading(true)
      await restaurantService.processSimulatedPayment(paymentRef, action)

      if (action === 'success') {
        toast.success('Simulasi Pembayaran Berhasil! Pesanan diteruskan ke dapur.')
        setTimeout(() => {
          navigate(`/booking-confirmation/${bookingCode}?token=${token}`)
        }, 1200)
      } else if (action === 'failed') {
        toast.error('Simulasi: Pembayaran Gagal. Anda dapat mencoba kembali.')
        setPayment((prev) => (prev ? { ...prev, status: 'failed' } : null))
      } else {
        toast.info('Simulasi: Pembayaran Dibatalkan.')
        navigate(`/booking-confirmation/${bookingCode}?token=${token}`)
      }
    } catch (err: any) {
      toast.error(err.message || 'Gagal memproses simulasi pembayaran.')
    } finally {
      setActionLoading(false)
    }
  }

  const copyVa = () => {
    navigator.clipboard.writeText('8808123456789012')
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
    toast.success('Nomor Virtual Account disalin ke clipboard!')
  }

  if (loading) {
    return (
      <div className="min-h-[500px] flex items-center justify-center">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-olive-700"></div>
      </div>
    )
  }

  if (!payment) {
    return (
      <div className="max-w-md mx-auto py-20 text-center space-y-4 px-4">
        <AlertTriangle className="w-12 h-12 text-amber-500 mx-auto" />
        <h2 className="text-xl font-bold text-charcoal-900">Referensi Pembayaran Tidak Ditemukan</h2>
        <p className="text-sm text-neutral-500">
          Transaksi dengan referensi <code className="bg-neutral-100 px-2 py-0.5 rounded">{paymentRef}</code> tidak valid.
        </p>
      </div>
    )
  }

  const isAlreadyPaid = payment.status === 'paid'

  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6 py-10 sm:py-14 space-y-6">
      {/* Demo Warning Disclaimer Banner */}
      <div className="bg-amber-50 border border-amber-300 rounded-2xl p-4 flex items-start gap-3 text-amber-900 text-xs">
        <ShieldAlert className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
        <div>
          <strong className="font-bold uppercase tracking-wider block mb-0.5">
            Simulator Pembayaran Demo (Bukan Transaksi Nyata)
          </strong>
          Halaman ini disediakan untuk pengujian alur demo client. Tidak ada dana riil yang dipotong.
        </div>
      </div>

      {/* Main Payment Card */}
      <div className="bg-white rounded-3xl border border-neutral-200/90 shadow-elevated p-6 sm:p-8 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-neutral-100">
          <div>
            <span className="text-xs text-neutral-400 block">Total Tagihan</span>
            <span className="text-2xl sm:text-3xl font-extrabold text-charcoal-900">
              {formatIDR(payment.amount)}
            </span>
          </div>
          <div className="text-right">
            <span className="text-xs text-neutral-400 block">No. Referensi</span>
            <span className="text-xs font-mono font-bold text-olive-800 bg-olive-50 px-2.5 py-1 rounded-lg">
              {payment.payment_reference}
            </span>
          </div>
        </div>

        {/* Dynamic Payment Body */}
        {payment.method === 'qris' && (
          <div className="space-y-4 text-center">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-neutral-100 text-neutral-700 text-xs font-semibold">
              <QrCode className="w-4 h-4 text-olive-700" />
              <span>Simulasi QRIS Nasional (Demo)</span>
            </div>

            {/* Mock QR Code Graphic */}
            <div className="w-56 h-56 mx-auto bg-neutral-900 p-3 rounded-2xl shadow-inner flex items-center justify-center">
              <div className="w-full h-full bg-white rounded-xl p-3 flex flex-col items-center justify-between">
                <div className="text-[10px] font-black tracking-widest text-neutral-700">QRIS STANDAR DEMO</div>
                <div className="w-36 h-36 border-4 border-black p-2 flex flex-wrap gap-1 items-center justify-center bg-neutral-50">
                  <div className="w-8 h-8 bg-black rounded-sm" />
                  <div className="w-8 h-8 bg-black/80 rounded-sm" />
                  <div className="w-8 h-8 bg-black/90 rounded-sm" />
                  <div className="w-8 h-8 bg-black/70 rounded-sm" />
                  <div className="w-8 h-8 bg-black rounded-sm" />
                  <div className="w-8 h-8 bg-black/80 rounded-sm" />
                </div>
                <div className="text-[9px] text-neutral-500 font-mono">KKO-RESTO-SIM-QR</div>
              </div>
            </div>

            <p className="text-xs text-neutral-500 max-w-xs mx-auto">
              Pada aplikasi nyata, pelanggan memindai barcode ini menggunakan GoPay, OVO, BCA Mobile, atau Livin'.
            </p>
          </div>
        )}

        {payment.method === 'bank_transfer' && (
          <div className="space-y-4">
            <div className="p-4 rounded-xl bg-neutral-50 border border-neutral-200 space-y-2">
              <div className="flex items-center justify-between text-xs text-neutral-500">
                <span>Bank Penerima</span>
                <span className="font-bold text-charcoal-900">BCA Virtual Account (Demo)</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="font-mono font-bold text-charcoal-900 text-base">
                  8808 1234 5678 9012
                </span>
                <button
                  type="button"
                  onClick={copyVa}
                  className="px-2.5 py-1 bg-white border border-neutral-300 rounded-lg text-xs font-semibold text-neutral-700 hover:bg-neutral-100 flex items-center gap-1"
                >
                  <Copy className="w-3.5 h-3.5" />
                  <span>{copied ? 'Tersalin' : 'Salin'}</span>
                </button>
              </div>
              <div className="text-[11px] text-neutral-400">Atas Nama: KKO Resto Senopati</div>
            </div>
          </div>
        )}

        {payment.method === 'e_wallet' && (
          <div className="space-y-4">
            <div className="p-4 rounded-xl bg-neutral-50 border border-neutral-200 text-xs space-y-2 text-neutral-600">
              <div className="flex justify-between">
                <span>Penyedia E-Wallet</span>
                <span className="font-bold text-charcoal-900">GoPay / OVO / Dana / ShopeePay</span>
              </div>
              <div className="flex justify-between">
                <span>Nomor Terdaftar</span>
                <span className="font-bold text-charcoal-900">{order?.customer_phone || '08123456789'}</span>
              </div>
            </div>
          </div>
        )}

        {/* Current Payment Status Display */}
        <div className="py-2 text-center">
          <span className="text-xs text-neutral-500 block mb-1">Status Transaksi Saat Ini:</span>
          <span
            className={`inline-block px-3.5 py-1 rounded-full text-xs font-extrabold uppercase ${
              payment.status === 'paid'
                ? 'bg-emerald-100 text-emerald-800'
                : payment.status === 'failed'
                ? 'bg-rose-100 text-rose-800'
                : 'bg-amber-100 text-amber-800'
            }`}
          >
            {payment.status === 'paid' ? 'LUNAS (PAID)' : payment.status}
          </span>
        </div>

        {/* Action Simulator Controls */}
        {!isAlreadyPaid ? (
          <div className="space-y-3 pt-3 border-t border-neutral-100">
            <button
              onClick={() => handleSimulate('success')}
              disabled={actionLoading}
              className="w-full py-3.5 px-4 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-sm font-bold transition flex items-center justify-center gap-2 shadow-md shadow-emerald-600/20 disabled:opacity-50"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>Simulasikan Pembayaran Berhasil</span>
            </button>

            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={() => handleSimulate('failed')}
                disabled={actionLoading}
                className="py-2.5 px-3 bg-neutral-100 hover:bg-rose-50 text-neutral-700 hover:text-rose-700 border border-neutral-300 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5"
              >
                <XCircle className="w-3.5 h-3.5" />
                <span>Simulasikan Gagal</span>
              </button>

              <button
                onClick={() => handleSimulate('cancel')}
                disabled={actionLoading}
                className="py-2.5 px-3 bg-neutral-100 hover:bg-neutral-200 text-neutral-700 border border-neutral-300 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5"
              >
                <span>Batalkan & Bayar Nanti</span>
              </button>
            </div>
          </div>
        ) : (
          <div className="pt-2 text-center space-y-3">
            <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-900 text-xs font-medium">
              Transaksi ini telah lunas dan tercatat di database. Order telah dikirimkan ke kitchen.
            </div>
            <button
              onClick={() => navigate(`/booking-confirmation/${bookingCode}?token=${token}`)}
              className="w-full py-3.5 px-4 bg-olive-700 hover:bg-olive-800 text-white rounded-xl text-sm font-bold transition flex items-center justify-center gap-2 shadow-md"
            >
              <span>Lihat Konfirmasi Booking & Download PDF</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
