import React, { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import {
  ChefHat,
  Clock,
  CheckCircle2,
  Volume2,
  VolumeX,
  Play,
  Check,
  RefreshCw,
  Flame,
  ArrowRight,
  ChevronLeft,
  AlertCircle,
} from 'lucide-react'
import { restaurantService } from '@/services/restaurantService'
import { KitchenTicketWithDetails, KitchenStatus } from '@/types/domain'
import { formatTime } from '@/utils/formatters'
import { useToast } from '@/components/ui/Toast'

export const KDSPage: React.FC = () => {
  const toast = useToast()
  const [tickets, setTickets] = useState<KitchenTicketWithDetails[]>([])
  const [loading, setLoading] = useState(true)
  const [isMuted, setIsMuted] = useState(false)
  const [currentTime, setCurrentTime] = useState(new Date())

  useEffect(() => {
    loadTickets()

    // Clock ticker every minute
    const timer = setInterval(() => {
      setCurrentTime(new Date())
    }, 30000)

    // Store update event listener
    const handleStoreUpdate = () => {
      restaurantService.getKitchenTickets().then(setTickets).catch(console.error)
    }
    window.addEventListener('kko_store_updated', handleStoreUpdate)

    return () => {
      clearInterval(timer)
      window.removeEventListener('kko_store_updated', handleStoreUpdate)
    }
  }, [])

  const loadTickets = async () => {
    try {
      setLoading(true)
      const data = await restaurantService.getKitchenTickets()
      setTickets(data)
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  // Play audio chime using Web Audio API
  const playAudioChime = () => {
    if (isMuted) return
    try {
      const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)()
      const osc = audioCtx.createOscillator()
      const gain = audioCtx.createGain()
      osc.type = 'sine'
      osc.frequency.setValueAtTime(587.33, audioCtx.currentTime) // D5
      osc.frequency.exponentialRampToValueAtTime(880, audioCtx.currentTime + 0.15) // A5
      gain.gain.setValueAtTime(0.3, audioCtx.currentTime)
      gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.3)
      osc.connect(gain)
      gain.connect(audioCtx.destination)
      osc.start()
      osc.stop(audioCtx.currentTime + 0.3)
    } catch {
      // browser audio policy fallback
    }
  }

  const handleUpdateStatus = async (ticketId: string, status: KitchenStatus) => {
    try {
      await restaurantService.updateKitchenTicket(ticketId, status)
      playAudioChime()
      toast.success(`Tiket dapur diperbarui: ${status.toUpperCase()}`)
      loadTickets()
    } catch (err: any) {
      toast.error(err.message || 'Gagal mengubah status tiket dapur.')
    }
  }

  // Columns
  const newTickets = tickets.filter((t) => t.status === 'new')
  const preparingTickets = tickets.filter((t) => t.status === 'preparing')
  const readyTickets = tickets.filter((t) => t.status === 'ready')

  return (
    <div className="min-h-screen bg-charcoal-950 text-white flex flex-col font-sans">
      {/* KDS Header Bar */}
      <header className="h-16 bg-charcoal-900 border-b border-charcoal-800 px-6 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-4">
          <Link
            to="/admin"
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-charcoal-800 hover:bg-charcoal-700 text-xs font-semibold text-neutral-300 transition"
          >
            <ChevronLeft className="w-4 h-4" />
            <span>Kembali ke Admin</span>
          </Link>
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-amber-500 text-charcoal-950 flex items-center justify-center font-bold">
              <ChefHat className="w-5 h-5" />
            </div>
            <div>
              <span className="font-bold text-base tracking-tight block leading-tight">
                Kitchen Display System (KDS)
              </span>
              <span className="text-[11px] text-neutral-400">
                Layar Operasional Dapur Restoran
              </span>
            </div>
          </div>
        </div>

        {/* Live Clock & Audio Mute Toggle */}
        <div className="flex items-center gap-4">
          <div className="hidden sm:flex items-center gap-2 bg-charcoal-800 px-3 py-1.5 rounded-xl text-xs font-mono font-bold text-neutral-200">
            <Clock className="w-4 h-4 text-amber-400" />
            <span>{currentTime.toLocaleTimeString('id-ID')} WIB</span>
          </div>

          <button
            onClick={() => setIsMuted(!isMuted)}
            className={`p-2 rounded-xl transition ${
              isMuted ? 'bg-charcoal-800 text-neutral-500' : 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
            }`}
            title={isMuted ? 'Suara Notifikasi Senyap' : 'Suara Notifikasi Aktif'}
          >
            {isMuted ? <VolumeX className="w-5 h-5" /> : <Volume2 className="w-5 h-5" />}
          </button>

          <button
            onClick={loadTickets}
            className="p-2 rounded-xl bg-charcoal-800 hover:bg-charcoal-700 text-neutral-300 transition"
            title="Refresh Antrean"
          >
            <RefreshCw className="w-5 h-5" />
          </button>
        </div>
      </header>

      {/* 3 Columns KDS Kanban Board */}
      <div className="flex-1 p-6 grid grid-cols-1 md:grid-cols-3 gap-6 overflow-hidden">
        {/* Column 1: New Orders */}
        <div className="flex flex-col bg-charcoal-900/60 rounded-3xl border border-charcoal-800 overflow-hidden">
          <div className="p-4 bg-amber-950/40 border-b border-amber-900/40 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-amber-500 animate-ping" />
              <h3 className="font-bold text-sm tracking-wide uppercase text-amber-300">
                Pesanan Baru Masuk
              </h3>
            </div>
            <span className="px-2.5 py-0.5 rounded-full bg-amber-500 text-charcoal-950 font-black text-xs">
              {newTickets.length}
            </span>
          </div>

          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {newTickets.length === 0 ? (
              <div className="text-center py-24 text-neutral-500 text-xs">
                Tidak ada pesanan baru yang menunggu.
              </div>
            ) : (
              newTickets.map((ticket) => (
                <div
                  key={ticket.id}
                  className="bg-charcoal-800/90 border border-amber-500/30 rounded-2xl p-5 space-y-4 shadow-lg hover:border-amber-400 transition"
                >
                  {/* Card Header */}
                  <div className="flex items-start justify-between pb-3 border-b border-charcoal-700">
                    <div>
                      <span className="font-mono text-xl font-black text-amber-400 block">
                        {ticket.ticket_number}
                      </span>
                      <span className="text-xs text-neutral-300 font-bold block mt-0.5">
                        {ticket.order?.order_type === 'takeaway'
                          ? 'Bungkus / Takeaway'
                          : `Meja: ${ticket.table?.table_number || 'Walk-in'}`}
                      </span>
                    </div>

                    <div className="text-right">
                      <span className="text-[11px] font-mono font-bold text-neutral-400 block">
                        {formatTime(ticket.sent_at.slice(11, 16))}
                      </span>
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded-md inline-block mt-0.5 ${
                          (ticket.elapsedMinutes || 0) > 15
                            ? 'bg-rose-950 text-rose-300 border border-rose-800'
                            : 'bg-charcoal-700 text-neutral-300'
                        }`}
                      >
                        ⏱ {ticket.elapsedMinutes || 0} mnt lalu
                      </span>
                    </div>
                  </div>

                  {/* Items List */}
                  <div className="space-y-2">
                    {ticket.items?.map((item) => (
                      <div key={item.id} className="flex justify-between items-start text-sm">
                        <div className="flex items-start gap-2">
                          <span className="font-black text-amber-300 text-base">
                            {item.quantity}x
                          </span>
                          <div>
                            <span className="font-bold text-white block">{item.item_name_snapshot}</span>
                            {item.notes && (
                              <span className="text-xs text-amber-400/90 italic block">
                                ★ {item.notes}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Action Button */}
                  <div className="pt-2">
                    <button
                      onClick={() => handleUpdateStatus(ticket.id, 'preparing')}
                      className="w-full py-3 bg-amber-500 hover:bg-amber-400 text-charcoal-950 rounded-xl text-xs font-black transition flex items-center justify-center gap-2 shadow-md active:scale-95"
                    >
                      <Flame className="w-4 h-4" />
                      <span>Mulai Masak (Start Preparing)</span>
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Column 2: In Preparation */}
        <div className="flex flex-col bg-charcoal-900/60 rounded-3xl border border-charcoal-800 overflow-hidden">
          <div className="p-4 bg-blue-950/40 border-b border-blue-900/40 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-blue-500 animate-pulse" />
              <h3 className="font-bold text-sm tracking-wide uppercase text-blue-300">
                Sedang Dimasak
              </h3>
            </div>
            <span className="px-2.5 py-0.5 rounded-full bg-blue-500 text-white font-black text-xs">
              {preparingTickets.length}
            </span>
          </div>

          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {preparingTickets.length === 0 ? (
              <div className="text-center py-24 text-neutral-500 text-xs">
                Tidak ada menu yang sedang dimasak.
              </div>
            ) : (
              preparingTickets.map((ticket) => (
                <div
                  key={ticket.id}
                  className="bg-charcoal-800/90 border border-blue-500/30 rounded-2xl p-5 space-y-4 shadow-lg hover:border-blue-400 transition"
                >
                  {/* Card Header */}
                  <div className="flex items-start justify-between pb-3 border-b border-charcoal-700">
                    <div>
                      <span className="font-mono text-xl font-black text-blue-400 block">
                        {ticket.ticket_number}
                      </span>
                      <span className="text-xs text-neutral-300 font-bold block mt-0.5">
                        {ticket.order?.order_type === 'takeaway'
                          ? 'Bungkus / Takeaway'
                          : `Meja: ${ticket.table?.table_number || 'Walk-in'}`}
                      </span>
                    </div>

                    <div className="text-right">
                      <span className="text-[11px] font-mono font-bold text-neutral-400 block">
                        {formatTime(ticket.sent_at.slice(11, 16))}
                      </span>
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-md inline-block mt-0.5 bg-blue-950 text-blue-300 border border-blue-800">
                        Sedang Dimasak
                      </span>
                    </div>
                  </div>

                  {/* Items List */}
                  <div className="space-y-2">
                    {ticket.items?.map((item) => (
                      <div key={item.id} className="flex justify-between items-start text-sm">
                        <div className="flex items-start gap-2">
                          <span className="font-black text-blue-300 text-base">
                            {item.quantity}x
                          </span>
                          <div>
                            <span className="font-bold text-white block">{item.item_name_snapshot}</span>
                            {item.notes && (
                              <span className="text-xs text-amber-400/90 italic block">
                                ★ {item.notes}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Action Button */}
                  <div className="pt-2">
                    <button
                      onClick={() => handleUpdateStatus(ticket.id, 'ready')}
                      className="w-full py-3 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-black transition flex items-center justify-center gap-2 shadow-md active:scale-95"
                    >
                      <Check className="w-4 h-4" />
                      <span>Tandai Siap (Mark as Ready)</span>
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Column 3: Ready to Serve */}
        <div className="flex flex-col bg-charcoal-900/60 rounded-3xl border border-charcoal-800 overflow-hidden">
          <div className="p-4 bg-emerald-950/40 border-b border-emerald-900/40 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-emerald-500" />
              <h3 className="font-bold text-sm tracking-wide uppercase text-emerald-300">
                Siap Disajikan (Ready)
              </h3>
            </div>
            <span className="px-2.5 py-0.5 rounded-full bg-emerald-500 text-white font-black text-xs">
              {readyTickets.length}
            </span>
          </div>

          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {readyTickets.length === 0 ? (
              <div className="text-center py-24 text-neutral-500 text-xs">
                Belum ada hidangan yang siap diambil.
              </div>
            ) : (
              readyTickets.map((ticket) => (
                <div
                  key={ticket.id}
                  className="bg-charcoal-800/90 border border-emerald-500/40 rounded-2xl p-5 space-y-4 shadow-lg hover:border-emerald-400 transition"
                >
                  {/* Card Header */}
                  <div className="flex items-start justify-between pb-3 border-b border-charcoal-700">
                    <div>
                      <span className="font-mono text-xl font-black text-emerald-400 block">
                        {ticket.ticket_number}
                      </span>
                      <span className="text-xs text-neutral-300 font-bold block mt-0.5">
                        {ticket.order?.order_type === 'takeaway'
                          ? 'Bungkus / Takeaway'
                          : `Meja: ${ticket.table?.table_number || 'Walk-in'}`}
                      </span>
                    </div>

                    <div className="text-right">
                      <span className="text-[11px] font-mono font-bold text-neutral-400 block">
                        {formatTime(ticket.sent_at.slice(11, 16))}
                      </span>
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-md inline-block mt-0.5 bg-emerald-950 text-emerald-300 border border-emerald-800">
                        Siap Disajikan
                      </span>
                    </div>
                  </div>

                  {/* Items List */}
                  <div className="space-y-2">
                    {ticket.items?.map((item) => (
                      <div key={item.id} className="flex justify-between items-start text-sm">
                        <div className="flex items-start gap-2">
                          <span className="font-black text-emerald-300 text-base">
                            {item.quantity}x
                          </span>
                          <div>
                            <span className="font-bold text-white block">{item.item_name_snapshot}</span>
                            {item.notes && (
                              <span className="text-xs text-amber-400/90 italic block">
                                ★ {item.notes}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Action Button */}
                  <div className="pt-2">
                    <button
                      onClick={() => handleUpdateStatus(ticket.id, 'served')}
                      className="w-full py-3 bg-charcoal-700 hover:bg-charcoal-600 text-neutral-200 hover:text-white rounded-xl text-xs font-bold transition flex items-center justify-center gap-2 active:scale-95"
                    >
                      <CheckCircle2 className="w-4 h-4" />
                      <span>Selesai Disajikan (Mark Served)</span>
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
