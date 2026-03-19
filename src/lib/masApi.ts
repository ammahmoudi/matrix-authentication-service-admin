import { MAS_BASE_URL } from '../config'

export class MasApiError extends Error {
  constructor(public status: number, message: string) {
    super(message)
  }
}

async function request<T>(token: string, path: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${MAS_BASE_URL}${path}`, {
    ...options,
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
      ...options?.headers,
    },
  })

  if (!res.ok) {
    let msg = `HTTP ${res.status}`
    try {
      const err = await res.json()
      msg = err.errors?.[0]?.title ?? msg
    } catch {}
    throw new MasApiError(res.status, msg)
  }

  if (res.status === 204) return undefined as T
  return res.json()
}

// ── Types ────────────────────────────────────────────────────────────────────

export interface MasUser {
  username: string
  locked_at: string | null
  admin: boolean
  created_at: string
}

export interface MasToken {
  token: string
  valid: boolean
  usage_limit: number | null
  times_used: number
  created_at: string
  last_used_at: string | null
  expires_at: string | null
  revoked_at: string | null
}

export interface MasSession {
  created_at: string
  last_active_at: string | null
  user_agent: string | null
  finished_at: string | null
}

export interface PageMeta {
  count: number
}

export interface PageLinks {
  next?: string
  prev?: string
}

export interface ListResponse<T> {
  meta: PageMeta
  data: Array<{ id: string; attributes: T; type: string }>
  links: PageLinks
}

// ── Users ────────────────────────────────────────────────────────────────────

export async function listUsers(
  token: string,
  params?: { filter?: string; after?: string }
): Promise<ListResponse<MasUser>> {
  const q = new URLSearchParams({ 'page[first]': '20' })
  if (params?.filter) q.set('filter[username]', params.filter)
  if (params?.after) q.set('page[after]', params.after)
  return request(token, `/api/admin/v1/users?${q}`)
}

export async function getUser(token: string, id: string): Promise<{ data: { id: string; attributes: MasUser } }> {
  return request(token, `/api/admin/v1/users/${id}`)
}

export async function lockUser(token: string, id: string): Promise<void> {
  return request(token, `/api/admin/v1/users/${id}/lock`, { method: 'POST' })
}

export async function unlockUser(token: string, id: string): Promise<void> {
  return request(token, `/api/admin/v1/users/${id}/unlock`, { method: 'POST' })
}

export async function setAdmin(token: string, id: string, admin: boolean): Promise<void> {
  return request(token, `/api/admin/v1/users/${id}/set-admin`, {
    method: 'POST',
    body: JSON.stringify({ admin }),
  })
}

// ── Registration Tokens ───────────────────────────────────────────────────────

export async function listTokens(token: string): Promise<ListResponse<MasToken>> {
  return request(token, '/api/admin/v1/user-registration-tokens?page[first]=100')
}

export async function createToken(
  token: string,
  opts: { token?: string; usage_limit?: number; expires_at?: string }
): Promise<{ data: { id: string; attributes: MasToken } }> {
  const body: Record<string, unknown> = {}
  if (opts.token !== undefined) body.token = opts.token
  if (opts.usage_limit !== undefined) body.usage_limit = opts.usage_limit
  if (opts.expires_at !== undefined) body.expires_at = opts.expires_at
  return request(token, '/api/admin/v1/user-registration-tokens', {
    method: 'POST',
    body: JSON.stringify(body),
  })
}

export async function deleteToken(token: string, id: string): Promise<void> {
  return request(token, `/api/admin/v1/user-registration-tokens/${id}/revoke`, { method: 'POST' })
}

// ── Compat Sessions ───────────────────────────────────────────────────────────

export async function listSessions(
  token: string,
  params?: { after?: string }
): Promise<ListResponse<MasSession>> {
  const q = new URLSearchParams({ 'page[first]': '30' })
  if (params?.after) q.set('page[after]', params.after)
  return request(token, `/api/admin/v1/compat-sessions?${q}`)
}

export async function revokeSession(token: string, id: string): Promise<void> {
  return request(token, `/api/admin/v1/compat-sessions/${id}/finish`, { method: 'POST' })
}
