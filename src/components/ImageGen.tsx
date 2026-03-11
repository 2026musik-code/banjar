import React, { useState } from 'react';
import { ImagePlus, Loader2, Download, Wand2 } from 'lucide-react';
import { getGeminiClient } from '../lib/gemini';
import { motion } from 'motion/react';

export default function ImageGen() {
  const [prompt, setPrompt] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedImage, setGeneratedImage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!prompt.trim() || isGenerating) return;

    setIsGenerating(true);
    setError(null);
    setGeneratedImage(null);

    try {
      const ai = getGeminiClient();
      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash-image',
        contents: {
          parts: [{ text: prompt }]
        },
        config: {
          imageConfig: {
            aspectRatio: "1:1"
          }
        }
      });

      let imageUrl = null;
      for (const part of response.candidates?.[0]?.content?.parts || []) {
        if (part.inlineData) {
          const base64EncodeString = part.inlineData.data;
          imageUrl = `data:image/png;base64,${base64EncodeString}`;
          break;
        }
      }

      if (imageUrl) {
        setGeneratedImage(imageUrl);
      } else {
        setError('Gagal menghasilkan gambar. Coba deskripsi lain.');
      }
    } catch (err: any) {
      console.error('Image generation error:', err);
      setError(`Terjadi kesalahan: ${err.message || 'Gagal menghubungi server.'}`);
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="flex flex-col h-full max-w-4xl mx-auto w-full p-4 md:p-8">
      <div className="text-center mb-8">
        <h2 className="text-3xl font-serif text-accent mb-2">Studio Gambar</h2>
        <p className="text-text-muted">Wujudkan imajinasi Anda menjadi karya seni visual</p>
      </div>

      <div className="flex-1 flex flex-col items-center justify-center w-full max-w-2xl mx-auto">
        {error && (
          <div className="w-full p-4 mb-6 bg-red-500/10 border border-red-500/50 rounded-xl text-red-400 text-center">
            {error}
          </div>
        )}

        {generatedImage ? (
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="w-full relative group rounded-2xl overflow-hidden border border-border bg-surface shadow-2xl mb-8"
          >
            <img src={generatedImage} alt={prompt} className="w-full h-auto object-cover aspect-square md:aspect-video" />
            <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center backdrop-blur-sm">
              <a
                href={generatedImage}
                download={`zona-banjar-${Date.now()}.png`}
                className="flex items-center gap-2 px-6 py-3 bg-accent text-white rounded-full font-medium hover:bg-accent-hover transition-transform transform hover:scale-105"
              >
                <Download className="w-5 h-5" />
                <span>Unduh Gambar</span>
              </a>
            </div>
          </motion.div>
        ) : (
          <div className="w-full aspect-square md:aspect-video rounded-2xl border-2 border-dashed border-border bg-surface/50 flex flex-col items-center justify-center text-text-muted mb-8">
            {isGenerating ? (
              <>
                <Loader2 className="w-12 h-12 text-accent animate-spin mb-4" />
                <p className="text-accent font-medium">Melukis mahakarya Anda...</p>
              </>
            ) : (
              <>
                <ImagePlus className="w-16 h-16 mb-4 opacity-50" />
                <p>Area kanvas kosong</p>
              </>
            )}
          </div>
        )}

        <form onSubmit={handleGenerate} className="w-full relative">
          <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none">
            <Wand2 className="w-5 h-5 text-accent" />
          </div>
          <input
            type="text"
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder="Deskripsikan gambar yang ingin Anda buat..."
            className="w-full bg-surface border border-border rounded-full pl-12 pr-32 py-4 text-text placeholder:text-text-muted focus:outline-none focus:border-accent focus:ring-1 focus:ring-accent shadow-lg"
            disabled={isGenerating}
          />
          <button
            type="submit"
            disabled={!prompt.trim() || isGenerating}
            className="absolute inset-y-2 right-2 px-6 bg-accent text-white rounded-full font-medium hover:bg-accent-hover transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            {isGenerating ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Buat'}
          </button>
        </form>
      </div>
    </div>
  );
}
