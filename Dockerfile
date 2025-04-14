FROM node:20-alpine AS base

WORKDIR /app

# Copy and install only package files first — changes rarely
COPY package*.json ./

# Install all dependencies (cacheable if package.json doesn't change)
RUN npm ci

# Copy source code 
COPY . .

# Build app (after source code)
RUN npm run build

# Remove dev dependencies
RUN npm prune --omit=dev


# Production stage
FROM node:20-alpine AS app

WORKDIR /app

ENV NODE_ENV=production

# Only need package.json for runtime metadata (not strictly needed)
COPY package*.json ./

# Copy final production app & modules 
COPY --from=base /app/dist ./dist
COPY --from=base /app/node_modules ./node_modules

EXPOSE 4000

CMD ["node", "dist/main"]