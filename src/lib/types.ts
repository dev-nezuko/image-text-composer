export interface TextLayer {
  id: string;
  text: string;
  visible: boolean;
  locked: boolean;
}

export interface EditorState {
  backgroundImage: string | null;
  textLayers: TextLayer[];
  selectedLayerId: string | null;
  canvasWidth: number;
  canvasHeight: number;
  canvasJSON?: Record<string, unknown>;
  exportScale?: number;
  history: EditorSnapshot[];
  historyIndex: number;
}

export interface GoogleFont {
  family: string;
  variants: string[];
  category: string;
}
export type EditorSnapshot = Omit<EditorState, "history" | "historyIndex">;
