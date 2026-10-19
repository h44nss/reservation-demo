import React, { useState, useEffect } from 'react'
import {
  Settings,
  Save,
  Building2,
  Clock,
  Percent,
  CheckCircle2,
  Shield,
  HelpCircle,
} from 'lucide-react'
import { restaurantService } from '@/services/restaurantService'
import { RestaurantSettings } from '@/types/domain'
import { useToast } from '@/components/ui/Toast'

export const SettingsPage: React.FC = () => {
  const toast = useToast()
  const [settings, setSettings] = useState<RestaurantSettings | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  // Form State
  const [restaurantName, setRestaurantName] = useState('')
  const [address, setAddress] = useState('')
  const [phone, setPhone] = useState('')
  const [logoUrl, setLogoUrl] = useState('')
  const [taxEnabled, setTaxEnabled] = useState(true)
  const [taxRate, setTaxRate] = useState<number>(10)
  const [serviceChargeEnabled, setServiceChargeEnabled] = useState(true)
  const [serviceChargeRate, setServiceChargeRate] = useState<number>(5)
  const [duration, setDuration] = useState<number>(90)
  const [autoConfirm, setAutoConfirm] = useState(false)

  useEffect(() => {
    restaurantService.getSettings().then((s) => {
      setSettings(s)
      setRestaurantName(s.restaurant_name)
      setAddress(s.address)
      setPhone(s.phone)
      setLogoUrl(s.logo_url || '')
      setTaxEnabled(s.tax_enabled)
      setTaxRate(Number(s.tax_rate))
      setServiceChargeEnabled(s.service_charge_enabled)
      setServiceChargeRate(Number(s.service_charge_rate))
      setDuration(s.default_reservation_duration)
      setAutoConfirm(s.auto_confirm_reservations)
      setLoading(false)
    }).catch(console.error)
  }, [])

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      setSaving(true)
      await restaurantService.updateSettings({
        restaurant_name: restaurantName.trim(),
        address: address.trim(),
        phone: phone.trim(),
        logo_url: logoUrl.trim() || null,
        tax_enabled: taxEnabled,
        tax_rate: taxRate,
        service_charge_enabled: serviceChargeEnabled,
        service_charge_rate: serviceChargeRate,
        default_reservation_duration: duration,
        auto_confirm_reservations: autoConfirm,
      })
      toast.success('Pengaturan restoran berhasil disimpan dan diperbarui!')
    } catch (err: any) {
      toast.error(err.message || 'Gagal menyimpan pengaturan.')
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-[400px] flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-olive-700"></div>
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold font-serif text-charcoal-900">
          Pengaturan Restoran & Bisnis
        </h1>
        <p className="text-xs text-neutral-500 mt-1">
          Atur informasi kontak, durasi reservasi default, persentase pajak & service charge, dan kebijakan konfirmasi otomatis.
        </p>
      </div>

      <form onSubmit={handleSave} className="space-y-6">
        {/* Restaurant Profile */}
        <div className="bg-white rounded-2xl border border-neutral-200/90 p-6 space-y-4 shadow-subtle text-xs">
          <h3 className="font-bold text-sm text-charcoal-900 flex items-center gap-2 pb-3 border-b border-neutral-100">
            <Building2 className="w-4 h-4 text-olive-700" />
            <span>Identitas & Kontak Restoran</span>
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block font-semibold text-neutral-700 mb-1">Nama Restoran *</label>
              <input
                type="text"
                required
                value={restaurantName}
                onChange={(e) => setRestaurantName(e.target.value)}
                className="w-full px-3.5 py-2 bg-neutral-50 border border-neutral-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-olive-600 text-xs"
              />
            </div>

            <div>
              <label className="block font-semibold text-neutral-700 mb-1">Nomor Telepon / RSVP *</label>
              <input
                type="text"
                required
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="w-full px-3.5 py-2 bg-neutral-50 border border-neutral-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-olive-600 text-xs"
              />
            </div>
          </div>

          <div>
            <label className="block font-semibold text-neutral-700 mb-1">Alamat Lengkap *</label>
            <input
              type="text"
              required
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              className="w-full px-3.5 py-2 bg-neutral-50 border border-neutral-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-olive-600 text-xs"
            />
          </div>

          <div>
            <label className="block font-semibold text-neutral-700 mb-1">URL Logo (Opsional)</label>
            <input
              type="url"
              value={logoUrl}
              onChange={(e) => setLogoUrl(e.target.value)}
              className="w-full px-3.5 py-2 bg-neutral-50 border border-neutral-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-olive-600 text-xs"
            />
          </div>
        </div>

        {/* Taxes & Charges */}
        <div className="bg-white rounded-2xl border border-neutral-200/90 p-6 space-y-4 shadow-subtle text-xs">
          <h3 className="font-bold text-sm text-charcoal-900 flex items-center gap-2 pb-3 border-b border-neutral-100">
            <Percent className="w-4 h-4 text-olive-700" />
            <span>Pajak & Service Charge Transaksi</span>
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            {/* Tax */}
            <div className="p-4 rounded-xl bg-neutral-50 border border-neutral-200 space-y-3">
              <div className="flex items-center justify-between">
                <span className="font-bold text-charcoal-900">Pajak Restoran (PB1)</span>
                <input
                  type="checkbox"
                  checked={taxEnabled}
                  onChange={(e) => setTaxEnabled(e.target.checked)}
                  className="rounded text-olive-700 focus:ring-olive-600 h-4 w-4"
                />
              </div>
              <div>
                <label className="block font-semibold text-neutral-600 mb-1">Tarif Pajak (%)</label>
                <input
                  type="number"
                  min="0"
                  max="50"
                  step="0.5"
                  disabled={!taxEnabled}
                  value={taxRate}
                  onChange={(e) => setTaxRate(parseFloat(e.target.value) || 0)}
                  className="w-full px-3 py-1.5 bg-white border border-neutral-300 rounded-lg text-xs font-bold disabled:bg-neutral-100"
                />
              </div>
            </div>

            {/* Service Charge */}
            <div className="p-4 rounded-xl bg-neutral-50 border border-neutral-200 space-y-3">
              <div className="flex items-center justify-between">
                <span className="font-bold text-charcoal-900">Service Charge</span>
                <input
                  type="checkbox"
                  checked={serviceChargeEnabled}
                  onChange={(e) => setServiceChargeEnabled(e.target.checked)}
                  className="rounded text-olive-700 focus:ring-olive-600 h-4 w-4"
                />
              </div>
              <div>
                <label className="block font-semibold text-neutral-600 mb-1">Tarif Service Charge (%)</label>
                <input
                  type="number"
                  min="0"
                  max="50"
                  step="0.5"
                  disabled={!serviceChargeEnabled}
                  value={serviceChargeRate}
                  onChange={(e) => setServiceChargeRate(parseFloat(e.target.value) || 0)}
                  className="w-full px-3 py-1.5 bg-white border border-neutral-300 rounded-lg text-xs font-bold disabled:bg-neutral-100"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Reservation Rules */}
        <div className="bg-white rounded-2xl border border-neutral-200/90 p-6 space-y-4 shadow-subtle text-xs">
          <h3 className="font-bold text-sm text-charcoal-900 flex items-center gap-2 pb-3 border-b border-neutral-100">
            <Clock className="w-4 h-4 text-olive-700" />
            <span>Kebijakan Reservasi Meja</span>
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block font-semibold text-neutral-700 mb-1">
                Durasi Default Reservasi (Menit)
              </label>
              <input
                type="number"
                min="30"
                max="360"
                step="15"
                value={duration}
                onChange={(e) => setDuration(parseInt(e.target.value) || 90)}
                className="w-full px-3.5 py-2 bg-neutral-50 border border-neutral-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-olive-600 text-xs"
              />
              <span className="text-[11px] text-neutral-500 mt-1 block">
                Digunakan untuk menghitung slot akhir meja & pencegahan double booking.
              </span>
            </div>

            <div className="flex flex-col justify-center space-y-2 p-3 bg-neutral-50 rounded-xl border border-neutral-200">
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="autoConfirmCheck"
                  checked={autoConfirm}
                  onChange={(e) => setAutoConfirm(e.target.checked)}
                  className="rounded text-olive-700 focus:ring-olive-600 h-4 w-4"
                />
                <label htmlFor="autoConfirmCheck" className="font-bold text-charcoal-900 cursor-pointer">
                  Konfirmasi Otomatis (Auto-Confirm)
                </label>
              </div>
              <span className="text-[11px] text-neutral-500">
                Jika diaktifkan, reservasi baru langsung berstatus <strong>Confirmed</strong> tanpa menunggu persetujuan admin manual.
              </span>
            </div>
          </div>
        </div>

        {/* Save Button */}
        <div className="flex justify-end pt-2">
          <button
            type="submit"
            disabled={saving}
            className="px-6 py-2.5 bg-olive-700 hover:bg-olive-800 text-white rounded-xl text-xs font-bold transition flex items-center gap-2 shadow-md shadow-olive-700/20 disabled:opacity-50"
          >
            <Save className="w-4 h-4" />
            <span>{saving ? 'Menyimpan...' : 'Simpan Semua Pengaturan'}</span>
          </button>
        </div>
      </form>
    </div>
  )
}
