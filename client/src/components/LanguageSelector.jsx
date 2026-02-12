import { LANGUAGES } from '../utils/languages';

export default function LanguageSelector({
  sourceLanguage,
  outputLanguage,
  onSourceChange,
  onOutputChange,
  disabled,
}) {
  return (
    <div className="space-y-2">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-1">
            Audio Language
          </label>
          <select
            value={sourceLanguage}
            onChange={(e) => onSourceChange(e.target.value)}
            disabled={disabled}
            className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2
                       text-gray-100 focus:border-indigo-500 focus:outline-none disabled:opacity-50"
          >
            <option value="auto">Auto-detect</option>
            {LANGUAGES.map(({ code, name }) => (
              <option key={code} value={code}>
                {name}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-1">
            Output SRT Language
          </label>
          <select
            value={outputLanguage}
            onChange={(e) => onOutputChange(e.target.value)}
            disabled={disabled}
            className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2
                       text-gray-100 focus:border-indigo-500 focus:outline-none disabled:opacity-50"
          >
            {LANGUAGES.map(({ code, name }) => (
              <option key={code} value={code}>
                {name}
              </option>
            ))}
          </select>
        </div>
      </div>
      <p className="text-xs text-gray-500">Language settings apply to all files</p>
    </div>
  );
}
