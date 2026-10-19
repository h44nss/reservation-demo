import React, { useState, useEffect } from 'react'
import {
  Layers,
  Plus,
  Users,
  CheckCircle2,
  Clock,
  Sparkles,
  AlertTriangle,
  X,
  Filter,
} from 'lucide-react'
import { restaurantService } from '@/services/restaurantService'
import { DiningTable, TableStatus } from '@/types/domain'
import { getTableStatusConfig } from '@/utils/formatters'
import { useToast } from '@/components/ui/Toast'

export const TableManagementPage: React.FC = () => {
  const toast = useToast()
  const [tables, setTables] = useState<DiningTable[]>([])
  const [loading, setLoading] = useState(true)
  const [areaFilter, setAreaFilter] = useState('all')

  // Add Table Modal
  const [isAddModalOpen, setIsAddModalOpen] = useState(false)
  const [tableNumber, setTableNumber] = useState('')
  const [tableArea, setTableArea] = useState('Indoor AC')
  const [capacity, setCapacity] = useState(4)

  useEffect(() => {
    loadTables()
  }, [])

  const loadTables = async () => {
    try {
      setLoading(true)
      const data = await restaurantService.getTables()
      setTables(data)
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const distinctAreas = Array.from(new Set(tables.map((t) => t.area)))

  const handleStatusChange = async (tableId: string, newStatus: TableStatus) => {
    try {
      await restaurantService.updateTableStatus(tableId, newStatus)
      toast.success(`Status meja diperbarui menjadi ${newStatus.toUpperCase()}`)
      loadTables()
    } catch (err: any) {
      toast.error(err.message || 'Gagal mengubah status meja.')
    }
  }

  const handleAddTable = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!tableNumber.trim()) return

    try {
      await restaurantService.createTable({
        table_number: tableNumber.trim(),
        area: tableArea,
        capacity,
        current_status: 'available',
      })
      toast.success(`Meja ${tableNumber} berhasil ditambahkan!`)
      setTableNumber('')
      setIsAddModalOpen(false)
      loadTables()
    } catch (err: any) {
      toast.error(err.message || 'Gagal menambah meja.')
    }
  }

  const filtered = tables.filter((t) => {
    if (areaFilter !== 'all' && t.area !== areaFilter) return false
    return true
  })

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold font-serif text-charcoal-900">
            Denah & Manajemen Meja
          </h1>
          <p className="text-xs text-neutral-500 mt-1">
            Pantau status penggunaan meja (Tersedia, Terisi, Dibersihkan, Dipesan) dan kapasitas pengunjung.
          </p>
        </div>

        <button
          onClick={() => setIsAddModalOpen(true)}
          className="px-4 py-2 bg-olive-700 hover:bg-olive-800 text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 shadow-sm self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>Tambah Meja Baru</span>
        </button>
      </div>

      {/* Area Filter Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2 text-xs font-semibold">
        <button
          onClick={() => setAreaFilter('all')}
          className={`px-4 py-2 rounded-xl transition ${
            areaFilter === 'all'
              ? 'bg-olive-700 text-white shadow-sm'
              : 'bg-white border border-neutral-200 text-neutral-700 hover:bg-neutral-50'
          }`}
        >
          Semua Area ({tables.length})
        </button>
        {distinctAreas.map((area) => {
          const count = tables.filter((t) => t.area === area).length
          return (
            <button
              key={area}
              onClick={() => setAreaFilter(area)}
              className={`px-4 py-2 rounded-xl transition ${
                areaFilter === area
                  ? 'bg-olive-700 text-white shadow-sm'
                  : 'bg-white border border-neutral-200 text-neutral-700 hover:bg-neutral-50'
              }`}
            >
              {area} ({count})
            </button>
          )
        })}
      </div>

      {/* Tables Grid Layout */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5">
        {filtered.map((t) => {
          const statusConf = getTableStatusConfig(t.current_status)
          return (
            <div
              key={t.id}
              className="bg-white rounded-2xl border border-neutral-200/90 p-5 shadow-subtle flex flex-col justify-between space-y-4 hover:shadow-elevated transition"
            >
              <div className="flex items-start justify-between">
                <div>
                  <span className="font-mono text-2xl font-black text-charcoal-900 block">
                    {t.table_number}
                  </span>
                  <span className="text-xs text-neutral-500 font-medium block mt-0.5">{t.area}</span>
                </div>
                <span className={`px-2.5 py-1 rounded-full text-[11px] font-bold border ${statusConf.bg}`}>
                  {statusConf.label}
                </span>
              </div>

              <div className="flex items-center gap-1.5 text-xs text-neutral-600 bg-neutral-50 p-2.5 rounded-xl">
                <Users className="w-4 h-4 text-olive-700" />
                <span>Kapasitas: <strong className="text-charcoal-900">{t.capacity} Orang</strong></span>
              </div>

              {/* Status Action Switcher */}
              <div className="pt-2 border-t border-neutral-100 flex items-center justify-between text-xs">
                <span className="text-[11px] text-neutral-400 font-medium">Ubah Status:</span>
                <select
                  value={t.current_status}
                  onChange={(e) => handleStatusChange(t.id, e.target.value as TableStatus)}
                  className="px-2 py-1 bg-neutral-100 border border-neutral-200 rounded-lg text-[11px] font-bold focus:outline-none focus:ring-1 focus:ring-olive-600"
                >
                  <option value="available">Tersedia</option>
                  <option value="reserved">Dipesan</option>
                  <option value="occupied">Terisi (Makan)</option>
                  <option value="cleaning">Dibersihkan</option>
                  <option value="inactive">Non-aktif</option>
                </select>
              </div>
            </div>
          )
        })}
      </div>

      {/* Add Table Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl max-w-sm w-full p-6 space-y-4 shadow-xl border border-neutral-200 animate-slide-up">
            <div className="flex items-center justify-between pb-2 border-b border-neutral-100">
              <h3 className="text-base font-bold text-charcoal-900">Tambah Meja Baru</h3>
              <button onClick={() => setIsAddModalOpen(false)} className="text-neutral-400 hover:text-neutral-700">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAddTable} className="space-y-3.5 text-xs">
              <div>
                <label className="block font-semibold text-neutral-700 mb-1">Nomor / Label Meja *</label>
                <input
                  type="text"
                  required
                  placeholder="Cth: T-09"
                  value={tableNumber}
                  onChange={(e) => setTableNumber(e.target.value)}
                  className="w-full px-3.5 py-2 bg-neutral-50 border border-neutral-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-olive-600 uppercase font-mono font-bold"
                />
              </div>

              <div>
                <label className="block font-semibold text-neutral-700 mb-1">Area Penempatan *</label>
                <select
                  value={tableArea}
                  onChange={(e) => setTableArea(e.target.value)}
                  className="w-full px-3.5 py-2 bg-neutral-50 border border-neutral-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-olive-600"
                >
                  <option value="Indoor AC">Indoor AC</option>
                  <option value="Outdoor Garden">Outdoor Garden</option>
                  <option value="VIP Lounge">VIP Lounge</option>
                  <option value="Rooftop Bar">Rooftop Bar</option>
                  <option value="VIP Private Room">VIP Private Room</option>
                </select>
              </div>

              <div>
                <label className="block font-semibold text-neutral-700 mb-1">Kapasitas Tamu *</label>
                <input
                  type="number"
                  min="1"
                  max="50"
                  required
                  value={capacity}
                  onChange={(e) => setCapacity(parseInt(e.target.value) || 2)}
                  className="w-full px-3.5 py-2 bg-neutral-50 border border-neutral-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-olive-600"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-4 py-2 text-neutral-600 hover:bg-neutral-100 rounded-xl font-semibold"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-olive-700 hover:bg-olive-800 text-white font-bold rounded-xl shadow-sm"
                >
                  Simpan Meja
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
