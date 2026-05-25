FROM node:18-alpine

# Dependencias de compilación para better-sqlite3 (módulo nativo)
RUN apk add --no-cache python3 make g++

WORKDIR /app

COPY package.json ./
RUN npm install --omit=dev

COPY . .

EXPOSE 4000

CMD ["node", "server.js"]
