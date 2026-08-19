import mermaid from 'mermaid';
async function test() {
  mermaid.initialize({ startOnLoad: false, suppressErrorRendering: true });
  try {
    const { svg } = await mermaid.render('test-id', 'invalid mermaid code');
    console.log("Resolved with SVG length:", svg.length);
  } catch (e) {
    console.error("Rejected:", e.message);
  }
}
test();
