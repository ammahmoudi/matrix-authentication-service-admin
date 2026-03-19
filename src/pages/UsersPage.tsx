import { useState, useEffect } from 'react'
import { useAuth } from 'react-oidc-context'
import { listUsers, lockUser, unlockUser, setAdmin, MasUser } from '../lib/masApi'

export default function UsersPage() {
  const auth = useAuth()
  const token = auth.user?.access_token ?? ''

  const [users, setUsers] = useState<(MasUser & { id: string })[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [filter, setFilter] = useState('')
  const [busy, setBusy] = useState<string | null>(null)

  const load = async (f?: string) => {
    try {
      setLoading(true)
      setError('')
      const res = await listUsers(token, { filter: f })
      setUsers(res.data.map(d => ({ id: d.id, ...d.attributes })))
    } catch (e: any) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [])

  const handleFilter = (e: React.FormEvent) => {
    e.preventDefault()
    load(filter.trim() || undefined)
  }

  const toggleLock = async (u: MasUser & { id: string }) => {
    if (!confirm(u.locked_at ? `Unlock ${u.username}?` : `Lock ${u.username}?`)) return
    setBusy(u.id)
    try {
      if (u.locked_at) {
        await unlockUser(token, u.id)
      } else {
        await lockUser(token, u.id)
      }
      await load(filter.trim() || undefined)
    } catch (e: any) {
      alert(e.message)
    } finally {
      setBusy(null)
    }
  }

  const toggleAdmin = async (u: MasUser & { id: string }) => {
    if (!confirm(u.admin ? `Remove admin from ${u.username}?` : `Make ${u.username} admin?`)) return
    setBusy(u.id)
    try {
      await setAdmin(token, u.id, !u.admin)
      await load(filter.trim() || undefined)
    } catch (e: any) {
      alert(e.message)
    } finally {
      setBusy(null)
    }
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-xl font-bold">Users</h1>
        <button onClick={() => load(filter.trim() || undefined)} className="text-sm text-brand-400 hover:text-brand-300">Refresh</button>
      </div>

      <form onSubmit={handleFilter} className="flex gap-2 mb-4">
        <input
          type="text"
          value={filter}
          onChange={e => setFilter(e.target.value)}
          placeholder="Filter by username…"
          className="flex-1 bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-gray-200 placeholder-gray-500 focus:outline-none focus:border-brand-500"
        />
        <button type="submit" className="bg-brand-600 hover:bg-brand-500 text-white px-4 py-2 rounded-lg text-sm transition-colors">
          Search
        </button>
      </form>

      {error && (
        <div className="bg-red-900/30 border border-red-700 text-red-300 px-4 py-2 rounded mb-4 text-sm">{error}</div>
      )}

      {loading ? (
        <div className="flex justify-center py-12">
          <div className="w-6 h-6 border-2 border-brand-500 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : users.length === 0 ? (
        <p className="text-gray-500 text-sm text-center py-12">No users found.</p>
      ) : (
        <>
          {/* Desktop table */}
          <div className="hidden sm:block overflow-x-auto">
            <table className="min-w-full text-sm border border-gray-700 rounded-lg overflow-hidden">
              <thead className="bg-gray-800">
                <tr>
                  <th className="text-left px-4 py-2 text-gray-400 font-medium">Username</th>
                  <th className="text-left px-4 py-2 text-gray-400 font-medium">Admin</th>
                  <th className="text-left px-4 py-2 text-gray-400 font-medium">Status</th>
                  <th className="text-left px-4 py-2 text-gray-400 font-medium">Created</th>
                  <th className="text-left px-4 py-2 text-gray-400 font-medium">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-700">
                {users.map(u => (
                  <tr key={u.id} className="hover:bg-gray-800/50">
                    <td className="px-4 py-2 font-medium text-gray-200">{u.username}</td>
                    <td className="px-4 py-2">
                      {u.admin && (
                        <span className="text-xs px-2 py-0.5 rounded-full bg-blue-900/40 text-blue-400">Admin</span>
                      )}
                    </td>
                    <td className="px-4 py-2">
                      <span className={`text-xs px-2 py-0.5 rounded-full ${u.locked_at ? 'bg-red-900/40 text-red-400' : 'bg-green-900/40 text-green-400'}`}>
                        {u.locked_at ? 'Locked' : 'Active'}
                      </span>
                    </td>
                    <td className="px-4 py-2 text-gray-400 text-xs">{new Date(u.created_at).toLocaleDateString()}</td>
                    <td className="px-4 py-2">
                      <div className="flex gap-2">
                        <button
                          disabled={busy === u.id}
                          onClick={() => toggleLock(u)}
                          className="text-xs px-2 py-1 rounded border border-gray-600 hover:bg-gray-700 text-gray-300 transition-colors disabled:opacity-50"
                        >
                          {u.locked_at ? 'Unlock' : 'Lock'}
                        </button>
                        <button
                          disabled={busy === u.id}
                          onClick={() => toggleAdmin(u)}
                          className="text-xs px-2 py-1 rounded border border-gray-600 hover:bg-gray-700 text-gray-300 transition-colors disabled:opacity-50"
                        >
                          {u.admin ? 'Revoke Admin' : 'Make Admin'}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobile cards */}
          <div className="sm:hidden space-y-3">
            {users.map(u => (
              <div key={u.id} className="bg-gray-800 border border-gray-700 rounded-lg p-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="font-semibold text-gray-100">{u.username}</span>
                  <div className="flex gap-1">
                    {u.admin && (
                      <span className="text-xs px-2 py-0.5 rounded-full bg-blue-900/40 text-blue-400">Admin</span>
                    )}
                    <span className={`text-xs px-2 py-0.5 rounded-full ${u.locked_at ? 'bg-red-900/40 text-red-400' : 'bg-green-900/40 text-green-400'}`}>
                      {u.locked_at ? 'Locked' : 'Active'}
                    </span>
                  </div>
                </div>
                <p className="text-xs text-gray-500 mb-3">Joined {new Date(u.created_at).toLocaleDateString()}</p>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    disabled={busy === u.id}
                    onClick={() => toggleLock(u)}
                    className="py-2 rounded-lg text-sm font-medium border border-gray-600 hover:bg-gray-700 text-gray-300 transition-colors disabled:opacity-50"
                  >
                    {u.locked_at ? 'Unlock' : 'Lock'}
                  </button>
                  <button
                    disabled={busy === u.id}
                    onClick={() => toggleAdmin(u)}
                    className="py-2 rounded-lg text-sm font-medium border border-gray-600 hover:bg-gray-700 text-gray-300 transition-colors disabled:opacity-50"
                  >
                    {u.admin ? 'Revoke Admin' : 'Make Admin'}
                  </button>
                </div>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  )
}
