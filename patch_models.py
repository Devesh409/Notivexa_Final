import re

with open("server.ts", "r") as f:
    content = f.read()

pattern = r'const modelsToTry = \[\s*"gemini-2\.5-flash",\s*"gemini-2\.5-flash",\s*"gemini-2\.5-flash",\s*"gemini-2\.5-flash"\s*\];'
new_models = """const modelsToTry = [
    "gemini-2.5-pro",
    "gemini-1.5-pro",
    "gemini-2.5-flash",
    "gemini-1.5-flash",
    "gemini-2.0-flash"
  ];"""

content_new = re.sub(pattern, new_models, content)
with open("server.ts", "w") as f:
    f.write(content_new)
print("Updated modelsToTry")
