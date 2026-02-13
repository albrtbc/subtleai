export default function Header() {
  return (
    <header className="border-b border-gray-800 py-4">
      <div className="max-w-2xl mx-auto px-4">
        <h1 className="text-2xl font-bold">SubtleAI</h1>
        <p className="text-sm text-gray-400 mt-1">
          Upload audio or video files, extract audio, transcribe with Whisper, download SRT subtitles
        </p>
      </div>
    </header>
  );
}
