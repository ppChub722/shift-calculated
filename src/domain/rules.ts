import { OFF } from './types'

/** ค่าเริ่มต้นของกฎพัก: ทำหนึ่งกะแล้วเว้นสองกะ (เหมาะกับ 3 กะต่อวัน) */
export const DEFAULT_REST_SHIFTS = 2

/**
 * จำนวนกะที่ต้องเว้นได้มากสุดเมื่อมี S กะต่อวัน
 * เว้นถึง S กะ จะทำกะเดิมสองวันติดไม่ได้ จึงให้สูงสุดแค่ S − 1
 */
export function maxRestShifts(S: number): number {
  return Math.max(0, S - 1)
}

/** from / to / day เป็น index วันในรอบ (เริ่ม 0) wraps = ปัญหาอยู่ตรงรอยต่อไปรอบถัดไป */
export type PatternIssue =
  | { kind: 'unknown-shift'; day: number }
  | { kind: 'rest'; from: number; to: number; wraps: boolean }

/**
 * ตรวจ pattern แบบวนรอบ: ระหว่างสองกะที่ทำ ต้องเว้นอย่างน้อย restShifts กะ
 * คือ slot ห่างกัน ≥ restShifts + 1 รวมถึงคู่สุดท้ายกับคู่แรกของรอบถัดไป (บวก L × S)
 * shiftIds คือลำดับกะในหนึ่งวัน เช่น ['ช', 'บ', 'ด']
 * pattern มีหนึ่งช่องต่อวัน จึงได้กฎ "วันละไม่เกิน 1 กะ" เสมอ แม้ restShifts = 0
 */
export function checkPattern(
  seq: readonly string[],
  shiftIds: readonly string[],
  restShifts: number,
): PatternIssue | null {
  const S = shiftIds.length
  const minGap = restShifts + 1
  const slots: number[] = []
  for (let i = 0; i < seq.length; i++) {
    if (seq[i] === OFF) continue
    const s = shiftIds.indexOf(seq[i])
    if (s === -1) return { kind: 'unknown-shift', day: i }
    slots.push(i * S + s)
  }
  for (let j = 0; j < slots.length; j++) {
    const a = slots[j]
    const wraps = j + 1 === slots.length
    const b = wraps ? slots[0] + seq.length * S : slots[j + 1]
    if (b - a < minGap) {
      return {
        kind: 'rest',
        from: Math.floor(a / S),
        to: Math.floor(b / S) % seq.length,
        wraps,
      }
    }
  }
  return null
}

export function validatePattern(
  seq: readonly string[],
  shiftIds: readonly string[],
  restShifts: number,
): boolean {
  return checkPattern(seq, shiftIds, restShifts) === null
}

/** คู่ [กะวันนี้, กะวันรุ่งขึ้น] ที่ห้ามต่อกันภายใต้กฎพักนี้ ใช้อธิบายกฎในหน้าจอ */
export function forbiddenNextDay(S: number, restShifts: number): [number, number][] {
  const pairs: [number, number][] = []
  for (let a = 0; a < S; a++) {
    for (let b = 0; b < S; b++) {
      if (S + b - a < restShifts + 1) pairs.push([a, b])
    }
  }
  return pairs
}
