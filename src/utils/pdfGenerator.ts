import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'
import { formatIDR, formatDate, formatTime, formatDateTime } from './formatters'
import { RestaurantSettings, ReservationWithDetails, OrderWithDetails, Payment } from '@/types/domain'

/**
 * Generate and download Booking Confirmation PDF
 */
export function generateBookingPDF(
  reservation: ReservationWithDetails,
  settings: RestaurantSettings
): void {
  const doc = new jsPDF()

  // Header background banner (Olive Green)
  doc.setFillColor(74, 93, 78) // #4A5D4E
  doc.rect(0, 0, 210, 36, 'F')

  // Restaurant Name & Header
  doc.setTextColor(255, 255, 255)
  doc.setFontSize(20)
  doc.setFont('helvetica', 'bold')
  doc.text(settings.restaurant_name, 14, 18)

  doc.setFontSize(9)
  doc.setFont('helvetica', 'normal')
  doc.text(`${settings.address} | Telp: ${settings.phone}`, 14, 26)

  // Document Title
  doc.setTextColor(36, 40, 43)
  doc.setFontSize(16)
  doc.setFont('helvetica', 'bold')
  doc.text('BOOKING CONFIRMATION', 14, 48)

  doc.setFontSize(10)
  doc.setFont('helvetica', 'normal')
  doc.setTextColor(100, 100, 100)
  doc.text(`Kode Booking: ${reservation.booking_code}`, 14, 55)
  doc.text(`Tanggal Cetak: ${formatDateTime(new Date().toISOString())}`, 14, 61)

  // Customer & Reservation Details Table
  const tableData = [
    ['Nama Tamu', reservation.customer_name],
    ['Nomor Telepon', reservation.customer_phone],
    ['Email', reservation.customer_email || '-'],
    ['Tanggal Reservasi', formatDate(reservation.reservation_date)],
    ['Waktu Reservasi', `${formatTime(reservation.start_time)} s/d ${formatTime(reservation.end_time)}`],
    ['Jumlah Tamu', `${reservation.guest_count} Orang`],
    ['Meja Alokasi', reservation.table ? `${reservation.table.table_number} (${reservation.table.area})` : 'Akan ditentukan saat kedatangan'],
    ['Status Booking', reservation.status.toUpperCase()],
    ['Catatan Khusus', reservation.notes || 'Tidak ada catatan'],
  ]

  autoTable(doc, {
    startY: 68,
    head: [['Informasi Reservasi', 'Rincian']],
    body: tableData,
    theme: 'striped',
    headStyles: {
      fillColor: [74, 93, 78],
      textColor: 255,
      fontStyle: 'bold',
    },
    styles: {
      fontSize: 10,
      cellPadding: 4,
    },
    columnStyles: {
      0: { fontStyle: 'bold', cellWidth: 60 },
    },
  })

  // Linked Order Summary if items exist
  if (reservation.order && reservation.order.items && reservation.order.items.length > 0) {
    const finalY = (doc as any).lastAutoTable.finalY + 12
    doc.setFontSize(12)
    doc.setFont('helvetica', 'bold')
    doc.setTextColor(36, 40, 43)
    doc.text('Pesanan Makanan Terkait:', 14, finalY)

    const orderBody = reservation.order.items.map((item) => [
      item.item_name_snapshot,
      item.quantity.toString(),
      formatIDR(item.unit_price_snapshot),
      formatIDR(item.line_total),
    ])

    orderBody.push(
      ['Subtotal', '', '', formatIDR(reservation.order.subtotal)],
      ['Pajak Restoran (PB1)', '', '', formatIDR(reservation.order.tax_amount)],
      ['Service Charge', '', '', formatIDR(reservation.order.service_charge_amount)],
      ['Grand Total', '', '', formatIDR(reservation.order.grand_total)]
    )

    autoTable(doc, {
      startY: finalY + 4,
      head: [['Menu', 'Qty', 'Harga Satuan', 'Total']],
      body: orderBody,
      theme: 'grid',
      headStyles: {
        fillColor: [90, 115, 95],
        textColor: 255,
      },
      styles: { fontSize: 9, cellPadding: 3 },
    })
  }

  // Footer notes
  const pageHeight = doc.internal.pageSize.height
  doc.setFontSize(8)
  doc.setTextColor(140, 140, 140)
  doc.text(
    'Harap tunjukkan dokumen konfirmasi ini kepada resepsionis atau kasir saat tiba di restoran.',
    14,
    pageHeight - 16
  )
  doc.text('Terima kasih telah memilih KKO Resto & Bistro. Kami siap melayani Anda!', 14, pageHeight - 11)

  doc.save(`Booking_${reservation.booking_code}.pdf`)
}

