-- ====================================================================
-- RESTAURANT RESERVATION, ORDERING, POS & KITCHEN SCHEMA
-- ====================================================================

-- 1. Enable UUID Extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 2. Custom Types / ENUMs
CREATE TYPE user_role AS ENUM ('admin', 'cashier', 'kitchen');
CREATE TYPE reservation_status AS ENUM ('pending', 'confirmed', 'seated', 'completed', 'cancelled', 'no_show');
CREATE TYPE order_status AS ENUM ('pending', 'confirmed', 'in_preparation', 'ready', 'served', 'completed', 'cancelled');
CREATE TYPE kitchen_status AS ENUM ('new', 'preparing', 'ready', 'served', 'cancelled');
CREATE TYPE payment_status AS ENUM ('unpaid', 'pending', 'paid', 'failed', 'refunded');
CREATE TYPE payment_method AS ENUM ('qris', 'bank_transfer', 'e_wallet', 'cash');
CREATE TYPE order_type AS ENUM ('dine_in', 'takeaway');
CREATE TYPE order_source AS ENUM ('online', 'reservation', 'walk_in', 'pos');
CREATE TYPE table_status AS ENUM ('available', 'reserved', 'occupied', 'cleaning', 'inactive');

-- 3. Profiles (Linked to Supabase auth.users)
CREATE TABLE IF NOT EXISTS profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT NOT NULL,
  role user_role NOT NULL DEFAULT 'cashier',
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 4. Restaurant Settings
CREATE TABLE IF NOT EXISTS restaurant_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  restaurant_name TEXT NOT NULL DEFAULT 'KKO Resto & Bistro',
  logo_url TEXT,
  address TEXT NOT NULL DEFAULT 'Jl. Senopati No. 88, Kebayoran Baru, Jakarta Selatan',
  phone TEXT NOT NULL DEFAULT '+62 812-3456-7890',
  opening_hours JSONB NOT NULL DEFAULT '{"monday": {"open": "10:00", "close": "22:00"}, "tuesday": {"open": "10:00", "close": "22:00"}, "wednesday": {"open": "10:00", "close": "22:00"}, "thursday": {"open": "10:00", "close": "22:00"}, "friday": {"open": "10:00", "close": "23:00"}, "saturday": {"open": "09:00", "close": "23:00"}, "sunday": {"open": "09:00", "close": "22:00"}}'::jsonb,
  timezone TEXT NOT NULL DEFAULT 'Asia/Jakarta',
  tax_enabled BOOLEAN NOT NULL DEFAULT true,
  tax_rate NUMERIC NOT NULL DEFAULT 10.00,
  service_charge_enabled BOOLEAN NOT NULL DEFAULT true,
  service_charge_rate NUMERIC NOT NULL DEFAULT 5.00,
  default_reservation_duration INTEGER NOT NULL DEFAULT 90, -- minutes
  auto_confirm_reservations BOOLEAN NOT NULL DEFAULT false,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 5. Menu Categories
CREATE TABLE IF NOT EXISTS menu_categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  sort_order INTEGER NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 6. Menu Items
CREATE TABLE IF NOT EXISTS menu_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  category_id UUID NOT NULL REFERENCES menu_categories(id) ON DELETE RESTRICT,
  name TEXT NOT NULL,
  description TEXT,
  price NUMERIC NOT NULL CHECK (price >= 0),
  image_url TEXT,
  is_available BOOLEAN NOT NULL DEFAULT true,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 7. Dining Tables
