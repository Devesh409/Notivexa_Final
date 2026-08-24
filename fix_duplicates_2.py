import re

with open("src/App.tsx", "r") as f:
    content = f.read()

# We know generateExamPaper is supposed to end where generateQuestionBank ends.
# Let's find generateQuestionBank block again
gb_start = content.find('const generateQuestionBank = async () => {')
downloadCSV_start = content.find('  const downloadCSV = () => {', gb_start)

# The correct length of generateQuestionBank block is:
gb_len = downloadCSV_start - gb_start

# generateExamPaper should only be that long.
ep_start = content.find('const generateExamPaper = async () => {')
# The duplicated block goes all the way until the SECOND instance of generatePPT.
# Actually, the duplicated block ends at the FIRST instance of generatePPT because the python script did:
# gb_end = content.find('const generatePPT = async () => {', gb_start)

# Let's just remove everything between ep_start + gb_len and the next legitimate function, which was what?
# Oh wait, the duplication inserted a huge chunk.
# Let's just read lines and remove the duplicates.

with open("src/App.tsx", "r") as f:
    lines = f.readlines()

ep_start_line = -1
for i, line in enumerate(lines):
    if "const generateExamPaper = async () => {" in line:
        ep_start_line = i
        break

download_csv_1 = -1
for i in range(ep_start_line, len(lines)):
    if "const downloadCSV = () => {" in lines[i]:
        download_csv_1 = i
        break

# The lines from download_csv_1 to the end of the duplicated block should be deleted.
# We know the duplicated block ends right before the original `const generatePPT = async () => {`.
# Wait, the first `const generatePPT = async () => {` IS the original one! Because the duplicate stopped right BEFORE it!
# Wait! No, the python script did `content[:gb_end] + generate_ep_block + content[gb_end:]`.
# So `generate_ep_block` is the entire chunk from `generateQuestionBank` to `generatePPT`.
# Which means the extra stuff is from the end of `generateExamPaper` to the end of `generate_ep_block`.
# The end of `generate_ep_block` is right before `const generatePPT = async () => {` which is at line `gb_end`.
# So we can just delete from `download_csv_1` up to the line before `const generatePPT = async () => {`.

generate_ppt_line = -1
for i in range(download_csv_1, len(lines)):
    if "const generatePPT = async () => {" in lines[i]:
        generate_ppt_line = i
        break

del lines[download_csv_1:generate_ppt_line]

with open("src/App.tsx", "w") as f:
    f.writelines(lines)

print("Duplicates removed.")
