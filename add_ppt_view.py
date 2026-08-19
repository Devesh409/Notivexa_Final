import sys

with open('src/App.tsx', 'r') as f:
    lines = f.readlines()

new_view = """
          {slides.length > 0 && (
            <div className="bg-white rounded-[24px] shadow-[0_4px_25px_rgba(15,23,42,0.06)] overflow-hidden relative border border-slate-200/80">
              <div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-pink-500 via-rose-600 to-pink-600"></div>
              <div className="border-b border-[#E0E0D5] p-6 flex items-center justify-between">
                <h3 className="font-serif text-2xl text-[#3A3A2F]">
                  Presentation Generated
                </h3>
                <div className="flex gap-2">
                  <button 
                    onClick={downloadPPT}
                    className="flex items-center gap-2 bg-[#5A5A40] text-white px-4 py-2 rounded-xl text-sm font-semibold hover:bg-opacity-90 transition-colors"
                  >
                    <Download size={16} /> Download PPTX
                  </button>
                  <button 
                    onClick={() => {
                      setSlides([]);
                      setResultType("");
                    }} 
                    className="text-[#8A8A7A] hover:bg-[#F5F5F0] p-2 rounded-xl transition-colors"
                  >
                    <X size={20} />
                  </button>
                </div>
              </div>
              <div className="p-8">
                <p className="text-gray-600 mb-6">Generated {slides.length} slides successfully. Click the download button above to get your presentation.</p>
                
                <div className="space-y-6">
                  {slides.slice(0, 5).map((slide, idx) => (
                    <div key={idx} className="border border-slate-200 rounded-xl p-6 bg-slate-50">
                      <div className="text-xs font-bold text-slate-400 mb-2 uppercase tracking-wider">Slide {idx + 1} • {slide.slideType}</div>
                      <h4 className="font-bold text-lg text-slate-800 mb-3">{slide.title}</h4>
                      <ul className="list-disc pl-5 space-y-1 text-slate-600">
                        {slide.bullets?.map((b, bIdx) => (
                          <li key={bIdx}>{b}</li>
                        ))}
                      </ul>
                      {slide.speakerNotes && (
                        <div className="mt-4 pt-4 border-t border-slate-200 text-sm text-slate-500 italic">
                          <span className="font-semibold not-italic text-slate-700">Notes: </span>{slide.speakerNotes}
                        </div>
                      )}
                    </div>
                  ))}
                  {slides.length > 5 && (
                    <div className="text-center text-slate-500 italic p-4 border border-dashed border-slate-300 rounded-xl">
                      ...and {slides.length - 5} more slides. Download the PPTX to see them all.
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
"""

# Let's insert it right after the `resultText` view block
for i, line in enumerate(lines):
    if '{resultText && (' in line:
        lines.insert(i, new_view)
        break

with open('src/App.tsx', 'w') as f:
    f.writelines(lines)
