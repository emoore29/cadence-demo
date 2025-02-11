FROM node:20-slim

WORKDIR /app

# Copy package files first for better caching
COPY package*.json ./
RUN npm ci --only=production

# Copy application code
COPY . .

# Switch to non-root user for security
USER node

EXPOSE 3000

CMD ["node", "index.js"]