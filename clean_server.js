import fs from 'fs';
let content = fs.readFileSync('server.ts', 'utf8');

// Find the start and end of the endpoint
const startStr = "// 4. Generate PPT Outline & Python Script";
const endStr = "// Detect Diagrams from PDF / Document Endpoint";

const startIndex = content.indexOf(startStr);
const endIndex = content.indexOf(endStr);

if (startIndex !== -1 && endIndex !== -1) {
    content = content.substring(0, startIndex) + content.substring(endIndex);
    fs.writeFileSync('server.ts', content);
    console.log("Removed PPT endpoint from server.ts");
} else {
    console.log("Could not find the endpoint strings.");
}
