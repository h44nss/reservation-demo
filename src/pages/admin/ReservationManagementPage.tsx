import React, { useState, useEffect } from 'react'
import {
  CalendarDays,
  Search,
  Filter,
  CheckCircle2,
  XCircle,
  Users,
  Clock,
  Printer,
  ChevronRight,
  MapPin,
  Layers,
  Edit,
} from 'lucide-react'
import { restaurantService } from '@/services/restaurantService'
import { ReservationWithDetails, DiningTable, ReservationStatus, RestaurantSettings } from '@/types/domain'
import {
  formatDate,
  formatTime,
  formatIDR,
  getReservationStatusConfig,
} from '@/utils/formatters'
import { generateBookingPDF } from '@/utils/pdfGenerator'
import { useToast } from '@/components/ui/Toast'

export const ReservationManagementPage: React.FC = () => {
  const toast = useToast()
  const [reservations, setReservations] = useState<ReservationWithDetails[]>([])
  const [tables, setTables] = useState<DiningTable[]>([])
  const [settings, setSettings] = useState<RestaurantSettings | null>(null)
  const [loading, setLoading] = useState(true)

  // Filters
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [dateFilter, setDateFilter] = useState<string>('')

  // Table Assignment Modal
  const [activeReservation, setActiveReservation] = useState<ReservationWithDetails | null>(null)
  const [selectedTableToAssign, setSelectedTableToAssign] = useState<string>('')
  const [isAssignModalOpen, setIsAssignModalOpen] = useState(false)

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    try {
      setLoading(true)
      const [res, tbs, set] = await Promise.all([
        restaurantService.getReservations(),
        restaurantService.getTables(),
        restaurantService.getSettings(),
      ])
      setReservations(res)
      setTables(tbs)
      setSettings(set)
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const filtered = reservations.filter((r) => {
    if (statusFilter !== 'all' && r.status !== statusFilter) return false
    if (dateFilter && r.reservation_date !== dateFilter) return false
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase()
      return (
        r.booking_code.toLowerCase().includes(q) ||
        r.customer_name.toLowerCase().includes(q) ||
        r.customer_phone.includes(q)
      )
    }
    return true
  })

  const handleStatusChange = async (id: string, newStatus: ReservationStatus) => {
    try {
      await restaurantService.updateReservationStatus(id, newStatus)
      toast.success(`Status reservasi diperbarui menjadi ${newStatus.toUpperCase()}`)
      loadData()
    } catch (err: any) {
      toast.error(err.message || 'Gagal mengubah status.')
    }
  }

  const openAssignModal = (res: ReservationWithDetails) => {
    setActiveReservation(res)
    setSelectedTableToAssign(res.table_id || '')
    setIsAssignModalOpen(true)
  }

  const handleAssignTableSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!activeReservation || !selectedTableToAssign) return
    try {
      await restaurantService.assignTableToReservation(activeReservation.id, selectedTableToAssign)
      toast.success('Meja berhasil dialokasikan!')
      setIsAssignModalOpen(false)
      loadData()
    } catch (err: any) {
      toast.error(err.message || 'Gagal mengalokasikan meja.')
    }
  }

  const handlePrintPDF = (res: ReservationWithDetails) => {
    if (!settings) return
    generateBookingPDF(res, settings)
    toast.success('Dokumen Booking PDF berhasil dibuat.')
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold font-serif text-charcoal-900">
            Manajemen Reservasi Meja
          </h1>
          <p className="text-xs text-neutral-500 mt-1">
            Konfirmasi, alokasikan meja tamu, tandai kehadiran (Seated), dan cetak PDF konfirmasi.
          </p>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-2xl border border-neutral-200/90 shadow-subtle flex flex-col md:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-neutral-400 absolute left-3.5 top-3" />
          <input
            type="text"
            placeholder="Cari kode booking, nama tamu, atau no. telepon..."
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
            <option value="all">Semua Status</option>
            <option value="pending">Pending</option>
            <option value="confirmed">Confirmed</option>
            <option value="seated">Seated</option>
            <option value="completed">Completed</option>
            <option value="cancelled">Cancelled</option>
            <option value="no_show">No Show</option>
          </select>

          <input
            type="date"
            value={dateFilter}
            onChange={(e) => setDateFilter(e.target.value)}
            className="px-3 py-2 bg-neutral-50 border border-neutral-300 rounded-xl text-xs font-medium focus:outline-none focus:ring-2 focus:ring-olive-600"
          />

          {(statusFilter !== 'all' || dateFilter || searchQuery) && (
            <button
              onClick={() => {
                setStatusFilter('all')
                setDateFilter('')
                setSearchQuery('')
              }}
              className="px-3 py-2 text-xs text-neutral-600 hover:text-neutral-900 border border-neutral-200 rounded-xl"
            >
              Reset
            </button>
          )}
        </div>
      </div>

      {/* Reservations Table */}
      <div className="bg-white rounded-2xl border border-neutral-200/90 shadow-subtle overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-neutral-50 text-neutral-500 font-bold uppercase tracking-wider border-b border-neutral-200">
              <tr>
                <th className="py-3.5 px-4">Kode Booking</th>
                <th className="py-3.5 px-4">Pelanggan</th>
                <th className="py-3.5 px-4">Tanggal & Jam</th>
                <th className="py-3.5 px-4">Tamu</th>
                <th className="py-3.5 px-4">Meja</th>
                <th className="py-3.5 px-4">Order Makanan</th>
                <th className="py-3.5 px-4">Status</th>
                <th className="py-3.5 px-4 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-100">
              {loading ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-neutral-400">
                    Memuat data reservasi...
                  </td>
                </tr>
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-neutral-400">
                    Tidak ada reservasi yang sesuai dengan kriteria filter.
                  </td>
                </tr>
              ) : (
                filtered.map((res) => {
                  const statusConf = getReservationStatusConfig(res.status)
                  return (
                    <tr key={res.id} className="hover:bg-neutral-50/80 transition">
                      <td className="py-3.5 px-4">
                        <span className="font-mono font-bold text-olive-800">{res.booking_code}</span>
                      </td>
                      <td className="py-3.5 px-4">
                        <div className="font-bold text-charcoal-900">{res.customer_name}</div>
                        <div className="text-neutral-500 text-[11px]">{res.customer_phone}</div>
                      </td>
                      <td className="py-3.5 px-4">
                        <div className="font-medium text-charcoal-900">{formatDate(res.reservation_date)}</div>
                        <div className="text-neutral-500 text-[11px]">{formatTime(res.start_time)}</div>
                      </td>
                      <td className="py-3.5 px-4">
                        <span className="font-bold text-charcoal-900">{res.guest_count} Orang</span>
                      </td>
                      <td className="py-3.5 px-4">
                        {res.table ? (
                          <div className="flex items-center gap-1.5 font-bold text-charcoal-900">
                            <span>{res.table.table_number}</span>
                            <span className="text-[10px] text-neutral-400">({res.table.area})</span>
                          </div>
                        ) : (
                          <button
                            onClick={() => openAssignModal(res)}
                            className="text-[11px] font-bold text-amber-700 bg-amber-50 hover:bg-amber-100 px-2.5 py-1 rounded-md border border-amber-200 transition"
                          >
                            + Tentukan Meja
                          </button>
                        )}
                      </td>
                      <td className="py-3.5 px-4">
                        {res.order ? (
                          <div>
                            <span className="font-bold text-charcoal-900 block">
                              {formatIDR(res.order.grand_total)}
                            </span>
                            <span className="text-[10px] text-neutral-500">
                              {res.order.items?.length || 0} items ({res.order.payment_status.toUpperCase()})
                            </span>
                          </div>
                        ) : (
                          <span className="text-neutral-400">Hanya Meja</span>
                        )}
                      </td>
                      <td className="py-3.5 px-4">
                        <span className={`px-2.5 py-0.5 rounded-full font-bold border text-[11px] ${statusConf.bg}`}>
                          {statusConf.label}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {res.status === 'pending' && (
                            <button
                              onClick={() => handleStatusChange(res.id, 'confirmed')}
                              className="p-1.5 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-800"
                              title="Konfirmasi Reservasi"
                            >
                              <CheckCircle2 className="w-4 h-4" />
                            </button>
                          )}

                          {res.status === 'confirmed' && (
                            <button
                              onClick={() => handleStatusChange(res.id, 'seated')}
                              className="px-2 py-1 rounded-lg bg-blue-50 hover:bg-blue-100 text-blue-800 text-[11px] font-bold"
                              title="Tandai Tamu Datang / Duduk"
                            >
                              Tamu Datang
                            </button>
                          )}

                          {res.status === 'seated' && (
                            <button
                              onClick={() => handleStatusChange(res.id, 'completed')}
                              className="px-2 py-1 rounded-lg bg-gray-100 hover:bg-gray-200 text-gray-800 text-[11px] font-bold"
                              title="Selesaikan Sesi Reservasi"
                            >
                              Selesai
                            </button>
                          )}

                          <button
                            onClick={() => openAssignModal(res)}
                            className="p-1.5 rounded-lg text-neutral-400 hover:text-neutral-700 hover:bg-neutral-100"
                            title="Pindah / Assign Meja"
                          >
                            <Layers className="w-4 h-4" />
                          </button>

                          <button
                            onClick={() => handlePrintPDF(res)}
                            className="p-1.5 rounded-lg text-neutral-400 hover:text-neutral-700 hover:bg-neutral-100"
                            title="Cetak Dokumen Booking PDF"
                          >
                            <Printer className="w-4 h-4" />
                          </button>

                          {res.status !== 'cancelled' && res.status !== 'completed' && (
                            <button
                              onClick={() => handleStatusChange(res.id, 'cancelled')}
                              className="p-1.5 rounded-lg text-rose-400 hover:text-rose-700 hover:bg-rose-50"
                              title="Batalkan Reservasi"
                            >
                              <XCircle className="w-4 h-4" />
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

      {/* Table Assignment Modal */}
      {isAssignModalOpen && activeReservation && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 space-y-4 shadow-xl border border-neutral-200 animate-slide-up">
            <h3 className="text-base font-bold text-charcoal-900">
              Alokasikan Meja untuk {activeReservation.customer_name}
            </h3>
            <p className="text-xs text-neutral-500">
              Kapasitas yang dibutuhkan: <strong className="text-charcoal-900">{activeReservation.guest_count} Orang</strong> pada tanggal {formatDate(activeReservation.reservation_date)} pk {formatTime(activeReservation.start_time)}.
            </p>

            <form onSubmit={handleAssignTableSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-neutral-700 mb-1">
                  Pilih Meja Tersedia
                </label>
                <select
                  required
                  value={selectedTableToAssign}
                  onChange={(e) => setSelectedTableToAssign(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-neutral-50 border border-neutral-300 rounded-xl text-xs font-medium focus:outline-none focus:ring-2 focus:ring-olive-600"
                >
                  <option value="">Pilih Meja...</option>
                  {tables
                    .filter((t) => t.is_active && t.capacity >= activeReservation.guest_count)
                    .map((t) => (
                      <option key={t.id} value={t.id}>
                        {t.table_number} — {t.area} (Kapasitas: {t.capacity} orang) [{t.current_status.toUpperCase()}]
                      </option>
                    ))}
                </select>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsAssignModalOpen(false)}
                  className="px-4 py-2 text-xs font-semibold text-neutral-600 hover:bg-neutral-100 rounded-xl"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-olive-700 hover:bg-olive-800 text-white text-xs font-bold rounded-xl shadow-sm"
                >
                  Simpan & Alokasikan
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
