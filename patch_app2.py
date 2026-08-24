with open("src/App.tsx", "r") as f:
    content = f.read()

old = 'body: JSON.stringify({ fileUri: fileData.fileUri, mimeType: fileData.mimeType, questionType: examPaperType, bloomLevel: questionBankBloomLevel, mode: mode }),'
new = 'body: JSON.stringify({ fileUri: fileData.fileUri, mimeType: fileData.mimeType, questionType: examPaperType, bloomLevel: questionBankBloomLevel, mode: mode, totalMarks: examPaperType === "paper-university" ? universityMarks : undefined }),'

content = content.replace(old, new)

with open("src/App.tsx", "w") as f:
    f.write(content)
