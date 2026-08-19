import re
with open("src/App.tsx", "r") as f:
    text = f.read()
text = text.replace("{ (                      <>\n                        <select", "                      <>\n                        <select")
text = text.replace("                      </>\n                    ) }", "                      </>")
with open("src/App.tsx", "w") as f:
    f.write(text)
