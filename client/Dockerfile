FROM node:20-alpine

WORKDIR /app

# Copy package files first for better caching
COPY package*.json ./

# Install dependencies
RUN npm install

# Install serve
RUN npm i -g serve

# Copy application code
COPY . .

# Create production build of app
RUN npm run build

# Specify which port the app 'should' run on
EXPOSE 3000

# Runs when container spins up
CMD ["serve", "-s", "dist"]