export interface Slide {
  id?: string;
  slideNumber?: number;
  title: string;
  subtitle?: string;
  bullets: string[];
  tag?: string;
  keyTakeaway?: string;
  example?: string;
  topic?: string;
  layoutArchetype?: string;
  designExecution?: string;
  diagrams?: { title: string; items: string[] }[];
  slideType?: "cover" | "toc" | "content" | "diagram" | "flowchart" | "table" | "formula" | "summary" | "final" | "intro" | "concept" | "process";
  speakerNotes?: string;
}

export interface DocumentTopic {
  id: string;
  title: string;
  description: string;
  difficulty?: string;
}

