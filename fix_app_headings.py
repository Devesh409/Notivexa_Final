import re

with open("src/App.tsx", "r") as f:
    content = f.read()

old_h1 = "h1: ({ children }) => <h1 className={`font-bold !text-black`}>{children}</h1>,"
new_h1 = "h1: ({ children }) => <h1 className={`text-4xl md:text-5xl mt-10 mb-6 font-extrabold !text-black leading-tight tracking-tight`}>{children}</h1>,"

old_h2 = "h2: ({ children }) => <h2 className={`font-bold !text-black`}>{children}</h2>,"
new_h2 = "h2: ({ children }) => <h2 className={`text-3xl md:text-4xl mt-8 mb-5 font-bold !text-black leading-snug tracking-tight`}>{children}</h2>,"

old_h3 = "h3: ({ children }) => <h3 className={`font-bold !text-black`}>{children}</h3>,"
new_h3 = "h3: ({ children }) => <h3 className={`text-2xl mt-6 mb-4 font-bold !text-black`}>{children}</h3>,"

content = content.replace(old_h1, new_h1)
content = content.replace(old_h2, new_h2)
content = content.replace(old_h3, new_h3)

with open("src/App.tsx", "w") as f:
    f.write(content)
print("Headings styled successfully!")
