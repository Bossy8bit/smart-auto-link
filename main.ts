import { Language, translator } from "./i18n";
import { autoLink, Entry, resolveEntries } from "./linker";
import { titleTerms } from "./title-terms";
import { highlightKeywords, propertyKeywords } from "./keywords";
import { App, Command, Notice, Plugin, PluginSettingTab, Setting, TFile } from "obsidian";

interface AutoLinkSettings {
  language: Language;
  caseSensitive: boolean;
  minimumLength: number;
  useAliases: boolean;
  useTitleKeywords: boolean;
  useHighlights: boolean;
  useKeywords: boolean;
  autoLinkAutomatically: boolean;
  wholeWord: boolean;
}

const DEFAULT_SETTINGS: AutoLinkSettings = {
  language: "auto",
  caseSensitive: false,
  minimumLength: 3,
  useAliases: true,
  useTitleKeywords: false,
  useHighlights: true,
  useKeywords: true,
  autoLinkAutomatically: false,
  wholeWord: true,
};

export default class SmartAutoLinkPlugin extends Plugin {
  settings: AutoLinkSettings;
  private currentCommand?: Command;
  private vaultCommand?: Command;
  private timers = new Map<string, ReturnType<typeof setTimeout>>();
  private processing = new Set<string>();
  private highlightCache = new Map<string, { stamp: string; terms: string[] }>();
  private sourceSignatures = new Map<string, string>();
  private unloaded = false;

  t() { return translator(this.settings.language); }

  async onload() {
    await this.loadSettings();
    this.currentCommand = this.addCommand({
      id: "auto-link-current-note",
      name: this.t().currentCommand,
      callback: async () => {
        const file = this.app.workspace.getActiveFile();
        if (!file || file.extension !== "md") {
          new Notice(this.t().noFile);
          return;
        }
        try {
          const changed = await this.processFile(file);
          new Notice(changed ? this.t().currentDone(file.basename) : this.t().noMatches);
        } catch (error) {
          console.error("Smart Auto Link", error);
          new Notice(this.t().failed);
        }
      },
    });
    this.vaultCommand = this.addCommand({
      id: "auto-link-entire-vault",
      name: this.t().vaultCommand,
      callback: () => this.linkEntireVault(),
    });
    this.addSettingTab(new AutoLinkSettingTab(this.app, this));
    this.registerEvent(this.app.vault.on("modify", file => {
      this.highlightCache.delete(file.path);
      if (file instanceof TFile) this.scheduleAutomaticLink(file, 800);
    }));
    this.registerEvent(this.app.metadataCache.on("changed", file => {
      this.scheduleAutomaticLink(file, 800);
    }));
    this.registerEvent(this.app.vault.on("delete", file => {
      this.highlightCache.delete(file.path);
      this.sourceSignatures.delete(file.path);
    }));
    this.registerEvent(this.app.workspace.on("file-open", file => {
      if (file) this.scheduleAutomaticLink(file, 300);
    }));
    this.app.workspace.onLayoutReady(() => {
      if (!this.settings.autoLinkAutomatically) return;
      void this.getEntries().then(() => {
        const file = this.app.workspace.getActiveFile();
        if (file) this.scheduleAutomaticLink(file, 300);
      }).catch(error => console.error("Smart Auto Link index", error));
    });
    this.register(() => {
      this.unloaded = true;
      for (const timer of this.timers.values()) clearTimeout(timer);
      this.timers.clear();
      this.highlightCache.clear();
      this.sourceSignatures.clear();
    });
  }

  async linkEntireVault(): Promise<void> {
    let changed = 0;
    let path = "";
    try {
      const files = this.app.vault.getMarkdownFiles();
      const entries = await this.getEntries();
      for (const file of files) {
        path = file.path;
        if (await this.processFile(file, entries)) changed++;
      }
      const message = changed ? this.t().vaultDone(changed, files.length) : this.t().vaultUnchanged(files.length);
      const keywords = new Set(entries.filter(entry => entry.priority === 1)
        .map(entry => entry.text + "\u0000" + entry.file.path)).size;
      new Notice(message + "\n" + this.t().keywordCount(keywords), 8000);
    } catch (error) {
      console.error("Smart Auto Link", path, error);
      new Notice(path ? this.t().vaultStopped(path, changed) : this.t().failed);
    }
  }

