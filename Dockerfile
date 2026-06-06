# Build stage: 构建前端
FROM node:20-alpine AS builder
WORKDIR /app
# 根级 lockfile (npm workspaces)
COPY package.json package-lock.json ./
COPY client/package.json ./client/
RUN npm ci
COPY client/ ./client/
RUN npm run -w client build

# Runtime stage: 运行后端
FROM node:20-alpine
RUN apk add --no-cache sqlite
WORKDIR /app

COPY server/package.json ./
RUN npm install --omit=dev

COPY server/src/ ./src/

COPY --from=builder /app/client/dist ./public

EXPOSE 3000

VOLUME ["/app/data"]

ENV NODE_ENV=production
ENV PORT=3000

CMD ["node", "src/index.js"]
