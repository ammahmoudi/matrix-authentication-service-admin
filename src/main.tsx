import React from 'react'
import ReactDOM from 'react-dom/client'
import { AuthProvider } from 'react-oidc-context'
import { BrowserRouter } from 'react-router-dom'
import App from './App'
import { MAS_BASE_URL, CLIENT_ID, REDIRECT_URI, ADMIN_SCOPE } from './config'
import './index.css'

const oidcConfig = {
  authority: MAS_BASE_URL,
  client_id: CLIENT_ID,
  redirect_uri: REDIRECT_URI,
  scope: `openid ${ADMIN_SCOPE}`,
  response_type: 'code',
  // PKCE is on by default in oidc-client-ts
  post_logout_redirect_uri: window.location.origin + '/mas-admin/',
  automaticSilentRenew: true,
  onSigninCallback: () => {
    // Remove auth params from URL after login
    window.history.replaceState({}, document.title, '/mas-admin/')
  },
}

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <AuthProvider {...oidcConfig}>
      <BrowserRouter>
        <App />
      </BrowserRouter>
    </AuthProvider>
  </React.StrictMode>,
)
