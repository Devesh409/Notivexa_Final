import fs from 'fs';
let code = fs.readFileSync('src/App.tsx', 'utf8');

// 1. Remove state variable
code = code.replace(/const \[summaryLength, setSummaryLength\] = useState\("detailed"\);\n/g, "");

// 2. Remove from JSON.stringify payload in generateNotes
code = code.replace(/body: JSON\.stringify\(\{ fileUri: fileData\.fileUri, mimeType: fileData\.mimeType, focusArea: focusArea, mode: mode, summaryLength \}\),/g, "body: JSON.stringify({ fileUri: fileData.fileUri, mimeType: fileData.mimeType, focusArea: focusArea, mode: mode }),");

// 3. Remove dropdown for student mode
code = code.replace(/<div className="space-y-1 mb-2">\s*<label className={`text-\[10px\] uppercase tracking-wider font-semibold block \${isDarkMode \? "text-\[#A1A194\]" : "text-\[#8A8A7A\]"}`}>\s*Summary Detail Level\s*<\/label>\s*<select\s*value=\{summaryLength\}\s*onChange=\{\(e\) => setSummaryLength\(e\.target\.value\)\}\s*className=\{`w-full border rounded-lg py-2 px-3 text-xs font-semibold outline-none \${isDarkMode \? "bg-\[#22221F\] border-\[#383832\] text-\[#E0E0D5\]" : "bg-white border-\[#C1C1B0\] text-\[#3A3A2F\]"}`\}\s*>\s*<option value="detailed">Detailed \(Standard\)<\/option>\s*<option value="comprehensive">Comprehensive \(All Concepts\)<\/option>\s*<option value="exhaustive_50_pages">Minimum 50\+ Pages Exhaustive \(Full E-Book\)<\/option>\s*<\/select>\s*<\/div>/g, "");

fs.writeFileSync('src/App.tsx', code);
console.log("Replaced successfully in App.tsx");
