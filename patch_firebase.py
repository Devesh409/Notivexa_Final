import re
with open("src/firebase.ts", "r") as f:
    content = f.read()

content = content.replace("experimentalAutoDetectLongPolling: true", "experimentalForceLongPolling: true")

with open("src/firebase.ts", "w") as f:
    f.write(content)
