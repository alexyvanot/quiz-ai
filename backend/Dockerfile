# Backend Dockerfile
FROM node:20-alpine

WORKDIR /app

COPY package.json ./
COPY server.js ./

EXPOSE 3001

# Install deps and start server at runtime else it doesn't pick up changes in package.json idk why
CMD ["sh", "-c", "echo 'Installing dependencies...'; npm install --omit=dev && echo 'Dependencies installed. Starting server...' && node server.js"]
