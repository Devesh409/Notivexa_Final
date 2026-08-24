with open('src/App.tsx', 'r') as f:
    lines = f.readlines()

new_lines = lines[:3629] + ["                {/* \n", "                  Applying a handwriting font class when in student mode.\n", "                */}\n"] + lines[3651:]

with open('src/App.tsx', 'w') as f:
    f.writelines(new_lines)
