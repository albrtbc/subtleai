# SubtleAI

A full-stack web application that generates SRT subtitle files from audio and video files using AI-powered transcription. Built with React, Express, and powered by GROQ API.

## Features

- **Batch Processing**: Upload and process multiple files concurrently (up to 3 at a time)
- **Multi-Language Support**: Auto-detect source language and translate to your target language
- **Real-Time Progress**: Track transcription progress with detailed status updates
- **Auto-Download**: Automatically download completed SRT files
- **Queue Management**: Manage pending, processing, and completed jobs
- **Large File Support**: Handle files up to 10GB
- **Docker Ready**: Run anywhere with official Docker images available on DockerHub

## Tech Stack

### Frontend
- **React 19** - UI framework
- **Vite 7** - Build tool with HMR
- **Tailwind CSS 4** - Styling
- **Axios** - HTTP client

### Backend
- **Node.js** - Runtime
- **Express 4** - Web framework
- **Multer** - File upload handling
- **GROQ API** - AI transcription provider
- **FFmpeg** - Audio/video processing
- **dotenv** - Environment configuration

## Prerequisites

Before running the application, you'll need:

- Node.js 16+ and npm
- API key from [GROQ API](https://console.groq.com)

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

   ⚠️ **Important**: Never commit the `.env` file. Keep your API keys private!

## Docker Deployment

Run with Docker using our official image:

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

Build the application for production:

```bash
npm run build
```

This compiles both client and server, with the client built to `client/dist` and the server configured to serve static assets.

## Project Structure

```
subtleai/
├── .github/
│   └── workflows/         # GitHub Actions CI/CD
│
├── client/                # React frontend
│   ├── src/
│   │   ├── components/    # React components
│   │   ├── services/      # API service functions
│   │   ├── hooks/         # Custom hooks (useJobQueue)
│   │   └── App.jsx        # Main app component
│   ├── package.json       # Frontend dependencies
│   └── vite.config.js     # Vite configuration
│
├── server/                # Express backend
│   ├── src/
│   │   ├── routes/        # API routes (transcribe, download, config)
│   │   ├── middleware/    # Express middleware (upload)
│   │   ├── services/      # Business logic (transcription, translation, storage)
│   │   ├── config/        # Configuration files
│   │   └── index.js       # Express server entry point
│   └── package.json       # Server dependencies
│
├── Dockerfile             # Docker image definition
├── docker-compose.yml     # Docker Compose configuration
├── .env.example           # Example environment variables
├── .releaserc.json        # Semantic versioning config
├── package.json           # Root workspace configuration
└── README.md              # This file
```

## API Endpoints

### POST `/api/transcribe`
Transcribe an audio/video file to SRT subtitles.

**Parameters:**
- `audio` (file, required) - Audio or video file
- `sourceLanguage` (string) - Language code or "auto" for auto-detect
- `outputLanguage` (string) - Target language code (e.g., "en", "es", "fr")
- `groqApiKey` (string, optional) - Client-provided GROQ API key

**Response:**
```json
{
  "jobId": "unique-job-id",
  "detectedLanguage": "en",
  "duration": 3600
}
```

### GET `/api/download/:jobId`
Download the generated SRT file.

## Usage

1. **Open the app** at http://localhost:5173
2. **Enter API Key** (optional - use server's key if not provided)
3. **Drop files** or click to upload audio/video files
4. **Select languages** - source (auto-detect available) and target language
5. **Generate SRT** - Click the button to start processing
6. **Download** - Files auto-download when complete (toggle in settings)

## Configuration

Create a `.env` file in the root directory with the required and optional variables:

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

## Error Handling

The application handles common errors gracefully:

- **File too large** - Maximum 10GB per file
- **Unsupported format** - Only audio/video files accepted
- **API errors** - Detailed error messages shown in UI
- **Network failures** - Automatic retry with exponential backoff

## Browser Support

- Chrome/Edge 90+
- Firefox 88+
- Safari 14+
- Any modern browser with ES2020+ support

## Performance

- **Concurrent Processing**: Up to 3 files processed simultaneously
- **File Uploads**: Chunked upload for large files
- **Storage Cleanup**: Automatic cleanup of temporary files after 24 hours
- **Real-time Progress**: Server-sent events or polling for job status

## Troubleshooting

### API Key Issues
- Ensure GROQ API key is valid and not expired
- Check GROQ dashboard for usage limits and remaining quota
- Regenerate key if experiencing authentication errors

### Upload Failures
- Verify file format is supported (MP3, WAV, MP4, WebM, etc.)
- Check file size is under 10GB
- Ensure sufficient disk space on server

### Build Issues
- Clear `node_modules` and reinstall: `rm -rf node_modules package-lock.json && npm install`
- Clear Vite cache: `rm -rf client/dist .vite`
- Update Node.js to version 16 or higher

## Versioning

This project follows [Semantic Versioning](https://semver.org/). Versions are automatically generated based on conventional commits:
- `fix:` → patch version (1.0.0 → 1.0.1)
- `feat:` → minor version (1.0.0 → 1.1.0)
- `BREAKING CHANGE:` → major version (1.0.0 → 2.0.0)

See [Releases](https://github.com/albrtbc/subtleai/releases) for changelog and version history.

## Docker Hub

Official Docker images available at:
- [gasbostation/subtleai:latest](https://hub.docker.com/repository/docker/gasbostation/subtleai)
- [gasbostation/subtleai:1.0.2](https://hub.docker.com/repository/docker/gasbostation/subtleai)
- [gasbostation/subtleai:1.0](https://hub.docker.com/repository/docker/gasbostation/subtleai)

## License

MIT License - See LICENSE file for details

## Support

For issues or questions, please open an issue on the [GitHub repository](https://github.com/albrtbc/subtleai/issues).

---

**Note**: This application requires a valid GROQ API key to function. Keep your API keys secure and never commit them to version control.
