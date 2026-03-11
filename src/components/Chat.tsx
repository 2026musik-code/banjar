import React, { useState, useRef, useEffect } from 'react';
import { Send, Image as ImageIcon, Loader2, X } from 'lucide-react';
import { getGeminiClient } from '../lib/gemini';
import Markdown from 'react-markdown';
import { motion } from 'motion/react';

interface Message {
  id: string;
  role: 'user' | 'model';
  text: string;
  image?: string;
}

export default function Chat() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [image, setImage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setImage(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if ((!input.trim() && !image) || isLoading) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      text: input,
      image: image || undefined,
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput('');
    setImage(null);
    setIsLoading(true);

    try {
      const ai = getGeminiClient();
      let responseText = '';
      
      const activeModel = localStorage.getItem('active_gemini_model') || 'gemini-3.1-pro-preview';

      if (userMessage.image) {
        // Multimodal chat
        const base64Data = userMessage.image.split(',')[1];
        const mimeType = userMessage.image.split(';')[0].split(':')[1];
        
        const response = await ai.models.generateContent({
          model: activeModel,
          contents: {
            parts: [
              { inlineData: { data: base64Data, mimeType } },
              { text: userMessage.text || 'Analisa gambar ini.' }
            ]
          }
        });
        responseText = response.text || '';
      } else {
        // Text only chat
        const historyText = messages.map(m => `${m.role === 'user' ? 'User' : 'Assistant'}: ${m.text}`).join('\n');
        const prompt = historyText ? `Riwayat percakapan:\n${historyText}\n\nUser: ${userMessage.text}` : userMessage.text;
        
        const response = await ai.models.generateContent({
          model: activeModel,
          contents: prompt,
          config: {
             systemInstruction: 'Anda adalah asisten AI mewah dan profesional untuk ZONA BANJAR. Jawablah dengan sopan, elegan, dan informatif dalam bahasa Indonesia.',
          }
        });
        responseText = response.text || '';
      }

      setMessages((prev) => [
        ...prev,
        {
          id: (Date.now() + 1).toString(),
          role: 'model',
          text: responseText,
        },
      ]);
    } catch (error) {
      console.error('Chat error:', error);
      setMessages((prev) => [
        ...prev,
        {
          id: (Date.now() + 1).toString(),
          role: 'model',
          text: 'Maaf, terjadi kesalahan saat memproses permintaan Anda. Pastikan API Key Anda valid.',
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-full max-w-4xl mx-auto w-full">
      <div className="flex-1 overflow-y-auto p-4 space-y-6">
        {messages.length === 0 && (
          <div className="h-full flex flex-col items-center justify-center text-center opacity-50">
            <h2 className="text-2xl font-serif text-accent mb-2">ZONA BANJAR AI</h2>
            <p>Mulai percakapan atau unggah gambar untuk dianalisa.</p>
          </div>
        )}
        
        {messages.map((msg) => (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            key={msg.id}
            className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <div
              className={`max-w-[85%] md:max-w-[75%] rounded-2xl p-4 ${
                msg.role === 'user'
                  ? 'bg-accent text-white ml-auto'
                  : 'bg-surface border border-border text-text'
              }`}
            >
              {msg.image && (
                <img
                  src={msg.image}
                  alt="Uploaded"
                  className="max-w-full h-auto rounded-lg mb-3 object-cover max-h-64"
                />
              )}
              <div className="prose prose-invert max-w-none prose-p:leading-relaxed prose-pre:bg-bg prose-pre:border prose-pre:border-border">
                <Markdown>{msg.text}</Markdown>
              </div>
            </div>
          </motion.div>
        ))}
        {isLoading && (
          <div className="flex justify-start">
            <div className="bg-surface border border-border rounded-2xl p-4 flex items-center space-x-2 text-accent">
              <Loader2 className="w-5 h-5 animate-spin" />
              <span className="text-sm">Berpikir...</span>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      <div className="p-4 bg-bg/80 backdrop-blur-md border-t border-border sticky bottom-0">
        {image && (
          <div className="mb-3 relative inline-block">
            <img src={image} alt="Preview" className="h-20 w-20 object-cover rounded-lg border border-border" />
            <button
              onClick={() => setImage(null)}
              className="absolute -top-2 -right-2 bg-surface text-text rounded-full p-1 border border-border hover:bg-border transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        )}
        <form onSubmit={handleSubmit} className="flex items-end gap-2">
          <input
            type="file"
            accept="image/*"
            className="hidden"
            ref={fileInputRef}
            onChange={handleImageUpload}
          />
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="h-[52px] w-[52px] flex items-center justify-center shrink-0 text-text-muted hover:text-accent transition-colors rounded-xl bg-surface border border-border hover:border-accent/50"
          >
            <ImageIcon className="w-6 h-6" />
          </button>
          <div className="flex-1 relative">
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ketik pesan Anda di sini..."
              className="w-full block bg-surface border border-border rounded-xl px-4 py-3 text-text placeholder:text-text-muted focus:outline-none focus:border-accent focus:ring-1 focus:ring-accent resize-none min-h-[52px] max-h-32"
              rows={1}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleSubmit(e);
                }
              }}
            />
          </div>
          <button
            type="submit"
            disabled={(!input.trim() && !image) || isLoading}
            className="h-[52px] w-[52px] flex items-center justify-center shrink-0 bg-accent text-white rounded-xl hover:bg-accent-hover transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Send className="w-6 h-6" />
          </button>
        </form>
      </div>
    </div>
  );
}
