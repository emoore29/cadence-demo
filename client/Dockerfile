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

# Create non-root user and group
RUN useradd -m appuser

# Copy nginx.conf
COPY ./nginx/nginx.conf /etc/nginx/nginx.conf

# Copy built frontend files into nginx container
COPY --from=builder /app/dist /usr/share/nginx/html

# Switch to non-root user
USER appuser

# Expose necessary port
EXPOSE 80
