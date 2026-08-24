import re

with open("src/App.tsx", "r") as f:
    content = f.read()

# We only want to replace it within the ReactMarkdown components block for the exam paper / notes.
# Find the start of the ReactMarkdown block in the specific area
start_idx = content.find('<ReactMarkdown')
end_idx = content.find('</ReactMarkdown>', start_idx)

if start_idx != -1 and end_idx != -1:
    block = content[start_idx:end_idx]
    
    # We want to replace `mode === 'student'` with `(mode === 'student' && resultType !== 'exam-paper')`
    # BUT only for the class names.
    block = block.replace("mode === 'student' ?", "(mode === 'student' && resultType !== 'exam-paper') ?")
    block = block.replace("mode === 'student' :", "(mode === 'student' && resultType !== 'exam-paper') :")
    block = block.replace("(mode === 'student') ?", "(mode === 'student' && resultType !== 'exam-paper') ?")
    block = block.replace("(mode === 'student') &&", "(mode === 'student' && resultType !== 'exam-paper') &&")
    
    # Let's write it back
    content = content[:start_idx] + block + content[end_idx:]
    
    with open("src/App.tsx", "w") as f:
        f.write(content)
    print("Fixed ReactMarkdown components")
else:
    print("Could not find ReactMarkdown block")
