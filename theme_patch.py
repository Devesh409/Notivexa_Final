import sys

with open('src/App.tsx', 'r') as f:
    content = f.read()

# 1. Add pptTheme state
if 'const [pptTheme, setPptTheme] = useState' not in content:
    content = content.replace(
        'const [showPreviewModal, setShowPreviewModal] = useState(false);',
        'const [showPreviewModal, setShowPreviewModal] = useState(false);\n  const [pptTheme, setPptTheme] = useState<"academic" | "professional" | "minimalist">("academic");'
    )

# 2. Update downloadPPT to use theme
old_master = """      // Define a nice master slide layout
      pres.defineSlideMaster({
        title: "MASTER_SLIDE",
        background: { color: "FDFBF7" }, // Warm off-white
        objects: [
          // Top accent bar
          { rect: { x: 0, y: 0, w: "100%", h: 0.15, fill: { color: "E11D48" } } },
          // Bottom footer line
          { rect: { x: 0, y: "96%", w: "100%", h: 0.05, fill: { color: "E11D48" } } },
          // Footer text
          { text: { text: "EduSmart AI Presentation", options: { x: 0.5, y: "96.5%", w: 3, h: 0.2, fontSize: 10, fontFace: "Times New Roman", color: "888888" } } }
        ],
        slideNumber: { x: "95%", y: "96.5%", color: "888888", fontFace: "Times New Roman", fontSize: 10 }
      });"""

new_master = """      // Define master slide layout based on theme
      let bgColor = "FDFBF7"; // Academic
      let accentColor = "E11D48";
      let fontName = "Times New Roman";
      let titleColor = "0F172A";
      let contentColor = "334155";
      
      if (pptTheme === "professional") {
        bgColor = "FFFFFF";
        accentColor = "2563EB"; // Blue
        fontName = "Arial";
        titleColor = "1E293B";
        contentColor = "475569";
      } else if (pptTheme === "minimalist") {
        bgColor = "F8FAFC";
        accentColor = "000000";
        fontName = "Helvetica";
        titleColor = "000000";
        contentColor = "000000";
      }

      const objects: any[] = [];
      if (pptTheme === "academic" || pptTheme === "professional") {
        objects.push({ rect: { x: 0, y: 0, w: "100%", h: 0.15, fill: { color: accentColor } } });
        objects.push({ rect: { x: 0, y: "96%", w: "100%", h: 0.05, fill: { color: accentColor } } });
      }
      objects.push({ text: { text: "EduSmart AI Presentation", options: { x: 0.5, y: "96.5%", w: 3, h: 0.2, fontSize: 10, fontFace: fontName, color: "888888" } } });

      pres.defineSlideMaster({
        title: "MASTER_SLIDE",
        background: { color: bgColor },
        objects: objects,
        slideNumber: { x: "95%", y: "96.5%", color: "888888", fontFace: fontName, fontSize: 10 }
      });"""

content = content.replace(old_master, new_master)

# 3. Update the text additions to use the theme fonts
old_title_text = """        pptSlide.addText(slide.title, {
          x: 0.5,
          y: 0.4,
          w: "90%",
          h: 1.2,
          fontSize: 44,
          fontFace: "Times New Roman",
          bold: true,
          color: "0F172A",
          valign: "middle"
        });"""

new_title_text = """        pptSlide.addText(slide.title, {
          x: 0.5,
          y: 0.4,
          w: "90%",
          h: 1.2,
          fontSize: 44,
          fontFace: fontName,
          bold: true,
          color: titleColor,
          valign: "middle"
        });"""

content = content.replace(old_title_text, new_title_text)

old_bullets_text = """          pptSlide.addText(
            slide.bullets.map(b => ({ text: b, options: { bullet: true, fontSize: 24, fontFace: "Times New Roman", color: "334155", breakLine: true } })),
            {"""

new_bullets_text = """          pptSlide.addText(
            slide.bullets.map(b => ({ text: b, options: { bullet: true, fontSize: 24, fontFace: fontName, color: contentColor, breakLine: true } })),
            {"""
content = content.replace(old_bullets_text, new_bullets_text)

# 4. Add the dropdown
old_buttons = """                <div className="flex gap-2">
                  <button 
                    onClick={() => setShowPreviewModal(true)}"""

new_buttons = """                <div className="flex gap-2">
                  <select 
                    value={pptTheme}
                    onChange={(e) => setPptTheme(e.target.value as any)}
                    className="bg-white border border-slate-200 rounded-xl px-3 py-2 text-sm font-semibold text-slate-700 outline-none"
                  >
                    <option value="academic">Academic Theme</option>
                    <option value="professional">Professional Theme</option>
                    <option value="minimalist">Minimalist Theme</option>
                  </select>
                  <button 
                    onClick={() => setShowPreviewModal(true)}"""
content = content.replace(old_buttons, new_buttons)

# 5. Fix SlidePreviewModal if rendered. Wait, let me check if showPreviewModal is used to render it.
# Actually, I'll just check if it's rendered, if not I'll inject it.
if '<SlidePreviewModal' not in content:
    # Inject it before the last </div>
    last_div_index = content.rfind('</div>')
    if last_div_index != -1:
        modal_code = """
      {showPreviewModal && (
        <SlidePreviewModal 
          slides={slides} 
          theme={pptTheme}
          onClose={() => setShowPreviewModal(false)} 
        />
      )}
"""
        content = content[:last_div_index] + modal_code + content[last_div_index:]

with open('src/App.tsx', 'w') as f:
    f.write(content)
print("Updated App.tsx")

