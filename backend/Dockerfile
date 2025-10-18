# Backend Dockerfile
FROM node:20-alpine AS base

# Install dependencies only when needed
FROM base AS deps
WORKDIR /app

# Copy package files
COPY package.json package-lock.json* ./

# Install dependencies
RUN npm ci

# Builder stage
FROM base AS builder
WORKDIR /app

# Copy dependencies from deps stage
COPY --from=deps /app/node_modules ./node_modules

# Copy source code
COPY . .

# Generate Prisma Client
RUN npx prisma generate

# Build TypeScript
RUN npm run build

# Production stage
FROM base AS runner
WORKDIR /app

ENV NODE_ENV=production

# Create non-root user
RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 apyhub

# Copy built application
COPY --from=builder --chown=apyhub:nodejs /app/dist ./dist
COPY --from=builder --chown=apyhub:nodejs /app/node_modules ./node_modules
COPY --from=builder --chown=apyhub:nodejs /app/package.json ./package.json
COPY --from=builder --chown=apyhub:nodejs /app/prisma ./prisma

USER apyhub

EXPOSE 3001

ENV PORT=3001

# Start the application
CMD ["npm", "start"]
