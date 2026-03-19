import { useAuth } from 'react-oidc-context'
import { NavLink } from 'react-router-dom'
import { Users, KeyRound, MonitorSmartphone, LogOut, ShieldCheck } from 'lucide-react'
import clsx from 'clsx'

const nav = [
  { to: '/mas-admin/users', label: 'Users', icon: Users },
  { to: '/mas-admin/tokens', label: 'Tokens', icon: KeyRound },
  { to: '/mas-admin/sessions', label: 'Sessions', icon: MonitorSmartphone },
]

export default function Layout({ children }: { children: React.ReactNode }) {
  const auth = useAuth()

  return (
    <div className="min-h-screen flex flex-col sm:flex-row">
      {/* Sidebar — desktop only */}
      <aside className="hidden sm:flex w-56 flex-shrink-0 bg-gray-900 border-r border-gray-800 flex-col">
        <div className="p-4 border-b border-gray-800">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-brand-500" />
            <span className="font-semibold text-sm">MAS Admin</span>
          </div>
          <p className="text-xs text-gray-500 mt-1 truncate">{auth.user?.profile.preferred_username}</p>
        </div>

        <nav className="flex-1 p-2 space-y-0.5">
          {nav.map(({ to, label, icon: Icon }) => (
            <NavLink
              key={to}
              to={to}
              className={({ isActive }) =>
                clsx(
                  'flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors',
                  isActive
                    ? 'bg-brand-500/10 text-brand-400'
                    : 'text-gray-400 hover:bg-gray-800 hover:text-gray-100'
                )
              }
            >
              <Icon className="w-4 h-4" />
              {label}
            </NavLink>
          ))}
        </nav>

        <div className="p-2 border-t border-gray-800">
          <button
            onClick={() => auth.signoutRedirect()}
            className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-gray-400 hover:bg-gray-800 hover:text-gray-100 transition-colors w-full"
          >
            <LogOut className="w-4 h-4" />
            Sign out
          </button>
        </div>
      </aside>

      {/* Top bar — mobile only */}
      <header className="sm:hidden flex items-center justify-between px-4 py-3 bg-gray-900 border-b border-gray-800">
        <div className="flex items-center gap-2">
          <ShieldCheck className="w-4 h-4 text-brand-500" />
          <span className="font-semibold text-sm">MAS Admin</span>
        </div>
        <button onClick={() => auth.signoutRedirect()} className="text-gray-400 hover:text-gray-100 p-1">
          <LogOut className="w-4 h-4" />
        </button>
      </header>

      {/* Main content */}
      <main className="flex-1 overflow-auto p-4 sm:p-6 pb-20 sm:pb-6">{children}</main>

      {/* Bottom tab bar — mobile only */}
      <nav className="sm:hidden fixed bottom-0 left-0 right-0 bg-gray-900 border-t border-gray-800 flex">
        {nav.map(({ to, label, icon: Icon }) => (
          <NavLink
            key={to}
            to={to}
            className={({ isActive }) =>
              clsx(
                'flex-1 flex flex-col items-center gap-1 py-2 text-xs transition-colors',
                isActive ? 'text-brand-400' : 'text-gray-500 hover:text-gray-300'
              )
            }
          >
            <Icon className="w-5 h-5" />
            {label}
          </NavLink>
        ))}
      </nav>
    </div>
  )
}
