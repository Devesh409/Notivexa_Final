import sys

with open('src/App.tsx', 'r') as f:
    lines = f.readlines()

new_btn = """                  <button 
                    onClick={() => setShowPreviewModal(true)}
                    className="flex items-center gap-2 bg-pink-100 text-pink-700 px-4 py-2 rounded-xl text-sm font-semibold hover:bg-pink-200 transition-colors"
                  >
                    <Presentation size={16} /> Preview Slides
                  </button>
"""

new_modal = """
      {showPreviewModal && (
        <SlidePreviewModal 
          slides={slides} 
          onClose={() => setShowPreviewModal(false)} 
        />
      )}
"""

for i, line in enumerate(lines):
    if '<Download size={16} /> Download PPTX' in line:
        # Insert button before the download button's enclosing <button> or after it
        # Actually, let's insert it before the download button starts:
        idx = i - 1
        while idx > 0 and '<button' not in lines[idx]:
            idx -= 1
        lines.insert(idx, new_btn)
        break

# Insert modal right before the final closing div/main of the app
for i in range(len(lines)-1, 0, -1):
    if '</main>' in lines[i] or '</div>' in lines[i]:
        if '</div>' in lines[i] and '}' not in lines[i-1] and ')' not in lines[i-1]:
             pass
    if '</main>' in lines[i]:
        lines.insert(i, new_modal)
        break

with open('src/App.tsx', 'w') as f:
    f.writelines(lines)
