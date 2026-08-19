import re
with open("src/App.tsx", "r") as f:
    text = f.read()

target = """                              h1: ({ children }) => <h1 className="font-bold">{children}</h1>,
                              h2: ({ children }) => <h2 className="font-bold">{children}</h2>,
                              h3: ({ children }) => <h3 className="font-bold">{children}</h3>,
                              strong: ({ children }) => <strong className="font-bold">{children}</strong>,"""

replacement = """                              h1: ({ children }) => <h1 className="font-bold text-inherit">{children}</h1>,
                              h2: ({ children }) => <h2 className="font-bold text-inherit">{children}</h2>,
                              h3: ({ children }) => <h3 className="font-bold text-inherit">{children}</h3>,
                              strong: ({ children }) => <strong className="font-bold text-inherit">{children}</strong>,"""

text = text.replace(target, replacement)

with open("src/App.tsx", "w") as f:
    f.write(text)
