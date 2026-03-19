import { useEffect, useState } from 'react'
import { useAuth } from 'react-oidc-context'
import { addUserEmail, deleteUserEmail, getUserByUsername, getUserEmail, listUserEmails, UserEmail } from '../lib/masApi'

export default function EmailsPage() {
  const auth = useAuth()
  const token = auth.user?.access_token ?? ''

  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [emails, setEmails] = useState<(UserEmail & { id: string })[]>([])

  const [filterUserId, setFilterUserId] = useState('')
  const [filterEmail, setFilterEmail] = useState('')
  const [resolveUsername, setResolveUsername] = useState('')

  const [newUserId, setNewUserId] = useState('')
  const [newEmail, setNewEmail] = useState('')

  const [lookupId, setLookupId] = useState('')
  const [lookupJson, setLookupJson] = useState('')

  const load = async () => {
    try {
      setLoading(true)
      setError('')
      const res = await listUserEmails(token, {
        user: filterUserId.trim() || undefined,
        email: filterEmail.trim() || undefined,
      })
      setEmails(res.data.map(d => ({ id: d.id, ...d.attributes })))
    } catch (e: any) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
  }, [])

  const doResolve = async () => {
    const u = resolveUsername.trim()
    if (!u) return
    try {
      const res = await getUserByUsername(token, u)
      setFilterUserId(res.data.id)
      setNewUserId(res.data.id)
      await load()
    } catch (e: any) {
      alert(e.message)
    }
  }

  const doAdd = async (e: React.FormEvent) => {
    e.preventDefault()
    const user_id = newUserId.trim()
    const email = newEmail.trim()
    if (!user_id || !email) return
    try {
      await addUserEmail(token, { user_id, email })
      setNewEmail('')
      await load()
    } catch (e: any) {
      alert(e.message)
    }
  }

  const doDelete = async (id: string, email: string) => {
    if (!confirm(`Delete email ${email}?`)) return
    try {
      await deleteUserEmail(token, id)
      await load()
    } catch (e: any) {
      alert(e.message)
    }
  }

  const doLookup = async () => {
    const id = lookupId.trim()
    if (!id) return
    try {
      const res = await getUserEmail(token, id)
      setLookupJson(JSON.stringify({ id: res.data.id, ...res.data.attributes }, null, 2))
    } catch (e: any) {
      alert(e.message)
    }
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-xl font-bold">User Emails</h1>
        <button onClick={load} className="text-sm text-brand-400 hover:text-brand-300">Refresh</button>
      </div>

      {error && (
        <div className="bg-red-900/30 border border-red-700 text-red-300 px-4 py-2 rounded mb-4 text-sm">{error}</div>
      )}

      <div className="bg-gray-800 border border-gray-700 rounded-lg p-4 mb-4 space-y-3">
        <h2 className="text-sm font-semibold text-gray-300">Filters</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="block text-xs text-gray-400 mb-1">Filter by user id</label>
            <input
              type="text"
              value={filterUserId}
              onChange={e => setFilterUserId(e.target.value)}
              placeholder="01..."
              className="w-full bg-gray-900 border border-gray-600 rounded-lg px-3 py-2 text-sm text-gray-200 placeholder-gray-500 focus:outline-none focus:border-brand-500"
            />
          </div>
          <div>
            <label className="block text-xs text-gray-400 mb-1">Filter by email</label>
            <input
              type="text"
              value={filterEmail}
              onChange={e => setFilterEmail(e.target.value)}
              placeholder="alice@example.com"
              className="w-full bg-gray-900 border border-gray-600 rounded-lg px-3 py-2 text-sm text-gray-200 placeholder-gray-500 focus:outline-none focus:border-brand-500"
            />
          </div>
        </div>
        <div className="flex flex-col sm:flex-row gap-2">
          <button
            onClick={load}
            className="bg-brand-600 hover:bg-brand-500 text-white px-4 py-2 rounded-lg text-sm transition-colors"
          >
            Apply filters
          </button>
          <div className="flex-1" />
        </div>

        <div className="pt-2 border-t border-gray-700">
          <label className="block text-xs text-gray-400 mb-1">Resolve user by username (helper)</label>
          <div className="flex gap-2">
            <input
              type="text"
              value={resolveUsername}
              onChange={e => setResolveUsername(e.target.value)}
              placeholder="alice"
              className="flex-1 bg-gray-900 border border-gray-600 rounded-lg px-3 py-2 text-sm text-gray-200 placeholder-gray-500 focus:outline-none focus:border-brand-500"
            />
            <button
              onClick={doResolve}
              className="bg-gray-700 hover:bg-gray-600 text-white px-4 py-2 rounded-lg text-sm transition-colors"
            >
              Resolve
            </button>
          </div>
        </div>
      </div>

      <form onSubmit={doAdd} className="bg-gray-800 border border-gray-700 rounded-lg p-4 mb-4 space-y-3">
        <h2 className="text-sm font-semibold text-gray-300">Add email</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="block text-xs text-gray-400 mb-1">User id</label>
            <input
              type="text"
              value={newUserId}
              onChange={e => setNewUserId(e.target.value)}
              placeholder="01..."
              className="w-full bg-gray-900 border border-gray-600 rounded-lg px-3 py-2 text-sm text-gray-200 placeholder-gray-500 focus:outline-none focus:border-brand-500"
            />
          </div>
          <div>
            <label className="block text-xs text-gray-400 mb-1">Email</label>
            <input
              type="email"
              value={newEmail}
              onChange={e => setNewEmail(e.target.value)}
              placeholder="alice@example.com"
              className="w-full bg-gray-900 border border-gray-600 rounded-lg px-3 py-2 text-sm text-gray-200 placeholder-gray-500 focus:outline-none focus:border-brand-500"
            />
          </div>
        </div>
        <button
          type="submit"
          className="w-full bg-brand-600 hover:bg-brand-500 text-white py-2 rounded-lg text-sm font-medium transition-colors"
        >
          Add email
        </button>
      </form>

      <div className="bg-gray-800 border border-gray-700 rounded-lg p-4 mb-4 space-y-3">
        <h2 className="text-sm font-semibold text-gray-300">Lookup email by ID</h2>
        <div className="flex gap-2">
          <input
            type="text"
            value={lookupId}
            onChange={e => setLookupId(e.target.value)}
            placeholder="01..."
            className="flex-1 bg-gray-900 border border-gray-600 rounded-lg px-3 py-2 text-sm text-gray-200 placeholder-gray-500 focus:outline-none focus:border-brand-500"
          />
          <button
            onClick={doLookup}
            className="bg-gray-700 hover:bg-gray-600 text-white px-4 py-2 rounded-lg text-sm transition-colors"
          >
            Lookup
          </button>
        </div>
        {lookupJson && (
          <pre className="text-xs text-gray-300 whitespace-pre-wrap bg-gray-900 border border-gray-700 rounded-lg p-3">{lookupJson}</pre>
        )}
      </div>

      {loading ? (
        <div className="flex justify-center py-12">
          <div className="w-6 h-6 border-2 border-brand-500 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : emails.length === 0 ? (
        <p className="text-gray-500 text-sm text-center py-12">No emails found.</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm border border-gray-700 rounded-lg overflow-hidden">
            <thead className="bg-gray-800">
              <tr>
                <th className="text-left px-4 py-2 text-gray-400 font-medium">Email</th>
                <th className="text-left px-4 py-2 text-gray-400 font-medium">User</th>
                <th className="text-left px-4 py-2 text-gray-400 font-medium">Created</th>
                <th className="text-left px-4 py-2 text-gray-400 font-medium">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-700">
              {emails.map(e => (
                <tr key={e.id} className="hover:bg-gray-800/50">
                  <td className="px-4 py-2 text-gray-200">{e.email}</td>
                  <td className="px-4 py-2 text-gray-400 font-mono text-xs">{e.user_id}</td>
                  <td className="px-4 py-2 text-gray-400 text-xs">{new Date(e.created_at).toLocaleDateString()}</td>
                  <td className="px-4 py-2">
                    <button
                      onClick={() => doDelete(e.id, e.email)}
                      className="text-xs bg-red-700 hover:bg-red-600 text-white px-2 py-1 rounded transition-colors"
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
