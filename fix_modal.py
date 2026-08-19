import sys

with open('src/components/SlidePreviewModal.tsx', 'r') as f:
    content = f.read()

# Fix style duplication
content = content.replace(
    '''                className="absolute top-0 left-0 rounded-xl shadow-lg border border-slate-200 p-10 flex flex-col overflow-hidden transition-transform duration-200 ease-out" style={{ width: `${slideWidth}px`, height: `${slideHeight}px`, transform: `scale(${zoomLevel})`, transformOrigin: \'top left\', backgroundColor: "#FDFBF7", fontFamily: \'"Times New Roman", Times, serif\' }}
                style={{
                  width: `${slideWidth}px`,
                  height: `${slideHeight}px`,
                  transform: `scale(${zoomLevel})`,
                  transformOrigin: 'top left'
                }}''',
    '''                className="absolute top-0 left-0 rounded-xl shadow-lg border border-slate-200 p-10 flex flex-col overflow-hidden transition-transform duration-200 ease-out"
                style={{
                  width: `${slideWidth}px`,
                  height: `${slideHeight}px`,
                  transform: `scale(${zoomLevel})`,
                  transformOrigin: 'top left',
                  backgroundColor: "#FDFBF7",
                  fontFamily: '"Times New Roman", Times, serif'
                }}'''
)

# Fix literal newline
content = content.replace(
    '<div className="absolute top-0 left-0 w-full h-2 bg-rose-600"></div>\\n                <div className="absolute bottom-0 left-0 w-full h-1 bg-rose-600"></div>',
    '<div className="absolute top-0 left-0 w-full h-2 bg-rose-600"></div>\n                <div className="absolute bottom-0 left-0 w-full h-1 bg-rose-600"></div>'
)

with open('src/components/SlidePreviewModal.tsx', 'w') as f:
    f.write(content)
