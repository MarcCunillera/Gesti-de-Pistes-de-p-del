# Fase 1: build
FROM node:18-alpine AS builder

WORKDIR /app

COPY package.json ./
RUN npm install

COPY . .
RUN npm run build

# Fase 2: servir con nginx
FROM nginx:alpine

COPY --from=builder /app/dist /usr/share/nginx/html

# Configuración nginx para SPA (redirige rutas al index.html)
RUN printf 'server {\n\
    listen 80;\n\
    root /usr/share/nginx/html;\n\
    index index.html;\n\
    location / {\n\
        try_files $uri $uri/ /index.html;\n\
    }\n\
}\n' > /etc/nginx/conf.d/default.conf

EXPOSE 80
