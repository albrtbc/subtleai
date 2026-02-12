import { useCallback, useState } from 'react';

export default function SrtPreview({ content, filename }) {
  const [copied, setCopied] = useState(false);

  const srtFilename = filename
    ? filename.replace(/\.[^.]+$/, '.srt')
    : 'subtitles.srt';

  const handleDownload = useCallback(() => {
    const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = srtFilename;
    a.click();
    URL.revokeObjectURL(url);
  }, [content, srtFilename]);

  const handleCopy = useCallback(() => {
    navigator.clipboard.writeText(content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }, [content]);

  return (
    <div className="bg-gray-900 rounded-lg border border-gray-800 overflow-hidden">
      <div className="flex items-center justify-between px-4 py-2 border-b border-gray-800">
        <span className="text-sm font-medium text-gray-300">{srtFilename}</span>
        <div className="flex gap-2">
          <button
            onClick={handleCopy}
            className="text-xs px-3 py-1 bg-gray-700 hover:bg-gray-600 rounded transition-colors"
          >
            {copied ? 'Copied!' : 'Copy'}
          </button>
          <button
            onClick={handleDownload}
            className="text-xs px-3 py-1 bg-indigo-600 hover:bg-indigo-500 rounded transition-colors"
          >
            Download SRT
          </button>
        </div>
      </div>
      <pre className="p-4 text-sm text-gray-300 overflow-auto max-h-96 font-mono whitespace-pre-wrap">
        {content}
      </pre>
    </div>
  );
}