  scheduleAutomaticLink(file: TFile, delay: number): void {
    if (this.unloaded || !this.settings.autoLinkAutomatically || file.extension !== "md" ||
        this.processing.has(file.path)) return;
    const old = this.timers.get(file.path);
    if (old) clearTimeout(old);
    this.timers.set(file.path, setTimeout(() => {
      this.timers.delete(file.path);
      if (this.unloaded || !this.settings.autoLinkAutomatically || this.processing.has(file.path)) return;
      this.processing.add(file.path);
      void this.runAutomaticLink(file).catch(error => {
        console.error("Smart Auto Link automatic linking", file.path, error);
      }).finally(() => this.processing.delete(file.path));
    }, delay));
  }

  private async runAutomaticLink(file: TFile): Promise<void> {
    const previous = this.sourceSignatures.get(file.path);
    const entries = await this.getEntries();
    const changedDefinitions = previous !== this.sourceSignatures.get(file.path);
    // A new/changed definition can affect other notes, not just the source note.
    const files = changedDefinitions ? this.app.vault.getMarkdownFiles() : [file];
    for (const target of files) {
      if (this.unloaded || !this.settings.autoLinkAutomatically) break;
      if (target.path !== file.path && this.processing.has(target.path)) continue;
      this.processing.add(target.path);
      try {
        await this.processFile(target, entries);
      } finally {
        if (target.path !== file.path) this.processing.delete(target.path);
      }
    }
  }

  async loadSettings() {
    this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData());
    if (!["auto", "en", "th"].includes(this.settings.language)) this.settings.language = "auto";
  }

  updateCommandNames() {
    if (this.currentCommand) this.currentCommand.name = this.t().currentCommand;
    if (this.vaultCommand) this.vaultCommand.name = this.t().vaultCommand;
  }

  async saveSettings() {
    await this.saveData(this.settings);
  }

  async getEntries(): Promise<Entry[]> {
    const result: Entry[] = [];
    const files = this.app.vault.getMarkdownFiles();
    const paths = new Set(files.map(file => file.path));
    for (const path of this.highlightCache.keys()) {
      if (!paths.has(path)) {
        this.highlightCache.delete(path);
        this.sourceSignatures.delete(path);
      }
    }
    for (const file of files) {
      const name = file.basename.trim();
      const target = file.path.replace(/\.md$/i, "");
      const add = (text: string, priority = 0) => {
        result.push({ text, target, file, isAlias: text !== name, priority });
      };
      if (name.length >= this.settings.minimumLength) add(name);
      if (this.settings.useTitleKeywords) {
        for (const term of titleTerms(name, this.settings.minimumLength)) add(term);
      }
      const frontmatter = this.app.metadataCache.getFileCache(file)?.frontmatter;
      if (this.settings.useAliases) {
        for (const alias of propertyKeywords(frontmatter?.aliases ?? frontmatter?.alias)) {
          if (alias.length >= this.settings.minimumLength) add(alias);
        }
      }
      const declared = this.settings.useKeywords ? propertyKeywords(frontmatter?.keywords) : [];
      let highlighted: string[] = [];
      if (this.settings.useHighlights) {
        const stamp = file.stat ? file.stat.mtime + ":" + file.stat.size : "";
        let cached = this.highlightCache.get(file.path);
        if (!cached || !file.stat || cached.stamp !== stamp) {
          const content = await this.app.vault.cachedRead(file);
          cached = { stamp, terms: content.includes("==") ? highlightKeywords(content) : [] };
          this.highlightCache.set(file.path, cached);
        }
        highlighted = cached.terms;
      }
      for (const term of new Set([...declared, ...highlighted])) add(term, 1);
      this.sourceSignatures.set(file.path, JSON.stringify([declared, highlighted]));
    }
    return result;
  }

  async processFile(file: TFile, allEntries?: Entry[]): Promise<boolean> {
    const entries = resolveEntries(allEntries ?? await this.getEntries(), this.settings.caseSensitive, file.path);
    const current = await this.app.vault.cachedRead(file);
    if (this.autoLink(current, entries) === current) return false;
    let changed = false;
    await this.app.vault.process(file, content => {
      const output = this.autoLink(content, entries);
      changed = output !== content;
      return output;
    });
    return changed;
  }

  autoLink(content: string, entries: Entry[]): string {
    return autoLink(content, entries, this.settings);
  }
}

