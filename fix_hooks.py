import re

with open("src/App.tsx", "r") as f:
    content = f.read()

# Extract the block
match = re.search(r"(\s*// Text-to-Speech logic.*?  \}, \[resultText\]\);\n)", content, re.DOTALL)
if match:
    tts_block = match.group(1)
    
    # Remove it from the current location
    content = content.replace(tts_block, "")
    
    # Find a safe place to insert it, e.g. before "  if (authLoading) {"
    safe_place_match = re.search(r"(  if \(authLoading\) {)", content)
    if safe_place_match:
        content = content.replace("  if (authLoading) {", tts_block + "\n  if (authLoading) {")
        
        with open("src/App.tsx", "w") as f:
            f.write(content)
        print("Success!")
    else:
        print("Could not find safe place to insert.")
else:
    print("Could not find TTS block.")
