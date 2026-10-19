import {
  Database,
  UserRole,
  ReservationStatus,
  OrderStatus,
  KitchenStatus,
  PaymentStatus,
  PaymentMethod,
  OrderType,
  OrderSource,
  TableStatus,
} from './database.types'

export type {
  UserRole,
  ReservationStatus,
  OrderStatus,
  KitchenStatus,
  PaymentStatus,
  PaymentMethod,
  OrderType,
  OrderSource,
  TableStatus,
}

export type Profile = Database['public']['Tables']['profiles']['Row']
export type RestaurantSettings = Database['public']['Tables']['restaurant_settings']['Row']
export type MenuCategory = Database['public']['Tables']['menu_categories']['Row']
export type MenuItem = Database['public']['Tables']['menu_items']['Row']
export type DiningTable = Database['public']['Tables']['dining_tables']['Row']
export type Reservation = Database['public']['Tables']['reservations']['Row']
export type Order = Database['public']['Tables']['orders']['Row']
export type OrderItem = Database['public']['Tables']['order_items']['Row']
export type Payment = Database['public']['Tables']['payments']['Row']
export type KitchenTicket = Database['public']['Tables']['kitchen_tickets']['Row']

export interface CartItem {
  menuItem: MenuItem
  quantity: number
  notes: string
  lineTotal: number
}

export interface OrderWithDetails extends Order {
  items: OrderItem[]
  table?: DiningTable | null
  reservation?: Reservation | null
  payment?: Payment | null
}

export interface ReservationWithDetails extends Reservation {
  table?: DiningTable | null
  order?: OrderWithDetails | null
  payment?: Payment | null
}

export interface KitchenTicketWithDetails extends KitchenTicket {
  order: Order
  items: OrderItem[]
  table?: DiningTable | null
  elapsedMinutes?: number
}

export interface DashboardStats {
  todayReservationsCount: number
  pendingReservationsCount: number
  todayOrdersCount: number
  todaySalesAmount: number // Only paid transactions
  unpaidOrdersCount: number
  unpaidOrdersAmount: number
  availableTablesCount: number
  totalTablesCount: number
  preparingOrdersCount: number
  readyOrdersCount: number
}

export interface PublicBookingTrackingResult {
  reservation: {
    id: string
    booking_code: string
    customer_name: string
    customer_phone: string
    reservation_date: string
    start_time: string
    end_time: string
    guest_count: number
    status: ReservationStatus
    notes: string | null
    created_at: string
    public_access_token: string
    table_number?: string
    area?: string
  }
  order?: {
    id: string
    order_number: string
    order_type: OrderType
    status: OrderStatus
    subtotal: number
    tax_amount: number
    service_charge_amount: number
    grand_total: number
    payment_status: PaymentStatus
    notes: string | null
    created_at: string
  } | null
  items: {
    id: string
    item_name: string
    unit_price: number
    quantity: number
    line_total: number
    notes: string | null
    kitchen_status: KitchenStatus
  }[]
  payment?: {
    payment_reference: string
    method: PaymentMethod
    status: PaymentStatus
    amount: number
    paid_at: string | null
    is_demo: boolean
  } | null
}

export interface StaffUser {
  id: string
  email: string
  full_name: string
  role: UserRole
  is_active: boolean
}
