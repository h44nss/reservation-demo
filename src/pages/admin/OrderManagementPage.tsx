import React, { useState, useEffect } from 'react'
import {
  ShoppingBag,
  Search,
  Filter,
  CheckCircle2,
  Clock,
  Printer,
  FileText,
  Eye,
  X,
  CreditCard,
} from 'lucide-react'
import { restaurantService } from '@/services/restaurantService'
import { OrderWithDetails, OrderStatus, RestaurantSettings } from '@/types/domain'
import {
  formatDate,
  formatTime,
  formatIDR,
  getOrderStatusConfig,
  getPaymentStatusConfig,
} from '@/utils/formatters'
import { generateBillPDF } from '@/utils/pdfGenerator'
import { useToast } from '@/components/ui/Toast'

export const OrderManagementPage: React.FC = () => {
  const toast = useToast()
  const [orders, setOrders] = useState<OrderWithDetails[]>([])
  const [settings, setSettings] = useState<RestaurantSettings | null>(null)
  const [loading, setLoading] = useState(true)

  // Filters
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [sourceFilter, setSourceFilter] = useState<string>('all')

  // Selected Order for Modal View
  const [selectedOrder, setSelectedOrder] = useState<OrderWithDetails | null>(null)

  useEffect(() => {
    loadOrders()
  }, [])

  const loadOrders = async () => {
    try {
      setLoading(true)
      const [ords, set] = await Promise.all([
        restaurantService.getOrders(),
        restaurantService.getSettings(),
      ])
      setOrders(ords)
      setSettings(set)
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const filtered = orders.filter((o) => {
    if (statusFilter !== 'all' && o.status !== statusFilter) return false
    if (sourceFilter !== 'all' && o.source !== sourceFilter) return false
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase()
      return (
        o.order_number.toLowerCase().includes(q) ||
        o.customer_name.toLowerCase().includes(q) ||
        o.customer_phone.includes(q)
      )
    }
    return true
  })

  const handleStatusChange = async (orderId: string, newStatus: OrderStatus) => {
    try {
      await restaurantService.updateOrderStatus(orderId, newStatus)
      toast.success(`Status pesanan diubah menjadi ${newStatus.toUpperCase()}`)
      loadOrders()
      if (selectedOrder && selectedOrder.id === orderId) {
        setSelectedOrder((prev) => (prev ? { ...prev, status: newStatus } : null))
      }
    } catch (err: any) {
      toast.error(err.message || 'Gagal mengubah status pesanan.')
    }
  }

  const handlePrintBill = (order: OrderWithDetails) => {
    if (!settings) return
    generateBillPDF(order, settings)
    toast.success('Dokumen Bill / Receipt berhasil dibuat.')
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold font-serif text-charcoal-900">
          Manajemen Pesanan Makanan
        </h1>
        <p className="text-xs text-neutral-500 mt-1">
          Pantau seluruh pesanan masuk dari Reservasi Online, POS Kasir, dan Walk-in pelanggan.
        </p>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-2xl border border-neutral-200/90 shadow-subtle flex flex-col md:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-neutral-400 absolute left-3.5 top-3" />
          <input
            type="text"
            placeholder="Cari no order, nama pelanggan, atau telepon..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-neutral-50 border border-neutral-300 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-olive-600"
          />
        </div>

        <div className="flex gap-2">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-2 bg-neutral-50 border border-neutral-300 rounded-xl text-xs font-medium focus:outline-none focus:ring-2 focus:ring-olive-600"
          >
            <option value="all">Semua Status Order</option>
            <option value="pending">Pending</option>
            <option value="confirmed">Confirmed</option>
            <option value="in_preparation">In Preparation</option>
            <option value="ready">Ready</option>
            <option value="served">Served</option>
            <option value="completed">Completed</option>
            <option value="cancelled">Cancelled</option>
          </select>

          <select
            value={sourceFilter}
            onChange={(e) => setSourceFilter(e.target.value)}
            className="px-3 py-2 bg-neutral-50 border border-neutral-300 rounded-xl text-xs font-medium focus:outline-none focus:ring-2 focus:ring-olive-600"
          >
            <option value="all">Semua Sumber</option>
            <option value="online">Online</option>
            <option value="reservation">Reservation</option>
            <option value="pos">POS Kasir</option>
            <option value="walk_in">Walk-in</option>
          </select>
        </div>
      </div>

      {/* Orders Table */}
      <div className="bg-white rounded-2xl border border-neutral-200/90 shadow-subtle overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-neutral-50 text-neutral-500 font-bold uppercase tracking-wider border-b border-neutral-200">
              <tr>
                <th className="py-3.5 px-4">No. Order</th>
                <th className="py-3.5 px-4">Pelanggan</th>
                <th className="py-3.5 px-4">Tipe & Meja</th>
                <th className="py-3.5 px-4">Sumber</th>
                <th className="py-3.5 px-4">Item & Total</th>
                <th className="py-3.5 px-4">Status Order</th>
                <th className="py-3.5 px-4">Pembayaran</th>
                <th className="py-3.5 px-4 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-100">
              {loading ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-neutral-400">
                    Memuat pesanan...
                  </td>
                </tr>
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-neutral-400">
                    Tidak ada pesanan ditemukan.
                  </td>
                </tr>
              ) : (
                filtered.map((ord) => {
                  const ordStatus = getOrderStatusConfig(ord.status)
                  const payStatus = getPaymentStatusConfig(ord.payment_status)
                  return (
                    <tr key={ord.id} className="hover:bg-neutral-50/80 transition">
                      <td className="py-3.5 px-4">
                        <span className="font-mono font-bold text-charcoal-900">{ord.order_number}</span>
                      </td>
                      <td className="py-3.5 px-4">
                        <div className="font-bold text-charcoal-900">{ord.customer_name}</div>
                        <div className="text-neutral-500 text-[11px]">{ord.customer_phone}</div>
                      </td>
                      <td className="py-3.5 px-4">
                        <div className="font-semibold text-charcoal-900 capitalize">
                          {ord.order_type.replace('_', ' ')}
                        </div>
                        <div className="text-[11px] text-neutral-500">
                          Meja: {ord.table ? ord.table.table_number : '-'}
                        </div>
                      </td>
                      <td className="py-3.5 px-4">
                        <span className="font-medium text-neutral-600 capitalize bg-neutral-100 px-2 py-0.5 rounded">
                          {ord.source}
                        </span>
                      </td>
                      <td className="py-3.5 px-4">
                        <div className="font-extrabold text-charcoal-900">{formatIDR(ord.grand_total)}</div>
                        <div className="text-[11px] text-neutral-500">{ord.items?.length || 0} items</div>
                      </td>
                      <td className="py-3.5 px-4">
                        <span className={`px-2.5 py-0.5 rounded-full font-bold border text-[11px] ${ordStatus.bg}`}>
                          {ordStatus.label}
                        </span>
                      </td>
                      <td className="py-3.5 px-4">
                        <span className={`px-2.5 py-0.5 rounded-full font-bold border text-[11px] ${payStatus.bg}`}>
                          {payStatus.label}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => setSelectedOrder(ord)}
                            className="p-1.5 rounded-lg text-neutral-600 hover:text-charcoal-900 hover:bg-neutral-100"
                            title="Lihat Rincian Item"
                          >
                            <Eye className="w-4 h-4" />
                          </button>

                          <button
                            onClick={() => handlePrintBill(ord)}
                            className="p-1.5 rounded-lg text-neutral-600 hover:text-charcoal-900 hover:bg-neutral-100"
                            title="Cetak Bill / Receipt PDF"
                          >
                            <Printer className="w-4 h-4" />
                          </button>

                          {ord.status === 'pending' && (
                            <button
                              onClick={() => handleStatusChange(ord.id, 'confirmed')}
                              className="px-2 py-1 rounded-lg bg-blue-50 text-blue-800 font-bold text-[11px]"
                            >
                              Konfirmasi
                            </button>
                          )}
                          {ord.status === 'ready' && (
                            <button
                              onClick={() => handleStatusChange(ord.id, 'served')}
                              className="px-2 py-1 rounded-lg bg-teal-50 text-teal-800 font-bold text-[11px]"
                            >
                              Sajikan
                            </button>
                          )}
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

      {/* Order Details Modal */}
      {selectedOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 space-y-5 shadow-2xl border border-neutral-200 animate-slide-up">
            <div className="flex items-center justify-between pb-3 border-b border-neutral-100">
              <div>
                <h3 className="text-base font-bold text-charcoal-900">
                  Rincian Order: {selectedOrder.order_number}
                </h3>
                <span className="text-xs text-neutral-500">
                  Pelanggan: {selectedOrder.customer_name} ({selectedOrder.customer_phone})
                </span>
              </div>
              <button
                onClick={() => setSelectedOrder(null)}
                className="text-neutral-400 hover:text-neutral-700 p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Items */}
            <div className="space-y-2.5 max-h-60 overflow-y-auto pr-1 text-xs">
              {selectedOrder.items?.map((item) => (
                <div key={item.id} className="p-2.5 rounded-xl bg-neutral-50 border border-neutral-100 flex justify-between">
                  <div>
                    <span className="font-bold text-charcoal-900">{item.item_name_snapshot}</span>
                    <span className="text-neutral-500 block">
                      {item.quantity}x @ {formatIDR(item.unit_price_snapshot)}
                    </span>
                    {item.notes && <span className="text-[11px] text-olive-700 italic">"{item.notes}"</span>}
                  </div>
                  <span className="font-extrabold text-charcoal-900">{formatIDR(item.line_total)}</span>
                </div>
              ))}
            </div>

            {/* Total breakdown */}
            <div className="pt-2 border-t border-neutral-200 space-y-1.5 text-xs text-neutral-600">
              <div className="flex justify-between">
                <span>Subtotal</span>
                <span>{formatIDR(selectedOrder.subtotal)}</span>
              </div>
              <div className="flex justify-between">
                <span>Pajak (10%)</span>
                <span>{formatIDR(selectedOrder.tax_amount)}</span>
              </div>
              <div className="flex justify-between">
                <span>Service Charge (5%)</span>
                <span>{formatIDR(selectedOrder.service_charge_amount)}</span>
              </div>
              <div className="flex justify-between text-base font-black text-charcoal-900 pt-2 border-t border-neutral-200">
                <span>Grand Total</span>
                <span className="text-olive-800">{formatIDR(selectedOrder.grand_total)}</span>
              </div>
            </div>

            <div className="flex justify-between items-center pt-2">
              <button
                onClick={() => handlePrintBill(selectedOrder)}
                className="px-3.5 py-2 bg-charcoal-900 hover:bg-charcoal-800 text-white rounded-xl text-xs font-bold flex items-center gap-1.5"
              >
                <Printer className="w-3.5 h-3.5" />
                <span>Cetak Bill PDF</span>
              </button>

              <button
                onClick={() => setSelectedOrder(null)}
                className="px-4 py-2 border border-neutral-300 text-neutral-700 hover:bg-neutral-50 rounded-xl text-xs font-semibold"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
