import { useState, useEffect } from 'react'
import { useAuth } from 'react-oidc-context'
import {
  listUsers,
  createUser,
  lockUser,
  unlockUser,
  setAdmin,
  deactivateUser,
  reactivateUser,
  setUserPassword,
  MasUser,
  UserStatus,
} from '../lib/masApi'

export default function UsersPage() {
  const auth = useAuth()
  const token = auth.user?.access_token ?? ''

  const [users, setUsers] = useState<(MasUser & { id: string })[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [search, setSearch] = useState('')
  const [status, setStatus] = useState<UserStatus | ''>('')
  const [adminOnly, setAdminOnly] = useState(false)
  const [legacyGuestOnly, setLegacyGuestOnly] = useState(false)

  const [skipEraseOnDeactivate, setSkipEraseOnDeactivate] = useState(false)
  const [skipPasswordCheck, setSkipPasswordCheck] = useState(false)

  const [newUsername, setNewUsername] = useState('')
  const [skipHomeserverCheck, setSkipHomeserverCheck] = useState(false)
  const [showCreate, setShowCreate] = useState(false)
  const [busy, setBusy] = useState<string | null>(null)

  const load = async () => {
    try {
      setLoading(true)
      setError('')
      const res = await listUsers(token, {
        search: search.trim() || undefined,
        status: status || null,
        admin: adminOnly ? true : null,
        legacyGuest: legacyGuestOnly ? true : null,
      })
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
    load()
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
      await load()
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
      await load()
    } catch (e: any) {
      alert(e.message)
    } finally {
      setBusy(null)
    }
  }

  const doDeactivate = async (u: MasUser & { id: string }) => {
    if (!confirm(`Deactivate ${u.username}? This will invalidate sessions and request Synapse to erase user data unless you enabled skip erase.`)) return
    setBusy(u.id)
    try {
      await deactivateUser(token, u.id, { skipErase: skipEraseOnDeactivate })
      await load()
    } catch (e: any) {
      alert(e.message)
    } finally {
      setBusy(null)
    }
  }

  const doReactivate = async (u: MasUser & { id: string }) => {
    if (!confirm(`Reactivate ${u.username}?`)) return
    setBusy(u.id)
    try {
      await reactivateUser(token, u.id)
      await load()
    } catch (e: any) {
      alert(e.message)
    } finally {
      setBusy(null)
    }
  }

  const doSetPassword = async (u: MasUser & { id: string }) => {
    const pw = prompt(`Set password for ${u.username}:`)
    if (!pw) return
    setBusy(u.id)
    try {
      await setUserPassword(token, u.id, { password: pw, skipPasswordCheck: skipPasswordCheck ? true : null })
      alert('Password updated.')
    } catch (e: any) {
      alert(e.message)
    } finally {
      setBusy(null)
    }
  }

  const doCreateUser = async (e: React.FormEvent) => {
    e.preventDefault()
    const username = newUsername.trim()
    if (!username) return
    setBusy('create')
    try {
      await createUser(token, { username, skipHomeserverCheck })
      setNewUsername('')
      setSkipHomeserverCheck(false)
      setShowCreate(false)
      await load()
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
        <div className="flex gap-2">
          <button onClick={() => setShowCreate(!showCreate)} className="text-sm text-gray-300 hover:text-white">{showCreate ? 'Cancel' : '+ Create'}</button>
          <button onClick={load} className="text-sm text-brand-400 hover:text-brand-300">Refresh</button>
        </div>
      </div>

      {showCreate && (
        <form onSubmit={doCreateUser} className="bg-gray-800 border border-gray-700 rounded-lg p-4 mb-4 space-y-3">
          <h2 className="text-sm font-semibold text-gray-300">Create user</h2>
          <div>
            <label className="block text-xs text-gray-400 mb-1">Username (localpart)</label>
            <input
              type="text"
              value={newUsername}
              onChange={e => setNewUsername(e.target.value)}
              placeholder="alice"
              className="w-full bg-gray-900 border border-gray-600 rounded-lg px-3 py-2 text-sm text-gray-200 placeholder-gray-500 focus:outline-none focus:border-brand-500"
            />
          </div>
          <label className="flex items-center gap-2 text-xs text-gray-400">
            <input type="checkbox" checked={skipHomeserverCheck} onChange={e => setSkipHomeserverCheck(e.target.checked)} />
            Skip homeserver username availability check
          </label>
          <button
            type="submit"
            disabled={busy === 'create'}
            className="w-full bg-brand-600 hover:bg-brand-500 text-white py-2 rounded-lg text-sm font-medium transition-colors disabled:opacity-50"
          >
            {busy === 'create' ? 'Creating…' : 'Create user'}
          </button>
        </form>
      )}

      <form onSubmit={handleFilter} className="flex gap-2 mb-4">
        <input
          type="text"
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Search username…"
          className="flex-1 bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-gray-200 placeholder-gray-500 focus:outline-none focus:border-brand-500"
        />
        <select
          value={status}
          onChange={e => setStatus(e.target.value as any)}
          aria-label="User status filter"
          className="bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-gray-200 focus:outline-none focus:border-brand-500"
        >
          <option value="">All</option>
          <option value="active">Active</option>
          <option value="locked">Locked</option>
          <option value="deactivated">Deactivated</option>
        </select>
        <button type="submit" className="bg-brand-600 hover:bg-brand-500 text-white px-4 py-2 rounded-lg text-sm transition-colors">
          Search
        </button>
      </form>

      <div className="flex flex-wrap gap-4 mb-4 text-xs text-gray-400">
        <label className="flex items-center gap-2">
          <input type="checkbox" checked={adminOnly} onChange={e => setAdminOnly(e.target.checked)} />
          Admin only
        </label>
        <label className="flex items-center gap-2">
          <input type="checkbox" checked={legacyGuestOnly} onChange={e => setLegacyGuestOnly(e.target.checked)} />
          Legacy guest only
        </label>
        <label className="flex items-center gap-2">
          <input type="checkbox" checked={skipEraseOnDeactivate} onChange={e => setSkipEraseOnDeactivate(e.target.checked)} />
          Skip erase on deactivation
        </label>
        <label className="flex items-center gap-2">
          <input type="checkbox" checked={skipPasswordCheck} onChange={e => setSkipPasswordCheck(e.target.checked)} />
          Skip password complexity check
        </label>
      </div>

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
                      <span className={`text-xs px-2 py-0.5 rounded-full ${u.deactivated_at ? 'bg-gray-700 text-gray-300' : u.locked_at ? 'bg-red-900/40 text-red-400' : 'bg-green-900/40 text-green-400'}`}>
                        {u.deactivated_at ? 'Deactivated' : u.locked_at ? 'Locked' : 'Active'}
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
                        <button
                          disabled={busy === u.id}
                          onClick={() => doSetPassword(u)}
                          className="text-xs px-2 py-1 rounded border border-gray-600 hover:bg-gray-700 text-gray-300 transition-colors disabled:opacity-50"
                        >
                          Set Password
                        </button>
                        {!u.deactivated_at ? (
                          <button
                            disabled={busy === u.id}
                            onClick={() => doDeactivate(u)}
                            className="text-xs px-2 py-1 rounded bg-red-700 hover:bg-red-600 text-white transition-colors disabled:opacity-50"
                          >
                            Deactivate
                          </button>
                        ) : (
                          <button
                            disabled={busy === u.id}
                            onClick={() => doReactivate(u)}
                            className="text-xs px-2 py-1 rounded bg-green-700 hover:bg-green-600 text-white transition-colors disabled:opacity-50"
                          >
                            Reactivate
                          </button>
                        )}
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
                    <span className={`text-xs px-2 py-0.5 rounded-full ${u.deactivated_at ? 'bg-gray-700 text-gray-300' : u.locked_at ? 'bg-red-900/40 text-red-400' : 'bg-green-900/40 text-green-400'}`}>
                      {u.deactivated_at ? 'Deactivated' : u.locked_at ? 'Locked' : 'Active'}
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
                <div className="grid grid-cols-2 gap-2 mt-2">
                  <button
                    disabled={busy === u.id}
                    onClick={() => doSetPassword(u)}
                    className="py-2 rounded-lg text-sm font-medium border border-gray-600 hover:bg-gray-700 text-gray-300 transition-colors disabled:opacity-50"
                  >
                    Set Password
                  </button>
                  {!u.deactivated_at ? (
                    <button
                      disabled={busy === u.id}
                      onClick={() => doDeactivate(u)}
                      className="py-2 rounded-lg text-sm font-medium bg-red-700 hover:bg-red-600 text-white transition-colors disabled:opacity-50"
                    >
                      Deactivate
                    </button>
                  ) : (
                    <button
                      disabled={busy === u.id}
                      onClick={() => doReactivate(u)}
                      className="py-2 rounded-lg text-sm font-medium bg-green-700 hover:bg-green-600 text-white transition-colors disabled:opacity-50"
                    >
                      Reactivate
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  )
}
