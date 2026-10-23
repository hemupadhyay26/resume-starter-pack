import {chromium} from 'playwright';
import {once} from 'node:events';
import {readFile,mkdir} from 'node:fs/promises';
import {spawn} from 'node:child_process';
import {resolve} from 'node:path';
import ffmpeg from 'ffmpeg-static';

process.env.PORT='0';
const {server}=await import('./dev.mjs');
if(!server.listening)await once(server,'listening');
const origin='http://127.0.0.1:'+server.address().port;
const folder=resolve('assets/demo');
await mkdir(folder,{recursive:true});
let resume=JSON.parse(await readFile('data/resume.json','utf8'));
let layout=JSON.parse(await readFile('data/layout.json','utf8'));
let revision='demo';
const browser=await chromium.launch();
const context=await browser.newContext({viewport:{width:1440,height:1000},deviceScaleFactor:1,recordVideo:{dir:resolve('output/recordings'),size:{width:1440,height:1000}}});
// All edits stay in the recording's browser context; never change repository data.
await context.route('**/api/**',async route=>{
 const url=new URL(route.request().url());
 if(url.pathname==='/api/document'){
  if(route.request().method()==='PUT'){const d=route.request().postDataJSON();resume=d.resume;layout=d.layout;revision='demo-saved';await route.fulfill({json:{revision}})}
  else await route.fulfill({json:{resume,layout,revision}});
 }else if(url.pathname==='/api/resume')await route.fulfill({json:resume});
 else if(url.pathname==='/api/layout')await route.fulfill({json:layout});
 else await route.continue();
});
await context.addInitScript(()=>{
 document.addEventListener('DOMContentLoaded',()=>{
 const cursor=document.createElement('div');
 cursor.style.cssText='position:fixed;width:17px;height:17px;border:2px solid #52765c;background:#52765c33;border-radius:50%;pointer-events:none;z-index:999999;left:-30px;top:-30px;transform:translate(-50%,-50%)';
 document.body.append(cursor);
 document.addEventListener('pointermove',e=>{cursor.style.left=e.clientX+'px';cursor.style.top=e.clientY+'px'});
 });
});
const page=await context.newPage();
const video=page.video();
const errors=[];page.on('pageerror',e=>errors.push(e.message));
const hold=ms=>page.waitForTimeout(ms);
async function click(locator){await locator.scrollIntoViewIfNeeded();const box=await locator.boundingBox();await page.mouse.move(box.x+box.width/2,box.y+box.height/2,{steps:16});await hold(300);await locator.click();await hold(700)}
async function type(label,text){const input=page.getByLabel(label,{exact:true});await click(input);await input.fill('');await input.pressSequentially(text,{delay:30});await hold(900)}
async function section(title){await click(page.locator('summary').filter({hasText:new RegExp('^'+title+'$')}))}
try{
 await page.goto(origin);
 await page.getByText('All changes saved locally',{exact:true}).waitFor();
 await hold(1800);
 await page.screenshot({path:resolve(folder,'editor-preview.png')});
 await type('Full name','Alex Morgan');
 await type('Headline','Software Engineer');
 await section('Contact details');
 await section('Summary');
 await type('Professional summary','Software engineer who enjoys building useful web tools and making everyday workflows simpler.');
 await section('Summary');
 await section('Projects');
 await type('Project name','Task Board');
 await hold(700);
 await section('Projects');
 await section('Section order');
 const from=page.getByRole('button',{name:'Drag to reorder skills section; use arrow keys to move',exact:true});
 const to=page.getByRole('button',{name:'Drag to reorder projects section; use arrow keys to move',exact:true});
 await from.scrollIntoViewIfNeeded();
 const a=await from.boundingBox(),b=await to.boundingBox();
 await page.mouse.move(a.x+a.width/2,a.y+a.height/2,{steps:12});
 await page.mouse.down();
 await page.mouse.move(b.x+b.width/2,b.y+4,{steps:30});
 await hold(600);await page.mouse.up();await hold(1500);
 await page.screenshot({path:resolve('output/demo-reorder.png')});
 await section('Section order');
 await section('Page and spacing');
 await page.locator('label').filter({hasText:'Page size'}).locator('select').selectOption('A4');await hold(1300);
 await page.getByLabel('Margins (mm)',{exact:true}).fill('17');await hold(1300);
 await section('Page and spacing');
 await click(page.getByRole('button',{name:'Save changes',exact:true}));
 await page.getByText('Saved to local resume files',{exact:true}).waitFor();
 await hold(1400);
 await click(page.getByRole('button',{name:'Collapse editor',exact:true}));
 await hold(1700);
 await page.screenshot({path:resolve('output/demo-collapsed.png')});
 await click(page.getByRole('button',{name:'Show editor',exact:true}));
 await hold(900);
 const clean=page.getByRole('link',{name:'Open resume only',exact:true});
 // Keep clean view in the same recording instead of making a second video.
 await clean.evaluate(a=>a.removeAttribute('target'));
 await click(clean);
 await page.getByRole('heading',{name:'Alex Morgan',exact:true}).waitFor();
 await hold(1800);
 await page.screenshot({path:resolve('output/demo-clean.png')});
 await page.evaluate(()=>window.scrollTo({top:document.body.scrollHeight,behavior:'smooth'}));
 await hold(1600);
 await page.evaluate(()=>window.scrollTo({top:0,behavior:'smooth'}));await hold(1800);
 if(errors.length)throw Error(errors.join('; '));
}finally{
 await context.close();
 try{await video.saveAs(resolve('output/editor-walkthrough.webm'))}finally{await browser.close();await new Promise(resolve=>server.close(resolve))}
}
await new Promise((ok,fail)=>{
 const proc=spawn(ffmpeg,['-y','-v','error','-i',resolve('output/editor-walkthrough.webm'),'-c:v','libx264','-preset','medium','-crf','24','-pix_fmt','yuv420p','-movflags','+faststart','-an',resolve(folder,'editor-walkthrough.mp4')],{stdio:'inherit'});
 proc.on('error',fail);proc.on('exit',code=>code===0?ok():fail(Error('Video encode failed: '+code)));
});
console.log('Recorded assets/demo/editor-walkthrough.mp4');

await new Promise((ok,fail)=>{
 const proc=spawn(ffmpeg,['-y','-v','error','-i',resolve(folder,'editor-walkthrough.mp4'),'-filter_complex','fps=6,scale=960:-1:flags=lanczos,split[s0][s1];[s0]palettegen=max_colors=96:stats_mode=diff[p];[s1][p]paletteuse=dither=bayer:bayer_scale=4:diff_mode=rectangle','-loop','0',resolve(folder,'editor-walkthrough.gif')],{stdio:'inherit'});
 proc.on('error',fail);proc.on('exit',code=>code===0?ok():fail(Error('GIF encode failed: '+code)));
});
console.log('Created animated README preview.');
