import fs from 'fs';

let content = fs.readFileSync('src/App.tsx', 'utf8');

// Remove ppt state variables
content = content.replace(/  const \[pptScope, setPptScope\].*?\n/g, '');
content = content.replace(/  const \[pptScopeValue, setPptScopeValue\].*?\n/g, '');
content = content.replace(/  const \[pptSlideCount, setPptSlideCount\].*?\n/g, '');
content = content.replace(/  const \[pptDetailLevel, setPptDetailLevel\].*?\n/g, '');
content = content.replace(/  const \[pptLanguage, setPptLanguage\].*?\n/g, '');
content = content.replace(/  const \[pptTheme, setPptTheme\].*?\n/g, '');
content = content.replace(/  const \[pptFont, setPptFont\].*?\n/g, '');
content = content.replace(/  const \[pptProjectName, setPptProjectName\].*?\n/g, '');
content = content.replace(/  const \[pptBookName, setPptBookName\].*?\n/g, '');
content = content.replace(/  const \[pptSubject, setPptSubject\].*?\n/g, '');
content = content.replace(/  const \[pptDepartment, setPptDepartment\].*?\n/g, '');
content = content.replace(/  const \[pptSemester, setPptSemester\].*?\n/g, '');
content = content.replace(/  const \[pptInstitution, setPptInstitution\].*?\n/g, '');
content = content.replace(/  const \[pptStudentName, setPptStudentName\].*?\n/g, '');
content = content.replace(/  const \[pptFacultyName, setPptFacultyName\].*?\n/g, '');

// Remove "ppt" from setGeneratingType
content = content.replace(/"ppt" \| /g, '');

// Remove slides state
content = content.replace(/  const \[slides, setSlides\] = useState<Slide\[\]>\(\[\]\);\n/g, '');
content = content.replace(/setSlides\(\[\]\);\n?/g, '');
content = content.replace(/setSlides\(.+?\);\n?/g, '');

// Remove import pptxgen
content = content.replace(/import pptxgen from "pptxgenjs";\n/g, '');

// Remove Slide components imports
content = content.replace(/import { Slide } from "\.\/types";\n/g, '');
content = content.replace(/import { SlideViewer } from "\.\/components\/SlideViewer";\n/g, '');
content = content.replace(/import { SlidePreviewModal } from "\.\/components\/SlidePreviewModal";\n/g, '');

// Remove the parseSlides function
content = content.replace(/  const parseSlides = \(text: string\): Slide\[\] => \{[\s\S]*?return parsedSlides;\n  \};\n/g, '');

// Remove the generatePPT function
content = content.replace(/  const generatePPT = async \([\s\S]*?setGeneratingType\(""\);\n    \}\n  \};\n/g, '');

// Remove the downloadPPT function
content = content.replace(/  const downloadPPT = \(\) => \{[\s\S]*?pres\.writeFile\(\{ fileName.*?\n  \};\n/g, '');

// Remove the downloadPythonScript function
content = content.replace(/  const downloadPythonScript = \(\) => \{[\s\S]*?URL\.revokeObjectURL\(url\);\n  \};\n/g, '');

// Remove UI cards for PPT
// The first Presentation PPT Generator Card
content = content.replace(/\s*\{\/\* Presentation PPT Generator Card \*\/\}\s*<div className=\{\`p-4 rounded-2xl space-y-3\.5 shadow-sm mt-3 border transition-colors[\s\S]*?<\/button>\s*<\/div>\s*<\/div>/g, '');

// The Presentation PPT Slide Deck View
content = content.replace(/\s*\{\/\* Presentation PPT Slide Deck View \*\/\}\s*\{resultText && resultType === "ppt" &&[\s\S]*?<\/SlidePreviewModal>\s*<\/>\s*\}/g, '');
content = content.replace(/\s*\{\/\* Presentation PPT Slide Deck View \*\/\}\s*\{resultText && resultType === "ppt"[\s\S]*?<\/>\s*\}/g, ''); // Alternative match

// Wait, the ppt generation block might be tricky to regex completely correctly. Let's write the file and then check for leftovers.
fs.writeFileSync('src/App.tsx', content);
console.log("Initial regex removals completed.");
