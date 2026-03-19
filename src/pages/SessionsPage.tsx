import { useEffect, useState } from 'react'
import { useAuth } from 'react-oidc-context'
import {
  CompatSession,
  OAuth2Session,
  PersonalSession,
  UserSession,
  finishCompatSession,
  finishOAuth2Session,
  finishUserSession,
  getCompatSession,
  getOAuth2Session,
  getPersonalSession,
  getUserSession,
  listCompatSessions,
  listOAuth2Sessions,
  listPersonalSessions,
  listUserSessions,
  regeneratePersonalSession,
  revokePersonalSession,
} from '../lib/masApi'

type SessionKind = 'compat' | 'oauth2' | 'user' | 'personal'

export default function SessionsPage() {
  const auth = useAuth()
  const token = auth.user?.access_token ?? ''

  const [kind, setKind] = useState<SessionKind>('compat')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const [compat, setCompat] = useState<(CompatSession & { id: string })[]>([])
  const [oauth2, setOauth2] = useState<(OAuth2Session & { id: string })[]>([])
  const [userSessions, setUserSessions] = useState<(UserSession & { id: string })[]>([])
  const [personal, setPersonal] = useState<(PersonalSession & { id: string })[]>([])

  const [filterUser, setFilterUser] = useState('')
  const [filterClient, setFilterClient] = useState('')
  const [status, setStatus] = useState('')

  const [filterOwnerUser, setFilterOwnerUser] = useState('')
  const [filterOwnerClient, setFilterOwnerClient] = useState('')
  const [filterActorUser, setFilterActorUser] = useState('')

  const [lookupId, setLookupId] = useState('')
  const [lookupJson, setLookupJson] = useState<string>('')

  const load = async () => {
    try {
      setLoading(true)
      setError('')

      if (kind === 'compat') {
        const res = await listCompatSessions(token)
        setCompat(res.data.map(d => ({ id: d.id, ...d.attributes })))
        return
      }

      if (kind === 'oauth2') {
        const res = await listOAuth2Sessions(token, {
          user: filterUser.trim() || undefined,
          client: filterClient.trim() || undefined,
          status: status ? (status as any) : null,
        })
        setOauth2(res.data.map(d => ({ id: d.id, ...d.attributes })))
        return
      }

      if (kind === 'user') {
        const res = await listUserSessions(token, {
          user: filterUser.trim() || undefined,
          status: status ? (status as any) : null,
        })
        setUserSessions(res.data.map(d => ({ id: d.id, ...d.attributes })))
        return
      }

      const res = await listPersonalSessions(token, {
        ownerUser: filterOwnerUser.trim() || undefined,
        ownerClient: filterOwnerClient.trim() || undefined,
        actorUser: filterActorUser.trim() || undefined,
        status: status ? (status as any) : null,
      })
      setPersonal(res.data.map(d => ({ id: d.id, ...d.attributes })))
    } catch (e: any) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
  }, [kind])

  const finish = async (id: string) => {
    if (!confirm('Finish this session?')) return
    try {
      if (kind === 'compat') await finishCompatSession(token, id)
      if (kind === 'oauth2') await finishOAuth2Session(token, id)
      if (kind === 'user') await finishUserSession(token, id)
      await load()
    } catch (e: any) {
      alert(e.message)
    }
  }

  const revoke = async (id: string) => {
    if (!confirm('Revoke this personal session?')) return
    try {
      await revokePersonalSession(token, id)
      await load()
    } catch (e: any) {
      alert(e.message)
    }
  }

  const regenerate = async (id: string) => {
    if (!confirm('Regenerate this personal session?')) return
    try {
      await regeneratePersonalSession(token, id)
      await load()
    } catch (e: any) {
      alert(e.message)
    }
  }

  const doLookup = async () => {
    const id = lookupId.trim()
    if (!id) return
    try {
      if (kind === 'compat') {
        const res = await getCompatSession(token, id)
        setLookupJson(JSON.stringify({ id: res.data.id, ...res.data.attributes }, null, 2))
        return
      }
      if (kind === 'oauth2') {
        const res = await getOAuth2Session(token, id)
        setLookupJson(JSON.stringify({ id: res.data.id, ...res.data.attributes }, null, 2))
        return
      }
      if (kind === 'user') {
        const res = await getUserSession(token, id)
        setLookupJson(JSON.stringify({ id: res.data.id, ...res.data.attributes }, null, 2))
        return
      }
      const res = await getPersonalSession(token, id)
      setLookupJson(JSON.stringify({ id: res.data.id, ...res.data.attributes }, null, 2))
    } catch (e: any) {
      alert(e.message)
    }
  }

  const empty =
    kind === 'compat'
      ? compat.length === 0
      : kind === 'oauth2'
        ? oauth2.length === 0
        : kind === 'user'
          ? userSessions.length === 0
          : personal.length === 0

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-xl font-bold">Sessions</h1>
        <div className="flex gap-2 items-center">
          <select
            value={kind}
            onChange={e => setKind(e.target.value as SessionKind)}
            aria-label="Session kind"
            className="bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-gray-200 focus:outline-none focus:border-brand-500"
          >
            <option value="compat">Compat</option>
            <option value="oauth2">OAuth2</option>
            <option value="user">User</option>
            <option value="personal">Personal</option>
          </select>
          <button onClick={load} className="text-sm text-brand-400 hover:text-brand-300">Refresh</button>
        </div>
      </div>

      {error && (
        <div className="bg-red-900/30 border border-red-700 text-red-300 px-4 py-2 rounded mb-4 text-sm">{error}</div>
      )}

      {(kind === 'oauth2' || kind === 'user') && (
        <div className="bg-gray-800 border border-gray-700 rounded-lg p-4 mb-4 space-y-3">
          <h2 className="text-sm font-semibold text-gray-300">Filters</h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-xs text-gray-400 mb-1">User id</label>
              <input
                type="text"
                value={filterUser}
                onChange={e => setFilterUser(e.target.value)}
                placeholder="01..."
                className="w-full bg-gray-900 border border-gray-600 rounded-lg px-3 py-2 text-sm text-gray-200 placeholder-gray-500 focus:outline-none focus:border-brand-500"
              />
            </div>
            {kind === 'oauth2' && (
              <div>
                <label className="block text-xs text-gray-400 mb-1">Client id</label>
                <input
                  type="text"
                  value={filterClient}
                  onChange={e => setFilterClient(e.target.value)}
                  placeholder="01..."
                  className="w-full bg-gray-900 border border-gray-600 rounded-lg px-3 py-2 text-sm text-gray-200 placeholder-gray-500 focus:outline-none focus:border-brand-500"
                />
              </div>
            )}
            <div>
              <label className="block text-xs text-gray-400 mb-1">Status</label>
              <select
                value={status}
                onChange={e => setStatus(e.target.value)}
                aria-label="Session status filter"
                className="w-full bg-gray-900 border border-gray-600 rounded-lg px-3 py-2 text-sm text-gray-200 focus:outline-none focus:border-brand-500"
              >
                <option value="">All</option>
                <option value="active">Active</option>
                <option value="finished">Finished</option>
              </select>
            </div>
          </div>
          <button
            onClick={load}
            className="bg-brand-600 hover:bg-brand-500 text-white px-4 py-2 rounded-lg text-sm transition-colors"
          >
            Apply filters
          </button>
        </div>
      )}

      {kind === 'personal' && (
        <div className="bg-gray-800 border border-gray-700 rounded-lg p-4 mb-4 space-y-3">
          <h2 className="text-sm font-semibold text-gray-300">Filters</h2>
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
            <div>
              <label className="block text-xs text-gray-400 mb-1">Owner user</label>
              <input
                type="text"
                value={filterOwnerUser}
                onChange={e => setFilterOwnerUser(e.target.value)}
                placeholder="01..."
                className="w-full bg-gray-900 border border-gray-600 rounded-lg px-3 py-2 text-sm text-gray-200 placeholder-gray-500 focus:outline-none focus:border-brand-500"
              />
            </div>
            <div>
              <label className="block text-xs text-gray-400 mb-1">Owner client</label>
              <input
                type="text"
                value={filterOwnerClient}
                onChange={e => setFilterOwnerClient(e.target.value)}
                placeholder="01..."
                className="w-full bg-gray-900 border border-gray-600 rounded-lg px-3 py-2 text-sm text-gray-200 placeholder-gray-500 focus:outline-none focus:border-brand-500"
              />
            </div>
            <div>
              <label className="block text-xs text-gray-400 mb-1">Actor user</label>
              <input
                type="text"
                value={filterActorUser}
                onChange={e => setFilterActorUser(e.target.value)}
                placeholder="01..."
                className="w-full bg-gray-900 border border-gray-600 rounded-lg px-3 py-2 text-sm text-gray-200 placeholder-gray-500 focus:outline-none focus:border-brand-500"
              />
            </div>
            <div>
              <label className="block text-xs text-gray-400 mb-1">Status</label>
              <select
                value={status}
                onChange={e => setStatus(e.target.value)}
                aria-label="Personal session status filter"
                className="w-full bg-gray-900 border border-gray-600 rounded-lg px-3 py-2 text-sm text-gray-200 focus:outline-none focus:border-brand-500"
              >
                <option value="">All</option>
                <option value="active">Active</option>
                <option value="revoked">Revoked</option>
              </select>
            </div>
          </div>
          <button
            onClick={load}
            className="bg-brand-600 hover:bg-brand-500 text-white px-4 py-2 rounded-lg text-sm transition-colors"
          >
            Apply filters
          </button>
        </div>
      )}

      <div className="bg-gray-800 border border-gray-700 rounded-lg p-4 mb-4 space-y-3">
        <h2 className="text-sm font-semibold text-gray-300">Lookup by ID</h2>
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
      ) : empty ? (
        <p className="text-gray-500 text-sm text-center py-12">No sessions found.</p>
      ) : (
        <div className="space-y-3">
          {kind === 'compat' &&
            compat.map(s => (
              <div key={s.id} className="bg-gray-800 border border-gray-700 rounded-lg p-4">
                <div className="flex items-start justify-between mb-2">
                  <span className="font-mono text-xs text-gray-400">{s.id}</span>
                  <span className={`text-xs px-2 py-0.5 rounded-full ${s.finished_at ? 'bg-gray-700 text-gray-400' : 'bg-green-900/40 text-green-400'}`}>
                    {s.finished_at ? 'Finished' : 'Active'}
                  </span>
                </div>
                <div className="text-xs text-gray-500 space-y-0.5 mb-3">
                  <div>User: <span className="font-mono">{s.user_id}</span></div>
                  <div>Device: <span className="font-mono">{s.device_id}</span></div>
                  <div>Created: {new Date(s.created_at).toLocaleString()}</div>
                  {s.last_active_at && <div>Last active: {new Date(s.last_active_at).toLocaleString()}</div>}
                  {s.user_agent && <div>UA: {s.user_agent}</div>}
                </div>
                {!s.finished_at && (
                  <button
                    onClick={() => finish(s.id)}
                    className="w-full bg-red-700 hover:bg-red-600 text-white py-2 rounded-lg text-sm font-medium transition-colors"
                  >
                    Finish
                  </button>
                )}
              </div>
            ))}

          {kind === 'oauth2' &&
            oauth2.map(s => (
              <div key={s.id} className="bg-gray-800 border border-gray-700 rounded-lg p-4">
                <div className="flex items-start justify-between mb-2">
                  <span className="font-mono text-xs text-gray-400">{s.id}</span>
                  <span className={`text-xs px-2 py-0.5 rounded-full ${s.finished_at ? 'bg-gray-700 text-gray-400' : 'bg-green-900/40 text-green-400'}`}>
                    {s.finished_at ? 'Finished' : 'Active'}
                  </span>
                </div>
                <div className="text-xs text-gray-500 space-y-0.5 mb-3">
                  <div>User: <span className="font-mono">{s.user_id ?? '-'}</span></div>
                  <div>Client: <span className="font-mono">{s.client_id}</span></div>
                  <div>Scope: {s.scope}</div>
                  {s.human_name && <div>Name: {s.human_name}</div>}
                  <div>Created: {new Date(s.created_at).toLocaleString()}</div>
                  {s.last_active_at && <div>Last active: {new Date(s.last_active_at).toLocaleString()}</div>}
                  {s.user_agent && <div>UA: {s.user_agent}</div>}
                </div>
                {!s.finished_at && (
                  <button
                    onClick={() => finish(s.id)}
                    className="w-full bg-red-700 hover:bg-red-600 text-white py-2 rounded-lg text-sm font-medium transition-colors"
                  >
                    Finish
                  </button>
                )}
              </div>
            ))}

          {kind === 'user' &&
            userSessions.map(s => (
              <div key={s.id} className="bg-gray-800 border border-gray-700 rounded-lg p-4">
                <div className="flex items-start justify-between mb-2">
                  <span className="font-mono text-xs text-gray-400">{s.id}</span>
                  <span className={`text-xs px-2 py-0.5 rounded-full ${s.finished_at ? 'bg-gray-700 text-gray-400' : 'bg-green-900/40 text-green-400'}`}>
                    {s.finished_at ? 'Finished' : 'Active'}
                  </span>
                </div>
                <div className="text-xs text-gray-500 space-y-0.5 mb-3">
                  <div>User: <span className="font-mono">{s.user_id}</span></div>
                  <div>Created: {new Date(s.created_at).toLocaleString()}</div>
                  {s.last_active_at && <div>Last active: {new Date(s.last_active_at).toLocaleString()}</div>}
                  {s.user_agent && <div>UA: {s.user_agent}</div>}
                </div>
                {!s.finished_at && (
                  <button
                    onClick={() => finish(s.id)}
                    className="w-full bg-red-700 hover:bg-red-600 text-white py-2 rounded-lg text-sm font-medium transition-colors"
                  >
                    Finish
                  </button>
                )}
              </div>
            ))}

          {kind === 'personal' &&
            personal.map(s => (
              <div key={s.id} className="bg-gray-800 border border-gray-700 rounded-lg p-4">
                <div className="flex items-start justify-between mb-2">
                  <span className="font-mono text-xs text-gray-400">{s.id}</span>
                  <span className={`text-xs px-2 py-0.5 rounded-full ${s.revoked_at ? 'bg-gray-700 text-gray-400' : 'bg-green-900/40 text-green-400'}`}>
                    {s.revoked_at ? 'Revoked' : 'Active'}
                  </span>
                </div>
                <div className="text-xs text-gray-500 space-y-0.5 mb-3">
                  <div>Actor: <span className="font-mono">{s.actor_user_id}</span></div>
                  <div>Owner user: <span className="font-mono">{s.owner_user_id ?? '-'}</span></div>
                  <div>Owner client: <span className="font-mono">{s.owner_client_id ?? '-'}</span></div>
                  <div>Name: {s.human_name}</div>
                  <div>Scope: {s.scope}</div>
                  {s.expires_at && <div>Expires: {new Date(s.expires_at).toLocaleString()}</div>}
                  {s.last_active_at && <div>Last active: {new Date(s.last_active_at).toLocaleString()}</div>}
                </div>
                <div className="grid grid-cols-2 gap-2">
                  {!s.revoked_at ? (
                    <button
                      onClick={() => revoke(s.id)}
                      className="bg-red-700 hover:bg-red-600 text-white py-2 rounded-lg text-sm font-medium transition-colors"
                    >
                      Revoke
                    </button>
                  ) : (
                    <div className="bg-gray-900 border border-gray-700 text-gray-400 py-2 rounded-lg text-sm font-medium text-center">
                      Revoked
                    </div>
                  )}
                  <button
                    onClick={() => regenerate(s.id)}
                    className="border border-gray-600 hover:bg-gray-700 text-gray-200 py-2 rounded-lg text-sm font-medium transition-colors"
                  >
                    Regenerate
                  </button>
                </div>
              </div>
            ))}
        </div>
      )}
    </div>
  )
}
