import re

with open("server.ts", "r") as f:
    content = f.read()

pattern = r'Aim for a highly detailed 5 to 10 page summary, providing step-by-step breakdowns, examples, and deep-dive analysis\.'
new_str = 'Aim for a detailed summary, providing step-by-step breakdowns and examples, but keep it concise if the content is extremely large to prevent timeouts.'

content_new = re.sub(pattern, new_str, content)
with open("server.ts", "w") as f:
    f.write(content_new)
print("Updated notes length instructions")
