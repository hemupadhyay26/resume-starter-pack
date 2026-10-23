if(new URLSearchParams(location.search).get('view')==='resume'){document.documentElement.classList.add('resume-only');document.title='Resume';}
const page=document.querySelector('#page'), content=document.querySelector('#content'), status=document.querySelector('#status'), button=document.querySelector('#print');
const el=(tag,text,cls)=>{const n=document.createElement(tag);if(text)n.textContent=text;if(cls)n.className=cls;return n};
function link(label,url){const a=el('a',label);try{const u=new URL(url);if(['https:','http:','mailto:','tel:'].includes(u.protocol)){a.href=u.href;a.rel='noopener noreferrer'}}catch{}return a}
let previous='',currentLayout,draftMode=false;
window.addEventListener('resume-draft',e=>{draftMode=true;render(e.detail.resume,e.detail.layout)});
function check(){if(!currentLayout)return;const p=page.getBoundingClientRect(),c=content.getBoundingClientRect(),s=getComputedStyle(page);const overflow=c.bottom>p.bottom-parseFloat(s.paddingBottom)+1||content.scrollWidth>content.clientWidth+1;page.classList.toggle('overflow',overflow);status.textContent=overflow?'Content exceeds one page — adjust content or spacing':'Fits one '+currentLayout.page.format+' page';button.disabled=overflow;return !overflow}
function render(data,layout){
 currentLayout=layout;content.replaceChildren();const b=data.basics;if(document.documentElement.classList.contains('resume-only'))document.title=(b.name||'Your Name')+' · Resume';content.append(el('h1',b.name||'Your Name'));if(b.headline)content.append(el('p',b.headline,'headline'));
 const contact=el('div',null,'contact');if(b.email)contact.append(link(b.email,'mailto:'+b.email));if(b.phone)contact.append(link(b.phone,'tel:'+b.phone.replace(/\s/g,'')));if(b.location)contact.append(el('span',b.location));for(const l of b.links||[])contact.append(link(l.label||l.url,l.url));content.append(contact);
 for(const key of layout.sectionOrder){const value=data[key];if(!value?.length)continue;
 if(key==='summary'){content.append(el('p',value,'summary'));continue}
 const section=el('section');section.append(el('h2',key==='skills'?'Skills':key[0].toUpperCase()+key.slice(1)));
 for(const item of value){const entry=el('div',null,'entry');if(typeof item==='string'){entry.append(el('p',item));section.append(entry);continue}
 if(key==='skills'){const p=el('p');p.append(el('strong',item.name+': '),document.createTextNode((item.items||[]).join(', ')));entry.append(p)}
 else{const head=el('div',null,'entry-head'),left=el('div',null,'entry-title');
 if(key==='education'){left.append(el('strong',item.institution));if(item.degree)left.append(document.createTextNode(', '+item.degree))}
 else{left.append(el('strong',item.title||item.name||''));if(item.company)left.append(document.createTextNode(', '+item.company));if(item.location)left.append(document.createTextNode(' – '+item.location))}
 head.append(left);if(item.url)head.append(link(item.linkLabel||'Link',item.url));else{const dates=[item.startDate,item.endDate].filter(Boolean).join(key==='education'?'-':' – ');if(dates)head.append(el('span',dates,'date'))}entry.append(head);
 if(item.description)entry.append(el('p',item.description));if(item.bullets?.length){const ul=el('ul');for(const text of item.bullets)ul.append(el('li',text));entry.append(ul)}}
 section.append(entry)}content.append(section)}
 const number=(v,min,max,f)=>Number.isFinite(v)?Math.min(max,Math.max(min,v)):f;
 const letter=layout.page.format==='Letter';page.style.width=letter?'215.9mm':'210mm';page.style.height=letter?'279.4mm':'297mm';
 page.style.setProperty('--margin',number(layout.page.marginMm,5,30,19)+'mm');page.style.setProperty('--size',number(layout.typography.bodySizePt,8,14,10)+'pt');page.style.setProperty('--leading',number(layout.typography.lineHeight,1,2,1.14));page.style.setProperty('--section-gap',number(layout.spacing.sectionGapMm,0,15,3.5)+'mm');page.style.setProperty('--entry-gap',number(layout.spacing.entryGapMm,0,10,2)+'mm');
 page.style.fontFamily=['Times New Roman','Georgia','Arial'].includes(layout.typography.fontFamily)?layout.typography.fontFamily:'Times New Roman';
 document.querySelector('#print-page').textContent='@page { size: '+(letter?'Letter':'A4')+'; margin: 0; }';page.setAttribute('aria-label',layout.page.format+' resume');requestAnimationFrame(check);document.fonts.ready.then(check)}
async function refresh(){if(draftMode)return;try{const r=await Promise.all(['/api/resume','/api/layout'].map(u=>fetch(u)));if(r.some(x=>!x.ok))throw Error('Cannot load source');const values=await Promise.all(r.map(x=>x.json()));const signature=JSON.stringify(values);if(signature!==previous){render(...values);previous=signature}}catch(e){status.textContent='Preview error: '+e.message;button.disabled=true;previous=''}}
button.addEventListener('click',()=>{if(check())window.print()});window.addEventListener('resize',check);await refresh();setInterval(refresh,1000);
