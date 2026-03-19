# Pre-built: run `npm run build` locally first, then scp dist/ to server
# This avoids needing an npm mirror on the server
FROM nginx:alpine
COPY dist /usr/share/nginx/html/mas-admin
COPY nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80