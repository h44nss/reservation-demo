import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  CalendarDays,
  Clock,
  Users,
  MapPin,
  Utensils,
  ArrowRight,
  Info,
  CheckCircle2,
  AlertCircle,
  FileText,
} from 'lucide-react'
import { restaurantService } from '@/services/restaurantService'
import { DiningTable, RestaurantSettings } from '@/types/domain'
import { useCart } from '@/contexts/CartContext'
import { useToast } from '@/components/ui/Toast'

export const ReservationPage: React.FC = () => {
  const navigate = useNavigate()
  const { clearCart } = useCart()
  const toast = useToast()

  const [settings, setSettings] = useState<RestaurantSettings | null>(null)
  const [tables, setTables] = useState<DiningTable[]>([])
  const [loading, setLoading] = useState(false)
  const [formError, setFormError] = useState<string | null>(null)

  // Form State
  const [customerName, setCustomerName] = useState('')
  const [customerPhone, setCustomerPhone] = useState('')
  const [customerEmail, setCustomerEmail] = useState('')
  const [reservationDate, setReservationDate] = useState(() => {
    return new Date().toISOString().split('T')[0]
  })
  const [startTime, setStartTime] = useState('18:00')
  const [guestCount, setGuestCount] = useState(2)
  const [selectedArea, setSelectedArea] = useState<string>('all')
  const [selectedTableId, setSelectedTableId] = useState<string>('')
  const [notes, setNotes] = useState('')
  const [reservationType, setReservationType] = useState<'reserve_only' | 'reserve_and_order'>('reserve_only')

  useEffect(() => {
    restaurantService.getSettings().then(setSettings).catch(console.error)
    restaurantService.getTables().then(setTables).catch(console.error)
  }, [])

  // Filter available tables based on area and guest count
  const filteredTables = tables.filter((t) => {
    if (!t.is_active) return false
    if (selectedArea !== 'all' && t.area !== selectedArea) return false
    return t.capacity >= guestCount
  })

  const distinctAreas = Array.from(new Set(tables.map((t) => t.area)))

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setFormError(null)

    if (!customerName.trim() || !customerPhone.trim()) {
      setFormError('Nama lengkap dan nomor telepon wajib diisi.')
      return
    }

    if (guestCount < 1 || guestCount > 30) {
      setFormError('Jumlah tamu harus antara 1 sampai 30 orang.')
      return
    }

    // Validate table capacity if table is chosen
    if (selectedTableId) {
      const chosen = tables.find((t) => t.id === selectedTableId)
      if (chosen && chosen.capacity < guestCount) {
        setFormError(`Kapasitas meja ${chosen.table_number} (${chosen.capacity} orang) tidak mencukupi untuk ${guestCount} tamu.`)
        return
      }
    }

    try {
      setLoading(true)

      // If user chose Reserve & Order:
      if (reservationType === 'reserve_and_order') {
        // Save pending reservation context in sessionStorage
        const pendingReservation = {
          customer_name: customerName.trim(),
          customer_phone: customerPhone.trim(),
          customer_email: customerEmail.trim() || null,
          reservation_date: reservationDate,
          start_time: startTime + ':00',
          guest_count: guestCount,
          table_id: selectedTableId || null,
          notes: notes.trim() || null,
        }
        sessionStorage.setItem('kko_pending_reservation', JSON.stringify(pendingReservation))
        toast.info('Reservasi meja dicatat. Sekarang silakan pilih menu makanan Anda.')
        navigate('/order?mode=reservation')
        return
      }

      // If Reserve Only:
      clearCart()
      const result = await restaurantService.createReservationAndOrder({
        customer_name: customerName.trim(),
        customer_phone: customerPhone.trim(),
        customer_email: customerEmail.trim() || undefined,
        reservation_date: reservationDate,
        start_time: startTime + ':00',
        guest_count: guestCount,
        table_id: selectedTableId || null,
        notes: notes.trim() || undefined,
        order_source: 'online',
        items: [],
      })

      toast.success(`Reservasi berhasil dibuat! Kode: ${result.booking_code}`)
      navigate(`/booking-confirmation/${result.booking_code}?token=${result.public_access_token}`)
    } catch (err: any) {
      console.error(err)
      setFormError(err.message || 'Gagal memproses reservasi. Silakan periksa kembali formulir Anda.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-14 space-y-8">
      {/* Header */}
      <div className="text-center max-w-2xl mx-auto space-y-2">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-olive-100 text-olive-800 text-xs font-bold uppercase tracking-wider">
          <CalendarDays className="w-3.5 h-3.5" />
          <span>Online Table Booking</span>
        </div>
        <h1 className="font-serif text-3xl sm:text-4xl font-bold text-charcoal-900">
          Reservasi Meja Restoran
        </h1>
        <p className="text-sm text-neutral-500">
          Pesan meja tanpa antre dan tanpa perlu login. Konfirmasi otomatis atau oleh admin secara terpusat.
        </p>
      </div>

      {formError && (
        <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-sm flex items-start gap-3">
          <AlertCircle className="w-5 h-5 shrink-0 mt-0.5 text-rose-600" />
          <span>{formError}</span>
        </div>
      )}

      {/* Main Form & Summary Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Form Column */}
        <form onSubmit={handleSubmit} className="lg:col-span-2 space-y-6 bg-white p-6 sm:p-8 rounded-2xl border border-neutral-200/90 shadow-subtle">
          {/* Reservation Type Mode Selector */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-neutral-500 mb-3">
              Pilihan Jenis Reservasi
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setReservationType('reserve_only')}
                className={`p-4 rounded-xl border text-left flex items-start gap-3 transition ${
                  reservationType === 'reserve_only'
                    ? 'border-olive-600 bg-olive-50/60 ring-2 ring-olive-600/20'
                    : 'border-neutral-200 hover:bg-neutral-50'
                }`}
              >
                <div className={`p-2 rounded-lg ${reservationType === 'reserve_only' ? 'bg-olive-600 text-white' : 'bg-neutral-100 text-neutral-600'}`}>
                  <CalendarDays className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-charcoal-900">Reservasi Meja Saja</h4>
                  <p className="text-xs text-neutral-500 mt-0.5">Pesan meja sekarang, memilih makanan saat tiba di resto.</p>
                </div>
              </button>

              <button
                type="button"
                onClick={() => setReservationType('reserve_and_order')}
                className={`p-4 rounded-xl border text-left flex items-start gap-3 transition ${
                  reservationType === 'reserve_and_order'
                    ? 'border-olive-600 bg-olive-50/60 ring-2 ring-olive-600/20'
                    : 'border-neutral-200 hover:bg-neutral-50'
                }`}
              >
                <div className={`p-2 rounded-lg ${reservationType === 'reserve_and_order' ? 'bg-olive-600 text-white' : 'bg-neutral-100 text-neutral-600'}`}>
                  <Utensils className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-charcoal-900">Reserve & Pre-Order Menu</h4>
                  <p className="text-xs text-neutral-500 mt-0.5">Amankan meja sekaligus pilih hidangan lebih awal.</p>
                </div>
              </button>
            </div>
          </div>

          {/* Section: Customer Information */}
          <div className="pt-4 border-t border-neutral-100 space-y-4">
            <h3 className="text-sm font-bold text-charcoal-900 flex items-center gap-2">
              <Users className="w-4 h-4 text-olive-700" />
              <span>Data Pelanggan</span>
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-neutral-700 mb-1">
                  Nama Lengkap *
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
                  Nomor Telepon / WhatsApp *
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
            </div>

            <div>
              <label className="block text-xs font-semibold text-neutral-700 mb-1">
                Alamat Email (Opsional)
              </label>
              <input
                type="email"
                placeholder="Cth: budi@gmail.com"
                value={customerEmail}
                onChange={(e) => setCustomerEmail(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-neutral-50 border border-neutral-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-olive-600"
              />
            </div>
          </div>

          {/* Section: Reservation Schedule */}
          <div className="pt-4 border-t border-neutral-100 space-y-4">
            <h3 className="text-sm font-bold text-charcoal-900 flex items-center gap-2">
              <Clock className="w-4 h-4 text-olive-700" />
              <span>Waktu & Jumlah Tamu</span>
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-semibold text-neutral-700 mb-1">
                  Tanggal Reservasi *
                </label>
                <input
                  type="date"
                  required
                  min={new Date().toISOString().split('T')[0]}
                  value={reservationDate}
                  onChange={(e) => setReservationDate(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-neutral-50 border border-neutral-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-olive-600"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-neutral-700 mb-1">
                  Waktu Tiba *
                </label>
                <select
                  value={startTime}
                  onChange={(e) => setStartTime(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-neutral-50 border border-neutral-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-olive-600"
                >
                  <option value="11:00">11:00 WIB (Lunch)</option>
                  <option value="11:30">11:30 WIB</option>
                  <option value="12:00">12:00 WIB</option>
                  <option value="12:30">12:30 WIB</option>
                  <option value="13:00">13:00 WIB</option>
                  <option value="13:30">13:30 WIB</option>
                  <option value="17:00">17:00 WIB (Early Dinner)</option>
                  <option value="17:30">17:30 WIB</option>
                  <option value="18:00">18:00 WIB</option>
                  <option value="18:30">18:30 WIB</option>
                  <option value="19:00">19:00 WIB (Prime Dinner)</option>
                  <option value="19:30">19:30 WIB</option>
                  <option value="20:00">20:00 WIB</option>
                  <option value="20:30">20:30 WIB</option>
                  <option value="21:00">21:00 WIB</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-neutral-700 mb-1">
                  Jumlah Tamu *
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    min="1"
                    max="30"
                    required
                    value={guestCount}
                    onChange={(e) => setGuestCount(parseInt(e.target.value) || 1)}
                    className="w-full px-3.5 py-2.5 bg-neutral-50 border border-neutral-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-olive-600"
                  />
                  <span className="text-xs text-neutral-500 shrink-0">Orang</span>
                </div>
              </div>
            </div>
          </div>

          {/* Section: Table Preference */}
          <div className="pt-4 border-t border-neutral-100 space-y-4">
            <h3 className="text-sm font-bold text-charcoal-900 flex items-center gap-2">
              <MapPin className="w-4 h-4 text-olive-700" />
              <span>Preferensi Area & Meja</span>
            </h3>

            <div className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-neutral-700 mb-1">
                  Preferensi Area
                </label>
                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedArea('all')
                      setSelectedTableId('')
                    }}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
                      selectedArea === 'all'
                        ? 'bg-olive-700 text-white'
                        : 'bg-neutral-100 text-neutral-700 hover:bg-neutral-200'
                    }`}
                  >
                    Semua Area
                  </button>
                  {distinctAreas.map((area) => (
                    <button
                      key={area}
                      type="button"
                      onClick={() => {
                        setSelectedArea(area)
                        setSelectedTableId('')
                      }}
                      className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
                        selectedArea === area
                          ? 'bg-olive-700 text-white'
                          : 'bg-neutral-100 text-neutral-700 hover:bg-neutral-200'
                      }`}
                    >
                      {area}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-neutral-700 mb-1">
                  Pilih Meja Tertentu (Opsional)
                </label>
                <select
                  value={selectedTableId}
                  onChange={(e) => setSelectedTableId(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-neutral-50 border border-neutral-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-olive-600"
                >
                  <option value="">Otomatis ditentukan oleh Restoran</option>
                  {filteredTables.map((t) => (
                    <option key={t.id} value={t.id}>
                      Meja {t.table_number} — {t.area} (Kapasitas: {t.capacity} orang)
                    </option>
                  ))}
                </select>
                <p className="text-[11px] text-neutral-500 mt-1">
                  Bila tidak dipilih, tim reservasi akan memilihkan meja terbaik sesuai jumlah tamu Anda.
                </p>
              </div>
            </div>
          </div>

          {/* Section: Notes */}
          <div className="pt-4 border-t border-neutral-100">
            <label className="block text-xs font-semibold text-neutral-700 mb-1">
              Catatan Khusus (Opsional)
            </label>
            <textarea
              rows={2}
              placeholder="Cth: Mohon sediakan baby chair, perayaan ulang tahun, atau alergi kacang..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-neutral-50 border border-neutral-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-olive-600"
            />
          </div>

          {/* Submit Action */}
          <div className="pt-4 border-t border-neutral-200">
            <button
              type="submit"
              disabled={loading}
              className="w-full py-3.5 px-6 bg-olive-700 hover:bg-olive-800 text-white rounded-xl text-sm font-bold transition flex items-center justify-center gap-2 shadow-md shadow-olive-700/20 disabled:opacity-50"
            >
              {loading ? (
                <span>Memproses Reservasi...</span>
              ) : reservationType === 'reserve_and_order' ? (
                <>
                  <span>Lanjut Pilih Menu Makanan</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              ) : (
                <>
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Konfirmasi & Buat Reservasi</span>
                </>
              )}
            </button>
          </div>
        </form>

        {/* Sidebar Summary Review Card */}
        <div className="space-y-6">
          <div className="bg-cream-100/90 border border-cream-300 rounded-2xl p-6 space-y-4 shadow-sm">
            <h3 className="font-bold text-sm text-charcoal-900 uppercase tracking-wider flex items-center gap-2">
              <FileText className="w-4 h-4 text-olive-700" />
              <span>Ringkasan Reservasi</span>
            </h3>

            <div className="space-y-3 text-xs text-neutral-600">
              <div className="flex justify-between py-1.5 border-b border-cream-200">
                <span className="text-neutral-500">Tanggal:</span>
                <span className="font-bold text-charcoal-900">{reservationDate || '-'}</span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-cream-200">
                <span className="text-neutral-500">Waktu Tiba:</span>
                <span className="font-bold text-charcoal-900">{startTime} WIB</span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-cream-200">
                <span className="text-neutral-500">Estimasi Durasi:</span>
                <span className="font-bold text-charcoal-900">{settings?.default_reservation_duration || 90} Menit</span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-cream-200">
                <span className="text-neutral-500">Jumlah Tamu:</span>
                <span className="font-bold text-charcoal-900">{guestCount} Orang</span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-cream-200">
                <span className="text-neutral-500">Area / Meja:</span>
                <span className="font-bold text-charcoal-900">
                  {selectedTableId
                    ? tables.find((t) => t.id === selectedTableId)?.table_number
                    : selectedArea === 'all'
                    ? 'Fleksibel'
                    : selectedArea}
                </span>
              </div>
              <div className="flex justify-between py-1.5">
                <span className="text-neutral-500">Mode:</span>
                <span className="font-bold text-olive-800">
                  {reservationType === 'reserve_only' ? 'Meja Saja' : 'Pre-Order Makanan'}
                </span>
              </div>
            </div>

            <div className="p-3.5 bg-white/70 rounded-xl border border-cream-200 text-xs text-neutral-600 flex items-start gap-2.5">
              <Info className="w-4 h-4 text-olive-600 shrink-0 mt-0.5" />
              <span>
                Setelah konfirmasi, Anda akan menerima Kode Booking resmi dan dapat mengunduh dokumen konfirmasi PDF.
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