CREATE TABLE IF NOT EXISTS dining_tables (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  table_number TEXT NOT NULL UNIQUE,
  area TEXT NOT NULL DEFAULT 'Main Dining',
  capacity INTEGER NOT NULL CHECK (capacity > 0),
  is_active BOOLEAN NOT NULL DEFAULT true,
  current_status table_status NOT NULL DEFAULT 'available',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 8. Reservations
CREATE TABLE IF NOT EXISTS reservations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_code TEXT NOT NULL UNIQUE,
  customer_name TEXT NOT NULL,
  customer_phone TEXT NOT NULL,
  customer_email TEXT,
  reservation_date DATE NOT NULL,
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  guest_count INTEGER NOT NULL CHECK (guest_count > 0),
  table_id UUID REFERENCES dining_tables(id) ON DELETE SET NULL,
  notes TEXT,
  status reservation_status NOT NULL DEFAULT 'pending',
  source TEXT NOT NULL DEFAULT 'online',
  public_access_token TEXT NOT NULL UNIQUE DEFAULT encode(gen_random_bytes(16), 'hex'),
  created_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 9. Orders
CREATE TABLE IF NOT EXISTS orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_number TEXT NOT NULL UNIQUE,
  reservation_id UUID REFERENCES reservations(id) ON DELETE SET NULL,
  table_id UUID REFERENCES dining_tables(id) ON DELETE SET NULL,
  customer_name TEXT NOT NULL,
  customer_phone TEXT NOT NULL,
  order_type order_type NOT NULL DEFAULT 'dine_in',
  source order_source NOT NULL DEFAULT 'online',
  status order_status NOT NULL DEFAULT 'pending',
  subtotal NUMERIC NOT NULL DEFAULT 0 CHECK (subtotal >= 0),
  discount_amount NUMERIC NOT NULL DEFAULT 0 CHECK (discount_amount >= 0),
  tax_amount NUMERIC NOT NULL DEFAULT 0 CHECK (tax_amount >= 0),
  service_charge_amount NUMERIC NOT NULL DEFAULT 0 CHECK (service_charge_amount >= 0),
  grand_total NUMERIC NOT NULL DEFAULT 0 CHECK (grand_total >= 0),
  payment_status payment_status NOT NULL DEFAULT 'unpaid',
  notes TEXT,
  idempotency_key TEXT UNIQUE,
  created_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
  confirmed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 10. Order Items
CREATE TABLE IF NOT EXISTS order_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  menu_item_id UUID REFERENCES menu_items(id) ON DELETE SET NULL,
  item_name_snapshot TEXT NOT NULL,
  unit_price_snapshot NUMERIC NOT NULL CHECK (unit_price_snapshot >= 0),
  quantity INTEGER NOT NULL CHECK (quantity > 0),
  notes TEXT,
  line_total NUMERIC NOT NULL CHECK (line_total >= 0),
  kitchen_status kitchen_status NOT NULL DEFAULT 'new',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 11. Payments
CREATE TABLE IF NOT EXISTS payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  payment_reference TEXT NOT NULL UNIQUE,
  method payment_method NOT NULL DEFAULT 'qris',
  payment_type TEXT NOT NULL DEFAULT 'online_simulation',
  amount NUMERIC NOT NULL CHECK (amount >= 0),
  status payment_status NOT NULL DEFAULT 'unpaid',
  provider_reference TEXT,
  confirmed_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
  paid_at TIMESTAMPTZ,
  is_demo BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 12. Kitchen Tickets
CREATE TABLE IF NOT EXISTS kitchen_tickets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  ticket_number TEXT NOT NULL UNIQUE,
  status kitchen_status NOT NULL DEFAULT 'new',
  sent_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  started_at TIMESTAMPTZ,
  ready_at TIMESTAMPTZ,
  served_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 13. Audit Trail History Tables
CREATE TABLE IF NOT EXISTS order_status_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  old_status TEXT,
  new_status TEXT NOT NULL,
  changed_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS reservation_status_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  reservation_id UUID NOT NULL REFERENCES reservations(id) ON DELETE CASCADE,
  old_status TEXT,
  new_status TEXT NOT NULL,
  changed_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS payment_status_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  payment_id UUID NOT NULL REFERENCES payments(id) ON DELETE CASCADE,
  old_status TEXT,
  new_status TEXT NOT NULL,
  changed_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_reservations_date ON reservations(reservation_date, start_time);
CREATE INDEX IF NOT EXISTS idx_reservations_code ON reservations(booking_code);
CREATE INDEX IF NOT EXISTS idx_reservations_phone ON reservations(customer_phone);
CREATE INDEX IF NOT EXISTS idx_orders_number ON orders(order_number);
CREATE INDEX IF NOT EXISTS idx_orders_date ON orders(created_at);
CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status);
CREATE INDEX IF NOT EXISTS idx_orders_payment_status ON orders(payment_status);
CREATE INDEX IF NOT EXISTS idx_payments_ref ON payments(payment_reference);
CREATE INDEX IF NOT EXISTS idx_kitchen_status ON kitchen_tickets(status);
CREATE INDEX IF NOT EXISTS idx_menu_items_cat ON menu_items(category_id);

