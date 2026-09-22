import { Language, translator } from "./i18n";
import { autoLink as linkMarkdown } from "./linker";
import { titleTerms } from "./title-terms";
import {
  App,
  Command,
  Notice,
  Plugin,
  PluginSettingTab,
  Setting,
  TFile,
} from "obsidian";

interface AutoLinkSettings {
  language: Language;
  caseSensitive: boolean;
  minimumLength: number;
  useAliases: boolean;
  useTitleKeywords: boolean;
  wholeWord: boolean;
}

const DEFAULT_SETTINGS: AutoLinkSettings = {
  language: "auto",
  caseSensitive: false,
  minimumLength: 3,
  useAliases: true,
  useTitleKeywords: true,
  wholeWord: true,
};

interface LinkEntry {
  text: string;
  target: string;
  file: TFile;
  isAlias: boolean;
}

export default class SmartAutoLinkPlugin extends Plugin {
  settings: AutoLinkSettings;
  private currentCommand?: Command;
  private vaultCommand?: Command;

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

        try { await this.processFile(file); } catch (error) {
          console.error("Smart Auto Link", error);
          new Notice(this.t().failed);
          return;
        }

        new Notice(this.t().currentDone(file.basename));
      },
    });

    this.vaultCommand = this.addCommand({
      id: "auto-link-entire-vault",
      name: this.t().vaultCommand,
      callback: async () => {
        const files = this.app.vault.getMarkdownFiles();
        const entries = this.getEntries();

        let changed = 0;

        for (const file of files) {
          let didChange = false;
          try { didChange = await this.processFile(file, entries); } catch (error) {
            console.error("Smart Auto Link", file.path, error);
            new Notice(this.t().vaultStopped(file.path, changed));
            return;
          }

          if (didChange) {
            changed++;
          }
        }

        new Notice(this.t().vaultDone(changed, files.length));
      },
    });

    this.addSettingTab(new AutoLinkSettingTab(this.app, this));
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

  getEntries(): LinkEntry[] {
    const result: LinkEntry[] = [];

    const files = this.app.vault.getMarkdownFiles();

    for (const file of files) {
      const name = file.basename.trim();

      if (name.length >= this.settings.minimumLength) {
        result.push({
          text: name,
          target: file.path.replace(/\.md$/, ""),
          file,
          isAlias: false,
        });
      }

      if (this.settings.useTitleKeywords) {
        for (const term of titleTerms(name, this.settings.minimumLength)) {
          result.push({ text: term, target: file.path.replace(/\.md$/, ""), file, isAlias: true });
        }
      }

      if (!this.settings.useAliases) {
        continue;
      }

      const cache = this.app.metadataCache.getFileCache(file);

      const rawAliases =
        cache?.frontmatter?.aliases ??
        cache?.frontmatter?.alias;

      if (!rawAliases) {
        continue;
      }

      let aliases: string[] = [];

      if (Array.isArray(rawAliases)) {
        aliases = rawAliases.filter((value): value is string => typeof value === "string");
      } else if (typeof rawAliases === "string") {
        aliases = [rawAliases];
      }

      for (const alias of aliases) {
        const cleaned = alias.trim();

        if (cleaned.length < this.settings.minimumLength) {
          continue;
        }

        result.push({
          text: cleaned,
          target: file.path.replace(/\.md$/, ""),
          file,
          isAlias: true,
        });
      }
    }

    /*
     * Longest first:
     *
     * Quantum Computing
     * before
     * Quantum
     */
    result.sort((a, b) => b.text.length - a.text.length);

    return result;
  }

  async processFile(file: TFile, allEntries = this.getEntries()): Promise<boolean> {

    const ambiguous = new Set<string>();
    const owners = new Map<string, string>();
    for (const e of allEntries) {
      const k = this.settings.caseSensitive ? e.text : e.text.toLowerCase();
      if (owners.has(k) && owners.get(k) !== e.file.path) ambiguous.add(k);
      owners.set(k, e.file.path);
    }
    const entries = allEntries.filter(e => !ambiguous.has(this.settings.caseSensitive ? e.text : e.text.toLowerCase())).filter(
      (entry) => entry.file.path !== file.path
    );

    let changed = false;

    await this.app.vault.process(file, (content) => {
      const result = this.autoLink(content, entries);

      if (result !== content) {
        changed = true;
      }

      return result;
    });

    return changed;
  }

  autoLink(content: string, entries: LinkEntry[]): string {
    return linkMarkdown(content, entries, this.settings);
  }
}

class AutoLinkSettingTab extends PluginSettingTab {
  plugin: SmartAutoLinkPlugin;

  constructor(
    app: App,
    plugin: SmartAutoLinkPlugin
  ) {
    super(app, plugin);

    this.plugin = plugin;
  }

  display(): void {
    const { containerEl } = this;

    containerEl.empty();
    const t = this.plugin.t();
    new Setting(containerEl)
      .setName(t.language)
      .setDesc(t.languageDesc)
      .addDropdown(dropdown => dropdown
        .addOption("auto", t.auto)
        .addOption("en", t.english)
        .addOption("th", t.thai)
        .setValue(this.plugin.settings.language)
        .onChange(async value => {
          this.plugin.settings.language = value as Language;
          await this.plugin.saveSettings();
          this.plugin.updateCommandNames();
          this.display();
        }));

    new Setting(containerEl)
      .setName(t.titleKeywords)
      .setDesc(t.titleKeywordsDesc)
      .addToggle(toggle => toggle
        .setValue(this.plugin.settings.useTitleKeywords)
        .onChange(async value => {
          this.plugin.settings.useTitleKeywords = value;
          await this.plugin.saveSettings();
        }));

    new Setting(containerEl)
      .setName(t.aliases)
      .setDesc(
        t.aliasesDesc
      )
      .addToggle((toggle) =>
        toggle
          .setValue(this.plugin.settings.useAliases)
          .onChange(async (value) => {
            this.plugin.settings.useAliases = value;
            await this.plugin.saveSettings();
          })
      );

    new Setting(containerEl)
      .setName(t.caseSensitive)
      .setDesc(
        t.caseSensitiveDesc
      )
      .addToggle((toggle) =>
        toggle
          .setValue(this.plugin.settings.caseSensitive)
          .onChange(async (value) => {
            this.plugin.settings.caseSensitive = value;
            await this.plugin.saveSettings();
          })
      );

    new Setting(containerEl)
      .setName(t.wholeWord)
      .setDesc(
        t.wholeWordDesc
      )
      .addToggle((toggle) =>
        toggle
          .setValue(this.plugin.settings.wholeWord)
          .onChange(async (value) => {
            this.plugin.settings.wholeWord = value;
            await this.plugin.saveSettings();
          })
      );

    new Setting(containerEl)
      .setName(t.minLength)
      .setDesc(
        t.minLengthDesc
      )
      .addText((text) =>
        text
          .setPlaceholder("3")
          .setValue(
            String(this.plugin.settings.minimumLength)
          )
          .onChange(async (value) => {
            const number = Number(value);

            if (
              Number.isInteger(number) &&
              number >= 1
            ) {
              this.plugin.settings.minimumLength = number;
              await this.plugin.saveSettings();
            }
          })
      );
  }
}
