-- ====================================================================
-- SEED DATA FOR KKO RESTO & BISTRO
-- ====================================================================

-- 1. Restaurant Settings
INSERT INTO restaurant_settings (
  id,
  restaurant_name,
  logo_url,
  address,
  phone,
  opening_hours,
  timezone,
  tax_enabled,
  tax_rate,
  service_charge_enabled,
  service_charge_rate,
  default_reservation_duration,
  auto_confirm_reservations
) VALUES (
  '00000000-0000-0000-0000-000000000001',
  'KKO Resto & Bistro',
  'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&w=300&q=80',
  'Jl. Senopati No. 88, Kebayoran Baru, Jakarta Selatan 12190',
  '+62 812-3456-7890',
  '{"monday": {"open": "10:00", "close": "22:00"}, "tuesday": {"open": "10:00", "close": "22:00"}, "wednesday": {"open": "10:00", "close": "22:00"}, "thursday": {"open": "10:00", "close": "22:00"}, "friday": {"open": "10:00", "close": "23:00"}, "saturday": {"open": "09:00", "close": "23:00"}, "sunday": {"open": "09:00", "close": "22:00"}}'::jsonb,
  'Asia/Jakarta',
  true,
  10.00,
  true,
  5.00,
  90,
  false
) ON CONFLICT (id) DO UPDATE SET restaurant_name = EXCLUDED.restaurant_name;

-- 2. Dining Tables
INSERT INTO dining_tables (id, table_number, area, capacity, is_active, current_status) VALUES
('10000000-0000-0000-0000-000000000001', 'T-01', 'Indoor AC', 2, true, 'available'),
('10000000-0000-0000-0000-000000000002', 'T-02', 'Indoor AC', 4, true, 'reserved'),
('10000000-0000-0000-0000-000000000003', 'T-03', 'Indoor AC', 4, true, 'occupied'),
('10000000-0000-0000-0000-000000000004', 'T-04', 'Outdoor Garden', 6, true, 'available'),
('10000000-0000-0000-0000-000000000005', 'T-05', 'VIP Lounge', 8, true, 'cleaning'),
('10000000-0000-0000-0000-000000000006', 'T-06', 'Outdoor Garden', 4, true, 'available'),
('10000000-0000-0000-0000-000000000007', 'T-07', 'Rooftop Bar', 2, true, 'available'),
('10000000-0000-0000-0000-000000000008', 'T-08', 'VIP Private Room', 10, true, 'available')
ON CONFLICT (table_number) DO NOTHING;

-- 3. Menu Categories
INSERT INTO menu_categories (id, name, description, sort_order, is_active) VALUES
('20000000-0000-0000-0000-000000000001', 'Main Course', 'Hidangan utama pilihan chef dengan cita rasa nusantara & modern', 1, true),
('20000000-0000-0000-0000-000000000002', 'Appetizers', 'Pembuka selera yang menggugah selera sebelum hidangan utama', 2, true),
('20000000-0000-0000-0000-000000000003', 'Snacks', 'Camilan renyah dan gurih pas untuk dinikmati bersama teman', 3, true),
('20000000-0000-0000-0000-000000000004', 'Coffee', 'Biji kopi single origin Nusantara racikan barista bersertifikasi', 4, true),
('20000000-0000-0000-0000-000000000005', 'Non-Coffee', 'Minuman segar buah alami, teh artisan, dan mocktail rempah', 5, true),
('20000000-0000-0000-0000-000000000006', 'Desserts', 'Penutup manis khas fusion modern warisan kuliner Indonesia', 6, true)
ON CONFLICT (id) DO NOTHING;

