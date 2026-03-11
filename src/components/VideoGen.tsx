import React, { useState, useEffect } from 'react';
import { Video, Loader2, Download, Film, AlertCircle } from 'lucide-react';
import { getGeminiClient, ensureApiKey, getApiKey } from '../lib/gemini';
import { motion } from 'motion/react';

export default function VideoGen() {
  const [prompt, setPrompt] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedVideo, setGeneratedVideo] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [progress, setProgress] = useState<string>('');
  const [hasKey, setHasKey] = useState<boolean | null>(null);

  useEffect(() => {
    const checkKey = async () => {
      if (typeof window !== 'undefined' && (window as any).aistudio) {
        const keyStatus = await (window as any).aistudio.hasSelectedApiKey();
        setHasKey(keyStatus);
      } else {
        setHasKey(true); // Fallback if not in AI Studio
      }
    };
    checkKey();
  }, []);

  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!prompt.trim() || isGenerating) return;

    try {
      await ensureApiKey();
      // Re-check key after prompt
      if (typeof window !== 'undefined' && (window as any).aistudio) {
        const keyStatus = await (window as any).aistudio.hasSelectedApiKey();
        if (!keyStatus) return; // User cancelled
      }
    } catch (err) {
      console.error("API Key error:", err);
      return;
    }

    setIsGenerating(true);
    setError(null);
    setGeneratedVideo(null);
    setProgress('Memulai proses pembuatan video...');

    try {
      // Re-initialize client to ensure it uses the newly selected key
      const ai = getGeminiClient();
      
      let operation = await ai.models.generateVideos({
        model: 'veo-3.1-fast-generate-preview',
        prompt: prompt,
        config: {
          numberOfVideos: 1,
          resolution: '720p',
          aspectRatio: '16:9'
        }
      });

      setProgress('Video sedang diproses. Ini mungkin memakan waktu beberapa menit...');

      while (!operation.done) {
        await new Promise(resolve => setTimeout(resolve, 10000));
        operation = await ai.operations.getVideosOperation({operation: operation});
        setProgress('Masih memproses... Harap bersabar.');
      }

      const downloadLink = operation.response?.generatedVideos?.[0]?.video?.uri;
      
      if (downloadLink) {
        // Fetch video with API key header
        const apiKey = getApiKey() || '';
        const response = await fetch(downloadLink, {
          method: 'GET',
          headers: {
            'x-goog-api-key': apiKey,
          },
        });
        
        if (response.ok) {
          const blob = await response.blob();
          const url = URL.createObjectURL(blob);
          setGeneratedVideo(url);
        } else {
          throw new Error('Gagal mengunduh video dari server.');
        }
      } else {
        setError('Gagal menghasilkan video. Coba deskripsi lain.');
      }
    } catch (err: any) {
      console.error('Video generation error:', err);
      if (err.message?.includes('Requested entity was not found')) {
        setError('Sesi API Key tidak valid. Silakan coba lagi.');
        // Reset key status to prompt again
        setHasKey(false);
      } else {
        setError(`Terjadi kesalahan: ${err.message || 'Pastikan API Key Anda memiliki akses ke model Veo.'}`);
      }
    } finally {
      setIsGenerating(false);
      setProgress('');
    }
  };

  return (
    <div className="flex flex-col h-full max-w-4xl mx-auto w-full p-4 md:p-8">
      <div className="text-center mb-8">
        <h2 className="text-3xl font-serif text-accent mb-2">Studio Video</h2>
        <p className="text-text-muted">Ciptakan video sinematik dengan kekuatan AI</p>
      </div>

      <div className="flex-1 flex flex-col items-center justify-center w-full max-w-3xl mx-auto">
        {error && (
          <div className="w-full p-4 mb-6 bg-red-500/10 border border-red-500/50 rounded-xl text-red-400 flex items-start gap-3">
            <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
            <p>{error}</p>
          </div>
        )}

        {hasKey === false && !isGenerating && (
          <div className="w-full p-6 mb-8 bg-surface border border-accent/30 rounded-2xl text-center">
            <h3 className="text-xl font-medium text-accent mb-2">API Key Diperlukan</h3>
            <p className="text-text-muted mb-4">Fitur pembuatan video memerlukan API Key dari project Google Cloud yang memiliki akses billing.</p>
            <button 
              onClick={ensureApiKey}
              className="px-6 py-3 bg-accent text-white rounded-full font-medium hover:bg-accent-hover transition-colors"
            >
              Pilih API Key
            </button>
          </div>
        )}

        {generatedVideo ? (
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="w-full relative group rounded-2xl overflow-hidden border border-border bg-surface shadow-2xl mb-8"
          >
            <video 
              src={generatedVideo} 
              controls 
              autoPlay 
              loop 
              className="w-full h-auto aspect-video bg-black"
            />
            <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity">
              <a
                href={generatedVideo}
                download={`zona-banjar-video-${Date.now()}.mp4`}
                className="flex items-center gap-2 px-4 py-2 bg-black/50 backdrop-blur-md text-white rounded-lg border border-white/10 hover:bg-black/70 transition-colors"
              >
                <Download className="w-4 h-4" />
                <span className="text-sm">Unduh</span>
              </a>
            </div>
          </motion.div>
        ) : (
          <div className="w-full aspect-video rounded-2xl border-2 border-dashed border-border bg-surface/50 flex flex-col items-center justify-center text-text-muted mb-8 p-6 text-center">
            {isGenerating ? (
              <>
                <Loader2 className="w-12 h-12 text-accent animate-spin mb-4" />
                <p className="text-accent font-medium mb-2">Menyutradarai adegan Anda...</p>
                <p className="text-sm opacity-70 max-w-md">{progress}</p>
              </>
            ) : (
              <>
                <Video className="w-16 h-16 mb-4 opacity-50" />
                <p>Area studio kosong</p>
                <p className="text-sm opacity-50 mt-2 max-w-md">Pembuatan video membutuhkan waktu beberapa menit. Pastikan koneksi internet Anda stabil.</p>
              </>
            )}
          </div>
        )}

        <form onSubmit={handleGenerate} className="w-full relative">
          <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none">
            <Film className="w-5 h-5 text-accent" />
          </div>
          <input
            type="text"
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder="Deskripsikan adegan video yang ingin Anda buat..."
            className="w-full bg-surface border border-border rounded-full pl-12 pr-32 py-4 text-text placeholder:text-text-muted focus:outline-none focus:border-accent focus:ring-1 focus:ring-accent shadow-lg"
            disabled={isGenerating}
          />
          <button
            type="submit"
            disabled={!prompt.trim() || isGenerating}
            className="absolute inset-y-2 right-2 px-6 bg-accent text-white rounded-full font-medium hover:bg-accent-hover transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            {isGenerating ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Buat Video'}
          </button>
        </form>
      </div>
    </div>
  );
}
