import sys

with open('src/App.tsx', 'r') as f:
    lines = f.readlines()

for i, line in enumerate(lines):
    if 'const [resultText, setResultText]' in line:
        lines.insert(i + 1, '  const [slides, setSlides] = useState<Slide[]>([]);\n')
        break

with open('src/App.tsx', 'w') as f:
    f.writelines(lines)
