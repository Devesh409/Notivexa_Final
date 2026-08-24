import re

with open("src/App.tsx", "r") as f:
    content = f.read()

# Replace any occurrence of the old state definition
content = re.sub(r'useState<"notes" \| "assessment" \| "question-bank" \| "lesson-plan" \| "video" \| "ppt" \| "flashcards" \| "">', 'useState<"notes" | "assessment" | "question-bank" | "lesson-plan" | "video" | "ppt" | "flashcards" | "exam-paper" | "">', content)

# Check if there are other variations
content = re.sub(r'useState<"notes" \| "assessment" \| "question-bank" \| "lesson-plan" \| "video" \| "ppt" \| "">', 'useState<"notes" | "assessment" | "question-bank" | "lesson-plan" | "video" | "ppt" | "exam-paper" | "">', content)

# Replace the state property type in the modal if it exists in App.tsx
content = re.sub(r'theme: "academic" \| "professional" \| "minimalist";', 'theme: "academic" | "professional" | "minimalist" | "pastel";', content)


with open("src/App.tsx", "w") as f:
    f.write(content)

# Now fix SlidePreviewModal.tsx
with open("src/components/SlidePreviewModal.tsx", "r") as f:
    modal_content = f.read()

# Also fix the SlidePreviewModal prop
modal_content = re.sub(r'theme: "academic" \| "professional" \| "minimalist";', 'theme: "academic" | "professional" | "minimalist" | "pastel";', modal_content)
modal_content = re.sub(r'theme: "academic" \| "professional" \| "minimalist",', 'theme: "academic" | "professional" | "minimalist" | "pastel",', modal_content)

# The import error
modal_content = modal_content.replace('import { Slide } from "../types"', 'import { Slide } from "../types.ts"')
modal_content = modal_content.replace("import { Slide } from '../types'", "import { Slide } from '../types.ts'")

with open("src/components/SlidePreviewModal.tsx", "w") as f:
    f.write(modal_content)

print("Fixed all")
