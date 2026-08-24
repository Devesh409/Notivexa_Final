import re

with open("server.ts", "r") as f:
    content = f.read()

old_instruction = "      7. Use bold formatting (**) for key points and important terms to enhance readability. Do NOT use # for headers."
new_instruction = "      7. Use bold formatting (**) for key points and important terms to enhance readability. At the very beginning, ALWAYS provide the Chapter Name, Unit Name, and Title in a BIG FONT using Markdown Headers (# and ##)."

if old_instruction in content:
    content = content.replace(old_instruction, new_instruction)
    with open("server.ts", "w") as f:
        f.write(content)
    print("Patched successfully!")
else:
    print("Old instruction not found!")
