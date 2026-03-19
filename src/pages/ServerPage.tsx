import { useEffect, useState } from 'react'
import { useAuth } from 'react-oidc-context'
import { getSiteConfig, getVersion, SiteConfig, Version } from '../lib/masApi'

export default function ServerPage() {
  const auth = useAuth()
  const token = auth.user?.access_token ?? ''

  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [siteConfig, setSiteConfig] = useState<SiteConfig | null>(null)
  const [version, setVersion] = useState<Version | null>(null)

  const load = async () => {
    try {
      setLoading(true)
      setError('')
      const [v, sc] = await Promise.all([getVersion(token), getSiteConfig(token)])
      setVersion(v)
      setSiteConfig(sc)
    } catch (e: any) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
  }, [])

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-xl font-bold">Server</h1>
        <button onClick={load} className="text-sm text-brand-400 hover:text-brand-300">Refresh</button>
      </div>

      {error && (
        <div className="bg-red-900/30 border border-red-700 text-red-300 px-4 py-2 rounded mb-4 text-sm">{error}</div>
      )}

      {loading ? (
        <div className="flex justify-center py-12">
          <div className="w-6 h-6 border-2 border-brand-500 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : (
        <div className="space-y-4">
          <div className="bg-gray-800 border border-gray-700 rounded-lg p-4">
            <h2 className="text-sm font-semibold text-gray-300 mb-2">Version</h2>
            <pre className="text-xs text-gray-300 whitespace-pre-wrap">{JSON.stringify(version, null, 2)}</pre>
          </div>
          <div className="bg-gray-800 border border-gray-700 rounded-lg p-4">
            <h2 className="text-sm font-semibold text-gray-300 mb-2">Site config</h2>
            <pre className="text-xs text-gray-300 whitespace-pre-wrap">{JSON.stringify(siteConfig, null, 2)}</pre>
          </div>
        </div>
      )}
    </div>
  )
}
