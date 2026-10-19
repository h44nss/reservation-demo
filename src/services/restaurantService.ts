import { supabase, isSupabaseConfigured } from '@/lib/supabase'
import {
  RestaurantSettings,
  MenuCategory,
  MenuItem,
  DiningTable,
  OrderWithDetails,
  ReservationWithDetails,
  KitchenTicketWithDetails,
  DashboardStats,
  PublicBookingTrackingResult,
  ReservationStatus,
  OrderStatus,
  KitchenStatus,
  PaymentStatus,
  PaymentMethod,
  TableStatus,
  StaffUser,
  Order,
  OrderItem,
  Payment,
  KitchenTicket,
  Reservation,
} from '@/types/domain'
import {
  INITIAL_SETTINGS,
  INITIAL_CATEGORIES,
  INITIAL_MENU_ITEMS,
  INITIAL_TABLES,
  INITIAL_RESERVATIONS,
  INITIAL_ORDERS,
  INITIAL_ORDER_ITEMS,
  INITIAL_PAYMENTS,
  INITIAL_KITCHEN_TICKETS,
  DEMO_USERS,
} from './mockData'

// Local storage persistent fallback store keys
const STORAGE_KEYS = {
  SETTINGS: 'kko_settings_v1',
  CATEGORIES: 'kko_categories_v1',
  MENU_ITEMS: 'kko_menu_items_v1',
  TABLES: 'kko_tables_v1',
  RESERVATIONS: 'kko_reservations_v1',
  ORDERS: 'kko_orders_v1',
  ORDER_ITEMS: 'kko_order_items_v1',
  PAYMENTS: 'kko_payments_v1',
  KITCHEN_TICKETS: 'kko_tickets_v1',
  USERS: 'kko_users_v1',
}

function loadStore<T>(key: string, initial: T): T {
  try {
    const saved = localStorage.getItem(key)
    if (!saved) {
      localStorage.setItem(key, JSON.stringify(initial))
      return initial
    }
    return JSON.parse(saved) as T
  } catch {
    return initial
  }
}

function saveStore<T>(key: string, data: T): void {
  try {
    localStorage.setItem(key, JSON.stringify(data))
    window.dispatchEvent(new Event('kko_store_updated'))
  } catch (err) {
    console.error('Storage error:', err)
  }
}

class RestaurantService {
  // ----------------------------------------------------
  // SETTINGS
  // ----------------------------------------------------
  async getSettings(): Promise<RestaurantSettings> {
    if (isSupabaseConfigured) {
      try {
        const { data, error } = await supabase.from('restaurant_settings').select('*').limit(1).single()
        if (!error && data) return data as RestaurantSettings
      } catch (err) {
        console.warn('Supabase getSettings failed, using fallback:', err)
      }
    }
    return loadStore<RestaurantSettings>(STORAGE_KEYS.SETTINGS, INITIAL_SETTINGS)
  }

  async updateSettings(updates: Partial<RestaurantSettings>): Promise<RestaurantSettings> {
    if (isSupabaseConfigured) {
      try {
        const { data, error } = await (supabase.from('restaurant_settings') as any)
          .update(updates)
          .eq('id', updates.id || INITIAL_SETTINGS.id)
          .select()
          .single()
        if (!error && data) return data as RestaurantSettings
      } catch (err) {
        console.warn('Supabase updateSettings failed, using fallback:', err)
      }
    }
    const current = loadStore<RestaurantSettings>(STORAGE_KEYS.SETTINGS, INITIAL_SETTINGS)
    const updated = { ...current, ...updates, updated_at: new Date().toISOString() }
    saveStore(STORAGE_KEYS.SETTINGS, updated)
    return updated
  }

  // ----------------------------------------------------
  // CATEGORIES
  // ----------------------------------------------------
  async getCategories(): Promise<MenuCategory[]> {
    if (isSupabaseConfigured) {
      try {
        const { data, error } = await supabase
          .from('menu_categories')
          .select('*')
          .order('sort_order', { ascending: true })
        if (!error && data) return data as MenuCategory[]
      } catch (err) {
        console.warn('Supabase getCategories failed, using fallback:', err)
      }
    }
    const cats = loadStore<MenuCategory[]>(STORAGE_KEYS.CATEGORIES, INITIAL_CATEGORIES)
    return cats.sort((a, b) => a.sort_order - b.sort_order)
  }

  async createCategory(cat: Partial<MenuCategory>): Promise<MenuCategory> {
    const newCategory: MenuCategory = {
      id: crypto.randomUUID(),
      name: cat.name || 'New Category',
      description: cat.description || null,
      sort_order: cat.sort_order || 99,
      is_active: cat.is_active ?? true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }
    if (isSupabaseConfigured) {
      try {
        const { data, error } = await (supabase.from('menu_categories') as any).insert(newCategory).select().single()
        if (!error && data) return data as MenuCategory
      } catch (err) {
        console.warn('Supabase createCategory failed, using fallback:', err)
      }
    }
    const current = loadStore<MenuCategory[]>(STORAGE_KEYS.CATEGORIES, INITIAL_CATEGORIES)
    current.push(newCategory)
    saveStore(STORAGE_KEYS.CATEGORIES, current)
    return newCategory
  }

