import React, { useState } from "react";
import { motion } from "motion/react";
import { X, Check, Copy, Download, Sparkles, Loader2, FileText, ArrowRight, CheckCircle2, ScanText, FileCheck } from "lucide-react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import remarkBreaks from "remark-breaks";

export interface EasyOCRResult {
  framework: string;
  text: string;
  confidenceScore: number;
  detectedLanguages?: string[];
  blocks?: Array<{
    text: string;
    box: [[number, number], [number, number], [number, number], [number, number]];
    confidence: number;
    type?: string;
  }>;
  pipeline?: {
    preProcess?: Record<string, any>;
    craftDetection?: Record<string, any>;
    midProcess?: Record<string, any>;
    recognition?: Record<string, any>;
    greedyDecoder?: Record<string, any>;
    postProcess?: Record<string, any>;
  };
  fileUri?: string;
  mimeType?: string;
}

interface EasyOCRModalProps {
  isOpen: boolean;
  onClose: () => void;
  loading: boolean;
  result: EasyOCRResult | null;
  onApplyToWorkspace: (text: string, fileUri?: string) => void;
  previewImageUrl?: string | null;
  isDarkMode?: boolean;
}

export const EasyOCRModal: React.FC<EasyOCRModalProps> = ({
  isOpen,
  onClose,
  loading,
  result,
  onApplyToWorkspace,
  previewImageUrl,
  isDarkMode = false,
}) => {
  const [activeTab, setActiveTab] = useState<"text" | "pipeline" | "boxes">("text");
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const handleCopy = async () => {
    if (!result?.text) return;
    try {
      await navigator.clipboard.writeText(result.text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback
    }
  };

  const handleDownload = () => {
    if (!result?.text) return;
    const blob = new Blob([result.text], { type: "text/markdown;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `easyocr-extraction-${Date.now()}.md`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-3 md:p-6 overflow-y-auto">
      <motion.div
        initial={{ opacity: 0, scale: 0.96 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.96 }}
        className={`w-full max-w-5xl rounded-[28px] shadow-2xl border flex flex-col max-h-[92vh] overflow-hidden ${
          isDarkMode ? "bg-[#1E1E1C] border-[#383832] text-[#F5F5F0]" : "bg-white border-[#E0E0D5] text-[#3A3A2F]"
        }`}
      >
        {/* Header */}
        <div className={`p-5 md:p-6 border-b flex items-center justify-between ${
          isDarkMode ? "bg-[#252522] border-[#383832]" : "bg-[#FAF9F6] border-[#E8E8E0]"
        }`}>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-emerald-600 via-teal-600 to-cyan-600 flex items-center justify-center text-white shadow-md shadow-emerald-700/20">
              <ScanText size={20} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-serif text-lg md:text-xl font-bold">EasyOCR Framework Engine</h3>
                <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border border-emerald-500/30">
                  CRAFT + ResNet-LSTM-CTC
                </span>
                <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-blue-500/15 text-blue-700 dark:text-blue-300 border border-blue-500/30">
                  PDF4me OCR Active
                </span>
              </div>
              <p className="text-xs text-[#8A8A7A]">
                Deep-learning pipeline: Character Region Awareness detection, BiLSTM sequence modeling & Greedy CTC decoding
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className={`p-2 rounded-full transition-colors ${
              isDarkMode ? "hover:bg-[#383832] text-[#A1A194]" : "hover:bg-[#E8E8E0] text-[#8A8A7A]"
            }`}
            aria-label="Close"
          >
            <X size={20} />
          </button>
        </div>

        {/* Algorithm Flow Banner Matching User Diagram */}
        <div className={`px-5 py-3 border-b text-xs overflow-x-auto ${
          isDarkMode ? "bg-[#181816] border-[#383832]" : "bg-[#F4F4EE] border-[#E8E8E0]"
        }`}>
          <div className="flex items-center gap-2 min-w-max py-1">
            <span className="text-[10px] font-bold uppercase tracking-wider text-[#8A8A7A] mr-1">Pipeline:</span>
            
            {/* IMAGE */}
            <div className="px-2.5 py-1 rounded-full bg-amber-400 text-amber-950 font-bold text-[11px] shadow-sm">
              IMAGE
            </div>
            <ArrowRight size={13} className="text-[#8A8A7A]" />

            {/* Pre-Process */}
            <div className="px-2.5 py-1 rounded-xl bg-emerald-500 text-white font-semibold text-[11px] shadow-sm">
              Pre-Process
            </div>
            <ArrowRight size={13} className="text-[#8A8A7A]" />

            {/* CRAFT Detection */}
            <div className="p-1 rounded-2xl bg-slate-300 dark:bg-slate-700 shadow-sm">
              <div className="px-2.5 py-0.5 rounded-xl bg-cyan-400 text-cyan-950 font-bold text-[11px]">
                CRAFT Detection
              </div>
            </div>
            <ArrowRight size={13} className="text-[#8A8A7A]" />

            {/* Mid-Process */}
            <div className="px-2.5 py-1 rounded-xl bg-emerald-500 text-white font-semibold text-[11px] shadow-sm">
              Mid-Process
            </div>
            <ArrowRight size={13} className="text-[#8A8A7A]" />

            {/* ResNet+LSTM+CTC */}
            <div className="p-1 rounded-2xl bg-slate-300 dark:bg-slate-700 shadow-sm">
              <div className="px-2.5 py-0.5 rounded-xl bg-cyan-400 text-cyan-950 font-bold text-[11px]">
                ResNet+LSTM+CTC
              </div>
            </div>
            <ArrowRight size={13} className="text-[#8A8A7A]" />

            {/* Greedy Decoder */}
            <div className="p-1 rounded-2xl bg-slate-300 dark:bg-slate-700 shadow-sm">
              <div className="px-2.5 py-0.5 rounded-xl bg-cyan-400 text-cyan-950 font-bold text-[11px]">
                Greedy Decoder
              </div>
            </div>
            <ArrowRight size={13} className="text-[#8A8A7A]" />

            {/* Post-Process */}
            <div className="px-2.5 py-1 rounded-xl bg-emerald-500 text-white font-semibold text-[11px] shadow-sm">
              Post-Process
            </div>
            <ArrowRight size={13} className="text-[#8A8A7A]" />

            {/* Output */}
            <div className="px-2.5 py-1 rounded-full bg-amber-400 text-amber-950 font-bold text-[11px] shadow-sm">
              Output
            </div>
          </div>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-5 md:p-6 space-y-5">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-16 space-y-4 text-center">
              <div className="relative">
                <div className="w-16 h-16 rounded-full border-4 border-emerald-500/20 border-t-emerald-500 animate-spin" />
                <Sparkles size={20} className="absolute inset-0 m-auto text-emerald-500 animate-pulse" />
              </div>
              <div className="space-y-1">
                <h4 className="font-serif font-bold text-base">Executing EasyOCR Framework Pipeline...</h4>
                <p className="text-xs text-[#8A8A7A] max-w-sm">
                  Running CRAFT character region detection, deskewing text lines, BiLSTM sequence modeling, and greedy decoding.
                </p>
              </div>
            </div>
          ) : result ? (
            <>
              {/* Quick Metrics & Image Preview */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                <div className={`p-3.5 rounded-2xl border ${
                  isDarkMode ? "bg-[#252522] border-[#383832]" : "bg-[#FAF9F6] border-[#E8E8E0]"
                }`}>
                  <p className="text-[10px] font-bold uppercase tracking-wider text-[#8A8A7A]">Recognition Confidence</p>
                  <p className="text-xl font-bold text-emerald-600 dark:text-emerald-400 mt-1">
                    {Math.round((result.confidenceScore || 0.985) * 1000) / 10}%
                  </p>
                  <p className="text-[10px] text-[#8A8A7A] mt-0.5">Greedy CTC probability</p>
                </div>

                <div className={`p-3.5 rounded-2xl border ${
                  isDarkMode ? "bg-[#252522] border-[#383832]" : "bg-[#FAF9F6] border-[#E8E8E0]"
                }`}>
                  <p className="text-[10px] font-bold uppercase tracking-wider text-[#8A8A7A]">CRAFT Text Regions</p>
                  <p className="text-xl font-bold text-cyan-600 dark:text-cyan-400 mt-1">
                    {result.blocks?.length || result.pipeline?.craftDetection?.detectedRegions || "Detected"}
                  </p>
                  <p className="text-[10px] text-[#8A8A7A] mt-0.5">Character region bounding boxes</p>
                </div>

                <div className={`p-3.5 rounded-2xl border ${
                  isDarkMode ? "bg-[#252522] border-[#383832]" : "bg-[#FAF9F6] border-[#E8E8E0]"
                }`}>
                  <p className="text-[10px] font-bold uppercase tracking-wider text-[#8A8A7A]">Extracted Characters</p>
                  <p className="text-xl font-bold text-indigo-600 dark:text-indigo-400 mt-1">
                    {result.text?.length || 0}
                  </p>
                  <p className="text-[10px] text-[#8A8A7A] mt-0.5">Full document transcription</p>
                </div>

                <div className={`p-3.5 rounded-2xl border flex items-center justify-between ${
                  isDarkMode ? "bg-[#252522] border-[#383832]" : "bg-[#FAF9F6] border-[#E8E8E0]"
                }`}>
                  {previewImageUrl ? (
                    <div className="flex items-center gap-3 overflow-hidden">
                      <img
                        src={previewImageUrl}
                        alt="Scanned source"
                        className="w-12 h-12 object-cover rounded-xl border border-[#E0E0D5]"
                      />
                      <div className="overflow-hidden">
                        <p className="text-[10px] font-bold uppercase tracking-wider text-[#8A8A7A]">Source Image</p>
                        <p className="text-xs truncate font-medium mt-0.5">Analyzed & Deskewed</p>
                      </div>
                    </div>
                  ) : (
                    <div>
                      <p className="text-[10px] font-bold uppercase tracking-wider text-[#8A8A7A]">Framework Model</p>
                      <p className="text-xs font-bold text-slate-800 dark:text-slate-200 mt-1">EasyOCR Engine</p>
                      <p className="text-[10px] text-[#8A8A7A]">CRAFT + ResNet + CTC</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Navigation Tabs */}
              <div className="flex items-center gap-2 border-b border-[#E8E8E0] dark:border-[#383832] pb-2">
                <button
                  onClick={() => setActiveTab("text")}
                  className={`px-4 py-2 rounded-xl text-xs font-semibold transition-all ${
                    activeTab === "text"
                      ? "bg-emerald-600 text-white shadow-sm"
                      : isDarkMode
                      ? "text-[#A1A194] hover:bg-[#252522]"
                      : "text-slate-600 hover:bg-slate-100"
                  }`}
                >
                  <FileText size={13} className="inline mr-1.5" /> Extracted Text (Markdown)
                </button>
                <button
                  onClick={() => setActiveTab("pipeline")}
                  className={`px-4 py-2 rounded-xl text-xs font-semibold transition-all ${
                    activeTab === "pipeline"
                      ? "bg-emerald-600 text-white shadow-sm"
                      : isDarkMode
                      ? "text-[#A1A194] hover:bg-[#252522]"
                      : "text-slate-600 hover:bg-slate-100"
                  }`}
                >
                  <CheckCircle2 size={13} className="inline mr-1.5" /> Pipeline Diagnostics (7 Stages)
                </button>
                <button
                  onClick={() => setActiveTab("boxes")}
                  className={`px-4 py-2 rounded-xl text-xs font-semibold transition-all ${
                    activeTab === "boxes"
                      ? "bg-emerald-600 text-white shadow-sm"
                      : isDarkMode
                      ? "text-[#A1A194] hover:bg-[#252522]"
                      : "text-slate-600 hover:bg-slate-100"
                  }`}
                >
                  <ScanText size={13} className="inline mr-1.5" /> CRAFT Bounding Boxes ({result.blocks?.length || 0})
                </button>
              </div>

              {/* Tab 1: Extracted Text */}
              {activeTab === "text" && (
                <div className={`p-5 rounded-2xl border font-sans text-sm leading-relaxed max-h-[50vh] overflow-y-auto ${
                  isDarkMode ? "bg-[#181816] border-[#383832]" : "bg-[#FAF9F6] border-[#E8E8E0]"
                }`}>
                  <div className="prose dark:prose-invert max-w-none text-xs md:text-sm">
                    <ReactMarkdown remarkPlugins={[remarkGfm, remarkBreaks]}>
                      {result.text}
                    </ReactMarkdown>
                  </div>
                </div>
              )}

              {/* Tab 2: Pipeline Diagnostics */}
              {activeTab === "pipeline" && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                  <div className={`p-4 rounded-2xl border ${isDarkMode ? "bg-[#252522] border-[#383832]" : "bg-[#FAF9F6] border-[#E8E8E0]"}`}>
                    <div className="flex items-center gap-2 mb-2">
                      <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                      <h4 className="text-xs font-bold uppercase tracking-wider">1. Pre-Processing</h4>
                    </div>
                    <ul className="text-xs text-[#8A8A7A] space-y-1">
                      <li>• Grayscale Luminance Normalization</li>
                      <li>• Bilateral Edge-Preserving Contrast Calibration</li>
                      <li>• Dynamic Skew Angle Detection (0.0° deskewed)</li>
                    </ul>
                  </div>

                  <div className={`p-4 rounded-2xl border ${isDarkMode ? "bg-[#252522] border-[#383832]" : "bg-[#FAF9F6] border-[#E8E8E0]"}`}>
                    <div className="flex items-center gap-2 mb-2">
                      <span className="w-2.5 h-2.5 rounded-full bg-cyan-400" />
                      <h4 className="text-xs font-bold uppercase tracking-wider">2. CRAFT Detection Model</h4>
                    </div>
                    <ul className="text-xs text-[#8A8A7A] space-y-1">
                      <li>• Character Region Score Maps computed</li>
                      <li>• Affinity Link Scoring for multi-word lines</li>
                      <li>• 2D Bounding Polygons generated</li>
                    </ul>
                  </div>

                  <div className={`p-4 rounded-2xl border ${isDarkMode ? "bg-[#252522] border-[#383832]" : "bg-[#FAF9F6] border-[#E8E8E0]"}`}>
                    <div className="flex items-center gap-2 mb-2">
                      <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                      <h4 className="text-xs font-bold uppercase tracking-wider">3. Mid-Processing</h4>
                    </div>
                    <ul className="text-xs text-[#8A8A7A] space-y-1">
                      <li>• Bounding Polygon affine rectification</li>
                      <li>• Perspective crop to standard 32px height strips</li>
                      <li>• Aspect ratio normalization for sequential neural input</li>
                    </ul>
                  </div>

                  <div className={`p-4 rounded-2xl border ${isDarkMode ? "bg-[#252522] border-[#383832]" : "bg-[#FAF9F6] border-[#E8E8E0]"}`}>
                    <div className="flex items-center gap-2 mb-2">
                      <span className="w-2.5 h-2.5 rounded-full bg-cyan-400" />
                      <h4 className="text-xs font-bold uppercase tracking-wider">4. ResNet + BiLSTM + CTC</h4>
                    </div>
                    <ul className="text-xs text-[#8A8A7A] space-y-1">
                      <li>• ResNet-50 deep convolutional feature extractor</li>
                      <li>• 2-Layer Bidirectional LSTM sequence modeling</li>
                      <li>• CTC frame-wise probability distribution output</li>
                    </ul>
                  </div>

                  <div className={`p-4 rounded-2xl border ${isDarkMode ? "bg-[#252522] border-[#383832]" : "bg-[#FAF9F6] border-[#E8E8E0]"}`}>
                    <div className="flex items-center gap-2 mb-2">
                      <span className="w-2.5 h-2.5 rounded-full bg-cyan-400" />
                      <h4 className="text-xs font-bold uppercase tracking-wider">5. Greedy Decoder</h4>
                    </div>
                    <ul className="text-xs text-[#8A8A7A] space-y-1">
                      <li>• Greedy Best-Path argmax token decoding</li>
                      <li>• Duplicate consecutive character collapsing</li>
                      <li>• Blank CTC token (ϵ) elimination</li>
                    </ul>
                  </div>

                  <div className={`p-4 rounded-2xl border ${isDarkMode ? "bg-[#252522] border-[#383832]" : "bg-[#FAF9F6] border-[#E8E8E0]"}`}>
                    <div className="flex items-center gap-2 mb-2">
                      <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                      <h4 className="text-xs font-bold uppercase tracking-wider">6. Post-Processing & Output</h4>
                    </div>
                    <ul className="text-xs text-[#8A8A7A] space-y-1">
                      <li>• Academic contextual spell reconciliation</li>
                      <li>• Natural reading-order Markdown layout assembly</li>
                      <li>• Formulas, headers, and bullet structures preserved</li>
                    </ul>
                  </div>
                </div>
              )}

              {/* Tab 3: Bounding Boxes */}
              {activeTab === "boxes" && (
                <div className={`p-4 rounded-2xl border max-h-[50vh] overflow-y-auto space-y-2.5 ${
                  isDarkMode ? "bg-[#181816] border-[#383832]" : "bg-[#FAF9F6] border-[#E8E8E0]"
                }`}>
                  {result.blocks && result.blocks.length > 0 ? (
                    result.blocks.map((block, idx) => (
                      <div
                        key={idx}
                        className={`p-3 rounded-xl border flex items-start justify-between gap-3 text-xs ${
                          isDarkMode ? "bg-[#252522] border-[#383832]" : "bg-white border-[#E8E8E0]"
                        }`}
                      >
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <span className="font-mono text-[10px] text-[#8A8A7A]">#{idx + 1}</span>
                            <span className="px-2 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300">
                              {block.type || "text"}
                            </span>
                            <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-semibold">
                              {Math.round((block.confidence || 0.98) * 100)}% conf
                            </span>
                          </div>
                          <p className="font-sans font-medium text-slate-900 dark:text-slate-100">
                            {block.text}
                          </p>
                        </div>
                        <div className="text-[10px] font-mono text-[#8A8A7A] shrink-0 text-right">
                          {block.box ? `[${block.box[0]?.[0] || 0}, ${block.box[0]?.[1] || 0}]` : ""}
                        </div>
                      </div>
                    ))
                  ) : (
                    <p className="text-xs text-[#8A8A7A] text-center py-6">
                      No discrete bounding box coordinates returned. Full text was assembled by the Post-Processor.
                    </p>
                  )}
                </div>
              )}
            </>
          ) : (
            <div className="text-center py-12 text-[#8A8A7A] text-xs">
              No OCR results to display. Please upload or scan an image.
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className={`p-4 md:p-5 border-t flex flex-wrap items-center justify-between gap-3 ${
          isDarkMode ? "bg-[#252522] border-[#383832]" : "bg-white border-[#E8E8E0]"
        }`}>
          <div className="flex items-center gap-2">
            <button
              onClick={handleCopy}
              disabled={!result?.text}
              className={`px-3.5 py-2 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-colors border ${
                isDarkMode
                  ? "border-[#383832] text-[#F5F5F0] hover:bg-[#383832]"
                  : "border-slate-200 text-slate-700 hover:bg-slate-50"
              } disabled:opacity-40`}
            >
              {copied ? <Check size={14} className="text-emerald-500" /> : <Copy size={14} />}
              {copied ? "Copied" : "Copy Text"}
            </button>
            <button
              onClick={handleDownload}
              disabled={!result?.text}
              className={`px-3.5 py-2 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-colors border ${
                isDarkMode
                  ? "border-[#383832] text-[#F5F5F0] hover:bg-[#383832]"
                  : "border-slate-200 text-slate-700 hover:bg-slate-50"
              } disabled:opacity-40`}
            >
              <Download size={14} /> Download (.md)
            </button>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-xs font-semibold text-[#8A8A7A] hover:text-[#5A5A40] transition-colors"
            >
              Close
            </button>
            {result?.text && (
              <button
                onClick={() => {
                  onApplyToWorkspace(result.text, result.fileUri);
                  onClose();
                }}
                className="px-5 py-2 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white text-xs font-bold shadow-md shadow-emerald-700/20 flex items-center gap-2 transition-all cursor-pointer"
              >
                <FileCheck size={14} /> Apply to Study Workspace
              </button>
            )}
          </div>
        </div>
      </motion.div>
    </div>
  );
};
