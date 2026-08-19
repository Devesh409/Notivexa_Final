import sys

with open('src/App.tsx', 'r') as f:
    lines = f.readlines()

for i, line in enumerate(lines):
    if line.startswith('import { Slide } from "./types";'):
        lines.insert(i + 1, 'import { SlidePreviewModal } from "./components/SlidePreviewModal";\n')
        break

with open('src/App.tsx', 'w') as f:
    f.writelines(lines)
