import { OFF, type Shift } from '../domain/types'

const TONES = 6
const LEADING_VOWELS = /^[เแโใไ]+/

/** ตัวอักษรแรกที่อ่านออก: "เช้า" → "ช", "บ่าย" → "บ" */
export function firstLetter(name: string): string {
  const s = name.trim().replace(LEADING_VOWELS, '')
  return Array.from(s)[0] ?? '?'
}

export function toneClass(shifts: readonly Shift[], id: string): string {
  const i = shifts.findIndex((s) => s.id === id)
  return i === -1 ? 'tone-off' : `tone-${i % TONES}`
}

export function toneByIndex(i: number): string {
  return `tone-${i % TONES}`
}

export function shiftLabel(shifts: readonly Shift[], id: string): string {
  if (id === OFF) return 'หยุด'
  return shifts.find((s) => s.id === id)?.name ?? 'ไม่รู้จัก'
}

export function shiftShort(shifts: readonly Shift[], id: string): string {
  if (id === OFF) return 'หยุด'
  const s = shifts.find((x) => x.id === id)
  return s ? firstLetter(s.name) : '?'
}
