import { useState, useEffect } from 'react'
import { useAuth } from 'react-oidc-context'
import { listSessions, revokeSession, MasSession } from '../lib/masApi'

export default function SessionsPage() {
  const auth = useAuth()
  const token = auth.user?.access_token ?? ''

  const [sessions, setSessions] = useState<(MasSession & { id: string })[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const load = async () => {
    try {
      setLoading(true)
      setError('')
      const res = await listSessions(token)
      setSessions(res.data.map(d => ({ id: d.id, ...d.attributes })))
    } catch (e: any) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [])

  const finish = async (id: string) => {
    if (!confirm('Finish this session?')) return
    try {
      await revokeSession(token, id)
      await load()
    } catch (e: any) {
      alert(e.message)
    }
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-xl font-bold">Compat Sessions</h1>
        <button onClick={load} className="text-sm text-brand-400 hover:text-brand-300">Refresh</button>
      </div>

      {error && (
        <div className="bg-red-900/30 border border-red-700 text-red-300 px-4 py-2 rounded mb-4 text-sm">{error}</div>
      )}

      {loading ? (
        <div className="flex justify-center py-12">
          <div className="w-6 h-6 border-2 border-brand-500 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : sessions.length === 0 ? (
        <p className="text-gray-500 text-sm text-center py-12">No sessions found.</p>
      ) : (
        <>
          {/* Desktop table */}
          <div className="hidden sm:block overflow-x-auto">
            <table className="min-w-full text-sm border border-gray-700 rounded-lg overflow-hidden">
              <thead className="bg-gray-800">
                <tr>
                  <th className="text-left px-4 py-2 text-gray-400 font-medium">ID</th>
                  <th className="text-left px-4 py-2 text-gray-400 font-medium">User Agent</th>
                  <th className="text-left px-4 py-2 text-gray-400 font-medium">Status</th>
                  <th className="text-left px-4 py-2 text-gray-400 font-medium">Created</th>
                  <th className="text-left px-4 py-2 text-gray-400 font-medium">Last Active</th>
                  <th className="text-left px-4 py-2 text-gray-400 font-medium">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-700">
                {sessions.map(s => (
                  <tr key={s.id} className="hover:bg-gray-800/50">
                    <td className="px-4 py-2 font-mono text-xs text-gray-400">{s.id.slice(0, 10)}…</td>
                    <td className="px-4 py-2 text-gray-300 max-w-xs truncate">{s.user_agent ?? '-'}</td>
                    <td className="px-4 py-2">
                      <span className={`text-xs px-2 py-0.5 rounded-full ${s.finished_at ? 'bg-gray-700 text-gray-400' : 'bg-green-900/40 text-green-400'}`}>
                        {s.finished_at ? 'Finished' : 'Active'}
                      </span>
                    </td>
                    <td className="px-4 py-2 text-gray-400 text-xs">{new Date(s.created_at).toLocaleDateString()}</td>
                    <td className="px-4 py-2 text-gray-400 text-xs">{s.last_active_at ? new Date(s.last_active_at).toLocaleDateString() : '-'}</td>
                    <td className="px-4 py-2">
                      {!s.finished_at && (
                        <button
                          onClick={() => finish(s.id)}
                          className="text-xs bg-red-700 hover:bg-red-600 text-white px-2 py-1 rounded transition-colors"
                        >
                          Finish
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
            {sessions.map(s => (
              <div key={s.id} className="bg-gray-800 border border-gray-700 rounded-lg p-4">
                <div className="flex items-start justify-between mb-2">
                  <span className="font-mono text-xs text-gray-400">{s.id.slice(0, 14)}…</span>
                  <span className={`text-xs px-2 py-0.5 rounded-full ${s.finished_at ? 'bg-gray-700 text-gray-400' : 'bg-green-900/40 text-green-400'}`}>
                    {s.finished_at ? 'Finished' : 'Active'}
                  </span>
                </div>
                {s.user_agent && (
                  <p className="text-xs text-gray-400 truncate mb-2">{s.user_agent}</p>
                )}
                <div className="text-xs text-gray-500 space-y-0.5 mb-3">
                  <div>Created: {new Date(s.created_at).toLocaleDateString()}</div>
                  {s.last_active_at && <div>Last active: {new Date(s.last_active_at).toLocaleDateString()}</div>}
                </div>
                {!s.finished_at && (
                  <button
                    onClick={() => finish(s.id)}
                    className="w-full bg-red-700 hover:bg-red-600 text-white py-2 rounded-lg text-sm font-medium transition-colors"
                  >
                    Finish Session
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
