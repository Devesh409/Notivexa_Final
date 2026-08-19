import sys

with open('src/components/SlidePreviewModal.tsx', 'r') as f:
    content = f.read()

# The grid has grid-cols-1 md:grid-cols-3 and the navigation is md:col-span-1, speaker notes md:col-span-2.
# Let's change the layout to just center the navigation since speaker notes are removed.

target = """
            {/* Speaker Notes (Right/Span) */}
            <div className="md:col-span-2 order-1 md:order-2">
              <div className="bg-amber-50 border border-amber-100 rounded-xl p-4 max-h-32 overflow-y-auto custom-scrollbar">
                <div className="text-xs font-bold text-amber-700 uppercase tracking-wider mb-1 flex items-center gap-1">
                  Speaker Notes
                </div>
                <p className="text-sm text-amber-900 leading-relaxed">
                  {currentSlide.speakerNotes || "No notes for this slide."}
                </p>
              </div>
            </div>
"""

new_grid_open = '<div className="p-4 md:p-6 flex justify-center items-center">'

if target in content:
    content = content.replace(target, '')
    
    # Also replace the grid wrapper
    content = content.replace('<div className="p-4 md:p-6 grid grid-cols-1 md:grid-cols-3 gap-6 items-center">', new_grid_open)
    
    # Clean up the navigation div classes
    content = content.replace('<div className="flex items-center gap-3 md:col-span-1 justify-center md:justify-start order-2 md:order-1">', '<div className="flex items-center gap-3 justify-center">')

    with open('src/components/SlidePreviewModal.tsx', 'w') as f:
        f.write(content)
    print("Updated SlidePreviewModal.tsx")
else:
    print("Target not found in SlidePreviewModal.tsx")
