#!/usr/bin/env sh
set -eu

# Generate runtime config for the SPA (safe-to-expose values only).
# Supported env vars (prefer MAS_ADMIN_*; VITE_* accepted for convenience):
#   MAS_ADMIN_MAS_BASE_URL / VITE_MAS_BASE_URL
#   MAS_ADMIN_CLIENT_ID   / VITE_CLIENT_ID
#   MAS_ADMIN_REDIRECT_BASE / VITE_REDIRECT_BASE
#   MAS_ADMIN_CHAT_BASE_URL / VITE_CHAT_BASE_URL

MAS_BASE_URL="${MAS_ADMIN_MAS_BASE_URL:-${VITE_MAS_BASE_URL:-}}"
CLIENT_ID="${MAS_ADMIN_CLIENT_ID:-${VITE_CLIENT_ID:-}}"
REDIRECT_BASE="${MAS_ADMIN_REDIRECT_BASE:-${VITE_REDIRECT_BASE:-}}"
CHAT_BASE_URL="${MAS_ADMIN_CHAT_BASE_URL:-${VITE_CHAT_BASE_URL:-}}"

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
