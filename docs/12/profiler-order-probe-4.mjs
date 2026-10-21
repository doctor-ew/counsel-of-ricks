// Mechanism probe only; no application behavior or feature acceptance is asserted.
import { createRequire } from 'node:module';
import path from 'node:path';
import fs from 'node:fs';
const require=createRequire('/Users/drew.schillinger/shuttlebay/doctorews-laboratory/nightshift-community/.nightshift/counsel-live-demo/frontend/package.json');
const {JSDOM}=require('jsdom');
const dom=new JSDOM('<!doctype html><div id="root"></div>',{url:'http://localhost/'});
globalThis.window=dom.window;globalThis.document=dom.window.document;
globalThis.IS_REACT_ACT_ENVIRONMENT=true;
const React=require('react');const {createRoot}=require('react-dom/client');
const observed=[];let choose;const node=document.getElementById('root');
function Example({session}){const [selected,setSelected]=React.useState('All');choose=setSelected;React.useEffect(()=>{setSelected('All')},[session]);return React.createElement('div',null,session+':'+selected)}
const root=createRoot(node);
const render=session=>React.createElement(React.Profiler,{id:'probe',onRender(){observed.push(node.textContent)}},React.createElement(Example,{session}));
await React.act(async()=>root.render(render('A')));
await React.act(async()=>choose('Unsupported'));
observed.length=0;
await React.act(async()=>root.render(render('B')));
const result={react:require('react/package.json').version,commits:[...observed],afterAct:node.textContent,scope:'React mechanism probe, not application acceptance'};
if(observed[0]!=='B:Unsupported'||node.textContent!=='B:All')throw Error(JSON.stringify(result));
fs.writeFileSync('docs/12/profiler-order-evidence-4.json',JSON.stringify(result,null,2)+'\n');
console.log(JSON.stringify(result));await React.act(async()=>root.unmount());dom.window.close();
