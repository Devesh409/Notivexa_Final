import sys

with open('src/components/SlidePreviewModal.tsx', 'r') as f:
    content = f.read()

# Add theme prop
if 'theme?: "academic" | "professional" | "minimalist";' not in content:
    content = content.replace(
        '  slides: Slide[];',
        '  slides: Slide[];\n  theme?: "academic" | "professional" | "minimalist";'
    )
    
content = content.replace(
    'export const SlidePreviewModal: React.FC<SlidePreviewModalProps> = ({ slides, onClose }) => {',
    'export const SlidePreviewModal: React.FC<SlidePreviewModalProps> = ({ slides, theme = "academic", onClose }) => {'
)

# Apply theme styling
old_style_block = """                style={{
                  width: `${slideWidth}px`,
                  height: `${slideHeight}px`,
                  transform: `scale(${zoomLevel})`,
                  transformOrigin: 'top left',
                  backgroundColor: "#FDFBF7",
                  fontFamily: '"Times New Roman", Times, serif'
                }}"""

new_style_block = """                style={{
                  width: `${slideWidth}px`,
                  height: `${slideHeight}px`,
                  transform: `scale(${zoomLevel})`,
                  transformOrigin: 'top left',
                  backgroundColor: theme === "professional" ? "#FFFFFF" : theme === "minimalist" ? "#F8FAFC" : "#FDFBF7",
                  fontFamily: theme === "professional" ? "Arial, sans-serif" : theme === "minimalist" ? "Helvetica, sans-serif" : '"Times New Roman", Times, serif'
                }}"""
content = content.replace(old_style_block, new_style_block)

# Conditional top accent
old_accent = """                {/* Minimalist Top Accent */}
                <div className="absolute top-0 left-0 w-full h-2 bg-rose-600"></div>
                <div className="absolute bottom-0 left-0 w-full h-1 bg-rose-600"></div>"""

new_accent = """                {/* Minimalist Top Accent */}
                {theme !== "minimalist" && (
                  <>
                    <div className={`absolute top-0 left-0 w-full h-2 ${theme === "professional" ? "bg-blue-600" : "bg-rose-600"}`}></div>
                    <div className={`absolute bottom-0 left-0 w-full h-1 ${theme === "professional" ? "bg-blue-600" : "bg-rose-600"}`}></div>
                  </>
                )}"""
content = content.replace(old_accent, new_accent)

# Adjust font colors
old_title_class = 'className="text-4xl md:text-6xl font-bold text-[#0F172A] mb-8 leading-tight"'
new_title_class = 'className={`text-4xl md:text-6xl font-bold mb-8 leading-tight ${theme === "minimalist" ? "text-black" : theme === "professional" ? "text-slate-800" : "text-[#0F172A]"}`}'
content = content.replace(old_title_class, new_title_class)

old_bullet_class = 'className="flex items-start text-xl md:text-2xl text-[#334155] leading-relaxed"'
new_bullet_class = 'className={`flex items-start text-xl md:text-2xl leading-relaxed ${theme === "minimalist" ? "text-black" : theme === "professional" ? "text-slate-600" : "text-[#334155]"}`}'
content = content.replace(old_bullet_class, new_bullet_class)

old_bullet_dot = '<span className="text-rose-600 mr-4 text-3xl leading-none">•</span>'
new_bullet_dot = '<span className={`${theme === "professional" ? "text-blue-600" : theme === "minimalist" ? "text-black" : "text-rose-600"} mr-4 text-3xl leading-none`}>•</span>'
content = content.replace(old_bullet_dot, new_bullet_dot)

old_badge = '<div className="text-xs font-bold text-pink-500 mb-6 uppercase tracking-wider">'
new_badge = '<div className={`text-xs font-bold mb-6 uppercase tracking-wider ${theme === "professional" ? "text-blue-500" : theme === "minimalist" ? "text-gray-500" : "text-pink-500"}`}>'
content = content.replace(old_badge, new_badge)

with open('src/components/SlidePreviewModal.tsx', 'w') as f:
    f.write(content)
print("Updated SlidePreviewModal.tsx")
