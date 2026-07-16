# Marathon CycleBack — imagen de la aplicación Node.js
FROM node:20-alpine

WORKDIR /app

# Dependencias primero (mejor caché de capas)
COPY package*.json ./
RUN npm ci --omit=dev

# Código de la aplicación
COPY server.js ./
COPY src ./src
COPY public ./public

EXPOSE 3000
CMD ["node", "server.js"]
