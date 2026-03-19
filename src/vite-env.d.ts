// Minimal Vite env typing so the project type-checks even when node_modules
// isn't installed (e.g. when browsing offline).

interface ImportMetaEnv {
	readonly VITE_MAS_BASE_URL: string
	readonly VITE_CLIENT_ID: string
	readonly VITE_REDIRECT_BASE: string
	readonly VITE_CHAT_BASE_URL: string
}

interface ImportMeta {
	readonly env: ImportMetaEnv
}
