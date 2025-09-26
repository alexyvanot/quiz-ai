# Backend Dockerfile
FROM node:20-alpine
WORKDIR /app

# Copier les fichiers de dépendances
COPY package.json package-lock.json ./

# Installer les dépendances
RUN npm ci --only=production

# Copier le code source
COPY server.js ./

EXPOSE 3001
CMD ["npm", "start"]
