/** ค่าในช่องของแถว: >= 0 คือ index กะ */
export const CELL_OFF = -1
export const CELL_LEAVE = -2

export type Candidate = {
  patternId: string
  offset: number
  /** ยาว N วัน: index กะ, CELL_OFF หรือ CELL_LEAVE */
  cells: number[]
  /** slot t = d × S + s ที่ทำงานจริง (ไม่รวมวันลา) */
  slots: number[]
}

export type Problem = {
  N: number
  S: number
  T: number
  /** min / max ต่อ slot t */
  min: number[]
  max: number[]
  employeeIds: string[]
  /** ตัวเลือกของพนักงานแต่ละคน ตาม index ใน employeeIds */
  candidates: Candidate[][]
  /** แถวสำรองสำหรับคนที่ไม่มีตัวเลือก: หยุดทุกวัน ยกเว้นวันลา */
  idleCells: number[][]
}

export type Reason =
  | { kind: 'no-candidate'; employeeId: string }
  | { kind: 'too-many-people'; minWork: number; capacity: number }
  | { kind: 'day-short'; day: number; available: number; need: number }
  | { kind: 'slot-unreachable'; day: number; shift: number; potential: number; need: number }
  | { kind: 'shift-capacity'; shift: number; capacity: number; need: number }
  | { kind: 'shift-overflow'; shift: number; minCount: number; capacity: number }

export type CoverageIssue = {
  day: number
  shift: number
  kind: 'short' | 'over'
  amount: number
}

export type RosterRow = {
  employeeId: string
  patternId: string | null
  offset: number
  cells: number[]
}

/**
 * solved     = ทุกวันทุกกะอยู่ในช่วง min–max
 * partial    = หมดเวลาก่อนหาเจอ คืนตารางที่ดีที่สุดที่มี
 * infeasible = พิสูจน์ได้ว่าจัดให้ครบไม่ได้ คืนตารางที่ใกล้เคียงที่สุด
 */
export type SolveStatus = 'solved' | 'partial' | 'infeasible'

export type SolveResult = {
  status: SolveStatus
  rows: RosterRow[]
  /** [day][shift] */
  coverage: number[][]
  issues: CoverageIssue[]
  reasons: Reason[]
  stats: { nodes: number; ms: number }
}

export type Progress = { nodes: number; ms: number }
