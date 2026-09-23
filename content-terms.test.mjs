import { build } from 'esbuild';
import assert from 'node:assert/strict';

const bundle = await build({
  entryPoints: ['content-terms.ts'],
  bundle: true,
  platform: 'node',
  format: 'esm',
  write: false,
});
const { contentTerms } = await import('data:text/javascript;base64,' + Buffer.from(bundle.outputFiles[0].text).toString('base64'));

const terms = contentTerms('alpha alpha alpha beta beta beta gamma', 3);
assert.ok(terms.includes('alpha'), 'repeated word is extracted');
assert.ok(terms.includes('beta'), 'second repeated word is extracted');
assert.ok(!terms.includes('gamma'), 'word that appears once is not extracted');

assert.deepEqual(contentTerms('the the the and and and for for for', 3), [], 'stop words are never extracted');
assert.deepEqual(contentTerms('alpha alpha', 3), [], 'below the repeat threshold is ignored');

const many = contentTerms('w11 w11 w11 x22 x22 x22 y33 y33 y33 z44 z44 z44 q55 q55 q55', 3);
assert.equal(many.length, 3, 'at most three terms per note');

assert.deepEqual(contentTerms('[[note]] [[note]] [[note]] alpha alpha alpha', 3), ['alpha'], 'existing wikilinks are not counted');
assert.deepEqual(contentTerms('`alpha` alpha alpha alpha\nalpha alpha alpha\nalpha alpha', 3), ['alpha'], 'code runs are excluded');
console.log('Content-term extraction passed.');
