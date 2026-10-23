import assert from 'node:assert/strict';
const sections=['summary','experience','projects','skills','education','certifications'];
export function validate(resume,layout){
 assert.ok(resume?.basics && typeof resume.basics==='object','Contact details are required');
 for(const key of ['name','headline','email','phone','location'])assert.equal(typeof resume.basics[key],'string',key+' must be text');
 assert.ok(Array.isArray(resume.basics.links),'Links must be a list');
 for(const link of resume.basics.links){assert.equal(typeof link.label,'string');assert.equal(typeof link.url,'string')}
 assert.equal(typeof resume.summary,'string','Summary must be text');
 for(const section of sections.slice(1)){
 assert.ok(Array.isArray(resume[section]),section+' must be a list');
 for(const item of resume[section]){
 assert.ok(item && typeof item==='object' && !Array.isArray(item),'Entries must be objects');
 for(const [key,value] of Object.entries(item)){if(['bullets','items'].includes(key))assert.ok(Array.isArray(value)&&value.every(x=>typeof x==='string'),key+' must contain text');else assert.equal(typeof value,'string',key+' must be text')}
 }}
 assert.ok(['Letter','A4'].includes(layout?.page?.format),'Choose Letter or A4');
 for(const [value,min,max,label] of [[layout.page.marginMm,5,30,'Margins'],[layout.typography?.bodySizePt,8,14,'Font size'],[layout.typography?.lineHeight,1,2,'Line spacing'],[layout.spacing?.sectionGapMm,0,15,'Section spacing'],[layout.spacing?.entryGapMm,0,10,'Entry spacing']])assert.ok(Number.isFinite(value)&&value>=min&&value<=max,label+' is outside the allowed range');
 assert.ok(['Times New Roman','Georgia','Arial'].includes(layout.typography.fontFamily),'Choose a supported font');
 assert.equal(layout.maxPages,1);
 assert.ok(Array.isArray(layout.sectionOrder)&&layout.sectionOrder.length===sections.length&&new Set(layout.sectionOrder).size===sections.length&&layout.sectionOrder.every(x=>sections.includes(x)),'Section order must include every section once');
}
