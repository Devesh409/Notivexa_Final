import re
with open("src/App.tsx", "r") as f:
    text = f.read()

target = """  if (hasError) {
    if (parsedNodes.length > 0) {
      return (
        <div className={`my-8 p-6 rounded-2xl border shadow-sm ${isDarkMode ? "bg-[#22221F] border-[#383832]" : "bg-gradient-to-br from-white via-sky-50/40 to-indigo-50/20 border-slate-200"}`}>
          <div className="flex items-center gap-2 mb-4">
            <Sparkles size={16} className="text-sky-600" />
            <span className="text-xs font-bold text-slate-700 uppercase tracking-wider">Concept Flow Diagram</span>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            {parsedNodes.map((node, i) => (
              <React.Fragment key={i}>
                <div className="p-3 px-4 rounded-xl bg-white border border-slate-200/90 shadow-2xs text-xs font-semibold text-slate-800 flex items-center gap-2 max-w-xs">
                  <span className="w-5 h-5 rounded-full bg-sky-100 text-sky-700 text-[10px] font-bold flex items-center justify-center shrink-0">{i + 1}</span>
                  <span>{node.label}</span>
                </div>
                {i < parsedNodes.length - 1 && (
                  <ArrowRight size={16} className="text-sky-500 shrink-0" />
                )}
              </React.Fragment>
            ))}
          </div>
        </div>
      );
    }"""

replacement = """  if (hasError) {"""

text = text.replace(target, replacement)

with open("src/App.tsx", "w") as f:
    f.write(text)
