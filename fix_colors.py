import re
with open("src/App.tsx", "r") as f:
    text = f.read()

target = """                    backgroundAttachment: 'local',
                    lineHeight: '32px',
                    '--tw-prose-body': penColor === 'blue' ? '#1d4ed8' : '#3A3A2F',"""

replacement = """                    backgroundAttachment: 'local',
                    lineHeight: '32px',
                    '--tw-prose-body': penColor === 'blue' ? '#1d4ed8' : '#3A3A2F',
                    '--tw-prose-headings': penColor === 'blue' ? '#1d4ed8' : '#3A3A2F',
                    '--tw-prose-bold': penColor === 'blue' ? '#1d4ed8' : '#3A3A2F',
                    '--tw-prose-th-borders': penColor === 'blue' ? 'rgba(29, 78, 216, 0.3)' : 'rgba(58, 58, 47, 0.3)',
                    '--tw-prose-td-borders': penColor === 'blue' ? 'rgba(29, 78, 216, 0.2)' : 'rgba(58, 58, 47, 0.2)',"""

text = text.replace(target, replacement)

target2 = """                              th: ({node, ...props}) => <th className={`p-2 text-left ${mode === 'student' ? `border-b-2 border-opacity-30 bg-transparent font-bold ${handwritingFont} ${penColor === 'blue' ? 'border-[#1d4ed8]' : 'border-[#3A3A2F]'}` : 'border border-black bg-gray-200'}`} {...props} />,
                              td: ({node, ...props}) => <td className={`p-2 ${mode === 'student' ? `border-b border-opacity-20 ${handwritingFont} ${penColor === 'blue' ? 'border-[#1d4ed8]' : 'border-[#3A3A2F]'}` : 'border border-black'}`} {...props} />,"""

replacement2 = """                              th: ({node, ...props}) => <th className={`p-2 text-left ${mode === 'student' ? `border-b-2 border-opacity-30 bg-transparent font-bold text-inherit ${handwritingFont} ${penColor === 'blue' ? 'border-[#1d4ed8]' : 'border-[#3A3A2F]'}` : 'border border-black bg-gray-200'}`} {...props} />,
                              td: ({node, ...props}) => <td className={`p-2 ${mode === 'student' ? `border-b border-opacity-20 text-inherit ${handwritingFont} ${penColor === 'blue' ? 'border-[#1d4ed8]' : 'border-[#3A3A2F]'}` : 'border border-black'}`} {...props} />,"""

text = text.replace(target2, replacement2)

with open("src/App.tsx", "w") as f:
    f.write(text)
