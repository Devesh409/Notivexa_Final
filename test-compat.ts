import { createRequire } from "module";
const customRequire = typeof __filename !== "undefined" ? createRequire(__filename) : createRequire(import.meta.url);
const pdfParse = customRequire("pdf-parse");
console.log(typeof pdfParse);
