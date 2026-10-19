import React, { useState, useEffect } from 'react'
import {
  UtensilsCrossed,
  Plus,
  Search,
  Edit,
  Trash2,
  CheckCircle2,
  XCircle,
  X,
  Layers,
  Image as ImageIcon,
} from 'lucide-react'
import { restaurantService } from '@/services/restaurantService'
import { MenuItem, MenuCategory } from '@/types/domain'
import { formatIDR } from '@/utils/formatters'
import { useToast } from '@/components/ui/Toast'

export const MenuManagementPage: React.FC = () => {
  const toast = useToast()
  const [menuItems, setMenuItems] = useState<MenuItem[]>([])
  const [categories, setCategories] = useState<MenuCategory[]>([])
  const [loading, setLoading] = useState(true)

  // Filters
  const [searchQuery, setSearchQuery] = useState('')
  const [categoryFilter, setCategoryFilter] = useState('all')

  // Item Modal (Add / Edit)
  const [isItemModalOpen, setIsItemModalOpen] = useState(false)
  const [editingItem, setEditingItem] = useState<MenuItem | null>(null)
  const [itemName, setItemName] = useState('')
  const [itemCategory, setItemCategory] = useState('')
  const [itemPrice, setItemPrice] = useState<number>(50000)
  const [itemDesc, setItemDesc] = useState('')
  const [itemImage, setItemImage] = useState('')
  const [itemAvailable, setItemAvailable] = useState(true)

  // Category Modal
  const [isCatModalOpen, setIsCatModalOpen] = useState(false)
  const [catName, setCatName] = useState('')
  const [catDesc, setCatDesc] = useState('')

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    try {
      setLoading(true)
      const [items, cats] = await Promise.all([
        restaurantService.getMenuItems(true), // include inactive
        restaurantService.getCategories(),
      ])
      setMenuItems(items)
      setCategories(cats)
      if (cats.length > 0 && !itemCategory) {
        setItemCategory(cats[0].id)
      }
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const openAddItemModal = () => {
    setEditingItem(null)
    setItemName('')
    setItemCategory(categories[0]?.id || '')
    setItemPrice(50000)
    setItemDesc('')
    setItemImage('https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=600&q=80')
    setItemAvailable(true)
    setIsItemModalOpen(true)
  }

  const openEditItemModal = (item: MenuItem) => {
    setEditingItem(item)
    setItemName(item.name)
    setItemCategory(item.category_id)
    setItemPrice(Number(item.price))
    setItemDesc(item.description || '')
    setItemImage(item.image_url || '')
    setItemAvailable(item.is_available)
    setIsItemModalOpen(true)
  }

  const handleSaveItem = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!itemName.trim() || itemPrice < 0) return

    try {
      if (editingItem) {
        await restaurantService.updateMenuItem(editingItem.id, {
          name: itemName.trim(),
          category_id: itemCategory,
          price: itemPrice,
          description: itemDesc.trim() || null,
          image_url: itemImage.trim() || null,
          is_available: itemAvailable,
        })
        toast.success(`Menu "${itemName}" berhasil diperbarui!`)
      } else {
        await restaurantService.createMenuItem({
          name: itemName.trim(),
          category_id: itemCategory,
          price: itemPrice,
          description: itemDesc.trim() || null,
          image_url: itemImage.trim() || null,
          is_available: itemAvailable,
          is_active: true,
        })
        toast.success(`Menu "${itemName}" berhasil ditambahkan!`)
      }
      setIsItemModalOpen(false)
      loadData()
    } catch (err: any) {
      toast.error(err.message || 'Gagal menyimpan menu.')
    }
  }

  const handleToggleAvailability = async (item: MenuItem) => {
    try {
      await restaurantService.updateMenuItem(item.id, { is_available: !item.is_available })
      toast.success(`Status ${item.name} diubah menjadi: ${!item.is_available ? 'Tersedia' : 'Habis'}`)
      loadData()
    } catch (err: any) {
      toast.error(err.message || 'Gagal mengubah ketersediaan.')
    }
  }

  const handleSoftDelete = async (item: MenuItem) => {
    if (!confirm(`Non-aktifkan menu "${item.name}"? Data riwayat transaksi lama akan tetap aman.`)) return
    try {
      await restaurantService.deleteMenuItem(item.id)
      toast.success(`Menu "${item.name}" dinonaktifkan (soft delete).`)
      loadData()
    } catch (err: any) {
      toast.error(err.message || 'Gagal menonaktifkan menu.')
    }
  }

  const handleCreateCategory = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!catName.trim()) return
    try {
      await restaurantService.createCategory({
        name: catName.trim(),
        description: catDesc.trim() || null,
        sort_order: categories.length + 1,
      })
      toast.success(`Kategori "${catName}" berhasil dibuat!`)
      setCatName('')
      setCatDesc('')
      setIsCatModalOpen(false)
      loadData()
    } catch (err: any) {
      toast.error(err.message || 'Gagal membuat kategori.')
    }
  }

  const filtered = menuItems.filter((i) => {
    if (!i.is_active) return false
    if (categoryFilter !== 'all' && i.category_id !== categoryFilter) return false
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase()
      return i.name.toLowerCase().includes(q) || (i.description && i.description.toLowerCase().includes(q))
    }
    return true
  })

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold font-serif text-charcoal-900">
            Manajemen Menu & Kategori
          </h1>
          <p className="text-xs text-neutral-500 mt-1">
            Kelola daftar menu makanan, harga, status ketersediaan (In Stock / Out of Stock), dan kategori hidangan.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsCatModalOpen(true)}
            className="px-3.5 py-2 border border-neutral-300 text-neutral-700 hover:bg-neutral-50 rounded-xl text-xs font-bold transition flex items-center gap-1.5"
          >
            <Layers className="w-4 h-4 text-neutral-500" />
            <span>+ Kategori Baru</span>
          </button>

          <button
            onClick={openAddItemModal}
            className="px-4 py-2 bg-olive-700 hover:bg-olive-800 text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 shadow-sm"
          >
            <Plus className="w-4 h-4" />
            <span>Tambah Menu</span>
          </button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-2xl border border-neutral-200/90 shadow-subtle flex flex-col md:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-neutral-400 absolute left-3.5 top-3" />
          <input
            type="text"
            placeholder="Cari nama menu..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-neutral-50 border border-neutral-300 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-olive-600"
          />
        </div>

        <select
          value={categoryFilter}
          onChange={(e) => setCategoryFilter(e.target.value)}
          className="px-3 py-2 bg-neutral-50 border border-neutral-300 rounded-xl text-xs font-medium focus:outline-none focus:ring-2 focus:ring-olive-600"
        >
          <option value="all">Semua Kategori</option>
          {categories.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </select>
      </div>

      {/* Menu Items Table */}
      <div className="bg-white rounded-2xl border border-neutral-200/90 shadow-subtle overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-neutral-50 text-neutral-500 font-bold uppercase tracking-wider border-b border-neutral-200">
              <tr>
                <th className="py-3.5 px-4">Menu</th>
                <th className="py-3.5 px-4">Kategori</th>
                <th className="py-3.5 px-4">Harga</th>
                <th className="py-3.5 px-4">Ketersediaan</th>
                <th className="py-3.5 px-4 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-100">
              {loading ? (
                <tr>
                  <td colSpan={5} className="py-12 text-center text-neutral-400">
                    Memuat menu...
                  </td>
                </tr>
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-12 text-center text-neutral-400">
                    Tidak ada menu ditemukan.
                  </td>
                </tr>
              ) : (
                filtered.map((item) => {
                  const cat = categories.find((c) => c.id === item.category_id)
                  return (
                    <tr key={item.id} className="hover:bg-neutral-50/80 transition">
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-3">
                          <img
                            src={item.image_url || 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c'}
                            alt={item.name}
                            className="w-12 h-12 rounded-lg object-cover shrink-0"
                          />
                          <div>
                            <div className="font-bold text-charcoal-900 text-sm">{item.name}</div>
                            <div className="text-neutral-500 text-[11px] line-clamp-1 max-w-sm">
                              {item.description || '-'}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <span className="font-medium text-neutral-700 bg-neutral-100 px-2 py-0.5 rounded">
                          {cat?.name || 'Uncategorized'}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <span className="font-extrabold text-charcoal-900 text-sm">
                          {formatIDR(item.price)}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <button
                          onClick={() => handleToggleAvailability(item)}
                          className={`px-2.5 py-1 rounded-full text-[11px] font-bold transition flex items-center gap-1 ${
                            item.is_available
                              ? 'bg-emerald-100 text-emerald-800 hover:bg-emerald-200'
                              : 'bg-rose-100 text-rose-800 hover:bg-rose-200'
                          }`}
                        >
                          {item.is_available ? (
                            <>
                              <CheckCircle2 className="w-3.5 h-3.5" />
                              <span>Tersedia</span>
                            </>
                          ) : (
                            <>
                              <XCircle className="w-3.5 h-3.5" />
                              <span>Habis</span>
                            </>
                          )}
                        </button>
                      </td>
                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => openEditItemModal(item)}
                            className="p-1.5 rounded-lg text-neutral-500 hover:text-charcoal-900 hover:bg-neutral-100"
                            title="Edit Menu"
                          >
                            <Edit className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleSoftDelete(item)}
                            className="p-1.5 rounded-lg text-rose-400 hover:text-rose-700 hover:bg-rose-50"
                            title="Nonaktifkan Menu"
                          >
                            <Trash2 className="w-4 h-4" />
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

      {/* Menu Item Modal (Add / Edit) */}
      {isItemModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 space-y-4 shadow-xl border border-neutral-200 animate-slide-up">
            <div className="flex items-center justify-between pb-2 border-b border-neutral-100">
              <h3 className="text-base font-bold text-charcoal-900">
                {editingItem ? 'Edit Menu Hidangan' : 'Tambah Menu Baru'}
              </h3>
              <button
                onClick={() => setIsItemModalOpen(false)}
                className="text-neutral-400 hover:text-neutral-700"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveItem} className="space-y-3.5 text-xs">
              <div>
                <label className="block font-semibold text-neutral-700 mb-1">Nama Menu *</label>
                <input
                  type="text"
                  required
                  placeholder="Cth: Nasi Goreng Wagyu Kecombrang"
                  value={itemName}
                  onChange={(e) => setItemName(e.target.value)}
                  className="w-full px-3.5 py-2 bg-neutral-50 border border-neutral-300 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-olive-600"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-neutral-700 mb-1">Kategori *</label>
                  <select
                    value={itemCategory}
                    onChange={(e) => setItemCategory(e.target.value)}
                    className="w-full px-3.5 py-2 bg-neutral-50 border border-neutral-300 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-olive-600"
                  >
                    {categories.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-neutral-700 mb-1">Harga (IDR) *</label>
                  <input
                    type="number"
                    min="0"
                    step="1000"
                    required
                    value={itemPrice}
                    onChange={(e) => setItemPrice(parseFloat(e.target.value) || 0)}
                    className="w-full px-3.5 py-2 bg-neutral-50 border border-neutral-300 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-olive-600"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-neutral-700 mb-1">Foto Menu (URL Image)</label>
                <input
                  type="url"
                  placeholder="https://..."
                  value={itemImage}
                  onChange={(e) => setItemImage(e.target.value)}
                  className="w-full px-3.5 py-2 bg-neutral-50 border border-neutral-300 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-olive-600"
                />
              </div>

              <div>
                <label className="block font-semibold text-neutral-700 mb-1">Deskripsi Singkat</label>
                <textarea
                  rows={2}
                  placeholder="Rincian bahan dan rasa..."
                  value={itemDesc}
                  onChange={(e) => setItemDesc(e.target.value)}
                  className="w-full px-3.5 py-2 bg-neutral-50 border border-neutral-300 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-olive-600"
                />
              </div>

              <div className="flex items-center gap-2 pt-1">
                <input
                  type="checkbox"
                  id="availCheck"
                  checked={itemAvailable}
                  onChange={(e) => setItemAvailable(e.target.checked)}
                  className="rounded text-olive-700 focus:ring-olive-600"
                />
                <label htmlFor="availCheck" className="font-semibold text-charcoal-900 cursor-pointer">
                  Tersedia untuk dipesan (In Stock)
                </label>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-neutral-100">
                <button
                  type="button"
                  onClick={() => setIsItemModalOpen(false)}
                  className="px-4 py-2 text-neutral-600 hover:bg-neutral-100 rounded-xl font-semibold"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-olive-700 hover:bg-olive-800 text-white font-bold rounded-xl shadow-sm"
                >
                  Simpan Menu
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Category Modal */}
      {isCatModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl max-w-sm w-full p-6 space-y-4 shadow-xl border border-neutral-200 animate-slide-up">
            <div className="flex items-center justify-between pb-2 border-b border-neutral-100">
              <h3 className="text-base font-bold text-charcoal-900">Tambah Kategori Baru</h3>
              <button onClick={() => setIsCatModalOpen(false)} className="text-neutral-400 hover:text-neutral-700">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateCategory} className="space-y-3 text-xs">
              <div>
                <label className="block font-semibold text-neutral-700 mb-1">Nama Kategori *</label>
                <input
                  type="text"
                  required
                  placeholder="Cth: Special Seafood"
                  value={catName}
                  onChange={(e) => setCatName(e.target.value)}
                  className="w-full px-3.5 py-2 bg-neutral-50 border border-neutral-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-olive-600"
                />
              </div>

              <div>
                <label className="block font-semibold text-neutral-700 mb-1">Deskripsi</label>
                <textarea
                  rows={2}
                  placeholder="Keterangan singkat kategori..."
                  value={catDesc}
                  onChange={(e) => setCatDesc(e.target.value)}
                  className="w-full px-3.5 py-2 bg-neutral-50 border border-neutral-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-olive-600"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsCatModalOpen(false)}
                  className="px-4 py-2 text-neutral-600 hover:bg-neutral-100 rounded-xl font-semibold"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-olive-700 hover:bg-olive-800 text-white font-bold rounded-xl shadow-sm"
                >
                  Simpan Kategori
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
