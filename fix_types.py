import re

with open("src/App.tsx", "r") as f:
    content = f.read()

target = 'useState<"notes" | "assessment" | "question-bank" | "lesson-plan" | "video" | "ppt" | "">("")'
replacement = 'useState<"notes" | "assessment" | "question-bank" | "lesson-plan" | "video" | "ppt" | "exam-paper" | "">("")'
content = content.replace(target, replacement)

with open("src/App.tsx", "w") as f:
    f.write(content)

with open("src/components/SlidePreviewModal.tsx", "r") as f:
    modal_content = f.read()

# Let's fix the pastel issue in SlidePreviewModal
target2 = 'theme: "academic" | "professional" | "minimalist";'
replacement2 = 'theme: "academic" | "professional" | "minimalist" | "pastel";'
modal_content = modal_content.replace(target2, replacement2)

with open("src/components/SlidePreviewModal.tsx", "w") as f:
    f.write(modal_content)

print("Fixed types")
