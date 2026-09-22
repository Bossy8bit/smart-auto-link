# Smart Auto Link

[English guide](README.en.md)

ปลั๊กอิน Obsidian เปลี่ยนชื่อโน้ตและ aliases เป็น wikilinks โดยสั่งผ่าน Command palette รองรับ Windows / macOS / Linux และไม่มี Node.js dependency ขณะใช้งานใน Obsidian (manifest อนุญาต mobile แต่ยังไม่ได้ทดสอบบนอุปกรณ์จริง)

## ติดตั้ง

1. แตกไฟล์ `smart-auto-link.zip` แล้วนำโฟลเดอร์ `smart-auto-link` ไปไว้ที่ `<Vault>/.obsidian/plugins/`
2. ตรวจให้มี `<Vault>/.obsidian/plugins/smart-auto-link/main.js` และ `manifest.json` โดยไม่มีโฟลเดอร์ซ้อนอีกชั้น
3. Reload Obsidian แล้วเปิด Settings → Community plugins → Smart Auto Link
4. กด Ctrl+P (macOS: Cmd+P) เลือก **Smart Auto Link: Auto-link current note** หรือ **Auto-link entire vault**

คำสั่งแก้เนื้อหาไฟล์จริง ควรทดลองกับ vault สำเนาก่อนใช้ทั้ง vault รุ่นนี้ไม่มี preview, backup หรือ undo ของทั้ง vault ในตัว และยังไม่ทำงานอัตโนมัติระหว่างพิมพ์

## ใช้ง่ายโดยไม่ต้องเพิ่ม alias

เปิด **Settings → Smart Auto Link → ลิงก์คำสำคัญจากชื่อโน้ต** (เปิดไว้เป็นค่าเริ่มต้น) แล้วเรียกคำสั่ง **สร้างลิงก์ในโน้ตปัจจุบัน** หรือ **สร้างลิงก์ทั้ง Vault** ปลั๊กอินจะดึงคำจากชื่อโน้ตให้อัตโนมัติ เช่น จาก `วางแผนภาษีเงินเดือนในไทย.md` จะจับคำ `เงินเดือน` ในโน้ตอื่นแล้วลิงก์กลับมาที่ไฟล์นี้ คำทั่วไปหรือคำที่ชี้ได้หลายโน้ตจะถูกข้าม

การดึงคำใช้ตัวแบ่งคำ Unicode ของอุปกรณ์ จึงรองรับตัวอักษรหลายภาษา รวมถึงไทย อังกฤษ จีน ญี่ปุ่น อาหรับ และรัสเซีย คุณภาพการแบ่งคำอาจต่างกันตามภาษาและอุปกรณ์

## การทำงาน

- ชื่อโน้ต, คำสำคัญที่ดึงจากชื่อโน้ตหลายภาษา และ aliases จาก YAML เป็นคำค้น เรียงชื่อยาวก่อน
- เก็บตัวพิมพ์เดิม และใช้ path ของโน้ตเพื่อระบุปลายทาง
- ข้ามการลิงก์หาโน้ตตัวเอง และข้ามคำที่มีหลายปลายทาง
- ลิงก์ทุกตำแหน่งที่ตรงเงื่อนไข รันซ้ำแล้วไม่สร้างลิงก์ซ้อน
- ไม่แก้ code, frontmatter, wikilinks, Markdown links/images, reference links, URL, comments, math, tags และบรรทัดที่มี `|` (รวมตาราง)
- ส่วนข้อความที่มี Markdown escape/entity จะถูกข้ามแบบอนุรักษ์นิยม
- ชื่อที่มีอักขระพิเศษของ wikilink เช่น `#`, `^`, `|`, `[` หรือ `]` ถูกข้าม

ตั้งค่า Use aliases, Case sensitive, Whole word matching และ Minimum term length ได้ ค่าเริ่มต้นความยาวขั้นต่ำคือ 3 ถ้าต้องการ alias `AI` ให้ปรับเป็น **2**

Whole word ใช้การแบ่งคำแบบ Unicode ของระบบ รองรับหลายภาษา รวมถึงภาษาไทย จีน ญี่ปุ่น อาหรับ และภาษาอื่นที่ระบบแบ่งคำได้ เช่น เงินเดือนในข้อความที่เขียนติดกันก็จับคู่ได้ แต่ผลการแบ่งคำอาจไม่ตรงกับทุกกรณี

## ภาษา

คำสั่ง ข้อความแจ้งเตือน และหน้าตั้งค่ารองรับภาษาไทยและอังกฤษ ไปที่ **Settings → Smart Auto Link → Language** ค่าเริ่มต้น **Auto (Obsidian)** ใช้ภาษาของ Obsidian หรือเลือก **ไทย** / **English** เอง หลังเปลี่ยนภาษาให้เปิด Command palette ใหม่เพื่อดูชื่อคำสั่ง

## พัฒนา

```sh
npm ci
npm run typecheck
npm test
npm run build
```

ไฟล์ติดตั้งต้องการเพียง `main.js` และ `manifest.json`; ไม่ต้องติดตั้ง Node.js บนเครื่องผู้ใช้งาน ไม่มีการส่งเนื้อหาโน้ตออกเครือข่าย

อ้างอิง API: https://github.com/obsidianmd/obsidian-api และ https://github.com/obsidianmd/obsidian-sample-plugin
