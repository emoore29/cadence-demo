FROM nginx:latest

# Copy Nginx configuration file
COPY ./nginx/sites-available/cadence /etc/nginx/sites-available/cadence

# Create symbolic link to enable the site
RUN ln -s /etc/nginx/sites-available/cadence /etc/nginx/sites-enabled/

# Copy nginx.conf
COPY ./nginx/nginx.conf /etc/nginx/nginx.conf

# Expose necessary port
EXPOSE 80
