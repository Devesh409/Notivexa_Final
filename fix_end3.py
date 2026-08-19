import sys

with open('src/App.tsx', 'r') as f:
    lines = f.readlines()

new_lines = []
for line in lines:
    if line.strip() == "</>":
        continue
    new_lines.append(line)

with open('src/App.tsx', 'w') as f:
    f.writelines(new_lines)

