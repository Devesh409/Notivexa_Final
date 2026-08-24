import sys

with open("src/components/UniversityPaperEditor.tsx", "r") as f:
    content = f.read()

content = content.replace("import html2canvas from 'html2canvas';", "import * as htmlToImage from 'html-to-image';")

old_pdf = """  const downloadPDF = async () => {
    if (!paperRef.current) return;
    try {
      const canvas = await html2canvas(paperRef.current, { scale: 2 });
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4',
      });
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = (canvas.height * pdfWidth) / canvas.width;
      pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
      pdf.save(`${data.subject}_QuestionPaper.pdf`);
    } catch (err) {
      console.error('Failed to generate PDF', err);
    }
  };"""

new_pdf = """  const downloadPDF = async () => {
    if (!paperRef.current) return;
    try {
      // Temporarily hide the UI buttons that shouldn't be printed
      const buttons = paperRef.current.querySelectorAll('.no-print');
      buttons.forEach(btn => (btn as HTMLElement).style.display = 'none');
      
      const imgData = await htmlToImage.toPng(paperRef.current, { pixelRatio: 2 });
      
      // Restore the buttons
      buttons.forEach(btn => (btn as HTMLElement).style.display = '');

      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4',
      });
      const pdfWidth = pdf.internal.pageSize.getWidth();
      
      // Get actual dimensions to calculate height correctly
      const img = new Image();
      img.src = imgData;
      await new Promise((resolve) => {
        img.onload = resolve;
      });
      
      const pdfHeight = (img.height * pdfWidth) / img.width;
      pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
      pdf.save(`${data.subject}_QuestionPaper.pdf`);
    } catch (err) {
      console.error('Failed to generate PDF', err);
    }
  };"""

content = content.replace(old_pdf, new_pdf)

with open("src/components/UniversityPaperEditor.tsx", "w") as f:
    f.write(content)

print("Patched UniversityPaperEditor.tsx")
