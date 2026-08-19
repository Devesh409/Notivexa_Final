import sys

with open('src/App.tsx', 'r') as f:
    lines = f.readlines()

new_func = """
  const downloadPPT = async () => {
    try {
      const pptxgen = (await import('pptxgenjs')).default;
      const pres = new pptxgen();
      
      slides.forEach((slide) => {
        const pptSlide = pres.addSlide();
        
        // Title
        pptSlide.addText(slide.title, {
          x: 0.5,
          y: 0.5,
          w: "90%",
          h: 1,
          fontSize: 32,
          bold: true,
          color: "363636",
        });

        // Content
        if (slide.bullets && slide.bullets.length > 0) {
          pptSlide.addText(
            slide.bullets.map(b => ({ text: b, options: { bullet: true } })),
            {
              x: 0.5,
              y: 1.8,
              w: "90%",
              h: 3.5,
              fontSize: 18,
              color: "666666",
              valign: "top",
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

for i, line in enumerate(lines):
    if line.strip().startswith('const generatePPT = async () => {'):
        lines.insert(i, new_func)
        break

with open('src/App.tsx', 'w') as f:
    f.writelines(lines)