  async updateCategory(id: string, updates: Partial<MenuCategory>): Promise<MenuCategory> {
    if (isSupabaseConfigured) {
      try {
        const { data, error } = await (supabase.from('menu_categories') as any).update(updates).eq('id', id).select().single()
        if (!error && data) return data as MenuCategory
      } catch (err) {
        console.warn('Supabase updateCategory failed, using fallback:', err)
      }
    }
    const current = loadStore<MenuCategory[]>(STORAGE_KEYS.CATEGORIES, INITIAL_CATEGORIES)
    const idx = current.findIndex((c) => c.id === id)
    if (idx !== -1) {
      current[idx] = { ...current[idx], ...updates, updated_at: new Date().toISOString() }
      saveStore(STORAGE_KEYS.CATEGORIES, current)
      return current[idx]
    }
    throw new Error('Category not found')
  }

  // ----------------------------------------------------
  // MENU ITEMS
  // ----------------------------------------------------
  async getMenuItems(includeInactive = false): Promise<MenuItem[]> {
    if (isSupabaseConfigured) {
      try {
        let query = supabase.from('menu_items').select('*')
        if (!includeInactive) query = query.eq('is_active', true)
        const { data, error } = await query.order('name', { ascending: true })
        if (!error && data) return data as MenuItem[]
      } catch (err) {
        console.warn('Supabase getMenuItems failed, using fallback:', err)
      }
    }
    const items = loadStore<MenuItem[]>(STORAGE_KEYS.MENU_ITEMS, INITIAL_MENU_ITEMS)
    return includeInactive ? items : items.filter((i) => i.is_active)
  }

  async createMenuItem(item: Partial<MenuItem>): Promise<MenuItem> {
    const newItem: MenuItem = {
      id: crypto.randomUUID(),
      category_id: item.category_id || INITIAL_CATEGORIES[0].id,
      name: item.name || 'Item Name',
      description: item.description || null,
      price: item.price ?? 50000,
      image_url:
        item.image_url ||
        'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=600&q=80',
      is_available: item.is_available ?? true,
      is_active: item.is_active ?? true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }
    if (isSupabaseConfigured) {
      try {
        const { data, error } = await (supabase.from('menu_items') as any).insert(newItem).select().single()
        if (!error && data) return data as MenuItem
      } catch (err) {
        console.warn('Supabase createMenuItem failed, using fallback:', err)
      }
    }
    const current = loadStore<MenuItem[]>(STORAGE_KEYS.MENU_ITEMS, INITIAL_MENU_ITEMS)
    current.push(newItem)
    saveStore(STORAGE_KEYS.MENU_ITEMS, current)
    return newItem
  }

  async updateMenuItem(id: string, updates: Partial<MenuItem>): Promise<MenuItem> {
    if (isSupabaseConfigured) {
      try {
        const { data, error } = await (supabase.from('menu_items') as any).update(updates).eq('id', id).select().single()
        if (!error && data) return data as MenuItem
      } catch (err) {
        console.warn('Supabase updateMenuItem failed, using fallback:', err)
      }
    }
    const current = loadStore<MenuItem[]>(STORAGE_KEYS.MENU_ITEMS, INITIAL_MENU_ITEMS)
    const idx = current.findIndex((i) => i.id === id)
    if (idx !== -1) {
      current[idx] = { ...current[idx], ...updates, updated_at: new Date().toISOString() }
      saveStore(STORAGE_KEYS.MENU_ITEMS, current)
      return current[idx]
    }
    throw new Error('Menu item not found')
  }

  async deleteMenuItem(id: string): Promise<void> {
    // Soft delete to maintain historical price and transaction integrity
    await this.updateMenuItem(id, { is_active: false })
  }

  // ----------------------------------------------------
  // TABLES
  // ----------------------------------------------------
  async getTables(): Promise<DiningTable[]> {
    if (isSupabaseConfigured) {
      try {
        const { data, error } = await supabase.from('dining_tables').select('*').order('table_number', { ascending: true })
        if (!error && data) return data as DiningTable[]
      } catch (err) {
        console.warn('Supabase getTables failed, using fallback:', err)
      }
    }
    return loadStore<DiningTable[]>(STORAGE_KEYS.TABLES, INITIAL_TABLES)
  }

  async createTable(table: Partial<DiningTable>): Promise<DiningTable> {
    const newTable: DiningTable = {
      id: crypto.randomUUID(),
      table_number: table.table_number || 'T-99',
      area: table.area || 'Main Dining',
      capacity: table.capacity || 4,
      is_active: table.is_active ?? true,
      current_status: table.current_status || 'available',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }
    if (isSupabaseConfigured) {
      try {
        const { data, error } = await (supabase.from('dining_tables') as any).insert(newTable).select().single()
        if (!error && data) return data as DiningTable
      } catch (err) {
        console.warn('Supabase createTable failed, using fallback:', err)
      }
    }
    const current = loadStore<DiningTable[]>(STORAGE_KEYS.TABLES, INITIAL_TABLES)
    current.push(newTable)
    saveStore(STORAGE_KEYS.TABLES, current)
    return newTable
  }

  async updateTable(id: string, updates: Partial<DiningTable>): Promise<DiningTable> {
    if (isSupabaseConfigured) {
      try {
        const { data, error } = await (supabase.from('dining_tables') as any).update(updates).eq('id', id).select().single()
        if (!error && data) return data as DiningTable
      } catch (err) {
        console.warn('Supabase updateTable failed, using fallback:', err)
      }
    }
    const current = loadStore<DiningTable[]>(STORAGE_KEYS.TABLES, INITIAL_TABLES)
    const idx = current.findIndex((t) => t.id === id)
    if (idx !== -1) {
      current[idx] = { ...current[idx], ...updates, updated_at: new Date().toISOString() }
      saveStore(STORAGE_KEYS.TABLES, current)
      return current[idx]
    }
    throw new Error('Table not found')
  }

