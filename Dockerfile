# Multi-stage Dockerfile for LUXORANOVA9 Monorepo
# Supports building different package types

# Base image with Node.js
FROM node:18-alpine AS base
WORKDIR /app

# Install dependencies needed for building
RUN apk update && apk add --no-cache \
    git \
    python3 \
    make \
    g++ \
    && npm install -g turbo lerna

# Copy package files
COPY package*.json ./
COPY turbo.json ./
COPY tsconfig.json ./
COPY lerna.json* ./

# Copy all workspace package.json files
COPY packages/*/package.json packages/*/
COPY packages/*/*/package.json packages/*/*/

# Install dependencies
RUN npm ci --only=production && npm cache clean --force

# Development stage
FROM base AS development
RUN npm ci
COPY . .
CMD ["npm", "run", "dev"]

# Build stage
FROM base AS builder
COPY . .
RUN npm ci
RUN npm run build

# Production stage for SaaS applications
FROM node:18-alpine AS saas-production
WORKDIR /app
RUN addgroup -g 1001 -S nodejs
RUN adduser -S nextjs -u 1001

# Copy built application
COPY --from=builder /app/packages/saas/*/dist ./dist/
COPY --from=builder /app/packages/saas/*/build ./build/
COPY --from=builder /app/packages/saas/*/.next ./.next/
COPY --from=builder /app/packages/saas/*/public ./public/
COPY --from=builder /app/packages/saas/*/package.json ./package.json

# Copy necessary node_modules
COPY --from=builder /app/node_modules ./node_modules/

USER nextjs
EXPOSE 3000
ENV PORT 3000
ENV NODE_ENV production

CMD ["npm", "start"]

# Production stage for tools/CLI applications  
FROM node:18-alpine AS tools-production
WORKDIR /app
RUN addgroup -g 1001 -S tools
RUN adduser -S tooluser -u 1001

COPY --from=builder /app/packages/tools/*/dist ./dist/
COPY --from=builder /app/packages/tools/*/package.json ./package.json
COPY --from=builder /app/node_modules ./node_modules/

USER tooluser
CMD ["node", "dist/index.js"]

# Production stage for AI services
FROM python:3.11-slim AS ai-production
WORKDIR /app

# Install Node.js for hybrid AI applications
RUN curl -fsSL https://deb.nodesource.com/setup_18.x | bash - \
    && apt-get install -y nodejs

# Copy built AI packages
COPY --from=builder /app/packages/ai/*/dist ./dist/
COPY --from=builder /app/packages/ai/*/requirements.txt* ./
COPY --from=builder /app/packages/ai/*/package.json* ./

# Install Python dependencies if requirements.txt exists
RUN if [ -f requirements.txt ]; then pip install -r requirements.txt; fi

# Install Node dependencies if package.json exists
RUN if [ -f package.json ]; then npm ci --only=production; fi

EXPOSE 8000
CMD ["python", "-m", "uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]