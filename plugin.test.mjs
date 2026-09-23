import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';

class TFile {
  constructor(path) {
    this.path = path;
    this.extension = 'md';
    this.basename = path.split('/').pop().replace(/\.md$/, '');
    this.stat = { mtime: 1, size: 1 };
  }
}
class Plugin {}
class PluginSettingTab {}
class Notice {}
class Setting {}

const module = { exports: {} };
vm.runInNewContext(readFileSync('main.js', 'utf8'), {
  module,
  exports: module.exports,
  require(name) {
    assert.equal(name, 'obsidian');
    return { Plugin, PluginSettingTab, Notice, Setting, TFile, getLanguage: () => 'en' };
  },
  console,
  document: { createElement: () => ({ textContent: "", set innerHTML(value) { this.textContent = value; } }) },
  Intl,
  setTimeout,
  clearTimeout,
});

const plugin = new module.exports.default();
plugin.loadData = async () => null;
plugin.saveData = async () => {};
await plugin.loadSettings();
assert.equal(plugin.settings.autoLinkAutomatically, true);
assert.equal(plugin.settings.useTitleKeywords, true);
const file = new TFile('Current.md');
plugin.scheduleAutomaticLink(file, 10);
assert.equal(plugin.timers.size, 1, 'automatic linking is enabled by default');
for (const timer of plugin.timers.values()) clearTimeout(timer);
plugin.timers.clear();

let content = 'No target here';
let writes = 0;
plugin.app = { vault: {
  cachedRead: async () => content,
  process: async (_file, transform) => { writes++; content = transform(content); },
} };
const target = new TFile('Python.md');
const entries = [{ text: 'Python', target: 'Python', file: target, isAlias: false }];
assert.equal(await plugin.processFile(file, entries), false);
assert.equal(writes, 0, 'no-match run must not write');
content = 'Python is useful';
assert.equal(await plugin.processFile(file, entries), true);
assert.equal(content, '[[Python]] is useful');
assert.equal(writes, 1);
assert.equal(await plugin.processFile(file, entries), false);
assert.equal(writes, 1, 'repeat run must not write');
console.log('Automatic defaults and no-op write guards passed.');

// End-to-end explicit definitions: no note title or alias match is needed.
const source = new TFile('Topics/Source.md');
const consumer = new TFile('Other.md');
const docs = new Map([
  [source.path, '==ภาษี== ==AI== ==税=='],
  [consumer.path, 'ภาษี AI 税 كلمة C#'],
]);
const files = [source, consumer];
const properties = new Map([[source.path, { keywords: ['كلمة', 'C#'] }]]);
let documentWrites = 0;
plugin.app = {
  metadataCache: { getFileCache: file => ({ frontmatter: properties.get(file.path) }) },
  vault: {
    getMarkdownFiles: () => files,
    cachedRead: async file => docs.get(file.path),
    process: async (file, transform) => {
      documentWrites++;
      docs.set(file.path, transform(docs.get(file.path)));
      file.stat.mtime++;
    },
  },
};
plugin.settings.minimumLength = 50;
plugin.settings.useTitleKeywords = false;
plugin.settings.useAliases = false;
let definitions = await plugin.getEntries();
assert.equal(definitions.filter(entry => entry.priority === 1).length, 5);
assert.equal(await plugin.processFile(source, definitions), false);
assert.equal(docs.get(source.path), '==ภาษี== ==AI== ==税==');
assert.equal(await plugin.processFile(consumer, definitions), true);
assert.equal(docs.get(consumer.path), '[[Topics/Source|ภาษี]] [[Topics/Source|AI]] [[Topics/Source|税]] [[Topics/Source|كلمة]] [[Topics/Source|C#]]');
assert.equal(await plugin.processFile(consumer), false);
assert.equal(documentWrites, 1);

const competing = new TFile('Another source.md');
files.push(competing);
docs.set(competing.path, '==AI==');
docs.set(consumer.path, 'AI ภาษี');
consumer.stat.mtime++;
assert.equal(await plugin.processFile(consumer), true);
assert.equal(docs.get(consumer.path), 'AI [[Topics/Source|ภาษี]]');

await plugin.getEntries(); // Prime definition signatures before source modification.
docs.set(source.path, docs.get(source.path) + ' ==שלום==');
source.stat.mtime++;
docs.set(consumer.path, 'שלום');
consumer.stat.mtime++;
plugin.settings.autoLinkAutomatically = true;
await plugin.runAutomaticLink(source);
assert.equal(docs.get(consumer.path), '[[Topics/Source|שלום]]', 'source keyword changes update other notes when user opted in');
assert.ok(docs.get(source.path).includes('==שלום=='), 'source highlight preserved');
const writesBeforeCancel = documentWrites;
plugin.scheduleAutomaticLink(source, 1);
plugin.settings.autoLinkAutomatically = false;
await new Promise(resolve => setTimeout(resolve, 15));
assert.equal(documentWrites, writesBeforeCancel, 'turning automatic mode off cancels pending mutation');
// Automatic startup mode applies title-derived terms across every note without a manual command.
const titleSource = new TFile('Salary Planning.md');
const titleTarget = new TFile('Daily Log.md');
files.push(titleSource, titleTarget);
docs.set(titleSource.path, 'Reference page.');
docs.set(titleTarget.path, 'Salary is part of this plan.');
plugin.settings.minimumLength = 3;
plugin.settings.useTitleKeywords = true;
await plugin.processVault(false);
assert.equal(docs.get(titleTarget.path), '[[Salary Planning|Salary]] is part of this plan.');
// Automatic content terms: a word repeated inside one note becomes a link target;
// a word prominent in several notes is skipped (priority 0 + multi-file conflict).
plugin.settings.useContentTerms = true;
const ledA = new TFile('A.md');
const ledB = new TFile('B.md');
const salC = new TFile('C.md');
const noteD = new TFile('D.md');
files.push(ledA, ledB, salC, noteD);
docs.set(ledA.path, 'ledger ledger ledger report');
docs.set(ledB.path, 'ledger ledger ledger tax');
docs.set(salC.path, 'dividend dividend dividend bonus');
docs.set(noteD.path, 'dividend and ledger appear here');
await plugin.processVault(false);
assert.equal(docs.get(ledA.path), 'ledger ledger ledger report', 'source note keeps its own repeated words');
assert.equal(docs.get(salC.path), 'dividend dividend dividend bonus', 'source note keeps its own repeated words');
assert.equal(docs.get(noteD.path), '[[C|dividend]] and ledger appear here', 'unique repeated word links, word shared by several notes is skipped');
console.log('Automatic defaults, startup vault scan, title-derived links, content-term links and explicit multilingual keyword workflows passed.');
