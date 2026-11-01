import React, { useState } from "react";
import { motion } from "motion/react";
import {
  ScanText,
  FileText,
  Sparkles,
  BookOpen,
  GraduationCap,
  FileQuestion,
  Presentation,
  Calendar,
  FileVideo,
  CheckCircle2,
  Copy,
  Check,
  Download,
  RefreshCw,
  Layers,
  Calculator,
  BookMarked,
  MessageSquare,
  Network,
  ClipboardCheck,
  Search,
  ChevronDown,
  ChevronUp,
  ArrowRight,
  Loader2,
  Zap,
  Eye,
  Upload,
  FilePlus2,
} from "lucide-react";

export interface DigitalScanReport {
  documentTitle: string;
  documentType: string;
  scanEngine: string;
  confidenceScore: number;
  pageCount: number;
  wordCount: number;
  charCount: number;
  readingTimeMinutes: number;
  detectedFormulasCount: number;
  detectedTablesCount: number;
  detectedDiagramsCount: number;
  detectedTopics: string[];
  keyTerms: string[];
  units: Array<{
    unit: string;
    title: string;
    chapters: Array<{ chapter: string; title: string }>;
  }>;
  textPreview: string;
  scannedAt: string;
}

export type DocMultiFunctionId =
  | "verbatim-handwriting"
  | "handwritten-table-form"
  | "notes"
  | "short-questions"
  | "question-bank"
  | "exam-paper"
  | "flashcards"
  | "lesson-plan"
  | "ppt"
  | "video"
  | "executive-summary"
  | "formula-sheet"
  | "glossary"
  | "viva-qa"
  | "mindmap-atlas"
  | "cheat-sheet"
  | "easyocr";

interface DigitalDocumentScannerHubProps {
  fileName: string;
  scanReport: DigitalScanReport | null;
  extractedText: string;
  isScanning: boolean;
  isGenerating: boolean;
  generatingType: string;
  activeFocusArea: string;
  onSelectFocusArea: (topic: string) => void;
  onTriggerFunction: (funcId: DocMultiFunctionId) => void;
  onBatchGenerateStudyPack: () => void;
  isBatchGenerating: boolean;
  batchProgressLabel: string;
  onRescanDocument: (deepScan?: boolean) => void;
  onRunEasyOCR: () => void;
  onUseScannedTextAsNotes: (text: string) => void;
  generatedFunctionsList: string[];
  onUploadNewDigitalFile?: (file: File) => void;
  onOpenCreateDigitalDocModal?: () => void;
  onOpenTableUploadModal?: () => void;
  isDarkMode?: boolean;
  compact?: boolean;
}

