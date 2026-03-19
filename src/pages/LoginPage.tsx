import { useAuth } from 'react-oidc-context'
import { ShieldCheck } from 'lucide-react'

export default function LoginPage() {
  const auth = useAuth()

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="card max-w-sm w-full space-y-6 text-center">
        <div className="flex justify-center">
          <div className="w-12 h-12 rounded-xl bg-brand-500/10 flex items-center justify-center">
            <ShieldCheck className="w-6 h-6 text-brand-500" />
          </div>
        </div>
        <div>
          <h1 className="text-xl font-semibold">MAS Admin</h1>
          <p className="text-gray-500 text-sm mt-1">Sign in with your admin account</p>
        </div>
        <button
          className="btn-primary w-full justify-center"
          onClick={() => auth.signinRedirect()}
        >
          Sign in with MAS
        </button>

        <p className="text-xs text-gray-500">
          Built by{' '}
          <a
            href="https://github.com/ammahmoudi"
            target="_blank"
            rel="noreferrer"
            className="underline hover:text-gray-300"
          >
            @ammahmoudi
          </a>
          {' '}
          ·{' '}
          <a
            href="https://github.com/ammahmoudi/matrix-authentication-service-admin"
            target="_blank"
            rel="noreferrer"
            className="underline hover:text-gray-300"
          >
            source
          </a>
        </p>
      </div>
    </div>
  )
}
