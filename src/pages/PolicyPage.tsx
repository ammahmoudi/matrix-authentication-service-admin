import { useEffect, useMemo, useState } from 'react'
import { useAuth } from 'react-oidc-context'
import { getLatestPolicyData, getPolicyData, setPolicyData, PolicyData } from '../lib/masApi'

export default function PolicyPage() {
  const auth = useAuth()
  const token = auth.user?.access_token ?? ''

  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const [latest, setLatest] = useState<{ id: string; attributes: PolicyData } | null>(null)
  const [policyId, setPolicyId] = useState('')
  const [jsonText, setJsonText] = useState('')

  const parsedJson = useMemo(() => {
    try {
      if (!jsonText.trim()) return { ok: true as const, value: null }
      return { ok: true as const, value: JSON.parse(jsonText) }
    } catch (e: any) {
      return { ok: false as const, error: e?.message ?? 'Invalid JSON' }
    }
  }, [jsonText])

  const loadLatest = async () => {
    try {
      setLoading(true)
      setError('')
      const res = await getLatestPolicyData(token)
      setLatest({ id: res.data.id, attributes: res.data.attributes })
      setJsonText(JSON.stringify(res.data.attributes.data ?? {}, null, 2))
    } catch (e: any) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadLatest()
  }, [])

  const loadById = async () => {
    const id = policyId.trim()
    if (!id) return
    try {
      setLoading(true)
      setError('')
      const res = await getPolicyData(token, id)
      setLatest({ id: res.data.id, attributes: res.data.attributes })
      setJsonText(JSON.stringify(res.data.attributes.data ?? {}, null, 2))
    } catch (e: any) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }

  const save = async () => {
    if (!parsedJson.ok) {
      alert(parsedJson.error)
      return
    }
    if (parsedJson.value === null) {
      alert('JSON cannot be empty.')
      return
    }

    if (!confirm('Set policy data? This will apply immediately.')) return

    try {
      setError('')
      const res = await setPolicyData(token, parsedJson.value)
      setLatest({ id: res.data.id, attributes: res.data.attributes })
      alert('Policy data set.')
    } catch (e: any) {
      alert(e.message)
    }
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-xl font-bold">Policy</h1>
        <button onClick={loadLatest} className="text-sm text-brand-400 hover:text-brand-300">Refresh latest</button>
      </div>

      {error && (
        <div className="bg-red-900/30 border border-red-700 text-red-300 px-4 py-2 rounded mb-4 text-sm">{error}</div>
      )}

      <div className="bg-gray-800 border border-gray-700 rounded-lg p-4 mb-4">
        <div className="flex flex-col sm:flex-row sm:items-end gap-3">
          <div className="flex-1">
            <label className="block text-xs text-gray-400 mb-1">Load policy by ID</label>
            <input
              type="text"
              value={policyId}
              onChange={e => setPolicyId(e.target.value)}
              placeholder="01..."
              className="w-full bg-gray-900 border border-gray-600 rounded-lg px-3 py-2 text-sm text-gray-200 placeholder-gray-500 focus:outline-none focus:border-brand-500"
            />
          </div>
          <button
            onClick={loadById}
            className="bg-gray-700 hover:bg-gray-600 text-white px-4 py-2 rounded-lg text-sm transition-colors"
          >
            Load
          </button>
        </div>

        {latest && (
          <div className="mt-3 text-xs text-gray-400">
            <div>Current ID: <span className="font-mono">{latest.id}</span></div>
            <div>Created: {new Date(latest.attributes.created_at).toLocaleString()}</div>
          </div>
        )}
      </div>

      <div className="bg-gray-800 border border-gray-700 rounded-lg p-4">
        <div className="flex items-center justify-between mb-2">
          <h2 className="text-sm font-semibold text-gray-300">Policy data (JSON)</h2>
          <button
            onClick={save}
            disabled={loading || !parsedJson.ok}
            className="bg-brand-600 hover:bg-brand-500 text-white px-4 py-2 rounded-lg text-sm transition-colors disabled:opacity-50"
          >
            Set policy data
          </button>
        </div>

        {!parsedJson.ok && (
          <div className="text-xs text-red-300 mb-2">Invalid JSON: {parsedJson.error}</div>
        )}

        <textarea
          value={jsonText}
          onChange={e => setJsonText(e.target.value)}
          rows={16}
          aria-label="Policy data JSON"
          className="w-full bg-gray-900 border border-gray-600 rounded-lg px-3 py-2 text-xs text-gray-200 font-mono focus:outline-none focus:border-brand-500"
        />
      </div>
    </div>
  )
}
