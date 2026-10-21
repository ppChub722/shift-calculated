import { OFF } from './types'

/** ทำหนึ่งกะแล้วเว้นสองกะ ถ้าจะเปลี่ยนกฎพักให้แก้ที่นี่ที่เดียว */
export const MIN_SLOT_GAP = 3

/** from / to / day เป็น index วันในรอบ (เริ่ม 0) wraps = ปัญหาอยู่ตรงรอยต่อไปรอบถัดไป */
export type PatternIssue =
  | { kind: 'unknown-shift'; day: number }
  | { kind: 'rest'; from: number; to: number; wraps: boolean }

/**
 * ตรวจ pattern แบบวนรอบ: slot ของกะที่ติดกันต้องห่างกันอย่างน้อย MIN_SLOT_GAP
 * รวมถึงคู่สุดท้ายกับคู่แรกของรอบถัดไป (บวก L × S)
 * shiftIds คือลำดับกะในหนึ่งวัน เช่น ['ช', 'บ', 'ด']
 */
export function checkPattern(
  seq: readonly string[],
  shiftIds: readonly string[],
): PatternIssue | null {
  const S = shiftIds.length
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
    if (b - a < MIN_SLOT_GAP) {
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
): boolean {
  return checkPattern(seq, shiftIds) === null
}
