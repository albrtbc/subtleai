// Supported languages for transcription and translation
// Format: code -> display name
const SUPPORTED_LANGUAGES = {
  // Auto-detect
  auto: 'Auto-detect',

  // Most common languages
  en: 'English',
  es: 'Spanish',
  fr: 'French',
  de: 'German',
  it: 'Italian',
  pt: 'Portuguese',
  ru: 'Russian',
  ja: 'Japanese',
  ko: 'Korean',
  zh: 'Chinese (Simplified)',
  'zh-TW': 'Chinese (Traditional)',

  // Other languages
  ar: 'Arabic',
  hi: 'Hindi',
  pl: 'Polish',
  tr: 'Turkish',
  vi: 'Vietnamese',
  th: 'Thai',
  nl: 'Dutch',
  sv: 'Swedish',
  no: 'Norwegian',
  da: 'Danish',
  fi: 'Finnish',
  el: 'Greek',
  cs: 'Czech',
  hu: 'Hungarian',
  ro: 'Romanian',
  uk: 'Ukrainian',
  he: 'Hebrew',
  id: 'Indonesian',
  ms: 'Malay',
};

function isValidLanguage(code) {
  return code in SUPPORTED_LANGUAGES;
}

module.exports = { SUPPORTED_LANGUAGES, isValidLanguage };
