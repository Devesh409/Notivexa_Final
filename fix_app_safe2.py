import sys

with open('src/App.tsx', 'r') as f:
    lines = f.readlines()

for i, line in enumerate(lines):
    if "ref={notesRef}" in line:
        insert_idx = i - 1
        break
else:
    print("Could not find ref={notesRef}")
    sys.exit(1)

injection = """                {resultType === "exam-paper" && examPaperType === "paper-university" && (
                  (() => {
                    try {
                      let cleanedText = resultText.trim();
                      if (cleanedText.startsWith("```json")) {
                        cleanedText = cleanedText.replace(/^```json/, "").replace(/```$/, "").trim();
                      }
                      const parsedData = JSON.parse(cleanedText);
                      return <UniversityPaperEditor initialData={parsedData} />;
                    } catch (e) {
                      console.error("Failed to parse paper-university JSON:", e);
                      return <div className="p-10 text-red-500 overflow-auto max-h-[80vh]">Error parsing generated paper format. Raw output: <pre className="mt-2 text-xs">{resultText}</pre></div>;
                    }
                  })()
                )}
"""

# Find the className line which is 2 lines below ref={notesRef} usually
# Let's just find the exact className line
class_line_idx = -1
for j in range(insert_idx, insert_idx + 5):
    if "className={`prose max-w-none page-break-before exam-paper-table mx-auto bg-white shadow-xl" in lines[j]:
        class_line_idx = j
        break

if class_line_idx != -1:
    old_class_line = lines[class_line_idx]
    new_class_line = old_class_line.replace("exam-paper-table mx-auto", "exam-paper-table mx-auto ${resultType === 'exam-paper' && examPaperType === 'paper-university' ? 'hidden' : ''}")
    lines[class_line_idx] = new_class_line
else:
    print("Could not find className line")
    sys.exit(1)

new_lines = lines[:insert_idx] + [injection] + lines[insert_idx:]

with open('src/App.tsx', 'w') as f:
    f.writelines(new_lines)
print("Safely injected UniversityPaperEditor and hidden Markdown wrapper.")
