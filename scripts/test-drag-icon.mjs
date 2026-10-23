import {chromium} from 'playwright';
import {once} from 'node:events';
import {readFile} from 'node:fs/promises';
import assert from 'node:assert/strict';
process.env.PORT='0';
const {server}=await import('./dev.mjs');
if(!server.listening)await once(server,'listening');
const browser=await chromium.launch();
try{
 const page=await browser.newPage({viewport:{width:1440,height:1000}});
 const resume=JSON.parse(await readFile('data/resume.json','utf8'));
 const layout=JSON.parse(await readFile('data/layout.json','utf8'));
 resume.basics.links=[{label:'Test link',url:'https://example.com'}];
 await page.route('**/api/document',route=>route.fulfill({json:{resume,layout,revision:'test'}}));
 await page.goto('http://127.0.0.1:'+server.address().port);
 const handle=page.getByRole('button',{name:'Drag to reorder Test link; use arrow keys to move',exact:true});
 await handle.waitFor();await page.waitForTimeout(600);
 const shapes=()=>handle.locator('svg').evaluate(svg=>[...svg.querySelectorAll('path,line,polyline')].map(p=>p.outerHTML));
 const before=await shapes();assert.ok(before.length);
 await handle.hover();await page.waitForTimeout(700);assert.deepEqual(await shapes(),before,'Hover changed drag icon');
 const box=await handle.boundingBox();
 await page.mouse.down();await page.waitForTimeout(300);assert.deepEqual(await shapes(),before,'Press changed drag icon');
 await page.mouse.move(box.x+box.width/2,box.y+box.height/2+25,{steps:10});await page.waitForTimeout(500);assert.deepEqual(await shapes(),before,'Dragging changed drag icon');
 await page.mouse.up();await page.waitForTimeout(500);assert.deepEqual(await shapes(),before,'Release changed drag icon');
 console.log('PASS: drag icon stays identical on hover, press, drag, and release.');
}finally{await browser.close();await new Promise(resolve=>server.close(resolve))}
