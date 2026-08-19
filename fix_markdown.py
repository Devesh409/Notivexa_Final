import re
with open("src/App.tsx", "r") as f:
    text = f.read()

target = """                              table: ({node, ...props}) => <table className="w-full border-collapse border border-black" {...props} />,
                              th: ({node, ...props}) => <th className="border border-black p-2 bg-gray-200" {...props} />,
                              td: ({node, ...props}) => <td className="border border-black p-2" {...props} />,"""

replacement = """                              table: ({node, ...props}) => <table className={`w-full border-collapse border border-black ${mode === 'student' ? handwritingFont : ''}`} {...props} />,
                              th: ({node, ...props}) => <th className={`border border-black p-2 bg-gray-200 ${mode === 'student' ? handwritingFont : ''}`} {...props} />,
                              td: ({node, ...props}) => <td className={`border border-black p-2 ${mode === 'student' ? handwritingFont : ''}`} {...props} />,"""

text = text.replace(target, replacement)

with open("src/App.tsx", "w") as f:
    f.write(text)
