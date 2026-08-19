import re
with open("src/App.tsx", "r") as f:
    text = f.read()

target = """                              table: ({node, ...props}) => <table className={`w-full border-collapse my-4 ${mode === 'student' ? `border-2 border-opacity-30 ${penColor === 'blue' ? 'border-[#1d4ed8]' : 'border-[#3A3A2F]'}` : 'border border-black'}`} {...props} />,"""

replacement = """                              table: ({node, ...props}) => <div className="overflow-x-auto my-4 w-full"><table className={`w-full border-collapse ${mode === 'student' ? `border-2 border-opacity-30 ${penColor === 'blue' ? 'border-[#1d4ed8]' : 'border-[#3A3A2F]'}` : 'border border-black'}`} {...props} /></div>,"""

text = text.replace(target, replacement)

with open("src/App.tsx", "w") as f:
    f.write(text)
