import { LANGUAGES } from '../utils/languages';

export default function LanguageSelector({
  sourceLanguage,
  outputLanguage,
  onSourceChange,
  onOutputChange,
}) {
  return (
    <div className="grid grid-cols-2 gap-4">
      <div>
        <label className="block text-sm font-medium text-gray-300 mb-1">
          Audio Language
        </label>
        <select
          value={sourceLanguage}
          onChange={(e) => onSourceChange(e.target.value)}
          className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2
                     text-gray-100 focus:border-indigo-500 focus:outline-none"
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
          className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2
                     text-gray-100 focus:border-indigo-500 focus:outline-none"
        >
          {LANGUAGES.map(({ code, name }) => (
            <option key={code} value={code}>
              {name}
            </option>
          ))}
        </select>
      </div>
    </div>
  );
}
