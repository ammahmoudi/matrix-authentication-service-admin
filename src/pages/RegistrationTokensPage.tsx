import { useState, useEffect } from 'react'
import { useAuth } from 'react-oidc-context'
import { listTokens, createToken, deleteToken, MasToken } from '../lib/masApi'

export default function RegistrationTokensPage() {
  const auth = useAuth()
  const token = auth.user?.access_token ?? ''

  const [tokens, setTokens] = useState<(MasToken & { id: string })[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  // New token form
  const [newToken, setNewToken] = useState('')
  const [usageLimit, setUsageLimit] = useState('')
  const [expiryDays, setExpiryDays] = useState('')
  const [creating, setCreating] = useState(false)
  const [showForm, setShowForm] = useState(false)

  const load = async () => {
    try {
      setLoading(true)
      setError('')
      const res = await listTokens(token)
      setTokens(res.data.map(d => ({ id: d.id, ...d.attributes })))
    } catch (e: any) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [])

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault()
    setCreating(true)
    try {
      const opts: { token?: string; usage_limit?: number; expires_at?: string } = {}
      if (newToken.trim()) opts.token = newToken.trim()
      if (usageLimit.trim()) opts.usage_limit = parseInt(usageLimit.trim(), 10)
      if (expiryDays.trim()) {
        const d = new Date()
        d.setDate(d.getDate() + parseInt(expiryDays.trim(), 10))
        opts.expires_at = d.toISOString()
      }
      await createToken(token, opts)
      setNewToken('')
      setUsageLimit('')
      setExpiryDays('')
      setShowForm(false)
      await load()
    } catch (e: any) {
      alert(e.message)
    } finally {
      setCreating(false)
    }
  }

  const handleRevoke = async (id: string, tokenStr: string) => {
    if (!confirm(`Revoke token "${tokenStr}"?`)) return
    try {
      await deleteToken(token, id)
      await load()
    } catch (e: any) {
      alert(e.message)
    }
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-xl font-bold">Registration Tokens</h1>
        <div className="flex gap-2">
          <button onClick={load} className="text-sm text-brand-400 hover:text-brand-300">Refresh</button>
          <button
            onClick={() => setShowForm(!showForm)}
            className="text-sm bg-brand-600 hover:bg-brand-500 text-white px-3 py-1.5 rounded-lg transition-colors"
          >
            {showForm ? 'Cancel' : '+ New Token'}
          </button>
        </div>
      </div>

      {/* Create form */}
      {showForm && (
        <form onSubmit={handleCreate} className="bg-gray-800 border border-gray-700 rounded-lg p-4 mb-4 space-y-3">
          <h2 className="text-sm font-semibold text-gray-300">Create Token</h2>
          <div>
            <label className="block text-xs text-gray-400 mb-1">Token string (optional)</label>
            <input
              type="text"
              value={newToken}
              onChange={e => setNewToken(e.target.value)}
              placeholder="Leave blank to auto-generate"
              className="w-full bg-gray-900 border border-gray-600 rounded-lg px-3 py-2 text-sm text-gray-200 placeholder-gray-500 focus:outline-none focus:border-brand-500"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs text-gray-400 mb-1">Usage limit (optional)</label>
              <input
                type="number"
                min="1"
                value={usageLimit}
                onChange={e => setUsageLimit(e.target.value)}
                placeholder="Unlimited"
                className="w-full bg-gray-900 border border-gray-600 rounded-lg px-3 py-2 text-sm text-gray-200 placeholder-gray-500 focus:outline-none focus:border-brand-500"
              />
            </div>
            <div>
              <label className="block text-xs text-gray-400 mb-1">Expires in days (optional)</label>
              <input
                type="number"
                min="1"
                value={expiryDays}
                onChange={e => setExpiryDays(e.target.value)}
                placeholder="Never"
                className="w-full bg-gray-900 border border-gray-600 rounded-lg px-3 py-2 text-sm text-gray-200 placeholder-gray-500 focus:outline-none focus:border-brand-500"
              />
            </div>
          </div>
          <button
            type="submit"
            disabled={creating}
            className="w-full bg-brand-600 hover:bg-brand-500 text-white py-2 rounded-lg text-sm font-medium transition-colors disabled:opacity-50"
          >
            {creating ? 'Creating…' : 'Create Token'}
          </button>
        </form>
      )}

      {error && (
        <div className="bg-red-900/30 border border-red-700 text-red-300 px-4 py-2 rounded mb-4 text-sm">{error}</div>
      )}

      {loading ? (
        <div className="flex justify-center py-12">
          <div className="w-6 h-6 border-2 border-brand-500 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : tokens.length === 0 ? (
        <p className="text-gray-500 text-sm text-center py-12">No tokens yet.</p>
      ) : (
        <>
          {/* Desktop table */}
          <div className="hidden sm:block overflow-x-auto">
            <table className="min-w-full text-sm border border-gray-700 rounded-lg overflow-hidden">
              <thead className="bg-gray-800">
                <tr>
                  <th className="text-left px-4 py-2 text-gray-400 font-medium">Token</th>
                  <th className="text-left px-4 py-2 text-gray-400 font-medium">Status</th>
                  <th className="text-left px-4 py-2 text-gray-400 font-medium">Uses</th>
                  <th className="text-left px-4 py-2 text-gray-400 font-medium">Expires</th>
                  <th className="text-left px-4 py-2 text-gray-400 font-medium">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-700">
                {tokens.map(t => (
                  <tr key={t.id} className="hover:bg-gray-800/50">
                    <td className="px-4 py-2 font-mono text-xs text-gray-200">{t.token}</td>
                    <td className="px-4 py-2">
                      <span className={`text-xs px-2 py-0.5 rounded-full ${t.revoked_at ? 'bg-red-900/40 text-red-400' : t.valid ? 'bg-green-900/40 text-green-400' : 'bg-yellow-900/40 text-yellow-400'}`}>
                        {t.revoked_at ? 'Revoked' : t.valid ? 'Valid' : 'Expired'}
                      </span>
                    </td>
                    <td className="px-4 py-2 text-gray-400 text-xs">
                      {t.times_used}{t.usage_limit != null ? ` / ${t.usage_limit}` : ''}
                    </td>
                    <td className="px-4 py-2 text-gray-400 text-xs">
                      {t.expires_at ? new Date(t.expires_at).toLocaleDateString() : 'Never'}
                    </td>
                    <td className="px-4 py-2">
                      {!t.revoked_at && (
                        <button
                          onClick={() => handleRevoke(t.id, t.token)}
                          className="text-xs bg-red-700 hover:bg-red-600 text-white px-2 py-1 rounded transition-colors"
                        >
                          Revoke
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobile cards */}
          <div className="sm:hidden space-y-3">
            {tokens.map(t => (
              <div key={t.id} className="bg-gray-800 border border-gray-700 rounded-lg p-4">
                <div className="flex items-start justify-between mb-2">
                  <span className="font-mono text-sm text-gray-200 break-all mr-2">{t.token}</span>
                  <span className={`shrink-0 text-xs px-2 py-0.5 rounded-full ${t.revoked_at ? 'bg-red-900/40 text-red-400' : t.valid ? 'bg-green-900/40 text-green-400' : 'bg-yellow-900/40 text-yellow-400'}`}>
                    {t.revoked_at ? 'Revoked' : t.valid ? 'Valid' : 'Expired'}
                  </span>
                </div>
                <div className="text-xs text-gray-500 space-y-0.5 mb-3">
                  <div>Used: {t.times_used}{t.usage_limit != null ? ` / ${t.usage_limit}` : ''} times</div>
                  <div>Expires: {t.expires_at ? new Date(t.expires_at).toLocaleDateString() : 'Never'}</div>
                </div>
                {!t.revoked_at && (
                  <button
                    onClick={() => handleRevoke(t.id, t.token)}
                    className="w-full bg-red-700 hover:bg-red-600 text-white py-2 rounded-lg text-sm font-medium transition-colors"
                  >
                    Revoke Token
                  </button>
                )}
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  )
}
