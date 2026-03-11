import React, { useState } from 'react';
import { MessageSquare, PhoneCall, Image as ImageIcon, Video, Menu, X, Settings } from 'lucide-react';
import Chat from './components/Chat';
import VoiceCall from './components/VoiceCall';
import ImageGen from './components/ImageGen';
import VideoGen from './components/VideoGen';
import SettingsModal from './components/SettingsModal';
import AnimatedLogo from './components/AnimatedLogo';
import { motion, AnimatePresence } from 'motion/react';

type Tab = 'chat' | 'call' | 'image' | 'video';

export default function App() {
  const [activeTab, setActiveTab] = useState<Tab>('chat');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  const tabs = [
    { id: 'chat', label: 'Chat & Analisa', icon: MessageSquare },
    { id: 'call', label: 'Panggilan AI', icon: PhoneCall },
    { id: 'image', label: 'Buat Gambar', icon: ImageIcon },
    { id: 'video', label: 'Buat Video', icon: Video },
  ] as const;

  return (
    <div className="flex h-screen bg-bg text-text overflow-hidden font-sans">
      {/* Sidebar Desktop */}
      <aside className="hidden md:flex flex-col w-72 border-r border-border bg-surface/80 backdrop-blur-xl shadow-sm">
        <div className="p-8 flex items-center">
          <AnimatedLogo />
          <div>
            <h1 className="text-2xl font-serif font-bold text-accent tracking-wider">ZONA BANJAR</h1>
            <p className="text-xs text-text-muted mt-1 uppercase tracking-widest font-medium">AI Asisten</p>
          </div>
        </div>
        
        <nav className="flex-1 px-4 space-y-2">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`w-full flex items-center gap-4 px-4 py-4 rounded-2xl transition-all duration-300 ${
                  isActive 
                    ? 'bg-accent text-white shadow-[0_0_20px_rgba(26,188,156,0.3)]' 
                    : 'text-text-muted hover:bg-accent/10 hover:text-accent'
                }`}
              >
                <Icon className={`w-5 h-5 ${isActive ? 'text-white' : ''}`} />
                <span className="font-medium">{tab.label}</span>
              </button>
            );
          })}
        </nav>
        
        <div className="p-6 border-t border-border/50">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-accent/20 flex items-center justify-center border border-accent/30">
                <span className="text-accent font-serif font-bold">ZB</span>
              </div>
              <div>
                <p className="text-sm font-medium">Pengguna Premium</p>
                <p className="text-xs text-text-muted">Akses Penuh</p>
              </div>
            </div>
            <button 
              onClick={() => setIsSettingsOpen(true)}
              className="p-2 text-text-muted hover:text-accent hover:bg-accent/10 rounded-full transition-colors"
              title="Pengaturan API Key"
            >
              <Settings className="w-5 h-5" />
            </button>
          </div>
        </div>
      </aside>

      {/* Mobile Header */}
      <div className="md:hidden fixed top-0 left-0 right-0 h-16 bg-surface/90 backdrop-blur-xl border-b border-border z-50 flex items-center justify-between px-4 shadow-sm">
        <div className="flex items-center">
          <AnimatedLogo />
          <h1 className="text-xl font-serif font-bold text-accent">ZONA BANJAR</h1>
        </div>
        <div className="flex items-center gap-2">
          <button 
            onClick={() => setIsSettingsOpen(true)}
            className="p-2 text-text-muted hover:text-accent transition-colors"
          >
            <Settings className="w-5 h-5" />
          </button>
          <button onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)} className="p-2 text-text">
            {isMobileMenuOpen ? <X /> : <Menu />}
          </button>
        </div>
      </div>

      {/* Mobile Menu */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="md:hidden fixed top-16 left-0 right-0 bg-surface border-b border-border z-40 p-4 shadow-2xl"
          >
            <nav className="space-y-2">
              {tabs.map((tab) => {
                const Icon = tab.icon;
                const isActive = activeTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    onClick={() => {
                      setActiveTab(tab.id);
                      setIsMobileMenuOpen(false);
                    }}
                    className={`w-full flex items-center gap-4 px-4 py-4 rounded-xl transition-all ${
                      isActive 
                        ? 'bg-accent text-white' 
                        : 'text-text-muted hover:bg-accent/10 hover:text-accent'
                    }`}
                  >
                    <Icon className="w-5 h-5" />
                    <span className="font-medium">{tab.label}</span>
                  </button>
                );
              })}
            </nav>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main Content */}
      <main className="flex-1 relative pt-16 md:pt-0 h-full overflow-hidden bg-gradient-to-br from-bg to-surface/50">
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.98 }}
            transition={{ duration: 0.3 }}
            className="h-full w-full"
          >
            {activeTab === 'chat' && <Chat />}
            {activeTab === 'call' && <VoiceCall />}
            {activeTab === 'image' && <ImageGen />}
            {activeTab === 'video' && <VideoGen />}
          </motion.div>
        </AnimatePresence>
      </main>

      {/* Settings Modal */}
      {isSettingsOpen && (
        <SettingsModal isOpen={isSettingsOpen} onClose={() => setIsSettingsOpen(false)} />
      )}
    </div>
  );
}
