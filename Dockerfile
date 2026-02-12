# Stage 1: Build the React client
FROM node:20-alpine AS client-build
WORKDIR /app/client
COPY client/package.json client/package-lock.json* ./
RUN npm install
COPY client/ ./
RUN npm run build

# Stage 2: Production image with ffmpeg
FROM node:20-alpine
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
CMD ["node", "server/src/index.js"]
