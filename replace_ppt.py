import sys

with open('src/App.tsx', 'r') as f:
    lines = f.readlines()

new_func = """
  const downloadPPT = async () => {
    try {
      const pptxgen = (await import('pptxgenjs')).default;
      const pres = new pptxgen();

      // Define a nice master slide layout
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
      });

      slides.forEach((slide) => {
        const pptSlide = pres.addSlide({ masterName: "MASTER_SLIDE" });
        
        // Title
        pptSlide.addText(slide.title, {
          x: 0.5,
          y: 0.4,
          w: "90%",
          h: 1.2,
          fontSize: 44,
          fontFace: "Times New Roman",
          bold: true,
          color: "0F172A",
          valign: "middle"
        });

        // Content
        if (slide.bullets && slide.bullets.length > 0) {
          pptSlide.addText(
            slide.bullets.map(b => ({ text: b, options: { bullet: true, fontSize: 24, fontFace: "Times New Roman", color: "334155", breakLine: true } })),
            {
              x: 0.5,
              y: 1.8,
              w: "90%",
              h: 3.5,
              valign: "top",
              lineSpacing: 32,
              margin: [0, 0, 0, 0]
            }
          );
        }

        // Speaker notes
        if (slide.speakerNotes) {
          pptSlide.addNotes(slide.speakerNotes);
        }
      });
      
      pres.writeFile({ fileName: `EduSmartAI_Presentation.pptx` });
    } catch (error) {
      console.error("Error creating PPTX", error);
      alert("Failed to create PPTX file.");
    }
  };
"""

start_idx = -1
end_idx = -1
for i, line in enumerate(lines):
    if line.strip().startswith('const downloadPPT = async () => {'):
        start_idx = i
    if start_idx != -1 and line.strip() == 'alert("Failed to create PPTX file.");':
        end_idx = i + 2 # include } and };
        break

if start_idx != -1 and end_idx != -1:
    lines = lines[:start_idx] + [new_func] + lines[end_idx:]

with open('src/App.tsx', 'w') as f:
    f.writelines(lines)
