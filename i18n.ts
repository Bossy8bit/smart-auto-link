import { getLanguage } from 'obsidian';

export type Language = 'auto' | 'en' | 'th';
export type MessageKey = keyof typeof messages.en;

const messages = {
  en: {
    currentCommand: 'Auto-link current note',
    vaultCommand: 'Auto-link entire vault',
    noFile: 'No active Markdown note.',
    currentDone: (name: string) => `Auto-linked: ${name}`,
    failed: 'Auto-link failed. See developer console for details.',
    vaultStopped: (path: string, count: number) => `Stopped at ${path}. ${count} notes changed; remaining notes untouched.`,
    vaultDone: (changed: number, total: number) => `Auto-link finished. ${changed}/${total} notes changed.`,
    language: 'Language',
    languageDesc: 'Choose the language for commands, notices, and settings. Auto follows Obsidian.',
    auto: 'Auto (Obsidian)',
    english: 'English',
    thai: 'ไทย',
    aliases: 'Use aliases',
    aliasesDesc: 'Use aliases from YAML frontmatter as automatic link terms.',
    caseSensitive: 'Case sensitive',
    caseSensitiveDesc: 'Require capitalization to match exactly.',
    wholeWord: 'Whole word matching',
    wholeWordDesc: 'Avoid matching terms that are part of a larger word.',
    minLength: 'Minimum term length',
    minLengthDesc: 'Ignore note names and aliases shorter than this. Set to 2 for AI.',
  },
  th: {
    currentCommand: 'สร้างลิงก์ในโน้ตปัจจุบัน',
    vaultCommand: 'สร้างลิงก์ทั้ง Vault',
    noFile: 'ไม่มีโน้ต Markdown ที่เปิดอยู่',
    currentDone: (name: string) => `สร้างลิงก์แล้ว: ${name}`,
    failed: 'สร้างลิงก์ไม่สำเร็จ ดูรายละเอียดใน developer console',
    vaultStopped: (path: string, count: number) => `หยุดที่ ${path} แก้ไขแล้ว ${count} โน้ต โน้ตที่เหลือยังไม่ถูกแก้ไข`,
    vaultDone: (changed: number, total: number) => `สร้างลิงก์เสร็จแล้ว แก้ไข ${changed}/${total} โน้ต`,
    language: 'ภาษา',
    languageDesc: 'เลือกภาษาของคำสั่ง ข้อความแจ้งเตือน และการตั้งค่า อัตโนมัติจะใช้ภาษาของ Obsidian',
    auto: 'อัตโนมัติ (Obsidian)',
    english: 'English',
    thai: 'ไทย',
    aliases: 'ใช้ชื่ออื่น (aliases)',
    aliasesDesc: 'ใช้ aliases ใน YAML frontmatter เป็นคำค้นสำหรับสร้างลิงก์',
    caseSensitive: 'แยกตัวพิมพ์ใหญ่เล็ก',
    caseSensitiveDesc: 'จับคู่เฉพาะคำที่ใช้ตัวพิมพ์ตรงกัน',
    wholeWord: 'จับคู่ทั้งคำ',
    wholeWordDesc: 'ข้ามคำที่เป็นส่วนหนึ่งของคำยาวกว่า',
    minLength: 'ความยาวคำขั้นต่ำ',
    minLengthDesc: 'ข้ามชื่อโน้ตและ aliases ที่สั้นกว่าค่านี้ ถ้าต้องการ AI ให้ตั้งเป็น 2',
  },
};

export function resolveLanguage(language: Language): 'en' | 'th' {
  if (language !== 'auto') return language;
  return getLanguage().toLowerCase().startsWith('th') ? 'th' : 'en';
}

export function translator(language: Language): typeof messages.en {
  return messages[resolveLanguage(language)];
}
