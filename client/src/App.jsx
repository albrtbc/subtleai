import { useState, useCallback } from 'react';
import Header from './components/Header';
import DropZone from './components/DropZone';
import LanguageSelector from './components/LanguageSelector';
import ApiKeyInput from './components/ApiKeyInput';
import ProgressStatus from './components/ProgressStatus';
import SrtPreview from './components/SrtPreview';
import { transcribe } from './services/api';

export default function App() {
  const [file, setFile] = useState(null);
  const [sourceLanguage, setSourceLanguage] = useState('auto');
  const [outputLanguage, setOutputLanguage] = useState('en');
  const [groqKey, setGroqKey] = useState(
    () => localStorage.getItem('groq_api_key') || '',
  );
  const [srtContent, setSrtContent] = useState('');
  const [error, setError] = useState('');

  // Streaming progress state
  const [step, setStep] = useState(null);
  const [message, setMessage] = useState('');
  const [chunk, setChunk] = useState(0);
  const [totalChunks, setTotalChunks] = useState(0);

  const handleGroqKeyChange = useCallback((key) => {
    setGroqKey(key);
    localStorage.setItem('groq_api_key', key);
  }, []);

  const handleGenerate = async () => {
    if (!file) {
      setError('Please select an audio file');
      return;
    }

    // Reset state
    setStep('transcribing');
    setMessage('Uploading and preparing...');
    setChunk(0);
    setTotalChunks(0);
    setError('');
    setSrtContent('');

    const formData = new FormData();
    formData.append('audio', file);
    formData.append('sourceLanguage', sourceLanguage);
    formData.append('outputLanguage', outputLanguage);
    if (groqKey) formData.append('groqApiKey', groqKey);

    try {
      const result = await transcribe(formData, (event) => {
        setStep(event.step);
        setMessage(event.message || '');
        if (event.chunk !== undefined) setChunk(event.chunk);
        if (event.totalChunks !== undefined) setTotalChunks(event.totalChunks);
      });

      setStep('done');
      setMessage('Transcription complete!');
      setSrtContent(result.srt);
    } catch (err) {
      setStep('error');
      setError(err.message || 'An error occurred');
    }
  };

  const isProcessing = step && step !== 'done' && step !== 'error';

  return (
    <div className="min-h-screen bg-gray-950 text-gray-100">
      <Header />
      <main className="max-w-2xl mx-auto px-4 py-8 space-y-6">
        <ApiKeyInput value={groqKey} onChange={handleGroqKeyChange} />
        <DropZone file={file} onFileSelect={setFile} disabled={isProcessing} />
        <LanguageSelector
          sourceLanguage={sourceLanguage}
          outputLanguage={outputLanguage}
          onSourceChange={setSourceLanguage}
          onOutputChange={setOutputLanguage}
        />
        <button
          onClick={handleGenerate}
          disabled={!file || isProcessing}
          className="w-full py-3 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50
                     disabled:cursor-not-allowed rounded-lg font-semibold transition-colors cursor-pointer"
        >
          {isProcessing ? 'Processing...' : 'Generate SRT'}
        </button>
        <ProgressStatus
          step={step}
          message={message}
          chunk={chunk}
          totalChunks={totalChunks}
          error={error}
        />
        {srtContent && (
          <SrtPreview content={srtContent} filename={file?.name} />
        )}
      </main>
    </div>
  );
}
