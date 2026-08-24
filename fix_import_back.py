import re
with open("src/components/SlidePreviewModal.tsx", "r") as f:
    content = f.read()
content = content.replace("import { Slide } from '../types.ts';", "import { Slide } from '../types';")
with open("src/components/SlidePreviewModal.tsx", "w") as f:
    f.write(content)
