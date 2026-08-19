import sys

with open('src/App.tsx', 'r') as f:
    content = f.read()

target = """        // Speaker notes
        if (slide.speakerNotes) {
          pptSlide.addNotes(slide.speakerNotes);
        }"""

if target in content:
    content = content.replace(target, '')
    with open('src/App.tsx', 'w') as f:
        f.write(content)
    print("Removed notes from PPT download in App.tsx")
else:
    print("Target not found in App.tsx")
