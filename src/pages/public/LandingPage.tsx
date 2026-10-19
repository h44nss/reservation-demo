import React, { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import {
  CalendarDays,
  BookOpen,
  Search,
  Clock,
  MapPin,
  Phone,
  Sparkles,
  ArrowRight,
  Coffee,
  CheckCircle2,
  Users,
} from 'lucide-react'
import { restaurantService } from '@/services/restaurantService'
import { MenuItem, RestaurantSettings, MenuCategory } from '@/types/domain'
import { formatIDR } from '@/utils/formatters'
import { useCart } from '@/contexts/CartContext'
import { useToast } from '@/components/ui/Toast'

export const LandingPage: React.FC = () => {
  const navigate = useNavigate()
  const { addItem } = useCart()
  const toast = useToast()
  const [settings, setSettings] = useState<RestaurantSettings | null>(null)
  const [popularItems, setPopularItems] = useState<MenuItem[]>([])
  const [categories, setCategories] = useState<MenuCategory[]>([])
  const [trackCode, setTrackCode] = useState('')
  const [trackPhone, setTrackPhone] = useState('')

  useEffect(() => {
    restaurantService.getSettings().then(setSettings).catch(console.error)
    restaurantService.getCategories().then(setCategories).catch(console.error)
    restaurantService.getMenuItems().then((items) => {
      // Pick top 6 items as featured
      setPopularItems(items.slice(0, 6))
    }).catch(console.error)
  }, [])

  const handleTrackSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!trackCode) return
    navigate(`/track-order?code=${encodeURIComponent(trackCode.trim())}&phone=${encodeURIComponent(trackPhone.trim())}`)
  }

  const handleAddToCart = (item: MenuItem) => {
    if (!item.is_available) {
      toast.error('Menu ini sedang habis.')
      return
    }
    addItem(item, 1)
    toast.success(`${item.name} berhasil ditambahkan ke keranjang!`)
  }

  return (
    <div className="space-y-20 pb-20">
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-charcoal-950 text-white min-h-[580px] flex items-center">
        {/* Background Overlay Image */}
        <div className="absolute inset-0 z-0 opacity-35 scale-105 transform hover:scale-100 transition-transform duration-1000">
          <img
            src="https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&w=1800&q=80"
            alt="KKO Resto Ambience"
            className="w-full h-full object-cover"
          />
        </div>
        <div className="absolute inset-0 bg-gradient-to-r from-charcoal-950 via-charcoal-950/80 to-transparent z-10" />

        <div className="relative z-20 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 lg:py-28">
          <div className="max-w-2xl space-y-6">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-olive-900/80 border border-olive-500/40 text-olive-300 text-xs font-bold tracking-wide uppercase">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Sistem Reservasi & Pemesanan Terintegrasi</span>
            </div>

            <h1 className="font-serif text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight text-white leading-tight">
              Cita Rasa Nusantara Dalam Sentuhan Modern.
            </h1>

            <p className="text-base sm:text-lg text-neutral-300 leading-relaxed">
              Nikmati hidangan khas warisan Nusantara dengan kualitas bahan premium, racikan kopi artisan, dan reservasi meja instan tanpa repot antre.
            </p>

            <div className="flex flex-wrap items-center gap-4 pt-2">
              <Link
                to="/reservation"
                className="inline-flex items-center gap-2.5 px-6 py-3.5 bg-olive-600 hover:bg-olive-700 text-white rounded-xl text-base font-bold transition shadow-lg shadow-olive-900/40"
              >
                <CalendarDays className="w-5 h-5" />
                <span>Book a Table</span>
              </Link>

              <Link
                to="/order"
                className="inline-flex items-center gap-2.5 px-6 py-3.5 bg-white/10 hover:bg-white/20 text-white backdrop-blur-md border border-white/20 rounded-xl text-base font-bold transition"
              >
                <BookOpen className="w-5 h-5" />
                <span>Lihat Menu & Order</span>
              </Link>
            </div>

            {/* Quick highlights */}
            <div className="pt-6 grid grid-cols-3 gap-4 border-t border-white/10 text-xs text-neutral-400">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-olive-400 shrink-0" />
                <span>Konfirmasi Instan</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-olive-400 shrink-0" />
                <span>Pembayaran Aman</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-olive-400 shrink-0" />
                <span>Kitchen Terkoneksi</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Info & Operational Bar */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 -mt-12 relative z-30">
        <div className="bg-white rounded-2xl shadow-xl border border-neutral-200/80 p-6 grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-olive-50 flex items-center justify-center text-olive-700 shrink-0">
              <Clock className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-xs font-bold uppercase tracking-wider text-neutral-500">Jam Operasional</h3>
              <p className="text-sm font-bold text-charcoal-900 mt-0.5">10:00 - 22:00 WIB (Buka Setiap Hari)</p>
              <p className="text-xs text-neutral-500">Weekend buka lebih awal pk 09:00</p>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-olive-50 flex items-center justify-center text-olive-700 shrink-0">
              <MapPin className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-xs font-bold uppercase tracking-wider text-neutral-500">Alamat Restoran</h3>
              <p className="text-sm font-bold text-charcoal-900 mt-0.5">Jl. Senopati No. 88, Jaksel</p>
              <p className="text-xs text-neutral-500">{settings?.address || 'Kebayoran Baru, Jakarta Selatan'}</p>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-olive-50 flex items-center justify-center text-olive-700 shrink-0">
              <Phone className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-xs font-bold uppercase tracking-wider text-neutral-500">Hotline & RSVP</h3>
              <p className="text-sm font-bold text-charcoal-900 mt-0.5">{settings?.phone || '+62 812-3456-7890'}</p>
              <p className="text-xs text-neutral-500">Layanan pelanggan & konsultasi acara</p>
            </div>
          </div>
        </div>
      </section>

      {/* Quick Booking Tracking Search Widget */}
      <section className="max-w-4xl mx-auto px-4 sm:px-6">
        <div className="bg-gradient-to-br from-cream-100 to-cream-200 border border-cream-300 rounded-2xl p-6 sm:p-8 shadow-sm">
          <div className="text-center max-w-lg mx-auto mb-6">
            <h2 className="text-xl sm:text-2xl font-bold font-serif text-charcoal-900">
              Sudah Memiliki Kode Booking atau Pesanan?
            </h2>
            <p className="text-xs sm:text-sm text-neutral-600 mt-1">
              Masukkan kode booking Anda dan nomor telepon untuk memantau status meja, masakan di kitchen, dan rincian tagihan.
            </p>
          </div>

          <form onSubmit={handleTrackSubmit} className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-neutral-400 absolute left-3.5 top-3.5" />
              <input
                type="text"
                placeholder="Kode Booking (cth: BK-20261019-A8F2)"
                value={trackCode}
                onChange={(e) => setTrackCode(e.target.value)}
                required
                className="w-full pl-10 pr-4 py-3 bg-white border border-neutral-300 rounded-xl text-sm font-medium text-charcoal-900 focus:outline-none focus:ring-2 focus:ring-olive-600"
              />
            </div>
            <div className="flex-1">
              <input
                type="text"
                placeholder="No. Telepon / Token Akses"
                value={trackPhone}
                onChange={(e) => setTrackPhone(e.target.value)}
                className="w-full px-4 py-3 bg-white border border-neutral-300 rounded-xl text-sm font-medium text-charcoal-900 focus:outline-none focus:ring-2 focus:ring-olive-600"
              />
            </div>
            <button
              type="submit"
              className="px-6 py-3 bg-olive-700 hover:bg-olive-800 text-white rounded-xl text-sm font-bold transition flex items-center justify-center gap-2 shadow-sm"
            >
              <span>Lacak Sekarang</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>
        </div>
      </section>

      {/* Popular Menu Showcase */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between mb-8 gap-4">
          <div>
            <div className="text-xs font-bold uppercase tracking-wider text-olive-700 mb-1">
              Menu Rekomendasi Chef
            </div>
            <h2 className="font-serif text-3xl font-bold text-charcoal-900">
              Pilihan Favorit Pelanggan
            </h2>
          </div>
          <Link
            to="/order"
            className="inline-flex items-center gap-1.5 text-sm font-bold text-olive-800 hover:text-olive-900"
          >
            <span>Lihat Semua Menu</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>

        {/* Categories Pills */}
        <div className="flex items-center gap-2 overflow-x-auto pb-4 mb-6 text-xs font-semibold">
          <Link
            to="/order"
            className="px-4 py-2 rounded-xl bg-olive-700 text-white shrink-0 shadow-sm"
          >
            Semua Kategori
          </Link>
          {categories.map((cat) => (
            <Link
              key={cat.id}
              to={`/order?cat=${cat.id}`}
              className="px-4 py-2 rounded-xl bg-white border border-neutral-200 text-neutral-700 hover:bg-neutral-50 shrink-0 transition"
            >
              {cat.name}
            </Link>
          ))}
        </div>

        {/* Menu Cards Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {popularItems.map((item) => (
            <div
              key={item.id}
              className="bg-white rounded-2xl border border-neutral-200/90 overflow-hidden shadow-subtle hover:shadow-elevated transition duration-300 flex flex-col group"
            >
              <div className="relative h-48 overflow-hidden bg-neutral-100">
                <img
                  src={item.image_url || 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c'}
                  alt={item.name}
                  className="w-full h-full object-cover group-hover:scale-105 transition duration-500"
                />
                {!item.is_available && (
                  <div className="absolute inset-0 bg-black/60 backdrop-blur-[2px] flex items-center justify-center">
                    <span className="bg-rose-600 text-white font-bold text-xs uppercase px-3 py-1 rounded-full">
                      Sedang Habis
                    </span>
                  </div>
                )}
              </div>

              <div className="p-5 flex-1 flex flex-col justify-between space-y-4">
                <div>
                  <h3 className="font-bold text-base text-charcoal-900 group-hover:text-olive-800 transition">
                    {item.name}
                  </h3>
                  <p className="text-xs text-neutral-500 line-clamp-2 mt-1 leading-relaxed">
                    {item.description}
                  </p>
                </div>

                <div className="flex items-center justify-between pt-2 border-t border-neutral-100">
                  <span className="text-base font-extrabold text-charcoal-900">
                    {formatIDR(item.price)}
                  </span>
                  <button
                    onClick={() => handleAddToCart(item)}
                    disabled={!item.is_available}
                    className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 ${
                      item.is_available
                        ? 'bg-olive-50 text-olive-800 border border-olive-200 hover:bg-olive-700 hover:text-white'
                        : 'bg-neutral-100 text-neutral-400 cursor-not-allowed'
                    }`}
                  >
                    <span>+ Tambah</span>
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Restaurant Service Features */}
      <section className="bg-white py-16 border-y border-neutral-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-12">
            <span className="text-xs font-bold uppercase tracking-wider text-olive-700 block mb-1">
              Keunggulan Layanan Kami
            </span>
            <h2 className="font-serif text-3xl font-bold text-charcoal-900">
              Pengalaman Bersantap Lebih Cepat & Terstruktur
            </h2>
            <p className="text-sm text-neutral-500 mt-2">
              Menggantikan proses manual pesan via chat menjadi sistem reservasi, kasir, dan dapur otomatis tanpa miskomunikasi.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div className="p-6 rounded-2xl bg-cream-50 border border-cream-200 space-y-3">
              <div className="w-12 h-12 rounded-xl bg-olive-700 text-white flex items-center justify-center">
                <CalendarDays className="w-6 h-6" />
              </div>
              <h3 className="font-bold text-base text-charcoal-900">Reservasi Meja Instan</h3>
              <p className="text-xs text-neutral-600 leading-relaxed">
                Pilih tanggal, jam, preferensi area (Indoor AC / Garden / VIP), dan jumlah tamu dengan kapasitas terverifikasi.
              </p>
            </div>

            <div className="p-6 rounded-2xl bg-cream-50 border border-cream-200 space-y-3">
              <div className="w-12 h-12 rounded-xl bg-olive-700 text-white flex items-center justify-center">
                <BookOpen className="w-6 h-6" />
              </div>
              <h3 className="font-bold text-base text-charcoal-900">Pre-Order Hidangan</h3>
              <p className="text-xs text-neutral-600 leading-relaxed">
                Pesan menu favorit Anda langsung saat reservasi sehingga makanan siap disajikan tepat waktu begitu tiba.
              </p>
            </div>

            <div className="p-6 rounded-2xl bg-cream-50 border border-cream-200 space-y-3">
              <div className="w-12 h-12 rounded-xl bg-olive-700 text-white flex items-center justify-center">
                <Coffee className="w-6 h-6" />
              </div>
              <h3 className="font-bold text-base text-charcoal-900">Dapur Terintegrasi (KDS)</h3>
              <p className="text-xs text-neutral-600 leading-relaxed">
                Pesanan langsung masuk ke layar Kitchen Display System untuk dimasak tanpa risiko kertas tiket hilang.
              </p>
            </div>

            <div className="p-6 rounded-2xl bg-cream-50 border border-cream-200 space-y-3">
              <div className="w-12 h-12 rounded-xl bg-olive-700 text-white flex items-center justify-center">
                <Users className="w-6 h-6" />
              </div>
              <h3 className="font-bold text-base text-charcoal-900">Kasir POS & Struk Resmi</h3>
              <p className="text-xs text-neutral-600 leading-relaxed">
                Cetak konfirmasi PDF, bill rincian pajak & service, serta nota lunas format thermal standar kasir restoran.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Bottom Banner */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-olive-800 rounded-3xl p-8 sm:p-12 text-white flex flex-col md:flex-row items-center justify-between gap-8 shadow-xl">
          <div className="space-y-3 max-w-xl text-center md:text-left">
            <h2 className="font-serif text-2xl sm:text-3xl font-bold">
              Siap Menikmati Hidangan Istimewa Hari Ini?
            </h2>
            <p className="text-olive-200 text-sm">
              Amankan meja Anda sekarang atau pesan hidangan untuk dinikmati bersama keluarga dan rekan kerja.
            </p>
          </div>
          <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto">
            <Link
              to="/reservation"
              className="px-6 py-3.5 bg-white text-olive-900 hover:bg-cream-100 rounded-xl text-sm font-bold transition text-center shadow-md"
            >
              Reservasi Meja
            </Link>
            <Link
              to="/order"
              className="px-6 py-3.5 bg-olive-900/60 hover:bg-olive-900 border border-olive-600 text-white rounded-xl text-sm font-bold transition text-center"
            >
              Lihat Menu Lengkap
            </Link>
          </div>
        </div>
      </section>
    </div>
  )
}
