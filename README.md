# shift-calculated

ระบบจัดตารางเวร 24 ชม. แบบรอบต่อเนื่อง เป็นเว็บ static ที่ทำงานในเบราว์เซอร์ทั้งหมด ไม่มี backend

> **สถานะ:** ใช้งานได้ครบ: ตั้งค่า 4 ขั้น บันทึกลง localStorage, solver จัดตารางใน Web Worker, แสดงตารางคน × วัน และ export CSV ยังไม่มี import json และ export json / xlsx

## เริ่มต้นใช้งาน

ต้องใช้ Node.js 20 ขึ้นไป

```sh
npm install
npm run dev       # dev server
npm test          # Vitest แบบ watch (ใช้ npx vitest run ถ้าจะรันครั้งเดียว)
npm run build     # build static ลง dist/
npm run lint      # oxlint
```

push ขึ้น `main` แล้ว GitHub Actions จะเทส, build และ deploy ไป GitHub Pages ให้อัตโนมัติ ([.github/workflows/deploy.yml](.github/workflows/deploy.yml))
เว็บอยู่ที่ https://ppchub722.github.io/shift-calculated/

## แนวคิดหลัก

ตารางเวรเดินต่อเนื่องรายวัน วันทำงานและวันหยุดไม่ผูกกับเสาร์อาทิตย์หรือเดือน

- **รอบของแต่ละคน = วันทำ + วันหยุด** ตั้งค่าได้อิสระ ไม่จำเป็นต้องเป็น 7 วัน เช่น ทำ 5 หยุด 2 (รอบ 7 วัน), ทำ 4 หยุด 2 (รอบ 6 วัน), ทำ 6 หยุด 3 (รอบ 9 วัน)
- **ช่วงเวลากำหนดด้วยวันที่จริง** คือวันเริ่ม + จำนวนวัน เช่น 30 หรือ 90 วัน วันเริ่มใช้ผูกวันลาและช่วงห้ามทำกะเข้ากับวันในตาราง
- **offset ของแต่ละคนมีค่า 0 ถึง L−1** คนที่ offset = 2 จะเริ่มวันแรกที่ตำแหน่งที่ 3 ของ pattern ถือว่าก่อนหน้านั้นเขาเดินตาม pattern มาตลอด กฎพักจึงยังถูกต้องตรงรอยต่อ
- วันลาและข้อห้ามรายคนทำให้แต่ละวันไม่เหมือนกัน solver จึงตรวจทุกวันตลอดช่วงเวลา ถ้าไม่มีข้อกำหนดรายคนเลย ตารางจะซ้ำทุก L วัน ใช้ตรวจเบื้องต้นแบบเร็วได้

## กฎและข้อตกลง

| เรื่อง | ข้อสรุป |
| --- | --- |
| จำนวนคนต่อกะ (demand) | กำหนดเป็นช่วง min–max ต่อกะ เช่น 1–2 คน |
| คนเกินผลรวม max ทุกกะ | ระบบฟ้องว่า "คนเกิน" ไม่แอบให้หยุดเพิ่ม |
| Pattern | ผู้ใช้กำหนดเอง ได้หลาย pattern เช่น `ช ช บ บ ด` |
| ช่วงเวลา | วันที่จริง: วันเริ่ม + จำนวนวัน |
| วันลาตกวันทำงาน | pattern เดินต่อตามปกติ วันนั้นคนนั้นหายไป ให้คนอื่นครอบคลุม |
| กฎพัก | ทำหนึ่งกะแล้วต้องเว้นอย่างน้อยสองกะ และทำได้วันละไม่เกิน 1 กะ |

### ข้อกำหนดรายคน (เวอร์ชันแรก)

- **วันลา:** ระบุเป็นวันที่ คนนั้นไม่ถูกนับในวันนั้น
- **ห้ามทำกะ X ในช่วงวันที่ Y–Z:** เช่น 1–15 พ.ย. ทำกะดึกไม่ได้ ระบุเป็นช่วงวันที่ ไม่ใช่เป็นเดือน

ข้อกำหนดแบบอื่นค่อยเพิ่มทีหลัง

