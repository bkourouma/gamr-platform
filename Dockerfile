# Multi-stage Dockerfile pour GAMR Platform
# Stage 1: Build dependencies and frontend
FROM node:18-alpine AS builder

# Install system dependencies
RUN apk add --no-cache python3 make g++ sqlite

WORKDIR /app

# Copy package files
COPY package*.json ./
COPY tsconfig*.json ./
COPY vite.config.ts ./
COPY tailwind.config.js ./
COPY postcss.config.js ./

# Install all dependencies (including dev dependencies for build)
RUN npm ci

# Copy source code
COPY src/ ./src/
COPY public/ ./public/
COPY prisma/ ./prisma/
COPY index.html ./

# Generate Prisma client
RUN npx prisma generate

# Set production environment variables for the build
ENV VITE_API_URL="/api"
ENV NODE_ENV=production
ENV DATABASE_URL="file:./data/prod.db"

# Build frontend and backend
RUN npm run build:full

# Stage 2: Production runtime
FROM node:18-alpine AS runtime

# Install system dependencies for production
RUN apk add --no-cache sqlite

# Create app directory
WORKDIR /app

# Create non-root user for security
RUN addgroup -g 1001 -S nodejs
RUN adduser -S gamr -u 1001

# Copy package files
COPY package*.json ./
COPY scripts/start.sh ./scripts/start.sh

# Install only production dependencies
RUN npm ci --only=production && npm cache clean --force && \
    chmod +x ./scripts/start.sh

# Copy built application from builder stage
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/dist-server ./dist-server
COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/node_modules/.prisma ./node_modules/.prisma
RUN mkdir -p /app/data

# Set proper permissions for data directory
RUN chown -R gamr:nodejs /app/data
RUN chown -R gamr:nodejs /app

# Switch to non-root user
USER gamr

# Expose port
EXPOSE 3002

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD node -e "require('http').get('http://localhost:3002/health', (res) => { process.exit(res.statusCode === 200 ? 0 : 1) })"

# Start the application via entry script
CMD ["./scripts/start.sh"]
