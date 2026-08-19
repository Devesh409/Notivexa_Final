import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  Play,
  Pause,
  RotateCcw,
  SkipForward,
  SkipBack,
  Volume2,
  VolumeX,
  Sparkles,
  Clock,
  Music,
  ListVideo,
  MonitorPlay,
  Volume,
  BookOpen,
  FileVideo,
  Compass,
  CornerDownRight
} from "lucide-react";

export interface VideoScene {
  sceneNumber: number;
  visualTitle: string;
  bullets: string[];
  narration: string;
  duration: number; // in seconds
  graphicsPrompt: string;
  highlightKeyTerms: string[];
}

export interface VideoData {
  title: string;
  durationEstimate: number;
  scenes: VideoScene[];
}

interface VideoExplainerProps {
  videoData: VideoData;
  onClose?: () => void;
}

export function VideoExplainer({ videoData, onClose }: VideoExplainerProps) {
  const { title, scenes } = videoData;
  
  // Player state
  const [currentSceneIndex, setCurrentSceneIndex] = useState(0);
  const [sceneProgress, setSceneProgress] = useState(0); // time in seconds for the current scene
  const [isPlaying, setIsPlaying] = useState(false);
  const [playbackSpeed, setPlaybackSpeed] = useState(1);
  const [isMuted, setIsMuted] = useState(false);
  
  // Voice synthesis settings
  const [isVoiceEnabled, setIsVoiceEnabled] = useState(true);
  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([]);
  const [selectedVoiceName, setSelectedVoiceName] = useState<string>("");
  
  // Background music setting
  const [isMusicEnabled, setIsMusicEnabled] = useState(false);
  
  // UI Panels
  const [showSidebar, setShowSidebar] = useState(true);
  
  // Refs
  const playbackIntervalRef = useRef<any>(null);
  const speechUtteranceRef = useRef<SpeechSynthesisUtterance | null>(null);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const musicNodesRef = useRef<{ osc1: OscillatorNode; osc2: OscillatorNode; gainNode: GainNode } | null>(null);

  const activeScene = scenes[currentSceneIndex] || scenes[0];

  // Load available speech synthesis voices
  useEffect(() => {
    const updateVoices = () => {
      if (typeof window !== "undefined" && window.speechSynthesis) {
        const availableVoices = window.speechSynthesis.getVoices();
        // Filter out for English or general high-quality voices
        const englishVoices = availableVoices.filter(v => v.lang.startsWith("en") || v.lang.startsWith("es") || v.lang.startsWith("fr") || v.default);
        setVoices(englishVoices.length > 0 ? englishVoices : availableVoices);
        
        // Pick a default voice, preferably an English Google voice or natural voice
        const defaultVoice = englishVoices.find(v => v.name.includes("Natural") || v.name.includes("Google") || v.lang === "en-US") || englishVoices[0];
        if (defaultVoice) {
          setSelectedVoiceName(defaultVoice.name);
        }
      }
    };

    updateVoices();
    if (typeof window !== "undefined" && window.speechSynthesis) {
      window.speechSynthesis.onvoiceschanged = updateVoices;
    }
  }, []);

  // Handle Speech synthesis of active narration
  const speakCurrentScene = () => {
    if (typeof window === "undefined" || !window.speechSynthesis) return;
    
    // Stop any ongoing speech
    window.speechSynthesis.cancel();
    
    if (!isVoiceEnabled || isMuted || !isPlaying) return;

    const utterance = new SpeechSynthesisUtterance(activeScene.narration);
    
    // Assign selected voice
    if (selectedVoiceName) {
      const voice = voices.find(v => v.name === selectedVoiceName);
      if (voice) utterance.voice = voice;
    }
    
    utterance.rate = playbackSpeed;
    utterance.volume = 0.9;
    
    // To prevent getting cut off, keep reference
    speechUtteranceRef.current = utterance;
    
    window.speechSynthesis.speak(utterance);
  };

  // Synchronize Speech with active scene changes and play/pause toggles
  useEffect(() => {
    if (isPlaying) {
      speakCurrentScene();
    } else {
      if (typeof window !== "undefined" && window.speechSynthesis) {
        window.speechSynthesis.cancel();
      }
    }
    return () => {
      if (typeof window !== "undefined" && window.speechSynthesis) {
        window.speechSynthesis.cancel();
      }
    };
  }, [currentSceneIndex, isPlaying, isVoiceEnabled, selectedVoiceName, isMuted, playbackSpeed]);

  // Main playback tick timer
  useEffect(() => {
    if (playbackIntervalRef.current) {
      clearInterval(playbackIntervalRef.current);
    }

    if (isPlaying) {
      const step = 0.1; // tick every 100ms
      playbackIntervalRef.current = setInterval(() => {
        setSceneProgress(prev => {
          const next = prev + step * playbackSpeed;
          if (next >= activeScene.duration) {
            // Scene completed! Advance to next scene if possible
            if (currentSceneIndex < scenes.length - 1) {
              setCurrentSceneIndex(curr => curr + 1);
              return 0;
            } else {
              // Video completed!
              setIsPlaying(false);
              return activeScene.duration;
            }
          }
          return next;
        });
      }, 100);
    }

    return () => {
      if (playbackIntervalRef.current) {
        clearInterval(playbackIntervalRef.current);
      }
    };
  }, [isPlaying, currentSceneIndex, activeScene.duration, playbackSpeed, scenes.length]);

  // Handle procedural backing study music (Web Audio API)
  useEffect(() => {
    if (isMusicEnabled && isPlaying && !isMuted) {
      try {
        if (!audioCtxRef.current) {
          audioCtxRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
        }
        
        const ctx = audioCtxRef.current;
        if (ctx.state === "suspended") {
          ctx.resume();
        }

        // Create synth notes (C and G gentle warm sine tones)
        const osc1 = ctx.createOscillator();
        const osc2 = ctx.createOscillator();
        const gainNode = ctx.createGain();

        osc1.type = "sine";
        osc2.type = "sine";
        
        // Frequencies for a soft educational ambient pad (C3 and E3 / G3 soft harmony)
        osc1.frequency.setValueAtTime(130.81, ctx.currentTime); // C3
        osc2.frequency.setValueAtTime(196.00, ctx.currentTime); // G3

        gainNode.gain.setValueAtTime(0.015, ctx.currentTime); // Very soft background level

        osc1.connect(gainNode);
        osc2.connect(gainNode);
        gainNode.connect(ctx.destination);

        osc1.start();
        osc2.start();

        musicNodesRef.current = { osc1, osc2, gainNode };
        
        // Soft modulation to simulate warm study chords
        let chordIndex = 0;
        const chords = [
          [130.81, 196.00], // C3, G3 (C Major feel)
          [146.83, 220.00], // D3, A3 (D Minor feel)
          [164.81, 246.94], // E3, B3 (E Minor feel)
          [174.61, 261.63], // F3, C4 (F Major feel)
        ];

        const musicInterval = setInterval(() => {
          if (ctx.state === "running" && musicNodesRef.current) {
            chordIndex = (chordIndex + 1) % chords.length;
            const currentChord = chords[chordIndex];
            musicNodesRef.current.osc1.frequency.setTargetAtTime(currentChord[0], ctx.currentTime, 1.5);
            musicNodesRef.current.osc2.frequency.setTargetAtTime(currentChord[1], ctx.currentTime, 1.5);
          }
        }, 6000);

        return () => {
          clearInterval(musicInterval);
          if (musicNodesRef.current) {
            try {
              musicNodesRef.current.osc1.stop();
              musicNodesRef.current.osc2.stop();
              musicNodesRef.current.osc1.disconnect();
              musicNodesRef.current.osc2.disconnect();
              musicNodesRef.current.gainNode.disconnect();
            } catch (e) {}
            musicNodesRef.current = null;
          }
        };
      } catch (err) {
        console.warn("Web Audio Context not supported or blocked", err);
      }
    } else {
      if (musicNodesRef.current) {
        try {
          musicNodesRef.current.osc1.stop();
          musicNodesRef.current.osc2.stop();
          musicNodesRef.current.osc1.disconnect();
          musicNodesRef.current.osc2.disconnect();
          musicNodesRef.current.gainNode.disconnect();
        } catch (e) {}
        musicNodesRef.current = null;
      }
    }
  }, [isMusicEnabled, isPlaying, isMuted]);

  // Clean up audio context on dismount
  useEffect(() => {
    return () => {
      if (audioCtxRef.current) {
        audioCtxRef.current.close().catch(() => {});
      }
    };
  }, []);

  // Helper values to display total timelines
  const getCumulativeDurationBeforeScene = (index: number) => {
    return scenes.slice(0, index).reduce((acc, s) => acc + s.duration, 0);
  };

  const totalVideoDuration = scenes.reduce((acc, s) => acc + s.duration, 0);
  const currentTotalTime = getCumulativeDurationBeforeScene(currentSceneIndex) + sceneProgress;

  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = Math.floor(secs % 60);
    return `${m}:${s < 10 ? "0" : ""}${s}`;
  };

  // Seek bar manual jumps
  const handleSeekBarClick = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const clickRatio = (e.clientX - rect.left) / rect.width;
    const targetSeconds = clickRatio * totalVideoDuration;
    
    // Find which scene corresponds to this second
    let accumulated = 0;
    for (let i = 0; i < scenes.length; i++) {
      const d = scenes[i].duration;
      if (accumulated + d >= targetSeconds) {
        setCurrentSceneIndex(i);
        setSceneProgress(targetSeconds - accumulated);
        break;
      }
      accumulated += d;
    }
  };

  // Jump forwards or backwards 10 seconds
  const handleJumpSeconds = (amount: number) => {
    const targetTotal = Math.max(0, Math.min(totalVideoDuration - 0.5, currentTotalTime + amount));
    
    let accumulated = 0;
    for (let i = 0; i < scenes.length; i++) {
      const d = scenes[i].duration;
      if (accumulated + d >= targetTotal) {
        setCurrentSceneIndex(i);
        setSceneProgress(targetTotal - accumulated);
        break;
      }
      accumulated += d;
    }
  };

  // Subtitles / Captions synchronization highlight helper
  const renderNarrationSubtitles = () => {
    const words = activeScene.narration.split(" ");
    const progressRatio = sceneProgress / activeScene.duration;
    const highlightCount = Math.floor(words.length * progressRatio);

    return (
      <p className="text-center text-sm md:text-base leading-relaxed font-medium transition-all text-white px-6">
        {(words || []).map((word, index) => {
          const isHighlighted = index <= highlightCount;
          
          // Check if word contains any of the key terms
          const cleanedWord = word.toLowerCase().replace(/[^a-zA-Z]/g, "");
          const isKeyTerm = activeScene.highlightKeyTerms.some(term => 
            term.toLowerCase().includes(cleanedWord) || cleanedWord.includes(term.toLowerCase())
          );

          return (
            <span
              key={index}
              className={`inline-block mr-1.5 transition-all duration-200 ${
                isHighlighted 
                  ? isKeyTerm 
                    ? "text-[#FCD34D] font-extrabold scale-105 drop-shadow-sm" 
                    : "text-white opacity-100" 
                  : "text-white opacity-40"
              }`}
            >
              {word}
            </span>
          );
        })}
      </p>
    );
  };

  return (
    <div className="space-y-6" id="video-lecture-theatre">
      {/* Upper bar */}
      <div className="flex items-center justify-between bg-white p-5 rounded-[24px] shadow-[0_4px_20px_rgba(90,90,64,0.05)] border border-[#E0E0D5]">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-[#5A5A40] text-white rounded-2xl">
            <MonitorPlay size={24} />
          </div>
          <div>
            <h3 className="font-serif text-2xl text-[#3A3A2F] flex items-center gap-2">
              AI Smart Lecture Video
              <span className="text-[10px] uppercase font-bold tracking-wider bg-[#5A5A40]/10 text-[#5A5A40] px-2 py-0.5 rounded-full">
                Interactive Mock Player
              </span>
            </h3>
            <p className="text-xs text-[#8A8A7A] mt-0.5">Learn using visual interactive whiteboard animations and synchronized audio</p>
          </div>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setShowSidebar(!showSidebar)}
            className="border border-[#D1D1C4] text-[#5A5A40] bg-[#FAF9F6] hover:bg-[#F0F0E8] py-2 px-4 rounded-full text-xs font-semibold flex items-center gap-2 transition-colors cursor-pointer"
          >
            <ListVideo size={14} /> {showSidebar ? "Hide Outline" : "Show Outline"}
          </button>
          {onClose && (
            <button
              onClick={onClose}
              className="border border-[#E0E0D5] hover:bg-red-50 text-red-600 font-semibold py-2 px-4 rounded-full text-xs transition-colors cursor-pointer"
            >
              Back to Overview
            </button>
          )}
        </div>
      </div>

      {/* Main Theatre Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
        
        {/* Left Side: Video Player Stage */}
        <div className={`${showSidebar ? "lg:col-span-8" : "lg:col-span-12"} flex flex-col space-y-4`}>
          
          {/* Main Video Viewport Wrapper */}
          <div className="relative aspect-video w-full bg-[#1A1A14] rounded-[24px] border border-[#2D2D24] shadow-2xl overflow-hidden flex flex-col justify-between">
            
            {/* Whiteboard grid backdrop effect */}
            <div className="absolute inset-0 bg-[#FAF9F6] opacity-[0.96] z-0 pointer-events-none bg-[radial-gradient(#e5e7eb_1.5px,transparent_1.5px)] [background-size:20px_20px]"></div>

            {/* Video Watermark or Overhead Info */}
            <div className="relative z-10 p-4 flex justify-between items-start select-none bg-gradient-to-b from-black/5 via-transparent to-transparent">
              <div className="flex items-center gap-2 bg-[#1A1A14]/80 backdrop-blur-md text-white border border-[#2D2D24] rounded-xl px-3 py-1.5 text-[11px] font-semibold">
                <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse"></span>
                <span>SCENE {currentSceneIndex + 1} / {scenes.length}</span>
              </div>
              <div className="flex items-center gap-2 bg-white border border-[#E0E0D5] rounded-xl px-3 py-1.5 text-[10px] font-bold text-[#5A5A40] shadow-sm uppercase tracking-wider">
                <Compass size={12} /> {activeScene.visualTitle}
              </div>
            </div>

            {/* Interactive Visual Whiteboard Content (Center) */}
            <div className="relative z-10 flex-1 px-8 md:px-12 py-4 flex flex-col justify-center items-center">
              <AnimatePresence mode="wait">
                <motion.div
                  key={currentSceneIndex}
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -15 }}
                  transition={{ duration: 0.4 }}
                  className="w-full max-w-2xl flex flex-col space-y-4 text-left"
                >
                  
                  {/* Scene Title and Key Terms */}
                  <div className="space-y-2 border-b-2 border-[#5A5A40]/10 pb-3">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <h4 className="text-xl md:text-2xl font-serif font-bold text-[#3A3A2F] leading-tight">
                        {activeScene.visualTitle}
                      </h4>
                      {activeScene.highlightKeyTerms && activeScene.highlightKeyTerms.length > 0 && (
                        <div className="flex flex-wrap gap-1.5 shrink-0">
                          {(activeScene?.highlightKeyTerms || []).map((term, t) => (
                            <span key={t} className="text-[10px] bg-[#5A5A40]/10 text-[#5A5A40] font-bold px-2.5 py-0.5 rounded-full border border-[#5A5A40]/20">
                              {term}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Bullet points list */}
                  <ul className="space-y-3">
                    {(activeScene?.bullets || []).map((bullet, i) => {
                      // Mathematically staggered bullet points fading in as activeScene narration runs
                      const segmentDuration = activeScene.duration / (activeScene.bullets.length + 1);
                      const isVisible = sceneProgress >= (i + 1) * segmentDuration;

                      return (
                        <motion.li
                          key={i}
                          animate={isVisible ? { opacity: 1, x: 0 } : { opacity: 0.25, x: -5 }}
                          transition={{ duration: 0.3 }}
                          className={`text-xs md:text-sm font-medium leading-relaxed flex items-start gap-2.5 ${
                            isVisible ? "text-[#3A3A2F] font-semibold" : "text-[#8A8A7A]"
                          }`}
                        >
                          <span className="mt-1 text-[#5A5A40] shrink-0 font-bold">
                            <CornerDownRight size={15} />
                          </span>
                          <span>{bullet}</span>
                        </motion.li>
                      );
                    })}
                  </ul>

                </motion.div>
              </AnimatePresence>
            </div>

            {/* Captions / Subtitles Overlay Container */}
            <div className="relative z-10 w-full bg-black/90 backdrop-blur-md py-4 px-6 border-t border-[#2D2D24] min-h-[80px] flex items-center justify-center">
              {renderNarrationSubtitles()}
            </div>

            {/* Audio Wave Visualizer Overlay (bottom right corner) */}
            {isPlaying && !isMuted && (
              <div className="absolute bottom-20 right-4 z-20 flex gap-0.5 items-end h-8 bg-black/50 p-2 rounded-lg backdrop-blur-sm border border-white/10 select-none">
                <span className="w-1 bg-[#FCD34D] h-3 animate-[pulse_0.7s_infinite] rounded-full"></span>
                <span className="w-1 bg-[#FCD34D] h-5 animate-[pulse_0.5s_infinite] rounded-full" style={{ animationDelay: "0.15s" }}></span>
                <span className="w-1 bg-[#FCD34D] h-6 animate-[pulse_0.8s_infinite] rounded-full" style={{ animationDelay: "0.3s" }}></span>
                <span className="w-1 bg-[#FCD34D] h-4 animate-[pulse_0.6s_infinite] rounded-full" style={{ animationDelay: "0.1s" }}></span>
                <span className="w-1 bg-[#FCD34D] h-2 animate-[pulse_0.9s_infinite] rounded-full"></span>
              </div>
            )}

          </div>

          {/* Player Media Controls Bar */}
          <div className="bg-[#1A1A14] text-white p-4 rounded-2xl border border-[#2D2D24] shadow-md space-y-3">
            
            {/* Timeline slider row */}
            <div className="flex items-center gap-3">
              <span className="text-xs font-mono select-none text-white/70">{formatTime(currentTotalTime)}</span>
              
              <div 
                onClick={handleSeekBarClick}
                className="flex-1 bg-white/10 hover:bg-white/15 h-2 rounded-full cursor-pointer relative overflow-hidden transition-all group"
              >
                {/* Segment boundaries markers */}
                {(scenes || []).map((scene, idx) => {
                  if (idx === 0) return null;
                  const leftPercentage = (getCumulativeDurationBeforeScene(idx) / totalVideoDuration) * 100;
                  return (
                    <div 
                      key={idx}
                      className="absolute top-0 bottom-0 w-0.5 bg-black/60 z-20"
                      style={{ left: `${leftPercentage}%` }}
                    />
                  );
                })}

                {/* Progress Fill */}
                <div 
                  className="bg-[#5A5A40] h-full absolute top-0 left-0 transition-all rounded-full group-hover:bg-[#FCD34D]"
                  style={{ width: `${(currentTotalTime / totalVideoDuration) * 100}%` }}
                />
              </div>

              <span className="text-xs font-mono select-none text-white/70">{formatTime(totalVideoDuration)}</span>
            </div>

            {/* Controls Row */}
            <div className="flex flex-wrap items-center justify-between gap-4">
              
              {/* Playback Controls */}
              <div className="flex items-center gap-3">
                <button
                  onClick={() => handleJumpSeconds(-10)}
                  className="p-1.5 hover:bg-white/10 rounded-full transition-colors text-white/80 hover:text-white"
                  title="Back 10s"
                >
                  <SkipBack size={18} />
                </button>
                
                <button
                  onClick={() => setIsPlaying(!isPlaying)}
                  className="p-3 bg-[#5A5A40] hover:bg-opacity-90 rounded-full text-white transition-all transform hover:scale-105 active:scale-95 shadow-md flex items-center justify-center"
                  title={isPlaying ? "Pause" : "Play"}
                >
                  {isPlaying ? <Pause size={20} fill="currentColor" /> : <Play size={20} fill="currentColor" className="ml-0.5" />}
                </button>

                <button
                  onClick={() => handleJumpSeconds(10)}
                  className="p-1.5 hover:bg-white/10 rounded-full transition-colors text-white/80 hover:text-white"
                  title="Forward 10s"
                >
                  <SkipForward size={18} />
                </button>

                <button
                  onClick={() => {
                    setCurrentSceneIndex(0);
                    setSceneProgress(0);
                    setIsPlaying(false);
                    if (typeof window !== "undefined" && window.speechSynthesis) {
                      window.speechSynthesis.cancel();
                    }
                  }}
                  className="p-1.5 hover:bg-white/10 rounded-full transition-colors text-white/60 hover:text-white"
                  title="Reset Lecture"
                >
                  <RotateCcw size={16} />
                </button>
              </div>

              {/* Narrator Voice Settings */}
              <div className="flex items-center gap-3 bg-white/5 border border-white/10 px-3 py-1.5 rounded-xl">
                <button
                  onClick={() => setIsVoiceEnabled(!isVoiceEnabled)}
                  className={`flex items-center gap-1 text-xs font-semibold px-2 py-1 rounded-lg transition-colors cursor-pointer ${
                    isVoiceEnabled ? "bg-[#5A5A40] text-white" : "bg-white/5 text-white/50 hover:bg-white/10"
                  }`}
                  title="Toggle Spoken Narrator Voice"
                >
                  <Volume2 size={13} />
                  <span>TTS Voice: {isVoiceEnabled ? "ON" : "OFF"}</span>
                </button>

                {isVoiceEnabled && voices.length > 0 && (
                  <select
                    value={selectedVoiceName}
                    onChange={(e) => setSelectedVoiceName(e.target.value)}
                    className="bg-black text-white text-[10px] py-1 px-2 rounded border border-white/20 font-sans outline-none max-w-[130px]"
                    title="Select Narrator Voice Accent"
                  >
                    {(voices || []).map((voice, idx) => (
                      <option key={idx} value={voice.name}>
                        {voice.name.replace("Microsoft", "").replace("Google", "").trim()}
                      </option>
                    ))}
                  </select>
                )}

                <div className="flex items-center gap-1">
                  <span className="text-[10px] text-white/50 select-none">Speed</span>
                  <select
                    value={playbackSpeed}
                    onChange={(e) => setPlaybackSpeed(parseFloat(e.target.value))}
                    className="bg-black text-white text-[10px] py-1 px-1.5 rounded border border-white/20 outline-none font-sans"
                  >
                    <option value="0.5">0.5x</option>
                    <option value="0.75">0.75x</option>
                    <option value="1">1.0x</option>
                    <option value="1.25">1.25x</option>
                    <option value="1.5">1.5x</option>
                    <option value="2">2.0x</option>
                  </select>
                </div>
              </div>

              {/* Background Music and Audio options */}
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setIsMusicEnabled(!isMusicEnabled)}
                  className={`p-2 rounded-xl transition-all cursor-pointer flex items-center gap-1.5 text-xs font-medium border ${
                    isMusicEnabled 
                      ? "bg-[#5A5A40] border-[#5A5A40] text-white" 
                      : "bg-white/5 border-white/10 text-white/70 hover:bg-white/10"
                  }`}
                  title="Toggle Soft Procedural Ambient Backing Beats"
                >
                  <Music size={14} className={isMusicEnabled && isPlaying ? "animate-spin" : ""} style={{ animationDuration: "8s" }} />
                  <span>Ambient Beats: {isMusicEnabled ? "ON" : "OFF"}</span>
                </button>

                <button
                  onClick={() => setIsMuted(!isMuted)}
                  className="p-2 hover:bg-white/10 rounded-xl transition-colors text-white/80 hover:text-white cursor-pointer"
                  title={isMuted ? "Unmute All Audio" : "Mute All Audio"}
                >
                  {isMuted ? <VolumeX size={18} /> : <Volume2 size={18} />}
                </button>
              </div>

            </div>

          </div>

        </div>

        {/* Right Side: Navigation Side-outline panel */}
        {showSidebar && (
          <div className="lg:col-span-4 flex flex-col space-y-4">
            <div className="bg-white border border-[#E0E0D5] rounded-[24px] shadow-[0_4px_20px_rgba(90,90,64,0.05)] overflow-hidden flex-1 flex flex-col min-h-[400px]">
              <div className="p-5 border-b border-[#E0E0D5] bg-[#FAF9F6]">
                <h4 className="font-serif text-lg font-bold text-[#3A3A2F]">Lecture Scene Outline</h4>
                <p className="text-xs text-[#8A8A7A] mt-1">Review topics and skip directly to any lecture slide</p>
              </div>

              <div className="p-3 overflow-y-auto space-y-2 max-h-[460px] flex-1">
                {(scenes || []).map((scene, index) => {
                  const isActive = index === currentSceneIndex;
                  return (
                    <div
                      key={scene.sceneNumber}
                      onClick={() => {
                        setCurrentSceneIndex(index);
                        setSceneProgress(0);
                      }}
                      className={`p-3.5 rounded-xl border transition-all cursor-pointer text-left flex items-start gap-3 ${
                        isActive
                          ? "bg-[#5A5A40] border-[#5A5A40] text-white shadow-sm"
                          : "bg-[#FAF9F6] border-[#E0E0D5] text-[#3A3A2F] hover:bg-[#F0F0E8] hover:border-[#8A8A7A]"
                      }`}
                    >
                      <span className={`text-[11px] font-bold py-0.5 px-2 rounded-full shrink-0 ${
                        isActive ? "bg-white text-[#5A5A40]" : "bg-[#F0F0E8] text-[#5A5A40]"
                      }`}>
                        {scene.sceneNumber}
                      </span>
                      <div className="space-y-1 overflow-hidden">
                        <p className={`text-xs font-bold truncate ${isActive ? "text-white" : "text-[#3A3A2F]"}`}>
                          {scene.visualTitle}
                        </p>
                        <p className={`text-[10px] line-clamp-2 leading-relaxed ${isActive ? "text-white/80" : "text-[#8A8A7A]"}`}>
                          {scene.narration}
                        </p>
                        <div className="flex items-center gap-1.5 pt-1">
                          <Clock size={10} className={isActive ? "text-white" : "text-[#8A8A7A]"} />
                          <span className={`text-[9px] font-semibold ${isActive ? "text-white/80" : "text-[#8A8A7A]"}`}>
                            Duration: {scene.duration}s ({formatTime(getCumulativeDurationBeforeScene(index))} mark)
                          </span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
