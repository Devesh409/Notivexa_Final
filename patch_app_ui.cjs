const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');

const targetBtn1 = `<button
                    onClick={generateQuestionBank}
                    disabled={!fileData || loading}
                    className="w-full bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-700 hover:from-emerald-700 hover:to-teal-800 text-white disabled:opacity-50 disabled:cursor-not-allowed py-3 px-4 rounded-full text-sm font-semibold transition-all flex items-center justify-center gap-2 shadow-md shadow-emerald-500/20 hover:shadow-emerald-500/30 hover:scale-[1.01] active:scale-[0.99]"
                  >
                    {loading && generatingType === "question-bank" ? <Loader2 size={16} className="animate-spin" /> : <GraduationCap size={16} />}
                    Generate Question Bank
                  </button>`;

const replaceBtn1 = `<div className={\`p-4 rounded-2xl space-y-3.5 shadow-sm mt-3 border transition-colors \${isDarkMode ? "bg-[#282824] border-[#383832]" : "bg-gradient-to-br from-white via-emerald-50/60 to-teal-50/40 border-emerald-200/90 shadow-emerald-500/5"}\`}>
                    <div className="flex items-center justify-between">
                      <div className={\`flex items-center gap-2 \${isDarkMode ? "text-[#C2C2B0]" : "text-[#5A5A40]"}\`}>
                        <GraduationCap size={18} className="text-[#059669]" />
                        <span className={\`font-serif text-sm font-bold \${isDarkMode ? "text-[#F5F5F0]" : "text-[#3A3A2F]"}\`}>
                          Question Bank Generator
                        </span>
                      </div>
                    </div>
                    
                    <div className="space-y-2">
                      <label className={\`block text-xs font-semibold \${isDarkMode ? "text-[#A1A194]" : "text-[#8A8A7A]"}\`}>
                        Question Type Configuration
                      </label>
                      <select 
                        value={questionBankType} 
                        onChange={(e) => setQuestionBankType(e.target.value)}
                        className={\`w-full p-2.5 rounded-xl border text-xs focus:ring-2 focus:ring-[#059669]/20 transition-all outline-none \${isDarkMode ? "bg-[#22221F] border-[#383832] text-[#E0E0D5]" : "bg-white border-[#E0E0D5] text-[#3A3A2F]"}\`}
                      >
                        <option value="all">All Types (50+ each)</option>
                        <option value="mcq">Multiple Choice (50+ MCQs)</option>
                        <option value="blanks">Fill in the Blanks (50+ Questions)</option>
                        <option value="truefalse">True / False (50+ Questions)</option>
                        <option value="short">Short Answer (50+ Questions)</option>
                        <option value="long">Long Answer (50+ Questions)</option>
                      </select>
                    </div>

                    <button
                      onClick={generateQuestionBank}
                      disabled={!fileData || loading}
                      className="w-full bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-700 hover:from-emerald-700 hover:to-teal-800 text-white disabled:opacity-50 disabled:cursor-not-allowed py-3 px-4 rounded-full text-sm font-semibold transition-all flex items-center justify-center gap-2 shadow-md shadow-emerald-500/20 hover:shadow-emerald-500/30 hover:scale-[1.01] active:scale-[0.99]"
                    >
                      {loading && generatingType === "question-bank" ? <Loader2 size={16} className="animate-spin" /> : <GraduationCap size={16} />}
                      Generate Question Bank
                    </button>
                  </div>`;

if (code.includes(targetBtn1)) {
    // We should replace both occurrences of targetBtn1 (student and teacher side)
    code = code.split(targetBtn1).join(replaceBtn1);
    fs.writeFileSync('src/App.tsx', code);
    console.log("Success replacing UI");
} else {
    console.log("Could not find the targetBtn1 string.");
}
