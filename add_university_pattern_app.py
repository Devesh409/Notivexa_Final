import re

with open("src/App.tsx", "r") as f:
    content = f.read()

target = '<option value="paper-long">Long Q\'s Paper (5, 8, 10 Marks)</option>'
replacement = """<option value="paper-long">Long Q's Paper (5, 8, 10 Marks)</option>
                          <option value="paper-university">University Format (60M, CO/BT Mapped)</option>"""

content = content.replace(target, replacement)

with open("src/App.tsx", "w") as f:
    f.write(content)

print("Added option to App.tsx")
