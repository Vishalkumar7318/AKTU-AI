import React, { useRef, useState, useEffect } from 'react';
import { Mic, MicOff, Volume2, Activity } from 'lucide-react';
import { GoogleGenAI, LiveServerMessage, Modality } from "@google/genai";

const LiveTutor: React.FC = () => {
  const [isConnected, setIsConnected] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [volume, setVolume] = useState(0);
  
  // Refs to hold audio context and session state
  const audioContextRef = useRef<AudioContext | null>(null);
  const inputContextRef = useRef<AudioContext | null>(null);
  const nextStartTimeRef = useRef<number>(0);
  const sessionRef = useRef<any>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const processorRef = useRef<ScriptProcessorNode | null>(null);

  // Clean up on unmount
  useEffect(() => {
    return () => {
      disconnect();
    };
  }, []);

  // Simple visualizer loop
  useEffect(() => {
    if (!isConnected) return;
    const interval = setInterval(() => {
      // Simulate volume changes for visualization since we don't have an analyzer node setup here for simplicity
      // In a real app, use AnalyserNode
      setVolume(Math.random() * 100);
    }, 100);
    return () => clearInterval(interval);
  }, [isConnected]);

  const connect = async () => {
    try {
      const apiKey = process.env.API_KEY;
      if (!apiKey) throw new Error("API Key missing");

      const ai = new GoogleGenAI({ apiKey });
      
      // Initialize Audio Contexts
      audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
      inputContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 16000 });
      
      nextStartTimeRef.current = audioContextRef.current.currentTime;

      // Get Microphone Stream
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;

      const inputCtx = inputContextRef.current;
      const source = inputCtx.createMediaStreamSource(stream);
      const processor = inputCtx.createScriptProcessor(4096, 1, 1);
      processorRef.current = processor;

      // Connect to Gemini Live
      const sessionPromise = ai.live.connect({
        model: 'gemini-2.5-flash-native-audio-preview-09-2025',
        config: {
          responseModalities: [Modality.AUDIO],
          speechConfig: {
            voiceConfig: { prebuiltVoiceConfig: { voiceName: 'Zephyr' } },
          },
          systemInstruction: 'You are a friendly and encouraging oral exam tutor. Ask the student questions about their topic and provide feedback on their answers.',
        },
        callbacks: {
          onopen: () => {
            console.log("Live Session Open");
            setIsConnected(true);
            
            // Start processing audio input
            processor.onaudioprocess = (e) => {
               if (isMuted) return; // Don't send if muted
               
               const inputData = e.inputBuffer.getChannelData(0);
               // Convert Float32 to PCM Int16
               const pcmData = new Int16Array(inputData.length);
               for (let i = 0; i < inputData.length; i++) {
                 pcmData[i] = inputData[i] * 32768;
               }
               
               // Base64 encode
               const base64Audio = btoa(String.fromCharCode(...new Uint8Array(pcmData.buffer)));
               
               sessionPromise.then(session => {
                 session.sendRealtimeInput({
                   media: {
                     mimeType: 'audio/pcm;rate=16000',
                     data: base64Audio
                   }
                 });
               });
            };
            
            source.connect(processor);
            processor.connect(inputCtx.destination);
          },
          onmessage: async (msg: LiveServerMessage) => {
            // Handle audio output
            const audioData = msg.serverContent?.modelTurn?.parts?.[0]?.inlineData?.data;
            if (audioData) {
               playAudioChunk(audioData);
            }
          },
          onclose: () => {
            console.log("Live Session Closed");
            setIsConnected(false);
          },
          onerror: (err) => {
            console.error("Live Session Error", err);
            setIsConnected(false);
          }
        }
      });
      
      sessionRef.current = sessionPromise;

    } catch (err) {
      console.error("Failed to connect", err);
      alert("Failed to access microphone or connect to API.");
    }
  };

  const disconnect = async () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
    }
    if (processorRef.current) {
      processorRef.current.disconnect();
    }
    if (audioContextRef.current) {
      await audioContextRef.current.close();
    }
    if (inputContextRef.current) {
      await inputContextRef.current.close();
    }
    // There isn't an explicit close method on the promise itself in the types provided,
    // usually connection closure is handled by closing the WS or leaving context.
    // Ideally use session.close() if available on the resolved object.
    setIsConnected(false);
    setVolume(0);
  };

  const playAudioChunk = (base64Audio: string) => {
     if (!audioContextRef.current) return;
     const ctx = audioContextRef.current;
     
     // Decode Base64
     const binaryString = atob(base64Audio);
     const len = binaryString.length;
     const bytes = new Uint8Array(len);
     for (let i = 0; i < len; i++) {
       bytes[i] = binaryString.charCodeAt(i);
     }
     
     // Create buffer (assuming 24kHz 1 channel from model)
     const dataInt16 = new Int16Array(bytes.buffer);
     const float32 = new Float32Array(dataInt16.length);
     for(let i=0; i<dataInt16.length; i++) {
       float32[i] = dataInt16[i] / 32768;
     }
     
     const buffer = ctx.createBuffer(1, float32.length, 24000);
     buffer.copyToChannel(float32, 0);
     
     const source = ctx.createBufferSource();
     source.buffer = buffer;
     source.connect(ctx.destination);
     
     // Schedule
     const now = ctx.currentTime;
     // Ensure we don't schedule in the past
     nextStartTimeRef.current = Math.max(nextStartTimeRef.current, now);
     
     source.start(nextStartTimeRef.current);
     nextStartTimeRef.current += buffer.duration;
  };

  return (
    <div className="max-w-2xl mx-auto flex flex-col items-center justify-center h-[500px] animate-fade-in-up">
      <div className={`relative w-64 h-64 rounded-full flex items-center justify-center transition-all duration-500 ${
        isConnected ? 'bg-indigo-50 border-4 border-indigo-200 shadow-2xl shadow-indigo-200' : 'bg-slate-100 border-4 border-slate-200'
      }`}>
        {/* Pulse Effect */}
        {isConnected && (
           <div 
             className="absolute inset-0 rounded-full bg-indigo-200 opacity-20 animate-ping" 
             style={{ animationDuration: '2s' }}
           />
        )}
        
        {/* Icon */}
        <div className={`z-10 w-32 h-32 rounded-full flex items-center justify-center transition-colors duration-300 ${
          isConnected ? 'bg-indigo-600 text-white' : 'bg-slate-300 text-slate-500'
        }`}>
          {isConnected ? <Activity className="w-16 h-16 animate-pulse" /> : <MicOff className="w-16 h-16" />}
        </div>
      </div>

      <div className="mt-12 flex flex-col items-center gap-4">
        <h2 className="text-2xl font-bold text-slate-800">
          {isConnected ? "Live Session Active" : "Start Oral Exam"}
        </h2>
        <p className="text-slate-500 text-center max-w-md">
          {isConnected 
            ? "Gemini is listening. Speak clearly to practice your topic." 
            : "Connect to start a real-time voice conversation with your AI Tutor using Gemini Live API."}
        </p>
      </div>

      <div className="mt-8 flex gap-6">
        {!isConnected ? (
          <button 
            onClick={connect}
            className="px-8 py-4 bg-indigo-600 hover:bg-indigo-700 text-white rounded-full font-bold text-lg shadow-lg hover:shadow-xl transition-all flex items-center gap-3"
          >
            <Mic className="w-5 h-5" /> Start Session
          </button>
        ) : (
          <button 
            onClick={disconnect}
            className="px-8 py-4 bg-red-500 hover:bg-red-600 text-white rounded-full font-bold text-lg shadow-lg hover:shadow-xl transition-all"
          >
            End Session
          </button>
        )}
      </div>
    </div>
  );
};

export default LiveTutor;
