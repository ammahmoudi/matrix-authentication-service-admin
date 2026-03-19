// Runtime configuration for MAS Admin (safe to expose; do NOT put secrets here).
// Docker entrypoint may overwrite this file.
//
// Expected shape:
//   window.__MAS_ADMIN_CONFIG__ = {
//     MAS_BASE_URL: "https://auth.example.com",
//     CLIENT_ID: "...",
//     REDIRECT_BASE: "https://matrix.example.com",
//     CHAT_BASE_URL: "https://chat.example.com"
//   }

window.__MAS_ADMIN_CONFIG__ = window.__MAS_ADMIN_CONFIG__ || {}
