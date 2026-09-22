import { build } from 'esbuild';
import assert from 'node:assert/strict';

const bundle = await build({
  entryPoints: ['title-terms.ts', 'linker.ts'],
  bundle: true,
  platform: 'node',
  format: 'esm',
  outdir: 'test-output',
  write: false,
});
async function moduleOf(fragment) {
  const file = bundle.outputFiles.find(item => item.path.endsWith(fragment));
  return import('data:text/javascript;base64,' + Buffer.from(file.text).toString('base64'));
}
const { titleTerms } = await moduleOf('title-terms.js');
const { autoLink } = await moduleOf('linker.js');

for (const [title, term] of [
  ['วางแผนภาษีเงินเดือนในไทย', 'เงินเดือน'],
  ['人工智能指南', '人工智能'],
  ['機械学習入門', '機械学習'],
  ['دليل ضريبة الراتب', 'ضريبة'],
  ['Планирование налога', 'налога'],
  ['पगार कर योजना', 'योजना'],
  ['Salary Tax Planning', 'Salary'],
]) {
  assert.ok(titleTerms(title, 3).includes(term), `${title} should generate ${term}`);
}

assert.ok(!titleTerms('วางแผนภาษีเงินเดือนในไทย', 3).includes('ภาษีเงิน'));
assert.ok(!titleTerms('แนวทางประหยัดภาษีหุ้นสหรัฐฯ ในไทย', 3).includes('ประหยัด'));

const target = 'วางแผนภาษีเงินเดือนในไทย';
const entries = titleTerms(target, 3).map(text => ({
  text, target, file: { path: target + '.md' }, isAlias: true,
}));
const input = 'อย่าปนกับเงินเดือนหรือเงินใช้จ่ายประจำวัน';
const expected = 'อย่าปนกับ[[วางแผนภาษีเงินเดือนในไทย|เงินเดือน]]หรือเงินใช้จ่ายประจำวัน';
assert.equal(autoLink(input, entries, { caseSensitive: false, wholeWord: true }), expected);
assert.equal(autoLink(expected, entries, { caseSensitive: false, wholeWord: true }), expected);
for (const [term, destination, input, expected] of [
  ['人工智能', '人工智能指南', '研究人工智能应用', '研究[[人工智能指南|人工智能]]应用'],
  ['機械学習', '機械学習入門', '機械学習の応用', '[[機械学習入門|機械学習]]の応用'],
  ['ضريبة', 'دليل ضريبة الراتب', 'تسديد ضريبة اليوم', 'تسديد [[دليل ضريبة الراتب|ضريبة]] اليوم'],
  ['налога', 'Планирование налога', 'уплата налога сегодня', 'уплата [[Планирование налога|налога]] сегодня'],
]) {
  assert.ok(titleTerms(destination, 3).includes(term));
  assert.equal(autoLink(input, [{text:term,target:destination,file:{path:destination+'.md'},isAlias:true}],{caseSensitive:false,wholeWord:true}),expected);
}
console.log('Multilingual title terms and in-sentence linking passed.');
