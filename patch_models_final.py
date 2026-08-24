
with open("server.ts", "r") as f:
    content = f.read()

# Replace all instances of deprecated gemini models with gemini-3.6-flash
deprecated_models = [
    "gemini-2.5-pro",
    "gemini-1.5-pro",
    "gemini-2.5-flash",
    "gemini-1.5-flash",
    "gemini-2.0-flash"
]

for model in deprecated_models:
    content = content.replace(f'"{model}"', '"gemini-3.6-flash"')

with open("server.ts", "w") as f:
    f.write(content)
print("Updated all models to gemini-3.6-flash")
