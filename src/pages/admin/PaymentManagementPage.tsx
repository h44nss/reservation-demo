import React, { useState, useEffect } from 'react'
import {
  CreditCard,
  Search,
  Filter,
  CheckCircle2,
  XCircle,
  Clock,
  Printer,
  ShieldCheck,
} from 'lucide-react'
import { restaurantService } from '@/services/restaurantService'
import { Payment, OrderWithDetails, RestaurantSettings } from '@/types/domain'
import { formatIDR, formatDateTime, getPaymentStatusConfig } from '@/utils/formatters'
import { generateBillPDF } from '@/utils/pdfGenerator'
import { useToast } from '@/components/ui/Toast'

export const PaymentManagementPage: React.FC = () => {
  const toast = useToast()
  const [payments, setPayments] = useState<Payment[]>([])
  const [orders, setOrders] = useState<OrderWithDetails[]>([])
  const [settings, setSettings] = useState<RestaurantSettings | null>(null)
  const [loading, setLoading] = useState(true)

  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')

  useEffect(() => {
    loadPayments()
  }, [])

  const loadPayments = async () => {
    try {
      setLoading(true)
      const [pays, ords, set] = await Promise.all([
        restaurantService.getPayments(),
        restaurantService.getOrders(),
        restaurantService.getSettings(),
      ])
      setPayments(pays)
      setOrders(ords)
      setSettings(set)
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const handleConfirmManualPayment = async (payment: Payment) => {
    try {
      await restaurantService.processSimulatedPayment(payment.payment_reference, 'success')
      toast.success(`Pembayaran ${payment.payment_reference} berhasil dikonfirmasi sebagai LUNAS!`)
      loadPayments()
    } catch (err: any) {
      toast.error(err.message || 'Gagal mengonfirmasi pembayaran.')
    }
  }

  const handlePrintReceipt = (orderId: string) => {
    const matched = orders.find((o) => o.id === orderId)
    if (!matched || !settings) return
    generateBillPDF(matched, settings)
    toast.success('Struk Bukti Pembayaran berhasil diunduh.')
  }

  const filtered = payments.filter((p) => {
    if (statusFilter !== 'all' && p.status !== statusFilter) return false
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase()
      const linkedOrder = orders.find((o) => o.id === p.order_id)
      return (
        p.payment_reference.toLowerCase().includes(q) ||
        (linkedOrder && linkedOrder.order_number.toLowerCase().includes(q)) ||
        (linkedOrder && linkedOrder.customer_name.toLowerCase().includes(q))
      )
    }
    return true
  })

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold font-serif text-charcoal-900">
          Manajemen Pembayaran & Transaksi
        </h1>
        <p className="text-xs text-neutral-500 mt-1">
          Pantau referensi pembayaran, konfirmasi transfer manual, dan kelola audit trail status pelunasan.
        </p>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-2xl border border-neutral-200/90 shadow-subtle flex flex-col md:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-neutral-400 absolute left-3.5 top-3" />
          <input
            type="text"
            placeholder="Cari kode referensi, nomor order, atau nama pelanggan..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-neutral-50 border border-neutral-300 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-olive-600"
          />
        </div>

        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="px-3 py-2 bg-neutral-50 border border-neutral-300 rounded-xl text-xs font-medium focus:outline-none focus:ring-2 focus:ring-olive-600"
        >
          <option value="all">Semua Status Pembayaran</option>
          <option value="paid">Lunas (Paid)</option>
          <option value="unpaid">Belum Bayar (Unpaid)</option>
          <option value="pending">Pending</option>
          <option value="failed">Gagal (Failed)</option>
        </select>
      </div>

      {/* Payments Table */}
      <div className="bg-white rounded-2xl border border-neutral-200/90 shadow-subtle overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-neutral-50 text-neutral-500 font-bold uppercase tracking-wider border-b border-neutral-200">
              <tr>
                <th className="py-3.5 px-4">No. Referensi</th>
                <th className="py-3.5 px-4">Order Terkait</th>
                <th className="py-3.5 px-4">Metode & Tipe</th>
                <th className="py-3.5 px-4">Nominal</th>
                <th className="py-3.5 px-4">Status</th>
                <th className="py-3.5 px-4">Waktu Pembayaran</th>
                <th className="py-3.5 px-4 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-100">
              {loading ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-neutral-400">
                    Memuat pembayaran...
                  </td>
                </tr>
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-neutral-400">
                    Tidak ada transaksi pembayaran ditemukan.
                  </td>
                </tr>
              ) : (
                filtered.map((pay) => {
                  const linkedOrder = orders.find((o) => o.id === pay.order_id)
                  const payConf = getPaymentStatusConfig(pay.status)
                  return (
                    <tr key={pay.id} className="hover:bg-neutral-50/80 transition">
                      <td className="py-3.5 px-4">
                        <span className="font-mono font-bold text-olive-800">{pay.payment_reference}</span>
                        {pay.is_demo && (
                          <span className="ml-2 text-[10px] bg-neutral-200 text-neutral-600 px-1.5 py-0.2 rounded font-bold">
                            DEMO
                          </span>
                        )}
                      </td>
                      <td className="py-3.5 px-4">
                        <div className="font-bold text-charcoal-900">{linkedOrder?.order_number || '-'}</div>
                        <div className="text-[11px] text-neutral-500">{linkedOrder?.customer_name || '-'}</div>
                      </td>
                      <td className="py-3.5 px-4">
                        <span className="font-bold uppercase text-charcoal-900 block">{pay.method}</span>
                        <span className="text-[11px] text-neutral-500">{pay.payment_type.replace('_', ' ')}</span>
                      </td>
                      <td className="py-3.5 px-4">
                        <span className="font-extrabold text-charcoal-900 text-sm">
                          {formatIDR(pay.amount)}
                        </span>
                      </td>
                      <td className="py-3.5 px-4">
                        <span className={`px-2.5 py-0.5 rounded-full font-bold border text-[11px] ${payConf.bg}`}>
                          {payConf.label}
                        </span>
                      </td>
                      <td className="py-3.5 px-4">
                        <span className="text-neutral-600 font-medium">
                          {pay.paid_at ? formatDateTime(pay.paid_at) : 'Belum Terkonfirmasi'}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {pay.status !== 'paid' && (
                            <button
                              onClick={() => handleConfirmManualPayment(pay)}
                              className="px-2.5 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-[11px] shadow-sm"
                              title="Konfirmasi Lunas"
                            >
                              Konfirmasi Lunas
                            </button>
                          )}

                          <button
                            onClick={() => handlePrintReceipt(pay.order_id)}
                            className="p-1.5 rounded-lg text-neutral-500 hover:text-charcoal-900 hover:bg-neutral-100"
                            title="Cetak Bukti Pembayaran PDF"
                          >
                            <Printer className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
