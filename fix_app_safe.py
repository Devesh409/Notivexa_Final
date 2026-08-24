with open('src/App.tsx', 'r') as f:
    lines = f.readlines()

for i, line in enumerate(lines):
    if "ref={notesRef}" in line:
        insert_idx = i - 1
        break

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
                      return <div className="p-10 text-red-500">Error parsing generated paper format. Raw output: <pre className="mt-2 text-xs">{resultText}</pre></div>;
                    }
                  })()
                )}
"""

# Modify the div to hide itself if paper-university
# The line is: <div 
# Next line: ref={notesRef}
# We'll just replace `<div` with `<div style={{ display: (resultType === "exam-paper" && examPaperType === "paper-university") ? 'none' : 'block' }}`
# Wait, the div already has a `style={Object.assign({...` on the line below `className`.
# Let's just wrap the div in a fragment or simple ternary?
# Even simpler: {!(resultType === "exam-paper" && examPaperType === "paper-university") && ( <div...  )}
# Wait, if we wrap it, we still have to close it.
# So hiding via class is easiest:
# `className={`... ${(resultType === "exam-paper" && examPaperType === "paper-university") ? "hidden" : ""} ...`}`
