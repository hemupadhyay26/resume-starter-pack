import {mountIcon,releaseDetachedIcons} from '/icons.js';
const panel=document.querySelector('#editor-panel'),save=document.querySelector('#save'),message=document.querySelector('#save-status'),reload=document.querySelector('#reload');
let resume,layout,revision,dirty=false,saving=false;
const node=(tag,text)=>{const n=document.createElement(tag);if(text)n.textContent=text;return n};
function update(){dirty=true;message.textContent='Unsaved changes';save.disabled=saving;window.dispatchEvent(new CustomEvent('resume-draft',{detail:{resume,layout}}))}
function field(parent,label,value,onchange,options={}){
 const wrap=node('label',label),input=node(options.multiline?'textarea':options.choices?'select':'input');
 if(options.choices)for(const choice of options.choices){const o=node('option',choice);o.value=choice;input.append(o)}
 if(options.number){input.type='number';input.min=options.min;input.max=options.max;input.step=options.step||'.1'}
 input.value=value??'';if(options.multiline)input.rows=options.rows||3;
 input.addEventListener('input',()=>{onchange(options.number?Number(input.value):input.value);update()});wrap.append(input);parent.append(wrap);
}

function iconControl(control,name,label){mountIcon(control,name);control.classList.add('icon-button');control.title=label;control.setAttribute('aria-label',label)}
for(const [selector,name,label]of [['#save','save','Save changes'],['#print','print','Print / Save PDF'],['.view-button','view','Open resume only'],['#reload','reload','Reload saved data']])iconControl(document.querySelector(selector),name,label);
const dragAnnouncement=document.createElement('span');dragAnnouncement.className='sr-only';dragAnnouncement.setAttribute('aria-live','polite');document.body.append(dragAnnouncement);
function reorderHandle(row,parent,items,index,label){
 row.dataset.sortIndex=index;
 const handle=node('button');handle.type='button';iconControl(handle,'grip','Drag to reorder '+label+'; use arrow keys to move');handle.classList.add('drag-handle');row.classList.add('sortable-row');parent.append(row);row.prepend(handle);
 let target=index,active=false,startY=0,frame;
 const rows=()=>[...parent.children].filter(n=>n.classList.contains('sortable-row'));
 const clear=()=>{cancelAnimationFrame(frame);document.body.classList.remove('sorting');for(const n of rows())n.classList.remove('drop-before','drop-after','drag-source');handle.setAttribute('aria-pressed','false')};
 const commit=to=>{if(to===index)return;const [entry]=items.splice(index,1);items.splice(to,0,entry);update();build();dragAnnouncement.textContent=label+' moved to position '+(to+1);const next=panel.querySelectorAll('button.drag-handle');const match=[...next].find(h=>h.getAttribute('aria-label')===handle.getAttribute('aria-label'));match?.focus()};
 handle.addEventListener('pointerdown',e=>{if(e.button!==0)return;handle.setPointerCapture(e.pointerId);startY=e.clientY;target=index;active=false;e.preventDefault()});
 let pointerY=0;
 function autoScroll(){const box=document.querySelector('.edit-sidebar'),rect=box.getBoundingClientRect();if(pointerY<rect.top+48)box.scrollTop-=12;else if(pointerY>rect.bottom-48)box.scrollTop+=12;frame=requestAnimationFrame(autoScroll)}
 handle.addEventListener('pointermove',e=>{
 if(!handle.hasPointerCapture(e.pointerId))return;
 pointerY=e.clientY;
 if(!active&&Math.abs(pointerY-startY)<4)return;
 if(!active){active=true;document.body.classList.add('sorting');row.classList.add('drag-source');handle.setAttribute('aria-pressed','true');frame=requestAnimationFrame(autoScroll)}
 const candidates=rows();let destination=items.length;
 for(const candidate of candidates){const r=candidate.getBoundingClientRect();if(pointerY<r.top+r.height/2){destination=Number(candidate.dataset.sortIndex);break}}
 target=destination>index?destination-1:destination;
 for(const candidate of candidates)candidate.classList.remove('drop-before','drop-after');
 if(target!==index)candidates[target].classList.add(target<index?'drop-before':'drop-after');
 });
 handle.addEventListener('pointerup',e=>{if(!handle.hasPointerCapture(e.pointerId))return;const to=target,wasActive=active;handle.releasePointerCapture(e.pointerId);clear();if(wasActive)commit(to);active=false});
 handle.addEventListener('pointercancel',()=>{clear();active=false});
 handle.addEventListener('lostpointercapture',()=>{clear();active=false});
 handle.addEventListener('keydown',e=>{if(e.key==='ArrowUp'||e.key==='ArrowDown'){e.preventDefault();commit(Math.max(0,Math.min(items.length-1,index+(e.key==='ArrowUp'?-1:1))))}else if(e.key==='Escape'){clear();active=false}});
 return handle;
}
function action(parent,label,callback,disabled=false){const b=node('button',label);b.type='button';b.disabled=disabled;b.addEventListener('click',callback);iconControl(b,label==='Remove'?'remove':'add',label);parent.append(b)}
function group(title){const d=node('details');const s=node('summary',title);d.append(s);panel.append(d);return d}
function list(parent,items,fields,blank){
 items.forEach((item,index)=>{
 const card=node('div');card.className='edit-entry';
 const controls=node('div');controls.className='entry-controls';
 controls.append(node('strong',item.name||item.title||item.institution||item.label||'Entry '+(index+1)));reorderHandle(card,parent,items,index,item.name||item.title||item.institution||item.label||'entry '+(index+1));
 action(controls,'Remove',()=>{if(confirm('Remove this entry?')){items.splice(index,1);update();build()}});
 card.append(controls);
 for(const [key,label,kind] of fields)field(card,label,kind==='lines'?(item[key]||[]).join('\n'):item[key]||'',v=>item[key]=kind==='lines'?v.split('\n').filter(x=>x.trim()):v,{multiline:kind==='lines'||kind==='long'});

 });action(parent,'+ Add entry',()=>{items.push(structuredClone(blank));update();build()})
}
let openGroups=new Set(['Contact details']);
function build(){
 if(panel.children.length)openGroups=new Set([...panel.querySelectorAll('details[open] summary')].map(n=>n.textContent));
 panel.replaceChildren();releaseDetachedIcons();
 const basics=group('Contact details');
 for(const [key,label]of Object.entries({name:'Full name',headline:'Headline',email:'Email',phone:'Phone',location:'Location'}))field(basics,label,resume.basics[key],v=>resume.basics[key]=v);
 list(basics,resume.basics.links,[['label','Link label'],['url','URL']],{label:'',url:''});
 const summary=group('Summary');field(summary,'Professional summary',resume.summary,v=>resume.summary=v,{multiline:true,rows:5});
 const specs={
 experience:[['title','Role'],['company','Company'],['location','Location'],['startDate','Start date'],['endDate','End date'],['bullets','Bullet points (one per line)','lines']],
 projects:[['name','Project name'],['url','Project URL'],['linkLabel','Link label'],['description','Description','long'],['bullets','Bullet points (one per line)','lines']],
 skills:[['name','Category'],['items','Skills (one per line)','lines']],
 education:[['institution','Institution'],['degree','Degree'],['startDate','Start date'],['endDate','End date'],['bullets','Details (one per line)','lines']],
 certifications:[['name','Certification'],['description','Description','long'],['url','URL'],['linkLabel','Link label'],['startDate','Start date'],['endDate','End date'],['bullets','Details (one per line)','lines']]
 };
 for(const [key,fields]of Object.entries(specs)){const g=group(key[0].toUpperCase()+key.slice(1));list(g,resume[key],fields,Object.fromEntries(fields.map(([k,,kind])=>[k,kind==='lines'?[]:''])))}
 const style=group('Page and spacing');
 field(style,'Page size',layout.page.format,v=>layout.page.format=v,{choices:['Letter','A4']});
 field(style,'Font',layout.typography.fontFamily,v=>layout.typography.fontFamily=v,{choices:['Times New Roman','Georgia','Arial']});
 for(const [label,obj,key,min,max,step]of [['Margins (mm)',layout.page,'marginMm',5,30,.5],['Body font size (pt)',layout.typography,'bodySizePt',8,14,.1],['Line spacing',layout.typography,'lineHeight',1,2,.01],['Section gap (mm)',layout.spacing,'sectionGapMm',0,15,.1],['Entry gap (mm)',layout.spacing,'entryGapMm',0,10,.1]])field(style,label,obj[key],v=>obj[key]=v,{number:true,min,max,step});
 const order=group('Section order');
 layout.sectionOrder.forEach((name,i)=>{const row=node('div');row.className='entry-controls section-sort-row';row.append(node('span',name));reorderHandle(row,order,layout.sectionOrder,i,name+' section')});
 for(const d of panel.querySelectorAll('details'))d.open=openGroups.has(d.querySelector('summary').textContent);
}
async function load(){
 const r=await fetch('/api/document');if(!r.ok)throw Error('Could not load saved resume');
 const d=await r.json();resume=d.resume;layout=d.layout;revision=d.revision;dirty=false;
 build();window.dispatchEvent(new CustomEvent('resume-draft',{detail:{resume,layout}}));message.textContent='All changes saved locally';save.disabled=true;
}
save.addEventListener('click',async()=>{
 saving=true;save.disabled=true;panel.inert=true;reload.disabled=true;message.textContent='Saving…';
 try{const r=await fetch('/api/document',{method:'PUT',headers:{'Content-Type':'application/json'},body:JSON.stringify({resume,layout,revision})});const d=await r.json();if(!r.ok)throw Error(d.error||'Save failed');revision=d.revision;dirty=false;message.textContent='Saved to local resume files'}catch(e){message.textContent=e.message}finally{saving=false;panel.inert=false;reload.disabled=false;save.disabled=!dirty}
});
reload.addEventListener('click',()=>{if(!dirty||confirm('Discard unsaved changes and reload saved data?'))load().catch(e=>message.textContent=e.message)});
window.addEventListener('beforeunload',e=>{if(dirty){e.preventDefault();e.returnValue=''}});
load().catch(e=>message.textContent=e.message);

