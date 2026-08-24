import re

with open("src/App.tsx", "r") as f:
    content = f.read()

# Fix generatingType
content = re.sub(r'useState<"notes" \| "assessment" \| "flashcards" \| "question-bank" \| "lesson-plan" \| "video" \| "ppt" \| "">', 'useState<"notes" | "assessment" | "flashcards" | "question-bank" | "lesson-plan" | "video" | "ppt" | "exam-paper" | "">', content)

# Fix pptTheme if needed
content = re.sub(r'useState<"academic" \| "professional" \| "minimalist">', 'useState<"academic" | "professional" | "minimalist" | "pastel">', content)

with open("src/App.tsx", "w") as f:
    f.write(content)

with open("src/components/SlidePreviewModal.tsx", "r") as f:
    modal_content = f.read()

modal_content = modal_content.replace("import { Slide } from '../types.ts'", "import { Slide } from '../types'")
modal_content = modal_content.replace("import { Slide } from '../types.ts';", "import { Slide } from '../types';")

# Let's completely replace the SlidePreviewModal prop definition if it's there
modal_content = re.sub(r'theme\?: "academic" \| "professional" \| "minimalist"', 'theme?: "academic" | "professional" | "minimalist" | "pastel"', modal_content)

with open("src/components/SlidePreviewModal.tsx", "w") as f:
    f.write(modal_content)

print("Fixed generatingType and Modal types")
