import React, { useState } from 'react';
import { X, ChevronLeft, ChevronRight, Presentation, ZoomIn, ZoomOut, RotateCcw, Maximize, Minimize } from 'lucide-react';
import { Slide } from '../types';

interface SlidePreviewModalProps {
  slides: Slide[];
  theme?: "academic" | "professional" | "minimalist" | "pastel";
  onClose: () => void;
}

export const SlidePreviewModal: React.FC<SlidePreviewModalProps> = ({ slides, theme = "academic", onClose }) => {
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

  // Fixed slide dimensions for consistent scaling
  const slideWidth = 896; 
  const slideHeight = 504;

  return (
    <div className={`fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/90 backdrop-blur-sm transition-all duration-300 ${isFullscreen ? 'p-0' : 'p-4 md:p-8'}`}>
      <div className={`bg-white shadow-2xl overflow-hidden flex flex-col transition-all duration-300 ease-in-out ${isFullscreen ? 'w-full h-full rounded-none' : 'w-full max-w-6xl rounded-[24px] max-h-[90vh]'}`}>
        {/* Header */}
        <div className="border-b border-slate-200 p-4 flex items-center justify-between bg-slate-50">
          <div className="flex items-center gap-2">
            <Presentation className="text-pink-600" size={20} />
            <h3 className="font-semibold text-slate-800">Slide Preview</h3>
            <span className="bg-slate-200 text-slate-600 text-xs font-bold px-2 py-1 rounded-full ml-2">
              {currentIndex + 1} of {slides.length}
            </span>
          </div>
          
          <div className="flex items-center gap-4">
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

        {/* Slide Content */}
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
                className="absolute top-0 left-0 rounded-xl shadow-lg border border-slate-200 p-10 flex flex-col overflow-hidden transition-transform duration-200 ease-out"
                style={{
                  width: `${slideWidth}px`,
                  height: `${slideHeight}px`,
                  transform: `scale(${zoomLevel})`,
                  transformOrigin: 'top left',
                  backgroundColor: theme === "professional" ? "#FFFFFF" : theme === "minimalist" ? "#F8FAFC" : theme === "pastel" ? "#FEF2F2" : "#FDFBF7",
                  fontFamily: theme === "professional" ? "Arial, sans-serif" : theme === "minimalist" || theme === "pastel" ? "Helvetica, sans-serif" : '"Times New Roman", Times, serif'
                }}
              >
                {/* Minimalist Top Accent */}
                {theme !== "minimalist" && (
                  <>
                    <div className={`absolute top-0 left-0 w-full h-2 ${theme === "professional" ? "bg-blue-600" : theme === "pastel" ? "bg-pink-300" : "bg-rose-600"}`}></div>
                    <div className={`absolute bottom-0 left-0 w-full h-1 ${theme === "professional" ? "bg-blue-600" : theme === "pastel" ? "bg-pink-300" : "bg-rose-600"}`}></div>
                  </>
                )}
                
                <div className={`text-xs font-bold mb-6 uppercase tracking-wider ${theme === "professional" ? "text-blue-500" : theme === "minimalist" ? "text-gray-500" : theme === "pastel" ? "text-pink-600" : "text-pink-500"}`}>
                  {currentSlide.slideType || "Content"} Slide
                </div>
                
                <h2 className={`text-4xl md:text-6xl font-bold mb-8 leading-tight ${theme === "minimalist" ? "text-black" : theme === "professional" ? "text-slate-800" : theme === "pastel" ? "text-pink-950" : "text-[#0F172A]"}`}>
                  {currentSlide.title}
                </h2>
                
                <div className="flex-1 overflow-hidden">
                  {currentSlide.bullets && currentSlide.bullets.length > 0 && (
                    <ul className="space-y-4">
                      {(currentSlide?.bullets || []).map((bullet, idx) => (
                        <li key={idx} className={`flex items-start text-xl md:text-2xl leading-relaxed ${theme === "minimalist" ? "text-black" : theme === "professional" ? "text-slate-600" : theme === "pastel" ? "text-pink-900" : "text-[#334155]"}`}>
                          <span className={`${theme === "professional" ? "text-blue-600" : theme === "minimalist" ? "text-black" : theme === "pastel" ? "text-pink-400" : "text-rose-600"} mr-4 text-3xl leading-none`}>•</span>
                          <span>{bullet}</span>
                        </li>
                      ))}
                    </ul>
                  )}

                  {currentSlide.diagrams && currentSlide.diagrams.length > 0 && (
                    <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-4">
                      {(currentSlide?.diagrams || []).map((diag, idx) => (
                        <div key={idx} className="border border-slate-200 rounded-lg p-4 bg-slate-50">
                          <h4 className="font-bold text-slate-700 mb-2">{diag.title}</h4>
                          <ul className="list-disc pl-5 text-sm text-slate-600">
                            {(diag?.items || []).map((item, iIdx) => (
                              <li key={iIdx}>{item}</li>
                            ))}
                          </ul>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
                
                {/* Watermark / Footer */}
                <div className="mt-auto pt-6 border-t border-slate-100 text-slate-400 text-sm font-medium flex justify-between">
                  <span>Notivexa AI</span>
                  <span>{currentIndex + 1}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Footer Controls & Speaker Notes */}
        <div className="border-t border-slate-200 bg-white relative z-10 shadow-[0_-4px_15px_rgba(0,0,0,0.05)]">
          <div className="p-4 md:p-6 flex justify-center items-center">
            
            {/* Navigation (Left) */}
            <div className="flex items-center gap-3 justify-center">
              <button
                onClick={handlePrev}
                disabled={currentIndex === 0}
                className="flex items-center justify-center gap-2 px-4 py-2 bg-slate-100 hover:bg-slate-200 disabled:opacity-50 disabled:cursor-not-allowed text-slate-700 rounded-lg font-medium transition-colors"
              >
                <ChevronLeft size={18} /> Prev
              </button>
              <button
                onClick={handleNext}
                disabled={currentIndex === slides.length - 1}
                className="flex items-center justify-center gap-2 px-4 py-2 bg-slate-100 hover:bg-slate-200 disabled:opacity-50 disabled:cursor-not-allowed text-slate-700 rounded-lg font-medium transition-colors"
              >
                Next <ChevronRight size={18} />
              </button>
            </div>
            
          </div>
        </div>
      </div>
    </div>
  );
};
