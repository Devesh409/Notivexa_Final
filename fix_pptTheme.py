import re
with open("src/App.tsx", "r") as f:
    content = f.read()
if 'const [pptTheme, setPptTheme] = useState<"academic" | "professional" | "minimalist">' in content:
    content = content.replace('const [pptTheme, setPptTheme] = useState<"academic" | "professional" | "minimalist">', 'const [pptTheme, setPptTheme] = useState<"academic" | "professional" | "minimalist" | "pastel">')
    with open("src/App.tsx", "w") as f:
        f.write(content)
print("done")
