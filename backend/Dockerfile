# Backend Dockerfile
FROM node:20-alpine

# Set working directory
WORKDIR /app

# Copy files
COPY package.json ./
COPY server.js ./

# Expose port
EXPOSE 3001

# Install deps and start server at runtime
CMD ["sh", "-c", "echo 'Installing dependencies...'; npm install --omit=dev && echo 'Dependencies installed. Starting server...' && node server.js"]
