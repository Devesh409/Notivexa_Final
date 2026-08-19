import re
with open("src/App.tsx", "r") as f:
    text = f.read()

target = """                              table: ({node, ...props}) => <table className={`w-full border-collapse border border-black ${mode === 'student' ? handwritingFont : ''}`} {...props} />,
                              th: ({node, ...props}) => <th className={`border border-black p-2 bg-gray-200 ${mode === 'student' ? handwritingFont : ''}`} {...props} />,
                              td: ({node, ...props}) => <td className={`border border-black p-2 ${mode === 'student' ? handwritingFont : ''}`} {...props} />,"""

replacement = """                              table: ({node, ...props}) => <table className={`w-full border-collapse my-4 ${mode === 'student' ? `border-2 border-opacity-30 ${penColor === 'blue' ? 'border-[#1d4ed8]' : 'border-[#3A3A2F]'}` : 'border border-black'}`} {...props} />,
                              th: ({node, ...props}) => <th className={`p-2 text-left ${mode === 'student' ? `border-b-2 border-opacity-30 bg-transparent font-bold ${handwritingFont} ${penColor === 'blue' ? 'border-[#1d4ed8]' : 'border-[#3A3A2F]'}` : 'border border-black bg-gray-200'}`} {...props} />,
                              td: ({node, ...props}) => <td className={`p-2 ${mode === 'student' ? `border-b border-opacity-20 ${handwritingFont} ${penColor === 'blue' ? 'border-[#1d4ed8]' : 'border-[#3A3A2F]'}` : 'border border-black'}`} {...props} />,"""

text = text.replace(target, replacement)

with open("src/App.tsx", "w") as f:
    f.write(text)
