import React, { useState, useEffect } from 'react';
import { X, Key, Plus, Trash2, CheckCircle, Loader2, Cpu } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface ApiKey {
  id: string;
  name: string;
  key: string;
  createdAt?: string;
}

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function SettingsModal({ isOpen, onClose }: SettingsModalProps) {
  const [keys, setKeys] = useState<ApiKey[]>([]);
  const [activeKeyId, setActiveKeyId] = useState<string | null>(null);
  const [selectedModel, setSelectedModel] = useState('gemini-3.1-pro-preview');
  const [isAdding, setIsAdding] = useState(false);
  const [newKeyName, setNewKeyName] = useState('');
  const [newKeyValue, setNewKeyValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      fetchKeys();
      const savedActiveKey = localStorage.getItem('active_gemini_key_id');
      if (savedActiveKey) {
        setActiveKeyId(savedActiveKey);
      }
      const savedModel = localStorage.getItem('active_gemini_model');
      if (savedModel) {
        setSelectedModel(savedModel);
      }
    }
  }, [isOpen]);

  const fetchKeys = async () => {
    setIsLoading(true);
    setError(null);
    try {
      // Coba fetch dari Cloudflare R2 API
      const res = await fetch('/api/keys');
      if (res.ok) {
        const data = await res.json();
        setKeys(data);
      } else {
        throw new Error('API tidak tersedia');
      }
    } catch (e) {
      // Fallback ke localStorage jika API gagal (misal saat di preview AI Studio)
      console.log('Fallback ke localStorage untuk daftar API Key');
      const localKeys = JSON.parse(localStorage.getItem('saved_api_keys') || '[]');
      setKeys(localKeys);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSaveKey = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newKeyValue.trim()) return;

    setIsLoading(true);
    setError(null);
    const name = newKeyName.trim() || 'Kunci Tanpa Nama';
    const key = newKeyValue.trim();

    try {
      // Coba simpan ke Cloudflare R2 API
      const res = await fetch('/api/keys', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, key })
      });

      if (res.ok) {
        const newKey = await res.json();
        setKeys(prev => [...prev, newKey]);
        handleSelectKey(newKey); // Otomatis pilih key baru
      } else {
        throw new Error('Gagal menyimpan ke server');
      }
    } catch (e) {
      // Fallback ke localStorage
      const newKey: ApiKey = {
        id: Date.now().toString(),
        name,
        key,
        createdAt: new Date().toISOString()
      };
      const updatedKeys = [...keys, newKey];
      setKeys(updatedKeys);
      localStorage.setItem('saved_api_keys', JSON.stringify(updatedKeys));
      handleSelectKey(newKey);
    } finally {
      setNewKeyName('');
      setNewKeyValue('');
      setIsAdding(false);
      setIsLoading(false);
    }
  };

  const handleDeleteKey = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setIsLoading(true);
    
    try {
      // Coba hapus dari Cloudflare R2 API
      const res = await fetch('/api/keys', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id })
      });

      if (!res.ok) {
        throw new Error('Gagal menghapus dari server');
      }
      
      const updatedKeys = keys.filter(k => k.id !== id);
      setKeys(updatedKeys);
    } catch (e) {
      // Fallback ke localStorage
      const updatedKeys = keys.filter(k => k.id !== id);
      setKeys(updatedKeys);
      localStorage.setItem('saved_api_keys', JSON.stringify(updatedKeys));
    } finally {
      if (activeKeyId === id) {
        setActiveKeyId(null);
        localStorage.removeItem('active_gemini_key_id');
        localStorage.removeItem('active_gemini_key_value');
      }
      setIsLoading(false);
    }
  };

  const handleSelectKey = (key: ApiKey) => {
    setActiveKeyId(key.id);
    localStorage.setItem('active_gemini_key_id', key.id);
    localStorage.setItem('active_gemini_key_value', key.key);
  };

  const handleModelChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const model = e.target.value;
    setSelectedModel(model);
    localStorage.setItem('active_gemini_model', model);
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          className="w-full max-w-md bg-surface border border-border rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[85vh]"
        >
          {/* Header */}
          <div className="flex items-center justify-between p-5 border-b border-border bg-surface/80 backdrop-blur-md">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-accent/10 rounded-lg">
                <Key className="w-5 h-5 text-accent" />
              </div>
              <h2 className="text-xl font-serif font-semibold text-text">Pengaturan</h2>
            </div>
            <button
              onClick={onClose}
              className="p-2 text-text-muted hover:text-text hover:bg-border/50 rounded-full transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Body */}
          <div className="p-5 overflow-y-auto flex-1">
            
            {/* Model Selection */}
            <div className="mb-8">
              <div className="flex items-center gap-2 mb-3">
                <Cpu className="w-4 h-4 text-accent" />
                <h3 className="text-sm font-medium text-text uppercase tracking-wider">Model AI Utama</h3>
              </div>
              <select
                value={selectedModel}
                onChange={handleModelChange}
                className="w-full bg-bg border border-border rounded-xl px-4 py-3 text-sm text-text focus:outline-none focus:border-accent appearance-none cursor-pointer"
              >
                <option value="gemini-3.1-pro-preview">Gemini 3.1 Pro Preview</option>
                <option value="gemini-3-flash-preview">Gemini 3 Flash Preview</option>
                <option value="gemini-3.1-flash-lite-preview">Gemini 3.1 Flash Lite Preview</option>
              </select>
              <p className="text-xs text-text-muted mt-2">Model ini akan digunakan untuk fitur Chat & Analisa.</p>
            </div>

            <div className="border-t border-border pt-6 mb-6">
              <div className="flex items-center gap-2 mb-3">
                <Key className="w-4 h-4 text-accent" />
                <h3 className="text-sm font-medium text-text uppercase tracking-wider">Kunci API Tersimpan</h3>
              </div>
              <p className="text-xs text-text-muted mb-4">
                Kunci ini disimpan secara aman di Cloudflare R2 (datauser).
              </p>
              
              {isLoading && keys.length === 0 ? (
                <div className="flex justify-center py-8">
                  <Loader2 className="w-6 h-6 text-accent animate-spin" />
                </div>
              ) : keys.length === 0 ? (
                <div className="text-center py-8 border border-dashed border-border rounded-xl bg-bg/50">
                  <p className="text-sm text-text-muted">Belum ada API Key yang tersimpan.</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {keys.map((k) => (
                    <div
                      key={k.id}
                      onClick={() => handleSelectKey(k)}
                      className={`flex items-center justify-between p-4 rounded-xl border cursor-pointer transition-all ${
                        activeKeyId === k.id
                          ? 'border-accent bg-accent/5'
                          : 'border-border bg-bg hover:border-accent/50'
                      }`}
                    >
                      <div className="flex items-center gap-3 overflow-hidden">
                        <div className={`shrink-0 ${activeKeyId === k.id ? 'text-accent' : 'text-text-muted'}`}>
                          {activeKeyId === k.id ? <CheckCircle className="w-5 h-5" /> : <Key className="w-5 h-5" />}
                        </div>
                        <div className="truncate">
                          <p className="font-medium text-sm text-text truncate">{k.name}</p>
                          <p className="text-xs text-text-muted font-mono truncate">
                            {k.key.substring(0, 8)}...{k.key.substring(k.key.length - 4)}
                          </p>
                        </div>
                      </div>
                      <button
                        onClick={(e) => handleDeleteKey(k.id, e)}
                        className="p-2 text-text-muted hover:text-red-400 hover:bg-red-400/10 rounded-lg transition-colors shrink-0 ml-2"
                        title="Hapus Kunci"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Add New Key Form */}
            {isAdding ? (
              <motion.form
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                onSubmit={handleSaveKey}
                className="space-y-4 p-4 border border-border rounded-xl bg-bg/50"
              >
                <div>
                  <label className="block text-xs font-medium text-text-muted mb-1">Nama Kunci (Opsional)</label>
                  <input
                    type="text"
                    value={newKeyName}
                    onChange={(e) => setNewKeyName(e.target.value)}
                    placeholder="Contoh: Kunci Proyek Utama"
                    className="w-full bg-surface border border-border rounded-lg px-3 py-2 text-sm text-text focus:outline-none focus:border-accent"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-text-muted mb-1">Gemini API Key</label>
                  <input
                    type="password"
                    value={newKeyValue}
                    onChange={(e) => setNewKeyValue(e.target.value)}
                    placeholder="AIzaSy..."
                    required
                    className="w-full bg-surface border border-border rounded-lg px-3 py-2 text-sm text-text focus:outline-none focus:border-accent font-mono"
                  />
                </div>
                <div className="flex gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setIsAdding(false)}
                    className="flex-1 px-4 py-2 text-sm font-medium text-text bg-surface border border-border rounded-lg hover:bg-border transition-colors"
                  >
                    Batal
                  </button>
                  <button
                    type="submit"
                    disabled={!newKeyValue.trim() || isLoading}
                    className="flex-1 px-4 py-2 text-sm font-medium text-white bg-accent rounded-lg hover:bg-accent-hover transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                  >
                    {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Simpan'}
                  </button>
                </div>
              </motion.form>
            ) : (
              <button
                onClick={() => setIsAdding(true)}
                className="w-full flex items-center justify-center gap-2 py-3 border border-dashed border-accent/50 text-accent rounded-xl hover:bg-accent/5 transition-colors text-sm font-medium"
              >
                <Plus className="w-4 h-4" />
                Tambah API Key Baru
              </button>
            )}
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
