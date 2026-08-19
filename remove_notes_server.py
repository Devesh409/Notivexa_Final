import sys

with open('server.ts', 'r') as f:
    content = f.read()

target = "      - 'speakerNotes': (string) Detailed speaker notes for this slide (at least 30 words). NEVER prefix this field with 'Notes:' or any similar labels."

if target in content:
    content = content.replace(target, '')
    
    # Also remove from the responseSchema properties
    content = content.replace("                    speakerNotes: { type: Type.STRING },", "")
    
    with open('server.ts', 'w') as f:
        f.write(content)
    print("Updated server.ts")
else:
    print("Target not found in server.ts")