  async updateTableStatus(id: string, status: TableStatus): Promise<void> {
    await this.updateTable(id, { current_status: status })
  }

  // ----------------------------------------------------
  // RESERVATIONS & BOOKING
  // ----------------------------------------------------
  async getReservations(filters?: {
    date?: string
    status?: ReservationStatus
    search?: string
  }): Promise<ReservationWithDetails[]> {
    const reservations = loadStore<Reservation[]>(STORAGE_KEYS.RESERVATIONS, INITIAL_RESERVATIONS)
    const tables = loadStore<DiningTable[]>(STORAGE_KEYS.TABLES, INITIAL_TABLES)
    const orders = loadStore<Order[]>(STORAGE_KEYS.ORDERS, INITIAL_ORDERS)
    const orderItems = loadStore<OrderItem[]>(STORAGE_KEYS.ORDER_ITEMS, INITIAL_ORDER_ITEMS)
    const payments = loadStore<Payment[]>(STORAGE_KEYS.PAYMENTS, INITIAL_PAYMENTS)

    let filtered = [...reservations]

    if (filters?.date) {
      filtered = filtered.filter((r) => r.reservation_date === filters.date)
    }

    if (filters?.status) {
      filtered = filtered.filter((r) => r.status === filters.status)
    }

    if (filters?.search) {
      const q = filters.search.toLowerCase()
      filtered = filtered.filter(
        (r) =>
          r.booking_code.toLowerCase().includes(q) ||
          r.customer_name.toLowerCase().includes(q) ||
          r.customer_phone.includes(q)
      )
    }

    return filtered.map((r) => {
      const table = tables.find((t) => t.id === r.table_id) || null
      const order = orders.find((o) => o.reservation_id === r.id) || null
      let orderWithDetails: OrderWithDetails | null = null

      if (order) {
        const items = orderItems.filter((oi) => oi.order_id === order.id)
        const payment = payments.find((p) => p.order_id === order.id) || null
        orderWithDetails = {
          ...order,
          items,
          table,
          reservation: r,
          payment,
        }
      }

      const payment = orderWithDetails?.payment || null

      return {
        ...r,
        table,
        order: orderWithDetails,
        payment,
      }
    })
  }

  async getReservationById(id: string): Promise<ReservationWithDetails | null> {
    const list = await this.getReservations()
    return list.find((r) => r.id === id || r.booking_code === id) || null
  }

  async updateReservationStatus(
    id: string,
    status: ReservationStatus,
    tableId?: string | null
  ): Promise<void> {
    const reservations = loadStore<Reservation[]>(STORAGE_KEYS.RESERVATIONS, INITIAL_RESERVATIONS)
    const tables = loadStore<DiningTable[]>(STORAGE_KEYS.TABLES, INITIAL_TABLES)
    const idx = reservations.findIndex((r) => r.id === id)

    if (idx !== -1) {
      const res = reservations[idx]
      reservations[idx] = {
        ...res,
        status,
        table_id: tableId !== undefined ? tableId : res.table_id,
        updated_at: new Date().toISOString(),
      }

      // Sync table status accordingly
      const targetTableId = tableId !== undefined ? tableId : res.table_id
      if (targetTableId) {
        const tIdx = tables.findIndex((t) => t.id === targetTableId)
        if (tIdx !== -1) {
          if (status === 'seated') tables[tIdx].current_status = 'occupied'
          else if (status === 'completed' || status === 'cancelled') tables[tIdx].current_status = 'cleaning'
          else if (status === 'confirmed') tables[tIdx].current_status = 'reserved'
          saveStore(STORAGE_KEYS.TABLES, tables)
        }
      }

      saveStore(STORAGE_KEYS.RESERVATIONS, reservations)
    }
  }

  async assignTableToReservation(reservationId: string, tableId: string): Promise<void> {
    const tables = await this.getTables()
    const targetTable = tables.find((t) => t.id === tableId)
    if (!targetTable) throw new Error('Table not found')

    await this.updateReservationStatus(reservationId, 'confirmed', tableId)
    await this.updateTableStatus(tableId, 'reserved')
  }

