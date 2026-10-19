import React, { useState, useEffect } from 'react'
import { useSearchParams, Link } from 'react-router-dom'
import {
  Search,
  Plus,
  Minus,
  ShoppingBag,
  ArrowRight,
  Filter,
  Check,
  CalendarCheck,
} from 'lucide-react'
import { restaurantService } from '@/services/restaurantService'
import { MenuItem, MenuCategory } from '@/types/domain'
import { formatIDR } from '@/utils/formatters'
import { useCart } from '@/contexts/CartContext'
import { useToast } from '@/components/ui/Toast'

export const MenuPage: React.FC = () => {
  const [searchParams] = useSearchParams()
  const { items: cartItems, addItem, updateQuantity, itemCount, grandTotal } = useCart()
  const toast = useToast()

  const [categories, setCategories] = useState<MenuCategory[]>([])
  const [menuItems, setMenuItems] = useState<MenuItem[]>([])
  const [selectedCategory, setSelectedCategory] = useState<string>('all')
  const [searchQuery, setSearchQuery] = useState('')
  const [loading, setLoading] = useState(true)

  // Check if user came from a pending reservation
  const pendingReservationStr = sessionStorage.getItem('kko_pending_reservation')
  const pendingReservation = pendingReservationStr ? JSON.parse(pendingReservationStr) : null

  useEffect(() => {
    const initialCat = searchParams.get('cat')
    if (initialCat) setSelectedCategory(initialCat)

    Promise.all([restaurantService.getCategories(), restaurantService.getMenuItems()])
      .then(([cats, items]) => {
        setCategories(cats)
        setMenuItems(items)
      })
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [searchParams])

  const filteredItems = menuItems.filter((item) => {
    if (selectedCategory !== 'all' && item.category_id !== selectedCategory) {
      return false
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase()
      return item.name.toLowerCase().includes(q) || (item.description && item.description.toLowerCase().includes(q))
    }
    return true
  })

  const handleAddToCart = (item: MenuItem) => {
    if (!item.is_available) {
      toast.error('Menu ini sedang habis.')
      return
    }
    addItem(item, 1)
    toast.success(`${item.name} ditambahkan ke keranjang!`)
  }

  const getItemCartQuantity = (itemId: string) => {
    const found = cartItems.find((i) => i.menuItem.id === itemId)
    return found ? found.quantity : 0
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8 pb-32">
      {/* Header Banner */}
      <div className="space-y-3">
        {pendingReservation && (
          <div className="bg-olive-50 border border-olive-200 rounded-2xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs text-olive-900">
            <div className="flex items-center gap-2">
              <CalendarCheck className="w-5 h-5 text-olive-700 shrink-0" />
              <span>
                Pre-Order untuk Reservasi: <strong className="font-bold">{pendingReservation.customer_name}</strong> ({pendingReservation.guest_count} tamu, {pendingReservation.reservation_date} pk {pendingReservation.start_time.slice(0, 5)})
              </span>
            </div>
            <Link
              to="/checkout"
              className="px-3.5 py-1.5 bg-olive-700 hover:bg-olive-800 text-white rounded-lg font-bold transition shrink-0"
            >
              Langsung Checkout ({itemCount} item)
            </Link>
          </div>
        )}

        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div>
            <h1 className="font-serif text-3xl sm:text-4xl font-bold text-charcoal-900">
              Daftar Menu Restoran
            </h1>
            <p className="text-sm text-neutral-500 mt-1">
              Pilihan hidangan Nusantara istimewa, kopi single origin, dan camilan penutup.
            </p>
          </div>

          {/* Search Box */}
          <div className="relative w-full md:w-80">
            <Search className="w-4 h-4 text-neutral-400 absolute left-3.5 top-3.5" />
            <input
              type="text"
              placeholder="Cari makanan atau minuman..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-white border border-neutral-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-olive-600"
            />
          </div>
        </div>
      </div>

      {/* Category Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2 border-b border-neutral-200 text-xs font-semibold">
        <button
          onClick={() => setSelectedCategory('all')}
          className={`px-4 py-2.5 rounded-xl shrink-0 transition flex items-center gap-1.5 ${
            selectedCategory === 'all'
              ? 'bg-olive-700 text-white shadow-sm'
              : 'bg-white border border-neutral-200 text-neutral-700 hover:bg-neutral-50'
          }`}
        >
          <Filter className="w-3.5 h-3.5" />
          <span>Semua Menu</span>
        </button>
        {categories.map((cat) => (
          <button
            key={cat.id}
            onClick={() => setSelectedCategory(cat.id)}
            className={`px-4 py-2.5 rounded-xl shrink-0 transition ${
              selectedCategory === cat.id
                ? 'bg-olive-700 text-white shadow-sm'
                : 'bg-white border border-neutral-200 text-neutral-700 hover:bg-neutral-50'
            }`}
          >
            {cat.name}
          </button>
        ))}
      </div>

      {/* Menu Grid */}
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3, 4, 5, 6].map((n) => (
            <div key={n} className="h-72 rounded-2xl bg-neutral-200 animate-pulse" />
          ))}
        </div>
      ) : filteredItems.length === 0 ? (
        <div className="text-center py-20 bg-white rounded-2xl border border-neutral-200">
          <p className="text-base font-semibold text-charcoal-800">Tidak ada menu yang sesuai.</p>
          <p className="text-xs text-neutral-500 mt-1">Coba gunakan kata kunci lain atau pilih kategori berbeda.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredItems.map((item) => {
            const inCartQty = getItemCartQuantity(item.id)
            return (
              <div
                key={item.id}
                className="bg-white rounded-2xl border border-neutral-200/90 overflow-hidden shadow-subtle hover:shadow-elevated transition duration-300 flex flex-col group"
              >
                {/* Photo & Availability badge */}
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
                  {inCartQty > 0 && (
                    <div className="absolute top-3 right-3 bg-olive-700 text-white font-bold text-xs px-2.5 py-1 rounded-full shadow-md flex items-center gap-1">
                      <Check className="w-3.5 h-3.5" />
                      <span>{inCartQty} di Keranjang</span>
                    </div>
                  )}
                </div>

                {/* Content */}
                <div className="p-5 flex-1 flex flex-col justify-between space-y-4">
                  <div>
                    <h3 className="font-bold text-base text-charcoal-900 group-hover:text-olive-800 transition">
                      {item.name}
                    </h3>
                    <p className="text-xs text-neutral-500 line-clamp-2 mt-1 leading-relaxed">
                      {item.description}
                    </p>
                  </div>

                  <div className="flex items-center justify-between pt-3 border-t border-neutral-100">
                    <div>
                      <span className="text-[11px] text-neutral-500 block">Harga</span>
                      <span className="text-base font-extrabold text-charcoal-900">
                        {formatIDR(item.price)}
                      </span>
                    </div>

                    {inCartQty > 0 ? (
                      <div className="flex items-center gap-2 bg-neutral-100 p-1 rounded-xl border border-neutral-200">
                        <button
                          onClick={() => updateQuantity(item.id, inCartQty - 1)}
                          className="w-7 h-7 rounded-lg bg-white border border-neutral-300 flex items-center justify-center text-neutral-700 hover:bg-neutral-50"
                        >
                          <Minus className="w-3 h-3" />
                        </button>
                        <span className="w-6 text-center text-xs font-bold text-charcoal-900">
                          {inCartQty}
                        </span>
                        <button
                          onClick={() => updateQuantity(item.id, inCartQty + 1)}
                          className="w-7 h-7 rounded-lg bg-olive-700 text-white flex items-center justify-center hover:bg-olive-800"
                        >
                          <Plus className="w-3 h-3" />
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={() => handleAddToCart(item)}
                        disabled={!item.is_available}
                        className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 shadow-sm ${
                          item.is_available
                            ? 'bg-olive-700 hover:bg-olive-800 text-white'
                            : 'bg-neutral-100 text-neutral-400 cursor-not-allowed'
                        }`}
                      >
                        <Plus className="w-3.5 h-3.5" />
                        <span>Pesan</span>
                      </button>
                    )}
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Floating Bottom Cart Bar (Sticky when items exist) */}
      {itemCount > 0 && (
        <div className="fixed bottom-6 inset-x-4 max-w-xl mx-auto z-40 bg-charcoal-950 text-white rounded-2xl p-4 shadow-2xl border border-charcoal-800 flex items-center justify-between animate-slide-up">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-olive-600 flex items-center justify-center text-white shrink-0">
              <ShoppingBag className="w-5 h-5" />
            </div>
            <div>
              <div className="text-xs text-neutral-400">{itemCount} Menu Dipilih</div>
              <div className="text-sm font-extrabold text-white">{formatIDR(grandTotal)}</div>
            </div>
          </div>

          <Link
            to="/checkout"
            className="flex items-center gap-2 px-5 py-2.5 bg-olive-600 hover:bg-olive-700 text-white rounded-xl text-xs font-bold transition shadow-md"
          >
            <span>Lanjut Checkout</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      )}
    </div>
  )
}
