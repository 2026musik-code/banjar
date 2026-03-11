import React, { useState, useRef, useEffect } from 'react';
import { Mic, MicOff, PhoneOff, PhoneCall, Loader2, Volume2 } from 'lucide-react';
import { getGeminiClient } from '../lib/gemini';
import { Modality } from '@google/genai';
import { motion } from 'motion/react';

export default function VoiceCall() {
  const [isCalling, setIsCalling] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [volume, setVolume] = useState(0);
  
  const sessionRef = useRef<any>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const sourceNodeRef = useRef<MediaStreamAudioSourceNode | null>(null);
  const processorNodeRef = useRef<ScriptProcessorNode | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  
  // Audio playback
  const audioQueueRef = useRef<Float32Array[]>([]);
  const isPlayingRef = useRef(false);
  const nextPlayTimeRef = useRef(0);

  const cleanupAudio = () => {
    if (processorNodeRef.current) {
      processorNodeRef.current.disconnect();
      processorNodeRef.current = null;
    }
    if (sourceNodeRef.current) {
      sourceNodeRef.current.disconnect();
      sourceNodeRef.current = null;
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    if (audioContextRef.current) {
      audioContextRef.current.close();
      audioContextRef.current = null;
    }
    audioQueueRef.current = [];
    isPlayingRef.current = false;
  };

  const startCall = async () => {
    try {
      setIsConnecting(true);
      
      // Request microphone access
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;
      
      const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 16000 });
      audioContextRef.current = audioCtx;
      
      const source = audioCtx.createMediaStreamSource(stream);
      sourceNodeRef.current = source;
      
      // Use ScriptProcessor for raw PCM access (deprecated but reliable for raw PCM in many browsers)
      const processor = audioCtx.createScriptProcessor(4096, 1, 1);
      processorNodeRef.current = processor;
      
      source.connect(processor);
      processor.connect(audioCtx.destination);
      
      const ai = getGeminiClient();
      
      const sessionPromise = ai.live.connect({
        model: "gemini-2.5-flash-native-audio-preview-09-2025",
        config: {
          responseModalities: [Modality.AUDIO],
          speechConfig: {
            voiceConfig: { prebuiltVoiceConfig: { voiceName: "Zephyr" } },
          },
          systemInstruction: "Anda adalah asisten suara mewah untuk ZONA BANJAR. Berbicaralah dengan nada yang elegan, ramah, dan profesional dalam bahasa Indonesia.",
        },
        callbacks: {
          onopen: () => {
            setIsConnecting(false);
            setIsCalling(true);
            
            processor.onaudioprocess = (e) => {
              if (isMuted) return;
              
              const inputData = e.inputBuffer.getChannelData(0);
              
              // Calculate volume for visualizer
              let sum = 0;
              for (let i = 0; i < inputData.length; i++) {
                sum += inputData[i] * inputData[i];
              }
              const rms = Math.sqrt(sum / inputData.length);
              setVolume(Math.min(100, rms * 1000));
              
              // Convert Float32 to Int16 PCM
              const pcm16 = new Int16Array(inputData.length);
              for (let i = 0; i < inputData.length; i++) {
                const s = Math.max(-1, Math.min(1, inputData[i]));
                pcm16[i] = s < 0 ? s * 0x8000 : s * 0x7FFF;
              }
              
              // Convert to base64
              const buffer = new Uint8Array(pcm16.buffer);
              let binary = '';
              for (let i = 0; i < buffer.byteLength; i++) {
                binary += String.fromCharCode(buffer[i]);
              }
              const base64Data = btoa(binary);
              
              sessionPromise.then((session) => {
                session.sendRealtimeInput({
                  media: { data: base64Data, mimeType: 'audio/pcm;rate=16000' }
                });
              });
            };
          },
          onmessage: (message) => {
            const base64Audio = message.serverContent?.modelTurn?.parts[0]?.inlineData?.data;
            if (base64Audio) {
              playAudio(base64Audio);
            }
            if (message.serverContent?.interrupted) {
              audioQueueRef.current = [];
            }
          },
          onclose: () => {
            endCall();
          },
          onerror: (err) => {
            console.error("Live API Error:", err);
            endCall();
          }
        }
      });
      
      sessionRef.current = sessionPromise;
      
    } catch (err) {
      console.error("Failed to start call:", err);
      setIsConnecting(false);
      cleanupAudio();
    }
  };

  const playAudio = (base64Data: string) => {
    if (!audioContextRef.current) return;
    
    // Decode base64 to Int16Array
    const binary = atob(base64Data);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) {
      bytes[i] = binary.charCodeAt(i);
    }
    const pcm16 = new Int16Array(bytes.buffer);
    
    // Convert to Float32Array
    const float32 = new Float32Array(pcm16.length);
    for (let i = 0; i < pcm16.length; i++) {
      float32[i] = pcm16[i] / (pcm16[i] < 0 ? 0x8000 : 0x7FFF);
    }
    
    audioQueueRef.current.push(float32);
    
    if (!isPlayingRef.current) {
      scheduleNextAudio();
    }
  };

  const scheduleNextAudio = () => {
    if (audioQueueRef.current.length === 0 || !audioContextRef.current) {
      isPlayingRef.current = false;
      return;
    }
    
    isPlayingRef.current = true;
    const audioData = audioQueueRef.current.shift()!;
    
    const audioBuffer = audioContextRef.current.createBuffer(1, audioData.length, 24000); // Gemini returns 24kHz
    audioBuffer.getChannelData(0).set(audioData);
    
    const source = audioContextRef.current.createBufferSource();
    source.buffer = audioBuffer;
    source.connect(audioContextRef.current.destination);
    
    const currentTime = audioContextRef.current.currentTime;
    const startTime = Math.max(currentTime, nextPlayTimeRef.current);
    
    source.start(startTime);
    nextPlayTimeRef.current = startTime + audioBuffer.duration;
    
    source.onended = () => {
      scheduleNextAudio();
    };
  };

  const endCall = () => {
    if (sessionRef.current) {
      sessionRef.current.then((session: any) => {
        try { session.close(); } catch (e) {}
      });
      sessionRef.current = null;
    }
    cleanupAudio();
    setIsCalling(false);
    setIsConnecting(false);
    setVolume(0);
  };

  useEffect(() => {
    return () => {
      endCall();
    };
  }, []);

  return (
    <div className="flex flex-col items-center justify-center h-full max-w-md mx-auto w-full p-6">
      <div className="text-center mb-12">
        <h2 className="text-3xl font-serif text-accent mb-2">Panggilan AI</h2>
        <p className="text-text-muted">Berbicara langsung dengan asisten ZONA BANJAR</p>
      </div>

      <div className="relative w-48 h-48 mb-16 flex items-center justify-center">
        {/* Visualizer rings */}
        {isCalling && (
          <>
            <motion.div 
              animate={{ scale: 1 + (volume / 100) * 0.5, opacity: 0.5 - (volume / 100) * 0.3 }}
              className="absolute inset-0 rounded-full bg-accent/30"
            />
            <motion.div 
              animate={{ scale: 1 + (volume / 100) * 0.8, opacity: 0.3 - (volume / 100) * 0.2 }}
              className="absolute inset-0 rounded-full bg-accent/20"
            />
          </>
        )}
        
        <div className={`w-32 h-32 rounded-full flex items-center justify-center z-10 ${isCalling ? 'bg-surface border-2 border-accent shadow-[0_0_30px_rgba(212,175,55,0.3)]' : 'bg-surface border border-border'}`}>
          {isConnecting ? (
            <Loader2 className="w-12 h-12 text-accent animate-spin" />
          ) : isCalling ? (
            <Volume2 className="w-12 h-12 text-accent" />
          ) : (
            <PhoneCall className="w-12 h-12 text-text-muted" />
          )}
        </div>
      </div>

      <div className="flex items-center gap-6">
        {isCalling ? (
          <>
            <button
              onClick={() => setIsMuted(!isMuted)}
              className={`p-5 rounded-full transition-colors ${isMuted ? 'bg-red-500/20 text-red-500 border border-red-500/50' : 'bg-surface text-text hover:bg-border border border-border'}`}
            >
              {isMuted ? <MicOff className="w-6 h-6" /> : <Mic className="w-6 h-6" />}
            </button>
            <button
              onClick={endCall}
              className="p-5 rounded-full bg-red-600 text-white hover:bg-red-700 transition-colors shadow-lg"
            >
              <PhoneOff className="w-8 h-8" />
            </button>
          </>
        ) : (
          <button
            onClick={startCall}
            disabled={isConnecting}
            className="px-8 py-4 rounded-full bg-accent text-white font-semibold hover:bg-accent-hover transition-colors flex items-center gap-3 shadow-[0_0_20px_rgba(26,188,156,0.3)] disabled:opacity-50"
          >
            {isConnecting ? (
              <Loader2 className="w-6 h-6 animate-spin" />
            ) : (
              <PhoneCall className="w-6 h-6" />
            )}
            <span>Mulai Panggilan</span>
          </button>
        )}
      </div>
    </div>
  );
}
