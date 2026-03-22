FROM node:20-alpine

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install all dependencies (including devDependencies for build)
RUN npm ci

# Copy source files
COPY . .

# Build the application
RUN npm run build

# Expose port
EXPOSE 5174

# Start server
CMD ["node", "server.js"]