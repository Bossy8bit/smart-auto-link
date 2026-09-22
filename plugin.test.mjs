import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';

class TFile {
  constructor(path) {
    this.path = path;
    this.extension = 'md';
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
await plugin.loadSettings();
assert.equal(plugin.settings.autoLinkAutomatically, false);
const file = new TFile('Current.md');
plugin.scheduleAutomaticLink(file, 10);
assert.equal(plugin.timers.size, 0, 'default setting must never schedule a write');

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
console.log('Plugin opt-in and no-op write guards passed.');
