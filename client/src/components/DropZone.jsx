import { useState, useRef, useCallback } from 'react';

const MAX_SIZE = 250 * 1024 * 1024;

export default function DropZone({ file, onFileSelect, disabled }) {
  const [isDragging, setIsDragging] = useState(false);
  const inputRef = useRef(null);

  const handleFile = useCallback(
    (f) => {
      if (f.size > MAX_SIZE) {
        alert(`File is too large (${(f.size / 1024 / 1024).toFixed(1)}MB). Maximum is 250MB.`);
        return;
      }
      onFileSelect(f);
    },
    [onFileSelect],
  );

  const handleDrop = useCallback(
    (e) => {
      e.preventDefault();
      setIsDragging(false);
      if (disabled) return;
      const f = e.dataTransfer.files[0];
      if (f) handleFile(f);
    },
    [disabled, handleFile],
  );

  const handleDragOver = (e) => {
    e.preventDefault();
    if (!disabled) setIsDragging(true);
  };

  const handleDragLeave = () => setIsDragging(false);

  const handleInputChange = (e) => {
    if (e.target.files[0]) handleFile(e.target.files[0]);
  };

  return (
    <div
      onDrop={handleDrop}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onClick={() => !disabled && inputRef.current?.click()}
      className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-colors
        ${isDragging ? 'border-indigo-400 bg-indigo-950/30' : 'border-gray-700 hover:border-gray-500'}
        ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
    >
      <input
        ref={inputRef}
        type="file"
        accept="audio/*"
        onChange={handleInputChange}
        className="hidden"
      />
      {file ? (
        <div className="space-y-2">
          <p className="text-lg font-medium">{file.name}</p>
          <p className="text-sm text-gray-400">
            {(file.size / 1024 / 1024).toFixed(2)} MB
          </p>
          <button
            onClick={(e) => {
              e.stopPropagation();
              onFileSelect(null);
            }}
            className="text-red-400 text-sm hover:underline"
          >
            Remove
          </button>
        </div>
      ) : (
        <div className="space-y-2">
          <div className="text-4xl text-gray-500">&#x1F3B5;</div>
          <p className="text-lg">Drag and drop an audio file here</p>
          <p className="text-sm text-gray-400">or click to browse</p>
          <p className="text-xs text-gray-500">
            Supports: MP3, MP4, WAV, WebM, M4A (max 250MB)
          </p>
        </div>
      )}
    </div>
  );
}
