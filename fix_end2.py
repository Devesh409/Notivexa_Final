import sys

with open('src/App.tsx', 'r') as f:
    lines = f.readlines()

while lines[-1].strip() == '':
    lines.pop()

lines = lines[:-3]
lines.extend([
    "      </div>\n",
    "      </>\n",
    "    </div>\n",
    "  );\n",
    "}\n"
])

with open('src/App.tsx', 'w') as f:
    f.writelines(lines)
