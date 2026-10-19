-- ====================================================================
-- RPC FUNCTIONS: ATOMIC TRANSACTIONS & SECURE PUBLIC ACCESS
-- ====================================================================

-- 1. Helper function to generate formatted unique code
CREATE OR REPLACE FUNCTION generate_unique_code(prefix TEXT, date_part TEXT, seq_len INT DEFAULT 4)
RETURNS TEXT
LANGUAGE plpgsql
AS $$
DECLARE
  chars TEXT := 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  result TEXT := '';
  i INT;
BEGIN
  FOR i IN 1..seq_len LOOP
    result := result || substr(chars, floor(random() * length(chars) + 1)::int, 1);
  END LOOP;
  RETURN prefix || '-' || date_part || '-' || result;
END;
$$;

-- 2. Atomic Reservation & Order Creation
CREATE OR REPLACE FUNCTION create_reservation_and_order(
  p_customer_name TEXT,
  p_customer_phone TEXT,
  p_customer_email TEXT,
  p_reservation_date DATE,
  p_start_time TIME,
  p_guest_count INT,
  p_table_id UUID DEFAULT NULL,
  p_notes TEXT DEFAULT NULL,
  p_order_type order_type DEFAULT 'dine_in',
  p_order_source order_source DEFAULT 'online',
  p_payment_method payment_method DEFAULT 'qris',
  p_payment_type TEXT DEFAULT 'online_simulation',
  p_items JSONB DEFAULT '[]'::jsonb -- Array of { menu_item_id: UUID, quantity: INT, notes?: TEXT }
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_settings restaurant_settings%ROWTYPE;
  v_end_time TIME;
  v_booking_code TEXT;
  v_order_number TEXT;
  v_payment_ref TEXT;
  v_public_token TEXT;
  v_reservation_id UUID;
  v_order_id UUID := NULL;
  v_payment_id UUID := NULL;
  v_ticket_id UUID := NULL;
  v_subtotal NUMERIC := 0;
  v_tax_amount NUMERIC := 0;
  v_service_amount NUMERIC := 0;
  v_grand_total NUMERIC := 0;
  v_item_record RECORD;
  v_menu_item menu_items%ROWTYPE;
  v_line_total NUMERIC;
  v_date_str TEXT;
  v_has_items BOOLEAN;
  v_conflict_count INT;
  v_auto_confirm BOOLEAN;
  v_res_status reservation_status := 'pending';
  v_order_status order_status := 'pending';
BEGIN
  -- Get restaurant settings
  SELECT * INTO v_settings FROM restaurant_settings LIMIT 1;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Restaurant settings not found';
  END IF;

  v_auto_confirm := COALESCE(v_settings.auto_confirm_reservations, false);
  IF v_auto_confirm OR p_order_source IN ('walk_in', 'pos') THEN
    v_res_status := 'confirmed';
    v_order_status := 'confirmed';
  END IF;

  -- Calculate end time based on settings duration
  v_end_time := p_start_time + (COALESCE(v_settings.default_reservation_duration, 90) || ' minutes')::interval;
  v_date_str := to_char(p_reservation_date, 'YYYYMMDD');
  v_public_token := encode(gen_random_bytes(16), 'hex');

  -- Verify table availability if table_id specified
  IF p_table_id IS NOT NULL THEN
    SELECT COUNT(*) INTO v_conflict_count
    FROM reservations
    WHERE table_id = p_table_id
      AND reservation_date = p_reservation_date
      AND status NOT IN ('cancelled', 'no_show', 'completed')
      AND (
        (start_time <= p_start_time AND end_time > p_start_time) OR
        (start_time < v_end_time AND end_time >= v_end_time) OR
        (start_time >= p_start_time AND end_time <= v_end_time)
      );

    IF v_conflict_count > 0 THEN
      RAISE EXCEPTION 'Table is already booked for the selected time slot';
    END IF;
  END IF;

  -- Generate unique booking code
  LOOP
    v_booking_code := generate_unique_code('BK', v_date_str, 4);
    EXIT WHEN NOT EXISTS (SELECT 1 FROM reservations WHERE booking_code = v_booking_code);
  END LOOP;

  -- Insert Reservation
  INSERT INTO reservations (
    booking_code,
    customer_name,
    customer_phone,
    customer_email,
    reservation_date,
    start_time,
    end_time,
    guest_count,
    table_id,
    notes,
    status,
    source,
    public_access_token
  ) VALUES (
    v_booking_code,
    p_customer_name,
    p_customer_phone,
    p_customer_email,
    p_reservation_date,
    p_start_time,
    v_end_time,
    p_guest_count,
    p_table_id,
    p_notes,
    v_res_status,
    p_order_source::text,
    v_public_token
  ) RETURNING id INTO v_reservation_id;

  INSERT INTO reservation_status_history (reservation_id, old_status, new_status, notes)
  VALUES (v_reservation_id, NULL, v_res_status::text, 'Initial reservation created');

  -- Check if items are provided
  v_has_items := (p_items IS NOT NULL AND jsonb_array_length(p_items) > 0);

  IF v_has_items THEN
    -- Generate unique order number
    LOOP
      v_order_number := generate_unique_code('ORD', v_date_str, 4);
      EXIT WHEN NOT EXISTS (SELECT 1 FROM orders WHERE order_number = v_order_number);
    END LOOP;

    -- Calculate true subtotal from database prices
    FOR v_item_record IN SELECT * FROM jsonb_to_recordset(p_items) AS x(menu_item_id UUID, quantity INT, notes TEXT) LOOP
      SELECT * INTO v_menu_item FROM menu_items WHERE id = v_item_record.menu_item_id AND is_active = true;
      IF NOT FOUND THEN
        RAISE EXCEPTION 'Menu item not found or inactive: %', v_item_record.menu_item_id;
      END IF;

      IF NOT v_menu_item.is_available THEN
        RAISE EXCEPTION 'Menu item is currently out of stock: %', v_menu_item.name;
      END IF;

      v_line_total := v_menu_item.price * v_item_record.quantity;
      v_subtotal := v_subtotal + v_line_total;
    END LOOP;

    -- Calculate taxes & service charge
    IF v_settings.tax_enabled THEN
      v_tax_amount := round((v_subtotal * v_settings.tax_rate) / 100, 2);
    END IF;

    IF v_settings.service_charge_enabled THEN
      v_service_amount := round((v_subtotal * v_settings.service_charge_rate) / 100, 2);
    END IF;

    v_grand_total := v_subtotal + v_tax_amount + v_service_amount;

    -- Insert Order
    INSERT INTO orders (
      order_number,
      reservation_id,
      table_id,
      customer_name,
      customer_phone,
      order_type,
      source,
      status,
      subtotal,
      discount_amount,
      tax_amount,
      service_charge_amount,
      grand_total,
      payment_status,
      notes
    ) VALUES (
      v_order_number,
      v_reservation_id,
      p_table_id,
      p_customer_name,
      p_customer_phone,
      p_order_type,
      p_order_source,
      v_order_status,
      v_subtotal,
      0,
      v_tax_amount,
      v_service_amount,
      v_grand_total,
      'unpaid',
      p_notes
    ) RETURNING id INTO v_order_id;

    INSERT INTO order_status_history (order_id, old_status, new_status, notes)
    VALUES (v_order_id, NULL, v_order_status::text, 'Initial order placed');

    -- Insert Order Items with snapshots
    FOR v_item_record IN SELECT * FROM jsonb_to_recordset(p_items) AS x(menu_item_id UUID, quantity INT, notes TEXT) LOOP
      SELECT * INTO v_menu_item FROM menu_items WHERE id = v_item_record.menu_item_id;
      v_line_total := v_menu_item.price * v_item_record.quantity;

      INSERT INTO order_items (
        order_id,
        menu_item_id,
        item_name_snapshot,
        unit_price_snapshot,
        quantity,
        notes,
        line_total,
        kitchen_status
      ) VALUES (
        v_order_id,
        v_item_record.menu_item_id,
        v_menu_item.name,
        v_menu_item.price,
        v_item_record.quantity,
        v_item_record.notes,
        v_line_total,
        'new'
      );
    END LOOP;

    -- Create initial Payment record
    LOOP
      v_payment_ref := generate_unique_code('PAY', v_date_str, 5);
      EXIT WHEN NOT EXISTS (SELECT 1 FROM payments WHERE payment_reference = v_payment_ref);
    END LOOP;

    INSERT INTO payments (
      order_id,
      payment_reference,
      method,
      payment_type,
      amount,
      status,
      is_demo
    ) VALUES (
      v_order_id,
      v_payment_ref,
      p_payment_method,
      p_payment_type,
      v_grand_total,
      'unpaid',
      true
    ) RETURNING id INTO v_payment_id;

    -- If POS or Walk-in or Auto-confirm, generate kitchen ticket immediately
    IF v_res_status = 'confirmed' THEN
      INSERT INTO kitchen_tickets (
        order_id,
        ticket_number,
        status
      ) VALUES (
        v_order_id,
        'KT-' || substr(v_order_number, length(v_order_number) - 4),
        'new'
      ) RETURNING id INTO v_ticket_id;
    END IF;
  END IF;

  RETURN jsonb_build_object(
    'reservation_id', v_reservation_id,
    'booking_code', v_booking_code,
    'public_access_token', v_public_token,
    'order_id', v_order_id,
    'order_number', v_order_number,
    'payment_id', v_payment_id,
    'payment_reference', v_payment_ref,
    'subtotal', v_subtotal,
    'tax_amount', v_tax_amount,
    'service_charge_amount', v_service_amount,
    'grand_total', v_grand_total,
    'reservation_status', v_res_status,
    'payment_status', 'unpaid'
  );
END;
$$;

-- 3. Atomic Simulated Payment Processing
CREATE OR REPLACE FUNCTION process_simulated_payment(
  p_payment_reference TEXT,
  p_action TEXT -- 'success', 'failed', 'cancel'
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_payment payments%ROWTYPE;
  v_order orders%ROWTYPE;
  v_new_payment_status payment_status;
  v_new_order_status order_status;
  v_ticket_exists BOOLEAN;
BEGIN
  -- Fetch payment record with row lock
  SELECT * INTO v_payment
  FROM payments
  WHERE payment_reference = p_payment_reference
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Payment reference % not found', p_payment_reference;
  END IF;

  -- Prevent duplicate payment
  IF v_payment.status = 'paid' THEN
    RAISE EXCEPTION 'This transaction has already been paid and completed';
  END IF;

  SELECT * INTO v_order
  FROM orders
  WHERE id = v_payment.order_id
  FOR UPDATE;

  IF p_action = 'success' THEN
    v_new_payment_status := 'paid';
    v_new_order_status := 'confirmed';

    -- Update payment
    UPDATE payments
    SET status = 'paid',
        paid_at = now(),
        provider_reference = 'SIM-' || floor(random() * 899999999 + 100000000)::text,
        updated_at = now()
    WHERE id = v_payment.id;

    -- Update order
    UPDATE orders
    SET payment_status = 'paid',
        status = CASE WHEN status = 'pending' THEN 'confirmed' ELSE status END,
        confirmed_at = COALESCE(confirmed_at, now()),
        updated_at = now()
    WHERE id = v_order.id;

    -- If linked to reservation, update reservation status to confirmed if pending
    IF v_order.reservation_id IS NOT NULL THEN
      UPDATE reservations
      SET status = 'confirmed',
          updated_at = now()
      WHERE id = v_order.reservation_id AND status = 'pending';
    END IF;

    -- Check and create Kitchen Ticket if not exists
    SELECT EXISTS(SELECT 1 FROM kitchen_tickets WHERE order_id = v_order.id) INTO v_ticket_exists;
    IF NOT v_ticket_exists THEN
      INSERT INTO kitchen_tickets (
        order_id,
        ticket_number,
        status
      ) VALUES (
        v_order.id,
        'KT-' || substr(v_order.order_number, length(v_order.order_number) - 4),
        'new'
      );
    END IF;

    -- Audit trails
    INSERT INTO payment_status_history (payment_id, old_status, new_status, notes)
    VALUES (v_payment.id, v_payment.status::text, 'paid', 'Simulated online payment success');

    INSERT INTO order_status_history (order_id, old_status, new_status, notes)
    VALUES (v_order.id, v_order.status::text, v_new_order_status::text, 'Payment received; order confirmed');

  ELSIF p_action = 'failed' THEN
    v_new_payment_status := 'failed';

    UPDATE payments
    SET status = 'failed',
        updated_at = now()
    WHERE id = v_payment.id;

    INSERT INTO payment_status_history (payment_id, old_status, new_status, notes)
    VALUES (v_payment.id, v_payment.status::text, 'failed', 'Simulated online payment failed');

  ELSE -- cancel
    v_new_payment_status := 'unpaid';

    UPDATE payments
    SET status = 'unpaid',
        updated_at = now()
    WHERE id = v_payment.id;
  END IF;

  RETURN jsonb_build_object(
    'payment_reference', p_payment_reference,
    'payment_status', v_new_payment_status,
    'order_id', v_order.id,
    'order_status', v_new_order_status
  );
END;
$$;

-- 4. Atomic Kitchen Ticket Status Update
CREATE OR REPLACE FUNCTION update_kitchen_ticket_status(
  p_ticket_id UUID,
  p_status kitchen_status
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_ticket kitchen_tickets%ROWTYPE;
  v_order_status order_status;
BEGIN
  SELECT * INTO v_ticket FROM kitchen_tickets WHERE id = p_ticket_id FOR UPDATE;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Ticket % not found', p_ticket_id;
  END IF;

  IF p_status = 'preparing' THEN
    UPDATE kitchen_tickets
    SET status = p_status,
        started_at = COALESCE(started_at, now()),
        updated_at = now()
    WHERE id = p_ticket_id;

    v_order_status := 'in_preparation';
    UPDATE orders SET status = v_order_status, updated_at = now() WHERE id = v_ticket.order_id;
    UPDATE order_items SET kitchen_status = 'preparing', updated_at = now() WHERE order_id = v_ticket.order_id;

  ELSIF p_status = 'ready' THEN
    UPDATE kitchen_tickets
    SET status = p_status,
        ready_at = COALESCE(ready_at, now()),
        updated_at = now()
    WHERE id = p_ticket_id;

    v_order_status := 'ready';
    UPDATE orders SET status = v_order_status, updated_at = now() WHERE id = v_ticket.order_id;
    UPDATE order_items SET kitchen_status = 'ready', updated_at = now() WHERE order_id = v_ticket.order_id;

  ELSIF p_status = 'served' THEN
    UPDATE kitchen_tickets
    SET status = p_status,
        served_at = COALESCE(served_at, now()),
        updated_at = now()
    WHERE id = p_ticket_id;

    v_order_status := 'served';
    UPDATE orders SET status = v_order_status, updated_at = now() WHERE id = v_ticket.order_id;
    UPDATE order_items SET kitchen_status = 'served', updated_at = now() WHERE order_id = v_ticket.order_id;
  END IF;

  INSERT INTO order_status_history (order_id, old_status, new_status, notes)
  VALUES (v_ticket.order_id, v_ticket.status::text, p_status::text, 'Kitchen status updated');

  RETURN jsonb_build_object(
    'ticket_id', p_ticket_id,
    'ticket_status', p_status,
    'order_status', v_order_status
  );
END;
$$;

-- 5. Secure Public Booking & Order Tracking
CREATE OR REPLACE FUNCTION get_public_booking_tracking(
  p_booking_code TEXT,
  p_identifier TEXT -- Either public_access_token OR customer_phone
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_res reservations%ROWTYPE;
  v_order orders%ROWTYPE;
  v_items JSONB := '[]'::jsonb;
  v_payment payments%ROWTYPE;
  v_table dining_tables%ROWTYPE;
BEGIN
  -- Authenticate public access via booking code + (access token OR phone)
  SELECT * INTO v_res
  FROM reservations
  WHERE booking_code = UPPER(TRIM(p_booking_code))
    AND (
      public_access_token = TRIM(p_identifier)
      OR customer_phone = TRIM(p_identifier)
      OR REPLACE(REPLACE(REPLACE(customer_phone, ' ', ''), '-', ''), '+62', '0') = REPLACE(REPLACE(REPLACE(TRIM(p_identifier), ' ', ''), '-', ''), '+62', '0')
    );

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Booking not found or verification credentials do not match.';
  END IF;

  -- Get table info if assigned
  IF v_res.table_id IS NOT NULL THEN
    SELECT * INTO v_table FROM dining_tables WHERE id = v_res.table_id;
  END IF;

  -- Get linked order
  SELECT * INTO v_order FROM orders WHERE reservation_id = v_res.id LIMIT 1;

  -- Get order items & payment if order exists
  IF v_order.id IS NOT NULL THEN
    SELECT jsonb_agg(
      jsonb_build_object(
        'id', oi.id,
        'item_name', oi.item_name_snapshot,
        'unit_price', oi.unit_price_snapshot,
        'quantity', oi.quantity,
        'line_total', oi.line_total,
        'notes', oi.notes,
        'kitchen_status', oi.kitchen_status
      )
    ) INTO v_items
    FROM order_items oi
    WHERE oi.order_id = v_order.id;

    SELECT * INTO v_payment FROM payments WHERE order_id = v_order.id ORDER BY created_at DESC LIMIT 1;
  END IF;

  RETURN jsonb_build_object(
    'reservation', jsonb_build_object(
      'id', v_res.id,
      'booking_code', v_res.booking_code,
      'customer_name', v_res.customer_name,
      'customer_phone', v_res.customer_phone,
      'reservation_date', v_res.reservation_date,
      'start_time', v_res.start_time,
      'end_time', v_res.end_time,
      'guest_count', v_res.guest_count,
      'status', v_res.status,
      'notes', v_res.notes,
      'created_at', v_res.created_at,
      'public_access_token', v_res.public_access_token,
      'table_number', v_table.table_number,
      'area', v_table.area
    ),
    'order', CASE WHEN v_order.id IS NOT NULL THEN jsonb_build_object(
      'id', v_order.id,
      'order_number', v_order.order_number,
      'order_type', v_order.order_type,
      'status', v_order.status,
      'subtotal', v_order.subtotal,
      'tax_amount', v_order.tax_amount,
      'service_charge_amount', v_order.service_charge_amount,
      'grand_total', v_order.grand_total,
      'payment_status', v_order.payment_status,
      'notes', v_order.notes,
      'created_at', v_order.created_at
    ) ELSE NULL END,
    'items', COALESCE(v_items, '[]'::jsonb),
    'payment', CASE WHEN v_payment.id IS NOT NULL THEN jsonb_build_object(
      'payment_reference', v_payment.payment_reference,
      'method', v_payment.method,
      'status', v_payment.status,
      'amount', v_payment.amount,
      'paid_at', v_payment.paid_at,
      'is_demo', v_payment.is_demo
    ) ELSE NULL END
  );
END;
$$;
