# SubtleAI

[![Release](https://github.com/albrtbc/subtleai/actions/workflows/release.yml/badge.svg)](https://github.com/albrtbc/subtleai/actions/workflows/release.yml)
[![CI](https://github.com/albrtbc/subtleai/actions/workflows/main-checks.yml/badge.svg)](https://github.com/albrtbc/subtleai/actions/workflows/main-checks.yml)
[![Latest Release](https://img.shields.io/github/v/release/albrtbc/subtleai?label=version)](https://github.com/albrtbc/subtleai/releases/latest)
[![Docker](https://img.shields.io/docker/pulls/gasbostation/subtleai)](https://hub.docker.com/r/gasbostation/subtleai)
![Node.js](https://img.shields.io/badge/Node.js-18+-339933)
![React](https://img.shields.io/badge/React-19-61DAFB)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

A full-stack web application that generates SRT subtitle files from audio and video files using AI-powered transcription. Built with React, Express, and powered by GROQ API.

## Features

- **Batch Processing**: Upload and process multiple files concurrently (up to 3 at a time)
- **Job Cancellation**: Cancel in-progress transcription/translation jobs to avoid unnecessary API costs
- **Multi-Language Support**: Auto-detect source language and translate to your target language
- **Real-Time Progress**: Track transcription progress with NDJSON streaming updates
- **Auto-Download**: Automatically download completed SRT files
- **Queue Management**: Manage pending, processing, and completed jobs
- **Large File Support**: Handle files up to 10GB with automatic chunked transcription
- **Docker Ready**: Run anywhere with official Docker images available on DockerHub

## Tech Stack

### Frontend
- **React 19** - UI framework
- **Vite 7** - Build tool with HMR
- **Tailwind CSS 4** - Styling

### Backend
- **Node.js 18+** - Runtime
- **Express 4** - Web framework
- **Multer** - File upload handling
- **GROQ API** - Whisper large-v3 transcription and Llama 3.3 70b translation
- **FFmpeg** - Audio/video processing

## Prerequisites

- Node.js 18+ and npm
- FFmpeg installed and available in PATH
- API key from [GROQ](https://console.groq.com)

## Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/albrtbc/subtleai.git
   cd subtleai
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Create environment file**
   ```bash
   cp .env.example .env
   ```

4. **Add your API key** to `.env`:
   ```
   GROQ_API_KEY=gsk_your-groq-key-here
   ```

## Docker Deployment

Run with Docker using the official image:

```bash
docker run -p 3001:3001 -e GROQ_API_KEY=gsk_your-key-here gasbostation/subtleai:latest
```

Or with docker-compose:

```bash
cp .env.example .env
# Edit .env with your GROQ_API_KEY
docker-compose up -d
```

Available on DockerHub: [gasbostation/subtleai](https://hub.docker.com/repository/docker/gasbostation/subtleai)

## Development

Start both client and server with hot reload:

```bash
npm run dev
```

This runs:
- **Client**: http://localhost:5173 (Vite dev server)
- **Server**: http://localhost:3001 (Express API)

Individual commands:
```bash
npm run dev:client    # React dev server only
npm run dev:server    # Express server only (with nodemon)
```

## Production Build

Build the client for production:

```bash
npm -w client run build
```

The client is built to `client/dist`. The server serves these static assets in production.

## Project Structure

```
subtleai/
├── .github/
│   └── workflows/         # GitHub Actions CI/CD
│
├── client/                # React frontend
│   ├── src/
│   │   ├── components/    # React components
│   │   ├── services/      # API client (fetch + NDJSON streaming)
│   │   ├── hooks/         # Custom hooks (useJobQueue)
│   │   └── App.jsx        # Main app component
│   ├── package.json
│   └── vite.config.js
│
├── server/                # Express backend
│   ├── src/
│   │   ├── routes/        # API routes (transcribe, download, config)
│   │   ├── middleware/     # Express middleware (upload)
│   │   ├── services/      # Business logic (transcription, translation, storage)
│   │   ├── config/        # Configuration files
│   │   └── index.js       # Express server entry point
│   └── package.json
│
├── Dockerfile             # Multi-stage Docker build
├── docker-compose.yml     # Docker Compose configuration
├── .env.example           # Example environment variables
├── .releaserc.json        # Semantic versioning config
└── package.json           # Root workspace configuration
```

## API Endpoints

### POST `/api/transcribe`
Transcribe an audio/video file to SRT subtitles. Returns an NDJSON stream with progress events and the final result.

**Parameters (multipart/form-data):**
- `audio` (file, required) - Audio or video file
- `sourceLanguage` (string) - Language code or "auto" for auto-detect
- `outputLanguage` (string) - Target language code (e.g., "en", "es", "fr")
- `jobId` (string, optional) - Job ID for server-side storage and later download
- `groqApiKey` (string, optional) - Client-provided GROQ API key

**NDJSON stream events:**
```json
{"type": "progress", "step": "transcribing", "message": "Transcribing chunk 1 of 3...", "chunk": 1, "totalChunks": 3}
{"type": "result", "srt": "...", "jobId": "...", "detectedLanguage": "en", "duration": 3600}
```

### GET `/api/download/:jobId`
Download the generated SRT file.

### GET `/api/config`
Returns server configuration (whether a GROQ API key is configured server-side).

## Usage

1. **Open the app** at http://localhost:5173
2. **Enter API Key** (optional if configured on server)
3. **Drop files** or click to upload audio/video files
4. **Select languages** - source (auto-detect available) and target language
5. **Generate SRT** - Click the button to start processing
6. **Download** - Files auto-download when complete (toggle in settings)

## Configuration

Create a `.env` file in the root directory:

### Required
- **GROQ_API_KEY**: Your GROQ API key (get from https://console.groq.com)

### Optional
- **CORS_ORIGIN**: CORS origin for production (default: `http://localhost:5173`)
- **PORT**: Server port (default: `3001`)
- **LOG_LEVEL**: Logging level - DEBUG, INFO, WARN, ERROR (default: `INFO`)

Example:
```
GROQ_API_KEY=gsk_your-key-here
CORS_ORIGIN=https://yourdomain.com
PORT=3001
LOG_LEVEL=INFO
```

## Browser Support

- Chrome/Edge 116+
- Firefox 124+
- Safari 17.4+

## Troubleshooting

### API Key Issues
- Ensure GROQ API key is valid and not expired
- Check GROQ dashboard for usage limits and remaining quota

### Upload Failures
- Verify file format is supported (MP3, WAV, MP4, WebM, etc.)
- Check file size is under 10GB
- Ensure sufficient disk space on server

### Build Issues
- Clear `node_modules` and reinstall: `rm -rf node_modules package-lock.json && npm install`
- Clear Vite cache: `rm -rf client/dist .vite`
- Ensure Node.js 18+ is installed

## Versioning

This project follows [Semantic Versioning](https://semver.org/). Versions are automatically generated based on conventional commits:
- `fix:` → patch (1.0.0 → 1.0.1)
- `feat:` → minor (1.0.0 → 1.1.0)
- `BREAKING CHANGE:` → major (1.0.0 → 2.0.0)

See [Releases](https://github.com/albrtbc/subtleai/releases) for changelog.

## License

MIT License - See LICENSE file for details.
