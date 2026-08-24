import re

with open("src/App.tsx", "r") as f:
    content = f.read()

# 1. Remove the accidental IIFE close
content = content.replace("                  );\n                })()\n                {/* \n                  Intercept UniversityPaperEditor if the JSON parses\n                */}\n                {(() => {\n                  if (resultType === \"exam-paper\" && examPaperType === \"paper-university\") {\n                    try {\n                      // Attempt to parse JSON. Sometimes Gemini adds ```json wrapper.\n                      let cleanedText = resultText.trim();\n                      if (cleanedText.startsWith(\"```json\")) {\n                        cleanedText = cleanedText.replace(/^```json/, \"\").replace(/```$/, \"\").trim();\n                      }\n                      const parsedData = JSON.parse(cleanedText);\n                      return <UniversityPaperEditor initialData={parsedData} />;\n                    } catch (e) {\n                      console.error(\"Failed to parse paper-university JSON:\", e);\n                    }\n                  }\n                  \n                  return (\n                    <div \n                      ref={notesRef}", 
"""                {/* 
                  Applying a handwriting font class when in student mode.
                */}
                <div 
                  ref={notesRef}""")

# Just to be sure, do it with regex if exact match fails
content = re.sub(r'                  \);\n                \}\)\(\)\}\n                \{\/\* \n                  Intercept UniversityPaperEditor.*?\n                      ref=\{notesRef\}',
r'''                {/* 
                  Applying a handwriting font class when in student mode.
                */}
                <div 
                  ref={notesRef}''', content, flags=re.DOTALL)

with open("src/App.tsx", "w") as f:
    f.write(content)
