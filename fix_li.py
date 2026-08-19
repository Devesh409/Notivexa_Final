import re
with open("src/App.tsx", "r") as f:
    text = f.read()

target = """                              td: ({node, ...props}) => <td className={`p-2 ${mode === 'student' ? `border-b border-opacity-20 text-inherit ${handwritingFont} ${penColor === 'blue' ? 'border-[#1d4ed8]' : 'border-[#3A3A2F]'}` : 'border border-black'}`} {...props} />,"""

replacement = """                              td: ({node, ...props}) => <td className={`p-2 ${mode === 'student' ? `border-b border-opacity-20 text-inherit ${handwritingFont} ${penColor === 'blue' ? 'border-[#1d4ed8]' : 'border-[#3A3A2F]'}` : 'border border-black'}`} {...props} />,
                              li: ({node, ...props}) => <li className={`mb-2 ${mode === 'student' ? `text-inherit ${handwritingFont}` : ''}`} {...props} />,"""

text = text.replace(target, replacement)

with open("src/App.tsx", "w") as f:
    f.write(text)
