import type { EditorSnapshot } from '@/lib/types';

export interface HistoryCursor {
  history: EditorSnapshot[];
  historyIndex: number;
}

/**
 * Appends a snapshot after the current position. A new edit after an undo
 * discards the redo branch, and only the newest `limit` snapshots are kept
 * because each one holds the serialized canvas, background image included.
 * Returns null when the canvas has not changed since the current snapshot.
 */
export function pushSnapshot(
  { history, historyIndex }: HistoryCursor,
  snapshot: EditorSnapshot,
  limit: number,
): HistoryCursor | null {
  if (JSON.stringify(history[historyIndex]?.canvasJSON) === JSON.stringify(snapshot.canvasJSON)) return null;
  const next = [...history.slice(0, historyIndex + 1), snapshot].slice(-limit);
  return { history: next, historyIndex: next.length - 1 };
}
