import re

with open("src/App.tsx", "r") as f:
    content = f.read()

# 1. Add state for examPaperType
state_target = 'const [questionBankType, setQuestionBankType] = useState("all");'
state_replacement = state_target + '\n    const [examPaperType, setExamPaperType] = useState("paper-full");'
content = content.replace(state_target, state_replacement)

# 2. Duplicate generateQuestionBank to generateExamPaper
# Find generateQuestionBank block
gb_start = content.find('const generateQuestionBank = async () => {')
# find end of block (empty line before next const)
gb_end = content.find('const generatePPT = async () => {', gb_start)

generate_gb_block = content[gb_start:gb_end]

generate_ep_block = generate_gb_block.replace(
    'const generateQuestionBank', 'const generateExamPaper'
).replace(
    'setGeneratingType("question-bank");', 'setGeneratingType("exam-paper");'
).replace(
    'item.type === "question-bank" && item.questionBankType === questionBankType', 'item.type === "question-bank" && item.questionBankType === examPaperType'
).replace(
    'questionType: questionBankType,', 'questionType: examPaperType,'
).replace(
    'questionBankType: questionBankType,', 'questionBankType: examPaperType,'
)

content = content[:gb_end] + generate_ep_block + content[gb_end:]

# 3. Update UI
ui_target = """                    <div className="bg-[#FAF9F6] p-4 rounded-2xl border border-[#D1D1C4] space-y-3 dark:bg-[#22221F] dark:border-[#383832]">
                      <label className="text-[10px] font-bold text-[#8A8A7A] uppercase tracking-wider block">
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

ui_replacement = """                    <div className="bg-[#FAF9F6] p-4 rounded-2xl border border-[#D1D1C4] space-y-3 dark:bg-[#22221F] dark:border-[#383832]">
                      <label className="text-[10px] font-bold text-[#8A8A7A] uppercase tracking-wider block">
                        Question Bank Type
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
                        className="w-full bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-700 hover:from-emerald-700 hover:to-teal-800 text-white disabled:opacity-50 disabled:cursor-not-allowed py-2 px-4 rounded-xl text-xs font-semibold transition-all flex items-center justify-center gap-2 shadow-sm shadow-emerald-500/20"
                      >
                        {loading && generatingType === "question-bank" ? <Loader2 size={14} className="animate-spin" /> : <GraduationCap size={14} />}
                        Generate Question Bank
                      </button>
                    </div>

                    <div className="bg-[#FAF9F6] p-4 rounded-2xl border border-[#D1D1C4] space-y-3 dark:bg-[#22221F] dark:border-[#383832]">
                      <label className="text-[10px] font-bold text-[#8A8A7A] uppercase tracking-wider block">
                        Exam Paper (Marks-Based)
                      </label>
                      <select 
                        value={examPaperType} 
                        onChange={(e) => setExamPaperType(e.target.value)}
                        className={`w-full p-2.5 rounded-xl border text-xs focus:ring-2 focus:ring-[#2563EB]/20 transition-all outline-none ${isDarkMode ? "bg-[#22221F] border-[#383832] text-[#E0E0D5]" : "bg-white border-[#E0E0D5] text-[#3A3A2F]"}`}
                      >
                        <option value="paper-full">Full Paper (MCQs, Short 2/3/4m, Long 5/8/10m)</option>
                        <option value="paper-mcq">MCQ Paper (1 Mark each)</option>
                        <option value="paper-short">Short Q's Paper (2, 3, 4 Marks)</option>
                        <option value="paper-long">Long Q's Paper (5, 8, 10 Marks)</option>
                      </select>
                      <button
                        onClick={generateExamPaper}
                        disabled={!fileData || loading}
                        className="w-full bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-700 hover:from-blue-700 hover:to-indigo-800 text-white disabled:opacity-50 disabled:cursor-not-allowed py-2 px-4 rounded-xl text-xs font-semibold transition-all flex items-center justify-center gap-2 shadow-sm shadow-blue-500/20"
                      >
                        {loading && generatingType === "exam-paper" ? <Loader2 size={14} className="animate-spin" /> : <FileQuestion size={14} />}
                        Generate Exam Paper
                      </button>
                    </div>"""

# Replace only the exact UI string
content = content.replace(ui_target, ui_replacement)

with open("src/App.tsx", "w") as f:
    f.write(content)

print("Updated App.tsx successfully.")
