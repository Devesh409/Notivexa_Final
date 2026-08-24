import sys
with open('src/App.tsx', 'r') as f:
    lines = f.readlines()

# The error TS1381 is at src/App.tsx(3631,17):
#                 {/* 
#                   Intercept UniversityPaperEditor if the JSON parses
#                 */}

start_idx = -1
for i, line in enumerate(lines):
    if "Intercept UniversityPaperEditor if the JSON parses" in line:
        start_idx = i - 1 # The {/* line
        break

if start_idx == -1:
    print("Could not find block")
    sys.exit(1)

# Find where the `notesRef` is:
end_idx = -1
for i in range(start_idx, len(lines)):
    if "ref={notesRef}" in lines[i]:
        end_idx = i
        break

print(f"Block from {start_idx} to {end_idx}:")
for i in range(start_idx, end_idx+1):
    print(lines[i], end="")
