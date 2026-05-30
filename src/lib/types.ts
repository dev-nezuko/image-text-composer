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
  history: EditorState[];
  historyIndex: number;
}

export interface GoogleFont {
  family: string;
  variants: string[];
  category: string;
}