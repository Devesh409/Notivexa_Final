import React, { useMemo, useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  Sparkles,
  FileQuestion,
  GraduationCap,
  Layers,
  BookOpen,
  ClipboardCheck,
  Presentation,
  FileVideo,
  Calendar,
  Zap,
  Calculator,
  MessageSquare,
  Network,
  FileText,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  ArrowRight,
  Loader2,
  Lightbulb,
  BookMarked,
} from "lucide-react";
import type { DigitalScanReport, DocMultiFunctionId } from "./DigitalDocumentScannerHub";

export interface UploadedBookSuggestionAction {
  type:
    | "questions-short"
    | "questions-long"
    | "questions-viva"
    | "questions-assessment"
    | "question-bank-all"
    | "question-bank-mcq"
    | "question-bank-short"
    | "question-bank-long"
    | "flashcards"
    | "exam-paper-full"
    | "exam-paper-university"
    | "exam-paper-mcq"
    | "notes"
    | "cheat-sheet"
    | "formula-sheet"
    | "executive-summary"
    | "verbatim-handwriting"
    | "ppt"
    | "video"
    | "lesson-plan"
    | "mindmap-atlas"
    | "batch-pack";
  focusTopic?: string;
  unit?: string;
}

interface UploadedBookSuggestionsPanelProps {
  bookTitle: string;
  scanReport: DigitalScanReport | null;
  detectedUnits: Array<{
    unit: string;
    title: string;
    chapters: Array<{ chapter: string; title: string }>;
  }>;
  activeFocusArea: string;
  onSelectFocusArea: (topic: string) => void;
  onRunSuggestion: (action: UploadedBookSuggestionAction) => void;
  onTriggerMultiFunction?: (funcId: DocMultiFunctionId) => void;
  isGenerating: boolean;
  generatingType: string;
  generatedFunctionsList: string[];
  isDarkMode?: boolean;
  compact?: boolean;
}

