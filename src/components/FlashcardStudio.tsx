import React, { useState, useEffect, useMemo, useRef, useCallback } from "react";
import {
  BookOpen,
  Volume2,
  VolumeX,
  Shuffle,
  Download,
  Star,
  CheckCircle2,
  RotateCcw,
  Maximize2,
  Minimize2,
  Copy,
  Check,
  Search,
  LayoutGrid,
  CreditCard,
  HelpCircle,
  ChevronLeft,
  ChevronRight,
  Flame,
  Award,
  Sparkles,
  ArrowRight,
  X
} from "lucide-react";

export interface FlashcardItem {
  term: string;
  definition: string;
}

interface FlashcardStudioProps {
  flashcards: FlashcardItem[];
  onUpdateFlashcards?: (cards: FlashcardItem[]) => void;
  isDarkMode?: boolean;
  onDownloadCSV?: () => void;
}

type StudyMode = "focus" | "grid" | "quiz";

interface CardState {
  isMastered?: boolean;
  needsReview?: boolean;
  isStarred?: boolean;
}

// Gentle synthetic tactile flip audio click using Web Audio API
const playTactileClick = (muted = false) => {
  if (muted || typeof window === "undefined") return;
  try {
    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioContextClass) return;
    const ctx = new AudioContextClass();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = "sine";
    osc.frequency.setValueAtTime(280, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(140, ctx.currentTime + 0.04);
    gain.gain.setValueAtTime(0.08, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.04);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + 0.045);
  } catch {
    // Ignore audio context errors gracefully
  }
};

interface PastelColorScheme {
  name: string;
  cardBg: string;
  cardBorder: string;
  badgeBg: string;
  badgeBorder: string;
  textPrimary: string;
  textSecondary: string;
  progressFill: string;
  buttonBg: string;
  buttonHover: string;
  softBg: string;
}

const SOLID_PASTEL_PALETTE: PastelColorScheme[] = [
  {
    name: "Pastel Rose",
    cardBg: "bg-[#FCE7F3]",
    cardBorder: "border-[#FBCFE8]",
    badgeBg: "bg-[#FBCFE8]",
    badgeBorder: "border-[#F9A8D4]",
    textPrimary: "text-[#831843]",
    textSecondary: "text-[#9D174D]",
    progressFill: "bg-[#DB2777]",
    buttonBg: "bg-[#FBCFE8]",
    buttonHover: "hover:bg-[#F9A8D4]",
    softBg: "bg-[#FDF2F8]"
  },
  {
    name: "Pastel Sky",
    cardBg: "bg-[#E0F2FE]",
    cardBorder: "border-[#BAE6FD]",
    badgeBg: "bg-[#BAE6FD]",
    badgeBorder: "border-[#7DD3FC]",
    textPrimary: "text-[#0C4A6E]",
    textSecondary: "text-[#0369A1]",
    progressFill: "bg-[#0284C7]",
    buttonBg: "bg-[#BAE6FD]",
    buttonHover: "hover:bg-[#7DD3FC]",
    softBg: "bg-[#F0F9FF]"
  },
  {
    name: "Pastel Mint",
    cardBg: "bg-[#DCFCE7]",
    cardBorder: "border-[#BBF7D0]",
    badgeBg: "bg-[#BBF7D0]",
    badgeBorder: "border-[#86EFAC]",
    textPrimary: "text-[#14532D]",
    textSecondary: "text-[#15803D]",
    progressFill: "bg-[#16A34A]",
    buttonBg: "bg-[#BBF7D0]",
    buttonHover: "hover:bg-[#86EFAC]",
    softBg: "bg-[#F0FDF4]"
  },
  {
    name: "Pastel Lavender",
    cardBg: "bg-[#F3E8FF]",
    cardBorder: "border-[#E9D5FF]",
    badgeBg: "bg-[#E9D5FF]",
    badgeBorder: "border-[#D8B4FE]",
    textPrimary: "text-[#4C1D95]",
    textSecondary: "text-[#6D28D9]",
    progressFill: "bg-[#7C3AED]",
    buttonBg: "bg-[#E9D5FF]",
    buttonHover: "hover:bg-[#D8B4FE]",
    softBg: "bg-[#FAF5FF]"
  },
  {
    name: "Pastel Butter",
    cardBg: "bg-[#FEF9C3]",
    cardBorder: "border-[#FEF08A]",
    badgeBg: "bg-[#FEF08A]",
    badgeBorder: "border-[#FDE047]",
    textPrimary: "text-[#713F12]",
    textSecondary: "text-[#A16207]",
    progressFill: "bg-[#CA8A04]",
    buttonBg: "bg-[#FEF08A]",
    buttonHover: "hover:bg-[#FDE047]",
    softBg: "bg-[#FEFCE8]"
  },
  {
    name: "Pastel Peach",
    cardBg: "bg-[#FFEDD5]",
    cardBorder: "border-[#FED7AA]",
    badgeBg: "bg-[#FED7AA]",
    badgeBorder: "border-[#FDBA74]",
    textPrimary: "text-[#7C2D12]",
    textSecondary: "text-[#C2410C]",
    progressFill: "bg-[#EA580C]",
    buttonBg: "bg-[#FED7AA]",
    buttonHover: "hover:bg-[#FDBA74]",
    softBg: "bg-[#FFF7ED]"
  },
  {
    name: "Pastel Aqua",
    cardBg: "bg-[#CCFBF1]",
    cardBorder: "border-[#99F6E4]",
    badgeBg: "bg-[#99F6E4]",
    badgeBorder: "border-[#5EEAD4]",
    textPrimary: "text-[#134E4A]",
    textSecondary: "text-[#0F766E]",
    progressFill: "bg-[#0D9488]",
    buttonBg: "bg-[#99F6E4]",
    buttonHover: "hover:bg-[#5EEAD4]",
    softBg: "bg-[#F0FDFA]"
  },
  {
    name: "Pastel Periwinkle",
    cardBg: "bg-[#E0E7FF]",
    cardBorder: "border-[#C7D2FE]",
    badgeBg: "bg-[#C7D2FE]",
    badgeBorder: "border-[#A5B4FC]",
    textPrimary: "text-[#312E81]",
    textSecondary: "text-[#4338CA]",
    progressFill: "bg-[#4F46E5]",
    buttonBg: "bg-[#C7D2FE]",
    buttonHover: "hover:bg-[#A5B4FC]",
    softBg: "bg-[#EEF2FF]"
  }
];