/**
 * Generate Bill / Order Summary PDF (Pre-payment or payment review)
 */
export function generateBillPDF(
  order: OrderWithDetails,
  settings: RestaurantSettings
): void {
  const doc = new jsPDF()

  // Header background banner (Charcoal)
  doc.setFillColor(36, 40, 43)
  doc.rect(0, 0, 210, 36, 'F')

  doc.setTextColor(255, 255, 255)
  doc.setFontSize(20)
  doc.setFont('helvetica', 'bold')
  doc.text(settings.restaurant_name, 14, 18)

  doc.setFontSize(9)
  doc.setFont('helvetica', 'normal')
  doc.text(`${settings.address} | Telp: ${settings.phone}`, 14, 26)

  // Title
  doc.setTextColor(36, 40, 43)
  doc.setFontSize(16)
  doc.setFont('helvetica', 'bold')
  const title = order.payment_status === 'paid' ? 'PAID RECEIPT' : 'BILL / ORDER SUMMARY'
  doc.text(title, 14, 48)

  doc.setFontSize(10)
  doc.setFont('helvetica', 'normal')
  doc.setTextColor(100, 100, 100)
  doc.text(`Nomor Order: ${order.order_number}`, 14, 55)
  doc.text(`Nama Pelanggan: ${order.customer_name} (${order.customer_phone})`, 14, 61)
  doc.text(
    `Tipe: ${order.order_type === 'dine_in' ? 'Dine In' : 'Takeaway'} | Meja: ${
      order.table?.table_number || '-'
    }`,
    14,
    67
  )
  doc.text(`Waktu Order: ${formatDateTime(order.created_at)}`, 14, 73)

  // Order Items
  const itemsData = (order.items || []).map((item) => [
    item.item_name_snapshot + (item.notes ? ` (${item.notes})` : ''),
    item.quantity.toString(),
    formatIDR(item.unit_price_snapshot),
    formatIDR(item.line_total),
  ])

  itemsData.push(
    ['Subtotal', '', '', formatIDR(order.subtotal)],
    ['Diskon', '', '', formatIDR(order.discount_amount)],
    ['Pajak Restoran (10%)', '', '', formatIDR(order.tax_amount)],
    ['Service Charge (5%)', '', '', formatIDR(order.service_charge_amount)],
    ['GRAND TOTAL', '', '', formatIDR(order.grand_total)]
  )

  autoTable(doc, {
    startY: 80,
    head: [['Item Pesanan', 'Qty', 'Harga', 'Total']],
    body: itemsData,
    theme: 'grid',
    headStyles: {
      fillColor: [74, 93, 78],
      textColor: 255,
      fontStyle: 'bold',
    },
    styles: { fontSize: 9, cellPadding: 3 },
  })

  const finalY = (doc as any).lastAutoTable.finalY + 14

  // Payment Status Box
  if (order.payment_status === 'paid') {
    doc.setFillColor(236, 253, 245) // light green
    doc.setDrawColor(16, 185, 129)
    doc.rect(14, finalY, 182, 22, 'FD')
    doc.setTextColor(5, 150, 105)
    doc.setFontSize(14)
    doc.setFont('helvetica', 'bold')
    doc.text('LUNAS / PAID', 20, finalY + 14)

    doc.setFontSize(9)
    doc.setFont('helvetica', 'normal')
    doc.setTextColor(80, 80, 80)
    doc.text(`Metode: ${order.payment?.method?.toUpperCase() || 'CASH/DIGITAL'}`, 110, finalY + 10)
    doc.text(`Ref: ${order.payment?.payment_reference || '-'}`, 110, finalY + 16)
  } else {
    doc.setFillColor(254, 242, 242) // light red
    doc.setDrawColor(239, 68, 68)
    doc.rect(14, finalY, 182, 18, 'FD')
    doc.setTextColor(220, 38, 38)
    doc.setFontSize(12)
    doc.setFont('helvetica', 'bold')
    doc.text('BELUM LUNAS (UNPAID)', 20, finalY + 12)
  }

  doc.save(`Bill_${order.order_number}.pdf`)
}

/**
 * Generate Paid Receipt PDF
 */
export function generateReceiptPDF(
  order: OrderWithDetails,
  payment: Payment,
  settings: RestaurantSettings
): void {
  generateBillPDF({ ...order, payment, payment_status: 'paid' }, settings)
}
