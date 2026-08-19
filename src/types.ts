export interface Slide {
  id?: string;
  title: string;
  bullets: string[];
  layoutArchetype?: string;
  designExecution?: string;
  diagrams?: { title: string; items: string[] }[];
  slideType?: "cover" | "toc" | "content" | "diagram" | "flowchart" | "table" | "formula" | "summary" | "final";
  speakerNotes?: string;
}