-- 4. Menu Items
INSERT INTO menu_items (id, category_id, name, description, price, image_url, is_available, is_active) VALUES
('30000000-0000-0000-0000-000000000001', '20000000-0000-0000-0000-000000000001', 'Nasi Goreng Wagyu Kecombrang', 'Nasi goreng aromatik bunga kecombrang dengan daging wagyu MB5 empuk dan telur mata sapi', 85000, 'https://images.unsplash.com/photo-1603133872878-684f208fb84b?auto=format&fit=crop&w=600&q=80', true, true),
('30000000-0000-0000-0000-000000000002', '20000000-0000-0000-0000-000000000001', 'Bebek Goreng Renyah Ubud', 'Bebek marinasi 12 rempah khas Bali digoreng renyah, disajikan dengan 3 jenis sambal dan lalapan', 95000, 'https://images.unsplash.com/photo-1514944298352-f472852bdf70?auto=format&fit=crop&w=600&q=80', true, true),
('30000000-0000-0000-0000-000000000003', '20000000-0000-0000-0000-000000000001', 'Salmon Lodeh Modern Fusion', 'Pan-seared Tasmanian salmon disajikan di atas kuah sayur lodeh gurih berempah dan nasi daun jeruk', 120000, 'https://images.unsplash.com/photo-1467003909585-2f8a72700288?auto=format&fit=crop&w=600&q=80', true, true),
('30000000-0000-0000-0000-000000000004', '20000000-0000-0000-0000-000000000001', 'Sate Ayam Bumbu Kacang Madura', '10 tusuk sate daging ayam pilihan dibakar arang batok, bumbu kacang lembut kental dan lontong pulen', 55000, 'https://images.unsplash.com/photo-1555939594-58d7cb561ad1?auto=format&fit=crop&w=600&q=80', true, true),
('30000000-0000-0000-0000-000000000005', '20000000-0000-0000-0000-000000000001', 'Rawon Surabaya Iga Sapi', 'Sup hitam pekat kluwek khas Jawa Timur dengan iga sapi super empuk, tauge pendek, telur asin, dan sambal', 88000, 'https://images.unsplash.com/photo-1547928576-a4a33237cbc3?auto=format&fit=crop&w=600&q=80', true, true),

