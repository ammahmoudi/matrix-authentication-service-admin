type RuntimeConfig = Partial<{
  MAS_BASE_URL: string
  CLIENT_ID: string
  REDIRECT_BASE: string
  CHAT_BASE_URL: string
}>

const runtimeConfig = (globalThis as any).__MAS_ADMIN_CONFIG__ as RuntimeConfig | undefined

function fromRuntimeOrVite(key: keyof RuntimeConfig, viteValue: string | undefined): string {
  const runtimeValue = runtimeConfig?.[key]
  return (runtimeValue && runtimeValue.length > 0 ? runtimeValue : viteValue) as string
}

// Values are injected either at runtime via /mas-admin/config.js (preferred for Docker)
// or at build time via Vite env.
export const MAS_BASE_URL = fromRuntimeOrVite('MAS_BASE_URL', import.meta.env.VITE_MAS_BASE_URL as string)
export const CLIENT_ID = fromRuntimeOrVite('CLIENT_ID', import.meta.env.VITE_CLIENT_ID as string)
export const REDIRECT_BASE = fromRuntimeOrVite('REDIRECT_BASE', import.meta.env.VITE_REDIRECT_BASE as string)
export const REDIRECT_URI = REDIRECT_BASE + '/mas-admin/callback'
export const CHAT_BASE_URL = fromRuntimeOrVite('CHAT_BASE_URL', import.meta.env.VITE_CHAT_BASE_URL as string)
export const ADMIN_SCOPE = 'urn:mas:admin'
