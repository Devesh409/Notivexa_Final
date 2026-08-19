import sys

with open('src/components/SlidePreviewModal.tsx', 'r') as f:
    content = f.read()

# Imports
content = content.replace(
    "import { X, ChevronLeft, ChevronRight, Presentation, ZoomIn, ZoomOut, RotateCcw } from 'lucide-react';",
    "import { X, ChevronLeft, ChevronRight, Presentation, ZoomIn, ZoomOut, RotateCcw, Maximize, Minimize } from 'lucide-react';"
)

# State
content = content.replace(
    "const [zoomLevel, setZoomLevel] = useState(1);",
    "const [zoomLevel, setZoomLevel] = useState(1);\n  const [isFullscreen, setIsFullscreen] = useState(false);"
)

# Fullscreen toggle method
content = content.replace(
    "const handleZoomReset = () => setZoomLevel(1);",
    "const handleZoomReset = () => setZoomLevel(1);\n  const toggleFullscreen = () => setIsFullscreen(prev => !prev);"
)

# Wrapper classes
content = content.replace(
    '<div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-sm">',
    '<div className={`fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/90 backdrop-blur-sm transition-all duration-300 ${isFullscreen ? \'p-0\' : \'p-4 md:p-8\'}`}>'
)

content = content.replace(
    '<div className="bg-white rounded-[24px] shadow-2xl w-full max-w-6xl overflow-hidden flex flex-col max-h-[90vh]">',
    '<div className={`bg-white shadow-2xl overflow-hidden flex flex-col transition-all duration-300 ease-in-out ${isFullscreen ? \'w-full h-full rounded-none\' : \'w-full max-w-6xl rounded-[24px] max-h-[90vh]\'}`}>'
)

# Buttons
target_buttons = """              <button 
                onClick={handleZoomReset} 
                className="p-1.5 text-slate-500 hover:bg-slate-100 rounded transition-colors"
                title="Reset Zoom"
              >
                <RotateCcw size={14} />
              </button>
            </div>

            <button 
              onClick={onClose}
              className="text-slate-400 hover:text-slate-600 hover:bg-slate-200 p-2 rounded-xl transition-colors"
            >"""

new_buttons = """              <button 
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
            >"""

content = content.replace(target_buttons, new_buttons)

with open('src/components/SlidePreviewModal.tsx', 'w') as f:
    f.write(content)
print("Updated SlidePreviewModal.tsx with Fullscreen Toggle")
