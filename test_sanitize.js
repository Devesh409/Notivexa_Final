function sanitizeNodeSegment(segment) {
  let trimmed = segment.trim();
  if (!trimmed) return "";
  
  let edgePrefix = "";
  const edgeMatch = trimmed.match(/^(\|[^\|]+\|)\s*(.*)$/);
  if (edgeMatch) {
    edgePrefix = edgeMatch[1] + " ";
    trimmed = edgeMatch[2].trim();
  }

  // Check if segment is a bracketed node declaration like A["Label"] or A[Label] or A("Label")
  const bracketMatch = trimmed.match(/^([A-Za-z0-9_\-]+)\s*(\(\[\"|\(\(\"|\[\[\"|\[\(\"|\{\{\"|\[\"|\(\"|\{\"|\>\"|\(\[|\(\(|\[\[|\[\(|\{\{|\[|\(|\{|\>)(.*?)([\"'\s]*[\)\]\}]+)$/);
  if (bracketMatch) {
    const nodeId = bracketMatch[1];
    const openBracket = bracketMatch[2];
    let content = bracketMatch[3].trim();
    // Clean inner content
    if ((content.startsWith('"') && content.endsWith('"')) || (content.startsWith("'") && content.endsWith("'"))) {
      content = content.slice(1, -1).trim();
    }
    content = content.replace(/"/g, "'").replace(/\\/g, "").replace(/\|\|/g, " or ").replace(/\|/g, "/");
    let openChar = "[";
    let closeChar = "]";
    if (openBracket.includes('(') && openBracket.includes('[')) { openChar = "( ["; closeChar = "] )"; }
    else if (openBracket.includes('(') && openBracket.length > 1) { openChar = "( ("; closeChar = ") )"; }
    else if (openBracket.includes('[')) {
      if (openBracket.includes('(')) { openChar = "[ ("; closeChar = ") ]"; }
      else if (openBracket.length > 1) { openChar = "[ ["; closeChar = "] ]"; }
      else { openChar = "["; closeChar = "]"; }
    } else if (openBracket.includes('{')) {
      if (openBracket.length > 1) { openChar = "{ {"; closeChar = "} }"; }
      else { openChar = "{"; closeChar = "}"; }
    } else if (openBracket.includes('(')) { openChar = "("; closeChar = ")"; }
    else if (openBracket.includes('>')) { openChar = ">"; closeChar = "]"; }
    const cleanOpen = openChar.replace(/\s+/g, "");
    const cleanClose = closeChar.replace(/\s+/g, "");
    return `${edgePrefix}${nodeId}${cleanOpen}"${content}"${cleanClose}`;
  }

  // Check if segment is unbracketed Node ID + label text
  const unbracketedMatch = trimmed.match(/^([A-Za-z0-9_\-]+)\s+(.+)$/);
  if (unbracketedMatch) {
    const nodeId = unbracketedMatch[1];
    let label = unbracketedMatch[2].trim();
    if (/^(graph|flowchart|subgraph|style|classDef|click|linkStyle|end|sequenceDiagram|classDiagram|stateDiagram|erDiagram|gantt|pie|gitGraph|journey|quadrantChart|xychart|requirement|C4|mindmap|timeline|block|packet|architecture|kanban|sankey)$/i.test(nodeId)) {
      return `${edgePrefix}${nodeId} ${label}`;
    }
    if ((label.startsWith('"') && label.endsWith('"')) || (label.startsWith("'") && label.endsWith("'"))) {
      label = label.slice(1, -1).trim();
    }
    label = label.replace(/"/g, "'").replace(/\\/g, "").replace(/\|\|/g, " or ").replace(/\|/g, "/");
    if (label) {
      return `${edgePrefix}${nodeId}["${label}"]`;
    }
    return `${edgePrefix}${nodeId}`;
  }

  return `${edgePrefix}${trimmed.replace(/["']/g, "")}`;
}

console.log(sanitizeNodeSegment('|Server Shutdown| Destroy["destroy() Method Called"]'));
