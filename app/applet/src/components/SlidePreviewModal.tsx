import React, { useState, useEffect } from 'react';
import { 
  X, ChevronLeft, ChevronRight, Presentation, ZoomIn, ZoomOut, 
  RotateCcw, Maximize, Minimize, LayoutGrid, FileText, Sparkles, 
  Palette, Monitor, MessageSquare, Download, Layers
} from 'lucide-react';
import { Slide } from '../types';

interface SlidePreviewModalProps {
  slides: Slide[];
  theme?: "academic" | "professional" | "minimalist" | "dark" | "emerald" | "sunset";
  onClose: () => void;
  onExportPPTX?: () => void;
}

export const SlidePreviewModal: React.FC<SlidePreviewModalProps> = ({ 
  slides, 
  theme: initialTheme = "professional", 
  onClose,
  onExportPPTX 
}) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [zoomLevel, setZoomLevel] = useState(1);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [activeTheme, setActiveTheme] = useState<string>(initialTheme);
  const [viewMode, setViewMode] = useState<"deck" | "grid">("deck");
  const [showNotes, setShowNotes] = useState(false);
  const [aspectRatio, setAspectRatio] = useState<"16:9" | "4:3">("16:9");

  if (!slides || slides.length === 0) return null;

  const currentSlide = slides[currentIndex];

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowRight' || e.key === 'PageDown') {
        if (viewMode === 'deck' && currentIndex < slides.length - 1) {
          setCurrentIndex(prev => prev + 1);
        }
      } else if (e.key === 'ArrowLeft' || e.key === 'PageUp') {
        if (viewMode === 'deck' && currentIndex > 0) {
          setCurrentIndex(prev => prev - 1);
        }
      } else if (e.key === 'Escape') {
        if (isFullscreen) {
          setIsFullscreen(false);
        } else {
          onClose();
        }
      } else if (e.key.toLowerCase() === 'f') {
        setIsFullscreen(prev => !prev);
      } else if (e.key.toLowerCase() === 'g') {
        setViewMode(prev => prev === 'deck' ? 'grid' : 'deck');
      } else if (e.key.toLowerCase() === 'n') {
        setShowNotes(prev => !prev);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [currentIndex, slides.length, isFullscreen, viewMode, onClose]);

  const handleNext = () => {
    if (currentIndex < slides.length - 1) {
      setCurrentIndex(prev => prev + 1);
      setZoomLevel(1);
    }
  };

  const handlePrev = () => {
    if (currentIndex > 0) {
      setCurrentIndex(prev => prev - 1);
      setZoomLevel(1);
    }
  };

  const handleZoomIn = () => setZoomLevel(prev => Math.min(prev + 0.25, 2.5));
  const handleZoomOut = () => setZoomLevel(prev => Math.max(prev - 0.25, 0.5));
  const handleZoomReset = () => setZoomLevel(1);
  const toggleFullscreen = () => setIsFullscreen(prev => !prev);

  // Dimensions based on aspect ratio
  const slideWidth = aspectRatio === "16:9" ? 960 : 800;
  const slideHeight = aspectRatio === "16:9" ? 540 : 600;

  // Theme styling definitions
  const getThemeStyles = () => {
    switch (activeTheme) {
      case "academic":
        return {
          bg: "#FDFBF7",
          text: "#2C2A29",
          heading: "#1A1918",
          accent: "#BE123C",
          accentBg: "#FFF1F2",
          cardBg: "#F7F4EE",
          border: "#E7E2D8",
          font: '"Times New Roman", Times, serif',
          badgeText: "text-rose-700 bg-rose-50 border-rose-200"
        };
      case "minimalist":
        return {
          bg: "#FFFFFF",
          text: "#0F172A",
          heading: "#020617",
          accent: "#000000",
          accentBg: "#F1F5F9",
          cardBg: "#F8FAFC",
          border: "#E2E8F0",
          font: 'Helvetica, Arial, sans-serif',
          badgeText: "text-slate-900 bg-slate-100 border-slate-300"
        };
      case "dark":
        return {
          bg: "#0F172A",
          text: "#E2E8F0",
          heading: "#F8FAFC",
          accent: "#38BDF8",
          accentBg: "#1E293B",
          cardBg: "#1E293B",
          border: "#334155",
          font: 'Inter, sans-serif',
          badgeText: "text-sky-300 bg-sky-950 border-sky-800"
        };
      case "emerald":
        return {
          bg: "#F0FDF4",
          text: "#166534",
          heading: "#14532D",
          accent: "#15803D",
          accentBg: "#DCFCE7",
          cardBg: "#DCFCE7",
          border: "#BBF7D0",
          font: 'Inter, sans-serif',
          badgeText: "text-emerald-700 bg-emerald-100 border-emerald-300"
        };
      case "sunset":
        return {
          bg: "#FFF7ED",
          text: "#9A3412",
          heading: "#7C2D12",
          accent: "#EA580C",
          accentBg: "#FFEDD5",
          cardBg: "#FFEDD5",
          border: "#FED7AA",
          font: 'Inter, sans-serif',
          badgeText: "text-orange-700 bg-orange-100 border-orange-300"
        };
      case "professional":
      default:
        return {
          bg: "#FFFFFF",
          text: "#334155",
          heading: "#0F172A",
          accent: "#2563EB",
          accentBg: "#EFF6FF",
          cardBg: "#F8FAFC",
          border: "#E2E8F0",
          font: 'Arial, sans-serif',
          badgeText: "text-blue-700 bg-blue-50 border-blue-200"
        };
    }
  };

  const themeStyle = getThemeStyles();

  return (
    <div className={`fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/90 backdrop-blur-md transition-all duration-300 ${isFullscreen ? 'p-0' : 'p-3 md:p-6'}`}>
      <div className={`bg-white shadow-2xl overflow-hidden flex flex-col transition-all duration-300 ease-in-out ${isFullscreen ? 'w-full h-full rounded-none' : 'w-full max-w-7xl rounded-[24px] max-h-[94vh]'}`}>
        
        {/* PowerPoint Ribbon Toolbar */}
        <div className="border-b border-slate-200 px-5 py-3 flex flex-wrap items-center justify-between bg-slate-900 text-white gap-3">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-orange-600 flex items-center justify-center shadow-md">
              <Presentation size={20} className="text-white" />
            </div>
            <div>
              <h3 className="font-bold text-sm md:text-base tracking-wide flex items-center gap-2">
                PowerPoint Studio <span className="text-[10px] bg-orange-500/30 text-orange-300 border border-orange-500/40 px-2 py-0.5 rounded-full font-mono">v16.0 Live</span>
              </h3>
              <p className="text-xs text-slate-400">Slide {currentIndex + 1} of {slides.length} • {aspectRatio}</p>
            </div>
          </div>

          {/* Ribbon Controls Center */}
          <div className="flex flex-wrap items-center gap-2">
            {/* View Mode Toggle */}
            <div className="flex items-center bg-slate-800 p-1 rounded-xl border border-slate-700">
              <button
                onClick={() => setViewMode("deck")}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all ${viewMode === 'deck' ? 'bg-orange-600 text-white shadow-sm' : 'text-slate-300 hover:text-white'}`}
                title="Slide Deck Mode (Key / Arrow keys)"
              >
                <Presentation size={14} /> Slide Deck
              </button>
              <button
                onClick={() => setViewMode("grid")}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all ${viewMode === 'grid' ? 'bg-orange-600 text-white shadow-sm' : 'text-slate-300 hover:text-white'}`}
                title="Slide Sorter Grid View (Shortcut: G)"
              >
                <LayoutGrid size={14} /> Sorter Grid
              </button>
            </div>

            {/* Theme Selector */}
            <div className="hidden md:flex items-center gap-1.5 bg-slate-800 px-3 py-1.5 rounded-xl border border-slate-700">
              <Palette size={14} className="text-orange-400" />
              <select
                value={activeTheme}
                onChange={(e) => setActiveTheme(e.target.value)}
                className="bg-transparent text-xs font-medium text-slate-200 outline-none cursor-pointer"
              >
                <option value="professional" className="bg-slate-900">Corporate Blue</option>
                <option value="academic" className="bg-slate-900">Academic Editorial</option>
                <option value="minimalist" className="bg-slate-900">Clean Minimalist</option>
                <option value="dark" className="bg-slate-900">Midnight Dark</option>
                <option value="emerald" className="bg-slate-900">Emerald Executive</option>
                <option value="sunset" className="bg-slate-900">Sunset Warmth</option>
              </select>
            </div>

            {/* Aspect Ratio Selector */}
            <button
              onClick={() => setAspectRatio(prev => prev === "16:9" ? "4:3" : "16:9")}
              className="hidden lg:flex items-center gap-1 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium px-3 py-1.5 rounded-xl border border-slate-700 transition-colors"
              title="Toggle Aspect Ratio (16:9 Widescreen / 4:3 Standard)"
            >
              <Monitor size={14} /> {aspectRatio}
            </button>
          </div>

          {/* Right Action Buttons */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowNotes(prev => !prev)}
              className={`p-2 rounded-xl text-xs font-medium flex items-center gap-1.5 border transition-colors ${showNotes ? 'bg-orange-600 border-orange-500 text-white' : 'bg-slate-800 border-slate-700 text-slate-300 hover:bg-slate-700'}`}
              title="Toggle Presenter Notes (Shortcut: N)"
            >
              <MessageSquare size={16} />
              <span className="hidden sm:inline">Notes</span>
            </button>

            {onExportPPTX && (
              <button
                onClick={onExportPPTX}
                className="bg-emerald-600 hover:bg-emerald-500 text-white px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 shadow-sm transition-all"
              >
                <Download size={15} /> Export PPTX
              </button>
            )}

            <button
              onClick={toggleFullscreen}
              className="p-2 text-slate-300 hover:text-white hover:bg-slate-800 rounded-xl transition-colors hidden sm:flex items-center justify-center"
              title={isFullscreen ? "Exit Fullscreen (F)" : "Fullscreen (F)"}
            >
              {isFullscreen ? <Minimize size={18} /> : <Maximize size={18} />}
            </button>

            <button
              onClick={onClose}
              className="p-2 bg-slate-800 hover:bg-rose-600 text-slate-300 hover:text-white rounded-xl transition-colors flex items-center justify-center"
              title="Close (Esc)"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Main Workspace Area */}
        <div className="flex-1 overflow-hidden flex flex-col md:flex-row bg-slate-900">
          
          {/* Main Slide Stage / Grid */}
          <div className="flex-1 overflow-auto bg-slate-950/80 relative flex items-center justify-center p-6 md:p-10 custom-scrollbar">
            
            {viewMode === "grid" ? (
              /* Slide Sorter Grid View */
              <div className="w-full max-w-6xl grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6 p-4">
                {slides.map((s, idx) => (
                  <div
                    key={idx}
                    onClick={() => {
                      setCurrentIndex(idx);
                      setViewMode("deck");
                    }}
                    className={`group relative rounded-xl border-2 cursor-pointer transition-all duration-200 overflow-hidden shadow-lg hover:scale-105 ${currentIndex === idx ? 'border-orange-500 ring-4 ring-orange-500/20' : 'border-slate-800 hover:border-slate-600'}`}
                    style={{ aspectRatio: '16/9', backgroundColor: themeStyle.bg }}
                  >
                    <div className="absolute inset-0 p-4 flex flex-col justify-between pointer-events-none">
                      <div className="flex justify-between items-start">
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-black/10 text-slate-800">
                          {s.slideType || `Slide ${idx + 1}`}
                        </span>
                        <span className="text-xs font-mono font-bold text-slate-500">#{idx + 1}</span>
                      </div>
                      <h4 className="font-bold text-xs line-clamp-2 text-slate-900 leading-snug">
                        {s.title}
                      </h4>
                      <div className="space-y-1">
                        {(s.bullets || []).slice(0, 2).map((b, bIdx) => (
                          <div key={bIdx} className="text-[9px] text-slate-600 truncate flex items-center gap-1">
                            <span className="w-1 h-1 rounded-full bg-orange-500"></span>
                            {b}
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              /* Single Slide Presentation Stage */
              <div className="flex flex-col items-center justify-center w-full h-full">
                {/* Zoom Controls Bar floating */}
                <div className="absolute top-4 right-4 z-20 flex items-center bg-slate-900/90 backdrop-blur-md border border-slate-700 rounded-xl p-1 shadow-xl text-white">
                  <button onClick={handleZoomOut} disabled={zoomLevel <= 0.5} className="p-2 hover:bg-slate-800 disabled:opacity-40 rounded-lg transition-colors" title="Zoom Out">
                    <ZoomOut size={16} />
                  </button>
                  <span className="text-xs font-mono font-semibold w-12 text-center text-orange-400">
                    {Math.round(zoomLevel * 100)}%
                  </span>
                  <button onClick={handleZoomIn} disabled={zoomLevel >= 2.5} className="p-2 hover:bg-slate-800 disabled:opacity-40 rounded-lg transition-colors" title="Zoom In">
                    <ZoomIn size={16} />
                  </button>
                  <div className="w-px h-4 bg-slate-700 mx-1"></div>
                  <button onClick={handleZoomReset} className="p-2 hover:bg-slate-800 rounded-lg transition-colors" title="Reset Zoom">
                    <RotateCcw size={14} />
                  </button>
                </div>

                {/* Slide Canvas Wrapper */}
                <div 
                  className="transition-all duration-300 ease-out shadow-2xl rounded-2xl overflow-hidden relative flex items-center justify-center"
                  style={{
                    width: `${slideWidth * zoomLevel}px`,
                    height: `${slideHeight * zoomLevel}px`,
                  }}
                >
                  <div 
                    className="absolute top-0 left-0 flex flex-col justify-between p-10 md:p-14 overflow-hidden shadow-2xl transition-all"
                    style={{
                      width: `${slideWidth}px`,
                      height: `${slideHeight}px`,
                      transform: `scale(${zoomLevel})`,
                      transformOrigin: 'top left',
                      backgroundColor: themeStyle.bg,
                      color: themeStyle.text,
                      fontFamily: themeStyle.font,
                      border: `1px solid ${themeStyle.border}`
                    }}
                  >
                    {/* Decorative PowerPoint Accent Header / Border */}
                    {activeTheme === "professional" && (
                      <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-500"></div>
                    )}
                    {activeTheme === "academic" && (
                      <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-rose-700 via-amber-600 to-rose-800"></div>
                    )}
                    {activeTheme === "dark" && (
                      <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-sky-500 via-indigo-500 to-purple-500"></div>
                    )}
                    {activeTheme === "emerald" && (
                      <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-500"></div>
                    )}
                    {activeTheme === "sunset" && (
                      <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-orange-600 via-amber-500 to-red-600"></div>
                    )}

                    {/* Slide Top Meta */}
                    <div className="flex justify-between items-center mb-4">
                      <span className={`text-xs font-bold uppercase tracking-widest px-3 py-1 rounded-full border ${themeStyle.badgeText}`}>
                        {currentSlide.slideType ? `${currentSlide.slideType.toUpperCase()} SLIDE` : "PRESENTATION SLIDE"}
                      </span>
                      <span className="text-xs font-mono font-semibold opacity-50">
                        Slide {currentIndex + 1} / {slides.length}
                      </span>
                    </div>

                    {/* Slide Title */}
                    <h2 
                      className="font-bold mb-6 tracking-tight leading-tight"
                      style={{ 
                        color: themeStyle.heading,
                        fontSize: currentSlide.title.length > 50 ? '2rem' : '2.75rem' 
                      }}
                    >
                      {currentSlide.title}
                    </h2>

                    {/* Slide Body Content (Bullets & Diagrams) */}
                    <div className="flex-1 overflow-y-auto space-y-4 pr-2 custom-scrollbar">
                      {currentSlide.bullets && currentSlide.bullets.length > 0 && (
                        <ul className="space-y-3">
                          {currentSlide.bullets.map((bullet, idx) => (
                            <li key={idx} className="flex items-start text-lg md:text-xl leading-relaxed">
                              <span 
                                className="mr-4 mt-1.5 flex-shrink-0 text-xl font-bold"
                                style={{ color: themeStyle.accent }}
                              >
                                ▸
                              </span>
                              <span className="opacity-90">{bullet}</span>
                            </li>
                          ))}
                        </ul>
                      )}

                      {/* Diagrams / Structured Grid Cards */}
                      {currentSlide.diagrams && currentSlide.diagrams.length > 0 && (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6">
                          {currentSlide.diagrams.map((diag, dIdx) => (
                            <div 
                              key={dIdx} 
                              className="p-4 rounded-xl border shadow-sm transition-all"
                              style={{ 
                                backgroundColor: themeStyle.cardBg, 
                                borderColor: themeStyle.border 
                              }}
                            >
                              <h4 className="font-bold text-base mb-2" style={{ color: themeStyle.heading }}>
                                {diag.title}
                              </h4>
                              <ul className="list-disc pl-5 space-y-1 text-sm opacity-80">
                                {(diag.items || []).map((item, iIdx) => (
                                  <li key={iIdx}>{item}</li>
                                ))}
                              </ul>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Slide Footer Branding */}
                    <div className="mt-auto pt-6 border-t flex justify-between items-center text-xs opacity-60 font-medium" style={{ borderColor: themeStyle.border }}>
                      <span>EduSmart AI Professional Presentation</span>
                      <span className="font-mono">{currentIndex + 1}</span>
                    </div>
                  </div>
                </div>

                {/* Presentation Navigation Footer Controls */}
                <div className="mt-6 flex items-center justify-between w-full max-w-4xl px-4">
                  <button
                    onClick={handlePrev}
                    disabled={currentIndex === 0}
                    className="flex items-center gap-2 px-5 py-2.5 bg-slate-800 hover:bg-slate-700 disabled:opacity-40 disabled:cursor-not-allowed text-white rounded-xl font-semibold shadow-md transition-all"
                  >
                    <ChevronLeft size={18} /> Previous Slide
                  </button>

                  {/* Slide Filmstrip Bar */}
                  <div className="hidden md:flex items-center gap-1.5 bg-slate-950 p-1.5 rounded-xl border border-slate-800 max-w-md overflow-x-auto custom-scrollbar">
                    {slides.map((_, sIdx) => (
                      <button
                        key={sIdx}
                        onClick={() => {
                          setCurrentIndex(sIdx);
                          setZoomLevel(1);
                        }}
                        className={`w-7 h-7 rounded-lg text-xs font-bold font-mono transition-all flex items-center justify-center ${currentIndex === sIdx ? 'bg-orange-600 text-white shadow' : 'bg-slate-900 text-slate-400 hover:bg-slate-800 hover:text-white'}`}
                      >
                        {sIdx + 1}
                      </button>
                    ))}
                  </div>

                  <button
                    onClick={handleNext}
                    disabled={currentIndex === slides.length - 1}
                    className="flex items-center gap-2 px-5 py-2.5 bg-orange-600 hover:bg-orange-500 disabled:opacity-40 disabled:cursor-not-allowed text-white rounded-xl font-semibold shadow-md transition-all"
                  >
                    Next Slide <ChevronRight size={18} />
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Speaker Notes Sidebar / Drawer */}
          {showNotes && (
            <div className="w-full md:w-80 bg-slate-950 border-t md:border-t-0 md:border-l border-slate-800 p-5 flex flex-col shadow-2xl">
              <div className="flex items-center justify-between pb-3 border-b border-slate-800 mb-4">
                <h4 className="text-sm font-bold text-slate-200 flex items-center gap-2">
                  <MessageSquare size={16} className="text-orange-400" /> Presenter Notes
                </h4>
                <button onClick={() => setShowNotes(false)} className="text-slate-400 hover:text-white">
                  <X size={16} />
                </button>
              </div>
              <div className="flex-1 overflow-y-auto text-xs text-slate-300 space-y-3 leading-relaxed custom-scrollbar bg-slate-900/60 p-4 rounded-xl border border-slate-800/80">
                {currentSlide.speakerNotes ? (
                  <p>{currentSlide.speakerNotes}</p>
                ) : (
                  <div className="text-center py-8 text-slate-500 italic">
                    <Sparkles size={24} className="mx-auto mb-2 opacity-40" />
                    No speaker notes generated for this slide. Use AI Presenter Assistant to generate professional talking points.
                  </div>
                )}
              </div>
              <div className="mt-4 pt-3 border-t border-slate-800 text-[10px] text-slate-500 text-center">
                Press <kbd className="px-1.5 py-0.5 rounded bg-slate-800 text-slate-300 font-mono">N</kbd> to toggle notes
              </div>
            </div>
          )}
        </div>

      </div>
    </div>
  );
};
