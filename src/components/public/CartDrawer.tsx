import React from 'react'
import { Link } from 'react-router-dom'
import { ShoppingBag, X, Plus, Minus, Trash2, ArrowRight } from 'lucide-react'
import { useCart } from '@/contexts/CartContext'
import { formatIDR } from '@/utils/formatters'

interface CartDrawerProps {
  isOpen: boolean
  onClose: () => void
}

export const CartDrawer: React.FC<CartDrawerProps> = ({ isOpen, onClose }) => {
  const { items, updateQuantity, updateNotes, removeItem, subtotal, taxAmount, serviceAmount, grandTotal, itemCount } = useCart()

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 overflow-hidden">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm transition-opacity" onClick={onClose} />
      <div className="fixed inset-y-0 right-0 max-w-full flex pl-10">
        <div className="w-screen max-w-md bg-white shadow-2xl flex flex-col border-l border-neutral-200">
          {/* Header */}
          <div className="p-5 border-b border-neutral-200 flex items-center justify-between bg-cream-50">
            <div className="flex items-center gap-2">
              <ShoppingBag className="w-5 h-5 text-olive-700" />
              <h2 className="text-lg font-bold text-charcoal-900">Keranjang Makanan</h2>
              <span className="bg-olive-100 text-olive-800 text-xs font-semibold px-2.5 py-0.5 rounded-full">
                {itemCount} item
              </span>
            </div>
            <button
              onClick={onClose}
              className="text-neutral-400 hover:text-neutral-700 p-2 rounded-lg hover:bg-neutral-100 transition"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Items List */}
          <div className="flex-1 overflow-y-auto p-5 space-y-4">
            {items.length === 0 ? (
              <div className="text-center py-16">
                <ShoppingBag className="w-12 h-12 mx-auto text-neutral-300 mb-3" />
                <p className="text-charcoal-800 font-medium">Keranjang Anda masih kosong</p>
                <p className="text-neutral-500 text-sm mt-1">Pilih menu favorit Anda dari daftar hidangan kami.</p>
                <Link
                  to="/order"
                  onClick={onClose}
                  className="mt-4 inline-flex items-center gap-2 px-4 py-2 bg-olive-700 hover:bg-olive-800 text-white rounded-lg text-sm font-semibold transition shadow-sm"
                >
                  Lihat Menu
                </Link>
              </div>
            ) : (
              items.map((item) => (
                <div
                  key={item.menuItem.id}
                  className="p-3.5 bg-neutral-50 rounded-xl border border-neutral-200 flex flex-col gap-2"
                >
                  <div className="flex gap-3">
                    <img
                      src={item.menuItem.image_url || 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c'}
                      alt={item.menuItem.name}
                      className="w-16 h-16 rounded-lg object-cover shrink-0"
                    />
                    <div className="flex-1 min-w-0">
                      <div className="flex justify-between items-start">
                        <h4 className="text-sm font-bold text-charcoal-900 truncate">{item.menuItem.name}</h4>
                        <button
                          onClick={() => removeItem(item.menuItem.id)}
                          className="text-neutral-400 hover:text-rose-600 transition p-1"
                          title="Hapus"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                      <p className="text-xs text-olive-700 font-semibold mt-0.5">
                        {formatIDR(item.menuItem.price)}
                      </p>
                    </div>
                  </div>

                  {/* Quantity & Notes */}
                  <div className="flex items-center justify-between pt-2 border-t border-neutral-200/60">
                    <input
                      type="text"
                      placeholder="Catatan (cth: tidak pedas)..."
                      value={item.notes}
                      onChange={(e) => updateNotes(item.menuItem.id, e.target.value)}
                      className="text-xs bg-white border border-neutral-200 rounded px-2 py-1 w-48 focus:outline-none focus:border-olive-500"
                    />
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => updateQuantity(item.menuItem.id, item.quantity - 1)}
                        className="w-6 h-6 rounded flex items-center justify-center bg-white border border-neutral-300 text-neutral-600 hover:bg-neutral-100"
                      >
                        <Minus className="w-3 h-3" />
                      </button>
                      <span className="text-xs font-bold text-charcoal-900 w-4 text-center">
                        {item.quantity}
                      </span>
                      <button
                        onClick={() => updateQuantity(item.menuItem.id, item.quantity + 1)}
                        className="w-6 h-6 rounded flex items-center justify-center bg-white border border-neutral-300 text-neutral-600 hover:bg-neutral-100"
                      >
                        <Plus className="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                  <div className="text-right text-xs font-bold text-charcoal-900">
                    Total: {formatIDR(item.lineTotal)}
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Footer & Checkout CTA */}
          {items.length > 0 && (
            <div className="p-5 border-t border-neutral-200 bg-cream-50 space-y-3">
              <div className="space-y-1.5 text-xs text-neutral-600">
                <div className="flex justify-between">
                  <span>Subtotal</span>
                  <span className="font-semibold text-charcoal-900">{formatIDR(subtotal)}</span>
                </div>
                {taxAmount > 0 && (
                  <div className="flex justify-between">
                    <span>Pajak Restoran (10%)</span>
                    <span className="font-semibold text-charcoal-900">{formatIDR(taxAmount)}</span>
                  </div>
                )}
                {serviceAmount > 0 && (
                  <div className="flex justify-between">
                    <span>Service Charge (5%)</span>
                    <span className="font-semibold text-charcoal-900">{formatIDR(serviceAmount)}</span>
                  </div>
                )}
                <div className="flex justify-between text-sm font-bold text-charcoal-900 pt-2 border-t border-neutral-200">
                  <span>Grand Total</span>
                  <span className="text-olive-800 text-base">{formatIDR(grandTotal)}</span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2 pt-2">
                <Link
                  to="/reservation"
                  onClick={onClose}
                  className="flex items-center justify-center gap-1.5 py-2.5 px-3 border border-olive-700 text-olive-800 hover:bg-olive-50 rounded-xl text-xs font-bold transition text-center"
                >
                  Reservasi Meja Dulu
                </Link>
                <Link
                  to="/checkout"
                  onClick={onClose}
                  className="flex items-center justify-center gap-1.5 py-2.5 px-3 bg-olive-700 hover:bg-olive-800 text-white rounded-xl text-xs font-bold transition text-center shadow-md shadow-olive-700/20"
                >
                  <span>Checkout</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
