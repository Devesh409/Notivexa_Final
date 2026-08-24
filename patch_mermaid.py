import re

with open("src/App.tsx", "r") as f:
    content = f.read()

# 1. Replace all the helper functions with a simple preprocessMermaid
# Find the start: function splitMergedMermaidLine
start_idx = content.find("function splitMergedMermaidLine")
# Find the end: right before function MermaidChart
end_idx = content.find("function MermaidChart({ chart")

if start_idx != -1 and end_idx != -1:
    new_helpers = """function preprocessMermaid(chartCode: string): string {
  if (!chartCode) return "";
  let code = chartCode.replace(/\\\\n/g, "\\n").trim();
  code = code.replace(/^```mermaid\\s*/i, "").replace(/```\\s*$/, "").trim();
  code = code.replace(/(-->|---|==>|-\\-\\>|->>|-->>|->)\\s*"([A-Za-z0-9_\\-]+)"(?!\\s*[\\[\\(\\{])/g, '$1 $2');
  return code;
}

"""
    content = content[:start_idx] + new_helpers + content[end_idx:]

# 2. Modify MermaidChart to remove extractNodes, parsedNodes, and simplify fallback
mermaid_chart_match = re.search(r"(function MermaidChart.*?\n  const ref = useRef<HTMLDivElement>\(null\);\n  const \[hasError, setHasError\] = useState\(false\);)\n  const \[parsedNodes, setParsedNodes\] = useState<\{ id: string; label: string \}\[\]>\(\[\]\);\n  const preprocessedChart = preprocessMermaid\(chart\);\n\n  useEffect\(\(\) => \{\n    setHasError\(false\);\n    setParsedNodes\(extractNodes\(chart\)\);", content, re.DOTALL)

if mermaid_chart_match:
    new_mermaid_start = mermaid_chart_match.group(1) + """
  const preprocessedChart = preprocessMermaid(chart);

  useEffect(() => {
    setHasError(false);"""
    content = content.replace(mermaid_chart_match.group(0), new_mermaid_start)

# 3. Modify Level 2 fallback which uses sanitizeFlowchartLine
level2_match = re.search(r"// Level 2: Rebuild simplified graph TD with plain text labels.*?const level2Id = `mermaid-\$\{Math\.random\(\)\.toString\(36\)\.substring\(7\)\}`;", content, re.DOTALL)

if level2_match:
    new_level2 = """// Level 2 skipped because we removed aggressive sanitizers.
          setHasError(true);
          const level2Id = `mermaid-${Math.random().toString(36).substring(7)}`; // Dummy"""
    content = content.replace(level2_match.group(0), new_level2)

with open("src/App.tsx", "w") as f:
    f.write(content)
print("Mermaid patched successfully!")
