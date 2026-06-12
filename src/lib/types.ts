export interface TextLayer {
  id: string;
  text: string;
  visible: boolean;
  locked: boolean;
}
export interface EditorDocument {
  backgroundImage: string | null;
  textLayers: TextLayer[];
  selectedLayerId: string | null;
  canvasWidth: number;
  canvasHeight: number;
}
export interface EditorSnapshot {
  document: EditorDocument;
  canvasJSON: Record<string, unknown>;
}
export interface EditorState extends EditorDocument {
  history: EditorSnapshot[];
  historyIndex: number;
}
export interface GoogleFont {
  family: string;
  variants: string[];
  category: string;
}