### รอยต่อรอบ

กฎพักต้องตรวจแบบวนรอบ คือวันสุดท้ายของรอบต้องต่อกับวันแรกของรอบถัดไปได้โดยไม่ผิดกฎ ระบบตรวจ pattern ตั้งแต่ตอนกรอก config ไม่ต้องรอถึงตอนกดคำนวณ

- `ช ช บ บ ด O O` ผ่าน เพราะมีวันหยุดคั่นก่อนวนกลับไปกะเช้า
- `บ บ ด ด ช O O` ไม่ผ่าน เพราะดึกต่อด้วยเช้าโดยไม่ได้เว้นสองกะ

## วิธีคำนวณ

ระบบลดโจทย์เหลือแค่การเลือก (pattern, offset) ให้พนักงานแต่ละคน แล้วตรวจว่าทุกวันทุกกะมีจำนวนคนอยู่ในช่วง min–max ไม่ใช้ ML เพราะกฎเป็นข้อบังคับที่ต้องถูกทั้งหมด และต้องอธิบายได้ว่าทำไมจัดไม่ได้

### ขั้น 0: นิยาม

- `S` = จำนวนกะต่อวัน, `N` = จำนวนวันในตาราง, `L` = ความยาว pattern
- slot ของวัน d กะ s คือ `t = d × S + s` (นับ 0 ตั้งแต่กะแรกของวันแรก)
- คน p ที่ใช้ pattern k ที่ offset o ทำกะในวัน d ดังนี้

```
shift(p, d) = seq_k[(d + o) mod L]
```

### ขั้น 1: ตรวจ pattern ตอนกรอก — `domain/rules.ts`

แปลงวันทำงานใน pattern เป็น slot แล้วเช็คว่า slot ที่อยู่ติดกันห่างกันอย่างน้อย `MIN_SLOT_GAP` (= 3) แบบวนรอบ คือคู่สุดท้ายกับคู่แรกให้บวก `L × S` ก่อน

```ts
function validatePattern(seq, S): boolean {
  const slots = seq.flatMap((x, i) => x === 'OFF' ? [] : [i * S + shiftIndex(x)])
  for (let j = 0; j < slots.length; j++) {
    const a = slots[j]
    const b = j + 1 < slots.length ? slots[j + 1] : slots[0] + seq.length * S
    if (b - a < 3) return false
  }
  return true
}
```

- ตัวอย่างเมื่อ S = 3 (ช=0, บ=1, ด=2): ด → ช วันรุ่งขึ้น คือ slot 2 → 3 ห่าง 1 จึงไม่ผ่าน
- pattern มีหนึ่งช่องต่อวันอยู่แล้ว จึงได้กฎ "วันละไม่เกิน 1 กะ" มาโดยอัตโนมัติ
- ถ้าจะเปลี่ยนกฎพัก ให้แก้ที่ `MIN_SLOT_GAP` ที่เดียว

### ขั้น 2: สร้างตัวเลือกของแต่ละคน — `solver/candidates.ts`

ไล่ทุกคน ทุก pattern และทุก offset แล้วสร้างแถวยาว N วัน

```
for each employee e:
  for each pattern k, offset o in 0..L-1:
    row = []
    for d in 0..N-1:
      sh = seq_k[(d + o) % L]
      if (isLeave(e, d)) row[d] = 'LEAVE'        // ลา = pattern เดินต่อ แต่วันนั้นไม่นับ
      else if (sh !== 'OFF' && isBlocked(e, sh, d)) → ทิ้งตัวเลือกนี้
      else row[d] = sh
    candidates[e].push(row)
```

- เช็ควันลาก่อนข้อห้าม เพราะวันที่ลาไม่ได้ทำกะจริง และวันลาที่ตรงกับวันหยุดก็แสดงเป็น "ลา"
- ไม่ใช้ pattern ที่ผิดกฎพักหรือไม่มีวันทำงานเลย
- ตัดแถวที่ซ้ำกันออก
- คนที่ไม่มีตัวเลือกเหลือเลย ให้ฟ้องทันทีว่าคนนั้นติดข้อห้ามทุกรูปแบบ

