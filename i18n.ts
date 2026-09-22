import { getLanguage } from 'obsidian';

export type Language = 'auto' | 'en' | 'th';
export type MessageKey = keyof typeof messages.en;

const messages = {
  en: {
    currentCommand: 'Auto-link current note',
    vaultCommand: 'Auto-link entire vault',
    noFile: 'No active Markdown note.',
    currentDone: (name: string) => `Auto-linked: ${name}`,
    noMatches: 'No new links to add. Existing links are unchanged.',
    failed: 'Auto-link failed. See developer console for details.',
    vaultStopped: (path: string, count: number) => `Stopped at ${path}. ${count} notes changed; remaining notes untouched.`,
    vaultDone: (changed: number, total: number) => `Auto-link finished. ${changed}/${total} notes changed.`,
    vaultUnchanged: (total: number) => `No new links to add in ${total} notes. Existing links are unchanged.`,
    language: 'Language',
    languageDesc: 'Choose the language for commands, notices, and settings. Auto follows Obsidian.',
    auto: 'Auto (Obsidian)',
    english: 'English',
    thai: 'ไทย',
    keywordHeading: 'Keywords and highlights',
    keywordHelp: 'Write ==term== in the destination note, or add a keywords property. The same text in other notes will link back here. Supports any language, including short terms.',
    highlights: 'Use ==highlights== as keywords',
    highlightsDesc: 'Highlighted text defines a keyword pointing to the note that contains it. Keep the source highlight unchanged.',
    keywords: 'Use the keywords property',
    keywordsDesc: 'Add a list named keywords in note Properties, for example: tax, AI, 税.',
    applyKeywords: 'Link matching text across the vault',
    applyKeywordsDesc: 'Scan definitions and apply links now. A term defined in multiple notes is skipped.',
    applyNow: 'Link entire vault now',
    keywordCount: (count: number) => count ? 'Keyword definitions indexed: ' + count + '.' : 'No keyword definitions found. Add ==term== or a keywords property to a destination note.',
    automatic: 'Link when opening or saving a note',
    automaticDesc: 'On by default. Scans the whole vault on startup, then links notes as they are opened or saved. Title terms, highlights, and keywords can connect notes in Graph.',
    titleKeywords: 'Link keywords from note titles',
    titleKeywordsDesc: 'Find distinctive words and phrases in note titles automatically. Shared terms are skipped.',
    aliases: 'Use aliases',
    aliasesDesc: 'Use aliases from YAML frontmatter as automatic link terms.',
    caseSensitive: 'Case sensitive',
    caseSensitiveDesc: 'Require capitalization to match exactly.',
    wholeWord: 'Whole word matching',
    wholeWordDesc: 'Avoid matching terms that are part of a larger word.',
    minLength: 'Minimum term length',
    minLengthDesc: 'Minimum for note names, aliases, and inferred terms. Does not limit explicit highlights or keywords.',
  },
  th: {
    currentCommand: 'สร้างลิงก์ในโน้ตปัจจุบัน',
    vaultCommand: 'สร้างลิงก์ทั้ง Vault',
    noFile: 'ไม่มีโน้ต Markdown ที่เปิดอยู่',
    currentDone: (name: string) => `สร้างลิงก์แล้ว: ${name}`,
    noMatches: 'ไม่มีลิงก์ใหม่ให้เพิ่ม ลิงก์เดิมยังอยู่',
    failed: 'สร้างลิงก์ไม่สำเร็จ ดูรายละเอียดใน developer console',
    vaultStopped: (path: string, count: number) => `หยุดที่ ${path} แก้ไขแล้ว ${count} โน้ต โน้ตที่เหลือยังไม่ถูกแก้ไข`,
    vaultDone: (changed: number, total: number) => `สร้างลิงก์เสร็จแล้ว แก้ไข ${changed}/${total} โน้ต`,
    vaultUnchanged: (total: number) => `ตรวจ ${total} โน้ตแล้ว ไม่มีลิงก์ใหม่ให้เพิ่ม ลิงก์เดิมยังอยู่`,
    language: 'ภาษา',
    languageDesc: 'เลือกภาษาของคำสั่ง ข้อความแจ้งเตือน และการตั้งค่า อัตโนมัติจะใช้ภาษาของ Obsidian',
    auto: 'อัตโนมัติ (Obsidian)',
    english: 'English',
    thai: 'ไทย',
    keywordHeading: 'คำสำคัญและไฮไลต์',
    keywordHelp: 'เขียน ==คำสำคัญ== ในโน้ตปลายทาง หรือเพิ่ม Properties ชื่อ keywords คำเดียวกันในโน้ตอื่นจะลิงก์กลับมาที่โน้ตนี้ รองรับทุกภาษา รวมถึงคำสั้น',
    highlights: 'ใช้ ==ไฮไลต์== เป็นคำสำคัญ',
    highlightsDesc: 'ข้อความไฮไลต์เป็นคำสำคัญที่ชี้กลับมายังโน้ตที่มีไฮไลต์ โดยคงไฮไลต์ต้นฉบับไว้',
    keywords: 'ใช้ Properties ชื่อ keywords',
    keywordsDesc: 'เพิ่มรายการ keywords ใน Properties ของโน้ต เช่น ภาษี, AI, 税',
    applyKeywords: 'สร้างลิงก์จากคำที่ตรงกันทั้ง Vault',
    applyKeywordsDesc: 'สแกนคำสำคัญแล้วสร้างลิงก์ทันที ข้ามคำที่ถูกกำหนดไว้ในหลายโน้ต',
    applyNow: 'สร้างลิงก์ทั้ง Vault ตอนนี้',
    keywordCount: (count: number) => count ? 'พบคำสำคัญที่กำหนดไว้ ' + count + ' รายการ' : 'ยังไม่พบคำสำคัญ เพิ่ม ==คำ== หรือ Properties ชื่อ keywords ในโน้ตปลายทาง',
    automatic: 'ลิงก์เมื่อเปิดหรือบันทึกโน้ต',
    automaticDesc: 'เปิดเป็นค่าเริ่มต้น สแกนทั้ง Vault ตอนเริ่ม แล้วสร้างลิงก์เมื่อเปิดหรือบันทึกโน้ต ใช้คำจากชื่อโน้ต ไฮไลต์ และ keywords เป็นจุดเชื่อมใน Graph',
    titleKeywords: 'ลิงก์คำสำคัญจากชื่อโน้ต',
    titleKeywordsDesc: 'ดึงคำหรือวลีจากชื่อโน้ตให้อัตโนมัติ และข้ามคำที่ชี้ได้หลายโน้ต',
    aliases: 'ใช้ชื่ออื่น (aliases)',
    aliasesDesc: 'ใช้ aliases ใน YAML frontmatter เป็นคำค้นสำหรับสร้างลิงก์',
    caseSensitive: 'แยกตัวพิมพ์ใหญ่เล็ก',
    caseSensitiveDesc: 'จับคู่เฉพาะคำที่ใช้ตัวพิมพ์ตรงกัน',
    wholeWord: 'จับคู่ทั้งคำ',
    wholeWordDesc: 'ข้ามคำที่เป็นส่วนหนึ่งของคำยาวกว่า',
    minLength: 'ความยาวคำขั้นต่ำ',
    minLengthDesc: 'ใช้กับชื่อโน้ต aliases และคำที่ดึงอัตโนมัติ ไม่จำกัดความยาวไฮไลต์หรือ keywords ที่กำหนดเอง',
  },
};

export function resolveLanguage(language: Language): 'en' | 'th' {
  if (language !== 'auto') return language;
  return getLanguage().toLowerCase().startsWith('th') ? 'th' : 'en';
}

export function translator(language: Language): typeof messages.en {
  return messages[resolveLanguage(language)];
}
