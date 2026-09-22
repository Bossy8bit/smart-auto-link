# Smart Auto Link

Smart Auto Link turns matching note names, title keywords, and YAML aliases into Obsidian wikilinks. It runs on Windows, macOS, and Linux, and requires no Node.js installation to use. The manifest also permits mobile installation, though mobile has not been tested.

[คู่มือภาษาไทย](README.md)

## Install

1. Download the ZIP from this repository's Releases page and extract its `smart-auto-link` folder into `<Vault>/.obsidian/plugins/`.
2. Confirm that `<Vault>/.obsidian/plugins/smart-auto-link/main.js` and `manifest.json` exist directly inside that folder.
3. Reload Obsidian, then enable **Smart Auto Link** under **Settings → Community plugins**.

To install from a source checkout, run `npm ci && npm run build`, then copy `main.js` and `manifest.json` into the plugin folder.

## Use

Open the command palette with **Ctrl+P** (**Cmd+P** on macOS), then run **Smart Auto Link: Auto-link current note** or **Smart Auto Link: Auto-link entire vault**. The commands modify Markdown files directly. Try the vault command on a copy of your vault first; there is no vault-wide preview, backup, or undo in this version.

For example, with `Python.md` and `Artificial Intelligence.md` containing the YAML alias `AI`, the sentence `Python helps AI` becomes `[[Python]] helps [[Artificial Intelligence|AI]]`. Set **Minimum term length** to **2** to include `AI`; its default is 3.

The **Link keywords from note titles** setting is on by default and uses Unicode word segmentation across writing systems. For example, a note named วางแผนภาษีเงินเดือนในไทย can be linked from the word เงินเดือน in another note without adding an alias. You can turn this off in Settings.

To link on opening or saving a note, enable **Link when opening or saving a note** in plugin settings. It is off by default so you can choose when notes are changed. The plugin skips files with no new matches.

The plugin links every matching occurrence. It skips self-links and terms shared by multiple destination notes. It preserves existing links, code, frontmatter, URLs, comments, math, tags, and table lines. Unicode word segmentation supports many languages and writing systems; results can vary for uncommon phrases or languages with limited segmentation support on the device. Linking happens when you run a command, not automatically while typing.

## Languages

Commands, notices, and settings are available in English and Thai. **Settings → Smart Auto Link → Language** defaults to **Auto (Obsidian)**. You can choose **English** or **ไทย** explicitly. A changed command name may require reopening the command palette.

## Develop

```sh
npm ci
npm run typecheck
npm test
npm run build
```

Only `main.js` and `manifest.json` are required at runtime. The plugin does not transmit note content to a network service.

Obsidian API references: https://github.com/obsidianmd/obsidian-api and https://github.com/obsidianmd/obsidian-sample-plugin
