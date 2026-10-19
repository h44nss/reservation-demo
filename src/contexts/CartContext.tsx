import React, { createContext, useContext, useState, useEffect } from 'react'
import { CartItem, MenuItem, RestaurantSettings } from '@/types/domain'
import { restaurantService } from '@/services/restaurantService'

interface CartContextType {
  items: CartItem[]
  addItem: (menuItem: MenuItem, quantity?: number, notes?: string) => void
  updateQuantity: (menuItemId: string, quantity: number) => void
  updateNotes: (menuItemId: string, notes: string) => void
  removeItem: (menuItemId: string) => void
  clearCart: () => void
  subtotal: number
  taxAmount: number
  serviceAmount: number
  grandTotal: number
  itemCount: number
  settings: RestaurantSettings | null
}

const CartContext = createContext<CartContextType | undefined>(undefined)

const CART_STORAGE_KEY = 'kko_customer_cart_v1'

export const CartProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [items, setItems] = useState<CartItem[]>(() => {
    try {
      const saved = localStorage.getItem(CART_STORAGE_KEY)
      if (saved) return JSON.parse(saved)
    } catch {
      // fallback
    }
    return []
  })
  const [settings, setSettings] = useState<RestaurantSettings | null>(null)

  useEffect(() => {
    restaurantService.getSettings().then(setSettings).catch(console.error)
  }, [])

  useEffect(() => {
    localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(items))
  }, [items])

  const addItem = (menuItem: MenuItem, quantity = 1, notes = '') => {
    setItems((prev) => {
      const existingIdx = prev.findIndex((i) => i.menuItem.id === menuItem.id)
      if (existingIdx !== -1) {
        const next = [...prev]
        const newQty = next[existingIdx].quantity + quantity
        next[existingIdx] = {
          ...next[existingIdx],
          quantity: newQty,
          lineTotal: newQty * menuItem.price,
          notes: notes || next[existingIdx].notes,
        }
        return next
      } else {
        return [
          ...prev,
          {
            menuItem,
            quantity,
            notes,
            lineTotal: quantity * menuItem.price,
          },
        ]
      }
    })
  }

  const updateQuantity = (menuItemId: string, quantity: number) => {
    if (quantity <= 0) {
      removeItem(menuItemId)
      return
    }
    setItems((prev) =>
      prev.map((item) =>
        item.menuItem.id === menuItemId
          ? {
              ...item,
              quantity,
              lineTotal: quantity * item.menuItem.price,
            }
          : item
      )
    )
  }

  const updateNotes = (menuItemId: string, notes: string) => {
    setItems((prev) =>
      prev.map((item) =>
        item.menuItem.id === menuItemId ? { ...item, notes } : item
      )
    )
  }

  const removeItem = (menuItemId: string) => {
    setItems((prev) => prev.filter((i) => i.menuItem.id !== menuItemId))
  }

  const clearCart = () => {
    setItems([])
  }

  const subtotal = items.reduce((sum, item) => sum + item.lineTotal, 0)
  const taxRate = settings?.tax_enabled ? settings.tax_rate : 0
  const taxAmount = Math.round((subtotal * taxRate) / 100)

  const serviceRate = settings?.service_charge_enabled ? settings.service_charge_rate : 0
  const serviceAmount = Math.round((subtotal * serviceRate) / 100)

  const grandTotal = subtotal + taxAmount + serviceAmount
  const itemCount = items.reduce((sum, item) => sum + item.quantity, 0)

  return (
    <CartContext.Provider
      value={{
        items,
        addItem,
        updateQuantity,
        updateNotes,
        removeItem,
        clearCart,
        subtotal,
        taxAmount,
        serviceAmount,
        grandTotal,
        itemCount,
        settings,
      }}
    >
      {children}
    </CartContext.Provider>
  )
}

export const useCart = () => {
  const context = useContext(CartContext)
  if (!context) {
    throw new Error('useCart must be used within a CartProvider')
  }
  return context
}