class AutoLinkSettingTab extends PluginSettingTab {
  constructor(app: App, private plugin: SmartAutoLinkPlugin) { super(app, plugin); }

  display(): void {
    const { containerEl } = this;
    containerEl.empty();
    const t = this.plugin.t();
    containerEl.createEl("p", { text: "Smart Auto Link " + this.plugin.manifest.version, cls: "setting-item-description" });
    new Setting(containerEl)
      .setName(t.language).setDesc(t.languageDesc)
      .addDropdown(dropdown => dropdown
        .addOption("auto", t.auto).addOption("en", t.english).addOption("th", t.thai)
        .setValue(this.plugin.settings.language)
        .onChange(async value => {
          this.plugin.settings.language = value as Language;
          await this.plugin.saveSettings();
          this.plugin.updateCommandNames();
          this.display();
        }));
    containerEl.createEl("h3", { text: t.keywordHeading });
    containerEl.createEl("p", { text: t.keywordHelp });
    new Setting(containerEl)
      .setName(t.applyKeywords).setDesc(t.applyKeywordsDesc)
      .addButton(button => button.setButtonText(t.applyNow).setCta().onClick(async () => {
        button.setDisabled(true);
        try { await this.plugin.linkEntireVault(); }
        finally { button.setDisabled(false); }
      }));

    const toggle = (key: "useHighlights" | "useKeywords" | "useTitleKeywords" |
        "useAliases" | "caseSensitive" | "wholeWord", name: string, desc: string) => {
      new Setting(containerEl).setName(name).setDesc(desc).addToggle(control => control
        .setValue(this.plugin.settings[key]).onChange(async value => {
          this.plugin.settings[key] = value;
          await this.plugin.saveSettings();
        }));
    };
    toggle("useHighlights", t.highlights, t.highlightsDesc);
    toggle("useKeywords", t.keywords, t.keywordsDesc);
    new Setting(containerEl)
      .setName(t.automatic).setDesc(t.automaticDesc)
      .addToggle(control => control.setValue(this.plugin.settings.autoLinkAutomatically)
        .onChange(async value => {
          this.plugin.settings.autoLinkAutomatically = value;
          await this.plugin.saveSettings();
          if (value) {
            const file = this.plugin.app.workspace.getActiveFile();
            if (file) this.plugin.scheduleAutomaticLink(file, 300);
          }
        }));
    toggle("useTitleKeywords", t.titleKeywords, t.titleKeywordsDesc);
    toggle("useAliases", t.aliases, t.aliasesDesc);
    toggle("caseSensitive", t.caseSensitive, t.caseSensitiveDesc);
    toggle("wholeWord", t.wholeWord, t.wholeWordDesc);
    new Setting(containerEl).setName(t.minLength).setDesc(t.minLengthDesc)
      .addText(text => text.setPlaceholder("3").setValue(String(this.plugin.settings.minimumLength))
        .onChange(async value => {
          const number = Number(value);
          if (Number.isInteger(number) && number >= 1) {
            this.plugin.settings.minimumLength = number;
            await this.plugin.saveSettings();
          }
        }));
  }
}
