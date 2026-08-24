import re

with open('src/App.tsx', 'r') as f:
    text = f.read()

# Fix the injected block
bad_block = re.search(r'                  \);\n                \}\)\(\)\}\n                \{\/\* \n                  Intercept UniversityPaperEditor.*?\n                      ref=\{notesRef\}', text, re.DOTALL)

if bad_block:
    text = text[:bad_block.start()] + """                {/* 
                  Applying a handwriting font class when in student mode.
                */}
                <div 
                  ref={notesRef}""" + text[bad_block.end():]
    print("Fixed bad block")
else:
    print("Could not find bad block")

with open('src/App.tsx', 'w') as f:
    f.write(text)
