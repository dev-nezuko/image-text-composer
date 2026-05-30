export interface TextLayer {
  id: string;
  text: string;
  visible: boolean;
  locked: boolean;
}

export interface TextStyle {
  text: string;
  fontFamily: string;
  fontSize: number;
  fontWeight: string | number;
  fill: string;
  opacity: number;
  textAlign: string;
}

/** A partial style change from the properties panel, plus a 15-degree rotation step. */
export type TextStyleUpdate = Partial<TextStyle> & { rotation?: 'left' | 'right' };

export interface SelectedText extends TextStyle {
  id: string;
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

export type EditorSnapshot = Omit<EditorState, 'history' | 'historyIndex'>;
