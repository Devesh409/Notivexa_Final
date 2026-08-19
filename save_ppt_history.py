import sys

with open('src/App.tsx', 'r') as f:
    lines = f.readlines()

target_index = -1
for i, line in enumerate(lines):
    if 'setResultType("ppt");' in line and '// We\'d add this to firestore here' in lines[i+1]:
        target_index = i
        break

if target_index != -1:
    new_code = """
        if (user) {
          await addDoc(collection(db, "users", user.uid, "documents"), {
            title: file ? file.name : "Presentation Slides",
            type: "ppt",
            fileUri: fileData.fileUri,
            mimeType: fileData.mimeType,
            resultText: "",
            flashcards: [],
            slides: data.ppt.slides,
            focusArea: selectedDept !== "All" ? selectedDept : "",
            createdAt: serverTimestamp()
          });
        }
"""
    lines.insert(target_index + 1, new_code)
    # Remove the comment line
    # lines[i+2] will be the comment since we just inserted something at target_index + 1. 
    # Let's just find and replace the comment
    for i, line in enumerate(lines):
        if '// We\'d add this to firestore here, but we can do it after.' in line:
            lines[i] = ""

with open('src/App.tsx', 'w') as f:
    f.writelines(lines)
