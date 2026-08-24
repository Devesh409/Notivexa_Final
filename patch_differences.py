import re

with open("server.ts", "r") as f:
    content = f.read()

old_inst = "      7. COMPARISONS AND DIFFERENCES: Whenever the text discusses differences between concepts or compares multiple things, YOU MUST format these comparisons as Markdown TABLES."
new_inst = "      7. COMPARISONS AND DIFFERENCES: Whenever the text discusses differences between concepts or compares multiple things, YOU MUST format these comparisons as Markdown TABLES. YOU MUST provide a minimum of 10 differences/points of comparison whenever possible."

if old_inst in content:
    content = content.replace(old_inst, new_inst)
    with open("server.ts", "w") as f:
        f.write(content)
    print("Differences patched successfully!")
else:
    print("Instruction not found!")
