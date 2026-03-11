import { GoogleGenAI } from '@google/genai';

// Initialize with the API key from the environment or user selection
export const getGeminiClient = () => {
  let apiKey = process.env.GEMINI_API_KEY;
  
  // Try to get user-selected key from localStorage
  if (typeof window !== 'undefined') {
    const savedKey = localStorage.getItem('active_gemini_key_value');
    if (savedKey) {
      apiKey = savedKey;
    }
  }

  if (!apiKey) {
    throw new Error('API Key tidak ditemukan. Silakan tambahkan API Key di menu Pengaturan.');
  }

  return new GoogleGenAI({ apiKey });
};

// Helper to check if user has selected a key (for video/high-res image)
export const ensureApiKey = async () => {
  if (typeof window !== 'undefined') {
    const savedKey = localStorage.getItem('active_gemini_key_value');
    if (savedKey) return true;

    // Fallback to AI Studio platform key selection if available
    if ((window as any).aistudio) {
      const hasKey = await (window as any).aistudio.hasSelectedApiKey();
      if (!hasKey) {
        await (window as any).aistudio.openSelectKey();
      }
      return true;
    }
    
    // If no key and not in AI Studio, alert user
    alert("Silakan masukkan API Key Gemini Anda melalui menu Pengaturan di pojok kanan atas.");
    return false;
  }
  return false;
};

