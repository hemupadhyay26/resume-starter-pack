import { mkdir, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { once } from 'node:events';
import { chromium } from 'playwright';
import { PDFDocument } from 'pdf-lib';

const version=(process.argv[2]||'').replace(/^v/,'');
if(!/^\d+\.\d+(?:\.\d+)?(?:-[A-Za-z0-9]+(?:[.-][A-Za-z0-9]+)*)?$/.test(version)){
 console.error('Usage: npm run build:pdf -- 1.0 (or v1.0)');
 process.exit(1);
}
process.env.PORT='0';
const {server}=await import('./dev.mjs');
let browser;
try{
 if(!server.listening)await once(server,'listening');
 browser=await chromium.launch();
 const page=await browser.newPage({viewport:{width:1200,height:1400}});
 const errors=[];page.on('pageerror',error=>errors.push(error.message));
 await page.goto('http://127.0.0.1:'+server.address().port+'/?view=resume');
 await page.waitForFunction(()=>document.querySelector('#content h1')&&document.querySelector('#status').textContent.startsWith('Fits'));
 await page.evaluate(()=>document.fonts.ready);
 await page.emulateMedia({media:'print'});
 const fits=await page.evaluate(()=>{
  const page=document.querySelector('#page'),content=document.querySelector('#content'),style=getComputedStyle(page);
  return content.getBoundingClientRect().bottom<=page.getBoundingClientRect().bottom-parseFloat(style.paddingBottom)+1&&content.scrollWidth<=content.clientWidth+1;
 });
 if(!fits||errors.length)throw Error('Resume overflow or rendering error. Adjust content/spacing before releasing. '+errors.join('; '));
 const bytes=await page.pdf({preferCSSPageSize:true,printBackground:true,displayHeaderFooter:false,margin:{top:0,bottom:0,left:0,right:0}});
 const pdf=await PDFDocument.load(bytes);
 if(pdf.getPageCount()!==1)throw Error('Expected one PDF page; got '+pdf.getPageCount());
 const output=resolve('output','resume-'+version+'.pdf');
 await mkdir('output',{recursive:true});
 await writeFile(output,bytes);
 await page.screenshot({path:resolve('output','resume-'+version+'.png'),fullPage:true});
 console.log('Built '+output+' (1 page)');
}finally{
 if(browser)await browser.close();
 await new Promise(resolve=>server.close(resolve));
}
