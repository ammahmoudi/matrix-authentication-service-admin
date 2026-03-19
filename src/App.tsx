import { useAuth } from 'react-oidc-context'
import { Routes, Route, Navigate } from 'react-router-dom'
import Layout from './components/Layout'
import LoginPage from './pages/LoginPage'
import UsersPage from './pages/UsersPage'
import RegistrationTokensPage from './pages/RegistrationTokensPage'
import SessionsPage from './pages/SessionsPage'
import EmailsPage from './pages/EmailsPage'
import UpstreamOAuthPage from './pages/UpstreamOAuthPage'
import PolicyPage from './pages/PolicyPage'
import ServerPage from './pages/ServerPage'

export default function App() {
  const auth = useAuth()

  if (auth.isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-brand-500 border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  if (auth.error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="card max-w-md w-full text-center space-y-4">
          <p className="text-red-400">Auth error: {auth.error.message}</p>
          <button className="btn-secondary" onClick={() => auth.removeUser()}>
            Try again
          </button>
        </div>
      </div>
    )
  }

  if (!auth.isAuthenticated) {
    return <LoginPage />
  }

  return (
    <Layout>
      <Routes>
        <Route path="/mas-admin/" element={<Navigate to="/mas-admin/users" replace />} />
        <Route path="/mas-admin/callback" element={<Navigate to="/mas-admin/users" replace />} />
        <Route path="/mas-admin/users" element={<UsersPage />} />
        <Route path="/mas-admin/tokens" element={<RegistrationTokensPage />} />
        <Route path="/mas-admin/sessions" element={<SessionsPage />} />
        <Route path="/mas-admin/emails" element={<EmailsPage />} />
        <Route path="/mas-admin/upstream-oauth" element={<UpstreamOAuthPage />} />
        <Route path="/mas-admin/policy" element={<PolicyPage />} />
        <Route path="/mas-admin/server" element={<ServerPage />} />
        <Route path="*" element={<Navigate to="/mas-admin/users" replace />} />
      </Routes>
    </Layout>
  )
}
