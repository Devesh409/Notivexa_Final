import React, { useState } from 'react';
import { X, ChevronLeft, ChevronRight, Presentation, ZoomIn, ZoomOut, RotateCcw, Maximize, Minimize, Lightbulb, Sparkles, Layers } from 'lucide-react';
import { Slide } from '../types';

interface SlidePreviewModalProps {
  slides: Slide[];
  topic?: string;
  theme?: "academic" | "professional" | "minimalist" | "pastel";
  onClose: () => void;
}

export const SlidePreviewModal: React.FC<SlidePreviewModalProps> = ({ slides, topic, theme = "academic", onClose }) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [zoomLevel, setZoomLevel] = useState(1);
  const [isFullscreen, setIsFullscreen] = useState(false);

  if (!slides || slides.length === 0) return null;

  const currentSlide = slides[currentIndex];

  const handleNext = () => {
    if (currentIndex < slides.length - 1) {
      setCurrentIndex(currentIndex + 1);
      setZoomLevel(1);
    }
  };

  const handlePrev = () => {
    if (currentIndex > 0) {
      setCurrentIndex(currentIndex - 1);
      setZoomLevel(1);
    }
  };

  const handleZoomIn = () => setZoomLevel(prev => Math.min(prev + 0.25, 3));
  const handleZoomOut = () => setZoomLevel(prev => Math.max(prev - 0.25, 0.5));
  const handleZoomReset = () => setZoomLevel(1);
  const toggleFullscreen = () => setIsFullscreen(prev => !prev);

  // Helper to format bold keywords in bullets
  const renderFormattedBullet = (text: string) => {
    const boldMatch = text.match(/^\s*\*\*(.*?)\*\*\s*[:\-]?\s*(.*)/);
    if (boldMatch) {
      return (
        <span>
          <strong className="font-bold underline decoration-pink-300 decoration-2 underline-offset-2">
            {boldMatch[1]}
          </strong>
          {boldMatch[2] ? `: ${boldMatch[2]}` : ""}
        </span>
      );
    }
    return <span>{text}</span>;
  };

  // Fixed slide dimensions for consistent scaling (16:9 ratio)
  const slideWidth = 896; 
  const slideHeight = 504;

  return (
    <div className={`fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/90 backdrop-blur-sm transition-all duration-300 ${isFullscreen ? 'p-0' : 'p-4 md:p-8'}`}>
      <div className={`bg-white shadow-2xl overflow-hidden flex flex-col transition-all duration-300 ease-in-out ${isFullscreen ? 'w-full h-full rounded-none' : 'w-full max-w-6xl rounded-[24px] max-h-[90vh]'}`}>
        {/* Header */}
        <div className="border-b border-slate-200 p-4 flex items-center justify-between bg-slate-50">
          <div className="flex items-center gap-2 min-w-0">
            <Presentation className="text-pink-600 shrink-0" size={20} />
            <h3 className="font-semibold text-slate-800 truncate">Slide Preview</h3>
            {topic && (
              <span className="hidden sm:inline-block max-w-xs truncate text-xs font-semibold px-2.5 py-1 rounded-full bg-pink-100 text-pink-700 border border-pink-200 ml-1">
                {topic}
              </span>
            )}
            <span className="bg-slate-200 text-slate-600 text-xs font-bold px-2 py-1 rounded-full ml-1 shrink-0">
              {currentIndex + 1} of {slides.length}
            </span>
          </div>
          
          <div className="flex items-center gap-3">
            {/* Zoom Controls */}
            <div className="flex items-center bg-white border border-slate-200 rounded-lg p-1 shadow-sm">
              <button 
                onClick={handleZoomOut} 
                disabled={zoomLevel <= 0.5}
                className="p-1.5 text-slate-500 hover:bg-slate-100 disabled:opacity-50 disabled:cursor-not-allowed rounded transition-colors"
                title="Zoom Out"
              >
                <ZoomOut size={16} />
              </button>
              <span className="text-xs font-semibold text-slate-600 w-12 text-center select-none">
                {Math.round(zoomLevel * 100)}%
              </span>
              <button 
                onClick={handleZoomIn} 
                disabled={zoomLevel >= 3}
                className="p-1.5 text-slate-500 hover:bg-slate-100 disabled:opacity-50 disabled:cursor-not-allowed rounded transition-colors"
                title="Zoom In"
              >
                <ZoomIn size={16} />
              </button>
              <div className="w-px h-4 bg-slate-200 mx-1"></div>
              <button 
                onClick={handleZoomReset} 
                className="p-1.5 text-slate-500 hover:bg-slate-100 rounded transition-colors"
                title="Reset Zoom"
              >
                <RotateCcw size={14} />
              </button>
            </div>

            <button 
              onClick={toggleFullscreen}
              className="text-slate-400 hover:text-slate-600 hover:bg-slate-200 p-2 rounded-xl transition-colors hidden sm:flex items-center justify-center"
              title={isFullscreen ? "Exit Fullscreen" : "Fullscreen"}
            >
              {isFullscreen ? <Minimize size={20} /> : <Maximize size={20} />}
            </button>

            <button 
              onClick={onClose}
              className="text-slate-400 hover:text-slate-600 hover:bg-slate-200 p-2 rounded-xl transition-colors flex items-center justify-center"
            >
              <X size={20} />
            </button>
          </div>
        </div>

        {/* Slide Content Canvas */}
        <div className="flex-1 overflow-auto bg-slate-100 relative custom-scrollbar">
          <div className="min-h-full min-w-full flex p-8">
            <div 
              className="m-auto relative transition-all duration-200 ease-out"
              style={{
                width: `${slideWidth * zoomLevel}px`,
                height: `${slideHeight * zoomLevel}px`
              }}
            >
              <div 
                className="absolute top-0 left-0 rounded-2xl shadow-xl border border-slate-200 p-8 md:p-10 flex flex-col justify-between overflow-hidden transition-transform duration-200 ease-out"
                style={{
                  width: `${slideWidth}px`,
                  height: `${slideHeight}px`,
                  transform: `scale(${zoomLevel})`,
                  transformOrigin: 'top left',
                  backgroundColor: theme === "professional" ? "#FFFFFF" : theme === "minimalist" ? "#F8FAFC" : theme === "pastel" ? "#FEF2F2" : "#FDFBF7",
                  fontFamily: theme === "professional" ? "Arial, sans-serif" : theme === "minimalist" || theme === "pastel" ? "Helvetica, sans-serif" : '"Times New Roman", Times, serif'
                }}
              >
                {/* Accent Line */}
                {theme !== "minimalist" && (
                  <>
                    <div className={`absolute top-0 left-0 w-full h-2 ${theme === "professional" ? "bg-blue-600" : theme === "pastel" ? "bg-pink-300" : "bg-gradient-to-r from-pink-500 via-rose-500 to-pink-600"}`}></div>
                    <div className={`absolute bottom-0 left-0 w-full h-1 ${theme === "professional" ? "bg-blue-600" : theme === "pastel" ? "bg-pink-300" : "bg-rose-600"}`}></div>
                  </>
                )}
                
                <div>
                  {/* Category Tag Badge */}
                  <div className="flex items-center gap-2 mb-3">
                    <span className={`text-[11px] font-bold px-2.5 py-0.5 rounded-full uppercase tracking-wider ${
                      theme === "professional" 
                        ? "bg-blue-100 text-blue-700" 
                        : theme === "minimalist" 
                        ? "bg-slate-200 text-slate-800" 
                        : "bg-pink-100 text-pink-700 border border-pink-200"
                    }`}>
                      {currentSlide.tag || currentSlide.slideType || "Core Concept"}
                    </span>
                    {topic && (
                      <span className="text-[11px] font-medium text-slate-400 truncate max-w-sm">
                        • {topic}
                      </span>
                    )}
                  </div>
                  
                  {/* Slide Title */}
                  <h2 className={`text-2xl md:text-3xl font-extrabold mb-3 leading-snug tracking-tight ${
                    theme === "minimalist" ? "text-black" : theme === "professional" ? "text-slate-900" : theme === "pastel" ? "text-pink-950" : "text-[#0F172A]"
                  }`}>
                    {currentSlide.title}
                  </h2>

                  {/* Easy-to-Learn Key Takeaway Banner */}
                  {currentSlide.keyTakeaway && (
                    <div className="mb-4 rounded-xl bg-amber-500/10 border border-amber-500/25 p-2.5 px-3.5 flex items-center gap-2.5 shadow-2xs">
                      <Lightbulb size={16} className="text-amber-600 shrink-0" />
                      <p className="text-xs md:text-sm font-semibold text-amber-950 dark:text-amber-100 leading-snug">
                        <span className="uppercase text-[10px] tracking-wider text-amber-700 font-bold mr-1.5 inline-block">Key Takeaway:</span>
                        {currentSlide.keyTakeaway}
                      </p>
                    </div>
                  )}

                  {/* Bullet Points */}
                  <div className="overflow-hidden">
                    {currentSlide.bullets && currentSlide.bullets.length > 0 && (
                      <ul className="space-y-2.5">
                        {currentSlide.bullets.map((bullet, idx) => (
                          <li key={idx} className={`flex items-start text-sm md:text-base leading-relaxed ${
                            theme === "minimalist" ? "text-black" : theme === "professional" ? "text-slate-700" : theme === "pastel" ? "text-pink-900" : "text-[#334155]"
                          }`}>
                            <span className={`${theme === "professional" ? "text-blue-600" : theme === "minimalist" ? "text-black" : theme === "pastel" ? "text-pink-500" : "text-rose-600"} mr-3 text-lg leading-none shrink-0`}>•</span>
                            <span className="leading-snug">{renderFormattedBullet(bullet)}</span>
                          </li>
                        ))}
                      </ul>
                    )}

                    {/* Diagrams / Process items */}
                    {currentSlide.diagrams && currentSlide.diagrams.length > 0 && (
                      <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-3">
                        {currentSlide.diagrams.map((diag, idx) => (
                          <div key={idx} className="border border-slate-200 rounded-xl p-3 bg-white/80 shadow-2xs">
                            <h4 className="font-bold text-xs text-slate-800 mb-1.5 flex items-center gap-1.5">
                              <Layers size={13} className="text-pink-600" />
                              {diag.title}
                            </h4>
                            <div className="flex flex-wrap gap-1.5">
                              {(diag?.items || []).map((item, iIdx) => (
                                <span key={iIdx} className="text-xs px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 font-medium">
                                  {item}
                                </span>
                              ))}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                {/* Bottom Callout: Real-World Analogy / Example */}
                <div>
                  {currentSlide.example && (
                    <div className="mt-3 rounded-xl bg-sky-500/10 border border-sky-500/20 p-2.5 px-3.5 flex items-start gap-2">
                      <Sparkles size={15} className="text-sky-600 shrink-0 mt-0.5" />
                      <p className="text-xs text-sky-950 leading-snug">
                        <span className="font-bold text-sky-800 uppercase tracking-wider text-[10px] mr-1 inline-block">Real-World Analogy:</span>
                        {currentSlide.example}
                      </p>
                    </div>
                  )}

                  {/* Watermark / Footer */}
                  <div className="pt-3 border-t border-slate-100 text-slate-400 text-xs font-medium flex justify-between items-center select-none">
                    <span className="flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-pink-500"></span>
                      Notivexa Easy-to-Learn PPT
                    </span>
                    <span>Slide {currentIndex + 1} of {slides.length}</span>
                  </div>
                </div>

              </div>
            </div>
          </div>
        </div>

        {/* Footer Navigation */}
        <div className="border-t border-slate-200 bg-white relative z-10 shadow-[0_-4px_15px_rgba(0,0,0,0.05)] p-4">
          <div className="flex justify-between items-center max-w-lg mx-auto">
            <button
              onClick={handlePrev}
              disabled={currentIndex === 0}
              className="flex items-center justify-center gap-2 px-5 py-2.5 bg-slate-100 hover:bg-slate-200 disabled:opacity-40 disabled:cursor-not-allowed text-slate-700 rounded-xl font-semibold text-xs uppercase tracking-wider transition-colors"
            >
              <ChevronLeft size={16} /> Prev Slide
            </button>
            
            <span className="text-xs font-bold text-slate-500">
              {currentIndex + 1} / {slides.length}
            </span>

            <button
              onClick={handleNext}
              disabled={currentIndex === slides.length - 1}
              className="flex items-center justify-center gap-2 px-5 py-2.5 bg-pink-600 hover:bg-pink-700 disabled:opacity-40 disabled:cursor-not-allowed text-white rounded-xl font-semibold text-xs uppercase tracking-wider transition-colors shadow-sm"
            >
              Next Slide <ChevronRight size={16} />
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};

