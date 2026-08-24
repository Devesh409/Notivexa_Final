import re

with open("src/App.tsx", "r") as f:
    content = f.read()

target = """                                        <div className="space-y-2">
                      <label className={`block text-xs font-semibold ${isDarkMode ? "text-[#A1A194]" : "text-[#8A8A7A]"}`}>
                        Question Type Configuration
                      </label>
                      <select 
                        value={questionBankType} 
                        onChange={(e) => setQuestionBankType(e.target.value)}
                        className={`w-full p-2.5 rounded-xl border text-xs focus:ring-2 focus:ring-[#059669]/20 transition-all outline-none ${isDarkMode ? "bg-[#22221F] border-[#383832] text-[#E0E0D5]" : "bg-white border-[#E0E0D5] text-[#3A3A2F]"}`}
                      >
                        <optgroup label="Standard Question Bank">
                          <option value="all">All Types (50+ each)</option>
                          <option value="mcq">Multiple Choice (50+ MCQs)</option>
                          <option value="short">Short Answer (50+ Questions)</option>
                          <option value="long">Long Answer (50+ Questions)</option>
                        </optgroup>
                        <optgroup label="Exam Question Paper (Marks)">
                          <option value="paper-full">Full Paper (MCQs, Short 2/3/4m, Long 5/8/10m)</option>
                          <option value="paper-mcq">MCQ Paper (1 Mark each)</option>
                          <option value="paper-short">Short Q's Paper (2, 3, 4 Marks)</option>
                          <option value="paper-long">Long Q's Paper (5, 8, 10 Marks)</option>
                        </optgroup>
                      </select>
                    </div>

                    <button
                      onClick={generateQuestionBank}
                      disabled={!fileData || loading}
                      className="w-full bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-700 hover:from-emerald-700 hover:to-teal-800 text-white disabled:opacity-50 disabled:cursor-not-allowed py-3 px-4 rounded-full text-sm font-semibold transition-all flex items-center justify-center gap-2 shadow-md shadow-emerald-500/20 hover:shadow-emerald-500/30 hover:scale-[1.01] active:scale-[0.99]"
                    >
                      {loading && generatingType === "question-bank" ? <Loader2 size={16} className="animate-spin" /> : <GraduationCap size={16} />}
                      Generate Question Bank
                    </button>"""

replacement = """                    <div className="space-y-3">
                      <div className="p-3 rounded-2xl border border-[#D1D1C4] dark:border-[#383832] space-y-3">
                        <label className={`block text-xs font-semibold ${isDarkMode ? "text-[#A1A194]" : "text-[#8A8A7A]"}`}>
                          Question Bank Generator
                        </label>
                        <select 
                          value={questionBankType} 
                          onChange={(e) => setQuestionBankType(e.target.value)}
                          className={`w-full p-2.5 rounded-xl border text-xs focus:ring-2 focus:ring-[#059669]/20 transition-all outline-none ${isDarkMode ? "bg-[#22221F] border-[#383832] text-[#E0E0D5]" : "bg-white border-[#E0E0D5] text-[#3A3A2F]"}`}
                        >
                          <option value="all">All Types (50+ each)</option>
                          <option value="mcq">Multiple Choice (50+ MCQs)</option>
                          <option value="short">Short Answer (50+ Questions)</option>
                          <option value="long">Long Answer (50+ Questions)</option>
                        </select>
                        <button
                          onClick={generateQuestionBank}
                          disabled={!fileData || loading}
                          className="w-full bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-700 hover:from-emerald-700 hover:to-teal-800 text-white disabled:opacity-50 disabled:cursor-not-allowed py-2.5 px-4 rounded-xl text-xs font-semibold transition-all flex items-center justify-center gap-2 shadow-sm"
                        >
                          {loading && generatingType === "question-bank" ? <Loader2 size={14} className="animate-spin" /> : <GraduationCap size={14} />}
                          Generate Question Bank
                        </button>
                      </div>

                      <div className="p-3 rounded-2xl border border-[#D1D1C4] dark:border-[#383832] space-y-3 bg-gradient-to-br from-blue-50/30 to-indigo-50/30 dark:from-blue-900/10 dark:to-indigo-900/10">
                        <label className={`block text-[11px] font-bold uppercase tracking-wider text-blue-600 dark:text-blue-400`}>
                          Exam Question Paper
                        </label>
                        <select 
                          value={examPaperType} 
                          onChange={(e) => setExamPaperType(e.target.value)}
                          className={`w-full p-2.5 rounded-xl border text-xs focus:ring-2 focus:ring-blue-600/20 transition-all outline-none ${isDarkMode ? "bg-[#22221F] border-[#383832] text-[#E0E0D5]" : "bg-white border-[#E0E0D5] text-[#3A3A2F]"}`}
                        >
                          <option value="paper-full">Full Paper (MCQs, Short 2/3/4m, Long 5/8/10m)</option>
                          <option value="paper-mcq">MCQ Paper (1 Mark each)</option>
                          <option value="paper-short">Short Q's Paper (2, 3, 4 Marks)</option>
                          <option value="paper-long">Long Q's Paper (5, 8, 10 Marks)</option>
                        </select>
                        <button
                          onClick={generateExamPaper}
                          disabled={!fileData || loading}
                          className="w-full bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-700 hover:from-blue-700 hover:to-indigo-800 text-white disabled:opacity-50 disabled:cursor-not-allowed py-2.5 px-4 rounded-xl text-xs font-semibold transition-all flex items-center justify-center gap-2 shadow-sm"
                        >
                          {loading && generatingType === "exam-paper" ? <Loader2 size={14} className="animate-spin" /> : <FileQuestion size={14} />}
                          Generate Exam Paper
                        </button>
                      </div>
                    </div>"""

# Find exact boundaries and replace
start_idx = content.find('<div className="space-y-2">')
end_idx = content.find('Generate Question Bank\n                    </button>') + len('Generate Question Bank\n                    </button>')

if start_idx != -1 and end_idx != -1:
    content = content[:start_idx] + replacement + content[end_idx:]
    with open("src/App.tsx", "w") as f:
        f.write(content)
    print("Replaced successfully.")
else:
    print("Could not find the target string.")
