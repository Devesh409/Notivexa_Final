import sys

with open('src/App.tsx', 'r') as f:
    lines = f.readlines()

new_btn = """                  <button
                    onClick={generatePPT}
                    disabled={!fileData || loading}
                    className="w-full bg-gradient-to-r from-pink-600 via-rose-600 to-pink-700 hover:from-pink-700 hover:to-rose-800 text-white disabled:opacity-50 disabled:cursor-not-allowed py-3 px-4 rounded-full text-sm font-semibold transition-all flex items-center justify-center gap-2 shadow-md shadow-pink-500/20 hover:shadow-pink-500/30 hover:scale-[1.01] active:scale-[0.99]"
                  >
                    {loading && generatingType === "ppt" ? <Loader2 size={16} className="animate-spin" /> : <Presentation size={16} />}
                    Generate PPT
                  </button>
"""

# Let's insert it before the Video button
for i, line in enumerate(lines):
    if 'onClick={generateVideoExplanation}' in line:
        # Find the start of the button, which is '<button' above
        idx = i - 1
        while idx > 0 and '<button' not in lines[idx]:
            idx -= 1
        
        lines.insert(idx, new_btn)
        break # only insert once or maybe twice if it appears in both branches

# Try again from the bottom to see if it appears twice
for i in range(len(lines)-1, 0, -1):
    if 'onClick={generateVideoExplanation}' in lines[i] and 'new_btn' not in lines[i-1]:
        idx = i - 1
        while idx > 0 and '<button' not in lines[idx]:
            idx -= 1
        
        # Don't double insert if it's the same one
        if 'onClick={generatePPT}' not in lines[idx-1] and 'onClick={generatePPT}' not in lines[idx-2]:
            lines.insert(idx, new_btn)
        break

with open('src/App.tsx', 'w') as f:
    f.writelines(lines)