export const FlashcardStudio: React.FC<FlashcardStudioProps> = ({
  flashcards,
  onUpdateFlashcards,
  onDownloadCSV
}) => {
  const [mode, setMode] = useState<StudyMode>("focus");
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [showStarredOnly, setShowStarredOnly] = useState(false);
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);
  const [speakingSide, setSpeakingSide] = useState<"term" | "def" | null>(null);

  // Swipe / Drag state for smooth card sweeping
  const swipeStartXRef = useRef<number | null>(null);
  const swipeDeltaXRef = useRef<number>(0);
  const [dragOffsetX, setDragOffsetX] = useState(0);

  // Per-card status tracking (mastered, review, starred)
  const [cardStatus, setCardStatus] = useState<Record<number, CardState>>({});

  // Quiz Mode State
  const [quizQuestionIndex, setQuizQuestionIndex] = useState(0);
  const [quizSelectedOption, setQuizSelectedOption] = useState<string | null>(null);
  const [quizIsAnswered, setQuizIsAnswered] = useState(false);
  const [quizScore, setQuizScore] = useState(0);
  const [quizCompleted, setQuizCompleted] = useState(false);

  const containerRef = useRef<HTMLDivElement>(null);

  // Active cards filtered by star toggle
  const activeDeck = useMemo(() => {
    if (!showStarredOnly) return flashcards;
    return flashcards.filter((_, idx) => cardStatus[idx]?.isStarred);
  }, [flashcards, showStarredOnly, cardStatus]);

  // Safe index bounds
  const currentCard = activeDeck[currentIndex] || activeDeck[0];

  // Solid pastel color changes automatically whenever currentIndex (or quizQuestionIndex) changes
  const activePastel = useMemo(() => {
    const idx = mode === "quiz" ? quizQuestionIndex : currentIndex;
    return SOLID_PASTEL_PALETTE[idx % SOLID_PASTEL_PALETTE.length];
  }, [mode, currentIndex, quizQuestionIndex]);

  // Stats
  const masteredCount = useMemo(() => {
    return Object.values(cardStatus).filter((s) => s?.isMastered).length;
  }, [cardStatus]);

  const reviewCount = useMemo(() => {
    return Object.values(cardStatus).filter((s) => s?.needsReview).length;
  }, [cardStatus]);

  const starredCount = useMemo(() => {
    return Object.values(cardStatus).filter((s) => s?.isStarred).length;
  }, [cardStatus]);

  // Flip Card Action
  const toggleFlip = useCallback(() => {
    playTactileClick(!soundEnabled);
    setIsFlipped((prev) => !prev);
  }, [soundEnabled]);

  // Navigation Actions (loops or advances to change solid pastel color)
  const goToNext = useCallback(() => {
    if (activeDeck.length === 0) return;
    setIsFlipped(false);
    playTactileClick(!soundEnabled);
    setCurrentIndex((prev) => (prev < activeDeck.length - 1 ? prev + 1 : 0));
  }, [activeDeck.length, soundEnabled]);

  const goToPrev = useCallback(() => {
    if (activeDeck.length === 0) return;
    setIsFlipped(false);
    playTactileClick(!soundEnabled);
    setCurrentIndex((prev) => (prev > 0 ? prev - 1 : activeDeck.length - 1));
  }, [activeDeck.length, soundEnabled]);

  // Pointer / Touch Swipe Handlers
  const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    // Ignore clicks on action buttons inside the card
    if ((e.target as HTMLElement).closest("button")) return;
    swipeStartXRef.current = e.clientX;
    swipeDeltaXRef.current = 0;
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (swipeStartXRef.current === null) return;
    const deltaX = e.clientX - swipeStartXRef.current;
    swipeDeltaXRef.current = deltaX;
    if (Math.abs(deltaX) > 10) {
      setDragOffsetX(Math.max(-120, Math.min(120, deltaX * 0.45)));
    }
  };

  const handlePointerUp = () => {
    if (swipeStartXRef.current === null) return;
    const deltaX = swipeDeltaXRef.current;
    swipeStartXRef.current = null;
    swipeDeltaXRef.current = 0;
    setDragOffsetX(0);

    // Swipe threshold: 50px left -> Next card (new pastel color), 50px right -> Previous card
    if (deltaX < -50) {
      goToNext();
    } else if (deltaX > 50) {
      goToPrev();
    } else if (Math.abs(deltaX) < 10) {
      toggleFlip();
    }
  };

  // Card Status toggles
  const markMastered = useCallback(() => {
    if (!currentCard) return;
    const originalIndex = flashcards.indexOf(currentCard);
    if (originalIndex !== -1) {
      setCardStatus((prev) => ({
        ...prev,
        [originalIndex]: {
          ...prev[originalIndex],
          isMastered: true,
          needsReview: false
        }
      }));
    }
    goToNext();
  }, [currentCard, flashcards, goToNext]);

  const markNeedsReview = useCallback(() => {
    if (!currentCard) return;
    const originalIndex = flashcards.indexOf(currentCard);
    if (originalIndex !== -1) {
      setCardStatus((prev) => ({
        ...prev,
        [originalIndex]: {
          ...prev[originalIndex],
          isMastered: false,
          needsReview: true
        }
      }));
    }
    goToNext();
  }, [currentCard, flashcards, goToNext]);

  const toggleStar = useCallback((targetCard: FlashcardItem) => {
    const originalIndex = flashcards.indexOf(targetCard);
    if (originalIndex !== -1) {
      setCardStatus((prev) => ({
        ...prev,
        [originalIndex]: {
          ...prev[originalIndex],
          isStarred: !prev[originalIndex]?.isStarred
        }
      }));
    }
  }, [flashcards]);

  // Shuffle Deck
  const handleShuffle = useCallback(() => {
    if (!onUpdateFlashcards) return;
    playTactileClick(!soundEnabled);
    setIsFlipped(false);
    const shuffled = [...flashcards];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    onUpdateFlashcards(shuffled);
    setCurrentIndex(0);
  }, [flashcards, onUpdateFlashcards, soundEnabled]);

  // Text-To-Speech (Native Web Speech API)
  const speakText = useCallback((text: string, side: "term" | "def") => {
    if (typeof window === "undefined" || !("speechSynthesis" in window)) return;
    window.speechSynthesis.cancel();
    if (speakingSide === side) {
      setSpeakingSide(null);
      return;
    }
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = 0.95;
    utterance.pitch = 1.0;
    utterance.onend = () => setSpeakingSide(null);
    utterance.onerror = () => setSpeakingSide(null);
    setSpeakingSide(side);
    window.speechSynthesis.speak(utterance);
  }, [speakingSide]);

  // Copy single card
  const copyCard = useCallback((card: FlashcardItem, index: number) => {
    const text = `${card.term}\n---\n${card.definition}`;
    navigator.clipboard.writeText(text);
    setCopiedIndex(index);
    setTimeout(() => setCopiedIndex(null), 2000);
  }, []);

  // Copy entire deck formatted
  const copyAllCards = useCallback(() => {
    const text = flashcards
      .map((c, i) => `${i + 1}. ${c.term}\n   ${c.definition}`)
      .join("\n\n");
    navigator.clipboard.writeText(text);
    setCopiedIndex(-999);
    setTimeout(() => setCopiedIndex(null), 2000);
  }, [flashcards]);

  // Keyboard navigation shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (
        e.target instanceof HTMLInputElement ||
        e.target instanceof HTMLTextAreaElement ||
        e.target instanceof HTMLSelectElement
      ) {
        return;
      }

      if (mode !== "focus") return;

      if (e.code === "Space" || e.key === " " || e.key === "Enter") {
        e.preventDefault();
        toggleFlip();
      } else if (e.key === "ArrowLeft") {
        e.preventDefault();
        goToPrev();
      } else if (e.key === "ArrowRight") {
        e.preventDefault();
        goToNext();
      } else if (e.key === "1" || e.key.toLowerCase() === "r") {
        e.preventDefault();
        markNeedsReview();
      } else if (e.key === "2" || e.key.toLowerCase() === "m") {
        e.preventDefault();
        markMastered();
      } else if (e.key.toLowerCase() === "s") {
        e.preventDefault();
        handleShuffle();
      } else if (e.key.toLowerCase() === "f") {
        e.preventDefault();
        setIsFullscreen((prev) => !prev);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [mode, toggleFlip, goToPrev, goToNext, markNeedsReview, markMastered, handleShuffle]);

  // Fullscreen toggle handler
  const toggleFullscreen = () => {
    setIsFullscreen((prev) => !prev);
  };

  // Generate randomized options for Quiz Mode
  const quizQuestions = useMemo(() => {
    if (flashcards.length < 2) return [];
    return flashcards.map((card, idx) => {
      const wrongCandidates = flashcards
        .filter((_, i) => i !== idx)
        .map((c) => c.definition);
      const shuffledWrong = [...wrongCandidates].sort(() => 0.5 - Math.random());
      const selectedWrong = shuffledWrong.slice(0, 3);
      const options = [card.definition, ...selectedWrong].sort(() => 0.5 - Math.random());
      return {
        term: card.term,
        correctDefinition: card.definition,
        options
      };
    });
  }, [flashcards]);

  const handleQuizAnswer = (option: string) => {
    if (quizIsAnswered) return;
    setQuizSelectedOption(option);
    setQuizIsAnswered(true);
    const isCorrect = option === quizQuestions[quizQuestionIndex].correctDefinition;
    if (isCorrect) {
      setQuizScore((prev) => prev + 1);
    }
  };

  const handleNextQuizQuestion = () => {
    if (quizQuestionIndex < quizQuestions.length - 1) {
      setQuizQuestionIndex((prev) => prev + 1);
      setQuizSelectedOption(null);
      setQuizIsAnswered(false);
    } else {
      setQuizCompleted(true);
    }
  };

  const resetQuiz = () => {
    setQuizQuestionIndex(0);
    setQuizSelectedOption(null);
    setQuizIsAnswered(false);
    setQuizScore(0);
    setQuizCompleted(false);
  };

  // If no cards exist
  if (!flashcards || flashcards.length === 0) {
    return null;
  }

  // Filtered cards for Grid View
  const gridCards = flashcards
    .map((card, idx) => ({ ...card, originalIndex: idx }))
    .filter((card) => {
      const matchesSearch =
        card.term.toLowerCase().includes(searchQuery.toLowerCase()) ||
        card.definition.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesStar = showStarredOnly ? cardStatus[card.originalIndex]?.isStarred : true;
      return matchesSearch && matchesStar;
    });

  const originalCurrentIndex = currentCard ? flashcards.indexOf(currentCard) : -1;
  const currentCardStarred = originalCurrentIndex !== -1 && cardStatus[originalCurrentIndex]?.isStarred;
  const currentCardMastered = originalCurrentIndex !== -1 && cardStatus[originalCurrentIndex]?.isMastered;
  const currentCardReview = originalCurrentIndex !== -1 && cardStatus[originalCurrentIndex]?.needsReview;

  return (
    <div
      ref={containerRef}
      className={`w-full transition-colors duration-300 ${
        isFullscreen
          ? `fixed inset-0 z-50 p-6 md:p-10 overflow-y-auto ${activePastel.softBg} flex flex-col justify-between`
          : "space-y-6"
      }`}
    >
      {/* Top Header / Mode Switcher Toolbar */}
      <div
        className={`flex flex-col md:flex-row md:items-center justify-between gap-4 p-5 rounded-2xl border transition-colors duration-300 ${activePastel.cardBg} ${activePastel.cardBorder} shadow-sm`}
      >
        <div className="flex items-center gap-3">
          <div
            className={`w-10 h-10 rounded-xl flex items-center justify-center font-serif text-lg font-bold border transition-colors duration-300 ${activePastel.badgeBg} ${activePastel.textPrimary} ${activePastel.badgeBorder}`}
          >
            <BookOpen size={20} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className={`font-serif text-xl font-bold tracking-tight ${activePastel.textPrimary}`}>
                Interactive Flashcards
              </h3>
              <span className={`text-xs font-mono ${activePastel.textSecondary}`}>
                {flashcards.length} cards
              </span>
            </div>
            <p className={`text-xs ${activePastel.textSecondary}`}>
              {activePastel.name} · Swipe or click Next for a new solid pastel color
            </p>
          </div>
        </div>

        {/* Mode Switcher Buttons */}
        <div className="flex flex-wrap items-center gap-2">
          <div
            className={`flex items-center p-1 rounded-xl border transition-colors duration-300 ${activePastel.badgeBg} ${activePastel.badgeBorder}`}
          >
            <button
              onClick={() => setMode("focus")}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                mode === "focus"
                  ? `${activePastel.cardBg} ${activePastel.textPrimary} shadow-sm`
                  : `${activePastel.textSecondary} hover:opacity-80`
              }`}
            >
              <CreditCard size={14} />
              <span>Card Flip</span>
            </button>
            <button
              onClick={() => setMode("grid")}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                mode === "grid"
                  ? `${activePastel.cardBg} ${activePastel.textPrimary} shadow-sm`
                  : `${activePastel.textSecondary} hover:opacity-80`
              }`}
            >
              <LayoutGrid size={14} />
              <span>Deck Grid</span>
            </button>
            <button
              onClick={() => {
                setMode("quiz");
                resetQuiz();
              }}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                mode === "quiz"
                  ? `${activePastel.cardBg} ${activePastel.textPrimary} shadow-sm`
                  : `${activePastel.textSecondary} hover:opacity-80`
              }`}
            >
              <HelpCircle size={14} />
              <span>Quiz Mode</span>
            </button>
          </div>

          {/* Audio Sound FX Toggle */}
          <button
            onClick={() => setSoundEnabled((prev) => !prev)}
            className={`p-2 rounded-xl border text-xs transition-colors ${activePastel.buttonBg} ${activePastel.textPrimary} ${activePastel.badgeBorder} ${activePastel.buttonHover}`}
            title={soundEnabled ? "Mute flip sound" : "Enable tactile flip click"}
          >
            {soundEnabled ? <Volume2 size={15} /> : <VolumeX size={15} />}
          </button>

          {/* Fullscreen Toggle */}
          <button
            onClick={toggleFullscreen}
            className={`p-2 rounded-xl border text-xs transition-colors ${activePastel.buttonBg} ${activePastel.textPrimary} ${activePastel.badgeBorder} ${activePastel.buttonHover}`}
            title={isFullscreen ? "Exit Fullscreen" : "Fullscreen Focus"}
          >
            {isFullscreen ? <Minimize2 size={15} /> : <Maximize2 size={15} />}
          </button>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* MODE 1: SINGLE CARD FLIP FOCUS MODE                                       */}
      {/* ========================================================================= */}
      {mode === "focus" && (
        <div className="space-y-6 max-w-3xl mx-auto">
          {/* Progress & Stat Strip */}
          <div className={`flex items-center justify-between text-xs font-medium px-1 ${activePastel.textSecondary}`}>
            <div className="flex items-center gap-3">
              <span>
                Card <span className={`font-semibold ${activePastel.textPrimary}`}>{currentIndex + 1}</span> of{" "}
                <span className={`font-semibold ${activePastel.textPrimary}`}>{activeDeck.length}</span>
              </span>
              {starredCount > 0 && (
                <button
                  onClick={() => setShowStarredOnly((prev) => !prev)}
                  className={`flex items-center gap-1 px-2.5 py-0.5 rounded-lg border text-[11px] transition-colors ${
                    showStarredOnly
                      ? `${activePastel.badgeBg} ${activePastel.textPrimary} ${activePastel.badgeBorder} font-semibold`
                      : `${activePastel.cardBg} ${activePastel.textSecondary} ${activePastel.cardBorder}`
                  }`}
                >
                  <Star size={11} className={showStarredOnly ? "fill-current" : ""} />
                  <span>{showStarredOnly ? "Starred Only" : `${starredCount} Starred`}</span>
                </button>
              )}
            </div>

            <div className={`flex items-center gap-4 ${activePastel.textSecondary}`}>
              <span>{masteredCount} Mastered</span>
              <span>·</span>
              <span>{reviewCount} Review</span>
            </div>
          </div>

          {/* Solid Pastel Progress Bar */}
          <div className={`w-full h-2 rounded-full overflow-hidden transition-colors duration-300 ${activePastel.badgeBg}`}>
            <div
              className={`${activePastel.progressFill} h-full transition-all duration-300`}
              style={{ width: `${((currentIndex + 1) / Math.max(1, activeDeck.length)) * 100}%` }}
            />
          </div>

          {/* The Interactive 3D Flip & Swipe Card — Changes Solid Pastel Color on Next/Swipe */}
          <div
            onPointerDown={handlePointerDown}
            onPointerMove={handlePointerMove}
            onPointerUp={handlePointerUp}
            onPointerCancel={handlePointerUp}
            className="group cursor-pointer perspective-1000 w-full min-h-[380px] md:min-h-[420px] relative select-none touch-pan-y"
            style={{
              transform: dragOffsetX ? `translateX(${dragOffsetX}px)` : undefined,
              transition: dragOffsetX ? "none" : "transform 0.25s ease-out"
            }}
            role="button"
            tabIndex={0}
            aria-label="Flashcard. Click to flip or swipe left/right to change card"
          >
            <div
              className={`relative w-full min-h-[380px] md:min-h-[420px] transition-transform duration-500 transform-style-3d ${
                isFlipped ? "rotate-y-180" : ""
              }`}
            >
              {/* FRONT SIDE (Term) — Solid Pastel */}
              <div
                className={`absolute inset-0 backface-hidden rounded-3xl border-2 p-8 md:p-12 flex flex-col justify-between transition-colors duration-300 shadow-sm ${activePastel.cardBg} ${activePastel.cardBorder} ${activePastel.textPrimary}`}
              >
                <div className="flex items-center justify-between">
                  <div
                    className={`text-[11px] font-semibold tracking-wider uppercase px-3 py-1 rounded-lg border transition-colors duration-300 ${activePastel.badgeBg} ${activePastel.textSecondary} ${activePastel.badgeBorder}`}
                  >
                    Term · Card {currentIndex + 1} · {activePastel.name}
                  </div>

                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        speakText(currentCard?.term || "", "term");
                      }}
                      className={`p-2 rounded-xl transition-colors ${
                        speakingSide === "term"
                          ? `${activePastel.badgeBg} ${activePastel.textPrimary}`
                          : `${activePastel.textSecondary} ${activePastel.buttonHover}`
                      }`}
                      title="Read term aloud"
                    >
                      <Volume2 size={16} />
                    </button>

                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        if (currentCard) toggleStar(currentCard);
                      }}
                      className={`p-2 rounded-xl transition-colors ${activePastel.textSecondary} ${activePastel.buttonHover}`}
                      title={currentCardStarred ? "Unstar card" : "Star for later review"}
                    >
                      <Star
                        size={17}
                        className={currentCardStarred ? "fill-current" : ""}
                      />
                    </button>

                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        if (currentCard) copyCard(currentCard, currentIndex);
                      }}
                      className={`p-2 rounded-xl transition-colors ${activePastel.textSecondary} ${activePastel.buttonHover}`}
                      title="Copy card text"
                    >
                      {copiedIndex === currentIndex ? <Check size={16} /> : <Copy size={16} />}
                    </button>
                  </div>
                </div>

                {/* Central Term Content */}
                <div className="flex-1 flex flex-col items-center justify-center text-center px-4 py-8">
                  <h2 className={`font-serif text-3xl md:text-5xl font-bold leading-tight tracking-tight ${activePastel.textPrimary}`}>
                    {currentCard?.term}
                  </h2>
                </div>

                {/* Bottom Flip & Swipe Hint Bar */}
                <div className={`flex items-center justify-between pt-4 border-t ${activePastel.cardBorder} text-xs`}>
                  <div className="flex items-center gap-1.5">
                    <Sparkles size={13} className={activePastel.textSecondary} />
                    <span className={activePastel.textSecondary}>Click to flip · Swipe left/right for next card</span>
                  </div>

                  <div className="flex items-center gap-1 font-mono text-[11px]">
                    <span className={activePastel.textSecondary}>Flip to reveal definition &rarr;</span>
                  </div>
                </div>
              </div>

              {/* BACK SIDE (Definition) — Same Card Solid Pastel */}
              <div
                className={`absolute inset-0 backface-hidden rotate-y-180 rounded-3xl border-2 p-8 md:p-12 flex flex-col justify-between transition-colors duration-300 shadow-sm ${activePastel.cardBg} ${activePastel.cardBorder} ${activePastel.textPrimary}`}
              >
                <div className="flex items-center justify-between">
                  <div
                    className={`text-[11px] font-semibold tracking-wider uppercase px-3 py-1 rounded-lg border transition-colors duration-300 ${activePastel.badgeBg} ${activePastel.textSecondary} ${activePastel.badgeBorder}`}
                  >
                    Definition & Explanation · {activePastel.name}
                  </div>

                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        speakText(currentCard?.definition || "", "def");
                      }}
                      className={`p-2 rounded-xl transition-colors ${
                        speakingSide === "def"
                          ? `${activePastel.badgeBg} ${activePastel.textPrimary}`
                          : `${activePastel.textSecondary} ${activePastel.buttonHover}`
                      }`}
                      title="Read definition aloud"
                    >
                      <Volume2 size={16} />
                    </button>

                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        if (currentCard) toggleStar(currentCard);
                      }}
                      className={`p-2 rounded-xl transition-colors ${activePastel.textSecondary} ${activePastel.buttonHover}`}
                      title={currentCardStarred ? "Unstar card" : "Star card"}
                    >
                      <Star
                        size={17}
                        className={currentCardStarred ? "fill-current" : ""}
                      />
                    </button>

                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        if (currentCard) copyCard(currentCard, currentIndex);
                      }}
                      className={`p-2 rounded-xl transition-colors ${activePastel.textSecondary} ${activePastel.buttonHover}`}
                      title="Copy card text"
                    >
                      {copiedIndex === currentIndex ? <Check size={16} /> : <Copy size={16} />}
                    </button>
                  </div>
                </div>

                {/* Central Definition Body */}
                <div className="flex-1 flex flex-col items-center justify-center text-center px-4 py-6 overflow-y-auto max-h-[260px] no-scrollbar">
                  <p className={`text-lg md:text-xl font-medium leading-relaxed max-w-xl mx-auto ${activePastel.textPrimary}`}>
                    {currentCard?.definition}
                  </p>
                </div>

                {/* Bottom Flip Hint Bar */}
                <div className={`flex items-center justify-between pt-4 border-t ${activePastel.cardBorder} text-xs`}>
                  <span className={`text-[11px] ${activePastel.textSecondary}`}>
                    &larr; Click to see term · Swipe for next pastel card
                  </span>

                  <div className={`flex items-center gap-2 ${activePastel.textPrimary}`}>
                    {currentCardMastered && (
                      <span className="flex items-center gap-1 text-[11px] font-semibold">
                        <CheckCircle2 size={12} /> Mastered
                      </span>
                    )}
                    {currentCardReview && (
                      <span className="flex items-center gap-1 text-[11px] font-semibold">
                        <Flame size={12} /> Review
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Active Recall Mastery Rating Strip — Solid Pastel */}
          <div
            className={`p-3.5 rounded-2xl border transition-colors duration-300 ${activePastel.cardBg} ${activePastel.cardBorder} flex flex-col sm:flex-row items-center justify-between gap-3`}
          >
            <div className={`flex items-center gap-2 text-xs font-semibold ${activePastel.textPrimary}`}>
              <span>How well do you know this?</span>
              <span className={`hidden sm:inline font-normal text-[11px] ${activePastel.textSecondary}`}>
                (Press 1 or 2)
              </span>
            </div>

            <div className="flex items-center gap-2 w-full sm:w-auto">
              <button
                onClick={markNeedsReview}
                className={`flex-1 sm:flex-initial flex items-center justify-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold border transition-all ${
                  currentCardReview
                    ? `${activePastel.progressFill} text-white border-transparent shadow-sm`
                    : `${activePastel.buttonBg} ${activePastel.textPrimary} ${activePastel.badgeBorder} ${activePastel.buttonHover}`
                }`}
                title="Mark card as needing review (Shortcut: 1 or R)"
              >
                <Flame size={14} />
                <span>Need Review</span>
                <span className="hidden md:inline text-[10px] opacity-75">[1]</span>
              </button>

              <button
                onClick={markMastered}
                className={`flex-1 sm:flex-initial flex items-center justify-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold border transition-all ${
                  currentCardMastered
                    ? `${activePastel.progressFill} text-white border-transparent shadow-sm`
                    : `${activePastel.buttonBg} ${activePastel.textPrimary} ${activePastel.badgeBorder} ${activePastel.buttonHover}`
                }`}
                title="Mark card as mastered (Shortcut: 2 or M)"
              >
                <CheckCircle2 size={14} />
                <span>Mastered</span>
                <span className="hidden md:inline text-[10px] opacity-75">[2]</span>
              </button>
            </div>
          </div>

          {/* Primary Navigation Controls */}
          <div className="flex items-center justify-between pt-2">
            <button
              onClick={goToPrev}
              className={`flex items-center gap-2 px-5 py-2.5 rounded-xl border text-xs font-semibold transition-all ${activePastel.cardBg} ${activePastel.textPrimary} ${activePastel.cardBorder} ${activePastel.buttonHover} shadow-sm`}
            >
              <ChevronLeft size={16} />
              <span>Previous</span>
            </button>

            {/* Quick action buttons (Shuffle, Copy All, CSV) */}
            <div className="flex items-center gap-2">
              <button
                onClick={handleShuffle}
                className={`p-2.5 rounded-xl border text-xs font-semibold transition-colors ${activePastel.cardBg} ${activePastel.textPrimary} ${activePastel.cardBorder} ${activePastel.buttonHover}`}
                title="Shuffle cards (Shortcut: S)"
              >
                <Shuffle size={15} />
              </button>

              <button
                onClick={copyAllCards}
                className={`flex items-center gap-1 px-3 py-2 rounded-xl border text-xs font-semibold transition-colors ${activePastel.cardBg} ${activePastel.textPrimary} ${activePastel.cardBorder} ${activePastel.buttonHover}`}
                title="Copy all cards to clipboard"
              >
                {copiedIndex === -999 ? (
                  <>
                    <Check size={14} />
                    <span>Copied!</span>
                  </>
                ) : (
                  <>
                    <Copy size={14} />
                    <span className="hidden sm:inline">Copy All</span>
                  </>
                )}
              </button>

              {onDownloadCSV && (
                <button
                  onClick={onDownloadCSV}
                  className={`flex items-center gap-1 px-3 py-2 rounded-xl border text-xs font-semibold transition-colors ${activePastel.cardBg} ${activePastel.textPrimary} ${activePastel.cardBorder} ${activePastel.buttonHover}`}
                  title="Download CSV for Anki or Quizlet"
                >
                  <Download size={14} />
                  <span className="hidden sm:inline">Anki / CSV</span>
                </button>
              )}
            </div>

            <button
              onClick={goToNext}
              className={`flex items-center gap-2 px-5 py-2.5 rounded-xl border text-xs font-semibold transition-all ${activePastel.buttonBg} ${activePastel.textPrimary} ${activePastel.badgeBorder} ${activePastel.buttonHover} shadow-sm`}
            >
              <span>Next</span>
              <ChevronRight size={16} />
            </button>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODE 2: DECK GRID / BROWSE ALL CARDS                                      */}
      {/* ========================================================================= */}
      {mode === "grid" && (
        <div className="space-y-6">
          {/* Search & Filter Toolbar */}
          <div
            className={`flex flex-col sm:flex-row items-center justify-between gap-3 p-4 rounded-2xl border ${activePastel.cardBg} ${activePastel.cardBorder}`}
          >
            {/* Search Input */}
            <div className="relative w-full sm:w-80">
              <Search
                size={15}
                className={`absolute left-3.5 top-1/2 -translate-y-1/2 ${activePastel.textSecondary}`}
              />
              <input
                type="text"
                placeholder="Search term or concept..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className={`w-full pl-9 pr-8 py-2 rounded-xl text-xs outline-none border transition-colors ${activePastel.softBg} ${activePastel.cardBorder} ${activePastel.textPrimary}`}
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery("")}
                  className={`absolute right-2.5 top-1/2 -translate-y-1/2 ${activePastel.textSecondary}`}
                >
                  <X size={14} />
                </button>
              )}
            </div>

            {/* Filter buttons */}
            <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
              <button
                onClick={() => setShowStarredOnly((prev) => !prev)}
                className={`flex items-center gap-1.5 px-3 py-2 rounded-xl border text-xs font-semibold transition-all ${
                  showStarredOnly
                    ? `${activePastel.buttonBg} ${activePastel.textPrimary} ${activePastel.badgeBorder}`
                    : `${activePastel.cardBg} ${activePastel.textPrimary} ${activePastel.cardBorder} ${activePastel.buttonHover}`
                }`}
              >
                <Star
                  size={13}
                  className={showStarredOnly ? "fill-current" : ""}
                />
                <span>Starred ({starredCount})</span>
              </button>

              <button
                onClick={handleShuffle}
                className={`flex items-center gap-1.5 px-3 py-2 rounded-xl border text-xs font-semibold transition-all ${activePastel.buttonBg} ${activePastel.textPrimary} ${activePastel.badgeBorder} ${activePastel.buttonHover}`}
              >
                <Shuffle size={13} />
                <span>Shuffle</span>
              </button>

              {onDownloadCSV && (
                <button
                  onClick={onDownloadCSV}
                  className={`flex items-center gap-1.5 px-3 py-2 rounded-xl border text-xs font-semibold transition-all ${activePastel.buttonBg} ${activePastel.textPrimary} ${activePastel.badgeBorder} ${activePastel.buttonHover}`}
                >
                  <Download size={13} />
                  <span>CSV</span>
                </button>
              )}
            </div>
          </div>

          {/* Cards Grid — Each Card Has Its Distinct Solid Pastel Color */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {gridCards.map((card) => {
              const cardPastel =
                SOLID_PASTEL_PALETTE[card.originalIndex % SOLID_PASTEL_PALETTE.length];
              const isCardStarred = cardStatus[card.originalIndex]?.isStarred;
              const isCardMastered = cardStatus[card.originalIndex]?.isMastered;
              const isCardReview = cardStatus[card.originalIndex]?.needsReview;

              return (
                <div
                  key={card.originalIndex}
                  className={`p-6 rounded-2xl border-2 transition-all flex flex-col justify-between group shadow-sm ${cardPastel.cardBg} ${cardPastel.cardBorder}`}
                >
                  <div>
                    <div className="flex items-center justify-between mb-3 text-xs">
                      <span className={`font-mono text-[11px] font-semibold ${cardPastel.textSecondary}`}>
                        #{card.originalIndex + 1} · {cardPastel.name}
                      </span>
                      <div className={`flex items-center gap-1.5 ${cardPastel.textPrimary}`}>
                        {isCardMastered && (
                          <span className="flex items-center gap-1 text-[10px] font-semibold">
                            <CheckCircle2 size={11} /> Mastered
                          </span>
                        )}
                        {isCardReview && (
                          <span className="flex items-center gap-1 text-[10px] font-semibold">
                            <Flame size={11} /> Review
                          </span>
                        )}
                        <button
                          onClick={() => toggleStar(card)}
                          className={`p-1 transition-colors ${cardPastel.textSecondary}`}
                        >
                          <Star
                            size={15}
                            className={isCardStarred ? "fill-current" : ""}
                          />
                        </button>
                      </div>
                    </div>

                    {/* Term */}
                    <h4 className={`font-serif text-lg font-bold mb-2 leading-snug ${cardPastel.textPrimary}`}>
                      {card.term}
                    </h4>

                    {/* Definition */}
                    <p className={`text-xs leading-relaxed line-clamp-4 ${cardPastel.textSecondary}`}>
                      {card.definition}
                    </p>
                  </div>

                  {/* Card bottom actions */}
                  <div className={`pt-4 mt-4 border-t ${cardPastel.cardBorder} flex items-center justify-between`}>
                    <button
                      onClick={() => {
                        const targetIdx = activeDeck.findIndex(
                          (c) => c.term === card.term && c.definition === card.definition
                        );
                        if (targetIdx !== -1) setCurrentIndex(targetIdx);
                        setMode("focus");
                      }}
                      className={`text-xs font-semibold hover:underline flex items-center gap-1 transition-colors ${cardPastel.textPrimary}`}
                    >
                      <span>Study this card</span>
                      <ArrowRight size={12} />
                    </button>

                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => speakText(card.term, "term")}
                        className={`p-1.5 rounded-lg transition-colors ${cardPastel.textSecondary} ${cardPastel.buttonHover}`}
                        title="Read aloud"
                      >
                        <Volume2 size={13} />
                      </button>
                      <button
                        onClick={() => copyCard(card, card.originalIndex)}
                        className={`p-1.5 rounded-lg transition-colors ${cardPastel.textSecondary} ${cardPastel.buttonHover}`}
                        title="Copy"
                      >
                        {copiedIndex === card.originalIndex ? <Check size={13} /> : <Copy size={13} />}
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {gridCards.length === 0 && (
            <div
              className={`p-12 text-center text-sm rounded-2xl border border-dashed ${activePastel.textSecondary} ${activePastel.cardBg} ${activePastel.cardBorder}`}
            >
              No flashcards match your search filter.
            </div>
          )}
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODE 3: QUICK QUIZ / MULTIPLE-CHOICE TEST MODE                           */}
      {/* ========================================================================= */}
      {mode === "quiz" && (
        <div className="max-w-2xl mx-auto space-y-6">
          {!quizCompleted && quizQuestions.length > 0 ? (
            <div
              className={`p-8 rounded-3xl border-2 transition-colors duration-300 ${activePastel.cardBg} ${activePastel.cardBorder}`}
            >
              {/* Quiz progress */}
              <div className={`flex items-center justify-between mb-6 text-xs ${activePastel.textSecondary}`}>
                <span className="font-semibold uppercase tracking-wider">
                  Question {quizQuestionIndex + 1} of {quizQuestions.length} · {activePastel.name}
                </span>
                <span className="font-mono">Score: {quizScore} / {quizQuestions.length}</span>
              </div>

              {/* Progress Bar */}
              <div className={`w-full h-2 rounded-full overflow-hidden mb-8 ${activePastel.badgeBg}`}>
                <div
                  className={`${activePastel.progressFill} h-full transition-all duration-300`}
                  style={{
                    width: `${((quizQuestionIndex + 1) / quizQuestions.length) * 100}%`
                  }}
                />
              </div>

              {/* Question: Term */}
              <div className="text-center mb-8">
                <span className={`text-[11px] font-semibold uppercase tracking-widest mb-2 block ${activePastel.textSecondary}`}>
                  Match the Definition
                </span>
                <h3 className={`font-serif text-3xl font-bold leading-tight ${activePastel.textPrimary}`}>
                  "{quizQuestions[quizQuestionIndex]?.term}"
                </h3>
              </div>

              {/* Multiple Choice Options */}
              <div className="space-y-3 mb-8">
                {quizQuestions[quizQuestionIndex]?.options.map((option, idx) => {
                  const isSelected = quizSelectedOption === option;
                  const isCorrect =
                    option === quizQuestions[quizQuestionIndex]?.correctDefinition;

                  let optionStyles = `${activePastel.softBg} ${activePastel.cardBorder} ${activePastel.textPrimary} ${activePastel.buttonHover}`;

                  if (quizIsAnswered) {
                    if (isCorrect) {
                      optionStyles = `${activePastel.badgeBg} ${activePastel.badgeBorder} ${activePastel.textPrimary} font-bold`;
                    } else if (isSelected && !isCorrect) {
                      optionStyles = `${activePastel.softBg} ${activePastel.cardBorder} ${activePastel.textSecondary} line-through opacity-75`;
                    } else {
                      optionStyles = `${activePastel.softBg} ${activePastel.cardBorder} ${activePastel.textSecondary} opacity-50`;
                    }
                  }

                  return (
                    <button
                      key={idx}
                      onClick={() => handleQuizAnswer(option)}
                      disabled={quizIsAnswered}
                      className={`w-full text-left p-4 rounded-xl border text-xs leading-relaxed transition-all flex items-start gap-3 ${optionStyles}`}
                    >
                      <span className="w-5 h-5 rounded-full border border-current flex items-center justify-center shrink-0 text-[10px] font-mono mt-0.5">
                        {String.fromCharCode(65 + idx)}
                      </span>
                      <span className="flex-1">{option}</span>
                      {quizIsAnswered && isCorrect && (
                        <CheckCircle2 size={16} className={`${activePastel.textPrimary} shrink-0 mt-0.5`} />
                      )}
                    </button>
                  );
                })}
              </div>

              {/* Next Question / Continue Button */}
              {quizIsAnswered && (
                <div className="flex justify-end">
                  <button
                    onClick={handleNextQuizQuestion}
                    className={`flex items-center gap-2 px-6 py-2.5 rounded-xl text-xs font-semibold border transition-colors ${activePastel.buttonBg} ${activePastel.textPrimary} ${activePastel.badgeBorder} ${activePastel.buttonHover}`}
                  >
                    <span>
                      {quizQuestionIndex < quizQuestions.length - 1
                        ? "Next Question"
                        : "Finish Quiz"}
                    </span>
                    <ArrowRight size={14} />
                  </button>
                </div>
              )}
            </div>
          ) : (
            /* Quiz Completed Celebration Card */
            <div className={`p-10 rounded-3xl border-2 text-center ${activePastel.cardBg} ${activePastel.cardBorder}`}>
              <div
                className={`w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4 ${activePastel.badgeBg} ${activePastel.textPrimary}`}
              >
                <Award size={36} />
              </div>
              <h3 className={`font-serif text-2xl font-bold mb-2 ${activePastel.textPrimary}`}>
                Quiz Completed!
              </h3>
              <p className={`text-sm mb-6 ${activePastel.textSecondary}`}>
                You scored{" "}
                <span className={`font-bold font-mono ${activePastel.textPrimary}`}>
                  {quizScore}
                </span>{" "}
                out of{" "}
                <span className={`font-bold font-mono ${activePastel.textPrimary}`}>
                  {quizQuestions.length}
                </span>{" "}
                ({quizQuestions.length > 0 ? Math.round((quizScore / quizQuestions.length) * 100) : 0}%)
              </p>

              <div className="flex items-center justify-center gap-3">
                <button
                  onClick={resetQuiz}
                  className={`flex items-center gap-1.5 px-5 py-2.5 rounded-xl border text-xs font-semibold transition-colors ${activePastel.softBg} ${activePastel.textPrimary} ${activePastel.cardBorder} ${activePastel.buttonHover}`}
                >
                  <RotateCcw size={14} />
                  <span>Retake Quiz</span>
                </button>
                <button
                  onClick={() => setMode("focus")}
                  className={`flex items-center gap-1.5 px-5 py-2.5 rounded-xl border text-xs font-semibold transition-colors ${activePastel.buttonBg} ${activePastel.textPrimary} ${activePastel.badgeBorder} ${activePastel.buttonHover}`}
                >
                  <span>Review Flashcards</span>
                  <ArrowRight size={14} />
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
