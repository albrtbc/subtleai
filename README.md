# SRT Generator

A full-stack web application that generates SRT subtitle files from audio and video files using AI-powered transcription. Built with React, Express, and powered by GROQ and OpenAI APIs.

## Features

- **Batch Processing**: Upload and process multiple files concurrently (up to 3 at a time)
- **Multi-Language Support**: Auto-detect source language and translate to your target language
- **Real-Time Progress**: Track transcription progress with detailed status updates
- **Auto-Download**: Automatically download completed SRT files
- **Queue Management**: Manage pending, processing, and completed jobs
- **Large File Support**: Handle files up to 10GB
- **Multiple AI Providers**: Support for both GROQ and OpenAI transcription APIs

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
- **GROQ & OpenAI** - AI transcription providers
- **dotenv** - Environment configuration

## Prerequisites

Before running the application, you'll need:

- Node.js 16+ and npm
- API keys from at least one of these services:
  - [GROQ API](https://console.groq.com) (recommended for free tier)
  - [OpenAI API](https://platform.openai.com/api-keys)

## Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd srt-generator
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Create environment file**
   ```bash
   cp .env.example .env
   ```

4. **Add your API keys** to `.env`:
   ```
   GROQ_API_KEY=your_groq_key_here
   OPENAI_API_KEY=your_openai_key_here
   PORT=3001
   ```

   ⚠️ **Important**: Never commit the `.env` file. Keep your API keys private!

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
srt-generator/
├── client/                 # React frontend
│   ├── src/
│   │   ├── components/    # React components (DropZone, FileJobList, etc.)
│   │   ├── services/      # API service functions
│   │   ├── hooks/         # Custom hooks (useJobQueue)
│   │   └── App.jsx        # Main app component
│   ├── package.json       # Frontend dependencies
│   └── vite.config.js     # Vite configuration
│
├── server/                # Express backend
│   ├── src/
│   │   ├── routes/        # API routes (transcribe, download)
│   │   ├── middleware/    # Express middleware (upload)
│   │   ├── services/      # Business logic (storage, video conversion, etc.)
│   │   └── index.js       # Express server entry point
│   └── package.json       # Server dependencies
│
├── .env.example           # Example environment variables
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

The `.env` file supports these variables:

```
GROQ_API_KEY=your_groq_api_key
OPENAI_API_KEY=your_openai_api_key
PORT=3001
```

### Optional Configuration
- **PORT**: Server port (default: 3001)
- **Client dev port**: http://localhost:5173 (configured in Vite)

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
- Ensure API keys are valid and not expired
- Check GROQ and OpenAI dashboards for usage limits
- Try using the other provider if one fails

### Upload Failures
- Verify file format is supported (MP3, WAV, MP4, WebM, etc.)
- Check file size is under 10GB
- Ensure sufficient disk space on server

### Build Issues
- Clear `node_modules` and reinstall: `rm -rf node_modules package-lock.json && npm install`
- Clear Vite cache: `rm -rf client/dist .vite`
- Update Node.js to version 16 or higher

## License

[Add your license here - e.g., MIT, Apache 2.0, etc.]

## Contributing

[Add contribution guidelines if applicable]

## Support

For issues or questions, please open an issue on the GitHub repository.

---

**Note**: This application requires valid API keys from GROQ or OpenAI to function. Keep your API keys secure and never commit them to version control.