('30000000-0000-0000-0000-000000000006', '20000000-0000-0000-0000-000000000002', 'Tahu Telur Petis Krispi', 'Tahu telur renyah berselimut telur krispi, disiram petis udang khas Sidoarjo dengan taburan kacang tanah', 38000, 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=600&q=80', true, true),
('30000000-0000-0000-0000-000000000007', '20000000-0000-0000-0000-000000000002', 'Bakwan Jagung Udang Mayo', 'Bakwan jagung manis renyah dengan potongan udang segar dan cocolan spicy garlic mayonnaise', 32000, 'https://images.unsplash.com/photo-1565299585323-38d6b0865b47?auto=format&fit=crop&w=600&q=80', true, true),

('30000000-0000-0000-0000-000000000008', '20000000-0000-0000-0000-000000000003', 'Tempe Mendoan Sambal Kecap', 'Tempe kedelai fermentasi alami digoreng setengah matang berbalur daun bawang dan sambal rawit kecap', 28000, 'https://images.unsplash.com/photo-1626082927389-6cd097cdc6ec?auto=format&fit=crop&w=600&q=80', true, true),
('30000000-0000-0000-0000-000000000009', '20000000-0000-0000-0000-000000000003', 'Singkong Goreng Garlic Keju', 'Singkong merekah empuk dengan rendaman bawang putih gurih dan taburan keju cheddar melimpah', 25000, 'https://images.unsplash.com/photo-1589301760014-d929f3979dbc?auto=format&fit=crop&w=600&q=80', true, true),

('30000000-0000-0000-0000-000000000010', '20000000-0000-0000-0000-000000000004', 'KKO Signature Aren Latte', 'Espresso double shot dipadu susu creamy segar dan sirup gula aren organik premium', 35000, 'https://images.unsplash.com/photo-1541167760496-1628856ab772?auto=format&fit=crop&w=600&q=80', true, true),
('30000000-0000-0000-0000-000000000011', '20000000-0000-0000-0000-000000000004', 'V60 Manual Brew Aceh Gayo', 'Kopi filter pour-over dengan profil rasa fruity peach, citrus hint, dan clean aftertaste', 40000, 'https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?auto=format&fit=crop&w=600&q=80', true, true),

('30000000-0000-0000-0000-000000000012', '20000000-0000-0000-0000-000000000005', 'Artisan Uji Matcha Latte', 'Bubuk matcha murni dari Uji Kyoto dengan fresh milk oatmilk option dan foam halus', 38000, 'https://images.unsplash.com/photo-1536256263959-770b48d82b0a?auto=format&fit=crop&w=600&q=80', true, true),
('30000000-0000-0000-0000-000000000013', '20000000-0000-0000-0000-000000000005', 'Iced Lychee Lemongrass Tea', 'Teh melati wangi dengan buah leci utuh, ekstrak sereh segar, dan sirup mint', 32000, 'https://images.unsplash.com/photo-1556679343-c7306c1976bc?auto=format&fit=crop&w=600&q=80', true, true),

('30000000-0000-0000-0000-000000000014', '20000000-0000-0000-0000-000000000006', 'Pisang Bakar Cokelat Keju Gandum', 'Pisang raja bakar karamel disiram Belgian dark chocolate dan keju parut edam', 35000, 'https://images.unsplash.com/photo-1587314168485-3236d6710814?auto=format&fit=crop&w=600&q=80', true, true),
('30000000-0000-0000-0000-000000000015', '20000000-0000-0000-0000-000000000006', 'Klepon Cake Tart Slice', 'Kue pandan spons lembut berlapis kelapa parut sangrai gula merah aren (Sedang Habis)', 45000, 'https://images.unsplash.com/photo-1578985545062-69928b1d9587?auto=format&fit=crop&w=600&q=80', false, true)
ON CONFLICT (id) DO NOTHING;

-- 5. Seed Reservations
INSERT INTO reservations (
  id, booking_code, customer_name, customer_phone, customer_email,
  reservation_date, start_time, end_time, guest_count, table_id, notes, status, source, public_access_token
) VALUES
('40000000-0000-0000-0000-000000000001', 'BK-20261019-A8F2', 'Budi Santoso', '+6281234567891', 'budi.santoso@email.com', CURRENT_DATE, '18:30:00', '20:00:00', 4, '10000000-0000-0000-0000-000000000002', 'Ulang tahun pernikahan, mohon meja dekat jendela', 'confirmed', 'online', 'demo-token-budi-12345'),
('40000000-0000-0000-0000-000000000002', 'BK-20261019-B4K9', 'Siti Rahmawati', '+6281398765432', 'siti.rahma@email.com', CURRENT_DATE, '19:00:00', '20:30:00', 2, '10000000-0000-0000-0000-000000000001', 'Dinner romantis', 'pending', 'online', 'demo-token-siti-67890'),
('40000000-0000-0000-0000-000000000003', 'BK-20261019-C7D1', 'Hendro Wijaya', '+6281122334455', 'hendro.w@corporate.id', CURRENT_DATE, '13:00:00', '14:30:00', 6, '10000000-0000-0000-0000-000000000004', 'Meeting makan siang bisnis', 'seated', 'online', 'demo-token-hendro-11223'),
('40000000-0000-0000-0000-000000000004', 'BK-20261019-D9E4', 'Dewi Lestari', '+6285712348899', 'dewi.lestari@email.com', CURRENT_DATE - INTERVAL '1 day', '19:30:00', '21:00:00', 4, '10000000-0000-0000-0000-000000000003', 'Selesai tanpa kendala', 'completed', 'online', 'demo-token-dewi-44556'),
('40000000-0000-0000-0000-000000000005', 'BK-20261019-E2M8', 'Fajar Ramadhan', '+6287899887766', 'fajar@email.com', CURRENT_DATE, '20:00:00', '21:30:00', 2, NULL, 'Dibatalkan karena ada agenda mendadak', 'cancelled', 'online', 'demo-token-fajar-77889')
ON CONFLICT (booking_code) DO NOTHING;

-- 6. Seed Orders
INSERT INTO orders (
  id, order_number, reservation_id, table_id, customer_name, customer_phone, order_type, source, status,
  subtotal, discount_amount, tax_amount, service_charge_amount, grand_total, payment_status, notes
) VALUES
('50000000-0000-0000-0000-000000000001', 'ORD-20261019-1001', '40000000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000002', 'Budi Santoso', '+6281234567891', 'dine_in', 'reservation', 'confirmed', 275000, 0, 27500, 13750, 316250, 'paid', 'Jangan terlalu pedas'),
('50000000-0000-0000-0000-000000000002', 'ORD-20261019-1002', '40000000-0000-0000-0000-000000000002', '10000000-0000-0000-0000-000000000001', 'Siti Rahmawati', '+6281398765432', 'dine_in', 'reservation', 'pending', 158000, 0, 15800, 7900, 181700, 'unpaid', 'Kurangi es untuk kopi'),
('50000000-0000-0000-0000-000000000003', 'ORD-20261019-1003', '40000000-0000-0000-0000-000000000003', '10000000-0000-0000-0000-000000000004', 'Hendro Wijaya', '+6281122334455', 'dine_in', 'pos', 'in_preparation', 430000, 0, 43000, 21500, 494500, 'paid', 'Sajikan minuman lebih dulu'),
('50000000-0000-0000-0000-000000000004', 'ORD-20261019-1004', NULL, '10000000-0000-0000-0000-000000000003', 'Walk-in Table 03', '+6289911223344', 'dine_in', 'pos', 'ready', 180000, 0, 18000, 9000, 207000, 'unpaid', 'Makan di tempat'),
('50000000-0000-0000-0000-000000000005', 'ORD-20261019-1005', NULL, NULL, 'Reza Pratama', '+6281223344556', 'takeaway', 'pos', 'completed', 105000, 0, 10500, 5250, 120750, 'paid', 'Bungkus rapi takeaway')
ON CONFLICT (order_number) DO NOTHING;

-- 7. Seed Order Items
INSERT INTO order_items (id, order_id, menu_item_id, item_name_snapshot, unit_price_snapshot, quantity, line_total, notes, kitchen_status) VALUES
('60000000-0000-0000-0000-000000000001', '50000000-0000-0000-0000-000000000001', '30000000-0000-0000-0000-000000000001', 'Nasi Goreng Wagyu Kecombrang', 85000, 2, 170000, 'Sedang pedas', 'new'),
('60000000-0000-0000-0000-000000000002', '50000000-0000-0000-0000-000000000001', '30000000-0000-0000-0000-000000000010', 'KKO Signature Aren Latte', 35000, 2, 70000, 'Less sugar', 'new'),
('60000000-0000-0000-0000-000000000003', '50000000-0000-0000-0000-000000000001', '30000000-0000-0000-0000-000000000014', 'Pisang Bakar Cokelat Keju Gandum', 35000, 1, 35000, 'Ekstra keju', 'new'),

('60000000-0000-0000-0000-000000000004', '50000000-0000-0000-0000-000000000003', '30000000-0000-0000-0000-000000000002', 'Bebek Goreng Renyah Ubud', 95000, 2, 190000, 'Sambal matah dan korek', 'preparing'),
('60000000-0000-0000-0000-000000000005', '50000000-0000-0000-0000-000000000003', '30000000-0000-0000-0000-000000000003', 'Salmon Lodeh Modern Fusion', 120000, 2, 240000, 'Salmon medium well', 'preparing'),

('60000000-0000-0000-0000-000000000006', '50000000-0000-0000-0000-000000000004', '30000000-0000-0000-0000-000000000004', 'Sate Ayam Bumbu Kacang Madura', 55000, 2, 110000, 'Bumbu kacang dipisah', 'ready'),
('60000000-0000-0000-0000-000000000007', '50000000-0000-0000-0000-000000000004', '30000000-0000-0000-0000-000000000010', 'KKO Signature Aren Latte', 35000, 2, 70000, 'Normal sugar', 'ready')
ON CONFLICT (id) DO NOTHING;

-- 8. Seed Payments
INSERT INTO payments (
  id, order_id, payment_reference, method, payment_type, amount, status, provider_reference, paid_at, is_demo
) VALUES
('70000000-0000-0000-0000-000000000001', '50000000-0000-0000-0000-000000000001', 'PAY-20261019-90001', 'qris', 'online_simulation', 316250, 'paid', 'SIM-QRIS-9921', now() - INTERVAL '30 minutes', true),
('70000000-0000-0000-0000-000000000002', '50000000-0000-0000-0000-000000000002', 'PAY-20261019-90002', 'bank_transfer', 'online_simulation', 181700, 'unpaid', NULL, NULL, true),
('70000000-0000-0000-0000-000000000003', '50000000-0000-0000-0000-000000000003', 'PAY-20261019-90003', 'cash', 'onsite_cash', 494500, 'paid', 'CASH-POS-1003', now() - INTERVAL '15 minutes', true),
('70000000-0000-0000-0000-000000000004', '50000000-0000-0000-0000-000000000004', 'PAY-20261019-90004', 'qris', 'onsite_digital', 207000, 'unpaid', NULL, NULL, true),
('70000000-0000-0000-0000-000000000005', '50000000-0000-0000-0000-000000000005', 'PAY-20261019-90005', 'e_wallet', 'onsite_digital', 120750, 'paid', 'SIM-EWL-8812', now() - INTERVAL '45 minutes', true)
ON CONFLICT (payment_reference) DO NOTHING;

-- 9. Seed Kitchen Tickets
INSERT INTO kitchen_tickets (id, order_id, ticket_number, status, sent_at, started_at, ready_at) VALUES
('80000000-0000-0000-0000-000000000001', '50000000-0000-0000-0000-000000000001', 'KT-1001', 'new', now() - INTERVAL '25 minutes', NULL, NULL),
('80000000-0000-0000-0000-000000000003', '50000000-0000-0000-0000-000000000003', 'KT-1003', 'preparing', now() - INTERVAL '20 minutes', now() - INTERVAL '15 minutes', NULL),
('80000000-0000-0000-0000-000000000004', '50000000-0000-0000-0000-000000000004', 'KT-1004', 'ready', now() - INTERVAL '18 minutes', now() - INTERVAL '14 minutes', now() - INTERVAL '2 minutes')
ON CONFLICT (ticket_number) DO NOTHING;