export const UploadedBookSuggestionsPanel: React.FC<UploadedBookSuggestionsPanelProps> = ({
  bookTitle,
  scanReport,
  detectedUnits,
  activeFocusArea,
  onSelectFocusArea,
  onRunSuggestion,
  isGenerating,
  generatingType,
  generatedFunctionsList,
  isDarkMode = false,
  compact = false,
}) => {
  const [isExpanded, setIsExpanded] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState<
    "all" | "questions" | "question-bank" | "flashcards" | "notes-visual"
  >("all");

  const cleanTitle = useMemo(() => {
    return (
      scanReport?.documentTitle ||
      bookTitle
        .replace(/^\[Library Book\]\s*/i, "")
        .replace(/\.[^/.]+$/, "")
        .replace(/[_-]+/g, " ")
        .trim() ||
      "Uploaded Book"
    );
  }, [bookTitle, scanReport?.documentTitle]);

  const topicsList = useMemo(() => {
    const rawTopics = scanReport?.detectedTopics || [];
    const unitTitles = (detectedUnits || []).map((u) => `${u.unit}: ${u.title}`);
    const combined = Array.from(new Set([...rawTopics, ...unitTitles])).filter(Boolean);
    if (combined.length > 0) return combined.slice(0, 10);
    return [
      "Core Concepts & Definitions",
      "Unit 1: Fundamental Principles",
      "Important Architectures & Diagrams",
      "Mathematical Models & Derivations",
      "University Exam High-Yield Topics",
    ];
  }, [scanReport?.detectedTopics, detectedUnits]);

  const smartBookPromptChips = useMemo(() => {
    const firstTopic = topicsList[0] || "Core Concepts";
    const secondTopic = topicsList[1] || firstTopic;
    return [
      {
        id: "chip-q-gen",
        badge: "Question Generation",
        label: `Generate 5-Mark Important Questions + Diagrams on "${firstTopic}"`,
        icon: FileQuestion,
        tone: "emerald",
        action: { type: "questions-short" as const, focusTopic: activeFocusArea || firstTopic },
      },
      {
        id: "chip-qb-all",
        badge: "Question Bank",
        label: `Generate Complete Question Bank (MCQs, Short & Long) for "${cleanTitle}"`,
        icon: GraduationCap,
        tone: "violet",
        action: { type: "question-bank-all" as const, focusTopic: activeFocusArea },
      },
      {
        id: "chip-qb-mcq",
        badge: "MCQ Bank",
        label: `Generate 50+ Multiple Choice Questions (MCQs) from "${cleanTitle}"`,
        icon: ClipboardCheck,
        tone: "teal",
        action: { type: "question-bank-mcq" as const, focusTopic: activeFocusArea },
      },
      {
        id: "chip-flashcards",
        badge: "Flashcards",
        label: `Generate Active-Recall Flashcards for "${cleanTitle}"`,
        icon: Layers,
        tone: "amber",
        action: { type: "flashcards" as const, focusTopic: activeFocusArea },
      },
      {
        id: "chip-exam-paper",
        badge: "Exam Paper",
        label: `Create University Exam Question Paper (CO/BT Mapped) for "${cleanTitle}"`,
        icon: ClipboardCheck,
        tone: "blue",
        action: { type: "exam-paper-university" as const, focusTopic: activeFocusArea },
      },
      {
        id: "chip-notes",
        badge: "Handwritten Notes",
        label: `Generate Chapter-Wise Handwritten Study Notes on "${secondTopic}"`,
        icon: BookOpen,
        tone: "orange",
        action: { type: "notes" as const, focusTopic: activeFocusArea || secondTopic },
      },
    ];
  }, [cleanTitle, topicsList, activeFocusArea]);

  if (compact) {
    return (
      <div
        className={`rounded-2xl border p-3 transition-all ${
          isDarkMode
            ? "bg-gradient-to-br from-[#232530] via-[#22221F] to-[#1E242B] border-indigo-500/40"
            : "bg-gradient-to-br from-indigo-50/90 via-sky-50/70 to-emerald-50/60 border-indigo-200/90 shadow-xs"
        }`}
      >
        <div className="flex items-center justify-between gap-2 mb-2">
          <div className="flex items-center gap-1.5 min-w-0">
            <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-lg bg-gradient-to-r from-indigo-600 to-sky-600 text-white shadow-2xs">
              <Lightbulb size={13} />
            </span>
            <div className="min-w-0">
              <p
                className={`text-[11px] font-extrabold leading-tight truncate ${
                  isDarkMode ? "text-[#F5F5F0]" : "text-slate-900"
                }`}
              >
                Smart Book Suggestions
              </p>
              <p className="text-[9px] text-indigo-600 dark:text-indigo-300 font-semibold truncate">
                Recommended for {cleanTitle}
              </p>
            </div>
          </div>
          <span className="px-1.5 py-0.5 rounded-full text-[8px] font-extrabold uppercase tracking-wider bg-indigo-600 text-white shrink-0">
            AI Ready
          </span>
        </div>

        <div className="grid grid-cols-2 gap-1.5">
          <button
            type="button"
            disabled={isGenerating}
            onClick={() => onRunSuggestion({ type: "questions-short", focusTopic: activeFocusArea })}
            className={`p-2 rounded-xl border text-left transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-50 ${
              isDarkMode
                ? "bg-[#1E2028] border-emerald-500/35 hover:border-emerald-400 text-emerald-300"
                : "bg-white border-emerald-200 hover:bg-emerald-50 text-emerald-800"
            }`}
          >
            <FileQuestion size={13} className="shrink-0 text-emerald-600 dark:text-emerald-400" />
            <div className="min-w-0">
              <span className="block text-[10px] font-extrabold leading-tight truncate">
                Question Gen
              </span>
              <span className="block text-[8px] opacity-75 truncate">5M & 10M Q&A</span>
            </div>
          </button>

          <button
            type="button"
            disabled={isGenerating}
            onClick={() => onRunSuggestion({ type: "question-bank-all", focusTopic: activeFocusArea })}
            className={`p-2 rounded-xl border text-left transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-50 ${
              isDarkMode
                ? "bg-[#1E2028] border-violet-500/35 hover:border-violet-400 text-violet-300"
                : "bg-white border-violet-200 hover:bg-violet-50 text-violet-800"
            }`}
          >
            <GraduationCap size={13} className="shrink-0 text-violet-600 dark:text-violet-400" />
            <div className="min-w-0">
              <span className="block text-[10px] font-extrabold leading-tight truncate">
                Question Bank
              </span>
              <span className="block text-[8px] opacity-75 truncate">MCQ + Short + Long</span>
            </div>
          </button>

          <button
            type="button"
            disabled={isGenerating}
            onClick={() => onRunSuggestion({ type: "flashcards", focusTopic: activeFocusArea })}
            className={`p-2 rounded-xl border text-left transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-50 ${
              isDarkMode
                ? "bg-[#1E2028] border-amber-500/35 hover:border-amber-400 text-amber-300"
                : "bg-white border-amber-200 hover:bg-amber-50 text-amber-800"
            }`}
          >
            <Layers size={13} className="shrink-0 text-amber-600 dark:text-amber-400" />
            <div className="min-w-0">
              <span className="block text-[10px] font-extrabold leading-tight truncate">
                Flashcards
              </span>
              <span className="block text-[8px] opacity-75 truncate">Active Recall Deck</span>
            </div>
          </button>

          <button
            type="button"
            disabled={isGenerating}
            onClick={() => onRunSuggestion({ type: "exam-paper-university", focusTopic: activeFocusArea })}
            className={`p-2 rounded-xl border text-left transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-50 ${
              isDarkMode
                ? "bg-[#1E2028] border-sky-500/35 hover:border-sky-400 text-sky-300"
                : "bg-white border-sky-200 hover:bg-sky-50 text-sky-800"
            }`}
          >
            <ClipboardCheck size={13} className="shrink-0 text-sky-600 dark:text-sky-400" />
            <div className="min-w-0">
              <span className="block text-[10px] font-extrabold leading-tight truncate">
                Exam Paper
              </span>
              <span className="block text-[8px] opacity-75 truncate">University Paper</span>
            </div>
          </button>

          <button
            type="button"
            disabled={isGenerating}
            onClick={() => onRunSuggestion({ type: "notes", focusTopic: activeFocusArea })}
            className={`p-2 rounded-xl border text-left transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-50 ${
              isDarkMode
                ? "bg-[#1E2028] border-orange-500/35 hover:border-orange-400 text-orange-300"
                : "bg-white border-orange-200 hover:bg-orange-50 text-orange-800"
            }`}
          >
            <BookOpen size={13} className="shrink-0 text-orange-600 dark:text-orange-400" />
            <div className="min-w-0">
              <span className="block text-[10px] font-extrabold leading-tight truncate">
                Study Notes
              </span>
              <span className="block text-[8px] opacity-75 truncate">Handwritten A4</span>
            </div>
          </button>

          <button
            type="button"
            disabled={isGenerating}
            onClick={() => onRunSuggestion({ type: "ppt", focusTopic: activeFocusArea })}
            className={`p-2 rounded-xl border text-left transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-50 ${
              isDarkMode
                ? "bg-[#1E2028] border-pink-500/35 hover:border-pink-400 text-pink-300"
                : "bg-white border-pink-200 hover:bg-pink-50 text-pink-800"
            }`}
          >
            <Presentation size={13} className="shrink-0 text-pink-600 dark:text-pink-400" />
            <div className="min-w-0">
              <span className="block text-[10px] font-extrabold leading-tight truncate">
                PPT & Video
              </span>
              <span className="block text-[8px] opacity-75 truncate">Slide Deck</span>
            </div>
          </button>
        </div>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className={`rounded-3xl border shadow-md overflow-hidden transition-all mb-5 ${
        isDarkMode
          ? "bg-gradient-to-br from-[#20222B] via-[#1E1E1B] to-[#1D2428] border-indigo-500/40 text-[#F5F5F0]"
          : "bg-gradient-to-br from-white via-indigo-50/35 to-sky-50/45 border-indigo-200/90 text-slate-900 shadow-indigo-500/5"
      }`}
    >
      {/* Top Accent Ribbon */}
      <div className="h-1.5 w-full bg-gradient-to-r from-indigo-600 via-emerald-500 to-amber-500" />

      {/* Header Bar */}
      <div className="p-4 sm:p-5 flex flex-wrap items-center justify-between gap-3 border-b border-slate-200/70 dark:border-[#383832]">
        <div className="flex items-start sm:items-center gap-3 min-w-0">
          <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-indigo-600 via-violet-600 to-sky-600 text-white flex items-center justify-center shadow-md shadow-indigo-500/20 shrink-0">
            <Lightbulb size={22} />
          </div>
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wider bg-indigo-600 text-white shadow-2xs">
                <Sparkles size={11} /> Uploaded Book Smart Suggestions
              </span>
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border border-emerald-500/30">
                <CheckCircle2 size={11} /> Book Analyzed & Ready
              </span>
              {activeFocusArea && (
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/15 text-amber-700 dark:text-amber-300 border border-amber-500/30 max-w-xs truncate">
                  Target: {activeFocusArea}
                </span>
              )}
            </div>
            <h3 className="font-serif text-base sm:text-lg font-bold mt-1 truncate">
              Recommended Study & Exam Generations for &ldquo;{cleanTitle}&rdquo;
            </h3>
            <p className={`text-xs ${isDarkMode ? "text-[#A1A194]" : "text-slate-600"}`}>
              One-click AI suggestions tailored to your uploaded book: generate{" "}
              <strong>Questions</strong>, <strong>Question Banks (MCQ/Short/Long)</strong>,{" "}
              <strong>Flashcards</strong>, <strong>University Exam Papers</strong>, and{" "}
              <strong>Handwritten Chapter Notes</strong>.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button
            type="button"
            disabled={isGenerating}
            onClick={() => onRunSuggestion({ type: "batch-pack", focusTopic: activeFocusArea })}
            className="px-3.5 py-2 rounded-xl bg-gradient-to-r from-indigo-600 via-violet-600 to-fuchsia-600 hover:from-indigo-700 hover:to-fuchsia-700 text-white text-xs font-bold flex items-center gap-1.5 shadow-sm transition-all cursor-pointer disabled:opacity-50"
          >
            {isGenerating ? <Loader2 size={14} className="animate-spin" /> : <Zap size={14} />}
            <span>⚡ 4-in-1 Complete Book Pack</span>
          </button>

          <button
            type="button"
            onClick={() => setIsExpanded((prev) => !prev)}
            className={`px-3 py-2 rounded-xl border text-xs font-bold flex items-center gap-1 transition-all cursor-pointer ${
              isDarkMode
                ? "border-[#45453B] bg-[#2A2A26] text-[#E0E0D5] hover:bg-[#383832]"
                : "border-slate-200 bg-white text-slate-700 hover:bg-slate-100"
            }`}
          >
            <span>{isExpanded ? "Collapse" : "Show Suggestions"}</span>
            {isExpanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
          </button>
        </div>
      </div>

      <AnimatePresence initial={false}>
        {isExpanded && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="p-4 sm:p-5 space-y-4"
          >
            {/* Filter Tabs + Book Chapter/Topic Focus Pills */}
            <div className="flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-slate-200/70 dark:border-[#383832]">
              <div className="flex flex-wrap items-center gap-1.5">
                {[
                  { id: "all", label: "✨ All Book Suggestions" },
                  { id: "questions", label: "❓ Question Generation" },
                  { id: "question-bank", label: "📚 Question Bank Generation" },
                  { id: "flashcards", label: "🃏 Flashcard Generation" },
                  { id: "notes-visual", label: "📖 Notes, PPT & Video" },
                ].map((tab) => (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() => setSelectedCategory(tab.id as any)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                      selectedCategory === tab.id
                        ? "bg-indigo-600 text-white shadow-xs"
                        : isDarkMode
                          ? "bg-[#282824] text-[#C2C2B0] hover:bg-[#34342E]"
                          : "bg-white border border-slate-200/80 text-slate-700 hover:bg-indigo-50/60"
                    }`}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>

              {/* Topic / Chapter Filter Pills from Book */}
              <div className="flex items-center gap-1.5 overflow-x-auto max-w-full py-0.5">
                <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400 shrink-0">
                  Book Focus:
                </span>
                <button
                  type="button"
                  onClick={() => onSelectFocusArea("")}
                  className={`px-2.5 py-1 rounded-full text-[11px] font-bold transition-all cursor-pointer border shrink-0 ${
                    !activeFocusArea
                      ? "bg-sky-600 text-white border-sky-600"
                      : isDarkMode
                        ? "bg-[#22221F] border-[#383832] text-slate-300"
                        : "bg-white border-slate-200 text-slate-600 hover:border-sky-300"
                  }`}
                >
                  Full Book
                </button>
                {topicsList.slice(0, 4).map((topic, idx) => {
                  const isSelected = activeFocusArea === topic;
                  return (
                    <button
                      key={`${topic}-${idx}`}
                      type="button"
                      onClick={() => onSelectFocusArea(isSelected ? "" : topic)}
                      title={`Focus suggestions on: ${topic}`}
                      className={`px-2.5 py-1 rounded-full text-[11px] font-semibold transition-all cursor-pointer border max-w-[180px] truncate shrink-0 ${
                        isSelected
                          ? "bg-indigo-600 text-white border-indigo-600"
                          : isDarkMode
                            ? "bg-[#22221F] border-[#383832] text-slate-300 hover:border-indigo-400"
                            : "bg-white border-slate-200 text-slate-600 hover:border-indigo-300"
                      }`}
                    >
                      {topic}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Primary Smart Suggestion Cards Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-3.5">
              {/* CARD 1: QUESTION GENERATION */}
              {(selectedCategory === "all" || selectedCategory === "questions") && (
                <div
                  className={`rounded-2xl border p-4 flex flex-col justify-between gap-3 transition-all ${
                    isDarkMode
                      ? "bg-[#252723] border-emerald-500/35 hover:border-emerald-400"
                      : "bg-gradient-to-br from-emerald-50/90 via-white to-teal-50/60 border-emerald-200/90 shadow-xs"
                  }`}
                >
                  <div>
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-600 to-teal-600 text-white flex items-center justify-center shadow-sm shrink-0">
                        {isGenerating &&
                        (generatingType === "short-questions" ||
                          generatingType === "viva-qa" ||
                          generatingType === "assessment") ? (
                          <Loader2 size={19} className="animate-spin" />
                        ) : (
                          <FileQuestion size={19} />
                        )}
                      </div>
                      <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border border-emerald-500/30">
                        Top Suggestion
                      </span>
                    </div>
                    <h4 className="font-bold text-sm">Question Generation</h4>
                    <p
                      className={`text-xs mt-1 leading-relaxed ${
                        isDarkMode ? "text-[#A1A194]" : "text-slate-600"
                      }`}
                    >
                      Generate chapter-wise important exam questions, 5-mark diagram answers, oral viva Q&A, and assessments from this book.
                    </p>

                    {/* Quick Sub-Options */}
                    <div className="mt-3 space-y-1.5">
                      <button
                        type="button"
                        disabled={isGenerating}
                        onClick={() =>
                          onRunSuggestion({ type: "questions-short", focusTopic: activeFocusArea })
                        }
                        className={`w-full px-2.5 py-1.5 rounded-xl border text-[11px] font-bold flex items-center justify-between transition-all cursor-pointer disabled:opacity-50 ${
                          isDarkMode
                            ? "bg-[#1C1E1B] border-[#383832] hover:border-emerald-500 text-emerald-300"
                            : "bg-white border-emerald-200/80 hover:bg-emerald-50 text-emerald-900"
                        }`}
                      >
                        <span>✨ 5-Mark Short Q&A + Diagrams</span>
                        <ArrowRight size={12} />
                      </button>
                      <button
                        type="button"
                        disabled={isGenerating}
                        onClick={() =>
                          onRunSuggestion({ type: "questions-long", focusTopic: activeFocusArea })
                        }
                        className={`w-full px-2.5 py-1.5 rounded-xl border text-[11px] font-bold flex items-center justify-between transition-all cursor-pointer disabled:opacity-50 ${
                          isDarkMode
                            ? "bg-[#1C1E1B] border-[#383832] hover:border-emerald-500 text-slate-200"
                            : "bg-white border-slate-200/80 hover:bg-emerald-50 text-slate-700"
                        }`}
                      >
                        <span>📝 10-Mark Long Analytical Q&A</span>
                        <ArrowRight size={12} />
                      </button>
                      <button
                        type="button"
                        disabled={isGenerating}
                        onClick={() =>
                          onRunSuggestion({ type: "questions-viva", focusTopic: activeFocusArea })
                        }
                        className={`w-full px-2.5 py-1.5 rounded-xl border text-[11px] font-bold flex items-center justify-between transition-all cursor-pointer disabled:opacity-50 ${
                          isDarkMode
                            ? "bg-[#1C1E1B] border-[#383832] hover:border-emerald-500 text-slate-200"
                            : "bg-white border-slate-200/80 hover:bg-emerald-50 text-slate-700"
                        }`}
                      >
                        <span>🎙️ Viva-Voce & Interview Q&A</span>
                        <ArrowRight size={12} />
                      </button>
                    </div>
                  </div>

                  <button
                    type="button"
                    disabled={isGenerating}
                    onClick={() =>
                      onRunSuggestion({ type: "questions-short", focusTopic: activeFocusArea })
                    }
                    className="w-full py-2.5 px-3 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white text-xs font-bold flex items-center justify-center gap-1.5 shadow-sm transition-all cursor-pointer disabled:opacity-50"
                  >
                    <FileQuestion size={14} />
                    <span>Generate Questions Now</span>
                  </button>
                </div>
              )}

              {/* CARD 2: QUESTION BANK GENERATION */}
              {(selectedCategory === "all" || selectedCategory === "question-bank") && (
                <div
                  className={`rounded-2xl border p-4 flex flex-col justify-between gap-3 transition-all ${
                    isDarkMode
                      ? "bg-[#26232B] border-violet-500/35 hover:border-violet-400"
                      : "bg-gradient-to-br from-violet-50/90 via-white to-indigo-50/60 border-violet-200/90 shadow-xs"
                  }`}
                >
                  <div>
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-600 to-indigo-600 text-white flex items-center justify-center shadow-sm shrink-0">
                        {isGenerating &&
                        (generatingType === "question-bank" || generatingType === "exam-paper") ? (
                          <Loader2 size={19} className="animate-spin" />
                        ) : (
                          <GraduationCap size={19} />
                        )}
                      </div>
                      <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-violet-500/15 text-violet-700 dark:text-violet-300 border border-violet-500/30">
                        Full Bank + Solutions
                      </span>
                    </div>
                    <h4 className="font-bold text-sm">Question Bank Generation</h4>
                    <p
                      className={`text-xs mt-1 leading-relaxed ${
                        isDarkMode ? "text-[#A1A194]" : "text-slate-600"
                      }`}
                    >
                      Build a complete solved Question Bank with 50+ MCQs, 5-mark short answers, 10-mark derivations, or CO/BT exam papers.
                    </p>

                    <div className="mt-3 space-y-1.5">
                      <button
                        type="button"
                        disabled={isGenerating}
                        onClick={() =>
                          onRunSuggestion({ type: "question-bank-all", focusTopic: activeFocusArea })
                        }
                        className={`w-full px-2.5 py-1.5 rounded-xl border text-[11px] font-bold flex items-center justify-between transition-all cursor-pointer disabled:opacity-50 ${
                          isDarkMode
                            ? "bg-[#1E1C24] border-[#383832] hover:border-violet-500 text-violet-300"
                            : "bg-white border-violet-200/80 hover:bg-violet-50 text-violet-900"
                        }`}
                      >
                        <span>📚 All-in-One Question Bank</span>
                        <ArrowRight size={12} />
                      </button>
                      <button
                        type="button"
                        disabled={isGenerating}
                        onClick={() =>
                          onRunSuggestion({ type: "question-bank-mcq", focusTopic: activeFocusArea })
                        }
                        className={`w-full px-2.5 py-1.5 rounded-xl border text-[11px] font-bold flex items-center justify-between transition-all cursor-pointer disabled:opacity-50 ${
                          isDarkMode
                            ? "bg-[#1E1C24] border-[#383832] hover:border-violet-500 text-slate-200"
                            : "bg-white border-slate-200/80 hover:bg-violet-50 text-slate-700"
                        }`}
                      >
                        <span>✅ 50+ Multiple Choice (MCQs)</span>
                        <ArrowRight size={12} />
                      </button>
                      <button
                        type="button"
                        disabled={isGenerating}
                        onClick={() =>
                          onRunSuggestion({
                            type: "exam-paper-university",
                            focusTopic: activeFocusArea,
                          })
                        }
                        className={`w-full px-2.5 py-1.5 rounded-xl border text-[11px] font-bold flex items-center justify-between transition-all cursor-pointer disabled:opacity-50 ${
                          isDarkMode
                            ? "bg-[#1E1C24] border-[#383832] hover:border-violet-500 text-slate-200"
                            : "bg-white border-slate-200/80 hover:bg-violet-50 text-slate-700"
                        }`}
                      >
                        <span>🏛️ University Exam Paper (CO/BT)</span>
                        <ArrowRight size={12} />
                      </button>
                    </div>
                  </div>

                  <button
                    type="button"
                    disabled={isGenerating}
                    onClick={() =>
                      onRunSuggestion({ type: "question-bank-all", focusTopic: activeFocusArea })
                    }
                    className="w-full py-2.5 px-3 rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-700 hover:to-indigo-700 text-white text-xs font-bold flex items-center justify-center gap-1.5 shadow-sm transition-all cursor-pointer disabled:opacity-50"
                  >
                    <GraduationCap size={14} />
                    <span>Generate Question Bank</span>
                  </button>
                </div>
              )}

              {/* CARD 3: FLASHCARD GENERATION */}
              {(selectedCategory === "all" || selectedCategory === "flashcards") && (
                <div
                  className={`rounded-2xl border p-4 flex flex-col justify-between gap-3 transition-all ${
                    isDarkMode
                      ? "bg-[#282520] border-amber-500/35 hover:border-amber-400"
                      : "bg-gradient-to-br from-amber-50/90 via-white to-orange-50/60 border-amber-200/90 shadow-xs"
                  }`}
                >
                  <div>
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-500 to-orange-600 text-white flex items-center justify-center shadow-sm shrink-0">
                        {isGenerating && generatingType === "flashcards" ? (
                          <Loader2 size={19} className="animate-spin" />
                        ) : (
                          <Layers size={19} />
                        )}
                      </div>
                      <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-amber-500/15 text-amber-800 dark:text-amber-300 border border-amber-500/30">
                        Active Recall
                      </span>
                    </div>
                    <h4 className="font-bold text-sm">Flashcard Generation</h4>
                    <p
                      className={`text-xs mt-1 leading-relaxed ${
                        isDarkMode ? "text-[#A1A194]" : "text-slate-600"
                      }`}
                    >
                      Convert key definitions, theorems, formulas, and chapter takeaways from this book into interactive 3D flip flashcards.
                    </p>

                    <div className="mt-3 space-y-1.5">
                      <button
                        type="button"
                        disabled={isGenerating}
                        onClick={() =>
                          onRunSuggestion({ type: "flashcards", focusTopic: activeFocusArea })
                        }
                        className={`w-full px-2.5 py-1.5 rounded-xl border text-[11px] font-bold flex items-center justify-between transition-all cursor-pointer disabled:opacity-50 ${
                          isDarkMode
                            ? "bg-[#211E19] border-[#383832] hover:border-amber-500 text-amber-300"
                            : "bg-white border-amber-200/80 hover:bg-amber-50 text-amber-900"
                        }`}
                      >
                        <span>🃏 Interactive 3D Pastel Flashcards</span>
                        <ArrowRight size={12} />
                      </button>
                      <button
                        type="button"
                        disabled={isGenerating}
                        onClick={() =>
                          onRunSuggestion({ type: "cheat-sheet", focusTopic: activeFocusArea })
                        }
                        className={`w-full px-2.5 py-1.5 rounded-xl border text-[11px] font-bold flex items-center justify-between transition-all cursor-pointer disabled:opacity-50 ${
                          isDarkMode
                            ? "bg-[#211E19] border-[#383832] hover:border-amber-500 text-slate-200"
                            : "bg-white border-slate-200/80 hover:bg-amber-50 text-slate-700"
                        }`}
                      >
                        <span>⚡ High-Yield Exam Cheat Sheet</span>
                        <ArrowRight size={12} />
                      </button>
                      <button
                        type="button"
                        disabled={isGenerating}
                        onClick={() =>
                          onRunSuggestion({ type: "formula-sheet", focusTopic: activeFocusArea })
                        }
                        className={`w-full px-2.5 py-1.5 rounded-xl border text-[11px] font-bold flex items-center justify-between transition-all cursor-pointer disabled:opacity-50 ${
                          isDarkMode
                            ? "bg-[#211E19] border-[#383832] hover:border-amber-500 text-slate-200"
                            : "bg-white border-slate-200/80 hover:bg-amber-50 text-slate-700"
                        }`}
                      >
                        <span>🧮 Formula & Equations Sheet</span>
                        <ArrowRight size={12} />
                      </button>
                    </div>
                  </div>

                  <button
                    type="button"
                    disabled={isGenerating}
                    onClick={() =>
                      onRunSuggestion({ type: "flashcards", focusTopic: activeFocusArea })
                    }
                    className="w-full py-2.5 px-3 rounded-xl bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 text-white text-xs font-bold flex items-center justify-center gap-1.5 shadow-sm transition-all cursor-pointer disabled:opacity-50"
                  >
                    <Layers size={14} />
                    <span>Generate Flashcards Now</span>
                  </button>
                </div>
              )}

              {/* CARD 4: HANDWRITTEN NOTES, PPT & VIDEO LECTURE */}
              {(selectedCategory === "all" || selectedCategory === "notes-visual") && (
                <div
                  className={`rounded-2xl border p-4 flex flex-col justify-between gap-3 transition-all ${
                    isDarkMode
                      ? "bg-[#21262B] border-sky-500/35 hover:border-sky-400"
                      : "bg-gradient-to-br from-sky-50/90 via-white to-pink-50/50 border-sky-200/90 shadow-xs"
                  }`}
                >
                  <div>
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-sky-600 to-indigo-600 text-white flex items-center justify-center shadow-sm shrink-0">
                        {isGenerating &&
                        (generatingType === "notes" ||
                          generatingType === "ppt" ||
                          generatingType === "video") ? (
                          <Loader2 size={19} className="animate-spin" />
                        ) : (
                          <BookOpen size={19} />
                        )}
                      </div>
                      <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-sky-500/15 text-sky-700 dark:text-sky-300 border border-sky-500/30">
                        Notes & Visuals
                      </span>
                    </div>
                    <h4 className="font-bold text-sm">Notes, PPT & Video Lecture</h4>
                    <p
                      className={`text-xs mt-1 leading-relaxed ${
                        isDarkMode ? "text-[#A1A194]" : "text-slate-600"
                      }`}
                    >
                      Generate 50+ page handwritten chapter notes, downloadable PowerPoint decks (.PPTX), and AI video lectures.
                    </p>

                    <div className="mt-3 space-y-1.5">
                      <button
                        type="button"
                        disabled={isGenerating}
                        onClick={() =>
                          onRunSuggestion({ type: "notes", focusTopic: activeFocusArea })
                        }
                        className={`w-full px-2.5 py-1.5 rounded-xl border text-[11px] font-bold flex items-center justify-between transition-all cursor-pointer disabled:opacity-50 ${
                          isDarkMode
                            ? "bg-[#1A1E22] border-[#383832] hover:border-sky-500 text-sky-300"
                            : "bg-white border-sky-200/80 hover:bg-sky-50 text-sky-900"
                        }`}
                      >
                        <span>✍️ Chapter Handwritten A4 Notes</span>
                        <ArrowRight size={12} />
                      </button>
                      <button
                        type="button"
                        disabled={isGenerating}
                        onClick={() =>
                          onRunSuggestion({ type: "ppt", focusTopic: activeFocusArea })
                        }
                        className={`w-full px-2.5 py-1.5 rounded-xl border text-[11px] font-bold flex items-center justify-between transition-all cursor-pointer disabled:opacity-50 ${
                          isDarkMode
                            ? "bg-[#1A1E22] border-[#383832] hover:border-sky-500 text-slate-200"
                            : "bg-white border-slate-200/80 hover:bg-sky-50 text-slate-700"
                        }`}
                      >
                        <span>📊 PowerPoint Presentation (.PPTX)</span>
                        <ArrowRight size={12} />
                      </button>
                      <button
                        type="button"
                        disabled={isGenerating}
                        onClick={() =>
                          onRunSuggestion({ type: "video", focusTopic: activeFocusArea })
                        }
                        className={`w-full px-2.5 py-1.5 rounded-xl border text-[11px] font-bold flex items-center justify-between transition-all cursor-pointer disabled:opacity-50 ${
                          isDarkMode
                            ? "bg-[#1A1E22] border-[#383832] hover:border-sky-500 text-slate-200"
                            : "bg-white border-slate-200/80 hover:bg-sky-50 text-slate-700"
                        }`}
                      >
                        <span>🎬 Smart AI Video & Audio Lecture</span>
                        <ArrowRight size={12} />
                      </button>
                    </div>
                  </div>

                  <button
                    type="button"
                    disabled={isGenerating}
                    onClick={() =>
                      onRunSuggestion({ type: "notes", focusTopic: activeFocusArea })
                    }
                    className="w-full py-2.5 px-3 rounded-xl bg-gradient-to-r from-sky-600 to-indigo-600 hover:from-sky-700 hover:to-indigo-700 text-white text-xs font-bold flex items-center justify-center gap-1.5 shadow-sm transition-all cursor-pointer disabled:opacity-50"
                  >
                    <BookOpen size={14} />
                    <span>Generate Study Notes</span>
                  </button>
                </div>
              )}
            </div>

            {/* Context-Aware One-Click Prompt Suggestions for This Uploaded Book */}
            <div
              className={`rounded-2xl border p-3.5 ${
                isDarkMode
                  ? "bg-[#1A1B20] border-[#383832]"
                  : "bg-white/90 border-indigo-100"
              }`}
            >
              <div className="flex items-center justify-between gap-2 mb-2.5">
                <span className="text-[11px] font-extrabold uppercase tracking-wider text-indigo-600 dark:text-indigo-400 flex items-center gap-1.5">
                  <Sparkles size={13} /> Tailored 1-Click AI Prompts for &ldquo;{cleanTitle}&rdquo;
                </span>
                <span className="text-[10px] text-slate-400">
                  Click any suggestion to generate immediately
                </span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                {smartBookPromptChips.map((chip) => {
                  const ChipIcon = chip.icon;
                  return (
                    <button
                      key={chip.id}
                      type="button"
                      disabled={isGenerating}
                      onClick={() => onRunSuggestion(chip.action)}
                      className={`group p-2.5 rounded-xl border text-left transition-all flex items-start gap-2.5 cursor-pointer disabled:opacity-50 ${
                        isDarkMode
                          ? "bg-[#24252B] border-[#383832] hover:border-indigo-500/60 hover:bg-[#2B2D36]"
                          : "bg-slate-50/70 border-slate-200/80 hover:border-indigo-300 hover:bg-indigo-50/40"
                      }`}
                    >
                      <span className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-indigo-500/10 text-indigo-600 dark:text-indigo-300 border border-indigo-500/20">
                        <ChipIcon size={14} />
                      </span>
                      <div className="min-w-0 flex-1">
                        <span className="block text-[9px] font-extrabold uppercase tracking-wider text-indigo-600 dark:text-indigo-400">
                          {chip.badge}
                        </span>
                        <span
                          className={`block text-[11px] font-semibold leading-snug line-clamp-2 mt-0.5 ${
                            isDarkMode ? "text-[#E0E0D5]" : "text-slate-800"
                          }`}
                        >
                          {chip.label}
                        </span>
                      </div>
                      <ArrowRight
                        size={13}
                        className="shrink-0 mt-2 text-slate-400 group-hover:text-indigo-600 group-hover:translate-x-0.5 transition-transform"
                      />
                    </button>
                  );
                })}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};
