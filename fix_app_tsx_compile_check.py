import re
with open("src/App.tsx", "r") as f:
    content = f.read()
if "resultType !== 'exam-paper'" in content:
    print("Success")
