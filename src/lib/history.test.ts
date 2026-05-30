import { describe, expect, it } from 'vitest';
import { pushSnapshot } from '@/lib/history';
import type { EditorSnapshot } from '@/lib/types';

const snap = (label: string): EditorSnapshot => ({
  backgroundImage: null,
  textLayers: [],
  selectedLayerId: null,
  canvasWidth: 800,
  canvasHeight: 600,
  canvasJSON: { label },
});

describe('pushSnapshot', () => {
  it('appends after the current position and moves the cursor to it', () => {
    const result = pushSnapshot({ history: [snap('a')], historyIndex: 0 }, snap('b'), 20);
    expect(result?.history.map(s => s.canvasJSON?.label)).toEqual(['a', 'b']);
    expect(result?.historyIndex).toBe(1);
  });

  it('ignores a snapshot identical to the current one', () => {
    expect(pushSnapshot({ history: [snap('a')], historyIndex: 0 }, snap('a'), 20)).toBeNull();
  });

  it('discards the redo branch when editing after an undo', () => {
    const history = [snap('a'), snap('b'), snap('c')];
    const result = pushSnapshot({ history, historyIndex: 0 }, snap('d'), 20);
    expect(result?.history.map(s => s.canvasJSON?.label)).toEqual(['a', 'd']);
    expect(result?.historyIndex).toBe(1);
  });

  it('keeps only the newest snapshots once the limit is reached', () => {
    const history = ['a', 'b', 'c'].map(snap);
    const result = pushSnapshot({ history, historyIndex: 2 }, snap('d'), 3);
    expect(result?.history.map(s => s.canvasJSON?.label)).toEqual(['b', 'c', 'd']);
    expect(result?.historyIndex).toBe(2);
  });

  it('starts a history from empty', () => {
    expect(pushSnapshot({ history: [], historyIndex: -1 }, snap('a'), 20)).toEqual({
      history: [snap('a')],
      historyIndex: 0,
    });
  });
});
