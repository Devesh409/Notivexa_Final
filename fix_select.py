import re

with open("src/App.tsx", "r") as f:
    content = f.read()

target = """                      <select 
                        value={questionBankType} 
                        onChange={(e) => setQuestionBankType(e.target.value)}
                        className={`w-full p-2.5 rounded-xl border text-xs focus:ring-2 focus:ring-[#059669]/20 transition-all outline-none ${isDarkMode ? "bg-[#22221F] border-[#383832] text-[#E0E0D5]" : "bg-white border-[#E0E0D5] text-[#3A3A2F]"}`}
                      >
                        <option value="all">All Types (50+ each)</option>
                        <option value="mcq">Multiple Choice (50+ MCQs)</option>
                        <option value="short">Short Answer (50+ Questions)</option>
                        <option value="long">Long Answer (50+ Questions)</option>
                      </select>"""

replacement = """                      <select 
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
                      </select>"""

content = content.replace(target, replacement)

with open("src/App.tsx", "w") as f:
    f.write(content)
print("Updated App.tsx")