const workspace=document.querySelector('.workspace'),sidebar=document.querySelector('.edit-sidebar'),divider=document.querySelector('#sidebar-resize'),toggle=document.querySelector('#toggle-editor');
const mobile=()=>matchMedia('(max-width:700px)').matches;
let sidebarWidth=350,sidebarHeight=360,collapsed=false;
try{const prefs=JSON.parse(localStorage.getItem('resume-editor-panels')||'{}');sidebarWidth=prefs.width||350;sidebarHeight=prefs.height||360;collapsed=!!prefs.collapsed}catch{}
function remember(){try{localStorage.setItem('resume-editor-panels',JSON.stringify({width:sidebarWidth,height:sidebarHeight,collapsed}))}catch{}}
function bounds(){return mobile()?[180,Math.max(180,innerHeight*.7)]:[240,Math.max(240,Math.min(700,innerWidth-260))]}
function sizePanel(value){const [min,max]=bounds();value=Math.round(Math.max(min,Math.min(max,value)));if(mobile())sidebarHeight=value;else sidebarWidth=value;workspace.style.setProperty('--sidebar-width',sidebarWidth+'px');workspace.style.setProperty('--sidebar-height',sidebarHeight+'px');divider.setAttribute('aria-orientation',mobile()?'horizontal':'vertical');divider.setAttribute('aria-valuemin',Math.round(min));divider.setAttribute('aria-valuemax',Math.round(max));divider.setAttribute('aria-valuenow',value)}
function collapse(value){collapsed=value;workspace.classList.toggle('editor-collapsed',collapsed);mountIcon(toggle,collapsed?'open':'close');toggle.setAttribute('aria-label',collapsed?'Show editor':'Collapse editor');toggle.title=collapsed?'Show editor':'Collapse editor';toggle.setAttribute('aria-expanded',String(!collapsed));sidebar.inert=collapsed;divider.tabIndex=collapsed?-1:0;remember()}
toggle.addEventListener('click',()=>collapse(!collapsed));
divider.addEventListener('pointerdown',e=>{if(e.button!==0)return;divider.setPointerCapture(e.pointerId);document.body.classList.add('resizing');e.preventDefault()});
divider.addEventListener('pointermove',e=>{if(!divider.hasPointerCapture(e.pointerId))return;const rect=workspace.getBoundingClientRect();sizePanel(mobile()?e.clientY-rect.top:e.clientX-rect.left)});
function stopResize(){document.body.classList.remove('resizing');remember()}
divider.addEventListener('pointerup',stopResize);divider.addEventListener('pointercancel',stopResize);divider.addEventListener('lostpointercapture',stopResize);
divider.addEventListener('keydown',e=>{const direction=mobile()?['ArrowUp','ArrowDown']:['ArrowLeft','ArrowRight'];const [min,max]=bounds();let value=mobile()?sidebarHeight:sidebarWidth;if(e.key===direction[0])value-=e.shiftKey?50:10;else if(e.key===direction[1])value+=e.shiftKey?50:10;else if(e.key==='Home')value=min;else if(e.key==='End')value=max;else return;e.preventDefault();sizePanel(value);remember()});
divider.addEventListener('dblclick',()=>{sizePanel(mobile()?360:350);remember()});
window.addEventListener('resize',()=>sizePanel(mobile()?sidebarHeight:sidebarWidth));
sizePanel(mobile()?sidebarHeight:sidebarWidth);collapse(collapsed);
