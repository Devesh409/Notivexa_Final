const fs = require('fs');
const content = fs.readFileSync('src/App.tsx', 'utf8');

const insertPoint = '  const downloadHandwrittenPDF = async () => {';

const newMethods = `  const downloadMarkdown = () => {
    if (!resultText) return;
    const blob = new Blob([resultText], { type: "text/markdown;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = \`\${file ? file.name.replace(/\\.[^/.]+$/, "") : "EduSmart"}_Notes.md\`;
    a.click();
    URL.revokeObjectURL(url);
    setShowExportMenu(false);
  };

  const downloadDoc = () => {
    if (!notesRef.current) return;
    const htmlContent = notesRef.current.innerHTML;
    const header = \`<html xmlns:o='urn:schemas-microsoft-com:office:office' xmlns:w='urn:schemas-microsoft-com:office:word' xmlns='http://www.w3.org/TR/REC-html40'>
    <head>
      <meta charset='utf-8'>
      <title>Export HTML to Word Document</title>
      <style>
        body { font-family: 'Arial', sans-serif; }
        h1, h2, h3, h4, h5, h6 { color: #2d2d2a; }
        p, li { color: #3a3a2f; }
        svg { display: none; }
      </style>
    </head><body>\`;
    const footer = "</body></html>";
    const sourceHTML = header + htmlContent + footer;
    
    const blob = new Blob(['\\ufeff', sourceHTML], {
        type: 'application/msword'
    });
    const url = URL.createObjectURL(blob);
    const fileDownload = document.createElement("a");
    document.body.appendChild(fileDownload);
    fileDownload.href = url;
    fileDownload.download = \`\${file ? file.name.replace(/\\.[^/.]+$/, "") : "EduSmart"}_Notes.doc\`;
    fileDownload.click();
    document.body.removeChild(fileDownload);
    URL.revokeObjectURL(url);
    setShowExportMenu(false);
  };

`;

const newContent = content.replace(insertPoint, newMethods + insertPoint);
fs.writeFileSync('src/App.tsx', newContent);
console.log("Patched!");
