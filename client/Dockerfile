# Build frontend
FROM node:20 AS builder
WORKDIR /app
# Copy package files first for better caching
COPY package*.json ./ 
# Install dependencies
RUN npm install
# Copy application code
COPY . .
# Create production build of app
RUN npm run build


# Run nginx to act as proxy for backend and serve frontend
FROM nginx:latest
# Copy nginx.conf
COPY ./nginx.conf /etc/nginx/nginx.conf
# Copy built frontend files from frontend service
COPY --from=builder /app/dist /usr/share/nginx/html
# Expose necessary port
EXPOSE 80