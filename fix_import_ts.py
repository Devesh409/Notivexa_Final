import re

with open("src/components/SlidePreviewModal.tsx", "r") as f:
    content = f.read()

content = content.replace("import { Slide } from '../types';", "import { Slide } from '../types.ts';")

with open("src/components/SlidePreviewModal.tsx", "w") as f:
    f.write(content)
