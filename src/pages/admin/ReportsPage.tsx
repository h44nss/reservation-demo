import React, { useState, useEffect } from 'react'
import {
  BarChart3,
  Download,
  Calendar,
  DollarSign,
  ShoppingBag,
  TrendingUp,
  FileSpreadsheet,
  FileText,
  PieChart,
  Layers,
} from 'lucide-react'
import { restaurantService } from '@/services/restaurantService'
import { OrderWithDetails, Payment, ReservationWithDetails } from '@/types/domain'
import { formatIDR, formatDate } from '@/utils/formatters'
import { useToast } from '@/components/ui/Toast'
import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'

export const ReportsPage: React.FC = () => {
  const toast = useToast()
  const [orders, setOrders] = useState<OrderWithDetails[]>([])
  const [payments, setPayments] = useState<Payment[]>([])
  const [reservations, setReservations] = useState<ReservationWithDetails[]>([])
  const [loading, setLoading] = useState(true)
  const [period, setPeriod] = useState<'today' | '7days' | 'month' | 'all'>('month')

  useEffect(() => {
    Promise.all([
      restaurantService.getOrders(),
      restaurantService.getPayments(),
      restaurantService.getReservations(),
    ])
      .then(([ords, pays, res]) => {
        setOrders(ords)
        setPayments(pays)
        setReservations(res)
      })
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [])

  // Filter by period
  const filterByDate = (dateStr: string) => {
    const itemDate = new Date(dateStr)
    const now = new Date()
    if (period === 'today') {
      return itemDate.toDateString() === now.toDateString()
    } else if (period === '7days') {
      const sevenDaysAgo = new Date(now.getTime() - 7 * 86400000)
      return itemDate >= sevenDaysAgo
    } else if (period === 'month') {
      return itemDate.getMonth() === now.getMonth() && itemDate.getFullYear() === now.getFullYear()
    }
    return true
  }

  const periodOrders = orders.filter((o) => filterByDate(o.created_at))
  const paidOrders = periodOrders.filter((o) => o.payment_status === 'paid')
  const unpaidOrders = periodOrders.filter((o) => o.payment_status !== 'paid')

  // Real paid revenue vs pipeline
  const totalPaidRevenue = paidOrders.reduce((sum, o) => sum + Number(o.grand_total), 0)
  const totalUnpaidAmount = unpaidOrders.reduce((sum, o) => sum + Number(o.grand_total), 0)
  const averageOrderValue = paidOrders.length > 0 ? Math.round(totalPaidRevenue / paidOrders.length) : 0

  // Top selling menu items aggregation
  const itemCounts: { [name: string]: { qty: number; revenue: number } } = {}
  for (const ord of paidOrders) {
    for (const item of ord.items || []) {
      if (!itemCounts[item.item_name_snapshot]) {
        itemCounts[item.item_name_snapshot] = { qty: 0, revenue: 0 }
      }
      itemCounts[item.item_name_snapshot].qty += item.quantity
      itemCounts[item.item_name_snapshot].revenue += Number(item.line_total)
    }
  }

  const topItems = Object.entries(itemCounts)
    .map(([name, data]) => ({ name, ...data }))
    .sort((a, b) => b.qty - a.qty)
    .slice(0, 5)

  // Payment method breakdown
  const methodTotals: { [method: string]: number } = {}
  for (const ord of paidOrders) {
    const method = ord.payment?.method || 'cash'
    methodTotals[method] = (methodTotals[method] || 0) + Number(ord.grand_total)
  }

  // Export CSV
  const handleExportCSV = () => {
    const rows = [
      ['No Order', 'Customer', 'Tipe', 'Sumber', 'Status Order', 'Status Bayar', 'Grand Total', 'Waktu'],
      ...periodOrders.map((o) => [
        o.order_number,
        o.customer_name,
        o.order_type,
        o.source,
        o.status,
        o.payment_status,
        o.grand_total.toString(),
        o.created_at,
      ]),
    ]
    const csvContent = 'data:text/csv;charset=utf-8,' + rows.map((e) => e.join(',')).join('\n')
    const encodedUri = encodeURI(csvContent)
    const link = document.createElement('a')
    link.setAttribute('href', encodedUri)
    link.setAttribute('download', `Laporan_Penjualan_KKO_${period}.csv`)
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    toast.success('Laporan CSV berhasil diexport!')
  }

  // Export PDF Report
  const handleExportPDF = () => {
    const doc = new jsPDF()

    doc.setFillColor(74, 93, 78)
    doc.rect(0, 0, 210, 30, 'F')
    doc.setTextColor(255, 255, 255)
    doc.setFontSize(18)
    doc.setFont('helvetica', 'bold')
    doc.text('LAPORAN KINERJA PENJUALAN & RESTORAN', 14, 16)
    doc.setFontSize(9)
    doc.setFont('helvetica', 'normal')
    doc.text(`Periode: ${period.toUpperCase()} | Dicetak: ${new Date().toLocaleString('id-ID')}`, 14, 24)

    // Summary KPIs
    doc.setTextColor(36, 40, 43)
    doc.setFontSize(11)
    doc.setFont('helvetica', 'bold')
    doc.text('Ringkasan Keuangan:', 14, 40)

    const summaryData = [
      ['Total Pembayaran Diterima (Lunas)', formatIDR(totalPaidRevenue)],
      ['Total Order Lunas', `${paidOrders.length} Transaksi`],
      ['Rata-rata Nilai Transaksi (AOV)', formatIDR(averageOrderValue)],
      ['Transaksi Belum Lunas (Pending/Unpaid)', `${unpaidOrders.length} Order (${formatIDR(totalUnpaidAmount)})`],
    ]

    autoTable(doc, {
      startY: 44,
      body: summaryData,
      theme: 'grid',
      styles: { fontSize: 10, cellPadding: 3 },
      columnStyles: { 0: { fontStyle: 'bold', width: 100 } },
    })

    // Top Selling Items Table
    const finalY = (doc as any).lastAutoTable.finalY + 12
    doc.setFontSize(11)
    doc.setFont('helvetica', 'bold')
    doc.text('Menu Terlaris (Top Selling Items):', 14, finalY)

    const topItemsData = topItems.map((item, idx) => [
      `#${idx + 1} ${item.name}`,
      `${item.qty} porsi`,
      formatIDR(item.revenue),
    ])

    autoTable(doc, {
      startY: finalY + 4,
      head: [['Menu Hidangan', 'Kuantitas Terjual', 'Total Omset']],
      body: topItemsData,
      theme: 'striped',
      headStyles: { fillColor: [74, 93, 78], textColor: 255 },
      styles: { fontSize: 9, cellPadding: 3 },
    })

    doc.save(`Laporan_Resto_${period}.pdf`)
    toast.success('Laporan PDF berhasil dibuat dan diunduh!')
  }

  return (
    <div className="space-y-6">
      {/* Header & Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold font-serif text-charcoal-900">
            Laporan Penjualan & Operasional
          </h1>
          <p className="text-xs text-neutral-500 mt-1">
            Analisis pendapatan bersih yang telah lunas, performa menu terlaris, dan ekspor dokumen.
          </p>
        </div>

        {/* Period Selector & Export Actions */}
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex bg-neutral-200/80 p-1 rounded-xl text-xs font-bold">
            <button
              onClick={() => setPeriod('today')}
              className={`px-3 py-1.5 rounded-lg transition ${
                period === 'today' ? 'bg-white text-charcoal-900 shadow-sm' : 'text-neutral-600 hover:text-charcoal-900'
              }`}
            >
              Hari Ini
            </button>
            <button
              onClick={() => setPeriod('7days')}
              className={`px-3 py-1.5 rounded-lg transition ${
                period === '7days' ? 'bg-white text-charcoal-900 shadow-sm' : 'text-neutral-600 hover:text-charcoal-900'
              }`}
            >
              7 Hari
            </button>
            <button
              onClick={() => setPeriod('month')}
              className={`px-3 py-1.5 rounded-lg transition ${
                period === 'month' ? 'bg-white text-charcoal-900 shadow-sm' : 'text-neutral-600 hover:text-charcoal-900'
              }`}
            >
              Bulan Ini
            </button>
            <button
              onClick={() => setPeriod('all')}
              className={`px-3 py-1.5 rounded-lg transition ${
                period === 'all' ? 'bg-white text-charcoal-900 shadow-sm' : 'text-neutral-600 hover:text-charcoal-900'
              }`}
            >
              Semua
            </button>
          </div>

          <button
            onClick={handleExportCSV}
            className="px-3.5 py-2 bg-white border border-neutral-300 text-neutral-700 hover:bg-neutral-50 rounded-xl text-xs font-bold transition flex items-center gap-1.5 shadow-sm"
          >
            <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
            <span>Export CSV</span>
          </button>

          <button
            onClick={handleExportPDF}
            className="px-3.5 py-2 bg-olive-700 hover:bg-olive-800 text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 shadow-sm"
          >
            <FileText className="w-4 h-4" />
            <span>Export PDF</span>
          </button>
        </div>
      </div>

      {/* Primary Financial Summaries */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <div className="bg-white p-5 rounded-2xl border border-neutral-200/90 shadow-subtle space-y-2">
          <span className="text-xs font-bold uppercase tracking-wider text-neutral-500 block">
            Pendapatan Diterima (Lunas)
          </span>
          <div className="text-2xl font-black text-emerald-700">{formatIDR(totalPaidRevenue)}</div>
          <p className="text-[11px] text-neutral-500">Dari {paidOrders.length} transaksi yang telah lunas</p>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-neutral-200/90 shadow-subtle space-y-2">
          <span className="text-xs font-bold uppercase tracking-wider text-neutral-500 block">
            Transaksi Belum Lunas
          </span>
          <div className="text-2xl font-black text-rose-700">{formatIDR(totalUnpaidAmount)}</div>
          <p className="text-[11px] text-neutral-500">{unpaidOrders.length} order menunggu pelunasan</p>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-neutral-200/90 shadow-subtle space-y-2">
          <span className="text-xs font-bold uppercase tracking-wider text-neutral-500 block">
            Rata-rata Transaksi (AOV)
          </span>
          <div className="text-2xl font-black text-charcoal-900">{formatIDR(averageOrderValue)}</div>
          <p className="text-[11px] text-neutral-500">Per transaksi yang terselesaikan</p>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-neutral-200/90 shadow-subtle space-y-2">
          <span className="text-xs font-bold uppercase tracking-wider text-neutral-500 block">
            Total Reservasi
          </span>
          <div className="text-2xl font-black text-olive-800">{reservations.length} Booking</div>
          <p className="text-[11px] text-neutral-500">Reservasi meja masuk ke sistem</p>
        </div>
      </div>

      {/* Analytical Breakdown: Top Menu Items & Payment Methods */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top Selling Items */}
        <div className="bg-white rounded-2xl border border-neutral-200/90 p-6 space-y-4 shadow-subtle">
          <h3 className="font-bold text-base text-charcoal-900 flex items-center gap-2 pb-2 border-b border-neutral-100">
            <TrendingUp className="w-4 h-4 text-olive-700" />
            <span>Menu Terlaris (Top Selling Items)</span>
          </h3>

          <div className="space-y-3 text-xs">
            {topItems.length === 0 ? (
              <p className="text-neutral-400 py-6 text-center">Belum ada data penjualan pada periode ini.</p>
            ) : (
              topItems.map((item, idx) => (
                <div key={item.name} className="flex items-center justify-between p-3 rounded-xl bg-neutral-50 border border-neutral-100">
                  <div className="flex items-center gap-3">
                    <span className="w-6 h-6 rounded-full bg-olive-100 text-olive-800 font-bold flex items-center justify-center text-xs">
                      {idx + 1}
                    </span>
                    <div>
                      <div className="font-bold text-charcoal-900">{item.name}</div>
                      <div className="text-neutral-500">{item.qty} porsi terjual</div>
                    </div>
                  </div>
                  <span className="font-extrabold text-charcoal-900">{formatIDR(item.revenue)}</span>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Payment Methods Distribution */}
        <div className="bg-white rounded-2xl border border-neutral-200/90 p-6 space-y-4 shadow-subtle">
          <h3 className="font-bold text-base text-charcoal-900 flex items-center gap-2 pb-2 border-b border-neutral-100">
            <PieChart className="w-4 h-4 text-olive-700" />
            <span>Distribusi Metode Pembayaran</span>
          </h3>

          <div className="space-y-3 text-xs">
            {Object.keys(methodTotals).length === 0 ? (
              <p className="text-neutral-400 py-6 text-center">Belum ada transaksi lunas pada periode ini.</p>
            ) : (
              Object.entries(methodTotals).map(([method, amount]) => {
                const percentage = totalPaidRevenue > 0 ? Math.round((amount / totalPaidRevenue) * 100) : 0
                return (
                  <div key={method} className="space-y-1.5 p-3 rounded-xl bg-neutral-50 border border-neutral-100">
                    <div className="flex justify-between font-bold text-charcoal-900">
                      <span className="uppercase">{method}</span>
                      <span>{formatIDR(amount)} ({percentage}%)</span>
                    </div>
                    <div className="w-full bg-neutral-200 rounded-full h-2 overflow-hidden">
                      <div
                        className="bg-olive-700 h-2 rounded-full transition-all duration-500"
                        style={{ width: `${percentage}%` }}
                      />
                    </div>
                  </div>
                )
              })
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
