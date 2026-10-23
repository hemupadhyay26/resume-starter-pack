import {readFile} from 'node:fs/promises';
import {validate} from './schema.mjs';
const read=async p=>JSON.parse(await readFile(new URL(p,import.meta.url),'utf8'));
validate(await read('../data/resume.json'),await read('../data/layout.json'));
console.log('Resume data and layout configuration are valid.');
