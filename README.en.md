# Smart Auto Link

[ภาษาไทย](README.md) · [Latest release](https://github.com/Bossy8bit/smart-auto-link/releases/latest)

Smart Auto Link scans the vault and automatically creates cross-note links from note titles, aliases, and terms defined with **==highlights==** or a **keywords** property. Matching text links to its destination note across writing systems.

## Example

In **Taxes.md**:

~~~md
==salary== ==เงินเดือน== ==税==
~~~

Another note contains:

~~~md
Read about salary, เงินเดือน and 税.
~~~

When Obsidian opens the vault or a note is saved, it automatically creates:

~~~md
Read about [[Taxes|salary]], [[Taxes|เงินเดือน]] and [[Taxes|税]].
~~~

The original highlights in Taxes.md remain intact. There are no self-links; Obsidian's Backlinks panel shows the notes linking into Taxes.md.

## Use

1. Enable Smart Auto Link under **Settings → Community plugins**.
2. On the next vault startup, it scans and links the whole vault, then links notes as they are opened or saved.
3. Add specific destination terms with ==highlights== or a **keywords** property. Note titles and aliases also provide automatic link terms.
4. Open **Open graph view** to see the links. You can still run **Smart Auto Link: Auto-link entire vault** from Ctrl+P / Cmd+P.

Automatic linking is on by default. It scans the full vault at startup, then links notes on open/save and updates other notes when keyword definitions change.

## Keywords without highlights

Add a **keywords** property of type **List**, or put this YAML at the top of the destination note:

~~~yaml
---
keywords:
  - salary
  - AI
  - 税
  - ضريبة
---
~~~

No separate salary or AI note is required. The note declaring these keywords is the destination. Explicit keywords and highlights ignore the minimum-length setting.

## Install or update

1. Download and extract smart-auto-link.zip from Releases.
2. Copy its smart-auto-link folder into Vault/.obsidian/plugins/. The folder must directly contain main.js and manifest.json.
3. Disable and re-enable Smart Auto Link under Community plugins, or restart Obsidian, to load the new code.
4. Check the loaded version at the top of plugin settings.

Windows, macOS and Linux are supported without installing Node.js. The manifest permits mobile, but actual mobile devices have not been tested.

## Matching behavior

- Explicit highlighted/Properties keywords take precedence over inferred terms and note names.
- If multiple notes define the same term, the ambiguous term is skipped.
- Source highlights, existing links, code, frontmatter, URLs, and protected Markdown remain intact.
- Highlights inside code, links, comments or math are not definitions. Use highlights around plain text.
- Repeated runs do not nest links. Removing/changing a definition does not remove or retarget previously created links.
- Whole-word matching uses the device's Unicode word segmenter. Disable it for literal substring matching if segmentation does not fit your language.
- Matching does not translate languages: tax and ภาษี are separate terms. Declare both when they should point to the same note.
- Full note names, distinctive words or phrases from titles, and aliases are automatic link terms. Ambiguous terms shared by multiple destinations are skipped.
- Some wikilink-reserved characters in terms or target filenames are skipped.

Commands modify Markdown files. There is no vault-wide undo feature. Note contents are never sent to a network service.

## Changelog

- **v1.4.0 (latest):** Automatic cross-note linking is now on by default — full-vault scan at startup, then links notes on open/save using note titles, aliases, ==highlights==, and keywords. Old installations migrate once; later user settings are preserved.
- **v1.3.0:** Keywords via ==highlights== or a keywords property, one-click Link entire vault, and indexed keyword counts.
- **v1.2.1:** Clearer no-change notices; existing links stay and files are not rewritten.
- **v1.2.0:** Opt-in automatic linking on note open/save (off by default), plus commands that report when no matches are found.
- **v1.1.0:** Multilingual title-keyword derivation using Unicode word segmentation; Thai and English UI.
- **v1.0:** First release — highlight/keyword scanning and cross-note linking.

## Develop

~~~sh
npm ci
npm run typecheck
npm test
npm run build
~~~

Tests build the current bundle first and cover Markdown safety, Unicode highlights, destination selection and mock-vault workflows.

API reference: https://github.com/obsidianmd/obsidian-api
