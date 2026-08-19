import re
with open("server.ts", "r") as f:
    text = f.read()

text = text.replace(
    "Note: Keep Mermaid node labels clean and concise. Each Mermaid statement must be on its own line.",
    "Note: Keep Mermaid node labels clean and concise. Each Mermaid statement must be on its own line. DO NOT include any node legends, map keys, or descriptive legend boxes in the diagrams."
)

text = text.replace(
    "- Each Mermaid statement or arrow MUST be on its own separate line.",
    "- Each Mermaid statement or arrow MUST be on its own separate line.\n      - DO NOT include any node legends, map keys, or descriptive legend boxes in the diagrams."
)

with open("server.ts", "w") as f:
    f.write(text)
