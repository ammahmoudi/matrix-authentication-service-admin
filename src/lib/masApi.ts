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

export interface Resource<T> {
  id: string
  attributes: T
  type: string
}

export interface PageMeta {
  count?: number
}

export interface PageLinks {
  self?: string
  first?: string
  last?: string
  next?: string
  prev?: string
}

export interface ListResponse<T> {
  meta?: PageMeta
  data: Array<Resource<T>>
  links?: PageLinks
}

export interface SingleResponse<T> {
  data: Resource<T>
  links?: PageLinks
}

export type ULID = string

export type UserStatus = 'active' | 'locked' | 'deactivated'

function buildQuery(params: Record<string, string | number | boolean | null | undefined>): string {
  const q = new URLSearchParams()
  for (const [k, v] of Object.entries(params)) {
    if (v === undefined || v === null || v === '') continue
    q.set(k, String(v))
  }
  const s = q.toString()
  return s ? `?${s}` : ''
}

export interface MasUser {
  username: string
  locked_at: string | null
  deactivated_at: string | null
  admin: boolean
  legacy_guest: boolean
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

export interface CompatSession {
  created_at: string
  finished_at: string | null
  last_active_at: string | null
  last_active_ip: string | null
  user_agent: string | null
  user_id: ULID
  user_session_id: ULID
  device_id: string
  redirect_uri: string | null
  human_name: string | null
}

export interface OAuth2Session {
  created_at: string
  finished_at: string | null
  user_id: ULID | null
  user_session_id: ULID | null
  client_id: ULID
  scope: string
  user_agent: string | null
  last_active_at: string | null
  last_active_ip: string | null
  human_name: string | null
}

export interface UserSession {
  created_at: string
  finished_at: string | null
  user_id: ULID
  user_agent: string | null
  last_active_at: string | null
  last_active_ip: string | null
}

export interface PersonalSession {
  created_at: string
  revoked_at: string | null
  owner_user_id: ULID | null
  owner_client_id: ULID | null
  actor_user_id: ULID
  human_name: string
  scope: string
  last_active_at: string | null
  last_active_ip: string | null
  expires_at: string | null
}

export interface PolicyData {
  created_at: string
  data: unknown
}

export interface SiteConfig {
  server_name: string
  password_login_enabled: boolean
  password_registration_enabled: boolean
  password_registration_email_required: boolean
  registration_token_required: boolean
  email_change_allowed: boolean
  displayname_change_allowed: boolean
  password_change_allowed: boolean
  account_recovery_allowed: boolean
  account_deactivation_allowed: boolean
  captcha_enabled: boolean
  minimum_password_complexity: number
}

export interface Version {
  version: string
}

export interface UpstreamOAuthLink {
  created_at: string
  provider_id: ULID
  subject: string
  user_id: ULID | null
  human_account_name: string | null
}

export interface UpstreamOAuthProvider {
  issuer: string | null
  human_name: string
  brand_name: string | null
  created_at: string
  disabled_at: string | null
}

export interface UserEmail {
  created_at: string
  user_id: ULID
  email: string
}

// ── Users ────────────────────────────────────────────────────────────────────

export async function listUsers(
  token: string,
  params?: {
    search?: string
    admin?: boolean | null
    legacyGuest?: boolean | null
    status?: UserStatus | null
    after?: ULID
    first?: number
  }
): Promise<ListResponse<MasUser>> {
  const q = buildQuery({
    'page[first]': params?.first ?? 20,
    'page[after]': params?.after,
    'filter[search]': params?.search,
    'filter[admin]': params?.admin,
    'filter[legacy-guest]': params?.legacyGuest,
    'filter[status]': params?.status,
    count: true,
  })
  return request(token, `/api/admin/v1/users${q}`)
}

export async function createUser(
  token: string,
  opts: { username: string; skipHomeserverCheck?: boolean }
): Promise<SingleResponse<MasUser>> {
  return request(token, `/api/admin/v1/users`, {
    method: 'POST',
    body: JSON.stringify({
      username: opts.username,
      skip_homeserver_check: opts.skipHomeserverCheck ?? false,
    }),
  })
}

export async function getUser(token: string, id: ULID): Promise<SingleResponse<MasUser>> {
  return request(token, `/api/admin/v1/users/${id}`)
}

export async function getUserByUsername(token: string, username: string): Promise<SingleResponse<MasUser>> {
  return request(token, `/api/admin/v1/users/by-username/${encodeURIComponent(username)}`)
}

export async function lockUser(token: string, id: ULID): Promise<SingleResponse<MasUser>> {
  return request(token, `/api/admin/v1/users/${id}/lock`, { method: 'POST' })
}

export async function unlockUser(token: string, id: ULID): Promise<SingleResponse<MasUser>> {
  return request(token, `/api/admin/v1/users/${id}/unlock`, { method: 'POST' })
}

export async function deactivateUser(token: string, id: ULID, opts?: { skipErase?: boolean }): Promise<SingleResponse<MasUser>> {
  return request(token, `/api/admin/v1/users/${id}/deactivate`, {
    method: 'POST',
    body: JSON.stringify({ skip_erase: opts?.skipErase ?? false }),
  })
}

export async function reactivateUser(token: string, id: ULID): Promise<SingleResponse<MasUser>> {
  return request(token, `/api/admin/v1/users/${id}/reactivate`, { method: 'POST' })
}

export async function setAdmin(token: string, id: ULID, admin: boolean): Promise<SingleResponse<MasUser>> {
  return request(token, `/api/admin/v1/users/${id}/set-admin`, {
    method: 'POST',
    body: JSON.stringify({ admin }),
  })
}

export async function setUserPassword(
  token: string,
  id: ULID,
  opts: { password: string; skipPasswordCheck?: boolean | null }
): Promise<void> {
  return request(token, `/api/admin/v1/users/${id}/set-password`, {
    method: 'POST',
    body: JSON.stringify({ password: opts.password, skip_password_check: opts.skipPasswordCheck ?? null }),
  })
}

// ── Registration Tokens ───────────────────────────────────────────────────────

export async function listTokens(
  token: string,
  params?: { used?: boolean | null; revoked?: boolean | null; expired?: boolean | null; valid?: boolean | null }
): Promise<ListResponse<MasToken>> {
  const q = buildQuery({
    'page[first]': 100,
    count: true,
    'filter[used]': params?.used,
    'filter[revoked]': params?.revoked,
    'filter[expired]': params?.expired,
    'filter[valid]': params?.valid,
  })
  return request(token, `/api/admin/v1/user-registration-tokens${q}`)
}

export async function createToken(
  token: string,
  opts: { token?: string; usage_limit?: number; expires_at?: string }
): Promise<SingleResponse<MasToken>> {
  const body: Record<string, unknown> = {}
  if (opts.token !== undefined) body.token = opts.token
  if (opts.usage_limit !== undefined) body.usage_limit = opts.usage_limit
  if (opts.expires_at !== undefined) body.expires_at = opts.expires_at
  return request(token, '/api/admin/v1/user-registration-tokens', {
    method: 'POST',
    body: JSON.stringify(body),
  })
}

export async function updateToken(
  token: string,
  id: ULID,
  opts: { usage_limit?: number | null; expires_at?: string | null }
): Promise<SingleResponse<MasToken>> {
  const body: Record<string, unknown> = {}
  if ('usage_limit' in opts) body.usage_limit = opts.usage_limit
  if ('expires_at' in opts) body.expires_at = opts.expires_at
  return request(token, `/api/admin/v1/user-registration-tokens/${id}`, {
    method: 'PUT',
    body: JSON.stringify(body),
  })
}

export async function getToken(token: string, id: ULID): Promise<SingleResponse<MasToken>> {
  return request(token, `/api/admin/v1/user-registration-tokens/${id}`)
}

export async function revokeToken(token: string, id: ULID): Promise<SingleResponse<MasToken>> {
  return request(token, `/api/admin/v1/user-registration-tokens/${id}/revoke`, { method: 'POST' })
}

export async function unrevokeToken(token: string, id: ULID): Promise<SingleResponse<MasToken>> {
  return request(token, `/api/admin/v1/user-registration-tokens/${id}/unrevoke`, { method: 'POST' })
}

// ── Compat Sessions ───────────────────────────────────────────────────────────

export async function listCompatSessions(
  token: string,
  params?: { after?: ULID; first?: number }
): Promise<ListResponse<CompatSession>> {
  const q = buildQuery({ 'page[first]': params?.first ?? 30, 'page[after]': params?.after, count: true })
  return request(token, `/api/admin/v1/compat-sessions${q}`)
}

export async function getCompatSession(token: string, id: ULID): Promise<SingleResponse<CompatSession>> {
  return request(token, `/api/admin/v1/compat-sessions/${id}`)
}

export async function finishCompatSession(token: string, id: ULID): Promise<void> {
  return request(token, `/api/admin/v1/compat-sessions/${id}/finish`, { method: 'POST' })
}

// ── OAuth2 Sessions ─────────────────────────────────────────────────────────

export async function listOAuth2Sessions(
  token: string,
  params?: { after?: ULID; first?: number; user?: ULID; client?: ULID; status?: 'active' | 'finished' | null }
): Promise<ListResponse<OAuth2Session>> {
  const q = buildQuery({
    'page[first]': params?.first ?? 30,
    'page[after]': params?.after,
    count: true,
    'filter[user]': params?.user,
    'filter[client]': params?.client,
    'filter[status]': params?.status,
  })
  return request(token, `/api/admin/v1/oauth2-sessions${q}`)
}

export async function getOAuth2Session(token: string, id: ULID): Promise<SingleResponse<OAuth2Session>> {
  return request(token, `/api/admin/v1/oauth2-sessions/${id}`)
}

export async function finishOAuth2Session(token: string, id: ULID): Promise<void> {
  return request(token, `/api/admin/v1/oauth2-sessions/${id}/finish`, { method: 'POST' })
}

// ── User Sessions (browser sessions) ─────────────────────────────────────────

export async function listUserSessions(
  token: string,
  params?: { after?: ULID; first?: number; user?: ULID; status?: 'active' | 'finished' | null }
): Promise<ListResponse<UserSession>> {
  const q = buildQuery({
    'page[first]': params?.first ?? 30,
    'page[after]': params?.after,
    count: true,
    'filter[user]': params?.user,
    'filter[status]': params?.status,
  })
  return request(token, `/api/admin/v1/user-sessions${q}`)
}

export async function getUserSession(token: string, id: ULID): Promise<SingleResponse<UserSession>> {
  return request(token, `/api/admin/v1/user-sessions/${id}`)
}

export async function finishUserSession(token: string, id: ULID): Promise<void> {
  return request(token, `/api/admin/v1/user-sessions/${id}/finish`, { method: 'POST' })
}

// ── Personal Sessions (PAT) ─────────────────────────────────────────────────-

export async function listPersonalSessions(
  token: string,
  params?: { after?: ULID; first?: number; ownerUser?: ULID; ownerClient?: ULID; actorUser?: ULID; status?: 'active' | 'revoked' | null }
): Promise<ListResponse<PersonalSession>> {
  const q = buildQuery({
    'page[first]': params?.first ?? 30,
    'page[after]': params?.after,
    count: true,
    'filter[owner_user]': params?.ownerUser,
    'filter[owner_client]': params?.ownerClient,
    'filter[actor_user]': params?.actorUser,
    'filter[status]': params?.status,
  })
  return request(token, `/api/admin/v1/personal-sessions${q}`)
}

export async function getPersonalSession(token: string, id: ULID): Promise<SingleResponse<PersonalSession>> {
  return request(token, `/api/admin/v1/personal-sessions/${id}`)
}

export async function revokePersonalSession(token: string, id: ULID): Promise<void> {
  return request(token, `/api/admin/v1/personal-sessions/${id}/revoke`, { method: 'POST' })
}

export async function regeneratePersonalSession(token: string, id: ULID): Promise<SingleResponse<PersonalSession>> {
  return request(token, `/api/admin/v1/personal-sessions/${id}/regenerate`, {
    method: 'POST',
    body: JSON.stringify({}),
  })
}

// ── Policy data ─────────────────────────────────────────────────────────────

export async function getLatestPolicyData(token: string): Promise<SingleResponse<PolicyData>> {
  return request(token, `/api/admin/v1/policy-data/latest`)
}

export async function getPolicyData(token: string, id: ULID): Promise<SingleResponse<PolicyData>> {
  return request(token, `/api/admin/v1/policy-data/${id}`)
}

export async function setPolicyData(token: string, data: unknown): Promise<SingleResponse<PolicyData>> {
  return request(token, `/api/admin/v1/policy-data`, {
    method: 'POST',
    body: JSON.stringify({ data }),
  })
}

// ── User emails ─────────────────────────────────────────────────────────────

export async function listUserEmails(
  token: string,
  params?: { after?: ULID; first?: number; user?: ULID; email?: string }
): Promise<ListResponse<UserEmail>> {
  const q = buildQuery({
    'page[first]': params?.first ?? 50,
    'page[after]': params?.after,
    count: true,
    'filter[user]': params?.user,
    'filter[email]': params?.email,
  })
  return request(token, `/api/admin/v1/user-emails${q}`)
}

export async function getUserEmail(token: string, id: ULID): Promise<SingleResponse<UserEmail>> {
  return request(token, `/api/admin/v1/user-emails/${id}`)
}

export async function addUserEmail(token: string, opts: { user_id: ULID; email: string }): Promise<SingleResponse<UserEmail>> {
  return request(token, `/api/admin/v1/user-emails`, {
    method: 'POST',
    body: JSON.stringify(opts),
  })
}

export async function deleteUserEmail(token: string, id: ULID): Promise<void> {
  return request(token, `/api/admin/v1/user-emails/${id}`, { method: 'DELETE' })
}

// ── Upstream OAuth ─────────────────────────────────────────────────────────-

export async function listUpstreamOAuthProviders(
  token: string,
  params?: { after?: ULID; first?: number; enabled?: boolean | null }
): Promise<ListResponse<UpstreamOAuthProvider>> {
  const q = buildQuery({
    'page[first]': params?.first ?? 50,
    'page[after]': params?.after,
    count: true,
    'filter[enabled]': params?.enabled,
  })
  return request(token, `/api/admin/v1/upstream-oauth-providers${q}`)
}

export async function getUpstreamOAuthProvider(token: string, id: ULID): Promise<SingleResponse<UpstreamOAuthProvider>> {
  return request(token, `/api/admin/v1/upstream-oauth-providers/${id}`)
}

export async function listUpstreamOAuthLinks(
  token: string,
  params?: { after?: ULID; first?: number; user?: ULID; provider?: ULID; subject?: string }
): Promise<ListResponse<UpstreamOAuthLink>> {
  const q = buildQuery({
    'page[first]': params?.first ?? 50,
    'page[after]': params?.after,
    count: true,
    'filter[user]': params?.user,
    'filter[provider]': params?.provider,
    'filter[subject]': params?.subject,
  })
  return request(token, `/api/admin/v1/upstream-oauth-links${q}`)
}

export async function getUpstreamOAuthLink(token: string, id: ULID): Promise<SingleResponse<UpstreamOAuthLink>> {
  return request(token, `/api/admin/v1/upstream-oauth-links/${id}`)
}

export async function addUpstreamOAuthLink(
  token: string,
  opts: { user_id: ULID; provider_id: ULID; subject: string; human_account_name?: string | null }
): Promise<SingleResponse<UpstreamOAuthLink>> {
  return request(token, `/api/admin/v1/upstream-oauth-links`, {
    method: 'POST',
    body: JSON.stringify(opts),
  })
}

export async function deleteUpstreamOAuthLink(token: string, id: ULID): Promise<void> {
  return request(token, `/api/admin/v1/upstream-oauth-links/${id}`, { method: 'DELETE' })
}

// ── Server ─────────────────────────────────────────────────────────────────-

export async function getSiteConfig(token: string): Promise<SiteConfig> {
  return request(token, `/api/admin/v1/site-config`)
}

export async function getVersion(token: string): Promise<Version> {
  return request(token, `/api/admin/v1/version`)
}
