import test from 'node:test';
import assert from 'node:assert/strict';
import { appendSnapshot } from '../src/lib/editor-history';
import type { EditorSnapshot } from '../src/lib/types';
function snapshot(text: string): EditorSnapshot { return {document:{backgroundImage:null,textLayers:[{id:'synthetic',text,visible:true,locked:false}],selectedLayerId:null,canvasWidth:800,canvasHeight:600},canvasJSON:{objects:[{type:'IText',text}]}}; }
test('history entries contain document snapshots without recursively nesting history',()=>{
 let state={history:[] as EditorSnapshot[],historyIndex:-1};
 for(let i=0;i<30;i++)state=appendSnapshot(state.history,state.historyIndex,snapshot(String(i)));
 assert.equal(state.history.length,20);assert.equal(state.historyIndex,19);
 assert.equal(state.history[0].document.textLayers[0].text,'10');
 assert.ok(state.history.every(item=>!('history' in item.document)));
 assert.ok(JSON.stringify(state.history).length<10000);
});
test('a new edit after undo discards the old redo branch',()=>{
 const first=snapshot('first'), second=snapshot('second'), replacement=snapshot('replacement');
 const result=appendSnapshot([first,second],0,replacement);
 assert.deepEqual(result.history,[first,replacement]);assert.equal(result.historyIndex,1);
});
test('snapshot helper does not mutate previous history',()=>{
 const original=[snapshot('first')];const result=appendSnapshot(original,0,snapshot('second'));
 assert.equal(original.length,1);assert.equal(result.history.length,2);
});
test('invalid snapshot limits are rejected',()=>assert.throws(()=>appendSnapshot([],-1,snapshot('sample'),0)));
