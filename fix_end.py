import sys

with open('src/App.tsx', 'r') as f:
    lines = f.readlines()

while lines[-1].strip() == '':
    lines.pop()

# The last lines should be:
#         </div>
#       )}
#       </div>
#     </div>
#   );
# }

# Find the start of the <motion.div> block
idx = len(lines) - 1
while idx >= 0:
    if "exportStatus" in lines[idx]:
        break
    idx -= 1

# Let's just fix it starting from exportStatus
idx = idx + 2
lines = lines[:idx]
lines.extend([
    "          </motion.div>\n",
    "        </div>\n",
    "      )}\n",
    "      </div>\n",
    "    </div>\n",
    "  );\n",
    "}\n"
])

with open('src/App.tsx', 'w') as f:
    f.writelines(lines)
