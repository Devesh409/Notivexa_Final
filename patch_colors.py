import re

with open("src/App.tsx", "r") as f:
    content = f.read()

# Replace h1, h2, h3, h4, h5, h6, strong
components_old = """                            components={{
                              table: ({node, ...props}) => <div className="overflow-x-auto my-4 w-full"><table className={`w-full border-collapse ${(mode === 'student' && resultType !== 'exam-paper') ? `border-2 border-opacity-20 ${penColor === 'blue' ? 'border-[#1d4ed8]' : 'border-[#3A3A2F]'}` : 'border border-black'}`} {...props} /></div>,
                              th: ({node, ...props}) => <th className={`p-2 text-left ${(mode === 'student' && resultType !== 'exam-paper') ? `border-b-2 border-opacity-20 bg-transparent font-bold text-inherit ${handwritingFont} ${penColor === 'blue' ? 'border-[#1d4ed8]' : 'border-[#3A3A2F]'}` : 'border border-black bg-gray-200'}`} {...props} />,
                              td: ({node, ...props}) => <td className={`p-2 ${(mode === 'student' && resultType !== 'exam-paper') ? `border-b border-opacity-20 text-inherit ${handwritingFont} ${penColor === 'blue' ? 'border-[#1d4ed8]' : 'border-[#3A3A2F]'}` : 'border border-black'}`} {...props} />,
                              li: ({node, ...props}) => <li className={`mb-2 ${(mode === 'student' && resultType !== 'exam-paper') ? `text-inherit ${handwritingFont}` : ''}`} {...props} />,
                              h1: ({ children }) => <h1 className={`font-bold ${(mode === 'student' && resultType !== 'exam-paper') ? '!text-[#3A3A2F]' : 'text-inherit'}`}>{children}</h1>,
                              h2: ({ children }) => <h2 className={`font-bold ${(mode === 'student' && resultType !== 'exam-paper') ? '!text-[#3A3A2F]' : 'text-inherit'}`}>{children}</h2>,
                              h3: ({ children }) => <h3 className={`font-bold ${(mode === 'student' && resultType !== 'exam-paper') ? '!text-[#3A3A2F]' : 'text-inherit'}`}>{children}</h3>,
                              h4: ({ children }) => <h4 className={`font-bold ${(mode === 'student' && resultType !== 'exam-paper') ? '!text-[#3A3A2F]' : 'text-inherit'}`}>{children}</h4>,
                              h5: ({ children }) => <h5 className={`font-bold ${(mode === 'student' && resultType !== 'exam-paper') ? '!text-[#3A3A2F]' : 'text-inherit'}`}>{children}</h5>,
                              h6: ({ children }) => <h6 className={`font-bold ${(mode === 'student' && resultType !== 'exam-paper') ? '!text-[#3A3A2F]' : 'text-inherit'}`}>{children}</h6>,
                              strong: ({ children }) => <strong className={`font-bold ${(mode === 'student' && resultType !== 'exam-paper') ? '!text-[#3A3A2F]' : 'text-inherit'}`}>{children}</strong>,
                              em: ({ children }) => <em className={(mode === 'student' && resultType !== 'exam-paper') ? '!text-[#3A3A2F]' : 'text-inherit'}>{children}</em>,"""

components_new = """                            components={{
                              table: ({node, ...props}) => <div className="overflow-x-auto my-4 w-full"><table className={`w-full border-collapse ${(mode === 'student' && resultType !== 'exam-paper') ? `border-2 border-opacity-20 ${penColor === 'blue' ? 'border-[#1d4ed8]' : 'border-[#3A3A2F]'}` : 'border border-black'}`} {...props} /></div>,
                              th: ({node, ...props}) => <th className={`p-2 text-left ${(mode === 'student' && resultType !== 'exam-paper') ? `border-b-2 border-opacity-20 bg-transparent font-bold text-inherit ${handwritingFont} ${penColor === 'blue' ? 'border-[#1d4ed8]' : 'border-[#3A3A2F]'}` : 'border border-black bg-gray-200'}`} {...props} />,
                              td: ({node, ...props}) => <td className={`p-2 ${(mode === 'student' && resultType !== 'exam-paper') ? `border-b border-opacity-20 text-inherit ${handwritingFont} ${penColor === 'blue' ? 'border-[#1d4ed8]' : 'border-[#3A3A2F]'}` : 'border border-black'}`} {...props} />,
                              li: ({node, ...props}) => <li className={`mb-2 ${(mode === 'student' && resultType !== 'exam-paper') ? `text-inherit ${handwritingFont}` : 'text-blue-600'}`} {...props} />,
                              p: ({node, ...props}) => <p className={`mb-4 ${(mode === 'student' && resultType !== 'exam-paper') ? `text-inherit ${handwritingFont}` : 'text-blue-600'}`} {...props} />,
                              h1: ({ children }) => <h1 className={`font-bold !text-black`}>{children}</h1>,
                              h2: ({ children }) => <h2 className={`font-bold !text-black`}>{children}</h2>,
                              h3: ({ children }) => <h3 className={`font-bold !text-black`}>{children}</h3>,
                              h4: ({ children }) => <h4 className={`font-bold !text-black`}>{children}</h4>,
                              h5: ({ children }) => <h5 className={`font-bold !text-black`}>{children}</h5>,
                              h6: ({ children }) => <h6 className={`font-bold !text-black`}>{children}</h6>,
                              strong: ({ children }) => <strong className={`font-bold !text-black`}>{children}</strong>,
                              em: ({ children }) => <em className={(mode === 'student' && resultType !== 'exam-paper') ? 'text-inherit' : 'text-blue-600'}>{children}</em>,"""

content = content.replace(components_old, components_new)

with open("src/App.tsx", "w") as f:
    f.write(content)

