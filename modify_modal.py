import sys

with open('src/components/SlidePreviewModal.tsx', 'r') as f:
    content = f.read()

# Update the main slide container background and font
content = content.replace(
    'className="absolute top-0 left-0 bg-white rounded-xl shadow-lg border border-slate-200 p-10 flex flex-col overflow-hidden transition-transform duration-200 ease-out"',
    'className="absolute top-0 left-0 rounded-xl shadow-lg border border-slate-200 p-10 flex flex-col overflow-hidden transition-transform duration-200 ease-out" style={{ width: `${slideWidth}px`, height: `${slideHeight}px`, transform: `scale(${zoomLevel})`, transformOrigin: \'top left\', backgroundColor: "#FDFBF7", fontFamily: \'"Times New Roman", Times, serif\' }}'
)

# Remove the inline styles that were hardcoded before to prevent duplication
content = content.replace(
    '''              <div 
                className="absolute top-0 left-0 bg-white rounded-xl shadow-lg border border-slate-200 p-10 flex flex-col overflow-hidden transition-transform duration-200 ease-out"
                style={{
                  width: `${slideWidth}px`,
                  height: `${slideHeight}px`,
                  transform: `scale(${zoomLevel})`,
                  transformOrigin: 'top left'
                }}
              >''',
    '''              <div 
                className="absolute top-0 left-0 rounded-xl shadow-lg border border-slate-200 p-10 flex flex-col overflow-hidden transition-transform duration-200 ease-out"
                style={{
                  width: `${slideWidth}px`,
                  height: `${slideHeight}px`,
                  transform: `scale(${zoomLevel})`,
                  transformOrigin: 'top left',
                  backgroundColor: "#FDFBF7",
                  fontFamily: '"Times New Roman", Times, serif'
                }}
              >'''
)

# Update heading classes
content = content.replace(
    '<h2 className="text-3xl md:text-5xl font-bold text-slate-800 mb-8 font-serif leading-tight">',
    '<h2 className="text-4xl md:text-6xl font-bold text-[#0F172A] mb-8 leading-tight">'
)

# Update bullet points classes
content = content.replace(
    '<span className="text-pink-500 mr-4 text-2xl leading-none">•</span>',
    '<span className="text-rose-600 mr-4 text-3xl leading-none">•</span>'
)
content = content.replace(
    '<li key={idx} className="flex items-start text-lg md:text-xl text-slate-600">',
    '<li key={idx} className="flex items-start text-xl md:text-2xl text-[#334155] leading-relaxed">'
)

# Fix the gradient bar to match the PPT design (rose/E11D48 color)
content = content.replace(
    '<div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-pink-500 to-rose-600"></div>',
    '<div className="absolute top-0 left-0 w-full h-2 bg-rose-600"></div>\\n                <div className="absolute bottom-0 left-0 w-full h-1 bg-rose-600"></div>'
)

with open('src/components/SlidePreviewModal.tsx', 'w') as f:
    f.write(content)
