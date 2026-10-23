import React from 'react';
import {createRoot} from 'react-dom/client';
import {Save} from './icons/save';
import {Printer} from './icons/printer';
import {ExternalLink} from './icons/external-link';
import {RefreshCw} from './icons/refresh-cw';
import {Plus} from './icons/plus';
import {Trash2} from './icons/trash-2';
import {Menu} from './icons/menu';
import {PanelLeftClose} from './icons/panel-left-close';
import {PanelLeftOpen} from './icons/panel-left-open';

const components={save:Save,print:Printer,view:ExternalLink,reload:RefreshCw,add:Plus,remove:Trash2,grip:Menu,close:PanelLeftClose,open:PanelLeftOpen};
const roots=new Map();
export function mountIcon(element,name){
 let entry=roots.get(element);
 if(!entry){
  entry={root:createRoot(element),name,active:false};
  roots.set(element,entry);
  const render=()=>{const Icon=components[entry.name];entry.root.render(React.createElement(Icon,{size:19,animate:entry.name!=='grip'&&entry.active,completeOnStop:entry.name!=='grip','aria-hidden':true,focusable:false}))};
  entry.render=render;
  element.addEventListener('pointerenter',()=>{entry.active=true;render()});
  element.addEventListener('pointerleave',()=>{entry.active=false;render()});
  element.addEventListener('focus',()=>{entry.active=true;render()});
  element.addEventListener('blur',()=>{entry.active=false;render()});
  element.addEventListener('pointerdown',()=>{entry.active=true;render()});
  element.addEventListener('pointerup',()=>{entry.active=false;render()});
 }
 entry.name=name;entry.render();
}
export function releaseDetachedIcons(){for(const [element,entry]of roots){if(!element.isConnected){entry.root.unmount();roots.delete(element)}}}
