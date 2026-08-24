import re

with open("src/App.tsx", "r") as f:
    content = f.read()

# First, modify the Main Content Area container
# Wait, let's keep the parent background as it is, and just make the welcome card absolute inset-0

target_welcome = """          {!resultText && !flashcards.length && !videoData && (
            <div className="h-full min-h-[70vh] flex flex-col items-center justify-center text-center relative overflow-hidden py-20 px-6 rounded-3xl shadow-sm my-2 bg-gradient-to-br from-indigo-50/60 via-white to-sky-50/60 border border-indigo-100/50">"""

replacement_welcome = """          {!resultText && !flashcards.length && !videoData && (
            <div className="absolute inset-0 flex flex-col items-center justify-center text-center overflow-hidden bg-gradient-to-br from-indigo-50/60 via-white to-sky-50/60 z-0">"""

content = content.replace(target_welcome, replacement_welcome)

target_chatbot = """        <div className="mb-8">
          <Chatbot fileUri={fileData?.fileUri} mimeType={fileData?.mimeType} isDarkMode={isDarkMode} embedded={false} />
        </div>"""

replacement_chatbot = """        <div className="mb-8 relative z-10">
          <Chatbot fileUri={fileData?.fileUri} mimeType={fileData?.mimeType} isDarkMode={isDarkMode} embedded={false} />
        </div>"""

content = content.replace(target_chatbot, replacement_chatbot)

with open("src/App.tsx", "w") as f:
    f.write(content)
print("Updated")
