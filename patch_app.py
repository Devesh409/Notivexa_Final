import re
with open("src/App.tsx", "r") as f:
    text = f.read()

target = """  const processedLines: string[] = [];
  let lastNodeId: string | null = null;

  for (let line of lines) {"""

replacement = """  const processedLines: string[] = [];
  let lastNodeId: string | null = null;
  let insideLegend = false;

  for (let line of lines) {"""

text = text.replace(target, replacement)

target2 = """      if (isFlowchart) {
        // Is it purely a header line like "graph TD" or "subgraph Title" or "end"?"""

replacement2 = """      if (/^subgraph\s+(.*legend.*|.*key.*)\b/i.test(part)) {
        insideLegend = true;
        continue;
      }
      if (insideLegend && /^end\b/i.test(part)) {
        insideLegend = false;
        continue;
      }
      if (insideLegend) continue;
      
      // Also skip standalone nodes that are just a legend box
      if (/^(legend|key)[0-9]*\s*\[/i.test(part) || part.toLowerCase().includes('["legend"]')) {
        continue;
      }

      if (isFlowchart) {
        // Is it purely a header line like "graph TD" or "subgraph Title" or "end"?"""

text = text.replace(target2, replacement2)

with open("src/App.tsx", "w") as f:
    f.write(text)
