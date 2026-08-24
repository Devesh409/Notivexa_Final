import sys
with open('src/App.tsx', 'r') as f:
    lines = f.readlines()

for i, line in enumerate(lines):
    if "})()" in line:
        print(f"Line {i+1}: {line}", end="")
