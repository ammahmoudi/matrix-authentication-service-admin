# MAS Admin Panel

A lightweight admin UI for [Matrix Authentication Service (MAS)](https://github.com/element-hq/matrix-authentication-service).

Built with React + TypeScript + Tailwind CSS. Uses MAS's Admin REST API with PKCE OAuth2 login — no secrets stored in the browser.

## Features

- **Users** — list, search, lock/unlock, grant/revoke admin
- **Registration Tokens** — create (with usage limit & expiry), copy invite link, delete
- **Sessions** — view active compat sessions, revoke

## Setup

### 1. Register this app as a client in MAS

Add to your `mas/config.yaml`:

```yaml
clients:
  - client_id: "00000000000000000000000007"
    client_auth_method: none
    redirect_uris:
      - "https://your-matrix-server:8080/mas-admin/callback"
```

### 2. Configure

Edit `src/config.ts`:

```ts
export const MAS_BASE_URL = 'https://your-mas-auth-domain'
export const CLIENT_ID = '00000000000000000000000007'
export const REDIRECT_URI = window.location.origin + '/mas-admin/callback'
```

### 3. Build

```bash
npm install
npm run build
# Output is in dist/
```

### 4. Serve

Copy `dist/` to your server and serve at `/mas-admin/`:

```bash
scp -r dist/ root@your-server:/opt/matrix-project/mas-admin/dist/
```

nginx location (already in `nginx/default.conf`):

```nginx
location /mas-admin/ {
    alias /var/www/mas-admin/;
    try_files $uri $uri/ /mas-admin/index.html;
}
```

### 5. Grant admin to your account

```bash
docker exec mamood-mas mas-cli manage promote-admin YOUR_USERNAME
```

Open `http://your-server:8080/mas-admin/` and sign in.

## Development

```bash
npm install
npm run dev
```

Set `MAS_BASE_URL` in `src/config.ts` to your running MAS instance. You'll need CORS allowed — or run a local proxy.
