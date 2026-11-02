import React, { useState, useEffect, useRef, useMemo } from "react";
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
  BookOpen,
  FileVideo,
  Download,
  CheckCircle2,
  HelpCircle,
  FileText,
  Maximize2,
  Minimize2,
  Wand2,
  Lightbulb,
  Workflow,
  Loader2,
  Palette,
  ArrowDown,
  Radio,
  Layers,
  ChevronRight,
  ChevronLeft,
} from "lucide-react";

export interface VideoCheckpointQuestion {
  question: string;
  options: string[];
  answerIndex: number;
  explanation: string;
}

export interface VideoScene {
  sceneNumber: number;
  sceneCategory?: string;
  visualTitle: string;
  shortNotes?: string;
  bullets: string[];
  detailedExplanation?: string;
  narration: string;
  duration: number; // in seconds
  graphicsPrompt: string;
  highlightKeyTerms: string[];
  diagramSteps?: string[];
  diagramExplanation?: string;
  formulaOrKeyRule?: string;
  realWorldAnalogy?: string;
  checkpointQuestion?: VideoCheckpointQuestion;
}

export interface VideoData {
  title: string;
  durationEstimate: number;
  scenes: VideoScene[];
}

interface VideoExplainerProps {
  videoData: VideoData;
  onClose?: () => void;
  onRegenerateTopic?: (customTopic: string) => void;
  isRegenerating?: boolean;
}

type BoardTheme = "whiteboard" | "chalkboard" | "dark-studio" | "notebook";
type SideTab = "outline" | "quiz" | "transcript";

interface TrackedSentenceUnit {
  id: string;
  sectionType: "short-note" | "keypoint" | "deep-explanation" | "rule-analogy" | "diagram-step" | "diagram-summary";
  sectionLabel: string;
  text: string;
  itemIndex?: number;
  wordCount: number;
  startWordOffset: number;
  endWordOffset: number;
  startTimeRatio: number;
  endTimeRatio: number;
}

