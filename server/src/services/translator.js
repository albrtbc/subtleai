const OpenAI = require('openai');

const GROQ_BASE_URL = 'https://api.groq.com/openai/v1';
const BATCH_SIZE = 80; // SRT entries per translation batch

const SYSTEM_PROMPT = (targetLanguage) =>
  `You are a professional subtitle translator. You will receive an SRT subtitle file. Translate ONLY the text lines into ${targetLanguage}. You MUST preserve:
- All sequence numbers exactly as they are
- All timestamp lines exactly as they are (HH:MM:SS,mmm --> HH:MM:SS,mmm)
- The exact SRT format structure (blank line between entries)
- Do NOT add, remove, merge, or split any subtitle entries
Output ONLY the translated SRT content with no additional commentary.`;

async function translateBatch(groq, srtBatch, targetLanguage) {
  const response = await groq.chat.completions.create({
    model: 'llama-3.3-70b-versatile',
    messages: [
      { role: 'system', content: SYSTEM_PROMPT(targetLanguage) },
      { role: 'user', content: srtBatch },
    ],
    temperature: 0.3,
  });

  return response.choices[0].message.content.trim();
}

async function translate(srtContent, sourceLanguage, targetLanguage, groqApiKey) {
  const groq = new OpenAI({
    apiKey: groqApiKey,
    baseURL: GROQ_BASE_URL,
  });

  // Split SRT into individual entry blocks
  const blocks = srtContent.trim().split(/\n\s*\n/).filter(Boolean);

  console.log(`[translator] Total SRT entries: ${blocks.length}, batch size: ${BATCH_SIZE}`);

  if (blocks.length <= BATCH_SIZE) {
    // Small enough to translate in one call
    return await translateBatch(groq, srtContent, targetLanguage);
  }

  // Translate in batches to avoid LLM output token limits
  const translatedParts = [];
  for (let i = 0; i < blocks.length; i += BATCH_SIZE) {
    const batchNum = Math.floor(i / BATCH_SIZE) + 1;
    const totalBatches = Math.ceil(blocks.length / BATCH_SIZE);
    const batch = blocks.slice(i, i + BATCH_SIZE).join('\n\n');

    console.log(`[translator] Translating batch ${batchNum}/${totalBatches} (entries ${i + 1}-${Math.min(i + BATCH_SIZE, blocks.length)})`);

    const translated = await translateBatch(groq, batch, targetLanguage);
    translatedParts.push(translated);
  }

  return translatedParts.join('\n\n') + '\n';
}

module.exports = { translate };
