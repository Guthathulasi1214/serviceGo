# ── Stage 1: Install dependencies ──────────────────────
FROM node:20-alpine AS deps

WORKDIR /app

# Copy package files first (better Docker cache)
COPY package.json package-lock.json* ./

# Install production dependencies only
RUN npm ci --only=production

# ── Stage 2: Production image ──────────────────────────
FROM node:20-alpine AS runner

WORKDIR /app

# Security: run as non-root user
RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 nodeuser

# Copy dependencies from deps stage
COPY --from=deps /app/node_modules ./node_modules

# Copy application code
COPY . .

# Switch to non-root user
USER nodeuser

# Expose API port
EXPOSE 5000

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
    CMD wget --no-verbose --tries=1 --spider http://localhost:5000/api/health || exit 1

# Start the server
CMD ["node", "server.js"]
