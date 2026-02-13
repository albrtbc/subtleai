export default function AutoDownloadToggle({ autoDownload, onChange, disabled }) {
  return (
    <div className="bg-gradient-to-r from-gray-900 to-gray-800 border border-gray-700 rounded-lg p-4 shadow-lg">
      <div className="flex items-center justify-between">
        <div className="flex-1">
          <div className="text-sm font-semibold text-gray-100">Auto-download SRT files</div>
          <div className="text-xs text-gray-400 mt-1">Files will download automatically when processing completes</div>
        </div>

        {/* Toggle Switch */}
        <button
          onClick={() => !disabled && onChange(!autoDownload)}
          disabled={disabled}
          className={`relative inline-flex h-8 w-14 items-center rounded-full transition-colors duration-300 ml-4 flex-shrink-0 ${
            autoDownload
              ? 'bg-indigo-600 hover:bg-indigo-500'
              : 'bg-gray-700 hover:bg-gray-600'
          } ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
        >
          <span
            className={`inline-block h-6 w-6 transform rounded-full bg-white shadow-lg transition-transform duration-300 ${
              autoDownload ? 'translate-x-7' : 'translate-x-1'
            }`}
          />

          {/* Icon inside toggle */}
          <span
            className={`absolute inset-0 flex items-center justify-center text-xs font-bold transition-all duration-300 ${
              autoDownload ? 'text-indigo-600 opacity-0' : 'text-gray-600 opacity-100'
            }`}
          >
            ○
          </span>
          <span
            className={`absolute inset-0 flex items-center justify-center text-xs font-bold transition-all duration-300 ${
              autoDownload ? 'text-indigo-600 opacity-100' : 'text-gray-400 opacity-0'
            }`}
          >
            ✓
          </span>
        </button>
      </div>
    </div>
  );
}
