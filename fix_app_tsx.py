import re

with open("src/App.tsx", "r") as f:
    content = f.read()

target = """                  {(mode === 'student' && resultType !== 'exam-paper') && (
                    <div className="pl-8">
                      { resultText.split('---SET_SEPARATOR---').map((setMarkdown, index) => ("""
replacement = """                  <div className={(mode === 'student' && resultType !== 'exam-paper') ? "pl-8" : ""}>
                      { resultText.split('---SET_SEPARATOR---').map((setMarkdown, index) => ("""
content = content.replace(target, replacement)

target2 = """                        </div>))}
                    </div>)}"""
replacement2 = """                        </div>))}
                  </div>"""
content = content.replace(target2, replacement2)

with open("src/App.tsx", "w") as f:
    f.write(content)

print("Fixed App.tsx")
