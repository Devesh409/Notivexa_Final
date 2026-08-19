import sys

with open('src/App.tsx', 'r') as f:
    lines = f.readlines()

new_lines = []
skip = False
for line in lines:
    if '{slide.speakerNotes && (' in line:
        skip = True
        continue
    if skip and ')}' in line:
        skip = False
        continue
    if not skip:
        new_lines.append(line)

with open('src/App.tsx', 'w') as f:
    f.writelines(new_lines)
