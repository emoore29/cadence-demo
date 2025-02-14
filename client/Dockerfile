# Container to build frontend

FROM node:20-alpine

WORKDIR /app

# Copy package files first for better caching
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy application code
COPY . .

# Create production build of app
RUN npm run build
