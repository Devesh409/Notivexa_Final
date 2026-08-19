import re
with open("src/App.tsx", "r") as f:
    text = f.read()

text = text.replace("const [focusArea, setFocusArea] = useState(\"Algorithms, step-by-step processes, and diagrams in student style\");", "const [focusArea, setFocusArea] = useState(\"Algorithms, step-by-step processes, and diagrams in student style\");\n  const [summaryLength, setSummaryLength] = useState(\"detailed\");")

text = text.replace("body: JSON.stringify({ fileUri: fileData.fileUri, mimeType: fileData.mimeType, focusArea: focusArea, mode: mode }),", "body: JSON.stringify({ fileUri: fileData.fileUri, mimeType: fileData.mimeType, focusArea: focusArea, mode: mode, summaryLength }),")

# Now inject the UI select box just above the Generate Summary buttons in both student and teacher mode.
target_student = """                  <button
                    onClick={generateNotes}"""
replacement_student = """                  <div className="space-y-1 mb-2">
                    <label className={`text-[10px] uppercase tracking-wider font-semibold block ${isDarkMode ? "text-[#A1A194]" : "text-[#8A8A7A]"}`}>
                      Summary Detail Level
                    </label>
                    <select
                      value={summaryLength}
                      onChange={(e) => setSummaryLength(e.target.value)}
                      className={`w-full border rounded-lg py-2 px-3 text-xs font-semibold outline-none ${isDarkMode ? "bg-[#22221F] border-[#383832] text-[#E0E0D5]" : "bg-white border-[#C1C1B0] text-[#3A3A2F]"}`}
                    >
                      <option value="detailed">Detailed (Standard)</option>
                      <option value="comprehensive">Comprehensive (All Concepts)</option>
                      <option value="exhaustive_50_pages">Minimum 50+ Pages Exhaustive (Full E-Book)</option>
                    </select>
                  </div>
                  <button
                    onClick={generateNotes}"""
text = text.replace(target_student, replacement_student)

with open("src/App.tsx", "w") as f:
    f.write(text)