  // ----------------------------------------------------
  // ATOMIC RESERVATION + ORDER CREATION
  // ----------------------------------------------------
  async createReservationAndOrder(payload: {
    customer_name: string
    customer_phone: string
    customer_email?: string
    reservation_date: string
    start_time: string
    guest_count: number
    table_id?: string | null
    notes?: string
    order_type?: 'dine_in' | 'takeaway'
    order_source?: 'online' | 'reservation' | 'walk_in' | 'pos'
    payment_method?: PaymentMethod
    payment_type?: string
    items?: { menu_item_id: string; quantity: number; notes?: string }[]
  }): Promise<{
    reservation_id: string
    booking_code: string
    public_access_token: string
    order_id: string | null
    order_number: string | null
    payment_id: string | null
    payment_reference: string | null
    grand_total: number
    reservation_status: ReservationStatus
    payment_status: PaymentStatus
  }> {
    // If Supabase RPC is configured and live:
    if (isSupabaseConfigured) {
      try {
        const { data, error } = await (supabase as any).rpc('create_reservation_and_order', {
          p_customer_name: payload.customer_name,
          p_customer_phone: payload.customer_phone,
          p_customer_email: payload.customer_email || null,
          p_reservation_date: payload.reservation_date,
          p_start_time: payload.start_time,
          p_guest_count: payload.guest_count,
          p_table_id: payload.table_id || null,
          p_notes: payload.notes || null,
          p_order_type: payload.order_type || 'dine_in',
          p_order_source: payload.order_source || 'online',
          p_payment_method: payload.payment_method || 'qris',
          p_payment_type: payload.payment_type || 'online_simulation',
          p_items: payload.items || [],
        })
        if (!error && data) return data as any
      } catch (err) {
        console.warn('Supabase create_reservation_and_order RPC failed, executing local atomic transaction:', err)
      }
    }

    // Atomic Local Fallback Implementation with DB price re-verification:
    const settings = await this.getSettings()
    const allMenuItems = await this.getMenuItems(true)
    const reservations = loadStore<Reservation[]>(STORAGE_KEYS.RESERVATIONS, INITIAL_RESERVATIONS)
    const orders = loadStore<Order[]>(STORAGE_KEYS.ORDERS, INITIAL_ORDERS)
    const orderItems = loadStore<OrderItem[]>(STORAGE_KEYS.ORDER_ITEMS, INITIAL_ORDER_ITEMS)
    const payments = loadStore<Payment[]>(STORAGE_KEYS.PAYMENTS, INITIAL_PAYMENTS)
    const tickets = loadStore<KitchenTicket[]>(STORAGE_KEYS.KITCHEN_TICKETS, INITIAL_KITCHEN_TICKETS)

    // Check table conflict if table specified
    if (payload.table_id) {
      const conflict = reservations.some(
        (r) =>
          r.table_id === payload.table_id &&
          r.reservation_date === payload.reservation_date &&
          !['cancelled', 'no_show', 'completed'].includes(r.status) &&
          r.start_time.slice(0, 5) === payload.start_time.slice(0, 5)
      )
      if (conflict) {
        throw new Error('Meja yang dipilih sudah terpesan pada jam tersebut. Silakan pilih meja lain.')
      }
    }

    const dateClean = payload.reservation_date.replace(/-/g, '')
    const randSuffix = Math.floor(1000 + Math.random() * 9000).toString()
    const bookingCode = `BK-${dateClean}-${randSuffix}`
    const publicToken = 'tok-' + crypto.randomUUID().replace(/-/g, '')

    const resStatus: ReservationStatus =
      settings.auto_confirm_reservations || payload.order_source === 'walk_in' || payload.order_source === 'pos'
        ? 'confirmed'
        : 'pending'

    const reservationId = crypto.randomUUID()
    const newReservation: Reservation = {
      id: reservationId,
      booking_code: bookingCode,
      customer_name: payload.customer_name,
      customer_phone: payload.customer_phone,
      customer_email: payload.customer_email || null,
      reservation_date: payload.reservation_date,
      start_time: payload.start_time,
      end_time: '21:30:00',
      guest_count: payload.guest_count,
      table_id: payload.table_id || null,
      notes: payload.notes || null,
      status: resStatus,
      source: payload.order_source || 'online',
      public_access_token: publicToken,
      created_by: null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }
    reservations.unshift(newReservation)
    saveStore(STORAGE_KEYS.RESERVATIONS, reservations)

    let orderId: string | null = null
    let orderNumber: string | null = null
    let paymentId: string | null = null
    let paymentRef: string | null = null
    let grandTotal = 0

    if (payload.items && payload.items.length > 0) {
      orderId = crypto.randomUUID()
      orderNumber = `ORD-${dateClean}-${randSuffix}`

      // Recalculate true prices from database menu items
      let subtotal = 0
      const createdItems: OrderItem[] = []

      for (const reqItem of payload.items) {
        const dbItem = allMenuItems.find((m) => m.id === reqItem.menu_item_id)
        if (!dbItem) continue
        const lineTotal = dbItem.price * reqItem.quantity
        subtotal += lineTotal

        createdItems.push({
          id: crypto.randomUUID(),
          order_id: orderId,
          menu_item_id: dbItem.id,
          item_name_snapshot: dbItem.name,
          unit_price_snapshot: dbItem.price,
          quantity: reqItem.quantity,
          notes: reqItem.notes || null,
          line_total: lineTotal,
          kitchen_status: 'new',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
      }

      const taxAmount = settings.tax_enabled ? Math.round((subtotal * settings.tax_rate) / 100) : 0
      const serviceAmount = settings.service_charge_enabled
        ? Math.round((subtotal * settings.service_charge_rate) / 100)
        : 0
      grandTotal = subtotal + taxAmount + serviceAmount

      const newOrder: Order = {
        id: orderId,
        order_number: orderNumber,
        reservation_id: reservationId,
        table_id: payload.table_id || null,
        customer_name: payload.customer_name,
        customer_phone: payload.customer_phone,
        order_type: payload.order_type || 'dine_in',
        source: (payload.order_source as any) || 'online',
        status: resStatus === 'confirmed' ? 'confirmed' : 'pending',
        subtotal,
        discount_amount: 0,
        tax_amount: taxAmount,
        service_charge_amount: serviceAmount,
        grand_total: grandTotal,
        payment_status: 'unpaid',
        notes: payload.notes || null,
        idempotency_key: `idem-${orderNumber}`,
        created_by: null,
        confirmed_at: resStatus === 'confirmed' ? new Date().toISOString() : null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      }

      orders.unshift(newOrder)
      orderItems.unshift(...createdItems)
      saveStore(STORAGE_KEYS.ORDERS, orders)
      saveStore(STORAGE_KEYS.ORDER_ITEMS, orderItems)

      // Payment record
      paymentId = crypto.randomUUID()
      paymentRef = `PAY-${dateClean}-${randSuffix}`
      const newPayment: Payment = {
        id: paymentId,
        order_id: orderId,
        payment_reference: paymentRef,
        method: payload.payment_method || 'qris',
        payment_type: payload.payment_type || 'online_simulation',
        amount: grandTotal,
        status: 'unpaid',
        provider_reference: null,
        confirmed_by: null,
        paid_at: null,
        is_demo: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      }
      payments.unshift(newPayment)
      saveStore(STORAGE_KEYS.PAYMENTS, payments)

      // Kitchen Ticket if confirmed
      if (resStatus === 'confirmed') {
        const ticketId = crypto.randomUUID()
        const newTicket: KitchenTicket = {
          id: ticketId,
          order_id: orderId,
          ticket_number: `KT-${randSuffix}`,
          status: 'new',
          sent_at: new Date().toISOString(),
          started_at: null,
          ready_at: null,
          served_at: null,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        }
        tickets.unshift(newTicket)
        saveStore(STORAGE_KEYS.KITCHEN_TICKETS, tickets)
      }
    }

    return {
      reservation_id: reservationId,
      booking_code: bookingCode,
      public_access_token: publicToken,
      order_id: orderId,
      order_number: orderNumber,
      payment_id: paymentId,
      payment_reference: paymentRef,
      grand_total: grandTotal,
      reservation_status: resStatus,
      payment_status: 'unpaid',
    }
  }

  // ----------------------------------------------------
  // ORDERS
  // ----------------------------------------------------
  async getOrders(filters?: {
    status?: OrderStatus
    source?: string
    search?: string
    date?: string
  }): Promise<OrderWithDetails[]> {
    const orders = loadStore<Order[]>(STORAGE_KEYS.ORDERS, INITIAL_ORDERS)
    const orderItems = loadStore<OrderItem[]>(STORAGE_KEYS.ORDER_ITEMS, INITIAL_ORDER_ITEMS)
    const tables = loadStore<DiningTable[]>(STORAGE_KEYS.TABLES, INITIAL_TABLES)
    const reservations = loadStore<Reservation[]>(STORAGE_KEYS.RESERVATIONS, INITIAL_RESERVATIONS)
    const payments = loadStore<Payment[]>(STORAGE_KEYS.PAYMENTS, INITIAL_PAYMENTS)

    let filtered = [...orders]

    if (filters?.status) {
      filtered = filtered.filter((o) => o.status === filters.status)
    }

    if (filters?.source) {
      filtered = filtered.filter((o) => o.source === filters.source)
    }

    if (filters?.search) {
      const q = filters.search.toLowerCase()
      filtered = filtered.filter(
        (o) =>
          o.order_number.toLowerCase().includes(q) ||
          o.customer_name.toLowerCase().includes(q) ||
          o.customer_phone.includes(q)
      )
    }

    if (filters?.date) {
      filtered = filtered.filter((o) => o.created_at.startsWith(filters.date!))
    }

    return filtered.map((o) => {
      const items = orderItems.filter((oi) => oi.order_id === o.id)
      const table = tables.find((t) => t.id === o.table_id) || null
      const reservation = reservations.find((r) => r.id === o.reservation_id) || null
      const payment = payments.find((p) => p.order_id === o.id) || null

      return {
        ...o,
        items,
        table,
        reservation,
        payment,
      }
    })
  }

  async getOrderById(id: string): Promise<OrderWithDetails | null> {
    const all = await this.getOrders()
    return all.find((o) => o.id === id || o.order_number === id) || null
  }

  async updateOrderStatus(orderId: string, status: OrderStatus): Promise<void> {
    const orders = loadStore<Order[]>(STORAGE_KEYS.ORDERS, INITIAL_ORDERS)
    const idx = orders.findIndex((o) => o.id === orderId)
    if (idx !== -1) {
      orders[idx] = {
        ...orders[idx],
        status,
        confirmed_at: status === 'confirmed' && !orders[idx].confirmed_at ? new Date().toISOString() : orders[idx].confirmed_at,
        updated_at: new Date().toISOString(),
      }
      saveStore(STORAGE_KEYS.ORDERS, orders)
    }
  }

  // ----------------------------------------------------
  // PAYMENTS & SIMULATION
  // ----------------------------------------------------
  async getPayments(filters?: { status?: PaymentStatus; date?: string }): Promise<Payment[]> {
    let payments = loadStore<Payment[]>(STORAGE_KEYS.PAYMENTS, INITIAL_PAYMENTS)
    if (filters?.status) payments = payments.filter((p) => p.status === filters.status)
    if (filters?.date) payments = payments.filter((p) => p.created_at.startsWith(filters.date!))
    return payments
  }

  async processSimulatedPayment(
    paymentRef: string,
    action: 'success' | 'failed' | 'cancel'
  ): Promise<{
    payment_reference: string
    payment_status: PaymentStatus
    order_status: OrderStatus
  }> {
    if (isSupabaseConfigured) {
      try {
        const { data, error } = await (supabase as any).rpc('process_simulated_payment', {
          p_payment_reference: paymentRef,
          p_action: action,
        })
        if (!error && data) return data as any
      } catch (err) {
        console.warn('Supabase process_simulated_payment RPC failed, executing local transaction:', err)
      }
    }

    const payments = loadStore<Payment[]>(STORAGE_KEYS.PAYMENTS, INITIAL_PAYMENTS)
    const orders = loadStore<Order[]>(STORAGE_KEYS.ORDERS, INITIAL_ORDERS)
    const reservations = loadStore<Reservation[]>(STORAGE_KEYS.RESERVATIONS, INITIAL_RESERVATIONS)
    const tickets = loadStore<KitchenTicket[]>(STORAGE_KEYS.KITCHEN_TICKETS, INITIAL_KITCHEN_TICKETS)

    const pIdx = payments.findIndex((p) => p.payment_reference === paymentRef)
    if (pIdx === -1) throw new Error('Payment reference not found')

    const payment = payments[pIdx]
    if (payment.status === 'paid') {
      throw new Error('This payment has already been completed')
    }

    const oIdx = orders.findIndex((o) => o.id === payment.order_id)
    if (oIdx === -1) throw new Error('Order not found for payment')

    let newPayStatus: PaymentStatus = 'unpaid'
    let newOrdStatus: OrderStatus = orders[oIdx].status

    if (action === 'success') {
      newPayStatus = 'paid'
      newOrdStatus = 'confirmed'

      payments[pIdx] = {
        ...payment,
        status: 'paid',
        paid_at: new Date().toISOString(),
        provider_reference: 'SIM-DEMO-' + Math.floor(100000 + Math.random() * 900000),
        updated_at: new Date().toISOString(),
      }

      orders[oIdx] = {
        ...orders[oIdx],
        payment_status: 'paid',
        status: orders[oIdx].status === 'pending' ? 'confirmed' : orders[oIdx].status,
        confirmed_at: orders[oIdx].confirmed_at || new Date().toISOString(),
        updated_at: new Date().toISOString(),
      }

      // If tied to reservation, confirm reservation too
      if (orders[oIdx].reservation_id) {
        const rIdx = reservations.findIndex((r) => r.id === orders[oIdx].reservation_id)
        if (rIdx !== -1 && reservations[rIdx].status === 'pending') {
          reservations[rIdx].status = 'confirmed'
          reservations[rIdx].updated_at = new Date().toISOString()
          saveStore(STORAGE_KEYS.RESERVATIONS, reservations)
        }
      }

      // Create kitchen ticket if not exists
      const ticketExists = tickets.some((t) => t.order_id === orders[oIdx].id)
      if (!ticketExists) {
        tickets.unshift({
          id: crypto.randomUUID(),
          order_id: orders[oIdx].id,
          ticket_number: `KT-${orders[oIdx].order_number.slice(-4)}`,
          status: 'new',
          sent_at: new Date().toISOString(),
          started_at: null,
          ready_at: null,
          served_at: null,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        saveStore(STORAGE_KEYS.KITCHEN_TICKETS, tickets)
      }
    } else if (action === 'failed') {
      newPayStatus = 'failed'
      payments[pIdx] = {
        ...payment,
        status: 'failed',
        updated_at: new Date().toISOString(),
      }
    } else {
      newPayStatus = 'unpaid'
      payments[pIdx] = {
        ...payment,
        status: 'unpaid',
        updated_at: new Date().toISOString(),
      }
    }

    saveStore(STORAGE_KEYS.PAYMENTS, payments)
    saveStore(STORAGE_KEYS.ORDERS, orders)

    return {
      payment_reference: paymentRef,
      payment_status: newPayStatus,
      order_status: newOrdStatus,
    }
  }

  async processCashierPayment(
    orderId: string,
    method: PaymentMethod,
    amount: number
  ): Promise<Payment> {
    const orders = loadStore<Order[]>(STORAGE_KEYS.ORDERS, INITIAL_ORDERS)
    const payments = loadStore<Payment[]>(STORAGE_KEYS.PAYMENTS, INITIAL_PAYMENTS)

    const oIdx = orders.findIndex((o) => o.id === orderId)
    if (oIdx === -1) throw new Error('Order not found')

    orders[oIdx] = {
      ...orders[oIdx],
      payment_status: 'paid',
      updated_at: new Date().toISOString(),
    }
    saveStore(STORAGE_KEYS.ORDERS, orders)

    const dateClean = new Date().toISOString().slice(0, 10).replace(/-/g, '')
    const rand = Math.floor(1000 + Math.random() * 9000)
    const paymentRef = `PAY-${dateClean}-${rand}`

    const newPayment: Payment = {
      id: crypto.randomUUID(),
      order_id: orderId,
      payment_reference: paymentRef,
      method,
      payment_type: method === 'cash' ? 'onsite_cash' : 'onsite_digital',
      amount,
      status: 'paid',
      provider_reference: method === 'cash' ? `CASH-POS-${rand}` : `DIGITAL-POS-${rand}`,
      confirmed_by: null,
      paid_at: new Date().toISOString(),
      is_demo: true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }

    payments.unshift(newPayment)
    saveStore(STORAGE_KEYS.PAYMENTS, payments)
    return newPayment
  }

  // ----------------------------------------------------
  // KITCHEN DISPLAY SYSTEM (KDS)
  // ----------------------------------------------------
  async getKitchenTickets(): Promise<KitchenTicketWithDetails[]> {
    const tickets = loadStore<KitchenTicket[]>(STORAGE_KEYS.KITCHEN_TICKETS, INITIAL_KITCHEN_TICKETS)
    const orders = loadStore<Order[]>(STORAGE_KEYS.ORDERS, INITIAL_ORDERS)
    const orderItems = loadStore<OrderItem[]>(STORAGE_KEYS.ORDER_ITEMS, INITIAL_ORDER_ITEMS)
    const tables = loadStore<DiningTable[]>(STORAGE_KEYS.TABLES, INITIAL_TABLES)

    return tickets
      .filter((t) => t.status !== 'served' && t.status !== 'cancelled')
      .map((t) => {
        const order = orders.find((o) => o.id === t.order_id)!
        const items = orderItems.filter((oi) => oi.order_id === t.order_id)
        const table = order ? tables.find((tb) => tb.id === order.table_id) || null : null

        const elapsedMinutes = Math.floor(
          (Date.now() - new Date(t.sent_at).getTime()) / 60000
        )

        return {
          ...t,
          order: order || ({} as Order),
          items,
          table,
          elapsedMinutes: Math.max(0, elapsedMinutes),
        }
      })
      .sort((a, b) => new Date(a.sent_at).getTime() - new Date(b.sent_at).getTime())
  }

  async updateKitchenTicket(
    ticketId: string,
    status: KitchenStatus
  ): Promise<void> {
    const tickets = loadStore<KitchenTicket[]>(STORAGE_KEYS.KITCHEN_TICKETS, INITIAL_KITCHEN_TICKETS)
    const orders = loadStore<Order[]>(STORAGE_KEYS.ORDERS, INITIAL_ORDERS)
    const orderItems = loadStore<OrderItem[]>(STORAGE_KEYS.ORDER_ITEMS, INITIAL_ORDER_ITEMS)

    const tIdx = tickets.findIndex((t) => t.id === ticketId)
    if (tIdx === -1) throw new Error('Ticket not found')

    const ticket = tickets[tIdx]
    tickets[tIdx] = {
      ...ticket,
      status,
      started_at: status === 'preparing' && !ticket.started_at ? new Date().toISOString() : ticket.started_at,
      ready_at: status === 'ready' && !ticket.ready_at ? new Date().toISOString() : ticket.ready_at,
      served_at: status === 'served' && !ticket.served_at ? new Date().toISOString() : ticket.served_at,
      updated_at: new Date().toISOString(),
    }
    saveStore(STORAGE_KEYS.KITCHEN_TICKETS, tickets)

    // Sync order status
    const oIdx = orders.findIndex((o) => o.id === ticket.order_id)
    if (oIdx !== -1) {
      if (status === 'preparing') orders[oIdx].status = 'in_preparation'
      else if (status === 'ready') orders[oIdx].status = 'ready'
      else if (status === 'served') orders[oIdx].status = 'served'
      orders[oIdx].updated_at = new Date().toISOString()
      saveStore(STORAGE_KEYS.ORDERS, orders)
    }

    // Sync order item kitchen statuses
    for (let i = 0; i < orderItems.length; i++) {
      if (orderItems[i].order_id === ticket.order_id) {
        orderItems[i].kitchen_status = status
        orderItems[i].updated_at = new Date().toISOString()
      }
    }
    saveStore(STORAGE_KEYS.ORDER_ITEMS, orderItems)
  }

  // ----------------------------------------------------
  // PUBLIC TRACKING
  // ----------------------------------------------------
  async getPublicBookingTracking(
    bookingCode: string,
    identifier: string
  ): Promise<PublicBookingTrackingResult> {
    if (isSupabaseConfigured) {
      try {
        const { data, error } = await (supabase as any).rpc('get_public_booking_tracking', {
          p_booking_code: bookingCode.trim().toUpperCase(),
          p_identifier: identifier.trim(),
        })
        if (!error && data) return data as PublicBookingTrackingResult
      } catch (err) {
        console.warn('Supabase get_public_booking_tracking RPC failed, using local verify:', err)
      }
    }

    const reservations = loadStore<Reservation[]>(STORAGE_KEYS.RESERVATIONS, INITIAL_RESERVATIONS)
    const tables = loadStore<DiningTable[]>(STORAGE_KEYS.TABLES, INITIAL_TABLES)
    const orders = loadStore<Order[]>(STORAGE_KEYS.ORDERS, INITIAL_ORDERS)
    const orderItems = loadStore<OrderItem[]>(STORAGE_KEYS.ORDER_ITEMS, INITIAL_ORDER_ITEMS)
    const payments = loadStore<Payment[]>(STORAGE_KEYS.PAYMENTS, INITIAL_PAYMENTS)

    const cleanCode = bookingCode.trim().toUpperCase()
    const cleanId = identifier.trim().replace(/[\s-+]/g, '')

    const res = reservations.find(
      (r) =>
        r.booking_code.toUpperCase() === cleanCode &&
        (r.public_access_token === identifier.trim() ||
          r.customer_phone.replace(/[\s-+]/g, '') === cleanId ||
          r.customer_phone.replace(/[\s-+]/g, '').endsWith(cleanId.slice(-8)))
    )

    if (!res) {
      throw new Error('Kode reservasi atau verifikasi nomor telepon tidak sesuai.')
    }

    const table = tables.find((t) => t.id === res.table_id)
    const order = orders.find((o) => o.reservation_id === res.id) || null
    let items: any[] = []
    let payment: any = null

    if (order) {
      items = orderItems
        .filter((oi) => oi.order_id === order.id)
        .map((oi) => ({
          id: oi.id,
          item_name: oi.item_name_snapshot,
          unit_price: oi.unit_price_snapshot,
          quantity: oi.quantity,
          line_total: oi.line_total,
          notes: oi.notes,
          kitchen_status: oi.kitchen_status,
        }))
      payment = payments.find((p) => p.order_id === order.id) || null
    }

    return {
      reservation: {
        id: res.id,
        booking_code: res.booking_code,
        customer_name: res.customer_name,
        customer_phone: res.customer_phone,
        reservation_date: res.reservation_date,
        start_time: res.start_time,
        end_time: res.end_time,
        guest_count: res.guest_count,
        status: res.status,
        notes: res.notes,
        created_at: res.created_at,
        public_access_token: res.public_access_token,
        table_number: table?.table_number,
        area: table?.area,
      },
      order: order
        ? {
            id: order.id,
            order_number: order.order_number,
            order_type: order.order_type,
            status: order.status,
            subtotal: order.subtotal,
            tax_amount: order.tax_amount,
            service_charge_amount: order.service_charge_amount,
            grand_total: order.grand_total,
            payment_status: order.payment_status,
            notes: order.notes,
            created_at: order.created_at,
          }
        : null,
      items,
      payment: payment
        ? {
            payment_reference: payment.payment_reference,
            method: payment.method,
            status: payment.status,
            amount: payment.amount,
            paid_at: payment.paid_at,
            is_demo: payment.is_demo,
          }
        : null,
    }
  }

  // ----------------------------------------------------
  // DASHBOARD STATS & REPORTS
  // ----------------------------------------------------
  async getDashboardStats(): Promise<DashboardStats> {
    const reservations = loadStore<Reservation[]>(STORAGE_KEYS.RESERVATIONS, INITIAL_RESERVATIONS)
    const orders = loadStore<Order[]>(STORAGE_KEYS.ORDERS, INITIAL_ORDERS)
    const tables = loadStore<DiningTable[]>(STORAGE_KEYS.TABLES, INITIAL_TABLES)

    const todayStr = new Date().toISOString().split('T')[0]
    const todayRes = reservations.filter((r) => r.reservation_date === todayStr)
    const pendingRes = reservations.filter((r) => r.status === 'pending')
    const todayOrders = orders.filter((o) => o.created_at.startsWith(todayStr))

    // Real revenue: only paid transactions!
    const paidToday = todayOrders.filter((o) => o.payment_status === 'paid')
    const todaySales = paidToday.reduce((sum, o) => sum + Number(o.grand_total), 0)

    const unpaidOrders = orders.filter((o) => o.payment_status === 'unpaid' || o.payment_status === 'pending')
    const unpaidAmount = unpaidOrders.reduce((sum, o) => sum + Number(o.grand_total), 0)

    const availableTables = tables.filter((t) => t.is_active && t.current_status === 'available').length
    const preparingOrders = orders.filter((o) => o.status === 'in_preparation').length
    const readyOrders = orders.filter((o) => o.status === 'ready').length

    return {
      todayReservationsCount: todayRes.length,
      pendingReservationsCount: pendingRes.length,
      todayOrdersCount: todayOrders.length,
      todaySalesAmount: todaySales,
      unpaidOrdersCount: unpaidOrders.length,
      unpaidOrdersAmount: unpaidAmount,
      availableTablesCount: availableTables,
      totalTablesCount: tables.length,
      preparingOrdersCount: preparingOrders,
      readyOrdersCount: readyOrders,
    }
  }

  // ----------------------------------------------------
  // USER MANAGEMENT
  // ----------------------------------------------------
  async getStaffUsers(): Promise<StaffUser[]> {
    return loadStore<StaffUser[]>(STORAGE_KEYS.USERS, DEMO_USERS)
  }

  async updateStaffUser(id: string, updates: Partial<StaffUser>): Promise<void> {
    const users = loadStore<StaffUser[]>(STORAGE_KEYS.USERS, DEMO_USERS)
    const idx = users.findIndex((u) => u.id === id)
    if (idx !== -1) {
      users[idx] = { ...users[idx], ...updates }
      saveStore(STORAGE_KEYS.USERS, users)
    }
  }

  async createStaffUser(user: Partial<StaffUser>): Promise<StaffUser> {
    const users = loadStore<StaffUser[]>(STORAGE_KEYS.USERS, DEMO_USERS)
    const newUser: StaffUser = {
      id: crypto.randomUUID(),
      email: user.email || 'staff@kko.resto',
      full_name: user.full_name || 'Staff Member',
      role: user.role || 'cashier',
      is_active: user.is_active ?? true,
    }
    users.push(newUser)
    saveStore(STORAGE_KEYS.USERS, users)
    return newUser
  }
}

export const restaurantService = new RestaurantService()
