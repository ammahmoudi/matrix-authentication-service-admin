// Values are injected at build time from .env / docker-compose environment
export const MAS_BASE_URL = import.meta.env.VITE_MAS_BASE_URL as string
export const CLIENT_ID = import.meta.env.VITE_CLIENT_ID as string
const redirectBase = import.meta.env.VITE_REDIRECT_BASE as string
export const REDIRECT_URI = redirectBase + '/mas-admin/callback'
export const CHAT_BASE_URL = import.meta.env.VITE_CHAT_BASE_URL as string
export const ADMIN_SCOPE = 'urn:mas:admin'