### ขั้น 3: ตรวจเบื้องต้นก่อนค้นหา — `solver/precheck.ts`

1. **คนเกิน:** ต่อให้ทุกคนเลือกแบบที่ทำน้อยสุด จำนวนกะรวมต้องไม่เกินผลรวม max ของทุกกะ × N
2. **กะล้น:** ต่อให้ทุกคนเลือกแบบที่ทำกะ s น้อยสุด จำนวนกะ s รวมต้องไม่เกิน max ของกะ s × N
3. **คนไม่พอรายวัน:** ทุกวัน d จำนวนคนที่มีตัวเลือกทำงานวันนั้นได้ ต้องไม่น้อยกว่าผลรวม min ของวันนั้น
4. **กะที่ไม่มีใครเข้าได้:** ทุก (d, s) นับ `potential[d][s]` = จำนวนคนที่มีอย่างน้อยหนึ่งตัวเลือกที่ทำกะ s ในวัน d ถ้าน้อยกว่า min แปลว่าเป็นไปไม่ได้แน่นอน ให้รายงานวันและกะนั้น
5. **กะไม่พอทั้งช่วง:** ต่อให้ทุกคนเลือกแบบที่ทำกะ s มากสุด จำนวนกะ s รวมต้องไม่น้อยกว่า min ของกะ s × N

ไม่ผ่านข้อใดข้อหนึ่ง ให้รายงานทันทีโดยไม่เข้าขั้น 4 แต่ยังหาตารางที่ใกล้เคียงที่สุดให้ดู (ขั้น 5) พร้อมจุดที่ขาดหรือเกิน

### ขั้น 4: Backtracking — `solver/search.ts`

```
cov[d][s] = 0
order = employees เรียงตามจำนวนตัวเลือก น้อย → มาก

function search(i):
  if (i === order.length) return allMinMet(cov)
  e = order[i]
  ลบ e ออกจาก potential
  for row in candidates[e] เรียงตาม score มาก → น้อย:
    apply(row)                                   // cov += 1 ตามแถว ไม่นับ OFF และ LEAVE
    if (!overMax(cov) && canStillReachMin(cov, potential))
      if (search(i + 1)) return true
    undo(row)
  คืน e เข้า potential
  return false
```

- **overMax:** มีกะใดเกิน max ให้ตัดทิ้งทันที
- **canStillReachMin:** ทุก (d, s) ต้องได้ `cov + potential ≥ min` ถ้าไม่ได้ แปลว่าทางนี้ไม่มีทางรอด
- **score ของตัวเลือก:** จำนวนช่องที่ยังขาด min ที่แถวนี้เติมได้ ลบด้วยจำนวนช่องที่จะดันให้ชน max
- **คนที่ตัวเลือกเหมือนกันทุกอย่าง** สลับกันได้ จึงบังคับให้เลือก index ไม่ลดลง จะได้ไม่ค้นทางซ้ำ
- ถ้าค้นหาช้า ให้ปรับลำดับคนและสูตร score ก่อน

### ขั้น 5: Time limit และคำตอบที่ดีที่สุด — `solver/solver.ts`, `solver/worker.ts`

- ถ้าหาแบบที่ครบไม่เจอ (หมดเวลา, ค้นครบแล้วไม่มี, หรือไม่ผ่านขั้น 3) ให้หาตารางที่ penalty ต่ำสุด โดย penalty = ผลรวมคนที่ขาดจาก min + ผลรวมคนที่เกินจาก max เริ่มจาก greedy แล้วไล่เปลี่ยนตัวเลือกทีละคนจนไม่ดีขึ้น
- คืนตารางนั้นพร้อมรายการ shortage เช่น "12 พ.ย. กะดึก ขาด 1 คน"
- สถานะผล: `solved` ครบทุกช่อง, `partial` หมดเวลาก่อนหาเจอ, `infeasible` พิสูจน์ได้ว่าครบไม่ได้
- รันใน Web Worker ส่ง progress กลับเป็นระยะ และยกเลิกได้ (UI terminate worker ทิ้ง)

