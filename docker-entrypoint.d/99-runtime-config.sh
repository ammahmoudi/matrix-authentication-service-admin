#!/usr/bin/env sh
set -eu

# Generate runtime config for the SPA (safe-to-expose values only).
# Supported env vars (prefer MAS_ADMIN_*; VITE_* accepted for convenience):
#   MAS_ADMIN_MAS_BASE_URL / VITE_MAS_BASE_URL
#   MAS_ADMIN_CLIENT_ID   / VITE_CLIENT_ID
#   MAS_ADMIN_REDIRECT_BASE / VITE_REDIRECT_BASE
#   MAS_ADMIN_CHAT_BASE_URL / VITE_CHAT_BASE_URL

MAS_BASE_URL="${MAS_ADMIN_MAS_BASE_URL:-${VITE_MAS_BASE_URL:-https://auth.example.com}}"
CLIENT_ID="${MAS_ADMIN_CLIENT_ID:-${VITE_CLIENT_ID:-00000000000000000000000007}}"
REDIRECT_BASE="${MAS_ADMIN_REDIRECT_BASE:-${VITE_REDIRECT_BASE:-https://matrix.example.com}}"
CHAT_BASE_URL="${MAS_ADMIN_CHAT_BASE_URL:-${VITE_CHAT_BASE_URL:-https://chat.example.com}}"

if [ -z "${MAS_ADMIN_MAS_BASE_URL:-}" ] && [ -z "${VITE_MAS_BASE_URL:-}" ]; then
  echo "[mas-admin] MAS_ADMIN_MAS_BASE_URL not set; using default https://auth.example.com" >&2
fi
if [ -z "${MAS_ADMIN_CLIENT_ID:-}" ] && [ -z "${VITE_CLIENT_ID:-}" ]; then
  echo "[mas-admin] MAS_ADMIN_CLIENT_ID not set; using default 00000000000000000000000007" >&2
fi
if [ -z "${MAS_ADMIN_REDIRECT_BASE:-}" ] && [ -z "${VITE_REDIRECT_BASE:-}" ]; then
  echo "[mas-admin] MAS_ADMIN_REDIRECT_BASE not set; using default https://matrix.example.com" >&2
fi
if [ -z "${MAS_ADMIN_CHAT_BASE_URL:-}" ] && [ -z "${VITE_CHAT_BASE_URL:-}" ]; then
  echo "[mas-admin] MAS_ADMIN_CHAT_BASE_URL not set; using default https://chat.example.com" >&2
fi

CONFIG_PATH="/usr/share/nginx/html/mas-admin/config.js"

# Minimal JS string escaping
escape_js() {
  printf '%s' "$1" | sed -e 's/\\/\\\\/g' -e 's/"/\\"/g'
}

{
  echo "// Generated at container start."
  echo "window.__MAS_ADMIN_CONFIG__ = {"
  echo "  MAS_BASE_URL: \"$(escape_js "$MAS_BASE_URL")\","
  echo "  CLIENT_ID: \"$(escape_js "$CLIENT_ID")\","
  echo "  REDIRECT_BASE: \"$(escape_js "$REDIRECT_BASE")\","
  echo "  CHAT_BASE_URL: \"$(escape_js "$CHAT_BASE_URL")\""
  echo "}"
} > "$CONFIG_PATH"
