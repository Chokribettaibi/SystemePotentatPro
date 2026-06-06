# Base node environment
FROM node:18-alpine

WORKDIR /app

# Install dependencies first for caching layers
COPY package*.json ./
RUN npm install --legacy-peer-deps

# Copy source and configurations
COPY . .

# Build optimized NextJS package
RUN npm run build

EXPOSE 3000

# Run standalone HTTP daemon
CMD ["npm", "run", "start"]
