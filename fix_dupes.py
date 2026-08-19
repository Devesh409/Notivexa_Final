import re
with open("src/App.tsx", "r") as f:
    text = f.read()

target = """                    '--tw-prose-headings': penColor === 'blue' ? '#1d4ed8' : '#3A3A2F',
                    '--tw-prose-bold': penColor === 'blue' ? '#1d4ed8' : '#3A3A2F',
                    '--tw-prose-th-borders': penColor === 'blue' ? 'rgba(29, 78, 216, 0.3)' : 'rgba(58, 58, 47, 0.3)',
                    '--tw-prose-td-borders': penColor === 'blue' ? 'rgba(29, 78, 216, 0.2)' : 'rgba(58, 58, 47, 0.2)',
                    '--tw-prose-headings': penColor === 'blue' ? '#1d4ed8' : '#3A3A2F',
                    '--tw-prose-bold': penColor === 'blue' ? '#1d4ed8' : '#3A3A2F',"""

replacement = """                    '--tw-prose-headings': penColor === 'blue' ? '#1d4ed8' : '#3A3A2F',
                    '--tw-prose-bold': penColor === 'blue' ? '#1d4ed8' : '#3A3A2F',
                    '--tw-prose-th-borders': penColor === 'blue' ? 'rgba(29, 78, 216, 0.3)' : 'rgba(58, 58, 47, 0.3)',
                    '--tw-prose-td-borders': penColor === 'blue' ? 'rgba(29, 78, 216, 0.2)' : 'rgba(58, 58, 47, 0.2)',"""

text = text.replace(target, replacement)

with open("src/App.tsx", "w") as f:
    f.write(text)
