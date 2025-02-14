# Container to run nginx to act as proxy for backend and serve frontend

FROM nginx:latest

# Copy nginx.conf
COPY ./nginx.conf /etc/nginx/nginx.conf

# Copy built frontend files from frontend service
COPY --from=frontend /app/dist /usr/share/nginx/html

# Expose necessary port
EXPOSE 80
