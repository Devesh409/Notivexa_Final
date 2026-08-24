import re

with open("server.ts", "r") as f:
    content = f.read()

pattern = r'Do not exceed the token limits, but provide as much detail as possible\.'
new_str = 'Ensure the output does not exceed the model token limits and stays within a reasonable processing time.'

content_new = re.sub(pattern, new_str, content)
with open("server.ts", "w") as f:
    f.write(content_new)
print("Updated notes length instructions")
