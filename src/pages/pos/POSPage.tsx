import React, { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '@/contexts/AuthContext'
import {
  Store,
  Search,
  Plus,
  Minus,
  Trash2,
  Printer,
  CreditCard,
  Banknote,
  QrCode,
  Users,
  Clock,
  ArrowRight,
  History,
  CheckCircle2,
  X,
  Layers,
  Utensils,
  Receipt,
  FileText,
  ChevronLeft,
  LogOut,
} from 'lucide-react'
import { restaurantService } from '@/services/restaurantService'
import {
  MenuItem,
  MenuCategory,
  DiningTable,
  OrderType,
  PaymentMethod,
  OrderWithDetails,
  RestaurantSettings,
} from '@/types/domain'
import { formatIDR, formatDateTime } from '@/utils/formatters'
import { generateBillPDF } from '@/utils/pdfGenerator'
import { useToast } from '@/components/ui/Toast'

interface POSCartItem {
  menuItem: MenuItem
  quantity: number
  notes: string
  lineTotal: number
}

export const POSPage: React.FC = () => {
  const toast = useToast()
  const { user, logout } = useAuth()
  const navigate = useNavigate()

  const [categories, setCategories] = useState<MenuCategory[]>([])
  const [menuItems, setMenuItems] = useState<MenuItem[]>([])
  const [tables, setTables] = useState<DiningTable[]>([])
  const [settings, setSettings] = useState<RestaurantSettings | null>(null)
  const [loading, setLoading] = useState(true)

  // Filter
  const [selectedCategory, setSelectedCategory] = useState<string>('all')
  const [searchQuery, setSearchQuery] = useState('')

  // POS Transaction Cart State
  const [cart, setCart] = useState<POSCartItem[]>([])
  const [orderType, setOrderType] = useState<OrderType>('dine_in')
  const [selectedTableId, setSelectedTableId] = useState<string>('')
  const [customerName, setCustomerName] = useState('Pelanggan Walk-In')
  const [customerPhone, setCustomerPhone] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Payment Modal State
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false)
  const [activeOrderForPayment, setActiveOrderForPayment] = useState<OrderWithDetails | null>(null)
  const [cashTendered, setCashTendered] = useState<number>(0)
  const [posPayMethod, setPosPayMethod] = useState<PaymentMethod>('cash')
  const [paymentDone, setPaymentDone] = useState(false)

  // Transaction History Modal
  const [isHistoryOpen, setIsHistoryOpen] = useState(false)
  const [recentTransactions, setRecentTransactions] = useState<OrderWithDetails[]>([])

  // Printable receipt state for browser thermal print
  const [printableOrder, setPrintableOrder] = useState<OrderWithDetails | null>(null)

  useEffect(() => {
    loadPOSData()
  }, [])

  const loadPOSData = async () => {
    try {
      setLoading(true)
      const [cats, items, tbs, set, ords] = await Promise.all([
        restaurantService.getCategories(),
        restaurantService.getMenuItems(),
        restaurantService.getTables(),
        restaurantService.getSettings(),
        restaurantService.getOrders(),
      ])
      setCategories(cats)
      setMenuItems(items)
      setTables(tbs)
      setSettings(set)
      setRecentTransactions(ords.slice(0, 15))

      const firstAvailTable = tbs.find((t) => t.is_active && t.current_status === 'available')
      if (firstAvailTable) setSelectedTableId(firstAvailTable.id)
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  // Cart operations
  const addToCart = (item: MenuItem) => {
    if (!item.is_available) {
      toast.error('Item ini sedang habis.')
      return
    }
    setCart((prev) => {
      const idx = prev.findIndex((i) => i.menuItem.id === item.id)
      if (idx !== -1) {
        const next = [...prev]
        const newQty = next[idx].quantity + 1
        next[idx] = {
          ...next[idx],
          quantity: newQty,
          lineTotal: newQty * item.price,
        }
        return next
      }
      return [
        ...prev,
        {
          menuItem: item,
          quantity: 1,
          notes: '',
          lineTotal: item.price,
        },
      ]
    })
  }

  const updateCartQty = (id: string, qty: number) => {
    if (qty <= 0) {
      setCart((prev) => prev.filter((i) => i.menuItem.id !== id))
      return
    }
    setCart((prev) =>
      prev.map((i) =>
        i.menuItem.id === id ? { ...i, quantity: qty, lineTotal: qty * i.menuItem.price } : i
      )
    )
  }

  const updateCartNotes = (id: string, notes: string) => {
    setCart((prev) =>
      prev.map((i) => (i.menuItem.id === id ? { ...i, notes } : i))
    )
  }

  const clearPosCart = () => {
    setCart([])
    setCustomerName('Pelanggan Walk-In')
    setCustomerPhone('')
  }

  // Calculations
  const subtotal = cart.reduce((sum, item) => sum + item.lineTotal, 0)
  const taxRate = settings?.tax_enabled ? settings.tax_rate : 0
  const taxAmount = Math.round((subtotal * taxRate) / 100)
  const serviceRate = settings?.service_charge_enabled ? settings.service_charge_rate : 0
  const serviceAmount = Math.round((subtotal * serviceRate) / 100)
  const grandTotal = subtotal + taxAmount + serviceAmount

  // Submit Order & send to Kitchen
  const handleConfirmOrderAndSendKitchen = async () => {
    if (cart.length === 0) {
      toast.error('Keranjang transaksi kasir masih kosong.')
      return
    }

    try {
      setIsSubmitting(true)
      const dateStr = new Date().toISOString().split('T')[0]
      const timeStr = new Date().toTimeString().split(' ')[0]

      const result = await restaurantService.createReservationAndOrder({
        customer_name: customerName.trim() || 'Walk-in',
        customer_phone: customerPhone.trim() || '+628000000000',
        reservation_date: dateStr,
        start_time: timeStr,
        guest_count: 2,
        table_id: orderType === 'dine_in' ? selectedTableId || null : null,
        order_type: orderType,
        order_source: 'pos',
        items: cart.map((i) => ({
          menu_item_id: i.menuItem.id,
          quantity: i.quantity,
          notes: i.notes || undefined,
        })),
      })

      // Fetch newly created order object
      const fullOrder = await restaurantService.getOrderById(result.order_id!)
      setActiveOrderForPayment(fullOrder)
      setCashTendered(grandTotal)
      setPrintableOrder(fullOrder)
      toast.success(`Order ${result.order_number} berhasil dikirim ke kitchen!`)

      // Open payment modal immediately
      setIsPaymentModalOpen(true)
      setPaymentDone(false)
      loadPOSData()
    } catch (err: any) {
      toast.error(err.message || 'Gagal memproses pesanan kasir.')
    } finally {
      setIsSubmitting(false)
    }
  }

  // Process POS payment
  const handleProcessPayment = async () => {
    if (!activeOrderForPayment) return

    try {
      await restaurantService.processCashierPayment(
        activeOrderForPayment.id,
        posPayMethod,
        Number(activeOrderForPayment.grand_total)
      )

      setPaymentDone(true)
      toast.success('Pembayaran kasir berhasil diselesaikan!')
      clearPosCart()
      loadPOSData()
    } catch (err: any) {
      toast.error(err.message || 'Gagal memproses pembayaran.')
    }
  }

  // Browser thermal print action (58mm / 80mm standard receipt)
  const handleTriggerThermalPrint = (order: OrderWithDetails) => {
    setPrintableOrder(order)
    setTimeout(() => {
      window.print()
    }, 200)
  }

  const filteredItems = menuItems.filter((i) => {
    if (!i.is_active) return false
    if (selectedCategory !== 'all' && i.category_id !== selectedCategory) return false
    if (searchQuery.trim()) {
      return i.name.toLowerCase().includes(searchQuery.toLowerCase())
    }
    return true
  })

  const cashChange = Math.max(0, cashTendered - grandTotal)

  return (
    <div className="h-screen flex flex-col bg-neutral-100 overflow-hidden font-sans">
      {/* POS Top Header Bar */}
      <header className="h-14 bg-charcoal-950 text-white px-4 flex items-center justify-between shrink-0 border-b border-charcoal-800">
        <div className="flex items-center gap-4">
          {user?.role === 'admin' ? (
            <Link
              to="/admin"
              className="flex items-center gap-1.5 text-xs text-neutral-400 hover:text-white transition px-2.5 py-1 rounded-lg bg-charcoal-800"
            >
              <ChevronLeft className="w-4 h-4" />
              <span>Ke Admin</span>
            </Link>
          ) : (
            <button
              onClick={() => { logout(); navigate('/login') }}
              className="flex items-center gap-1.5 text-xs text-neutral-400 hover:text-rose-400 transition px-2.5 py-1 rounded-lg bg-charcoal-800"
            >
              <LogOut className="w-4 h-4" />
              <span>Logout</span>
            </button>
          )}
          <div className="flex items-center gap-2">
            <Store className="w-5 h-5 text-emerald-400" />
            <span className="font-bold text-sm tracking-tight">KKO POS Cashier System</span>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => setIsHistoryOpen(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-charcoal-800 hover:bg-charcoal-700 text-xs font-semibold text-neutral-200 transition"
          >
            <History className="w-4 h-4" />
            <span>Riwayat Transaksi</span>
          </button>

          <Link
            to="/kitchen"
            target="_blank"
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold transition"
          >
            <span>KDS Dapur</span>
          </Link>
        </div>
      </header>

      {/* POS Workspace Layout */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left Column: Menu Items & Category Filters */}
        <div className="flex-1 flex flex-col min-w-0 bg-neutral-100">
          {/* Categories Selector */}
          <div className="p-3 bg-white border-b border-neutral-200 flex items-center gap-2 overflow-x-auto text-xs font-bold shrink-0">
            <button
              onClick={() => setSelectedCategory('all')}
              className={`px-4 py-2 rounded-xl shrink-0 transition ${
                selectedCategory === 'all'
                  ? 'bg-olive-700 text-white shadow-sm'
                  : 'bg-neutral-100 text-neutral-700 hover:bg-neutral-200'
              }`}
            >
              Semua Menu
            </button>
            {categories.map((c) => (
              <button
                key={c.id}
                onClick={() => setSelectedCategory(c.id)}
                className={`px-4 py-2 rounded-xl shrink-0 transition ${
                  selectedCategory === c.id
                    ? 'bg-olive-700 text-white shadow-sm'
                    : 'bg-neutral-100 text-neutral-700 hover:bg-neutral-200'
                }`}
              >
                {c.name}
              </button>
            ))}
          </div>

          {/* Search Bar */}
          <div className="p-3 bg-white/70 border-b border-neutral-200/80">
            <div className="relative">
              <Search className="w-4 h-4 text-neutral-400 absolute left-3.5 top-2.5" />
              <input
                type="text"
                placeholder="Ketik nama makanan untuk mencari cepat..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-4 py-1.5 bg-neutral-50 border border-neutral-300 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-olive-600"
              />
            </div>
          </div>

          {/* Product Items Grid */}
          <div className="flex-1 overflow-y-auto p-4 grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 gap-3.5">
            {filteredItems.map((item) => (
              <button
                key={item.id}
                disabled={!item.is_available}
                onClick={() => addToCart(item)}
                className={`p-3 rounded-2xl border text-left flex flex-col justify-between transition group shadow-subtle ${
                  item.is_available
                    ? 'bg-white border-neutral-200 hover:border-olive-500 hover:shadow-md cursor-pointer active:scale-95'
                    : 'bg-neutral-200/50 border-neutral-200 opacity-60 cursor-not-allowed'
                }`}
              >
                <div className="space-y-2">
                  <div className="h-28 rounded-xl overflow-hidden bg-neutral-100 relative">
                    <img
                      src={item.image_url || 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c'}
                      alt={item.name}
                      className="w-full h-full object-cover group-hover:scale-105 transition duration-300"
                    />
                    {!item.is_available && (
                      <span className="absolute inset-0 bg-black/60 text-white text-[10px] font-bold uppercase flex items-center justify-center">
                        Habis
                      </span>
                    )}
                  </div>
                  <h4 className="text-xs font-bold text-charcoal-900 line-clamp-1">{item.name}</h4>
                </div>
                <div className="pt-2 font-extrabold text-xs text-olive-800">
                  {formatIDR(item.price)}
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Right Column: Transaction Cart & Payment Panel */}
        <div className="w-96 bg-white border-l border-neutral-200 flex flex-col h-full shrink-0 shadow-lg">
          {/* Cart Header & Order Type Switcher */}
          <div className="p-4 border-b border-neutral-200 space-y-3 bg-cream-50">
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setOrderType('dine_in')}
                className={`py-2 px-3 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 ${
                  orderType === 'dine_in'
                    ? 'bg-olive-700 text-white shadow-sm'
                    : 'bg-white border border-neutral-300 text-neutral-700'
                }`}
              >
                <span>Dine In (Meja)</span>
              </button>
              <button
                type="button"
                onClick={() => setOrderType('takeaway')}
                className={`py-2 px-3 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 ${
                  orderType === 'takeaway'
                    ? 'bg-olive-700 text-white shadow-sm'
                    : 'bg-white border border-neutral-300 text-neutral-700'
                }`}
              >
                <span>Takeaway</span>
              </button>
            </div>

            {/* Table & Customer Inputs */}
            <div className="grid grid-cols-2 gap-2 text-xs">
              {orderType === 'dine_in' ? (
                <div>
                  <label className="text-[10px] font-bold text-neutral-500 block mb-0.5">Pilih Meja</label>
                  <select
                    value={selectedTableId}
                    onChange={(e) => setSelectedTableId(e.target.value)}
                    className="w-full px-2 py-1.5 bg-white border border-neutral-300 rounded-lg text-xs font-bold"
                  >
                    {tables
                      .filter((t) => t.is_active)
                      .map((t) => (
                        <option key={t.id} value={t.id}>
                          {t.table_number} ({t.area})
                        </option>
                      ))}
                  </select>
                </div>
              ) : (
                <div>
                  <label className="text-[10px] font-bold text-neutral-500 block mb-0.5">Tipe</label>
                  <span className="block px-2 py-1.5 bg-neutral-100 rounded-lg text-xs font-semibold text-neutral-600">
                    Bungkus Bawa Pulang
                  </span>
                </div>
              )}

              <div>
                <label className="text-[10px] font-bold text-neutral-500 block mb-0.5">Nama Tamu</label>
                <input
                  type="text"
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  className="w-full px-2 py-1.5 bg-white border border-neutral-300 rounded-lg text-xs"
                />
              </div>
            </div>
          </div>

          {/* Cart Items List */}
          <div className="flex-1 overflow-y-auto p-3 space-y-2.5">
            {cart.length === 0 ? (
              <div className="text-center py-20 text-neutral-400 text-xs">
                <Store className="w-10 h-10 mx-auto text-neutral-300 mb-2" />
                <span>Belum ada item dipilih. Ketuk menu di sebelah kiri.</span>
              </div>
            ) : (
              cart.map((item) => (
                <div
                  key={item.menuItem.id}
                  className="p-2.5 rounded-xl bg-neutral-50 border border-neutral-200/80 space-y-2 text-xs"
                >
                  <div className="flex justify-between items-start">
                    <div>
                      <h5 className="font-bold text-charcoal-900">{item.menuItem.name}</h5>
                      <span className="text-neutral-500 text-[11px]">
                        {formatIDR(item.menuItem.price)}
                      </span>
                    </div>
                    <span className="font-black text-charcoal-900">{formatIDR(item.lineTotal)}</span>
                  </div>

                  <div className="flex items-center justify-between pt-1 border-t border-neutral-200/60">
                    <input
                      type="text"
                      placeholder="Catatan item..."
                      value={item.notes}
                      onChange={(e) => updateCartNotes(item.menuItem.id, e.target.value)}
                      className="text-[11px] px-2 py-1 bg-white border border-neutral-200 rounded w-44"
                    />
                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={() => updateCartQty(item.menuItem.id, item.quantity - 1)}
                        className="w-6 h-6 rounded bg-white border border-neutral-300 flex items-center justify-center text-neutral-700"
                      >
                        <Minus className="w-3 h-3" />
                      </button>
                      <span className="w-5 text-center font-bold text-charcoal-900">{item.quantity}</span>
                      <button
                        onClick={() => updateCartQty(item.menuItem.id, item.quantity + 1)}
                        className="w-6 h-6 rounded bg-olive-700 text-white flex items-center justify-center"
                      >
                        <Plus className="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Cart Pricing Breakdown & Actions */}
          <div className="p-4 border-t border-neutral-200 bg-cream-50 space-y-3">
            <div className="space-y-1 text-xs text-neutral-600">
              <div className="flex justify-between">
                <span>Subtotal</span>
                <span className="font-semibold text-charcoal-900">{formatIDR(subtotal)}</span>
              </div>
              <div className="flex justify-between">
                <span>Pajak Restoran PB1 (10%)</span>
                <span>{formatIDR(taxAmount)}</span>
              </div>
              <div className="flex justify-between">
                <span>Service Charge (5%)</span>
                <span>{formatIDR(serviceAmount)}</span>
              </div>
              <div className="flex justify-between text-base font-black text-charcoal-900 pt-2 border-t border-neutral-200">
                <span>Grand Total</span>
                <span className="text-olive-800 text-lg">{formatIDR(grandTotal)}</span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2 pt-1">
              <button
                type="button"
                onClick={clearPosCart}
                className="py-2.5 px-3 border border-neutral-300 text-neutral-700 hover:bg-neutral-100 rounded-xl text-xs font-bold transition text-center"
              >
                Reset Order
              </button>

              <button
                type="button"
                disabled={cart.length === 0 || isSubmitting}
                onClick={handleConfirmOrderAndSendKitchen}
                className="py-2.5 px-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 shadow-md shadow-emerald-600/20 disabled:opacity-50"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>Kirim Kitchen & Bayar</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* POS Payment Processing Modal */}
      {isPaymentModalOpen && activeOrderForPayment && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-8 space-y-5 shadow-2xl border border-neutral-200 animate-slide-up">
            <div className="flex items-center justify-between pb-3 border-b border-neutral-100">
              <div>
                <h3 className="text-lg font-bold text-charcoal-900">
                  Pembayaran Kasir: {activeOrderForPayment.order_number}
                </h3>
                <span className="text-xs text-neutral-500">
                  Total Tagihan:{' '}
                  <strong className="text-olive-800 text-sm">
                    {formatIDR(activeOrderForPayment.grand_total)}
                  </strong>
                </span>
              </div>
              <button
                onClick={() => setIsPaymentModalOpen(false)}
                className="text-neutral-400 hover:text-neutral-700"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {!paymentDone ? (
              <div className="space-y-4">
                {/* Method selector */}
                <div className="grid grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => setPosPayMethod('cash')}
                    className={`py-3 px-2 rounded-xl border flex flex-col items-center gap-1.5 text-xs font-bold transition ${
                      posPayMethod === 'cash'
                        ? 'border-emerald-600 bg-emerald-50 text-emerald-800 ring-2 ring-emerald-600/20'
                        : 'border-neutral-200 bg-neutral-50 text-neutral-700'
                    }`}
                  >
                    <Banknote className="w-5 h-5" />
                    <span>Tunai (Cash)</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setPosPayMethod('qris')}
                    className={`py-3 px-2 rounded-xl border flex flex-col items-center gap-1.5 text-xs font-bold transition ${
                      posPayMethod === 'qris'
                        ? 'border-emerald-600 bg-emerald-50 text-emerald-800 ring-2 ring-emerald-600/20'
                        : 'border-neutral-200 bg-neutral-50 text-neutral-700'
                    }`}
                  >
                    <QrCode className="w-5 h-5" />
                    <span>QRIS Dinamis</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setPosPayMethod('e_wallet')}
                    className={`py-3 px-2 rounded-xl border flex flex-col items-center gap-1.5 text-xs font-bold transition ${
                      posPayMethod === 'e_wallet'
                        ? 'border-emerald-600 bg-emerald-50 text-emerald-800 ring-2 ring-emerald-600/20'
                        : 'border-neutral-200 bg-neutral-50 text-neutral-700'
                    }`}
                  >
                    <CreditCard className="w-5 h-5" />
                    <span>Kartu EDC / Debit</span>
                  </button>
                </div>

                {/* Cash calculation input */}
                {posPayMethod === 'cash' && (
                  <div className="p-4 rounded-2xl bg-neutral-50 border border-neutral-200 space-y-3">
                    <div>
                      <label className="block text-xs font-bold text-neutral-700 mb-1">
                        Uang Tunai Diterima (Cash Tendered)
                      </label>
                      <input
                        type="number"
                        min="0"
                        step="5000"
                        value={cashTendered}
                        onChange={(e) => setCashTendered(parseFloat(e.target.value) || 0)}
                        className="w-full px-3.5 py-2.5 bg-white border border-neutral-300 rounded-xl text-base font-extrabold focus:outline-none focus:ring-2 focus:ring-emerald-600"
                      />
                    </div>

                    {/* Quick Cash Buttons */}
                    <div className="flex flex-wrap gap-2 pt-1 text-xs font-bold">
                      <button
                        type="button"
                        onClick={() => setCashTendered(Number(activeOrderForPayment.grand_total))}
                        className="px-2.5 py-1 bg-white border border-neutral-300 rounded-lg hover:bg-neutral-100"
                      >
                        Uang Pas
                      </button>
                      <button
                        type="button"
                        onClick={() => setCashTendered(100000)}
                        className="px-2.5 py-1 bg-white border border-neutral-300 rounded-lg hover:bg-neutral-100"
                      >
                        Rp 100.000
                      </button>
                      <button
                        type="button"
                        onClick={() => setCashTendered(200000)}
                        className="px-2.5 py-1 bg-white border border-neutral-300 rounded-lg hover:bg-neutral-100"
                      >
                        Rp 200.000
                      </button>
                      <button
                        type="button"
                        onClick={() => setCashTendered(500000)}
                        className="px-2.5 py-1 bg-white border border-neutral-300 rounded-lg hover:bg-neutral-100"
                      >
                        Rp 500.000
                      </button>
                    </div>

                    <div className="pt-2 border-t border-neutral-200 flex justify-between items-center text-xs">
                      <span className="font-semibold text-neutral-600">Kembalian:</span>
                      <span className="text-base font-black text-emerald-700">
                        {formatIDR(cashChange)}
                      </span>
                    </div>
                  </div>
                )}

                <div className="pt-2 space-y-2">
                  <button
                    onClick={handleProcessPayment}
                    className="w-full py-3.5 px-4 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-sm font-bold transition flex items-center justify-center gap-2 shadow-md shadow-emerald-600/20"
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Selesaikan Pembayaran & Lunas</span>
                  </button>

                  <button
                    onClick={() => {
                      setIsPaymentModalOpen(false)
                      clearPosCart()
                    }}
                    className="w-full py-2.5 px-4 border border-neutral-300 hover:bg-neutral-50 text-neutral-700 rounded-xl text-xs font-semibold"
                  >
                    Simpan Order Saja (Bayar Nanti)
                  </button>
                </div>
              </div>
            ) : (
              <div className="text-center space-y-4 py-4">
                <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center mx-auto">
                  <CheckCircle2 className="w-9 h-9" />
                </div>
                <h4 className="text-lg font-bold text-charcoal-900">Pembayaran Sukses Tercatat!</h4>
                <p className="text-xs text-neutral-500">
                  Status order diupdate menjadi PAID dan siap dicetak ke format printer kasir.
                </p>

                <div className="grid grid-cols-2 gap-3 pt-2">
                  <button
                    onClick={() => handleTriggerThermalPrint(activeOrderForPayment)}
                    className="py-3 px-4 bg-charcoal-950 hover:bg-charcoal-900 text-white rounded-xl text-xs font-bold transition flex items-center justify-center gap-2 shadow-sm"
                  >
                    <Printer className="w-4 h-4" />
                    <span>Cetak Struk Thermal (80mm)</span>
                  </button>

                  <button
                    onClick={() => generateBillPDF(activeOrderForPayment, settings!)}
                    className="py-3 px-4 bg-olive-700 hover:bg-olive-800 text-white rounded-xl text-xs font-bold transition flex items-center justify-center gap-2 shadow-sm"
                  >
                    <FileText className="w-4 h-4" />
                    <span>Download Struk PDF</span>
                  </button>
                </div>

                <button
                  onClick={() => setIsPaymentModalOpen(false)}
                  className="w-full py-2.5 text-xs text-neutral-500 hover:text-charcoal-900 font-semibold"
                >
                  Tutup & Transaksi Baru
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* POS Transactions History Modal */}
      {isHistoryOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-white rounded-3xl max-w-2xl w-full p-6 space-y-4 shadow-2xl border border-neutral-200 animate-slide-up max-h-[85vh] flex flex-col">
            <div className="flex items-center justify-between pb-3 border-b border-neutral-100 shrink-0">
              <h3 className="text-base font-bold text-charcoal-900 flex items-center gap-2">
                <History className="w-5 h-5 text-olive-700" />
                <span>Riwayat Transaksi Kasir POS</span>
              </h3>
              <button onClick={() => setIsHistoryOpen(false)} className="text-neutral-400 hover:text-neutral-700">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto space-y-2.5 text-xs">
              {recentTransactions.map((ord) => (
                <div
                  key={ord.id}
                  className="p-3.5 rounded-xl bg-neutral-50 border border-neutral-200 flex items-center justify-between"
                >
                  <div>
                    <div className="flex items-center gap-2 font-bold text-charcoal-900">
                      <span className="font-mono">{ord.order_number}</span>
                      <span className="text-neutral-500 font-normal">({ord.customer_name})</span>
                    </div>
                    <div className="text-neutral-500 text-[11px] mt-0.5">
                      {formatDateTime(ord.created_at)} • Meja: {ord.table?.table_number || '-'} • {ord.payment_status.toUpperCase()}
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <span className="font-black text-charcoal-900 text-sm">{formatIDR(ord.grand_total)}</span>
                    <button
                      onClick={() => handleTriggerThermalPrint(ord)}
                      className="p-2 rounded-lg bg-white border border-neutral-300 hover:bg-neutral-100 text-neutral-700"
                      title="Reprint Struk"
                    >
                      <Printer className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Hidden printable receipt for thermal printer (58mm / 80mm format) */}
      {printableOrder && (
        <div id="printable-receipt" className="hidden print:block font-mono text-black">
          <div className="text-center pb-2 border-b border-dashed border-black">
            <h2 className="text-base font-bold uppercase">{settings?.restaurant_name || 'KKO RESTO'}</h2>
            <p className="text-[10px]">{settings?.address}</p>
            <p className="text-[10px]">Telp: {settings?.phone}</p>
          </div>

          <div className="py-2 text-[10px] space-y-0.5 border-b border-dashed border-black">
            <div>Order: {printableOrder.order_number}</div>
            <div>Tamu: {printableOrder.customer_name}</div>
            <div>Waktu: {formatDateTime(printableOrder.created_at)}</div>
            <div>Tipe: {printableOrder.order_type.toUpperCase()} | Meja: {printableOrder.table?.table_number || '-'}</div>
          </div>

          <div className="py-2 text-[10px] space-y-1 border-b border-dashed border-black">
            {printableOrder.items?.map((item) => (
              <div key={item.id} className="flex justify-between">
                <span>{item.quantity}x {item.item_name_snapshot}</span>
                <span>{formatIDR(item.line_total)}</span>
              </div>
            ))}
          </div>

          <div className="py-2 text-[10px] space-y-0.5 border-b border-dashed border-black">
            <div className="flex justify-between">
              <span>Subtotal:</span>
              <span>{formatIDR(printableOrder.subtotal)}</span>
            </div>
            <div className="flex justify-between">
              <span>PB1 (10%):</span>
              <span>{formatIDR(printableOrder.tax_amount)}</span>
            </div>
            <div className="flex justify-between">
              <span>Service (5%):</span>
              <span>{formatIDR(printableOrder.service_charge_amount)}</span>
            </div>
            <div className="flex justify-between font-bold text-xs pt-1">
              <span>TOTAL:</span>
              <span>{formatIDR(printableOrder.grand_total)}</span>
            </div>
          </div>

          <div className="text-center pt-3 text-[9px]">
            <p className="font-bold uppercase tracking-wider">
              {printableOrder.payment_status === 'paid' ? '*** LUNAS / PAID ***' : '*** BILL / BELUM LUNAS ***'}
            </p>
            <p className="mt-1">Terima Kasih Atas Kunjungan Anda!</p>
          </div>
        </div>
      )}
    </div>
  )
}
