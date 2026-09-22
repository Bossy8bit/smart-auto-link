# Smart Auto Link

[ภาษาไทย](README.md) · [Latest release](https://github.com/Bossy8bit/smart-auto-link/releases/latest)

Define important terms using **==highlights==** or a **keywords** property in the destination note. Matching text in other notes links back to that note. Explicit terms support all writing systems, short words, single characters, and emoji.

## Example

In **Taxes.md**:

~~~md
==salary== ==เงินเดือน== ==税==
~~~

Another note contains:

~~~md
Read about salary, เงินเดือน and 税.
~~~

After linking:

~~~md
Read about [[Taxes|salary]], [[Taxes|เงินเดือน]] and [[Taxes|税]].
~~~

The original highlights in Taxes.md remain intact. There are no self-links; Obsidian's Backlinks panel shows the notes linking into Taxes.md.

## Use

1. Write ==a plain-text term== in the note you want other notes to link to, then save it.
2. Open **Settings → Smart Auto Link**. **Use ==highlights== as keywords** is enabled by default.
3. Click **Link entire vault now**, or run **Smart Auto Link: Auto-link entire vault** from Ctrl+P / Cmd+P.
4. The notice reports changed notes and indexed keyword definitions. If it finds zero definitions, check for two equals signs on each side of your term.

For ongoing changes, opt into **Link when opening or saving a note** (off by default). Saving a changed keyword definition updates matching text in other notes; ordinary open/save events process that note.

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
- Traditional note-name and alias matching remain available. Guessing keywords from titles is off by default for new settings.
- Some wikilink-reserved characters in terms or target filenames are skipped.

Commands modify Markdown files. There is no vault-wide undo feature. Note contents are never sent to a network service.

## Develop

~~~sh
npm ci
npm run typecheck
npm test
npm run build
~~~

Tests build the current bundle first and cover Markdown safety, Unicode highlights, destination selection and mock-vault workflows.

API reference: https://github.com/obsidianmd/obsidian-api
