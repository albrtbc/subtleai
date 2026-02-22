# SubtleAI - AI-Powered Subtitle Generator
# Multi-stage build for optimized Docker image

# Stage 1: Build the React client
FROM node:20-alpine AS client-build
WORKDIR /app/client
COPY client/package.json client/package-lock.json* ./
RUN npm install
COPY client/ ./
RUN npm run build

# Stage 2: Production image with ffmpeg
FROM node:20-alpine

LABEL maintainer="SubtleAI Contributors"
LABEL description="AI-Powered Subtitle Generator - Transcribe audio/video to SRT"
LABEL version="1.0.0"

RUN apk add --no-cache ffmpeg
WORKDIR /app

# Install server dependencies
COPY server/package.json server/package-lock.json* ./server/
RUN cd server && npm install --omit=dev

# Copy server source
COPY server/src/ ./server/src/

# Copy built client from stage 1
COPY --from=client-build /app/client/dist ./client/dist

# Create uploads and srt-output directories
RUN mkdir -p server/uploads server/srt-output

EXPOSE 3001

HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
  CMD node -e "require('http').get('http://localhost:3001/api/config', (r) => process.exit(r.statusCode === 200 ? 0 : 1)).on('error', () => process.exit(1))"

CMD ["node", "server/src/index.js"]
