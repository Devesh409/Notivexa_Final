import sys

with open('src/App.tsx', 'r') as f:
    lines = f.readlines()

for i, line in enumerate(lines):
    if 'import' in line and 'types' in line:
        break
else:
    # Just insert it at top
    lines.insert(0, 'import { Slide } from "./types";\n')

with open('src/App.tsx', 'w') as f:
    f.writelines(lines)
