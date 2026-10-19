import React, { useState, useEffect } from 'react'
import {
  Users,
  Plus,
  ShieldCheck,
  Store,
  ChefHat,
  X,
  CheckCircle2,
  XCircle,
} from 'lucide-react'
import { restaurantService } from '@/services/restaurantService'
import { StaffUser, UserRole } from '@/types/domain'
import { useToast } from '@/components/ui/Toast'

export const UserManagementPage: React.FC = () => {
  const toast = useToast()
  const [users, setUsers] = useState<StaffUser[]>([])
  const [loading, setLoading] = useState(true)

  // Add User Modal
  const [isAddOpen, setIsAddOpen] = useState(false)
  const [fullName, setFullName] = useState('')
  const [email, setEmail] = useState('')
  const [role, setRole] = useState<UserRole>('cashier')

  useEffect(() => {
    loadUsers()
  }, [])

  const loadUsers = async () => {
    try {
      setLoading(true)
      const data = await restaurantService.getStaffUsers()
      setUsers(data)
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const handleRoleChange = async (userId: string, newRole: UserRole) => {
    try {
      await restaurantService.updateStaffUser(userId, { role: newRole })
      toast.success(`Role staff berhasil diubah ke ${newRole.toUpperCase()}`)
      loadUsers()
    } catch (err: any) {
      toast.error(err.message || 'Gagal mengubah role.')
    }
  }

  const handleToggleActive = async (user: StaffUser) => {
    try {
      await restaurantService.updateStaffUser(user.id, { is_active: !user.is_active })
      toast.success(`Status akun ${user.full_name} diubah menjadi ${!user.is_active ? 'Aktif' : 'Non-aktif'}`)
      loadUsers()
    } catch (err: any) {
      toast.error(err.message || 'Gagal mengubah status staff.')
    }
  }

  const handleAddSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!fullName.trim() || !email.trim()) return

    try {
      await restaurantService.createStaffUser({
        full_name: fullName.trim(),
        email: email.trim(),
        role,
        is_active: true,
      })
      toast.success(`Staff ${fullName} berhasil ditambahkan!`)
      setFullName('')
      setEmail('')
      setIsAddOpen(false)
      loadUsers()
    } catch (err: any) {
      toast.error(err.message || 'Gagal menambah staff.')
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold font-serif text-charcoal-900">
            Manajemen Akun & Staff
          </h1>
          <p className="text-xs text-neutral-500 mt-1">
            Kelola hak akses staff restoran: Super Admin, Kasir POS, dan Tim Dapur (Kitchen Staff).
          </p>
        </div>

        <button
          onClick={() => setIsAddOpen(true)}
          className="px-4 py-2 bg-olive-700 hover:bg-olive-800 text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 shadow-sm self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>Tambah Staff Baru</span>
        </button>
      </div>

      {/* Staff Table */}
      <div className="bg-white rounded-2xl border border-neutral-200/90 shadow-subtle overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-neutral-50 text-neutral-500 font-bold uppercase tracking-wider border-b border-neutral-200">
              <tr>
                <th className="py-3.5 px-4">Nama Lengkap</th>
                <th className="py-3.5 px-4">Email</th>
                <th className="py-3.5 px-4">Role Akses</th>
                <th className="py-3.5 px-4">Status Akun</th>
                <th className="py-3.5 px-4 text-right">Ubah Role</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-100">
              {loading ? (
                <tr>
                  <td colSpan={5} className="py-12 text-center text-neutral-400">
                    Memuat staff...
                  </td>
                </tr>
              ) : (
                users.map((u) => (
                  <tr key={u.id} className="hover:bg-neutral-50/80 transition">
                    <td className="py-3.5 px-4">
                      <div className="font-bold text-charcoal-900">{u.full_name}</div>
                    </td>
                    <td className="py-3.5 px-4">
                      <span className="font-mono text-neutral-600">{u.email}</span>
                    </td>
                    <td className="py-3.5 px-4">
                      <span
                        className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full font-bold uppercase text-[11px] ${
                          u.role === 'admin'
                            ? 'bg-olive-100 text-olive-800'
                            : u.role === 'cashier'
                            ? 'bg-emerald-100 text-emerald-800'
                            : 'bg-amber-100 text-amber-800'
                        }`}
                      >
                        {u.role === 'admin' && <ShieldCheck className="w-3.5 h-3.5" />}
                        {u.role === 'cashier' && <Store className="w-3.5 h-3.5" />}
                        {u.role === 'kitchen' && <ChefHat className="w-3.5 h-3.5" />}
                        <span>{u.role}</span>
                      </span>
                    </td>
                    <td className="py-3.5 px-4">
                      <button
                        onClick={() => handleToggleActive(u)}
                        className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold ${
                          u.is_active
                            ? 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100'
                            : 'bg-neutral-200 text-neutral-600 hover:bg-neutral-300'
                        }`}
                      >
                        {u.is_active ? 'Aktif' : 'Non-aktif'}
                      </button>
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <select
                        value={u.role}
                        onChange={(e) => handleRoleChange(u.id, e.target.value as UserRole)}
                        className="px-2.5 py-1 bg-neutral-100 border border-neutral-200 rounded-lg text-xs font-semibold focus:outline-none focus:ring-1 focus:ring-olive-600"
                      >
                        <option value="admin">Super Admin</option>
                        <option value="cashier">Cashier</option>
                        <option value="kitchen">Kitchen Staff</option>
                      </select>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add Staff Modal */}
      {isAddOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl max-w-sm w-full p-6 space-y-4 shadow-xl border border-neutral-200 animate-slide-up text-xs">
            <div className="flex items-center justify-between pb-2 border-b border-neutral-100">
              <h3 className="text-base font-bold text-charcoal-900">Tambah Akun Staff</h3>
              <button onClick={() => setIsAddOpen(false)} className="text-neutral-400 hover:text-neutral-700">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAddSubmit} className="space-y-3.5">
              <div>
                <label className="block font-semibold text-neutral-700 mb-1">Nama Lengkap *</label>
                <input
                  type="text"
                  required
                  placeholder="Cth: Rian Pratama"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="w-full px-3.5 py-2 bg-neutral-50 border border-neutral-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-olive-600"
                />
              </div>

              <div>
                <label className="block font-semibold text-neutral-700 mb-1">Alamat Email *</label>
                <input
                  type="email"
                  required
                  placeholder="rian@kko.resto"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-3.5 py-2 bg-neutral-50 border border-neutral-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-olive-600"
                />
              </div>

              <div>
                <label className="block font-semibold text-neutral-700 mb-1">Role / Peran *</label>
                <select
                  value={role}
                  onChange={(e) => setRole(e.target.value as UserRole)}
                  className="w-full px-3.5 py-2 bg-neutral-50 border border-neutral-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-olive-600 font-semibold"
                >
                  <option value="admin">Super Admin</option>
                  <option value="cashier">Cashier / Kasir POS</option>
                  <option value="kitchen">Kitchen Display Staff</option>
                </select>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsAddOpen(false)}
                  className="px-4 py-2 text-neutral-600 hover:bg-neutral-100 rounded-xl font-semibold"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-olive-700 hover:bg-olive-800 text-white font-bold rounded-xl shadow-sm"
                >
                  Simpan Staff
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
