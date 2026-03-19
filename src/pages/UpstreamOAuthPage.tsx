import { useEffect, useState } from 'react'
import { useAuth } from 'react-oidc-context'
import {
  addUpstreamOAuthLink,
  deleteUpstreamOAuthLink,
  getUpstreamOAuthLink,
  getUpstreamOAuthProvider,
  listUpstreamOAuthLinks,
  listUpstreamOAuthProviders,
  UpstreamOAuthLink,
  UpstreamOAuthProvider,
} from '../lib/masApi'

export default function UpstreamOAuthPage() {
  const auth = useAuth()
  const token = auth.user?.access_token ?? ''

  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const [providers, setProviders] = useState<(UpstreamOAuthProvider & { id: string })[]>([])
  const [links, setLinks] = useState<(UpstreamOAuthLink & { id: string })[]>([])

  const [providerEnabledOnly, setProviderEnabledOnly] = useState(false)

  const [filterLinkUser, setFilterLinkUser] = useState('')
  const [filterLinkProvider, setFilterLinkProvider] = useState('')
  const [filterLinkSubject, setFilterLinkSubject] = useState('')

  const [newUserId, setNewUserId] = useState('')
  const [newProviderId, setNewProviderId] = useState('')
  const [newSubject, setNewSubject] = useState('')
  const [newHumanName, setNewHumanName] = useState('')

  const [lookupProviderId, setLookupProviderId] = useState('')
  const [lookupLinkId, setLookupLinkId] = useState('')
  const [lookupJson, setLookupJson] = useState('')

  const load = async () => {
    try {
      setLoading(true)
      setError('')
      const [p, l] = await Promise.all([
        listUpstreamOAuthProviders(token, { enabled: providerEnabledOnly ? true : null }),
        listUpstreamOAuthLinks(token, {
          user: filterLinkUser.trim() || undefined,
          provider: filterLinkProvider.trim() || undefined,
          subject: filterLinkSubject.trim() || undefined,
        }),
      ])
      setProviders(p.data.map(d => ({ id: d.id, ...d.attributes })))
      setLinks(l.data.map(d => ({ id: d.id, ...d.attributes })))
    } catch (e: any) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
  }, [])

  const add = async (e: React.FormEvent) => {
    e.preventDefault()
    const user_id = newUserId.trim()
    const provider_id = newProviderId.trim()
    const subject = newSubject.trim()
    if (!user_id || !provider_id || !subject) return

    try {
      await addUpstreamOAuthLink(token, {
        user_id,
        provider_id,
        subject,
        human_account_name: newHumanName.trim() || null,
      })
      setNewSubject('')
      setNewHumanName('')
      await load()
    } catch (e: any) {
      alert(e.message)
    }
  }

  const del = async (id: string) => {
    if (!confirm('Delete this upstream OAuth link?')) return
    try {
      await deleteUpstreamOAuthLink(token, id)
      await load()
    } catch (e: any) {
      alert(e.message)
    }
  }

  const lookupProvider = async () => {
    const id = lookupProviderId.trim()
    if (!id) return
    try {
      const res = await getUpstreamOAuthProvider(token, id)
      setLookupJson(JSON.stringify({ id: res.data.id, ...res.data.attributes }, null, 2))
    } catch (e: any) {
      alert(e.message)
    }
  }

  const lookupLink = async () => {
    const id = lookupLinkId.trim()
    if (!id) return
    try {
      const res = await getUpstreamOAuthLink(token, id)
      setLookupJson(JSON.stringify({ id: res.data.id, ...res.data.attributes }, null, 2))
    } catch (e: any) {
      alert(e.message)
    }
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-xl font-bold">Upstream OAuth</h1>
        <button onClick={load} className="text-sm text-brand-400 hover:text-brand-300">Refresh</button>
      </div>

      {error && (
        <div className="bg-red-900/30 border border-red-700 text-red-300 px-4 py-2 rounded mb-4 text-sm">{error}</div>
      )}

      <div className="bg-gray-800 border border-gray-700 rounded-lg p-4 mb-4 space-y-3">
        <h2 className="text-sm font-semibold text-gray-300">Providers</h2>
        <label className="flex items-center gap-2 text-xs text-gray-400">
          <input type="checkbox" checked={providerEnabledOnly} onChange={e => setProviderEnabledOnly(e.target.checked)} />
          Enabled only
        </label>

        {loading ? (
          <div className="flex justify-center py-6">
            <div className="w-6 h-6 border-2 border-brand-500 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : providers.length === 0 ? (
          <p className="text-gray-500 text-sm">No providers found.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm border border-gray-700 rounded-lg overflow-hidden">
              <thead className="bg-gray-800">
                <tr>
                  <th className="text-left px-4 py-2 text-gray-400 font-medium">ID</th>
                  <th className="text-left px-4 py-2 text-gray-400 font-medium">Name</th>
                  <th className="text-left px-4 py-2 text-gray-400 font-medium">Issuer</th>
                  <th className="text-left px-4 py-2 text-gray-400 font-medium">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-700">
                {providers.map(p => (
                  <tr key={p.id} className="hover:bg-gray-800/50">
                    <td className="px-4 py-2 text-gray-400 font-mono text-xs">{p.id}</td>
                    <td className="px-4 py-2 text-gray-200">{p.human_name}</td>
                    <td className="px-4 py-2 text-gray-400 text-xs max-w-sm truncate">{p.issuer ?? '-'}</td>
                    <td className="px-4 py-2">
                      <span className={`text-xs px-2 py-0.5 rounded-full ${p.disabled_at ? 'bg-gray-700 text-gray-300' : 'bg-green-900/40 text-green-400'}`}>
                        {p.disabled_at ? 'Disabled' : 'Enabled'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <div className="bg-gray-800 border border-gray-700 rounded-lg p-4 mb-4 space-y-3">
        <h2 className="text-sm font-semibold text-gray-300">Lookup by ID</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="block text-xs text-gray-400 mb-1">Provider id</label>
            <div className="flex gap-2">
              <input
                type="text"
                value={lookupProviderId}
                onChange={e => setLookupProviderId(e.target.value)}
                placeholder="01..."
                className="flex-1 bg-gray-900 border border-gray-600 rounded-lg px-3 py-2 text-sm text-gray-200 placeholder-gray-500 focus:outline-none focus:border-brand-500"
              />
              <button
                onClick={lookupProvider}
                className="bg-gray-700 hover:bg-gray-600 text-white px-4 py-2 rounded-lg text-sm transition-colors"
              >
                Lookup
              </button>
            </div>
          </div>
          <div>
            <label className="block text-xs text-gray-400 mb-1">Link id</label>
            <div className="flex gap-2">
              <input
                type="text"
                value={lookupLinkId}
                onChange={e => setLookupLinkId(e.target.value)}
                placeholder="01..."
                className="flex-1 bg-gray-900 border border-gray-600 rounded-lg px-3 py-2 text-sm text-gray-200 placeholder-gray-500 focus:outline-none focus:border-brand-500"
              />
              <button
                onClick={lookupLink}
                className="bg-gray-700 hover:bg-gray-600 text-white px-4 py-2 rounded-lg text-sm transition-colors"
              >
                Lookup
              </button>
            </div>
          </div>
        </div>
        {lookupJson && (
          <pre className="text-xs text-gray-300 whitespace-pre-wrap bg-gray-900 border border-gray-700 rounded-lg p-3">{lookupJson}</pre>
        )}
      </div>

      <div className="bg-gray-800 border border-gray-700 rounded-lg p-4 mb-4 space-y-3">
        <h2 className="text-sm font-semibold text-gray-300">Links</h2>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div>
            <label className="block text-xs text-gray-400 mb-1">Filter user</label>
            <input
              type="text"
              value={filterLinkUser}
              onChange={e => setFilterLinkUser(e.target.value)}
              placeholder="01..."
              className="w-full bg-gray-900 border border-gray-600 rounded-lg px-3 py-2 text-sm text-gray-200 placeholder-gray-500 focus:outline-none focus:border-brand-500"
            />
          </div>
          <div>
            <label className="block text-xs text-gray-400 mb-1">Filter provider</label>
            <input
              type="text"
              value={filterLinkProvider}
              onChange={e => setFilterLinkProvider(e.target.value)}
              placeholder="01..."
              className="w-full bg-gray-900 border border-gray-600 rounded-lg px-3 py-2 text-sm text-gray-200 placeholder-gray-500 focus:outline-none focus:border-brand-500"
            />
          </div>
          <div>
            <label className="block text-xs text-gray-400 mb-1">Filter subject</label>
            <input
              type="text"
              value={filterLinkSubject}
              onChange={e => setFilterLinkSubject(e.target.value)}
              placeholder="subject"
              className="w-full bg-gray-900 border border-gray-600 rounded-lg px-3 py-2 text-sm text-gray-200 placeholder-gray-500 focus:outline-none focus:border-brand-500"
            />
          </div>
        </div>

        <button
          onClick={load}
          className="bg-brand-600 hover:bg-brand-500 text-white px-4 py-2 rounded-lg text-sm transition-colors"
        >
          Apply filters
        </button>

        {loading ? (
          <div className="flex justify-center py-6">
            <div className="w-6 h-6 border-2 border-brand-500 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : links.length === 0 ? (
          <p className="text-gray-500 text-sm">No links found.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm border border-gray-700 rounded-lg overflow-hidden">
              <thead className="bg-gray-800">
                <tr>
                  <th className="text-left px-4 py-2 text-gray-400 font-medium">User</th>
                  <th className="text-left px-4 py-2 text-gray-400 font-medium">Provider</th>
                  <th className="text-left px-4 py-2 text-gray-400 font-medium">Subject</th>
                  <th className="text-left px-4 py-2 text-gray-400 font-medium">Name</th>
                  <th className="text-left px-4 py-2 text-gray-400 font-medium">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-700">
                {links.map(l => (
                  <tr key={l.id} className="hover:bg-gray-800/50">
                    <td className="px-4 py-2 text-gray-400 font-mono text-xs">{l.user_id ?? '-'}</td>
                    <td className="px-4 py-2 text-gray-400 font-mono text-xs">{l.provider_id}</td>
                    <td className="px-4 py-2 text-gray-200">{l.subject}</td>
                    <td className="px-4 py-2 text-gray-400 text-xs">{l.human_account_name ?? '-'}</td>
                    <td className="px-4 py-2">
                      <button
                        onClick={() => del(l.id)}
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

      <form onSubmit={add} className="bg-gray-800 border border-gray-700 rounded-lg p-4 space-y-3">
        <h2 className="text-sm font-semibold text-gray-300">Add link</h2>
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
            <label className="block text-xs text-gray-400 mb-1">Provider id</label>
            <input
              type="text"
              value={newProviderId}
              onChange={e => setNewProviderId(e.target.value)}
              placeholder="01..."
              className="w-full bg-gray-900 border border-gray-600 rounded-lg px-3 py-2 text-sm text-gray-200 placeholder-gray-500 focus:outline-none focus:border-brand-500"
            />
          </div>
          <div>
            <label className="block text-xs text-gray-400 mb-1">Subject</label>
            <input
              type="text"
              value={newSubject}
              onChange={e => setNewSubject(e.target.value)}
              placeholder="sub claim"
              className="w-full bg-gray-900 border border-gray-600 rounded-lg px-3 py-2 text-sm text-gray-200 placeholder-gray-500 focus:outline-none focus:border-brand-500"
            />
          </div>
          <div>
            <label className="block text-xs text-gray-400 mb-1">Human account name (optional)</label>
            <input
              type="text"
              value={newHumanName}
              onChange={e => setNewHumanName(e.target.value)}
              placeholder="Alice (Google)"
              className="w-full bg-gray-900 border border-gray-600 rounded-lg px-3 py-2 text-sm text-gray-200 placeholder-gray-500 focus:outline-none focus:border-brand-500"
            />
          </div>
        </div>
        <button
          type="submit"
          className="w-full bg-brand-600 hover:bg-brand-500 text-white py-2 rounded-lg text-sm font-medium transition-colors"
        >
          Add link
        </button>
      </form>
    </div>
  )
}
