import { todayIso } from './dates'
import { OFF, type Config, type Employee, type Shift } from './types'

export function defaultShifts(): Shift[] {
  return [
    { id: 'morning', name: 'เช้า', min: 1, max: 2 },
    { id: 'afternoon', name: 'บ่าย', min: 1, max: 2 },
    { id: 'night', name: 'ดึก', min: 1, max: 2 },
  ]
}

/** ไล่กะตามลำดับ กะละ 2 วัน (กะสุดท้าย 1 วัน) แล้วหยุด 2 เช่น ช ช บ บ ด OFF OFF */
export function rotationSeq(shiftIds: readonly string[]): string[] {
  const work = shiftIds.flatMap((id, i) =>
    i === shiftIds.length - 1 ? [id] : [id, id],
  )
  return [...work, OFF, OFF]
}

/** กะเดียวทำ 5 หยุด 2 */
export function singleShiftSeq(shiftId: string): string[] {
  return [...Array<string>(5).fill(shiftId), OFF, OFF]
}

export function defaultConfig(): Config {
  const shifts = defaultShifts()
  return {
    version: 1,
    startDate: todayIso(),
    days: 30,
    shifts,
    patterns: [
      {
        id: crypto.randomUUID(),
        name: 'หมุนเวียน',
        seq: rotationSeq(shifts.map((s) => s.id)),
      },
    ],
    employees: [],
    solver: { timeLimitMs: 10_000 },
  }
}

const SAMPLE_NAMES = ['ต้น', 'ฝน', 'แบม', 'กอล์ฟ', 'มายด์', 'เจ', 'นุ่น']

export function sampleEmployees(): Employee[] {
  return SAMPLE_NAMES.map((name) => ({
    id: crypto.randomUUID(),
    name,
    leaves: [],
    blocked: [],
  }))
}
