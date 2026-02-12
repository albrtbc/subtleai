import { useState } from 'react';

export default function ApiKeyInput({ value, onChange }) {
  const [isOpen, setIsOpen] = useState(!value);
  const [showKey, setShowKey] = useState(false);

  return (
    <div className="bg-gray-900 rounded-lg border border-gray-800">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between px-4 py-3 text-sm font-medium text-gray-300 hover:text-gray-100 transition-colors"
      >
        <span>
          Groq API Key{' '}
          <span className={value ? 'text-green-400' : 'text-yellow-400'}>
            {value ? '(configured)' : '(not set)'}
          </span>
        </span>
        <span className="text-gray-500">{isOpen ? '\u25B2' : '\u25BC'}</span>
      </button>
      {isOpen && (
        <div className="px-4 pb-4 space-y-2">
          <div className="relative">
            <input
              type={showKey ? 'text' : 'password'}
              value={value}
              onChange={(e) => onChange(e.target.value)}
              placeholder="gsk_..."
              className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 pr-16
                         text-gray-100 placeholder-gray-500 focus:border-indigo-500 focus:outline-none text-sm"
            />
            <button
              onClick={() => setShowKey(!showKey)}
              className="absolute right-2 top-1/2 -translate-y-1/2 text-xs text-gray-400 hover:text-gray-200 px-2 py-1"
            >
              {showKey ? 'Hide' : 'Show'}
            </button>
          </div>
          <p className="text-xs text-gray-500">
            Used for both transcription (Whisper large-v3) and translation (LLaMA 3.3).
            Stored locally in your browser. Overrides the server .env key.
          </p>
        </div>
      )}
    </div>
  );
}
