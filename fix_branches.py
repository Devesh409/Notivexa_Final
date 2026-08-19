import sys

with open('src/App.tsx', 'r') as f:
    content = f.read()

# Let's find `<button\n                    onClick={generateAssessment}`
# and insert `                </>\n              ) : (\n                <>\n                  ` before it.
split_point = '                  <button\n                    onClick={generateAssessment}'
if split_point in content:
    content = content.replace(split_point, '                </>\n              ) : (\n                <>\n' + split_point)
    with open('src/App.tsx', 'w') as f:
        f.write(content)
    print("Fixed branch split.")
else:
    print("Split point not found.")
