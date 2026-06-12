import type { EditorSnapshot } from './types';
/** Keep snapshots flat and discard the redo branch when an edit follows undo. */
export function appendSnapshot(history: EditorSnapshot[], index: number, snapshot: EditorSnapshot, limit = 20) {
  if (!Number.isInteger(limit) || limit < 1) throw new Error('A positive snapshot limit is required');
  const next = [...history.slice(0, index + 1), snapshot].slice(-limit);
  return { history: next, historyIndex: next.length - 1 };
}