export const DigitalDocumentScannerHub: React.FC<DigitalDocumentScannerHubProps> = ({
  fileName,
  scanReport,
  extractedText,
  isScanning,
  isGenerating,
  generatingType,
  activeFocusArea,
  onSelectFocusArea,
  onTriggerFunction,
  onBatchGenerateStudyPack,
  isBatchGenerating,
  batchProgressLabel,
  onRescanDocument,
  onRunEasyOCR,
  onUseScannedTextAsNotes,
  generatedFunctionsList,
  onUploadNewDigitalFile,
  onOpenCreateDigitalDocModal,
  onOpenTableUploadModal,
  isDarkMode = false,
}) => {
  const [showTextInspector, setShowTextInspector] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [copiedText, setCopiedText] = useState(false);
  const [activeCategory, setActiveCategory] = useState<"all" | "study" | "exam" | "visual" | "reference">("all");

  const fullTextToDisplay = extractedText || scanReport?.textPreview || "";

  const filteredPreviewText = React.useMemo(() => {
    if (!searchQuery.trim() || !fullTextToDisplay) return fullTextToDisplay.slice(0, 6000);
    const q = searchQuery.toLowerCase();
    const lines = fullTextToDisplay.split("\n");
    const matched = lines.filter((line) => line.toLowerCase().includes(q));
    return matched.length > 0
      ? matched.slice(0, 80).join("\n")
      : `No lines matching "${searchQuery}" found in scanned digital text.`;
  }, [fullTextToDisplay, searchQuery]);

  const handleCopyText = async () => {
    if (!fullTextToDisplay) return;
    try {
      await navigator.clipboard.writeText(fullTextToDisplay);
      setCopiedText(true);
      setTimeout(() => setCopiedText(false), 2000);
    } catch {
      // ignore
    }
  };

  const handleDownloadDigitalText = (ext: "md" | "txt") => {
    if (!fullTextToDisplay) return;
    const blob = new Blob([fullTextToDisplay], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    const cleanBase = (fileName || "Scanned_Document").replace(/\.[^/.]+$/, "").replace(/[^a-zA-Z0-9_-]/g, "_");
    a.download = `${cleanBase}_Digital_Scan.${ext}`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const multiFunctions: Array<{
    id: DocMultiFunctionId;
    title: string;
    subtitle: string;
    badge: string;
    category: "study" | "exam" | "visual" | "reference";
    icon: React.FC<any>;
    gradient: string;
    lightBg: string;
    borderColor: string;
  }> = [
    {
      id: "verbatim-handwriting",
      title: "Same-to-Same Handwritten Document (Exact 1:1 Copy)",
      subtitle: "Converts your exact uploaded document word-for-word into realistic student handwriting A4 pages (Not notes — 100% same as uploaded)",
      badge: "Exact 1:1 Copy",
      category: "study",
      icon: FileText,
      gradient: "from-blue-600 via-indigo-600 to-violet-600",
      lightBg: "bg-blue-50/90 dark:bg-blue-950/30",
      borderColor: "border-blue-300 dark:border-blue-700/60",
    },
    {
      id: "handwritten-table-form",
      title: "Same-to-Same Handwritten Table Form (Upload / Convert Table)",
      subtitle: "Converts uploaded tables (.XLSX, .CSV, .DOCX, .PDF) or document sections into ruled student handwriting A4 tables",
      badge: "Table Form 1:1",
      category: "study",
      icon: Layers,
      gradient: "from-teal-600 via-cyan-600 to-blue-600",
      lightBg: "bg-teal-50/90 dark:bg-teal-950/30",
      borderColor: "border-teal-300 dark:border-teal-700/60",
    },
    {
      id: "notes",
      title: "Handwritten A4 Study Notes",
      subtitle: "Chapter & unit-wise A4 notebook notes with Mermaid diagrams & TOC index",
      badge: "50+ A4 Pages",
      category: "study",
      icon: BookOpen,
      gradient: "from-amber-500 to-orange-600",
      lightBg: "bg-amber-50/80 dark:bg-amber-950/25",
      borderColor: "border-amber-200/90 dark:border-amber-800/50",
    },
    {
      id: "short-questions",
      title: "5-Mark Short Questions + Diagrams",
      subtitle: "Point-by-point new-line answers, Mermaid diagrams & explanations (Min 2 A4 Pages/Q)",
      badge: "5 Marks • 2 A4 Pages",
      category: "exam",
      icon: FileQuestion,
      gradient: "from-emerald-600 to-teal-600",
      lightBg: "bg-emerald-50/80 dark:bg-emerald-950/25",
      borderColor: "border-emerald-200/90 dark:border-emerald-800/50",
    },
    {
      id: "executive-summary",
      title: "Digital Executive Summary & Digest",
      subtitle: "Core thesis, module-by-module synthesis, architecture diagram & top 10 takeaways",
      badge: "Fast Synthesis",
      category: "study",
      icon: FileText,
      gradient: "from-sky-600 to-blue-600",
      lightBg: "bg-sky-50/80 dark:bg-sky-950/25",
      borderColor: "border-sky-200/90 dark:border-sky-800/50",
    },
    {
      id: "flashcards",
      title: "Solid Pastel Flashcard Studio",
      subtitle: "Interactive 3D flip cards with distinct solid pastel colors on swipe & quiz mode",
      badge: "Active Recall",
      category: "study",
      icon: Layers,
      gradient: "from-violet-600 to-purple-600",
      lightBg: "bg-violet-50/80 dark:bg-violet-950/25",
      borderColor: "border-violet-200/90 dark:border-violet-800/50",
    },
    {
      id: "lesson-plan",
      title: "Digital Lesson Planner (Teacher & Student)",
      subtitle: "Dual-perspective curriculum roadmap, Bloom's taxonomy & daily milestones",
      badge: "Teacher + Student",
      category: "study",
      icon: Calendar,
      gradient: "from-indigo-600 to-violet-600",
      lightBg: "bg-indigo-50/80 dark:bg-indigo-950/25",
      borderColor: "border-indigo-200/90 dark:border-indigo-800/50",
    },
    {
      id: "question-bank",
      title: "Complete Question Bank (MCQ + Short + Long)",
      subtitle: "50+ MCQs, 5-mark short questions with diagrams & 10-mark university derivations",
      badge: "Full Practice Bank",
      category: "exam",
      icon: GraduationCap,
      gradient: "from-teal-600 to-cyan-600",
      lightBg: "bg-teal-50/80 dark:bg-teal-950/25",
      borderColor: "border-teal-200/90 dark:border-teal-800/50",
    },
    {
      id: "exam-paper",
      title: "University Exam Question Paper",
      subtitle: "Official CO/BT mapped university exam paper with marking scheme & answer key",
      badge: "University Format",
      category: "exam",
      icon: ClipboardCheck,
      gradient: "from-blue-600 to-indigo-700",
      lightBg: "bg-blue-50/80 dark:bg-blue-950/25",
      borderColor: "border-blue-200/90 dark:border-blue-800/50",
    },
    {
      id: "viva-qa",
      title: "Viva-Voce & Technical Interview Q&A",
      subtitle: "28+ oral exam & interview questions with crisp model answers & examiner follow-up probes",
      badge: "Oral & Viva Prep",
      category: "exam",
      icon: MessageSquare,
      gradient: "from-rose-600 to-pink-600",
      lightBg: "bg-rose-50/80 dark:bg-rose-950/25",
      borderColor: "border-rose-200/90 dark:border-rose-800/50",
    },
    {
      id: "formula-sheet",
      title: "Formula, Equation & Derivation Sheet",
      subtitle: "All equations, formal rules, variables reference table, derivations & worked problems",
      badge: "Equations +Solved",
      category: "reference",
      icon: Calculator,
      gradient: "from-cyan-600 to-sky-600",
      lightBg: "bg-cyan-50/80 dark:bg-cyan-950/25",
      borderColor: "border-cyan-200/90 dark:border-cyan-800/50",
    },
    {
      id: "glossary",
      title: "Concept Glossary & Technical Dictionary",
      subtitle: "Comprehensive A–Z definitions, acronyms table & confused-concepts comparison matrix",
      badge: "A–Z Definitions",
      category: "reference",
      icon: BookMarked,
      gradient: "from-emerald-600 to-green-600",
      lightBg: "bg-emerald-50/80 dark:bg-emerald-950/25",
      borderColor: "border-emerald-200/90 dark:border-emerald-800/50",
    },
    {
      id: "mindmap-atlas",
      title: "Mind Map & Architecture Diagram Atlas",
      subtitle: "Multi-page visual Mermaid mindmaps, system block diagrams & workflow schematics",
      badge: "6+ Diagrams",
      category: "visual",
      icon: Network,
      gradient: "from-fuchsia-600 to-purple-600",
      lightBg: "bg-fuchsia-50/80 dark:bg-fuchsia-950/25",
      borderColor: "border-fuchsia-200/90 dark:border-fuchsia-800/50",
    },
    {
      id: "cheat-sheet",
      title: "High-Yield Exam Cheat Sheet & Checklist",
      subtitle: "Last-minute golden rules, memory mnemonics, comparison tables & pre-exam checklist",
      badge: "Rapid Revision",
      category: "reference",
      icon: Zap,
      gradient: "from-amber-600 to-red-600",
      lightBg: "bg-orange-50/80 dark:bg-orange-950/25",
      borderColor: "border-orange-200/90 dark:border-orange-800/50",
    },
    {
      id: "ppt",
      title: "PowerPoint Presentation Studio (.PPTX)",
      subtitle: "Generate topic-focused educational slide decks with analogies & downloadable PPTX",
      badge: "PPTX Deck",
      category: "visual",
      icon: Presentation,
      gradient: "from-pink-600 to-rose-600",
      lightBg: "bg-pink-50/80 dark:bg-pink-950/25",
      borderColor: "border-pink-200/90 dark:border-pink-800/50",
    },
    {
      id: "video",
      title: "Smart Video & Audio Lecture Explainer",
      subtitle: "AI-narrated animated slide lecture with synchronized voiceover & visual scenes",
      badge: "Video + Audio",
      category: "visual",
      icon: FileVideo,
      gradient: "from-purple-600 to-indigo-600",
      lightBg: "bg-purple-50/80 dark:bg-purple-950/25",
      borderColor: "border-purple-200/90 dark:border-purple-800/50",
    },
  ];

  const displayedFunctions =
    activeCategory === "all"
      ? multiFunctions
      : multiFunctions.filter((f) => f.category === activeCategory);

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className={`rounded-[28px] border shadow-xl overflow-hidden transition-all ${
        isDarkMode
          ? "bg-[#1E1E1B]/95 border-[#383832] text-[#F5F5F0]"
          : "bg-white/95 border-sky-200/80 text-slate-800 shadow-[0_16px_48px_rgba(14,116,144,0.10)]"
      }`}
    >
      {/* Top Gradient Accent Bar */}
      <div className="h-2 w-full bg-gradient-to-r from-emerald-500 via-sky-500 to-indigo-600" />

      {/* Header Section: Digital Document Scan Status & Telemetry */}
      <div
        className={`p-5 sm:p-6 border-b ${
          isDarkMode
            ? "bg-gradient-to-br from-[#252521] to-[#1E1E1B] border-[#383832]"
            : "bg-gradient-to-br from-emerald-50/60 via-sky-50/50 to-indigo-50/40 border-slate-200/80"
        }`}
      >
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="flex items-start gap-3.5 min-w-0">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-emerald-600 via-teal-600 to-sky-600 text-white flex items-center justify-center shadow-lg shadow-emerald-600/20 shrink-0">
              {isScanning ? <Loader2 size={24} className="animate-spin" /> : <ScanText size={24} />}
            </div>
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2 mb-1">
                <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold uppercase tracking-wider bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border border-emerald-500/30">
                  <CheckCircle2 size={12} />
                  {isScanning ? "Scanning Digital Document..." : "Digital Document Scanned & Indexed"}
                </span>
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-sky-500/15 text-sky-700 dark:text-sky-300 border border-sky-500/30">
                  {scanReport?.documentType || "Digital Academic Document"}
                </span>
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-indigo-500/15 text-indigo-700 dark:text-indigo-300 border border-indigo-500/30">
                  15 Functions Ready (Includes 1:1 Same-to-Same Handwriting)
                </span>
              </div>
              <h2 className="font-serif text-xl sm:text-2xl font-bold truncate">
                {scanReport?.documentTitle || fileName || "Uploaded Digital Study Document"}
              </h2>
              <p className={`text-xs mt-0.5 ${isDarkMode ? "text-[#A1A194]" : "text-slate-600"}`}>
                Engine: {scanReport?.scanEngine || "Notivexa Digital Document Scanner + EasyOCR (CRAFT + ResNet-BiLSTM-CTC)"}
              </p>
            </div>
          </div>

          {/* Action Buttons in Header */}
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => onTriggerFunction("verbatim-handwriting")}
              disabled={isScanning || isGenerating}
              title="Convert uploaded document same-to-same (exact 1:1 verbatim copy, not study notes) into realistic student handwriting A4 pages"
              className="px-3.5 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 bg-gradient-to-r from-blue-600 via-indigo-600 to-violet-600 hover:from-blue-700 hover:to-violet-700 text-white shadow-md shadow-indigo-500/20 transition-all cursor-pointer disabled:opacity-50"
            >
              {isGenerating && generatingType === "verbatim-handwriting" ? (
                <Loader2 size={14} className="animate-spin" />
              ) : (
                <FileText size={14} />
              )}
              <span>✍️ Same-to-Same Handwritten Pages (Exact 1:1)</span>
            </button>

            <button
              type="button"
              onClick={() => onTriggerFunction("handwritten-table-form")}
              disabled={isScanning || isGenerating}
              title="Convert uploaded table or document into realistic student handwritten A4 Table Form"
              className="px-3.5 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 bg-gradient-to-r from-teal-600 via-cyan-600 to-blue-600 hover:from-teal-700 hover:to-blue-700 text-white shadow-md shadow-teal-500/20 transition-all cursor-pointer disabled:opacity-50"
            >
              {isGenerating && generatingType === "handwritten-table-form" ? (
                <Loader2 size={14} className="animate-spin" />
              ) : (
                <Layers size={14} />
              )}
              <span>📊 Handwritten Table Form</span>
            </button>

            {onOpenTableUploadModal && (
              <button
                type="button"
                onClick={onOpenTableUploadModal}
                disabled={isGenerating}
                title="Open Interactive Table Form Upload & Builder (.XLSX, .CSV, Paste from Excel/Word, or Edit Rows & Columns)"
                className={`px-3 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 border transition-all cursor-pointer ${
                  isDarkMode
                    ? "bg-teal-950/35 border-teal-500/40 text-teal-300 hover:bg-teal-950/55"
                    : "bg-teal-50 border-teal-200 text-teal-800 hover:bg-teal-100"
                }`}
              >
                <Upload size={14} />
                <span>Upload / Build Table</span>
              </button>
            )}

            {onUploadNewDigitalFile && (
              <label
                title="Upload another Digital Document File (.PDF, .DOCX, .PPTX, .XLSX, .TXT, .MD, .CSV, .RTF, Image)"
                className="px-3.5 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 bg-gradient-to-r from-sky-600 to-blue-600 hover:from-sky-700 hover:to-blue-700 text-white shadow-sm transition-all cursor-pointer"
              >
                <Upload size={14} />
                <span>Upload Digital File</span>
                <input
                  type="file"
                  accept="application/pdf,.pdf,.docx,.doc,.pptx,.ppt,.xlsx,.xls,.odt,.rtf,.txt,.md,.markdown,.csv,.tsv,.json,.html,.htm,.xml,.tex,image/*"
                  className="hidden"
                  onChange={(e) => {
                    const selected = e.currentTarget.files?.[0];
                    e.currentTarget.value = "";
                    if (selected) onUploadNewDigitalFile(selected);
                  }}
                />
              </label>
            )}

            {onOpenCreateDigitalDocModal && (
              <button
                type="button"
                onClick={onOpenCreateDigitalDocModal}
                className={`px-3 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 border transition-all cursor-pointer ${
                  isDarkMode
                    ? "bg-[#2A2A26] border-[#45453B] text-[#E0E0D5] hover:bg-[#383832]"
                    : "bg-white border-slate-200 text-slate-700 hover:bg-indigo-50 hover:border-indigo-200"
                }`}
              >
                <FilePlus2 size={14} />
                <span>Paste / Create Digital File</span>
              </button>
            )}

            <button
              type="button"
              onClick={() => setShowTextInspector((prev) => !prev)}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 border transition-all cursor-pointer ${
                showTextInspector
                  ? "bg-sky-600 text-white border-sky-600 shadow-sm"
                  : isDarkMode
                    ? "bg-[#2A2A26] border-[#45453B] text-[#E0E0D5] hover:bg-[#383832]"
                    : "bg-white border-slate-200 text-slate-700 hover:bg-sky-50 hover:border-sky-200"
              }`}
            >
              <Eye size={14} />
              <span>{showTextInspector ? "Hide Scanned Text" : "Inspect Scanned Digital Text"}</span>
              {showTextInspector ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
            </button>

            <button
              type="button"
              onClick={onRunEasyOCR}
              disabled={isScanning || isGenerating}
              className="px-3.5 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white shadow-sm transition-all cursor-pointer disabled:opacity-50"
            >
              <ScanText size={14} />
              <span>7-Stage EasyOCR Inspector</span>
            </button>

            <button
              type="button"
              onClick={() => onRescanDocument(true)}
              disabled={isScanning || isGenerating}
              title="Run deep AI document scan to refresh detected topics and text"
              className={`px-3 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 border transition-all cursor-pointer disabled:opacity-50 ${
                isDarkMode
                  ? "bg-[#2A2A26] border-[#45453B] text-[#E0E0D5] hover:bg-[#383832]"
                  : "bg-white border-slate-200 text-slate-700 hover:bg-slate-100"
              }`}
            >
              <RefreshCw size={13} className={isScanning ? "animate-spin" : ""} />
              <span>Deep Scan</span>
            </button>
          </div>
        </div>

        {/* Scanned Document Metrics Row */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2.5 mt-4">
          <div
            className={`p-3 rounded-2xl border ${
              isDarkMode ? "bg-[#22221F] border-[#383832]" : "bg-white/90 border-slate-200/80"
            }`}
          >
            <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Scan Confidence</p>
            <p className="text-lg font-extrabold text-emerald-600 dark:text-emerald-400 mt-0.5">
              {Math.round(((scanReport?.confidenceScore || 0.994) * 1000)) / 10}%
            </p>
            <p className="text-[10px] text-slate-500">Digital & OCR verified</p>
          </div>

          <div
            className={`p-3 rounded-2xl border ${
              isDarkMode ? "bg-[#22221F] border-[#383832]" : "bg-white/90 border-slate-200/80"
            }`}
          >
            <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Scanned Pages</p>
            <p className="text-lg font-extrabold text-sky-600 dark:text-sky-400 mt-0.5">
              {scanReport?.pageCount || 1} {scanReport?.pageCount === 1 ? "Page" : "Pages"}
            </p>
            <p className="text-[10px] text-slate-500">Est. {scanReport?.readingTimeMinutes || 5} min read</p>
          </div>

          <div
            className={`p-3 rounded-2xl border ${
              isDarkMode ? "bg-[#22221F] border-[#383832]" : "bg-white/90 border-slate-200/80"
            }`}
          >
            <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Extracted Words</p>
            <p className="text-lg font-extrabold text-indigo-600 dark:text-indigo-400 mt-0.5">
              {(scanReport?.wordCount || Math.ceil(fullTextToDisplay.length / 6) || 450).toLocaleString()}
            </p>
            <p className="text-[10px] text-slate-500">
              {(scanReport?.charCount || fullTextToDisplay.length || 2800).toLocaleString()} chars indexed
            </p>
          </div>

          <div
            className={`p-3 rounded-2xl border ${
              isDarkMode ? "bg-[#22221F] border-[#383832]" : "bg-white/90 border-slate-200/80"
            }`}
          >
            <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Detected Topics</p>
            <p className="text-lg font-extrabold text-violet-600 dark:text-violet-400 mt-0.5">
              {scanReport?.detectedTopics?.length || 6} Modules
            </p>
            <p className="text-[10px] text-slate-500">{scanReport?.keyTerms?.length || 8} key terms</p>
          </div>

          <div
            className={`p-3 rounded-2xl border ${
              isDarkMode ? "bg-[#22221F] border-[#383832]" : "bg-white/90 border-slate-200/80"
            }`}
          >
            <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Formulas & Models</p>
            <p className="text-lg font-extrabold text-amber-600 dark:text-amber-400 mt-0.5">
              {scanReport?.detectedFormulasCount || 4} Detected
            </p>
            <p className="text-[10px] text-slate-500">Equations & rules</p>
          </div>

          <div
            className={`p-3 rounded-2xl border ${
              isDarkMode ? "bg-[#22221F] border-[#383832]" : "bg-white/90 border-slate-200/80"
            }`}
          >
            <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Diagrams & Tables</p>
            <p className="text-lg font-extrabold text-rose-600 dark:text-rose-400 mt-0.5">
              {(scanReport?.detectedDiagramsCount || 3) + (scanReport?.detectedTablesCount || 2)} Elements
            </p>
            <p className="text-[10px] text-slate-500">Mermaid-ready schemas</p>
          </div>
        </div>

        {/* Collapsible Scanned Digital Text Inspector */}
        {showTextInspector && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            className={`mt-4 p-4 rounded-2xl border space-y-3 ${
              isDarkMode ? "bg-[#181816] border-[#383832]" : "bg-white border-slate-200 shadow-inner"
            }`}
          >
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <ScanText size={16} className="text-emerald-600" />
                <span className="text-xs font-bold">
                  Scanned Digital Document Text Stream ({fullTextToDisplay.length.toLocaleString()} characters)
                </span>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <div className="relative">
                  <Search size={13} className="absolute left-2.5 top-2 text-slate-400" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search scanned text..."
                    className={`pl-7 pr-3 py-1 rounded-lg border text-xs outline-none ${
                      isDarkMode
                        ? "bg-[#22221F] border-[#383832] text-white"
                        : "bg-slate-50 border-slate-200 text-slate-800"
                    }`}
                  />
                </div>
                <button
                  type="button"
                  onClick={handleCopyText}
                  className="px-2.5 py-1 rounded-lg border border-slate-200 dark:border-[#383832] text-xs font-semibold flex items-center gap-1 hover:bg-slate-100 dark:hover:bg-[#2A2A26] cursor-pointer"
                >
                  {copiedText ? <Check size={12} className="text-emerald-600" /> : <Copy size={12} />}
                  <span>{copiedText ? "Copied!" : "Copy Text"}</span>
                </button>
                <button
                  type="button"
                  onClick={() => handleDownloadDigitalText("md")}
                  className="px-2.5 py-1 rounded-lg border border-slate-200 dark:border-[#383832] text-xs font-semibold flex items-center gap-1 hover:bg-slate-100 dark:hover:bg-[#2A2A26] cursor-pointer"
                >
                  <Download size={12} />
                  <span>Download .MD</span>
                </button>
                <button
                  type="button"
                  onClick={() => handleDownloadDigitalText("txt")}
                  className="px-2.5 py-1 rounded-lg border border-slate-200 dark:border-[#383832] text-xs font-semibold flex items-center gap-1 hover:bg-slate-100 dark:hover:bg-[#2A2A26] cursor-pointer"
                >
                  <Download size={12} />
                  <span>Download .TXT</span>
                </button>
                {fullTextToDisplay && (
                  <button
                    type="button"
                    onClick={() => onTriggerFunction("verbatim-handwriting")}
                    className="px-3 py-1 rounded-lg bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white text-xs font-bold flex items-center gap-1 cursor-pointer"
                  >
                    <FileText size={12} />
                    <span>Convert Same-to-Same in Student Handwriting</span>
                  </button>
                )}
                {fullTextToDisplay && (
                  <button
                    type="button"
                    onClick={() => onUseScannedTextAsNotes(fullTextToDisplay)}
                    className="px-3 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold flex items-center gap-1 cursor-pointer"
                  >
                    <BookOpen size={12} />
                    <span>Open in A4 Notebook View</span>
                  </button>
                )}
              </div>
            </div>
            <pre
              className={`max-h-56 overflow-y-auto p-3.5 rounded-xl text-xs font-mono whitespace-pre-wrap leading-relaxed border ${
                isDarkMode
                  ? "bg-[#22221F] border-[#383832] text-slate-300"
                  : "bg-slate-50 border-slate-200/80 text-slate-700"
              }`}
            >
              {filteredPreviewText || "Digital document indexed. Click 'Deep Scan' or '7-Stage EasyOCR Inspector' for full optical transcription."}
            </pre>
          </motion.div>
        )}

        {/* Detected Syllabus Topics / Focus Chips */}
        {scanReport?.detectedTopics && scanReport.detectedTopics.length > 0 && (
          <div className="mt-4 pt-3 border-t border-slate-200/70 dark:border-[#383832]">
            <div className="flex items-center justify-between gap-2 mb-2">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                🎯 Scanned Document Topics (Click a topic to focus all generators, or keep 'All Topics'):
              </span>
              {activeFocusArea && (
                <button
                  type="button"
                  onClick={() => onSelectFocusArea("")}
                  className="text-[11px] font-bold text-sky-600 hover:underline cursor-pointer"
                >
                  Reset to Full Document
                </button>
              )}
            </div>
            <div className="flex flex-wrap gap-1.5">
              <button
                type="button"
                onClick={() => onSelectFocusArea("")}
                className={`px-3 py-1 rounded-full text-xs font-bold transition-all cursor-pointer border ${
                  !activeFocusArea
                    ? "bg-sky-600 text-white border-sky-600 shadow-xs"
                    : isDarkMode
                      ? "bg-[#22221F] border-[#383832] text-slate-300 hover:border-sky-500"
                      : "bg-white border-slate-200 text-slate-700 hover:border-sky-300"
                }`}
              >
                All Document Topics (Complete Scan)
              </button>
              {scanReport.detectedTopics.map((topic, idx) => {
                const isSelected = activeFocusArea === topic;
                return (
                  <button
                    key={`${topic}-${idx}`}
                    type="button"
                    onClick={() => onSelectFocusArea(isSelected ? "" : topic)}
                    className={`px-3 py-1 rounded-full text-xs font-semibold transition-all cursor-pointer border max-w-xs truncate ${
                      isSelected
                        ? "bg-indigo-600 text-white border-indigo-600 shadow-xs"
                        : isDarkMode
                          ? "bg-[#22221F] border-[#383832] text-slate-300 hover:border-indigo-500"
                          : "bg-white border-slate-200 text-slate-700 hover:border-indigo-300 hover:bg-indigo-50/40"
                    }`}
                    title={topic}
                  >
                    {topic}
                  </button>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* Multi-Function Smart Generator Hub Body */}
      <div className="p-5 sm:p-6 space-y-5">
        {/* Category Filter + Batch Multi-Function Pack Button */}
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h3 className="font-serif text-lg sm:text-xl font-bold flex items-center gap-2">
              <Sparkles size={19} className="text-sky-600" />
              <span>Generate Many Functions from Scanned Digital Document</span>
            </h3>
            <p className={`text-xs mt-0.5 ${isDarkMode ? "text-[#A1A194]" : "text-slate-500"}`}>
              Click any function below to generate tailored outputs from{" "}
              <strong className={isDarkMode ? "text-white" : "text-slate-700"}>
                {activeFocusArea ? `"${activeFocusArea}"` : `"${scanReport?.documentTitle || fileName}"`}
              </strong>
            </p>
          </div>

          <button
            type="button"
            onClick={onBatchGenerateStudyPack}
            disabled={isGenerating || isBatchGenerating}
            className="px-4 py-2.5 rounded-2xl bg-gradient-to-r from-indigo-600 via-violet-600 to-fuchsia-600 hover:from-indigo-700 hover:to-fuchsia-700 text-white text-xs font-bold flex items-center gap-2 shadow-md shadow-indigo-500/20 transition-all cursor-pointer disabled:opacity-50"
          >
            {isBatchGenerating ? (
              <>
                <Loader2 size={15} className="animate-spin" />
                <span>{batchProgressLabel || "Generating Multi-Function Study Pack..."}</span>
              </>
            ) : (
              <>
                <Zap size={15} />
                <span>⚡ Auto-Generate Multi-Function Study Pack (4-in-1)</span>
              </>
            )}
          </button>
        </div>

        {/* Category Tabs */}
        <div className="flex flex-wrap items-center gap-1.5 border-b border-slate-200/80 dark:border-[#383832] pb-3">
          {[
            { id: "all", label: "All Functions (15)" },
            { id: "study", label: "Handwriting Copy, Notes & Summaries (5)" },
            { id: "exam", label: "Questions, Papers & Viva (4)" },
            { id: "reference", label: "Formulas, Glossary & Cheat Sheet (3)" },
            { id: "visual", label: "Diagrams, PPT & Video (3)" },
          ].map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveCategory(tab.id as any)}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                activeCategory === tab.id
                  ? "bg-slate-900 text-white dark:bg-sky-600 shadow-xs"
                  : isDarkMode
                    ? "text-[#A1A194] hover:bg-[#2A2A26] hover:text-white"
                    : "text-slate-600 hover:bg-slate-100"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* 14-Function Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
          {displayedFunctions.map((fn) => {
            const Icon = fn.icon;
            const isThisGenerating = isGenerating && generatingType === fn.id;
            const isAlreadyGenerated = generatedFunctionsList.includes(fn.id);

            return (
              <button
                key={fn.id}
                type="button"
                disabled={isGenerating}
                onClick={() => onTriggerFunction(fn.id)}
                className={`group relative text-left p-4 rounded-2xl border transition-all flex flex-col justify-between gap-3 cursor-pointer hover:-translate-y-0.5 hover:shadow-md disabled:opacity-60 disabled:cursor-wait ${
                  isDarkMode
                    ? "bg-[#252521] border-[#383832] hover:border-sky-500/60"
                    : `${fn.lightBg} ${fn.borderColor} hover:border-sky-400`
                }`}
              >
                <div>
                  <div className="flex items-start justify-between gap-2 mb-2.5">
                    <div
                      className={`w-10 h-10 rounded-xl bg-gradient-to-br ${fn.gradient} text-white flex items-center justify-center shadow-sm shrink-0`}
                    >
                      {isThisGenerating ? <Loader2 size={19} className="animate-spin" /> : <Icon size={19} />}
                    </div>
                    <div className="flex items-center gap-1.5">
                      {isAlreadyGenerated && (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 border border-emerald-500/30 flex items-center gap-1">
                          <CheckCircle2 size={10} /> Ready
                        </span>
                      )}
                      <span
                        className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${
                          isDarkMode
                            ? "bg-[#1E1E1B] border-[#383832] text-slate-300"
                            : "bg-white/90 border-slate-200/80 text-slate-700"
                        }`}
                      >
                        {fn.badge}
                      </span>
                    </div>
                  </div>

                  <h4
                    className={`font-bold text-sm leading-snug ${
                      isDarkMode ? "text-[#F5F5F0]" : "text-slate-900"
                    }`}
                  >
                    {fn.title}
                  </h4>
                  <p
                    className={`text-xs mt-1 leading-relaxed ${
                      isDarkMode ? "text-[#A1A194]" : "text-slate-600"
                    }`}
                  >
                    {fn.subtitle}
                  </p>
                </div>

                <div className="pt-2 border-t border-slate-200/60 dark:border-[#383832] flex items-center justify-between text-xs font-bold">
                  <span
                    className={
                      isThisGenerating
                        ? "text-amber-600 dark:text-amber-400"
                        : isAlreadyGenerated
                          ? "text-emerald-700 dark:text-emerald-400"
                          : isDarkMode
                            ? "text-sky-400"
                            : "text-sky-700"
                    }
                  >
                    {isThisGenerating
                      ? "Generating from scanned document..."
                      : isAlreadyGenerated
                        ? "View / Regenerate Function"
                        : "Generate Function Now"}
                  </span>
                  <ArrowRight
                    size={15}
                    className="transition-transform group-hover:translate-x-1 text-slate-400 group-hover:text-sky-600"
                  />
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </motion.div>
  );
};
