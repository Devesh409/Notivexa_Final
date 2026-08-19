import sys

with open('src/App.tsx', 'r') as f:
    lines = f.readlines()

for i, line in enumerate(lines):
    if 'const [slides, setSlides] = useState<Slide[]>(' in line:
        lines.insert(i + 1, '  const [showPreviewModal, setShowPreviewModal] = useState(false);\n')
        break

with open('src/App.tsx', 'w') as f:
    f.writelines(lines)
