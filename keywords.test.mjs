import { build } from 'esbuild';
import assert from 'node:assert/strict';

const bundle = await build({entryPoints:['keywords.ts','linker.ts'], bundle:true, platform:'node', format:'esm', outdir:'test-output', write:false});
const load = name => import('data:text/javascript;base64,' + Buffer.from(bundle.outputFiles.find(file => file.path.endsWith(name + '.js')).text).toString('base64'));
const { highlightKeywords, propertyKeywords } = await load('keywords');
const { autoLink, resolveEntries } = await load('linker');
const opts = {caseSensitive:false, wholeWord:true};
const definition = (text, path = 'Destination.md') => ({text, target:path.replace(/\.md$/, ''), file:{path}, isAlias:true, priority:1});

const terms = ['ภาษี', 'AI', '税', '税金', 'ضريبة', 'налог', 'कर', 'économie', '🙂', 'C#'];
assert.deepEqual(highlightKeywords(terms.map(term => '==' + term + '==').join(' ')), terms);
assert.deepEqual(highlightKeywords('==AI== == AI =='), ['AI']);
assert.deepEqual(propertyKeywords(['AI', '税', '', 7, null, ' AI ']), ['AI', '税']);
assert.deepEqual(propertyKeywords('ภาษีเงินเดือน'), ['ภาษีเงินเดือน']);
assert.deepEqual(highlightKeywords('---\nkeywords: ==hidden==\n---\n==shown=='), ['shown']);
assert.deepEqual(highlightKeywords('`==inline==`\n\n```\n==fenced==\n```\n\n    ==indented==\n'), []);
assert.deepEqual(highlightKeywords('[==label==](https://example.org) ![==alt==](image.png) [[Page|==wiki==]]'), []);
assert.deepEqual(highlightKeywords('%% ==comment== %% $==math==$ https://example.org/==url== <span title="==html==">'), []);
assert.deepEqual(highlightKeywords('===not=== ==not\nmultiline== ==valid=='), ['valid']);

const entries = terms.map(term => definition(term));
const input = terms.join(' / ');
const linked = autoLink(input, entries, opts);
for (const term of terms) assert.ok(linked.includes('[[Destination|' + term + ']]'), term);
assert.equal(autoLink(linked, entries, opts), linked, 'repeat run is stable');
assert.equal(autoLink('==AI== and AI', [definition('AI')], opts), '==AI== and [[Destination|AI]]', 'source highlights stay intact');
assert.equal(autoLink('[[Destination|AI]] 税', entries, opts), '[[Destination|AI]] [[Destination|税]]', 'alias pipes must not freeze the whole paragraph');
assert.equal(resolveEntries(entries, false, 'Destination.md').length, 0, 'never link back to self');
assert.equal(autoLink('AI', [definition('AI'),definition('AI','Another.md')], opts), 'AI', 'multiple definitions are ambiguous');
const inferred = {...definition('AI', 'AI.md'), priority:0};
assert.equal(autoLink('AI', [inferred,definition('AI')], opts), '[[Destination|AI]]', 'explicit definition wins over inferred title');
assert.equal(resolveEntries([inferred,definition('AI')], false, 'Destination.md').length, 0, 'self-definition wins before removing self');
console.log('Highlight extraction, multilingual explicit keywords, and destination resolution passed.');
