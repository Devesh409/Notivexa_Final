import re
with open("server.ts", "r") as f:
    text = f.read()

# Replace the conditional logic for lesson plan prompt
# It looks like: prompt = isStudent ? `student prompt` : `teacher prompt`
text = re.sub(r"const isStudent = role === \"student\";\s*const prompt = isStudent \? `([\s\S]*?)` : `[\s\S]*?`;", r"const prompt = `\1`;", text)

with open("server.ts", "w") as f:
    f.write(text)
