import { format, parseISO } from 'date-fns'
import {
  ReservationStatus,
  OrderStatus,
  PaymentStatus,
  KitchenStatus,
  TableStatus,
} from '@/types/domain'

/**
 * Format currency into standard Indonesian Rupiah (IDR)
 */
export function formatIDR(amount: number | string | null | undefined): string {
  const numericAmount = typeof amount === 'string' ? parseFloat(amount) : (amount ?? 0)
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    maximumFractionDigits: 0,
  }).format(isNaN(numericAmount) ? 0 : numericAmount)
}

/**
 * Format date string (YYYY-MM-DD) into Indonesian localized string
 */
export function formatDate(dateInput: string | Date | null | undefined): string {
  if (!dateInput) return '-'
  try {
    const d = typeof dateInput === 'string' ? parseISO(dateInput) : dateInput
    return format(d, 'EEEE, d MMMM yyyy')
  } catch {
    return String(dateInput)
  }
}

/**
 * Format time string (HH:mm:ss or HH:mm) into readable time
 */
export function formatTime(timeStr: string | null | undefined): string {
  if (!timeStr) return '-'
  const parts = timeStr.split(':')
  if (parts.length >= 2) {
    return `${parts[0]}:${parts[1]} WIB`
  }
  return timeStr
}

/**
 * Format full ISO datetime string
 */
export function formatDateTime(dateTimeStr: string | Date | null | undefined): string {
  if (!dateTimeStr) return '-'
  try {
    const d = typeof dateTimeStr === 'string' ? parseISO(dateTimeStr) : dateTimeStr
    return format(d, 'd MMM yyyy, HH:mm') + ' WIB'
  } catch {
    return String(dateTimeStr)
  }
}

export function getReservationStatusConfig(status: ReservationStatus) {
  switch (status) {
    case 'pending':
      return { label: 'Menunggu Konfirmasi', bg: 'bg-amber-100 text-amber-800 border-amber-200' }
    case 'confirmed':
      return { label: 'Dikonfirmasi', bg: 'bg-emerald-100 text-emerald-800 border-emerald-200' }
    case 'seated':
      return { label: 'Sedang Duduk', bg: 'bg-blue-100 text-blue-800 border-blue-200' }
    case 'completed':
      return { label: 'Selesai', bg: 'bg-gray-100 text-gray-800 border-gray-200' }
    case 'cancelled':
      return { label: 'Dibatalkan', bg: 'bg-rose-100 text-rose-800 border-rose-200' }
    case 'no_show':
      return { label: 'Tidak Hadir', bg: 'bg-purple-100 text-purple-800 border-purple-200' }
    default:
      return { label: status, bg: 'bg-gray-100 text-gray-800 border-gray-200' }
  }
}

export function getOrderStatusConfig(status: OrderStatus) {
  switch (status) {
    case 'pending':
      return { label: 'Menunggu', bg: 'bg-amber-100 text-amber-800 border-amber-200' }
    case 'confirmed':
      return { label: 'Diterima', bg: 'bg-blue-100 text-blue-800 border-blue-200' }
    case 'in_preparation':
      return { label: 'Diproses Kitchen', bg: 'bg-indigo-100 text-indigo-800 border-indigo-200' }
    case 'ready':
      return { label: 'Siap Disajikan', bg: 'bg-emerald-100 text-emerald-800 border-emerald-200' }
    case 'served':
      return { label: 'Telah Disajikan', bg: 'bg-teal-100 text-teal-800 border-teal-200' }
    case 'completed':
      return { label: 'Selesai', bg: 'bg-gray-100 text-gray-800 border-gray-200' }
    case 'cancelled':
      return { label: 'Dibatalkan', bg: 'bg-rose-100 text-rose-800 border-rose-200' }
    default:
      return { label: status, bg: 'bg-gray-100 text-gray-800 border-gray-200' }
  }
}

export function getPaymentStatusConfig(status: PaymentStatus) {
  switch (status) {
    case 'unpaid':
      return { label: 'Belum Bayar', bg: 'bg-rose-100 text-rose-800 border-rose-200' }
    case 'pending':
      return { label: 'Menunggu Pembayaran', bg: 'bg-amber-100 text-amber-800 border-amber-200' }
    case 'paid':
      return { label: 'Lunas (PAID)', bg: 'bg-emerald-100 text-emerald-800 border-emerald-200' }
    case 'failed':
      return { label: 'Gagal', bg: 'bg-rose-100 text-rose-800 border-rose-200' }
    case 'refunded':
      return { label: 'Dikembalikan', bg: 'bg-purple-100 text-purple-800 border-purple-200' }
    default:
      return { label: status, bg: 'bg-gray-100 text-gray-800 border-gray-200' }
  }
}

export function getKitchenStatusConfig(status: KitchenStatus) {
  switch (status) {
    case 'new':
      return { label: 'Pesanan Baru', bg: 'bg-amber-500 text-white' }
    case 'preparing':
      return { label: 'Sedang Dimasak', bg: 'bg-blue-600 text-white' }
    case 'ready':
      return { label: 'Siap Disajikan', bg: 'bg-emerald-600 text-white' }
    case 'served':
      return { label: 'Telah Diambil', bg: 'bg-gray-500 text-white' }
    case 'cancelled':
      return { label: 'Dibatalkan', bg: 'bg-rose-600 text-white' }
    default:
      return { label: status, bg: 'bg-gray-400 text-white' }
  }
}

export function getTableStatusConfig(status: TableStatus) {
  switch (status) {
    case 'available':
      return { label: 'Tersedia', bg: 'bg-emerald-100 text-emerald-800 border-emerald-300' }
    case 'reserved':
      return { label: 'Dipesan', bg: 'bg-amber-100 text-amber-800 border-amber-300' }
    case 'occupied':
      return { label: 'Terisi', bg: 'bg-rose-100 text-rose-800 border-rose-300' }
    case 'cleaning':
      return { label: 'Dibersihkan', bg: 'bg-blue-100 text-blue-800 border-blue-300' }
    case 'inactive':
      return { label: 'Non-aktif', bg: 'bg-gray-200 text-gray-600 border-gray-300' }
    default:
      return { label: status, bg: 'bg-gray-100 text-gray-800 border-gray-200' }
  }
}
