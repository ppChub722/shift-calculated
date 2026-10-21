export const OFF = 'OFF'

/** วันที่รูปแบบ YYYY-MM-DD เสมอ ไม่ใช้ Date คำนวณ เพื่อเลี่ยงปัญหา timezone */
export type IsoDate = string

export type Shift = { id: string; name: string; min: number; max: number }

/** seq แต่ละช่องคือ shift id หรือ OFF หนึ่งช่องต่อหนึ่งวัน */
export type Pattern = { id: string; name: string; seq: string[] }

export type Blocked = { shiftId: string; from: IsoDate; to: IsoDate }

export type Employee = {
  id: string
  name: string
  leaves: IsoDate[]
  blocked: Blocked[]
}

export type Config = {
  version: 1
  startDate: IsoDate
  days: number
  shifts: Shift[]
  patterns: Pattern[]
  employees: Employee[]
  solver: { timeLimitMs: number }
}
