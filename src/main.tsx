import React from 'react'
import ReactDOM from 'react-dom/client'
import { AuthProvider } from 'react-oidc-context'
import { BrowserRouter } from 'react-router-dom'
import { WebStorageStateStore } from 'oidc-client-ts'
import App from './App'
import { MAS_BASE_URL, CLIENT_ID, REDIRECT_BASE, REDIRECT_URI, ADMIN_SCOPE } from './config'
import './index.css'

const oidcConfig = {
  authority: MAS_BASE_URL,
  client_id: CLIENT_ID,
  redirect_uri: REDIRECT_URI,
  // Persist auth between tabs / browser restarts.
  // Note: this increases the impact of any XSS, so keep the app served only over HTTPS.
  userStore: new WebStorageStateStore({ store: window.localStorage }),
  stateStore: new WebStorageStateStore({ store: window.localStorage }),

  // Ask for refresh tokens so we can renew without full redirect logins.
  // MAS must allow offline_access for this client.
  scope: `openid ${ADMIN_SCOPE} offline_access`,
  response_type: 'code',
  useRefreshTokens: true,
  // PKCE is on by default in oidc-client-ts
  post_logout_redirect_uri: REDIRECT_BASE + '/mas-admin/',
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