export function VideoExplainer({
  videoData,
  onClose,
  onRegenerateTopic,
  isRegenerating = false,
}: VideoExplainerProps) {
  const { title, scenes = [] } = videoData;
  const totalScenes = Math.max(1, scenes.length);

  // Player state
  const [currentSceneIndex, setCurrentSceneIndex] = useState(0);
  const [sceneProgress, setSceneProgress] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [playbackSpeed, setPlaybackSpeed] = useState(1);
  const [isMuted, setIsMuted] = useState(false);
  const [boardTheme, setBoardTheme] = useState<BoardTheme>("whiteboard");
  const [activeSideTab, setActiveSideTab] = useState<SideTab>("outline");
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [customTopicInput, setCustomTopicInput] = useState("");

  // Live speech boundary word tracking (for 1:1 same-to-same voice & sentence tracker)
  const [spokenGlobalWordIndex, setSpokenGlobalWordIndex] = useState<number | null>(null);

  // Interactive Quiz state per scene index
  const [selectedAnswers, setSelectedAnswers] = useState<Record<number, number>>({});

  // Video WebM Export state
  const [isRenderingWebm, setIsRenderingWebm] = useState(false);
  const [renderWebmProgress, setRenderWebmProgress] = useState(0);

  // Voice synthesis settings
  const [isVoiceEnabled, setIsVoiceEnabled] = useState(true);
  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([]);
  const [selectedVoiceName, setSelectedVoiceName] = useState<string>("");

  // Background music setting
  const [isMusicEnabled, setIsMusicEnabled] = useState(false);

  // UI Panels
  const [showSidebar, setShowSidebar] = useState(true);

  // Refs
  const containerRef = useRef<HTMLDivElement | null>(null);
  const playbackIntervalRef = useRef<any>(null);
  const speechUtteranceRef = useRef<SpeechSynthesisUtterance | null>(null);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const musicNodesRef = useRef<{
    osc1: OscillatorNode;
    osc2: OscillatorNode;
    gainNode: GainNode;
  } | null>(null);

  // Always clamp scene index so SCENE 9 / 8 can never occur
  const safeSceneIndex = Math.min(
    Math.max(0, currentSceneIndex),
    Math.max(0, scenes.length - 1)
  );

  // Enrich activeScene so even older cached videos have full Short Notes, 5+ Keypoints, Deep Explanation, and Full Diagram Steps
  const activeScene: VideoScene = useMemo(() => {
    const raw = scenes[safeSceneIndex] || scenes[0] || {
      sceneNumber: 1,
      sceneCategory: "Core Concept",
      visualTitle: "Lecture Overview",
      bullets: ["Loading scene insights..."],
      narration: "Welcome to this interactive smart video lecture.",
      duration: 28,
      graphicsPrompt: "System architecture diagram",
      highlightKeyTerms: ["Architecture", "Concept", "Verification"],
    };

    const keyTerms =
      Array.isArray(raw.highlightKeyTerms) && raw.highlightKeyTerms.length > 0
        ? raw.highlightKeyTerms
        : ["Architecture", "Mechanism", "Execution", "Validation"];

    // Ensure rich bullets (keypoints) with clear concept labels
    const rawBullets = Array.isArray(raw.bullets) && raw.bullets.length > 0 ? raw.bullets : [];
    const enrichedBullets = rawBullets.map((b, idx) => {
      if (b.includes(":")) return b;
      const termLabel = keyTerms[idx % keyTerms.length] || `Key Concept ${idx + 1}`;
      return `${termLabel} Mechanism: ${b}`;
    });
    if (enrichedBullets.length < 5) {
      enrichedBullets.push(
        `Exam & Practical Application: Always connect the core definition of ${raw.visualTitle} with its 4-stage architectural flow diagram and governing verification rules.`
      );
    }

    // Derive Short Notes if not already present
    const derivedShortNotes =
      raw.shortNotes && raw.shortNotes.trim().length > 20
        ? raw.shortNotes.trim()
        : `${raw.visualTitle} establishes the essential framework for ${keyTerms.slice(0, 3).join(", ")}. ${
            rawBullets[0] || "It coordinates input acquisition, structured processing, and output validation."
          } Understanding this module is critical for both theoretical exams and real-world system implementation.`;

    // Derive Deep-Dive Explanation ("Explain More") if not already present
    const derivedDetailedExplanation =
      raw.detailedExplanation && raw.detailedExplanation.trim().length > 35
        ? raw.detailedExplanation.trim()
        : `${raw.narration || ""} Specifically, ${raw.visualTitle} operates by dividing complex tasks into deterministic stages: first capturing and normalizing parameters (${
            keyTerms[0] || "Input"
          }), then executing core transformation logic (${
            keyTerms[1] || "Processing"
          }), enforcing boundary and security constraints (${
            keyTerms[2] || "Verification"
          }), and finally delivering verified results with continuous feedback.`;

    // Ensure full, untruncated Diagram Steps with title + explanation
    const rawSteps = Array.isArray(raw.diagramSteps) && raw.diagramSteps.length >= 2 ? raw.diagramSteps : [];
    const derivedSteps =
      rawSteps.length >= 2
        ? rawSteps.map((st, idx) => {
            if (st.length >= 48) return st;
            const correspondingBullet = rawBullets[idx] || rawBullets[0] || "Processes and validates stage parameters.";
            return `${st} — ${correspondingBullet}`;
          })
        : [
            `Stage 1: Input & Context Initialization (${keyTerms[0] || "Source"}) — Collects initial parameters and prepares structured input.`,
            `Stage 2: Core Processing & Transformation (${raw.visualTitle}) — Applies primary algorithmic logic and maps internal states.`,
            `Stage 3: Rule Enforcement & Verification — Validates constraints, security checks, and operational accuracy.`,
            `Stage 4: Final Output & Feedback Loop — Produces verified output and updates control telemetry.`,
          ];

    const derivedDiagramExplanation =
      raw.diagramExplanation && raw.diagramExplanation.trim().length > 25
        ? raw.diagramExplanation.trim()
        : `Diagram Walkthrough: Data enters at Stage 1 for initialization and parameter mapping, flows into Stage 2 where the core ${raw.visualTitle} mechanism executes, passes through Stage 3 for strict rule verification, and exits at Stage 4 as validated output.`;

    const derivedRule =
      raw.formulaOrKeyRule ||
      `Core Rule: Output(${keyTerms[0] || "System"}) = Verified_Process(${keyTerms[1] || "Input"}) + Feedback_Control`;

    const derivedAnalogy =
      raw.realWorldAnalogy ||
      `Real-World Analogy: ${raw.visualTitle} functions like an automated air-traffic control pipeline that tracks, verifies, and routes every signal step by step without conflict.`;

    const derivedQuiz: VideoCheckpointQuestion =
      raw.checkpointQuestion &&
      Array.isArray(raw.checkpointQuestion.options) &&
      raw.checkpointQuestion.options.length >= 2
        ? raw.checkpointQuestion
        : {
            question: `Which statement best explains the core mechanism of "${raw.visualTitle}"?`,
            options: [
              rawBullets[0] || "It systematically initializes, processes, and verifies inputs through a multi-stage workflow.",
              "It bypasses all verification and structural constraints during execution.",
              "It operates without any input parameters or feedback stages.",
              "It discards all intermediate state information before producing output.",
            ],
            answerIndex: 0,
            explanation:
              derivedShortNotes,
          };

    // Estimate a realistic duration based on total words so voice and progress bar stay in sync
    const safeDuration = Math.max(24, raw.duration || 28);

    return {
      ...raw,
      sceneNumber: safeSceneIndex + 1,
      sceneCategory: raw.sceneCategory || `Module ${safeSceneIndex + 1}`,
      shortNotes: derivedShortNotes,
      bullets: enrichedBullets,
      detailedExplanation: derivedDetailedExplanation,
      diagramSteps: derivedSteps,
      diagramExplanation: derivedDiagramExplanation,
      formulaOrKeyRule: derivedRule,
      realWorldAnalogy: derivedAnalogy,
      checkpointQuestion: derivedQuiz,
      highlightKeyTerms: keyTerms,
      duration: safeDuration,
    };
  }, [scenes, safeSceneIndex]);

  // Build 100% SAME-TO-SAME Tracked Sentence Units from the exact on-screen Short Notes, Keypoints, Deep Explanation, and Diagram Steps!
  const trackedUnits: TrackedSentenceUnit[] = useMemo(() => {
    const rawUnits: Array<{
      id: string;
      sectionType: TrackedSentenceUnit["sectionType"];
      sectionLabel: string;
      text: string;
      itemIndex?: number;
    }> = [];

    // 1. Short Notes
    if (activeScene.shortNotes) {
      rawUnits.push({
        id: "short-note",
        sectionType: "short-note",
        sectionLabel: "📌 Short Notes Summary",
        text: activeScene.shortNotes,
      });
    }

    // 2. Keypoints
    (activeScene.bullets || []).forEach((bullet, idx) => {
      rawUnits.push({
        id: `keypoint-${idx}`,
        sectionType: "keypoint",
        sectionLabel: `🎯 Keypoint ${idx + 1}`,
        text: bullet,
        itemIndex: idx,
      });
    });

    // 3. Deep Explanation ("Explain More")
    if (activeScene.detailedExplanation) {
      rawUnits.push({
        id: "deep-explanation",
        sectionType: "deep-explanation",
        sectionLabel: "📖 In-Depth Explanation",
        text: activeScene.detailedExplanation,
      });
    }

    // 4. Formula / Rule & Real-World Analogy
    if (activeScene.formulaOrKeyRule || activeScene.realWorldAnalogy) {
      rawUnits.push({
        id: "rule-analogy",
        sectionType: "rule-analogy",
        sectionLabel: "💡 Formula & Real-World Analogy",
        text: `${activeScene.formulaOrKeyRule || ""} ${activeScene.realWorldAnalogy || ""}`.trim(),
      });
    }

    // 5. Diagram Stages & Diagram Walkthrough
    (activeScene.diagramSteps || []).forEach((step, idx) => {
      rawUnits.push({
        id: `diagram-step-${idx}`,
        sectionType: "diagram-step",
        sectionLabel: `🔀 Diagram Stage ${idx + 1}`,
        text: step,
        itemIndex: idx,
      });
    });

    if (activeScene.diagramExplanation) {
      rawUnits.push({
        id: "diagram-summary",
        sectionType: "diagram-summary",
        sectionLabel: "🔀 Diagram Walkthrough",
        text: activeScene.diagramExplanation,
      });
    }

    let runningWords = 0;
    const withCounts = rawUnits.map((u) => {
      const words = u.text.trim().split(/\s+/).filter(Boolean);
      const count = Math.max(1, words.length);
      const startWordOffset = runningWords;
      runningWords += count;
      return {
        ...u,
        wordCount: count,
        startWordOffset,
        endWordOffset: runningWords - 1,
      };
    });

    const totalWords = Math.max(1, runningWords);
    return withCounts.map((u) => ({
      ...u,
      startTimeRatio: u.startWordOffset / totalWords,
      endTimeRatio: (u.endWordOffset + 1) / totalWords,
    }));
  }, [activeScene]);

  const totalSceneWords = useMemo(() => {
    if (trackedUnits.length === 0) return 1;
    return Math.max(1, trackedUnits[trackedUnits.length - 1].endWordOffset + 1);
  }, [trackedUnits]);

  // Full unified spoken script that matches the on-screen trackedUnits 100% word-for-word!
  const unifiedSpokenScript = useMemo(() => {
    return trackedUnits.map((u) => u.text).join(" ");
  }, [trackedUnits]);

  // Calculate current progress ratio and active global word index (combining real speech boundary + timer sync)
  const progressRatio = Math.min(1, Math.max(0, sceneProgress / Math.max(1, activeScene.duration)));
  const timerWordIndex = Math.min(
    totalSceneWords - 1,
    Math.floor(progressRatio * totalSceneWords)
  );
  const currentGlobalWordIndex =
    isPlaying && spokenGlobalWordIndex !== null ? spokenGlobalWordIndex : timerWordIndex;

  // Determine which TrackedSentenceUnit is currently active
  const activeUnitIndex = useMemo(() => {
    const foundIdx = trackedUnits.findIndex(
      (u) =>
        currentGlobalWordIndex >= u.startWordOffset &&
        currentGlobalWordIndex <= u.endWordOffset
    );
    return foundIdx >= 0 ? foundIdx : 0;
  }, [trackedUnits, currentGlobalWordIndex]);

  const activeTrackedUnit = trackedUnits[activeUnitIndex] || trackedUnits[0];

  // Determine active diagram step index (highlights in sync when speaking diagram steps OR proportionally across the scene)
  const activeDiagramStepIndex = useMemo(() => {
    const stepCount = Math.max(1, activeScene.diagramSteps?.length || 4);
    if (activeTrackedUnit?.sectionType === "diagram-step" && activeTrackedUnit.itemIndex !== undefined) {
      return activeTrackedUnit.itemIndex;
    }
    return Math.min(stepCount - 1, Math.floor(progressRatio * stepCount));
  }, [activeTrackedUnit, activeScene.diagramSteps, progressRatio]);

  // Reset scene index when new videoData arrives
  useEffect(() => {
    setCurrentSceneIndex(0);
    setSceneProgress(0);
    setSpokenGlobalWordIndex(null);
    setSelectedAnswers({});
  }, [videoData]);

  // Load available speech synthesis voices
  useEffect(() => {
    const updateVoices = () => {
      if (typeof window !== "undefined" && window.speechSynthesis) {
        const availableVoices = window.speechSynthesis.getVoices();
        const englishVoices = availableVoices.filter(
          (v) =>
            v.lang.startsWith("en") ||
            v.lang.startsWith("es") ||
            v.lang.startsWith("fr") ||
            v.default
        );
        setVoices(englishVoices.length > 0 ? englishVoices : availableVoices);

        const defaultVoice =
          englishVoices.find(
            (v) =>
              v.name.includes("Natural") ||
              v.name.includes("Google") ||
              v.lang === "en-US" ||
              v.lang === "en-IN"
          ) || englishVoices[0];
        if (defaultVoice && !selectedVoiceName) {
          setSelectedVoiceName(defaultVoice.name);
        }
      }
    };

    updateVoices();
    if (typeof window !== "undefined" && window.speechSynthesis) {
      window.speechSynthesis.onvoiceschanged = updateVoices;
    }
  }, [selectedVoiceName]);

  // Speak from a specific unit index so the voice and sentence tracker are 100% locked together
  const speakFromUnitIndex = (startUnitIdx = 0) => {
    if (typeof window === "undefined" || !window.speechSynthesis) return;
    window.speechSynthesis.cancel();

    if (!isVoiceEnabled || isMuted || !isPlaying || trackedUnits.length === 0) {
      setSpokenGlobalWordIndex(null);
      return;
    }

    const clampedUnitIdx = Math.max(0, Math.min(trackedUnits.length - 1, startUnitIdx));
    const baseWordOffset = trackedUnits[clampedUnitIdx].startWordOffset;
    const remainingText = trackedUnits
      .slice(clampedUnitIdx)
      .map((u) => u.text)
      .join(" ");

    // Build character-offset-to-word-index lookup for remainingText
    const wordsWithCharOffsets: Array<{ startChar: number; endChar: number; globalWordIdx: number }> = [];
    let cursor = 0;
    const splitWords = remainingText.split(/\s+/).filter(Boolean);
    splitWords.forEach((w, idx) => {
      const pos = remainingText.indexOf(w, cursor);
      const startC = pos >= 0 ? pos : cursor;
      const endC = startC + w.length;
      cursor = endC;
      wordsWithCharOffsets.push({
        startChar: startC,
        endChar: endC,
        globalWordIdx: baseWordOffset + idx,
      });
    });

    const utterance = new SpeechSynthesisUtterance(remainingText);
    if (selectedVoiceName) {
      const voice = voices.find((v) => v.name === selectedVoiceName);
      if (voice) utterance.voice = voice;
    }
    utterance.rate = playbackSpeed;
    utterance.volume = 0.95;

    utterance.onboundary = (event: SpeechSynthesisEvent) => {
      if (typeof event.charIndex === "number") {
        const match = wordsWithCharOffsets.find(
          (item) => event.charIndex >= item.startChar && event.charIndex <= item.endChar + 2
        );
        if (match) {
          setSpokenGlobalWordIndex(match.globalWordIdx);
          // Also keep sceneProgress aligned with the spoken word so timeline and voice never drift apart!
          const spokenRatio = match.globalWordIdx / Math.max(1, totalSceneWords);
          setSceneProgress(spokenRatio * activeScene.duration);
        }
      }
    };

    utterance.onend = () => {
      setSpokenGlobalWordIndex(null);
    };

    speechUtteranceRef.current = utterance;
    window.speechSynthesis.speak(utterance);
  };

  // Trigger speech whenever scene or playback state changes
  useEffect(() => {
    if (isPlaying) {
      speakFromUnitIndex(activeUnitIndex);
    } else {
      setSpokenGlobalWordIndex(null);
      if (typeof window !== "undefined" && window.speechSynthesis) {
        window.speechSynthesis.cancel();
      }
    }
    return () => {
      if (typeof window !== "undefined" && window.speechSynthesis) {
        window.speechSynthesis.cancel();
      }
    };
  }, [
    safeSceneIndex,
    isPlaying,
    isVoiceEnabled,
    selectedVoiceName,
    isMuted,
    playbackSpeed,
  ]);

  // Jump directly to any sentence unit on the board (and immediately speak it!)
  const handleJumpToUnit = (unitIndex: number) => {
    const targetUnit = trackedUnits[unitIndex];
    if (!targetUnit) return;
    const newProgress = targetUnit.startTimeRatio * activeScene.duration;
    setSceneProgress(newProgress);
    setSpokenGlobalWordIndex(targetUnit.startWordOffset);
    if (!isPlaying) {
      setIsPlaying(true);
    } else {
      speakFromUnitIndex(unitIndex);
    }
  };

  // Main playback tick timer (purely increments sceneProgress; scene transitions happen cleanly in a separate effect)
  useEffect(() => {
    if (playbackIntervalRef.current) {
      clearInterval(playbackIntervalRef.current);
    }

    if (isPlaying) {
      const step = 0.1;
      playbackIntervalRef.current = setInterval(() => {
        setSceneProgress((prev) => prev + step * playbackSpeed);
      }, 100);
    }

    return () => {
      if (playbackIntervalRef.current) {
        clearInterval(playbackIntervalRef.current);
      }
    };
  }, [isPlaying, playbackSpeed]);

  // Clean scene advancement effect (prevents StrictMode double increment that caused SCENE 9 / 8)
  useEffect(() => {
    if (!isPlaying) return;
    if (sceneProgress >= activeScene.duration) {
      if (safeSceneIndex < scenes.length - 1) {
        setCurrentSceneIndex(safeSceneIndex + 1);
        setSceneProgress(0);
        setSpokenGlobalWordIndex(null);
      } else {
        setSceneProgress(activeScene.duration);
        setIsPlaying(false);
        setSpokenGlobalWordIndex(null);
      }
    }
  }, [sceneProgress, activeScene.duration, safeSceneIndex, scenes.length, isPlaying]);

  // Handle procedural backing study music (Web Audio API)
  useEffect(() => {
    if (isMusicEnabled && isPlaying && !isMuted) {
      try {
        if (!audioCtxRef.current) {
          audioCtxRef.current = new (window.AudioContext ||
            (window as any).webkitAudioContext)();
        }

        const ctx = audioCtxRef.current;
        if (ctx.state === "suspended") {
          ctx.resume();
        }

        const osc1 = ctx.createOscillator();
        const osc2 = ctx.createOscillator();
        const gainNode = ctx.createGain();

        osc1.type = "sine";
        osc2.type = "triangle";

        osc1.frequency.setValueAtTime(130.81, ctx.currentTime);
        osc2.frequency.setValueAtTime(196.0, ctx.currentTime);

        gainNode.gain.setValueAtTime(0.012, ctx.currentTime);

        osc1.connect(gainNode);
        osc2.connect(gainNode);
        gainNode.connect(ctx.destination);

        osc1.start();
        osc2.start();

        musicNodesRef.current = { osc1, osc2, gainNode };

        let chordIndex = 0;
        const chords = [
          [130.81, 196.0],
          [146.83, 220.0],
          [164.81, 246.94],
          [174.61, 261.63],
        ];

        const musicInterval = setInterval(() => {
          if (ctx.state === "running" && musicNodesRef.current) {
            chordIndex = (chordIndex + 1) % chords.length;
            const currentChord = chords[chordIndex];
            musicNodesRef.current.osc1.frequency.setTargetAtTime(
              currentChord[0],
              ctx.currentTime,
              1.5
            );
            musicNodesRef.current.osc2.frequency.setTargetAtTime(
              currentChord[1],
              ctx.currentTime,
              1.5
            );
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
            } catch {}
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
        } catch {}
        musicNodesRef.current = null;
      }
    }
  }, [isMusicEnabled, isPlaying, isMuted]);

  useEffect(() => {
    return () => {
      if (audioCtxRef.current) {
        audioCtxRef.current.close().catch(() => {});
      }
    };
  }, []);

  const getSceneDuration = (index: number) => {
    return Math.max(24, scenes[index]?.duration || 28);
  };

  const getCumulativeDurationBeforeScene = (index: number) => {
    return scenes
      .slice(0, Math.min(index, scenes.length))
      .reduce((acc, _, idx) => acc + getSceneDuration(idx), 0);
  };

  const totalVideoDuration = Math.max(
    1,
    scenes.reduce((acc, _, idx) => acc + getSceneDuration(idx), 0)
  );
  const currentTotalTime = Math.min(
    totalVideoDuration,
    getCumulativeDurationBeforeScene(safeSceneIndex) +
      Math.min(sceneProgress, activeScene.duration)
  );

  const formatTime = (secs: number) => {
    const clamped = Math.max(0, Math.floor(secs));
    const m = Math.floor(clamped / 60);
    const s = clamped % 60;
    return `${m}:${s < 10 ? "0" : ""}${s}`;
  };

  const handleSeekBarClick = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const clickRatio = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
    const targetSeconds = clickRatio * totalVideoDuration;

    let accumulated = 0;
    for (let i = 0; i < scenes.length; i++) {
      const d = getSceneDuration(i);
      if (accumulated + d >= targetSeconds) {
        setCurrentSceneIndex(i);
        setSceneProgress(targetSeconds - accumulated);
        setSpokenGlobalWordIndex(null);
        break;
      }
      accumulated += d;
    }
  };

  const handleJumpSeconds = (amount: number) => {
    const targetTotal = Math.max(
      0,
      Math.min(totalVideoDuration - 0.5, currentTotalTime + amount)
    );

    let accumulated = 0;
    for (let i = 0; i < scenes.length; i++) {
      const d = getSceneDuration(i);
      if (accumulated + d >= targetTotal) {
        setCurrentSceneIndex(i);
        setSceneProgress(targetTotal - accumulated);
        setSpokenGlobalWordIndex(null);
        break;
      }
      accumulated += d;
    }
  };

  const toggleFullscreen = () => {
    if (!containerRef.current) return;
    if (!document.fullscreenElement) {
      containerRef.current.requestFullscreen?.().catch(() => {});
      setIsFullscreen(true);
    } else {
      document.exitFullscreen?.().catch(() => {});
      setIsFullscreen(false);
    }
  };

  const downloadLectureMarkdown = () => {
    const lines: string[] = [
      `# ${title}`,
      `**Total Duration:** ${formatTime(totalVideoDuration)} (${scenes.length} Scenes)`,
      "",
    ];
    scenes.forEach((sc, idx) => {
      lines.push(`## Scene ${idx + 1}: ${sc.visualTitle}`);
      if (sc.sceneCategory) lines.push(`- **Category:** ${sc.sceneCategory}`);
      lines.push(`- **Duration:** ${getSceneDuration(idx)}s`);
      if (sc.highlightKeyTerms?.length) {
        lines.push(`- **Key Terms:** ${sc.highlightKeyTerms.join(", ")}`);
      }
      if (sc.shortNotes) {
        lines.push("", "### Short Notes Summary", sc.shortNotes);
      }
      lines.push("", "### Keypoints");
      (sc.bullets || []).forEach((b) => lines.push(`- ${b}`));
      if (sc.detailedExplanation) {
        lines.push("", "### In-Depth Explanation", sc.detailedExplanation);
      }
      if (sc.diagramSteps?.length) {
        lines.push("", "### Architecture & Flowchart Diagram");
        sc.diagramSteps.forEach((step) => lines.push(`1. ${step}`));
      }
      if (sc.diagramExplanation) {
        lines.push("", `**Diagram Walkthrough:** ${sc.diagramExplanation}`);
      }
      if (sc.formulaOrKeyRule) {
        lines.push("", `> **${sc.formulaOrKeyRule}**`);
      }
      if (sc.realWorldAnalogy) {
        lines.push("", `> *${sc.realWorldAnalogy}*`);
      }
      lines.push("", "### Spoken Narration Script", sc.narration, "");
    });

    const blob = new Blob([lines.join("\n")], { type: "text/markdown;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${title.replace(/[^a-zA-Z0-9_-]/g, "_")}_Lecture_Script.md`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // Render a real playable .webm video file using HTML5 Canvas + MediaRecorder
  const renderAndDownloadWebmVideo = async () => {
    if (isRenderingWebm || scenes.length === 0) return;
    setIsRenderingWebm(true);
    setRenderWebmProgress(5);

    try {
      const canvas = document.createElement("canvas");
      canvas.width = 1280;
      canvas.height = 720;
      const ctx = canvas.getContext("2d");
      if (!ctx || typeof MediaRecorder === "undefined") {
        downloadLectureMarkdown();
        setIsRenderingWebm(false);
        return;
      }

      const stream = canvas.captureStream(30);
      const mimeType = MediaRecorder.isTypeSupported("video/webm;codecs=vp9")
        ? "video/webm;codecs=vp9"
        : MediaRecorder.isTypeSupported("video/webm")
        ? "video/webm"
        : "";

      const recorder = mimeType
        ? new MediaRecorder(stream, { mimeType, videoBitsPerSecond: 2500000 })
        : new MediaRecorder(stream);

      const chunks: BlobPart[] = [];
      recorder.ondataavailable = (e) => {
        if (e.data && e.data.size > 0) chunks.push(e.data);
      };

      const finishPromise = new Promise<Blob>((resolve) => {
        recorder.onstop = () => {
          resolve(new Blob(chunks, { type: "video/webm" }));
        };
      });

      recorder.start(100);

      const wrapCanvasText = (
        text: string,
        x: number,
        y: number,
        maxWidth: number,
        lineHeight: number,
        maxLines = 3
      ) => {
        const words = String(text || "").split(" ");
        let line = "";
        let curY = y;
        let linesDrawn = 0;
        for (let n = 0; n < words.length; n++) {
          const testLine = line + words[n] + " ";
          const metrics = ctx.measureText(testLine);
          if (metrics.width > maxWidth && n > 0) {
            ctx.fillText(line.trim(), x, curY);
            line = words[n] + " ";
            curY += lineHeight;
            linesDrawn++;
            if (linesDrawn >= maxLines - 1) break;
          } else {
            line = testLine;
          }
        }
        if (line.trim()) {
          ctx.fillText(line.trim(), x, curY);
        }
      };

      const framesPerScene = 18;
      for (let sIdx = 0; sIdx < scenes.length; sIdx++) {
        const sc = scenes[sIdx];
        const steps =
          Array.isArray(sc.diagramSteps) && sc.diagramSteps.length >= 2
            ? sc.diagramSteps
            : [
                "Stage 1: Input & Initialization",
                `Stage 2: ${sc.visualTitle.slice(0, 26)}`,
                "Stage 3: Verification & Rules",
                "Stage 4: Final Output & Feedback",
              ];

        for (let f = 0; f < framesPerScene; f++) {
          const ratio = (f + 1) / framesPerScene;
          setRenderWebmProgress(
            Math.round(8 + ((sIdx * framesPerScene + f) / (scenes.length * framesPerScene)) * 88)
          );

          ctx.fillStyle =
            boardTheme === "chalkboard"
              ? "#132A21"
              : boardTheme === "dark-studio"
              ? "#0F172A"
              : "#FCFBF7";
          ctx.fillRect(0, 0, 1280, 720);

          ctx.fillStyle = "#1E293B";
          ctx.fillRect(0, 0, 1280, 68);
          ctx.fillStyle = "#F8FAFC";
          ctx.font = "bold 22px sans-serif";
          ctx.fillText(
            `SCENE ${sIdx + 1}/${scenes.length}: ${sc.visualTitle.slice(0, 62)}`,
            36,
            42
          );

          const textColor =
            boardTheme === "chalkboard" || boardTheme === "dark-studio"
              ? "#F8FAFC"
              : "#1E293B";
          ctx.fillStyle = textColor;
          ctx.font = "bold 24px serif";
          ctx.fillText(sc.visualTitle.slice(0, 50), 44, 115);

          ctx.font = "16px sans-serif";
          const visibleBullets = Math.max(
            1,
            Math.ceil((sc.bullets || []).length * ratio)
          );
          (sc.bullets || []).slice(0, visibleBullets).forEach((b, bIdx) => {
            ctx.fillStyle = "#2563EB";
            ctx.fillText(`${bIdx + 1}.`, 44, 158 + bIdx * 82);
            ctx.fillStyle = textColor;
            wrapCanvasText(b, 72, 158 + bIdx * 82, 640, 22, 3);
          });

          ctx.fillStyle =
            boardTheme === "chalkboard" || boardTheme === "dark-studio"
              ? "rgba(255,255,255,0.07)"
              : "#F1F5F9";
          ctx.fillRect(750, 92, 495, 470);

          ctx.fillStyle = "#4F46E5";
          ctx.font = "bold 17px sans-serif";
          ctx.fillText("ARCHITECTURE & PROCESS FLOW DIAGRAM", 772, 125);

          steps.slice(0, 4).forEach((st, stIdx) => {
            const isStepActive = ratio >= stIdx / 4;
            const boxY = 145 + stIdx * 98;
            ctx.fillStyle = isStepActive ? "#4F46E5" : "#CBD5E1";
            ctx.fillRect(772, boxY, 450, 74);
            ctx.fillStyle = isStepActive ? "#FFFFFF" : "#334155";
            ctx.font = "bold 15px sans-serif";
            wrapCanvasText(st, 788, boxY + 26, 420, 20, 2);
          });

          ctx.fillStyle = "#0F172A";
          ctx.fillRect(0, 590, 1280, 130);
          ctx.fillStyle = "#FCD34D";
          ctx.font = "bold 19px sans-serif";
          wrapCanvasText(sc.shortNotes || sc.narration, 48, 632, 1184, 26, 3);

          ctx.fillStyle = "#38BDF8";
          ctx.fillRect(
            0,
            712,
            1280 * ((sIdx + ratio) / scenes.length),
            8
          );

          await new Promise((r) => setTimeout(r, 35));
        }
      }

      recorder.stop();
      const videoBlob = await finishPromise;
      const url = URL.createObjectURL(videoBlob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${title.replace(/[^a-zA-Z0-9_-]/g, "_")}_Smart_Lecture.webm`;
      a.click();
      setTimeout(() => URL.revokeObjectURL(url), 2000);
    } catch (err) {
      console.warn("WebM export fallback to Markdown script:", err);
      downloadLectureMarkdown();
    } finally {
      setIsRenderingWebm(false);
      setRenderWebmProgress(0);
    }
  };

  // Board theme classes
  const themeStyles = useMemo(() => {
    switch (boardTheme) {
      case "chalkboard":
        return {
          stageBg:
            "bg-[#142C22] bg-[radial-gradient(rgba(255,255,255,0.08)_1px,transparent_1px)] [background-size:22px_22px]",
          titleText: "text-emerald-50",
          bodyText: "text-emerald-100",
          mutedText: "text-emerald-300/65",
          badgeBg: "bg-emerald-900/80 text-emerald-200 border-emerald-500/40",
          cardBg: "bg-emerald-950/75 border-emerald-600/40 text-emerald-50",
          shortNoteBox: "bg-emerald-900/55 border-emerald-400/40 text-emerald-50",
          explainBox: "bg-teal-950/70 border-teal-500/40 text-teal-50",
          ruleBox: "bg-amber-500/15 border-amber-400/40 text-amber-100",
          analogyBox: "bg-teal-500/15 border-teal-400/30 text-teal-100",
        };
      case "dark-studio":
        return {
          stageBg:
            "bg-[#0B1120] bg-[radial-gradient(rgba(56,189,248,0.12)_1.5px,transparent_1.5px)] [background-size:22px_22px]",
          titleText: "text-white",
          bodyText: "text-slate-100",
          mutedText: "text-slate-400",
          badgeBg: "bg-sky-500/20 text-sky-300 border-sky-400/30",
          cardBg: "bg-slate-900/85 border-slate-700/80 text-slate-100",
          shortNoteBox: "bg-indigo-950/75 border-indigo-500/40 text-indigo-100",
          explainBox: "bg-slate-900/95 border-sky-500/40 text-slate-100",
          ruleBox: "bg-indigo-500/20 border-indigo-400/40 text-indigo-100",
          analogyBox: "bg-cyan-500/15 border-cyan-400/30 text-cyan-100",
        };
      case "notebook":
        return {
          stageBg:
            "bg-[#FCFBF7] bg-[repeating-linear-gradient(transparent,transparent_31px,#cbd5e1_31px,#cbd5e1_32px)]",
          titleText: "text-[#0f172a]",
          bodyText: "text-[#1d4ed8]",
          mutedText: "text-slate-500",
          badgeBg: "bg-rose-50 text-rose-700 border-rose-200",
          cardBg: "bg-white/95 border-slate-300 text-slate-800",
          shortNoteBox: "bg-amber-50/95 border-amber-300 text-slate-900",
          explainBox: "bg-blue-50/90 border-blue-200 text-slate-900",
          ruleBox: "bg-amber-50/95 border-amber-300 text-amber-950",
          analogyBox: "bg-sky-50/95 border-sky-200 text-sky-950",
        };
      default:
        return {
          stageBg:
            "bg-[#FAF9F6] bg-[radial-gradient(#cbd5e1_1.5px,transparent_1.5px)] [background-size:20px_20px]",
          titleText: "text-[#1E293B]",
          bodyText: "text-[#334155]",
          mutedText: "text-[#64748B]",
          badgeBg: "bg-[#5A5A40]/10 text-[#5A5A40] border-[#5A5A40]/20",
          cardBg: "bg-white/95 border-[#E0E0D5] text-[#1E293B]",
          shortNoteBox: "bg-violet-50/90 border-violet-200 text-slate-900",
          explainBox: "bg-emerald-50/80 border-emerald-200 text-slate-900",
          ruleBox: "bg-amber-50 border-amber-200/90 text-amber-950",
          analogyBox: "bg-indigo-50/80 border-indigo-200/80 text-indigo-950",
        };
    }
  }, [boardTheme]);

  // Helper to render any sentence unit with live word-by-word voice tracking ("same to same")
  const renderWordTrackedText = (
    unit: TrackedSentenceUnit | undefined,
    fallbackText: string,
    activeWordClass = "bg-amber-300 text-slate-950 font-extrabold px-1 rounded shadow-2xs underline decoration-indigo-600 decoration-2",
    spokenWordClass = "font-semibold opacity-100"
  ) => {
    const textToRender = unit ? unit.text : fallbackText;
    const words = textToRender.trim().split(/\s+/).filter(Boolean);
    if (!unit) return <span>{textToRender}</span>;

    const isUnitCurrentlyActive = activeTrackedUnit?.id === unit.id;

    return (
      <span>
        {words.map((word, wIdx) => {
          const globalIdx = unit.startWordOffset + wIdx;
          const isCurrentSpokenWord =
            isUnitCurrentlyActive && globalIdx === currentGlobalWordIndex;
          const isAlreadySpoken = globalIdx < currentGlobalWordIndex;

          return (
            <span
              key={wIdx}
              className={`inline-block mr-1 transition-all duration-100 ${
                isCurrentSpokenWord
                  ? activeWordClass
                  : isAlreadySpoken
                  ? spokenWordClass
                  : ""
              }`}
            >
              {word}
            </span>
          );
        })}
      </span>
    );
  };

  // Split a keypoint string into a bold prefix label (before colon) and body (after colon)
  const formatKeypointParts = (text: string) => {
    const colonIdx = text.indexOf(":");
    if (colonIdx > 0 && colonIdx < 55) {
      return {
        heading: text.slice(0, colonIdx + 1),
        body: text.slice(colonIdx + 1).trim(),
      };
    }
    return { heading: "", body: text };
  };

  return (
    <div ref={containerRef} className="space-y-5" id="video-lecture-theatre">
      {/* Top Studio Control Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 bg-white p-5 rounded-[24px] shadow-[0_4px_20px_rgba(90,90,64,0.06)] border border-[#E0E0D5]">
        <div className="flex items-center gap-3.5 min-w-0">
          <div className="p-3 bg-gradient-to-br from-violet-600 to-indigo-700 text-white rounded-2xl shadow-md shrink-0">
            <MonitorPlay size={24} />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="font-serif text-xl sm:text-2xl font-bold text-[#3A3A2F] truncate">
                {title || "AI Smart Lecture Video"}
              </h3>
              <span className="text-[10px] uppercase font-extrabold tracking-wider bg-violet-100 text-violet-800 px-2.5 py-0.5 rounded-full border border-violet-200">
                1:1 Voice & Sentence Tracker
              </span>
              <span className="text-[10px] font-bold bg-emerald-50 text-emerald-700 px-2.5 py-0.5 rounded-full border border-emerald-200">
                {totalScenes} Scenes • {formatTime(totalVideoDuration)}
              </span>
            </div>
            <p className="text-xs text-[#8A8A7A] mt-0.5">
              Same-to-same synchronized voice & sentence tracker with Short Notes, Keypoints, In-Depth Explanation, and Full Process Diagram
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Board Visual Theme Selector */}
          <div className="flex items-center gap-1 bg-[#FAF9F6] border border-[#D1D1C4] rounded-full px-2.5 py-1">
            <Palette size={13} className="text-[#5A5A40]" />
            <select
              value={boardTheme}
              onChange={(e) => setBoardTheme(e.target.value as BoardTheme)}
              className="bg-transparent text-xs font-bold text-[#3A3A2F] outline-none cursor-pointer"
              title="Switch Lecture Board Visual Style"
            >
              <option value="whiteboard">📋 Whiteboard</option>
              <option value="chalkboard">🟩 Chalkboard</option>
              <option value="dark-studio">🌌 Dark Studio</option>
              <option value="notebook">📓 Ruled Notebook</option>
            </select>
          </div>

          <button
            type="button"
            onClick={() => void renderAndDownloadWebmVideo()}
            disabled={isRenderingWebm}
            className="bg-gradient-to-r from-violet-600 via-indigo-600 to-blue-600 hover:from-violet-700 hover:to-blue-700 text-white py-2 px-4 rounded-full text-xs font-bold flex items-center gap-1.5 shadow-sm transition-all cursor-pointer disabled:opacity-60"
            title="Render and download playable .webm video file"
          >
            {isRenderingWebm ? (
              <>
                <Loader2 size={14} className="animate-spin" />
                <span>Rendering Video ({renderWebmProgress}%)...</span>
              </>
            ) : (
              <>
                <FileVideo size={14} />
                <span>Download Video (.WebM)</span>
              </>
            )}
          </button>

          <button
            type="button"
            onClick={downloadLectureMarkdown}
            className="border border-[#D1D1C4] text-[#3A3A2F] bg-white hover:bg-[#FAF9F6] py-2 px-3.5 rounded-full text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
            title="Download full narrated lecture script, notes & diagrams (.MD)"
          >
            <Download size={13} />
            <span>Notes & Script (.MD)</span>
          </button>

          <button
            type="button"
            onClick={() => setShowSidebar(!showSidebar)}
            className="border border-[#D1D1C4] text-[#5A5A40] bg-[#FAF9F6] hover:bg-[#F0F0E8] py-2 px-3.5 rounded-full text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <ListVideo size={14} /> {showSidebar ? "Hide Side Panel" : "Show Side Panel"}
          </button>

          {onClose && (
            <button
              type="button"
              onClick={onClose}
              className="border border-red-200 hover:bg-red-50 text-red-600 font-semibold py-2 px-3.5 rounded-full text-xs transition-colors cursor-pointer"
            >
              Close
            </button>
          )}
        </div>
      </div>

      {/* Custom Topic Video Generator Bar */}
      {onRegenerateTopic && (
        <div className="bg-gradient-to-r from-violet-50/90 via-indigo-50/80 to-sky-50/90 border border-indigo-200/80 rounded-2xl p-3.5 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-indigo-600 text-white shadow-xs">
              <Wand2 size={15} />
            </span>
            <div>
              <p className="text-xs font-bold text-slate-900">
                Custom Topic Video Generator
              </p>
              <p className="text-[11px] text-slate-600">
                Enter any chapter, concept, or question from your document to generate a tailored 8-scene animated video lecture:
              </p>
            </div>
          </div>

          <form
            onSubmit={(e) => {
              e.preventDefault();
              if (customTopicInput.trim() && !isRegenerating) {
                onRegenerateTopic(customTopicInput.trim());
              }
            }}
            className="flex items-center gap-2 flex-1 max-w-md"
          >
            <input
              type="text"
              value={customTopicInput}
              onChange={(e) => setCustomTopicInput(e.target.value)}
              placeholder="e.g., Cybercrime Reconnaissance, OSI Layers, Deadlock..."
              className="flex-1 bg-white border border-indigo-200 rounded-xl px-3 py-1.5 text-xs text-slate-800 outline-none focus:border-indigo-500"
            />
            <button
              type="submit"
              disabled={isRegenerating || !customTopicInput.trim()}
              className="bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white font-bold text-xs px-3.5 py-1.5 rounded-xl flex items-center gap-1.5 shadow-xs transition-colors cursor-pointer shrink-0"
            >
              {isRegenerating ? <Loader2 size={13} className="animate-spin" /> : <Sparkles size={13} />}
              <span>Generate Topic Video</span>
            </button>
          </form>
        </div>
      )}

      {/* Main Theatre Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Side: Full Interactive Lecture Board + Synchronized Voice & Sentence Tracker */}
        <div
          className={`${
            showSidebar ? "lg:col-span-8" : "lg:col-span-12"
          } flex flex-col space-y-4`}
        >
          {/* Main Expandable Lecture Canvas (No fixed aspect-video clipping so all Short Notes, Keypoints, Explanation & Diagram are 100% visible!) */}
          <div className="relative w-full bg-[#1A1A14] rounded-[26px] border border-[#2D2D24] shadow-2xl overflow-hidden flex flex-col">
            {/* Dynamic Board Surface Backdrop */}
            <div
              className={`absolute inset-0 z-0 pointer-events-none transition-colors duration-300 ${themeStyles.stageBg}`}
            />

            {/* Notebook red margin line when in notebook mode */}
            {boardTheme === "notebook" && (
              <div className="absolute left-10 top-0 bottom-0 w-[3px] border-l border-r border-rose-300/80 pointer-events-none z-0" />
            )}

            {/* Overhead HUD Bar */}
            <div className="relative z-10 px-5 pt-4 pb-3 border-b border-current/10 flex flex-wrap justify-between items-center gap-2 select-none">
              <div className="flex items-center gap-2 flex-wrap">
                <div className="flex items-center gap-2 bg-[#1A1A14]/90 backdrop-blur-md text-white border border-white/15 rounded-xl px-3 py-1 text-xs font-extrabold">
                  <span
                    className={`w-2.5 h-2.5 rounded-full ${
                      isPlaying ? "bg-emerald-400 animate-pulse" : "bg-amber-400"
                    }`}
                  />
                  <span>
                    SCENE {safeSceneIndex + 1} / {totalScenes}
                  </span>
                </div>
                {activeScene.sceneCategory && (
                  <span
                    className={`text-[11px] font-extrabold uppercase tracking-wider px-3 py-1 rounded-xl border ${themeStyles.badgeBg}`}
                  >
                    {activeScene.sceneCategory}
                  </span>
                )}
              </div>

              <div className="flex items-center gap-2">
                {/* Scene Quick Switcher Buttons */}
                <div className="flex items-center gap-1 bg-slate-900/85 text-white rounded-xl px-2 py-1 border border-white/10 text-[11px] font-bold">
                  <button
                    type="button"
                    disabled={safeSceneIndex === 0}
                    onClick={() => {
                      setCurrentSceneIndex(Math.max(0, safeSceneIndex - 1));
                      setSceneProgress(0);
                      setSpokenGlobalWordIndex(null);
                    }}
                    className="p-0.5 hover:text-amber-300 disabled:opacity-40 cursor-pointer"
                    title="Previous Scene"
                  >
                    <ChevronLeft size={14} />
                  </button>
                  <span>Scene {safeSceneIndex + 1}</span>
                  <button
                    type="button"
                    disabled={safeSceneIndex >= totalScenes - 1}
                    onClick={() => {
                      setCurrentSceneIndex(Math.min(totalScenes - 1, safeSceneIndex + 1));
                      setSceneProgress(0);
                      setSpokenGlobalWordIndex(null);
                    }}
                    className="p-0.5 hover:text-amber-300 disabled:opacity-40 cursor-pointer"
                    title="Next Scene"
                  >
                    <ChevronRight size={14} />
                  </button>
                </div>

                {/* Live AI Professor Status Pill */}
                <button
                  type="button"
                  onClick={() => setIsPlaying(!isPlaying)}
                  className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white px-3.5 py-1.5 rounded-xl shadow-sm text-xs font-bold transition-colors cursor-pointer"
                >
                  {isPlaying ? <Pause size={13} /> : <Play size={13} />}
                  <span>
                    {isPlaying ? "Speaking Live • Pause" : "Click to Speak & Track"}
                  </span>
                </button>

                <button
                  type="button"
                  onClick={toggleFullscreen}
                  className="p-1.5 rounded-xl bg-slate-900/75 text-white hover:bg-slate-900 transition-colors cursor-pointer"
                  title="Toggle Fullscreen Theatre"
                >
                  {isFullscreen ? <Minimize2 size={14} /> : <Maximize2 size={14} />}
                </button>
              </div>
            </div>

            {/* =====================================================================
                LIVE VOICE & SENTENCE TRACKER BANNER (100% SAME-TO-SAME WITH VOICE)
               ===================================================================== */}
            <div className="relative z-10 mx-5 mt-4 rounded-2xl bg-slate-950/95 text-white border border-indigo-500/40 shadow-lg p-3.5 space-y-2">
              <div className="flex flex-wrap items-center justify-between gap-2 border-b border-white/10 pb-2">
                <div className="flex items-center gap-2">
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wider bg-indigo-600 text-white">
                    <Radio size={11} className={isPlaying ? "animate-pulse text-amber-300" : ""} />
                    Live Voice & Sentence Tracker (Same-to-Same)
                  </span>
                  <span className="text-[11px] font-bold text-amber-300">
                    {activeTrackedUnit?.sectionLabel || "Sentence 1"}
                  </span>
                </div>

                <div className="flex items-center gap-1.5">
                  <span className="text-[11px] font-mono text-slate-300">
                    Sentence {activeUnitIndex + 1} of {trackedUnits.length}
                  </span>
                  <button
                    type="button"
                    onClick={() => handleJumpToUnit(Math.max(0, activeUnitIndex - 1))}
                    disabled={activeUnitIndex <= 0}
                    className="px-2 py-0.5 rounded bg-white/10 hover:bg-white/20 disabled:opacity-40 text-[10px] font-bold cursor-pointer"
                    title="Previous Sentence"
                  >
                    ◀ Prev
                  </button>
                  <button
                    type="button"
                    onClick={() =>
                      handleJumpToUnit(Math.min(trackedUnits.length - 1, activeUnitIndex + 1))
                    }
                    disabled={activeUnitIndex >= trackedUnits.length - 1}
                    className="px-2 py-0.5 rounded bg-white/10 hover:bg-white/20 disabled:opacity-40 text-[10px] font-bold cursor-pointer"
                    title="Next Sentence"
                  >
                    Next ▶
                  </button>
                </div>
              </div>

              {/* Word-by-Word Live Tracked Sentence Display */}
              <div className="text-xs sm:text-sm leading-relaxed font-medium text-slate-100 py-0.5">
                {renderWordTrackedText(
                  activeTrackedUnit,
                  activeScene.shortNotes || activeScene.narration,
                  "bg-amber-300 text-slate-950 font-extrabold px-1.5 py-0.5 rounded shadow-xs scale-105",
                  "text-emerald-300 font-semibold"
                )}
              </div>

              {/* Sentence Progress Pills (Click any pill to jump voice to that exact section) */}
              <div className="flex items-center gap-1 overflow-x-auto pt-1 pb-0.5">
                {trackedUnits.map((u, uIdx) => {
                  const isCurrent = uIdx === activeUnitIndex;
                  const isPassed = uIdx < activeUnitIndex;
                  return (
                    <button
                      key={u.id}
                      type="button"
                      onClick={() => handleJumpToUnit(uIdx)}
                      className={`px-2 py-0.5 rounded-full text-[9px] font-bold shrink-0 transition-all cursor-pointer ${
                        isCurrent
                          ? "bg-amber-400 text-slate-950 shadow-xs"
                          : isPassed
                          ? "bg-indigo-600/70 text-white"
                          : "bg-white/10 text-slate-300 hover:bg-white/20"
                      }`}
                      title={`Jump voice to: ${u.sectionLabel}`}
                    >
                      {u.sectionLabel}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* =====================================================================
                MAIN LECTURE BOARD CONTENT:
                1. Scene Title & Key Terms
                2. Short Notes Summary Box
                3. Detailed Keypoints (5+ points) + Deep Explanation ("Explain More")
                4. Full Interactive Architecture & Process Flow Diagram + Diagram Explanation
               ===================================================================== */}
            <div className="relative z-10 px-5 sm:px-7 py-5 space-y-5">
              <AnimatePresence mode="wait">
                <motion.div
                  key={`${safeSceneIndex}-${boardTheme}`}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                  transition={{ duration: 0.25 }}
                  className="space-y-5"
                >
                  {/* 1. Scene Heading & Key Concept Badges */}
                  <div className="space-y-2 border-b border-current/10 pb-3">
                    <h4
                      className={`text-xl sm:text-2xl md:text-3xl font-serif font-bold leading-snug ${themeStyles.titleText}`}
                    >
                      {activeScene.visualTitle}
                    </h4>
                    {activeScene.highlightKeyTerms &&
                      activeScene.highlightKeyTerms.length > 0 && (
                        <div className="flex flex-wrap gap-1.5">
                          {activeScene.highlightKeyTerms.map((term, t) => (
                            <span
                              key={t}
                              className={`text-[11px] font-bold px-2.5 py-0.5 rounded-full border ${themeStyles.badgeBg}`}
                            >
                              #{term}
                            </span>
                          ))}
                        </div>
                      )}
                  </div>

                  {/* 2. 📌 SHORT NOTES SUMMARY CARD (Click to speak & track word-by-word) */}
                  {(() => {
                    const shortNoteUnitIdx = trackedUnits.findIndex(
                      (u) => u.sectionType === "short-note"
                    );
                    const shortNoteUnit = trackedUnits[shortNoteUnitIdx];
                    const isShortNoteActive = activeUnitIndex === shortNoteUnitIdx;
                    return (
                      <div
                        onClick={() => {
                          if (shortNoteUnitIdx >= 0) handleJumpToUnit(shortNoteUnitIdx);
                        }}
                        className={`p-4 rounded-2xl border transition-all cursor-pointer ${
                          themeStyles.shortNoteBox
                        } ${
                          isShortNoteActive
                            ? "ring-2 ring-indigo-500 shadow-md"
                            : "hover:border-indigo-400/70"
                        }`}
                      >
                        <div className="flex items-center justify-between gap-2 mb-1.5">
                          <span className="text-[11px] font-extrabold uppercase tracking-wider flex items-center gap-1.5 text-indigo-700 dark:text-indigo-300">
                            <BookOpen size={14} /> 📌 Short Notes (Quick Revision Summary)
                          </span>
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-indigo-600/15 text-indigo-700 dark:text-indigo-300">
                            {isShortNoteActive && isPlaying
                              ? "🔊 Speaking Now"
                              : "Click to Speak"}
                          </span>
                        </div>
                        <p className="text-xs sm:text-sm leading-relaxed font-medium">
                          {renderWordTrackedText(
                            shortNoteUnit,
                            activeScene.shortNotes || ""
                          )}
                        </p>
                      </div>
                    );
                  })()}

                  {/* Two-Column Split: Left = Keypoints + Deep Explanation | Right = Full Interactive Diagram + Diagram Walkthrough */}
                  <div className="grid grid-cols-1 xl:grid-cols-12 gap-5 items-start">
                    {/* Left 7 Columns: Structured Keypoints + In-Depth Explanation ("Explain More") */}
                    <div className="xl:col-span-7 space-y-4">
                      {/* 3. 🎯 KEYPOINTS LIST */}
                      <div className={`p-4 rounded-2xl border shadow-xs space-y-3 ${themeStyles.cardBg}`}>
                        <div className="flex items-center justify-between border-b border-current/10 pb-2">
                          <span className="text-xs font-extrabold uppercase tracking-wider flex items-center gap-1.5 text-amber-600 dark:text-amber-400">
                            <Layers size={14} /> 🎯 High-Yield Keypoints ({activeScene.bullets.length} Points)
                          </span>
                          <span className="text-[10px] opacity-75">
                            Click any keypoint to track voice
                          </span>
                        </div>

                        <ul className="space-y-2.5">
                          {(activeScene.bullets || []).map((bullet, i) => {
                            const unitIdx = trackedUnits.findIndex(
                              (u) => u.sectionType === "keypoint" && u.itemIndex === i
                            );
                            const unit = trackedUnits[unitIdx];
                            const isCurrentFocus = unitIdx >= 0 && activeUnitIndex === unitIdx;
                            const { heading, body } = formatKeypointParts(bullet);

                            return (
                              <li
                                key={i}
                                onClick={() => {
                                  if (unitIdx >= 0) handleJumpToUnit(unitIdx);
                                }}
                                className={`text-xs sm:text-sm leading-relaxed flex items-start gap-2.5 p-3 rounded-xl border transition-all cursor-pointer ${
                                  isCurrentFocus
                                    ? "bg-amber-50/95 text-slate-950 border-amber-400 shadow-sm ring-2 ring-amber-400/70"
                                    : `${themeStyles.cardBg} hover:border-indigo-400/60`
                                }`}
                              >
                                <span
                                  className={`mt-0.5 w-5 h-5 rounded-full text-[11px] font-extrabold flex items-center justify-center shrink-0 ${
                                    isCurrentFocus
                                      ? "bg-indigo-600 text-white"
                                      : "bg-amber-500/20 text-amber-700 dark:text-amber-300"
                                  }`}
                                >
                                  {i + 1}
                                </span>
                                <div className="flex-1 min-w-0">
                                  {unit ? (
                                    renderWordTrackedText(unit, bullet)
                                  ) : (
                                    <>
                                      {heading && <strong className="font-bold mr-1">{heading}</strong>}
                                      <span>{body}</span>
                                    </>
                                  )}
                                </div>
                              </li>
                            );
                          })}
                        </ul>
                      </div>

                      {/* 4. 📖 IN-DEPTH CONCEPT EXPLANATION ("EXPLAIN MORE") */}
                      {(() => {
                        const explainUnitIdx = trackedUnits.findIndex(
                          (u) => u.sectionType === "deep-explanation"
                        );
                        const explainUnit = trackedUnits[explainUnitIdx];
                        const isExplainActive = activeUnitIndex === explainUnitIdx;

                        return (
                          <div
                            onClick={() => {
                              if (explainUnitIdx >= 0) handleJumpToUnit(explainUnitIdx);
                            }}
                            className={`p-4 rounded-2xl border transition-all cursor-pointer space-y-2 ${
                              themeStyles.explainBox
                            } ${
                              isExplainActive
                                ? "ring-2 ring-emerald-500 shadow-md"
                                : "hover:border-emerald-400/70"
                            }`}
                          >
                            <div className="flex items-center justify-between gap-2">
                              <span className="text-[11px] font-extrabold uppercase tracking-wider flex items-center gap-1.5 text-emerald-700 dark:text-emerald-300">
                                <Sparkles size={14} /> 📖 Detailed Concept Explanation & Deep-Dive
                              </span>
                              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-600/15 text-emerald-800 dark:text-emerald-200">
                                {isExplainActive && isPlaying
                                  ? "🔊 Speaking Now"
                                  : "Click to Speak"}
                              </span>
                            </div>
                            <p className="text-xs sm:text-sm leading-relaxed">
                              {renderWordTrackedText(
                                explainUnit,
                                activeScene.detailedExplanation || activeScene.narration
                              )}
                            </p>
                          </div>
                        );
                      })()}

                      {/* 5. Formula / Golden Rule & Real-World Analogy Callouts */}
                      {(() => {
                        const ruleUnitIdx = trackedUnits.findIndex(
                          (u) => u.sectionType === "rule-analogy"
                        );
                        const isRuleActive = activeUnitIndex === ruleUnitIdx;

                        return (
                          <div
                            onClick={() => {
                              if (ruleUnitIdx >= 0) handleJumpToUnit(ruleUnitIdx);
                            }}
                            className={`grid grid-cols-1 sm:grid-cols-2 gap-3 cursor-pointer ${
                              isRuleActive ? "ring-2 ring-amber-400 rounded-2xl p-1" : ""
                            }`}
                          >
                            {activeScene.formulaOrKeyRule && (
                              <div
                                className={`p-3.5 rounded-xl border text-xs leading-relaxed ${themeStyles.ruleBox}`}
                              >
                                <div className="font-extrabold uppercase tracking-wider text-[10px] opacity-85 mb-1 flex items-center gap-1">
                                  <Sparkles size={12} /> Key Formula / Governing Rule
                                </div>
                                <div className="font-mono font-semibold">
                                  {activeScene.formulaOrKeyRule}
                                </div>
                              </div>
                            )}
                            {activeScene.realWorldAnalogy && (
                              <div
                                className={`p-3.5 rounded-xl border text-xs leading-relaxed ${themeStyles.analogyBox}`}
                              >
                                <div className="font-extrabold uppercase tracking-wider text-[10px] opacity-85 mb-1 flex items-center gap-1">
                                  <Lightbulb size={12} /> Real-World Practical Analogy
                                </div>
                                <div>{activeScene.realWorldAnalogy}</div>
                              </div>
                            )}
                          </div>
                        );
                      })()}
                    </div>

                    {/* Right 5 Columns: 6. 🔀 FULL INTERACTIVE ARCHITECTURE & PROCESS DIAGRAM + EXPLANATION */}
                    <div className="xl:col-span-5 space-y-4">
                      <div
                        className={`p-4 sm:p-5 rounded-2xl border shadow-md space-y-3.5 ${themeStyles.cardBg}`}
                      >
                        <div className="flex items-center justify-between border-b border-current/10 pb-2.5">
                          <div>
                            <span className="text-xs font-extrabold uppercase tracking-wider flex items-center gap-1.5 text-indigo-600 dark:text-indigo-400">
                              <Workflow size={15} /> 🔀 Interactive Architecture & Flow Diagram
                            </span>
                            <p className="text-[10px] opacity-75 mt-0.5">
                              Full stage breakdown (Click any stage box to hear its explanation)
                            </p>
                          </div>
                          <span className="text-[11px] font-mono font-bold px-2.5 py-1 rounded-lg bg-indigo-500/15 text-indigo-700 dark:text-indigo-300">
                            Stage {activeDiagramStepIndex + 1}/
                            {activeScene.diagramSteps?.length || 4}
                          </span>
                        </div>

                        {/* Untruncated Full-Text Flowchart Nodes with Directional Arrows */}
                        <div className="space-y-2">
                          {(activeScene.diagramSteps || []).map((stepText, sIdx) => {
                            const stepUnitIdx = trackedUnits.findIndex(
                              (u) =>
                                u.sectionType === "diagram-step" && u.itemIndex === sIdx
                            );
                            const stepUnit = trackedUnits[stepUnitIdx];
                            const isStepDone = sIdx <= activeDiagramStepIndex;
                            const isStepCurrent =
                              sIdx === activeDiagramStepIndex ||
                              (stepUnitIdx >= 0 && activeUnitIndex === stepUnitIdx);

                            // Split "Stage X: Title — Description" for clean visual hierarchy
                            const dashParts = stepText.split(/\s*[—–-]\s*/);
                            const stageHeading = dashParts[0] || `Stage ${sIdx + 1}`;
                            const stageDetail =
                              dashParts.length > 1
                                ? dashParts.slice(1).join(" — ")
                                : "";

                            return (
                              <div key={sIdx} className="space-y-1.5">
                                <motion.div
                                  onClick={() => {
                                    if (stepUnitIdx >= 0) handleJumpToUnit(stepUnitIdx);
                                  }}
                                  animate={
                                    isStepCurrent ? { scale: 1.01 } : { scale: 1 }
                                  }
                                  className={`p-3.5 rounded-xl border text-left transition-all cursor-pointer ${
                                    isStepCurrent
                                      ? "bg-gradient-to-r from-indigo-600 to-violet-600 text-white border-indigo-500 shadow-md ring-2 ring-amber-300"
                                      : isStepDone
                                      ? "bg-indigo-50/90 text-indigo-950 border-indigo-200 hover:border-indigo-400"
                                      : "bg-slate-100/75 text-slate-700 border-slate-200 hover:border-slate-300"
                                  }`}
                                >
                                  <div className="flex items-start gap-2.5">
                                    <span
                                      className={`w-6 h-6 rounded-full text-xs flex items-center justify-center shrink-0 font-extrabold mt-0.5 ${
                                        isStepCurrent
                                          ? "bg-amber-300 text-slate-900"
                                          : isStepDone
                                          ? "bg-indigo-600 text-white"
                                          : "bg-slate-300 text-slate-700"
                                      }`}
                                    >
                                      {sIdx + 1}
                                    </span>
                                    <div className="flex-1 min-w-0 space-y-1">
                                      {stepUnit && activeUnitIndex === stepUnitIdx ? (
                                        <p className="text-xs sm:text-[13px] leading-relaxed font-semibold">
                                          {renderWordTrackedText(
                                            stepUnit,
                                            stepText,
                                            "bg-amber-300 text-slate-950 font-extrabold px-1 rounded",
                                            "text-white font-semibold"
                                          )}
                                        </p>
                                      ) : (
                                        <>
                                          <p className="text-xs sm:text-[13px] font-extrabold leading-snug break-words">
                                            {stageHeading}
                                          </p>
                                          {stageDetail && (
                                            <p
                                              className={`text-[11px] sm:text-xs leading-relaxed break-words ${
                                                isStepCurrent
                                                  ? "text-indigo-100"
                                                  : "text-slate-600"
                                              }`}
                                            >
                                              {stageDetail}
                                            </p>
                                          )}
                                        </>
                                      )}
                                    </div>
                                  </div>
                                </motion.div>

                                {sIdx < (activeScene.diagramSteps?.length || 0) - 1 && (
                                  <div className="flex justify-center items-center py-0.5">
                                    <ArrowDown
                                      size={15}
                                      className={
                                        isStepDone
                                          ? "text-indigo-600 animate-bounce"
                                          : "text-slate-400"
                                      }
                                    />
                                  </div>
                                )}
                              </div>
                            );
                          })}
                        </div>

                        {/* Diagram Walkthrough Explanation Box */}
                        {(() => {
                          const diagExpIdx = trackedUnits.findIndex(
                            (u) => u.sectionType === "diagram-summary"
                          );
                          const diagExpUnit = trackedUnits[diagExpIdx];
                          const isDiagExpActive = activeUnitIndex === diagExpIdx;

                          return (
                            <div
                              onClick={() => {
                                if (diagExpIdx >= 0) handleJumpToUnit(diagExpIdx);
                              }}
                              className={`p-3.5 rounded-xl border text-xs leading-relaxed transition-all cursor-pointer ${
                                isDiagExpActive
                                  ? "bg-indigo-950 text-white border-amber-400 ring-2 ring-amber-400"
                                  : "bg-indigo-50/75 text-slate-800 border-indigo-200/80 hover:border-indigo-400"
                              }`}
                            >
                              <div className="font-extrabold uppercase tracking-wider text-[10px] text-indigo-700 dark:text-indigo-300 mb-1 flex items-center justify-between">
                                <span>📐 Diagram Explanation & Data Flow Walkthrough</span>
                                <span className="text-[9px] font-bold">
                                  {isDiagExpActive && isPlaying ? "🔊 Speaking" : "Click to Speak"}
                                </span>
                              </div>
                              <p className="leading-relaxed">
                                {renderWordTrackedText(
                                  diagExpUnit,
                                  activeScene.diagramExplanation || activeScene.graphicsPrompt
                                )}
                              </p>
                            </div>
                          );
                        })()}
                      </div>
                    </div>
                  </div>
                </motion.div>
              </AnimatePresence>
            </div>
          </div>

          {/* Player Media Controls Bar */}
          <div className="bg-[#1A1A14] text-white p-4 rounded-2xl border border-[#2D2D24] shadow-md space-y-3">
            {/* Timeline slider row */}
            <div className="flex items-center gap-3">
              <span className="text-xs font-mono select-none text-white/80">
                {formatTime(currentTotalTime)}
              </span>

              <div
                onClick={handleSeekBarClick}
                className="flex-1 bg-white/10 hover:bg-white/20 h-2.5 rounded-full cursor-pointer relative overflow-hidden transition-all group"
              >
                {scenes.map((_, idx) => {
                  if (idx === 0) return null;
                  const leftPercentage =
                    (getCumulativeDurationBeforeScene(idx) / totalVideoDuration) *
                    100;
                  return (
                    <div
                      key={idx}
                      className="absolute top-0 bottom-0 w-0.5 bg-black/70 z-20"
                      style={{ left: `${leftPercentage}%` }}
                    />
                  );
                })}

                <div
                  className="bg-gradient-to-r from-violet-500 via-indigo-500 to-amber-400 h-full absolute top-0 left-0 transition-all rounded-full"
                  style={{
                    width: `${Math.min(
                      100,
                      (currentTotalTime / totalVideoDuration) * 100
                    )}%`,
                  }}
                />
              </div>

              <span className="text-xs font-mono select-none text-white/80">
                {formatTime(totalVideoDuration)}
              </span>
            </div>

            {/* Controls Row */}
            <div className="flex flex-wrap items-center justify-between gap-4">
              {/* Playback Controls */}
              <div className="flex items-center gap-2.5">
                <button
                  type="button"
                  onClick={() => {
                    if (safeSceneIndex > 0) {
                      setCurrentSceneIndex(safeSceneIndex - 1);
                      setSceneProgress(0);
                      setSpokenGlobalWordIndex(null);
                    } else {
                      handleJumpSeconds(-10);
                    }
                  }}
                  className="p-1.5 hover:bg-white/10 rounded-full transition-colors text-white/80 hover:text-white cursor-pointer"
                  title="Previous Scene / Back 10s"
                >
                  <SkipBack size={18} />
                </button>

                <button
                  type="button"
                  onClick={() => setIsPlaying(!isPlaying)}
                  className="p-3 bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 rounded-full text-white transition-all transform hover:scale-105 active:scale-95 shadow-md flex items-center justify-center cursor-pointer"
                  title={isPlaying ? "Pause Lecture" : "Play Lecture"}
                >
                  {isPlaying ? (
                    <Pause size={20} fill="currentColor" />
                  ) : (
                    <Play size={20} fill="currentColor" className="ml-0.5" />
                  )}
                </button>

                <button
                  type="button"
                  onClick={() => {
                    if (safeSceneIndex < scenes.length - 1) {
                      setCurrentSceneIndex(safeSceneIndex + 1);
                      setSceneProgress(0);
                      setSpokenGlobalWordIndex(null);
                    } else {
                      handleJumpSeconds(10);
                    }
                  }}
                  className="p-1.5 hover:bg-white/10 rounded-full transition-colors text-white/80 hover:text-white cursor-pointer"
                  title="Next Scene / Forward 10s"
                >
                  <SkipForward size={18} />
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setCurrentSceneIndex(0);
                    setSceneProgress(0);
                    setSpokenGlobalWordIndex(null);
                    setIsPlaying(false);
                    if (typeof window !== "undefined" && window.speechSynthesis) {
                      window.speechSynthesis.cancel();
                    }
                  }}
                  className="p-1.5 hover:bg-white/10 rounded-full transition-colors text-white/60 hover:text-white cursor-pointer"
                  title="Restart Lecture"
                >
                  <RotateCcw size={16} />
                </button>
              </div>

              {/* Narrator Voice Settings */}
              <div className="flex flex-wrap items-center gap-2.5 bg-white/5 border border-white/10 px-3 py-1.5 rounded-xl">
                <button
                  type="button"
                  onClick={() => setIsVoiceEnabled(!isVoiceEnabled)}
                  className={`flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-lg transition-colors cursor-pointer ${
                    isVoiceEnabled
                      ? "bg-indigo-600 text-white"
                      : "bg-white/5 text-white/50 hover:bg-white/10"
                  }`}
                  title="Toggle Spoken Narrator Voice"
                >
                  <Volume2 size={13} />
                  <span>Voice: {isVoiceEnabled ? "ON" : "OFF"}</span>
                </button>

                {isVoiceEnabled && voices.length > 0 && (
                  <select
                    value={selectedVoiceName}
                    onChange={(e) => setSelectedVoiceName(e.target.value)}
                    className="bg-black text-white text-[10px] py-1 px-2 rounded border border-white/20 font-sans outline-none max-w-[140px]"
                    title="Select Narrator Voice Accent"
                  >
                    {voices.map((voice, idx) => (
                      <option key={idx} value={voice.name}>
                        {voice.name
                          .replace("Microsoft", "")
                          .replace("Google", "")
                          .trim()}
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
                  type="button"
                  onClick={() => setIsMusicEnabled(!isMusicEnabled)}
                  className={`p-2 rounded-xl transition-all cursor-pointer flex items-center gap-1.5 text-xs font-medium border ${
                    isMusicEnabled
                      ? "bg-indigo-600 border-indigo-500 text-white"
                      : "bg-white/5 border-white/10 text-white/70 hover:bg-white/10"
                  }`}
                  title="Toggle Soft Procedural Ambient Backing Beats"
                >
                  <Music
                    size={14}
                    className={isMusicEnabled && isPlaying ? "animate-spin" : ""}
                    style={{ animationDuration: "8s" }}
                  />
                  <span>Ambient Study Beats: {isMusicEnabled ? "ON" : "OFF"}</span>
                </button>

                <button
                  type="button"
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

        {/* Right Side: Interactive Outline, Quiz Checkpoints & Sentence-Tracked Transcript Panel */}
        {showSidebar && (
          <div className="lg:col-span-4 flex flex-col">
            <div className="bg-white border border-[#E0E0D5] rounded-[24px] shadow-[0_4px_20px_rgba(90,90,64,0.05)] overflow-hidden flex-1 flex flex-col">
              {/* Side Panel Tabs */}
              <div className="p-3 border-b border-[#E0E0D5] bg-[#FAF9F6] grid grid-cols-3 gap-1">
                <button
                  type="button"
                  onClick={() => setActiveSideTab("outline")}
                  className={`py-2 px-2 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                    activeSideTab === "outline"
                      ? "bg-[#5A5A40] text-white shadow-xs"
                      : "text-[#5A5A40] hover:bg-[#F0F0E8]"
                  }`}
                >
                  <ListVideo size={13} />
                  <span>Scenes ({totalScenes})</span>
                </button>
                <button
                  type="button"
                  onClick={() => setActiveSideTab("quiz")}
                  className={`py-2 px-2 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                    activeSideTab === "quiz"
                      ? "bg-[#5A5A40] text-white shadow-xs"
                      : "text-[#5A5A40] hover:bg-[#F0F0E8]"
                  }`}
                >
                  <HelpCircle size={13} />
                  <span>Scene Quiz</span>
                </button>
                <button
                  type="button"
                  onClick={() => setActiveSideTab("transcript")}
                  className={`py-2 px-2 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                    activeSideTab === "transcript"
                      ? "bg-[#5A5A40] text-white shadow-xs"
                      : "text-[#5A5A40] hover:bg-[#F0F0E8]"
                  }`}
                >
                  <FileText size={13} />
                  <span>Voice Track</span>
                </button>
              </div>

              {/* Tab 1: Scene Outline */}
              {activeSideTab === "outline" && (
                <div className="p-3 overflow-y-auto space-y-2 max-h-[680px] flex-1">
                  {scenes.map((scene, index) => {
                    const isActive = index === safeSceneIndex;
                    return (
                      <div
                        key={scene.sceneNumber || index}
                        onClick={() => {
                          setCurrentSceneIndex(index);
                          setSceneProgress(0);
                          setSpokenGlobalWordIndex(null);
                        }}
                        className={`p-3.5 rounded-xl border transition-all cursor-pointer text-left flex items-start gap-3 ${
                          isActive
                            ? "bg-[#5A5A40] border-[#5A5A40] text-white shadow-sm"
                            : "bg-[#FAF9F6] border-[#E0E0D5] text-[#3A3A2F] hover:bg-[#F0F0E8] hover:border-[#8A8A7A]"
                        }`}
                      >
                        <span
                          className={`text-[11px] font-bold py-0.5 px-2 rounded-full shrink-0 ${
                            isActive
                              ? "bg-white text-[#5A5A40]"
                              : "bg-[#F0F0E8] text-[#5A5A40]"
                          }`}
                        >
                          {index + 1}
                        </span>
                        <div className="space-y-1 overflow-hidden flex-1">
                          <p
                            className={`text-xs font-bold ${
                              isActive ? "text-white" : "text-[#3A3A2F]"
                            }`}
                          >
                            {scene.visualTitle}
                          </p>
                          <p
                            className={`text-[11px] line-clamp-2 leading-relaxed ${
                              isActive ? "text-white/85" : "text-[#8A8A7A]"
                            }`}
                          >
                            {scene.shortNotes || scene.bullets?.[0] || scene.narration}
                          </p>
                          <div className="flex items-center justify-between pt-1">
                            <span
                              className={`text-[10px] font-semibold flex items-center gap-1 ${
                                isActive ? "text-white/80" : "text-[#8A8A7A]"
                              }`}
                            >
                              <Clock size={10} />
                              {getSceneDuration(index)}s ({formatTime(getCumulativeDurationBeforeScene(index))})
                            </span>
                            {selectedAnswers[index] !== undefined && (
                              <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-300">
                                ✓ Quiz Done
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              {/* Tab 2: Interactive Scene Checkpoint Quiz */}
              {activeSideTab === "quiz" && activeScene.checkpointQuestion && (
                <div className="p-4 overflow-y-auto space-y-4 max-h-[680px] flex-1">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-extrabold uppercase tracking-wider px-2.5 py-1 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-200">
                      Scene {safeSceneIndex + 1} Knowledge Check
                    </span>
                    <span className="text-xs font-bold text-slate-500">
                      {Object.keys(selectedAnswers).length}/{totalScenes} Answered
                    </span>
                  </div>

                  <p className="text-sm font-bold text-slate-900 leading-snug">
                    {activeScene.checkpointQuestion.question}
                  </p>

                  <div className="space-y-2">
                    {activeScene.checkpointQuestion.options.map((opt, oIdx) => {
                      const chosen = selectedAnswers[safeSceneIndex];
                      const isSelected = chosen === oIdx;
                      const isCorrect =
                        oIdx === activeScene.checkpointQuestion!.answerIndex;
                      const showResult = chosen !== undefined;

                      return (
                        <button
                          key={oIdx}
                          type="button"
                          onClick={() =>
                            setSelectedAnswers((prev) => ({
                              ...prev,
                              [safeSceneIndex]: oIdx,
                            }))
                          }
                          className={`w-full text-left p-3 rounded-xl border text-xs font-medium transition-all cursor-pointer flex items-start gap-2.5 ${
                            showResult
                              ? isCorrect
                                ? "bg-emerald-50 border-emerald-400 text-emerald-950 font-bold"
                                : isSelected
                                ? "bg-rose-50 border-rose-300 text-rose-900"
                                : "bg-slate-50 border-slate-200 text-slate-500"
                              : "bg-[#FAF9F6] hover:bg-indigo-50/60 border-[#E0E0D5] hover:border-indigo-300 text-slate-800"
                          }`}
                        >
                          <span className="font-bold shrink-0">
                            {String.fromCharCode(65 + oIdx)}.
                          </span>
                          <span className="flex-1">{opt}</span>
                          {showResult && isCorrect && (
                            <CheckCircle2
                              size={15}
                              className="text-emerald-600 shrink-0 mt-0.5"
                            />
                          )}
                        </button>
                      );
                    })}
                  </div>

                  {selectedAnswers[safeSceneIndex] !== undefined && (
                    <div className="p-3 rounded-xl bg-amber-50 border border-amber-200 text-xs text-amber-950 space-y-1">
                      <p className="font-bold text-[11px] uppercase tracking-wider text-amber-800">
                        Explanation:
                      </p>
                      <p className="leading-relaxed">
                        {activeScene.checkpointQuestion.explanation}
                      </p>
                    </div>
                  )}
                </div>
              )}

              {/* Tab 3: Sentence-by-Sentence Voice Tracker List for Active Scene */}
              {activeSideTab === "transcript" && (
                <div className="p-3.5 overflow-y-auto space-y-2.5 max-h-[680px] flex-1">
                  <div className="flex items-center justify-between px-1">
                    <span className="text-[11px] font-extrabold uppercase tracking-wider text-indigo-700">
                      Scene {safeSceneIndex + 1} Sentence Tracker
                    </span>
                    <span className="text-[10px] text-slate-500">
                      Click any sentence to speak
                    </span>
                  </div>
                  {trackedUnits.map((unit, uIdx) => {
                    const isCurrent = uIdx === activeUnitIndex;
                    return (
                      <div
                        key={unit.id}
                        onClick={() => handleJumpToUnit(uIdx)}
                        className={`p-3 rounded-xl border transition-all cursor-pointer ${
                          isCurrent
                            ? "bg-indigo-50 border-indigo-400 shadow-xs ring-1 ring-indigo-400"
                            : "bg-slate-50/80 border-slate-200/80 hover:bg-slate-100"
                        }`}
                      >
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-[10px] font-extrabold text-indigo-700">
                            {unit.sectionLabel}
                          </span>
                          <span className="text-[10px] font-mono text-slate-500">
                            #{uIdx + 1}/{trackedUnits.length}
                          </span>
                        </div>
                        <p className="text-xs text-slate-800 leading-relaxed">
                          {renderWordTrackedText(unit, unit.text)}
                        </p>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
