import re

with open("src/App.tsx", "r") as f:
    content = f.read()

# 1. Remove the custom UI for lesson-plan
# {resultType === "lesson-plan" && lessonPlan && ( ... )}
# Find the start of the block and manually match brackets.
start_idx = content.find('{resultType === "lesson-plan" && lessonPlan && (')
if start_idx != -1:
    open_brackets = 0
    end_idx = -1
    for i in range(start_idx + len('{resultType === "lesson-plan" && lessonPlan && ('), len(content)):
        if content[i] == '(':
            open_brackets += 1
        elif content[i] == ')':
            if open_brackets == 0:
                end_idx = i + 1
                break
            open_brackets -= 1
    
    if end_idx != -1:
        # Also remove any surrounding divs if we want, but removing the whole block is fine
        content = content[:start_idx] + content[end_idx:]
        print("Removed custom UI block")

# 2. Allow handwriting controls for lesson-plan
# Currently it says: {resultType !== "lesson-plan" && (
# Let's change it to just {true && ( or remove the condition.
# But wait, there might be multiple occurrences.
content = content.replace('{resultType !== "lesson-plan" && (', '{true && (')

with open("src/App.tsx", "w") as f:
    f.write(content)
print("UI patched")
