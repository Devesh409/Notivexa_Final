import React, { useState, useEffect } from 'react';
import { X, Presentation, Sparkles, BookOpen, Layers, CheckCircle2, ChevronRight, Loader2, Lightbulb, GraduationCap, Sliders, FileText } from 'lucide-react';
import { DocumentTopic } from '../types';

interface PPTTopicStudioModalProps {
  isOpen: boolean;
  onClose: () => void;
  fileName: string;
  fileUri: string;
  mimeType: string;
  onGenerate: (options: { topic: string; slideCount: number; learningLevel: string }) => Promise<void>;
  isGenerating: boolean;
  isDarkMode: boolean;
}

export const PPTTopicStudioModal: React.FC<PPTTopicStudioModalProps> = ({
  isOpen,
  onClose,
  fileName,
  fileUri,
  mimeType,
  onGenerate,
  isGenerating,
  isDarkMode,
}) => {
  const [topics, setTopics] = useState<DocumentTopic[]>([]);
  const [documentTitle, setDocumentTitle] = useState<string>("");
  const [selectedTopic, setSelectedTopic] = useState<string>("Complete Document Overview");
  const [customTopic, setCustomTopic] = useState<string>("");
  const [slideCount, setSlideCount] = useState<number>(10);
  const [learningLevel, setLearningLevel] = useState<string>("simple");
  const [isLoadingTopics, setIsLoadingTopics] = useState<boolean>(false);
  const [topicsError, setTopicsError] = useState<string | null>(null);

  useEffect(() => {
    if (!isOpen || !fileUri) return;

    // Fetch topics from the uploaded document if not already loaded for this file
    let isCurrent = true;
    const fetchTopics = async () => {
      setIsLoadingTopics(true);
      setTopicsError(null);
      try {
        const res = await fetch("/api/extract-topics", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ fileUri, mimeType }),
        });
        if (!res.ok) {
          throw new Error("Could not extract document outline");
        }
        const data = await res.json();
        if (isCurrent && data.topics && Array.isArray(data.topics)) {
          setTopics(data.topics);
          if (data.documentTitle) {
            setDocumentTitle(data.documentTitle);
          }
          if (data.topics.length > 0) {
            setSelectedTopic(data.topics[0].title);
          }
        }
      } catch (err: any) {
        console.warn("Topic extraction notice:", err);
        if (isCurrent) {
          setTopicsError("Could not automatically list chapters. You can type any custom topic below.");
          // Provide sensible default topics
          setTopics([
            { id: "1", title: "Complete Document Overview", description: "Comprehensive coverage of all main concepts in the document.", difficulty: "Beginner" },
            { id: "2", title: "Core Principles & Foundational Concepts", description: "Essential terms, definitions, and foundational theories.", difficulty: "Beginner" },
            { id: "3", title: "Step-by-Step Mechanisms & Workflows", description: "Detailed processes, operational steps, and methodologies.", difficulty: "Intermediate" },
            { id: "4", title: "Practical Examples & Exam Review", description: "High-yield takeaways, problem-solving, and key concepts.", difficulty: "Advanced" },
          ]);
        }
      } finally {
        if (isCurrent) setIsLoadingTopics(false);
      }
    };

    fetchTopics();
    return () => {
      isCurrent = false;
    };
  }, [isOpen, fileUri, mimeType]);

  if (!isOpen) return null;

  const activeTopicString = customTopic.trim() || selectedTopic;

  const handleStartGeneration = () => {
    onGenerate({
      topic: activeTopicString,
      slideCount,
      learningLevel,
    });
  };

  return (
    <div className="fixed inset-0 z-[120] flex items-center justify-center bg-slate-950/80 backdrop-blur-md p-4 overflow-y-auto animate-in fade-in duration-200">
      <div 
        className={`w-full max-w-3xl rounded-[28px] border shadow-2xl overflow-hidden flex flex-col my-8 transition-all ${
          isDarkMode 
            ? "bg-[#1C1C19] border-[#383832] text-[#E0E0D5]" 
            : "bg-white border-slate-200 text-slate-800"
        }`}
      >
        {/* Header */}
        <div className={`p-6 border-b flex items-start justify-between ${
          isDarkMode ? "border-[#383832] bg-[#22221F]" : "border-slate-100 bg-slate-50/80"
        }`}>
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-pink-500 via-rose-500 to-pink-600 text-white flex items-center justify-center shadow-lg shadow-pink-500/25">
              <Presentation size={24} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-xl font-bold tracking-tight">Easy-to-Learn PPT Studio</h2>
                <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-pink-100 dark:bg-pink-950/50 text-pink-700 dark:text-pink-300 border border-pink-200 dark:border-pink-800/60">
                  Document-Grounded
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 flex items-center gap-1.5">
                <FileText size={13} className="shrink-0" />
                <span className="truncate max-w-md font-medium">{fileName || documentTitle || "Uploaded Study Material"}</span>
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            disabled={isGenerating}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors disabled:opacity-50"
            title="Close"
          >
            <X size={20} />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 sm:p-8 space-y-6 overflow-y-auto max-h-[75vh]">
          
          {/* Step 1: Select Topic */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center gap-2">
                <span className="w-5 h-5 rounded-full bg-pink-600 text-white flex items-center justify-center text-[10px]">1</span>
                Choose Topic to Generate Slides For
              </label>
              {isLoadingTopics && (
                <span className="text-xs text-pink-600 dark:text-pink-400 flex items-center gap-1.5 font-medium animate-pulse">
                  <Loader2 size={12} className="animate-spin" /> Analyzing document chapters...
                </span>
              )}
            </div>

            {/* List of Detected Document Topics */}
            <div className="space-y-2 mb-3">
              {topics.map((t) => {
                const isSelected = selectedTopic === t.title && !customTopic.trim();
                return (
                  <button
                    key={t.id}
                    type="button"
                    onClick={() => {
                      setSelectedTopic(t.title);
                      setCustomTopic("");
                    }}
                    className={`w-full text-left p-3.5 rounded-2xl border transition-all flex items-start justify-between gap-3 group ${
                      isSelected
                        ? "border-pink-500 bg-pink-50/80 dark:bg-pink-950/30 dark:border-pink-500/70 shadow-sm"
                        : "border-slate-200 dark:border-[#383832] hover:border-slate-300 dark:hover:border-slate-700 bg-white dark:bg-[#252522]"
                    }`}
                  >
                    <div className="flex items-start gap-3 min-w-0">
                      <div className={`mt-0.5 w-5 h-5 rounded-full flex items-center justify-center shrink-0 text-xs transition-colors ${
                        isSelected 
                          ? "bg-pink-600 text-white shadow-xs" 
                          : "border border-slate-300 dark:border-slate-600 text-transparent"
                      }`}>
                        <CheckCircle2 size={14} className={isSelected ? "opacity-100" : "opacity-0"} />
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className={`text-sm font-bold truncate ${
                            isSelected ? "text-pink-900 dark:text-pink-100" : "text-slate-800 dark:text-slate-200"
                          }`}>
                            {t.title}
                          </span>
                          {t.difficulty && (
                            <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
                              {t.difficulty}
                            </span>
                          )}
                        </div>
                        {t.description && (
                          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">
                            {t.description}
                          </p>
                        )}
                      </div>
                    </div>
                    <ChevronRight size={16} className={`shrink-0 transition-transform ${isSelected ? "text-pink-600 translate-x-0.5" : "text-slate-300 dark:text-slate-600"}`} />
                  </button>
                );
              })}
            </div>

            {/* Custom Topic Write-In Input */}
            <div className={`p-4 rounded-2xl border ${isDarkMode ? "bg-[#252522] border-[#383832]" : "bg-slate-50 border-slate-200"}`}>
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-xs font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                  <Sparkles size={14} className="text-amber-500" />
                  Or Enter a Specific Custom Topic / Chapter:
                </span>
                {customTopic.trim() && (
                  <span className="text-[11px] font-bold text-pink-600 dark:text-pink-400">Custom Active</span>
                )}
              </div>
              <input
                type="text"
                value={customTopic}
                onChange={(e) => setCustomTopic(e.target.value)}
                placeholder="e.g. Chapter 3: Binary Search Trees, Light Reactions in Photosynthesis, etc."
                className={`w-full px-4 py-2.5 rounded-xl border text-sm outline-none transition-all ${
                  customTopic.trim()
                    ? "border-pink-500 bg-white dark:bg-[#1C1C19] text-slate-900 dark:text-white shadow-xs"
                    : "border-slate-200 dark:border-[#383832] bg-white dark:bg-[#1C1C19] text-slate-700 dark:text-slate-200 focus:border-pink-500"
                }`}
              />
              <p className="text-[11px] text-slate-400 dark:text-slate-500 mt-1.5">
                Type any chapter name, subtopic, or concept found in your document to generate a dedicated slide deck.
              </p>
            </div>
          </div>

          {/* Step 2: Learning Style & Simplicity */}
          <div>
            <label className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center gap-2 mb-3">
              <span className="w-5 h-5 rounded-full bg-pink-600 text-white flex items-center justify-center text-[10px]">2</span>
              Learning & Presentation Style
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
              {[
                {
                  id: "simple",
                  name: "Simple & Easy to Learn",
                  badge: "Recommended",
                  desc: "Intuitive analogies, bite-sized bullet points, and key takeaway cards on each slide.",
                  icon: Lightbulb,
                },
                {
                  id: "exam_prep",
                  name: "Exam Cram & Revision",
                  badge: "High-Yield",
                  desc: "Clear definitions, formulas, memory mnemonics, and self-test questions.",
                  icon: GraduationCap,
                },
                {
                  id: "detailed",
                  name: "Comprehensive Lecture",
                  badge: "Deep-Dive",
                  desc: "Detailed step-by-step mechanisms, workflows, and structured technical breakdowns.",
                  icon: Layers,
                },
              ].map((style) => {
                const isSelected = learningLevel === style.id;
                const Icon = style.icon;
                return (
                  <button
                    key={style.id}
                    type="button"
                    onClick={() => setLearningLevel(style.id)}
                    className={`p-3.5 rounded-2xl border text-left transition-all flex flex-col justify-between ${
                      isSelected
                        ? "border-pink-500 bg-pink-50/80 dark:bg-pink-950/30 dark:border-pink-500 shadow-sm"
                        : "border-slate-200 dark:border-[#383832] hover:border-slate-300 dark:hover:border-slate-700 bg-white dark:bg-[#252522]"
                    }`}
                  >
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <span className={`p-1.5 rounded-lg ${isSelected ? "bg-pink-600 text-white" : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400"}`}>
                          <Icon size={16} />
                        </span>
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                          {style.badge}
                        </span>
                      </div>
                      <h4 className={`text-xs font-bold mb-1 ${isSelected ? "text-pink-900 dark:text-pink-100" : "text-slate-800 dark:text-slate-200"}`}>
                        {style.name}
                      </h4>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed">
                        {style.desc}
                      </p>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Step 3: Slide Length */}
          <div>
            <label className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center gap-2 mb-3">
              <span className="w-5 h-5 rounded-full bg-pink-600 text-white flex items-center justify-center text-[10px]">3</span>
              Deck Size & Length
            </label>
            <div className="grid grid-cols-3 gap-2.5">
              {[
                { count: 8, label: "Bite-Sized", sub: "6–8 Slides", note: "Quick Review" },
                { count: 12, label: "Standard Deck", sub: "10–12 Slides", note: "Recommended" },
                { count: 16, label: "Comprehensive", sub: "15–18 Slides", note: "Detailed Arc" },
              ].map((opt) => {
                const isSelected = slideCount === opt.count;
                return (
                  <button
                    key={opt.count}
                    type="button"
                    onClick={() => setSlideCount(opt.count)}
                    className={`p-3 rounded-2xl border text-center transition-all ${
                      isSelected
                        ? "border-pink-500 bg-pink-50/80 dark:bg-pink-950/30 text-pink-900 dark:text-pink-100 shadow-sm"
                        : "border-slate-200 dark:border-[#383832] hover:border-slate-300 dark:hover:border-slate-700 bg-white dark:bg-[#252522] text-slate-700 dark:text-slate-300"
                    }`}
                  >
                    <span className="block text-xs font-bold">{opt.label}</span>
                    <span className="block text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">{opt.sub}</span>
                    <span className={`inline-block mt-1 text-[9px] font-semibold px-1.5 py-0.5 rounded-full ${
                      isSelected ? "bg-pink-200/80 dark:bg-pink-900/60 text-pink-800 dark:text-pink-200" : "bg-slate-100 dark:bg-slate-800 text-slate-500"
                    }`}>
                      {opt.note}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

        </div>

        {/* Footer */}
        <div className={`p-6 border-t flex items-center justify-between gap-4 ${
          isDarkMode ? "border-[#383832] bg-[#22221F]" : "border-slate-100 bg-slate-50/80"
        }`}>
          <div className="min-w-0">
            <span className="text-[11px] text-slate-400 uppercase tracking-wider block font-semibold">Active Topic</span>
            <p className="text-sm font-bold truncate text-slate-800 dark:text-slate-100 max-w-sm">
              {activeTopicString}
            </p>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            <button
              type="button"
              onClick={onClose}
              disabled={isGenerating}
              className="px-4 py-2.5 rounded-xl border border-slate-200 dark:border-[#383832] hover:bg-slate-100 dark:hover:bg-slate-800 text-xs font-semibold text-slate-600 dark:text-slate-300 transition-colors disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleStartGeneration}
              disabled={isGenerating || !activeTopicString}
              className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-pink-600 via-rose-600 to-pink-700 hover:from-pink-700 hover:to-rose-800 text-white font-bold text-sm shadow-lg shadow-pink-500/25 transition-all flex items-center gap-2 hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
            >
              {isGenerating ? (
                <>
                  <Loader2 size={16} className="animate-spin" />
                  <span>Generating Easy-to-Learn Deck...</span>
                </>
              ) : (
                <>
                  <Presentation size={16} />
                  <span>Generate Topic Presentation</span>
                </>
              )}
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};

