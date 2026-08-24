with open("src/App.tsx", "r") as f:
    content = f.read()

old_ui = """                        <select 
                          value={examPaperType} 
                          onChange={(e) => setExamPaperType(e.target.value)}
                          className={`w-full p-2.5 rounded-xl border text-xs focus:ring-2 focus:ring-blue-600/20 transition-all outline-none ${isDarkMode ? "bg-[#22221F] border-[#383832] text-[#E0E0D5]" : "bg-white border-[#E0E0D5] text-[#3A3A2F]"}`}
                        >
                          <option value="paper-full">Full Paper (MCQs, Short 2/3/4m, Long 5/8/10m)</option>
                          <option value="paper-mcq">MCQ Paper (1 Mark each)</option>
                          <option value="paper-short">Short Q's Paper (2, 3, 4 Marks)</option>
                          <option value="paper-long">Long Q's Paper (5, 8, 10 Marks)</option>
                          <option value="paper-university">University Format (60M, CO/BT Mapped)</option>
                        </select>"""

new_ui = """                        <select 
                          value={examPaperType} 
                          onChange={(e) => setExamPaperType(e.target.value)}
                          className={`w-full p-2.5 rounded-xl border text-xs focus:ring-2 focus:ring-blue-600/20 transition-all outline-none ${isDarkMode ? "bg-[#22221F] border-[#383832] text-[#E0E0D5]" : "bg-white border-[#E0E0D5] text-[#3A3A2F]"}`}
                        >
                          <option value="paper-full">Full Paper (MCQs, Short 2/3/4m, Long 5/8/10m)</option>
                          <option value="paper-mcq">MCQ Paper (1 Mark each)</option>
                          <option value="paper-short">Short Q's Paper (2, 3, 4 Marks)</option>
                          <option value="paper-long">Long Q's Paper (5, 8, 10 Marks)</option>
                          <option value="paper-university">University Format (CO/BT Mapped)</option>
                        </select>
                        {examPaperType === "paper-university" && (
                          <div className="mt-2">
                            <label className={`block text-[11px] font-bold uppercase tracking-wider text-blue-600 dark:text-blue-400 mb-1`}>
                              Total Marks
                            </label>
                            <select
                              value={universityMarks}
                              onChange={(e) => setUniversityMarks(Number(e.target.value))}
                              className={`w-full p-2.5 rounded-xl border text-xs focus:ring-2 focus:ring-blue-600/20 transition-all outline-none ${isDarkMode ? "bg-[#22221F] border-[#383832] text-[#E0E0D5]" : "bg-white border-[#E0E0D5] text-[#3A3A2F]"}`}
                            >
                              <option value={10}>10 Marks</option>
                              <option value={20}>20 Marks</option>
                              <option value={50}>50 Marks</option>
                              <option value={60}>60 Marks</option>
                              <option value={75}>75 Marks</option>
                              <option value={80}>80 Marks</option>
                              <option value={100}>100 Marks</option>
                            </select>
                          </div>
                        )}"""

content = content.replace(old_ui, new_ui)

with open("src/App.tsx", "w") as f:
    f.write(content)
