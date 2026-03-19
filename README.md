# MAS Admin Panel

A lightweight admin UI for [Matrix Authentication Service (MAS)](https://github.com/element-hq/matrix-authentication-service).

Built with React + TypeScript + Tailwind CSS. Uses MAS's Admin REST API with PKCE OAuth2 login — no secrets stored in the browser.

## Features

- **Users** — list, search, lock/unlock, grant/revoke admin
- **Registration Tokens** — create (with usage limit & expiry), copy invite link, delete
- **Sessions** — view active compat sessions, revoke

## Setup

### 1) Register this app as a client in MAS

Add to your `mas/config.yaml`:

```yaml
clients:
  - client_id: "00000000000000000000000007"
    client_auth_method: none
    redirect_uris:
      # Must match where this UI is served.
      # If you serve the UI behind your reverse proxy at https://matrix.example.com/mas-admin/
      # then the callback must be:
      - "https://matrix.yourserver.com/mas-admin/callback"
```

### 2. Configure

Configuration is injected at build time via Vite env vars.

Copy `.env.example` to `.env` (it is gitignored) and edit the values:

```dotenv
VITE_MAS_BASE_URL=https://auth.yourserver.com
VITE_CLIENT_ID=00000000000000000000000007
VITE_REDIRECT_BASE=https://matrix.yourserver.com
VITE_CHAT_BASE_URL=https://chat.yourserver.com
```

Notes:

- These values are **not secrets** (PKCE OAuth2; no client secret in the browser).
- `VITE_REDIRECT_BASE` should be the public base of the reverse proxy that serves `/mas-admin/`.

### 3. Build

```bash
npm ci
npm run build
# Output is in dist/
```

### 4. Serve

There are two supported deployment modes:

#### Docker Compose (recommended)

Docker Compose reads `.env` automatically and passes values cleanly.

#### A) Offline / limited internet server (prebuilt dist/)

This uses the existing `Dockerfile` which **serves a prebuilt** `dist/` folder.

Build the SPA on a connected machine:

```bash
npm ci
npm run build
```

Then build the nginx image (it copies `dist/` into the image):

```bash
docker build -t mas-admin:dist -f Dockerfile .
```

Docker Compose example (requires `dist/` to exist in the build context):

Also available as a file: `docker-compose.offline.yml`

```yaml
services:
  mas-admin:
    build:
      context: .
      dockerfile: Dockerfile
    image: mas-admin:dist
    restart: unless-stopped
    ports:
      - "8081:80"
```

You can also copy `dist/` to the server and run the image build there if Docker is available.

#### B) Full Docker build (Node → nginx)

Use `Dockerfile.build` to build the SPA inside Docker (requires npm access during build).

Docker Compose example (build args come from `.env`):

Also available as a file: `docker-compose.build.yml`

```yaml
services:
  mas-admin:
    build:
      context: .
      dockerfile: Dockerfile.build
      args:
        VITE_MAS_BASE_URL: ${VITE_MAS_BASE_URL}
        VITE_CLIENT_ID: ${VITE_CLIENT_ID}
        VITE_REDIRECT_BASE: ${VITE_REDIRECT_BASE}
        VITE_CHAT_BASE_URL: ${VITE_CHAT_BASE_URL}
    image: mas-admin:latest
    restart: unless-stopped
    ports:
      - "8081:80"
```

If you prefer plain Docker, you can still pass explicit build args:

```bash
docker build -t mas-admin:latest -f Dockerfile.build \
  --build-arg VITE_MAS_BASE_URL=https://auth.yourserver.com \
  --build-arg VITE_CLIENT_ID=00000000000000000000000007 \
  --build-arg VITE_REDIRECT_BASE=https://matrix.yourserver.com \
  --build-arg VITE_CHAT_BASE_URL=https://chat.yourserver.com \
  .
```

#### Runtime env (recommended for published images)

The Docker image also supports runtime configuration by generating `/mas-admin/config.js` at container start.

Supported env vars:

```bash
MAS_ADMIN_MAS_BASE_URL=https://auth.example.com
MAS_ADMIN_CLIENT_ID=00000000000000000000000007
MAS_ADMIN_REDIRECT_BASE=https://matrix.example.com
MAS_ADMIN_CHAT_BASE_URL=https://chat.example.com
```

(`VITE_*` names are also accepted at runtime for convenience.)

#### Docker Hub (no build needed for users)

If you publish the prebuilt image, users can just pull and run it:

```bash
docker pull amahmoudi/mas-admin:latest

docker run --rm -p 8081:80 \
  -e MAS_ADMIN_MAS_BASE_URL=https://auth.yourserver.com \
  -e MAS_ADMIN_CLIENT_ID=00000000000000000000000007 \
  -e MAS_ADMIN_REDIRECT_BASE=https://matrix.yourserver.com \
  -e MAS_ADMIN_CHAT_BASE_URL=https://chat.yourserver.com \
  amahmoudi/mas-admin:latest
```

Docker Compose example (behind a reverse proxy; no port publish needed if proxied):

```yaml
services:
  mas-admin:
    image: amahmoudi/mas-admin:latest
    restart: unless-stopped
    environment:
      MAS_ADMIN_MAS_BASE_URL: https://auth.yourserver.com
      MAS_ADMIN_CLIENT_ID: "00000000000000000000000007"
      MAS_ADMIN_REDIRECT_BASE: https://matrix.yourserver.com
      MAS_ADMIN_CHAT_BASE_URL: https://chat.yourserver.com
```

### 5. Grant admin to your account

```bash
docker exec mas-admin mas-cli manage promote-admin YOUR_USERNAME
```

Open `http://your-server:8080/mas-admin/` and sign in.

## Development

```bash
npm ci
npm run dev
```

For local dev, set `.env` values (especially `VITE_MAS_BASE_URL` and `VITE_REDIRECT_BASE`) and run the dev server.

You may need CORS allowed on MAS for local dev, or run a local reverse proxy.
