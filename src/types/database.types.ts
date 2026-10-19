export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type UserRole = 'admin' | 'cashier' | 'kitchen'
export type ReservationStatus = 'pending' | 'confirmed' | 'seated' | 'completed' | 'cancelled' | 'no_show'
export type OrderStatus = 'pending' | 'confirmed' | 'in_preparation' | 'ready' | 'served' | 'completed' | 'cancelled'
export type KitchenStatus = 'new' | 'preparing' | 'ready' | 'served' | 'cancelled'
export type PaymentStatus = 'unpaid' | 'pending' | 'paid' | 'failed' | 'refunded'
export type PaymentMethod = 'qris' | 'bank_transfer' | 'e_wallet' | 'cash'
export type OrderType = 'dine_in' | 'takeaway'
export type OrderSource = 'online' | 'reservation' | 'walk_in' | 'pos'
export type TableStatus = 'available' | 'reserved' | 'occupied' | 'cleaning' | 'inactive'

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string
          full_name: string
          role: UserRole
          is_active: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          full_name: string
          role?: UserRole
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          full_name?: string
          role?: UserRole
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
      }
      restaurant_settings: {
        Row: {
          id: string
          restaurant_name: string
          logo_url: string | null
          address: string
          phone: string
          opening_hours: Json
          timezone: string
          tax_enabled: boolean
          tax_rate: number
          service_charge_enabled: boolean
          service_charge_rate: number
          default_reservation_duration: number
          auto_confirm_reservations: boolean
          updated_at: string
        }
        Insert: {
          id?: string
          restaurant_name?: string
          logo_url?: string | null
          address?: string
          phone?: string
          opening_hours?: Json
          timezone?: string
          tax_enabled?: boolean
          tax_rate?: number
          service_charge_enabled?: boolean
          service_charge_rate?: number
          default_reservation_duration?: number
          auto_confirm_reservations?: boolean
          updated_at?: string
        }
        Update: {
          id?: string
          restaurant_name?: string
          logo_url?: string | null
          address?: string
          phone?: string
          opening_hours?: Json
          timezone?: string
          tax_enabled?: boolean
          tax_rate?: number
          service_charge_enabled?: boolean
          service_charge_rate?: number
          default_reservation_duration?: number
          auto_confirm_reservations?: boolean
          updated_at?: string
        }
      }
      menu_categories: {
        Row: {
          id: string
          name: string
          description: string | null
          sort_order: number
          is_active: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          description?: string | null
          sort_order?: number
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          description?: string | null
          sort_order?: number
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
      }
      menu_items: {
        Row: {
          id: string
          category_id: string
          name: string
          description: string | null
          price: number
          image_url: string | null
          is_available: boolean
          is_active: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          category_id: string
          name: string
          description?: string | null
          price: number
          image_url?: string | null
          is_available?: boolean
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          category_id?: string
          name?: string
          description?: string | null
          price?: number
          image_url?: string | null
          is_available?: boolean
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
      }
      dining_tables: {
        Row: {
          id: string
          table_number: string
          area: string
          capacity: number
          is_active: boolean
          current_status: TableStatus
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          table_number: string
          area?: string
          capacity: number
          is_active?: boolean
          current_status?: TableStatus
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          table_number?: string
          area?: string
          capacity?: number
          is_active?: boolean
          current_status?: TableStatus
          created_at?: string
          updated_at?: string
        }
      }
      reservations: {
        Row: {
          id: string
          booking_code: string
          customer_name: string
          customer_phone: string
          customer_email: string | null
          reservation_date: string
          start_time: string
          end_time: string
          guest_count: number
          table_id: string | null
          notes: string | null
          status: ReservationStatus
          source: string
          public_access_token: string
          created_by: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          booking_code: string
          customer_name: string
          customer_phone: string
          customer_email?: string | null
          reservation_date: string
          start_time: string
          end_time: string
          guest_count: number
          table_id?: string | null
          notes?: string | null
          status?: ReservationStatus
          source?: string
          public_access_token?: string
          created_by?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          booking_code?: string
          customer_name?: string
          customer_phone?: string
          customer_email?: string | null
          reservation_date?: string
          start_time?: string
          end_time?: string
          guest_count?: number
          table_id?: string | null
          notes?: string | null
          status?: ReservationStatus
          source?: string
          public_access_token?: string
          created_by?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      orders: {
        Row: {
          id: string
          order_number: string
          reservation_id: string | null
          table_id: string | null
          customer_name: string
          customer_phone: string
          order_type: OrderType
          source: OrderSource
          status: OrderStatus
          subtotal: number
          discount_amount: number
          tax_amount: number
          service_charge_amount: number
          grand_total: number
          payment_status: PaymentStatus
          notes: string | null
          idempotency_key: string | null
          created_by: string | null
          confirmed_at: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          order_number: string
          reservation_id?: string | null
          table_id?: string | null
          customer_name: string
          customer_phone: string
          order_type?: OrderType
          source?: OrderSource
          status?: OrderStatus
          subtotal?: number
          discount_amount?: number
          tax_amount?: number
          service_charge_amount?: number
          grand_total?: number
          payment_status?: PaymentStatus
          notes?: string | null
          idempotency_key?: string | null
          created_by?: string | null
          confirmed_at?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          order_number?: string
          reservation_id?: string | null
          table_id?: string | null
          customer_name?: string
          customer_phone?: string
          order_type?: OrderType
          source?: OrderSource
          status?: OrderStatus
          subtotal?: number
          discount_amount?: number
          tax_amount?: number
          service_charge_amount?: number
          grand_total?: number
          payment_status?: PaymentStatus
          notes?: string | null
          idempotency_key?: string | null
          created_by?: string | null
          confirmed_at?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      order_items: {
        Row: {
          id: string
          order_id: string
          menu_item_id: string | null
          item_name_snapshot: string
          unit_price_snapshot: number
          quantity: number
          notes: string | null
          line_total: number
          kitchen_status: KitchenStatus
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          order_id: string
          menu_item_id?: string | null
          item_name_snapshot: string
          unit_price_snapshot: number
          quantity: number
          notes?: string | null
          line_total: number
          kitchen_status?: KitchenStatus
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          order_id?: string
          menu_item_id?: string | null
          item_name_snapshot?: string
          unit_price_snapshot?: number
          quantity?: number
          notes?: string | null
          line_total?: number
          kitchen_status?: KitchenStatus
          created_at?: string
          updated_at?: string
        }
      }
      payments: {
        Row: {
          id: string
          order_id: string
          payment_reference: string
          method: PaymentMethod
          payment_type: string
          amount: number
          status: PaymentStatus
          provider_reference: string | null
          confirmed_by: string | null
          paid_at: string | null
          is_demo: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          order_id: string
          payment_reference: string
          method?: PaymentMethod
          payment_type?: string
          amount: number
          status?: PaymentStatus
          provider_reference?: string | null
          confirmed_by?: string | null
          paid_at?: string | null
          is_demo?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          order_id?: string
          payment_reference?: string
          method?: PaymentMethod
          payment_type?: string
          amount?: number
          status?: PaymentStatus
          provider_reference?: string | null
          confirmed_by?: string | null
          paid_at?: string | null
          is_demo?: boolean
          created_at?: string
          updated_at?: string
        }
      }
      kitchen_tickets: {
        Row: {
          id: string
          order_id: string
          ticket_number: string
          status: KitchenStatus
          sent_at: string
          started_at: string | null
          ready_at: string | null
          served_at: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          order_id: string
          ticket_number: string
          status?: KitchenStatus
          sent_at?: string
          started_at?: string | null
          ready_at?: string | null
          served_at?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          order_id?: string
          ticket_number?: string
          status?: KitchenStatus
          sent_at?: string
          started_at?: string | null
          ready_at?: string | null
          served_at?: string | null
          created_at?: string
          updated_at?: string
        }
      }
    }
  }
}
