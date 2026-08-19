const fs = require('fs');
let content = fs.readFileSync('src/App.tsx', 'utf8');

content = content.replace('Upload, X, Loader2, Sparkles, Youtube, Check, Copy, FileText', 'Upload, X, Loader2, Sparkles, Youtube, Check, Copy, FileText, ChevronDown');

const oldButton = `<button
                      onClick={downloadHandwrittenPDF}
                      disabled={isExporting}
                      className="border border-[#5A5A40] bg-[#5A5A40] text-white hover:bg-opacity-90 disabled:opacity-50 disabled:cursor-not-allowed py-2 px-4 rounded-full text-xs font-semibold uppercase tracking-widest transition-colors flex items-center gap-2"
                    >
                      {isExporting ? <Loader2 size={14} className="animate-spin" /> : <Download size={14} />} 
                      {isExporting ? 'Exporting...' : 'Export PDF'}
                    </button>`;

const newDropdown = `<div className="relative">
                      <button
                        onClick={() => setShowExportMenu(!showExportMenu)}
                        disabled={isExporting}
                        className="border border-[#5A5A40] bg-[#5A5A40] text-white hover:bg-opacity-90 disabled:opacity-50 disabled:cursor-not-allowed py-2 px-4 rounded-full text-xs font-semibold uppercase tracking-widest transition-colors flex items-center gap-2"
                      >
                        {isExporting ? <Loader2 size={14} className="animate-spin" /> : <Download size={14} />} 
                        {isExporting ? 'Exporting...' : 'Export'}
                        <ChevronDown size={14} />
                      </button>
                      {showExportMenu && (
                        <div className={\`absolute right-0 mt-2 w-48 rounded-lg shadow-xl border z-50 overflow-hidden \${isDarkMode ? "bg-[#282824] border-[#383832]" : "bg-white border-slate-200"}\`}>
                          <button onClick={() => { setShowExportMenu(false); downloadHandwrittenPDF(); }} className={\`w-full text-left px-4 py-3 text-xs font-semibold uppercase tracking-wider transition-colors \${isDarkMode ? "hover:bg-[#383832] text-[#E0E0D5]" : "hover:bg-slate-50 text-slate-700"} flex items-center gap-2\`}>
                            <FileText size={14} /> PDF
                          </button>
                          <button onClick={downloadDoc} className={\`w-full text-left px-4 py-3 text-xs font-semibold uppercase tracking-wider border-t transition-colors \${isDarkMode ? "border-[#383832] hover:bg-[#383832] text-[#E0E0D5]" : "border-slate-100 hover:bg-slate-50 text-slate-700"} flex items-center gap-2\`}>
                            <FileText size={14} /> Word (DOC)
                          </button>
                          <button onClick={downloadMarkdown} className={\`w-full text-left px-4 py-3 text-xs font-semibold uppercase tracking-wider border-t transition-colors \${isDarkMode ? "border-[#383832] hover:bg-[#383832] text-[#E0E0D5]" : "border-slate-100 hover:bg-slate-50 text-slate-700"} flex items-center gap-2\`}>
                            <FileText size={14} /> Markdown
                          </button>
                        </div>
                      )}
                    </div>`;

content = content.replace(oldButton, newDropdown);

fs.writeFileSync('src/App.tsx', content);
console.log("Patched 2!");
