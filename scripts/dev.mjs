import {fileURLToPath} from 'node:url';
import { build } from 'esbuild';
import http from 'node:http';
import { readFile, writeFile, rename, mkdir } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { validate } from './schema.mjs';
const root=new URL('../',import.meta.url);
const routes=new Map([['/',['editor/index.html','text/html']],['/icons.js',['output/icons.js','text/javascript']],['/preview.js',['editor/preview.js','text/javascript']],['/edit.js',['editor/edit.js','text/javascript']],['/resume.css',['templates/resume.css','text/css']],['/api/resume',['data/resume.json','application/json']],['/api/layout',['data/layout.json','application/json']]]);
await build({entryPoints:[fileURLToPath(new URL('../editor/animated-icons.tsx',import.meta.url))],bundle:true,format:'esm',platform:'browser',outfile:fileURLToPath(new URL('../output/icons.js',import.meta.url)),jsx:'automatic',minify:true,define:{'process.env.NODE_ENV':JSON.stringify('production')}});
const port=Number(process.env.PORT||3000);
const revision=(r,l)=>createHash('sha256').update(r).update(l).digest('hex');
async function readDocument(){const [r,l]=await Promise.all(['data/resume.json','data/layout.json'].map(p=>readFile(new URL(p,root),'utf8')));return {resume:JSON.parse(r),layout:JSON.parse(l),revision:revision(r,l)}}
let saving=false;
export const server=http.createServer(async(req,res)=>{
 const send=(code,value)=>{res.writeHead(code,{'Content-Type':'application/json','Cache-Control':'no-store'});res.end(JSON.stringify(value))};
 try{
 const url=new URL(req.url,'http://localhost');
 if(url.pathname==='/api/document'){
 if(req.method==='GET'){send(200,await readDocument());return}
 if(req.method!=='PUT'){send(405,{error:'Method not allowed'});return}
 // Only same-origin JSON requests can write to this loopback server.
 const origin=req.headers.origin;
 if(!origin || !['http://localhost:'+port,'http://127.0.0.1:'+port].includes(origin)||req.headers['content-type']!=='application/json'){send(403,{error:'Save requests must come from this local editor'});return}
 if(saving){send(409,{error:'Another save is in progress. Try again.'});return}
 saving=true;
 try{
 let body='';for await(const chunk of req){body+=chunk;if(Buffer.byteLength(body)>1000000){send(413,{error:'Resume is too large'});return}}
 let doc;try{doc=JSON.parse(body);validate(doc.resume,doc.layout)}catch(e){send(400,{error:e.message});return}
 const before=await readDocument();
 if(doc.revision!==before.revision){send(409,{error:'Files changed since this editor loaded. Reload saved data before saving.'});return}
 await mkdir(new URL('output/backups/',root),{recursive:true});
 await writeFile(new URL('output/backups/before-save.json',root),JSON.stringify(before,null,2)+'\n');
 const r=JSON.stringify(doc.resume,null,2)+'\n',l=JSON.stringify(doc.layout,null,2)+'\n';
 await writeFile(new URL('data/resume.json.tmp',root),r);
 await writeFile(new URL('data/layout.json.tmp',root),l);
 await rename(new URL('data/resume.json.tmp',root),new URL('data/resume.json',root));
 try{await rename(new URL('data/layout.json.tmp',root),new URL('data/layout.json',root))}catch(e){await writeFile(new URL('data/resume.json',root),JSON.stringify(before.resume,null,2)+'\n');throw e}
 send(200,{revision:revision(r,l)});
 }finally{saving=false}return}
 const route=routes.get(url.pathname);
 if(req.method!=='GET'||!route){send(404,{error:'Not found'});return}
 res.writeHead(200,{'Content-Type':route[1]+'; charset=utf-8','Cache-Control':'no-store','X-Content-Type-Options':'nosniff'});
 res.end(await readFile(new URL(route[0],root)));
 }catch(e){console.error(e);if(!res.headersSent)send(500,{error:'Unable to read or save resume files'});else res.end()}
});
server.on('error',e=>{console.error(e.message);process.exitCode=1});
server.listen(port,'127.0.0.1',()=>console.log('Resume editor: http://localhost:'+port+'\nCtrl+C to stop.'));