ถ้าวันหน้า backtracking ช้าเกินไป ให้เปลี่ยนไปใช้ ILP solver (เช่น HiGHS แบบ WASM)

### Test case อ้างอิง

กำหนด 3 กะ แต่ละกะ min 1 max 2 และใช้ pattern `ช ช บ บ ด OFF OFF` (L = 7)

| จำนวนคน | ผล | เหตุผล |
| --- | --- | --- |
| 7 คน offset 0–6 | ผ่าน | ทุกวันได้ ช 2, บ 2, ด 1 |
| 5 คน | ไม่ผ่านขั้น 3 ข้อ 5 | ทุกคนทำดึก 1 วันต่อ 7 วัน ต้องใช้ 7 คนถึงจะมีดึกทุกวัน แต่มีแค่ 5 คน |
| 8 คน | ไม่ผ่านขั้น 3 ข้อ 2 | ทุกคนทำเช้า 2 วันต่อ 7 วัน 8 คนได้เช้าเกิน max 2 คนต่อวัน |

กรณี 5 คน แก้ได้โดยเพิ่ม pattern อย่าง `ด ด ด ด ด OFF OFF` ทุกกรณีอยู่ใน [src/solver/solver.test.ts](src/solver/solver.test.ts)

## Tech stack

Vite + React + TypeScript build เป็น static แล้ว deploy บน GitHub Pages หรือ Cloudflare Pages

| ส่วน | เลือก | หมายเหตุ |
| --- | --- | --- |
| Build | Vite + React + TS | build เป็น static |
| State | useReducer หรือ Zustand | config ก้อนเดียว |
| Validation | Zod | schema เดียวใช้ทั้งตอน import และตอนอ่าน localStorage |
| Solver | TS ล้วนใน Web Worker | UI ไม่ค้าง และหยุดตาม time limit ได้ |
| XLSX | SheetJS แบบ lazy-load | ติดตั้งจาก CDN ของ SheetJS ไม่ใช่แพ็กเกจ `xlsx` บน npm ที่ค้างเวอร์ชันเก่า |
| Test | Vitest | เน้นเทส solver และกฎต่าง ๆ |

## Import / Storage / Export

- **Import:** json เท่านั้น เป็น config ทั้งก้อน ตรวจด้วย Zod
- **localStorage:** เก็บแค่ config พร้อม `version` ห่อการอ่านเขียนด้วย try/catch ถ้าตรวจไม่ผ่านให้แจ้งผู้ใช้ ไม่ล้างทิ้งเฉย ๆ
- **Export json:** `{ config, result }` ซึ่ง import กลับเข้ามาได้
- **Export csv:** ตารางคน × วัน ใส่ BOM `﻿` ไว้หน้าไฟล์
- **Export xlsx:** sheet ตารางเวร, sheet สรุป coverage ต่อวันต่อกะ และ sheet shortage (ถ้ามี)

## โครงสร้างโฟลเดอร์

```
src/
  domain/   types.ts, schema.ts, rules.ts, dates.ts, defaults.ts
  solver/   solver.ts, candidates.ts, precheck.ts, search.ts, worker.ts
  io/       import.ts, storage.ts, download.ts, export-csv.ts, export-xlsx.ts, export-json.ts
  ui/       useConfig, PeriodStep, ShiftStep, PatternStep, EmployeeStep, ReviewStep,
            RosterTable, ShortageReport
```

## Data model

```ts
type Config = {
  version: 1
  startDate: string          // "2026-11-01"
  days: number               // 30 | 90
  shifts: { id: string; name: string; min: number; max: number }[]
  patterns: { id: string; name: string; seq: (string | 'OFF')[] }[]
  employees: {
    id: string; name: string
    leaves: string[]                                   // ISO date
    blocked: { shiftId: string; from: string; to: string }[]
  }[]
  solver: { timeLimitMs: number }
}
```

วันที่เก็บเป็น string `YYYY-MM-DD` เสมอ ภายใน solver ใช้เป็น day index 0..N−1 และไม่ใช้ `Date` คำนวณ เพื่อเลี่ยงปัญหาวันเลื่อนจาก timezone
