import re
with open("server.ts", "r") as f:
    text = f.read()
text = re.sub(r"\$\{isTeacher \? `[\s\S]*?` : ''\}", "", text)
with open("server.ts", "w") as f:
    f.write(text)