-- Enable Row Level Security (RLS) on all tables
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE restaurant_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE menu_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE menu_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE dining_tables ENABLE ROW LEVEL SECURITY;
ALTER TABLE reservations ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE kitchen_tickets ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_status_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE reservation_status_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE payment_status_history ENABLE ROW LEVEL SECURITY;

-- Helper function to check role of authenticated user
CREATE OR REPLACE FUNCTION current_user_role()
RETURNS user_role
LANGUAGE sql
STABLE
AS $$
  SELECT role FROM profiles WHERE id = auth.uid();
$$;

-- RLS Policies

-- Public / Anonymous access policies
CREATE POLICY "Public can view active menu categories" ON menu_categories
  FOR SELECT TO anon, authenticated USING (is_active = true);

CREATE POLICY "Public can view active and available menu items" ON menu_items
  FOR SELECT TO anon, authenticated USING (is_active = true);

CREATE POLICY "Public can view active tables" ON dining_tables
  FOR SELECT TO anon, authenticated USING (is_active = true);

CREATE POLICY "Public can view restaurant settings" ON restaurant_settings
  FOR SELECT TO anon, authenticated USING (true);

-- Staff Policies (Authenticated)
CREATE POLICY "Staff can view their own profile" ON profiles
  FOR SELECT TO authenticated USING (id = auth.uid());

CREATE POLICY "Admin can view and manage all profiles" ON profiles
  FOR ALL TO authenticated USING (current_user_role() = 'admin');

CREATE POLICY "Admin can manage restaurant settings" ON restaurant_settings
  FOR ALL TO authenticated USING (current_user_role() = 'admin');

CREATE POLICY "Admin can manage menu categories" ON menu_categories
  FOR ALL TO authenticated USING (current_user_role() = 'admin');

CREATE POLICY "Admin can manage menu items" ON menu_items
  FOR ALL TO authenticated USING (current_user_role() = 'admin');

CREATE POLICY "Staff can view and update dining tables" ON dining_tables
  FOR ALL TO authenticated USING (current_user_role() IN ('admin', 'cashier'));

CREATE POLICY "Staff can view and manage reservations" ON reservations
  FOR ALL TO authenticated USING (current_user_role() IN ('admin', 'cashier'));

CREATE POLICY "Staff can view orders" ON orders
  FOR SELECT TO authenticated USING (current_user_role() IN ('admin', 'cashier', 'kitchen'));

CREATE POLICY "Admin and Cashier can manage orders" ON orders
  FOR ALL TO authenticated USING (current_user_role() IN ('admin', 'cashier'));

CREATE POLICY "Staff can view order items" ON order_items
  FOR SELECT TO authenticated USING (current_user_role() IN ('admin', 'cashier', 'kitchen'));

CREATE POLICY "Kitchen staff can update kitchen status on order items" ON order_items
  FOR UPDATE TO authenticated USING (current_user_role() IN ('admin', 'kitchen'));

CREATE POLICY "Staff can view payments" ON payments
  FOR SELECT TO authenticated USING (current_user_role() IN ('admin', 'cashier'));

CREATE POLICY "Admin and Cashier can manage payments" ON payments
  FOR ALL TO authenticated USING (current_user_role() IN ('admin', 'cashier'));

CREATE POLICY "Kitchen staff can view and update kitchen tickets" ON kitchen_tickets
  FOR ALL TO authenticated USING (current_user_role() IN ('admin', 'kitchen', 'cashier'));

CREATE POLICY "Staff can view audit histories" ON order_status_history
  FOR SELECT TO authenticated USING (current_user_role() IN ('admin', 'cashier'));

CREATE POLICY "Staff can view reservation histories" ON reservation_status_history
  FOR SELECT TO authenticated USING (current_user_role() IN ('admin', 'cashier'));

CREATE POLICY "Staff can view payment histories" ON payment_status_history
  FOR SELECT TO authenticated USING (current_user_role() IN ('admin', 'cashier'));
