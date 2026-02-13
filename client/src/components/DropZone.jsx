import { useState, useRef, useCallback } from 'react';

const MAX_SIZE = 10 * 1024 * 1024 * 1024; // 10GB

export default function DropZone({ onFilesSelect, disabled }) {
  const [isDragging, setIsDragging] = useState(false);
  const inputRef = useRef(null);

  const validateAndSelect = useCallback(
    (fileList) => {
      const valid = [];
      for (const f of fileList) {
        if (f.size > MAX_SIZE) {
          alert(`"${f.name}" is too large (${(f.size / 1024 / 1024).toFixed(1)}MB). Maximum is 250MB.`);
        } else {
          valid.push(f);
        }
      }
      if (valid.length > 0) onFilesSelect(valid);
    },
    [onFilesSelect],
  );

  const handleDrop = useCallback(
    (e) => {
      e.preventDefault();
      setIsDragging(false);
      if (disabled) return;
      const files = Array.from(e.dataTransfer.files);
      if (files.length > 0) validateAndSelect(files);
    },
    [disabled, validateAndSelect],
  );

  const handleDragOver = (e) => {
    e.preventDefault();
    if (!disabled) setIsDragging(true);
  };

  const handleDragLeave = () => setIsDragging(false);

  const handleInputChange = (e) => {
    const files = Array.from(e.target.files);
    if (files.length > 0) validateAndSelect(files);
    e.target.value = '';
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
        accept="audio/*,video/*,.mkv"
        multiple
        onChange={handleInputChange}
        className="hidden"
      />
      <div className="space-y-2">
        <div className="text-4xl text-gray-500">&#x1F3B5;</div>
        <p className="text-lg">Drag and drop audio or video files here</p>
        <p className="text-sm text-gray-400">or click to browse</p>
        <p className="text-xs text-gray-500">
          Audio: MP3, WAV, M4A, WebM | Video: MP4, WebM, MKV (max 10GB per file)
        </p>
      </div>
    </div>
  );
}
