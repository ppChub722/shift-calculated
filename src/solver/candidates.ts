import { dayIndex } from '../domain/dates'
import { checkPattern } from '../domain/rules'
import { OFF, type Config } from '../domain/types'
import { CELL_LEAVE, CELL_OFF, type Candidate, type Problem } from './types'

/** ขั้น 2: แปลง config เป็นโจทย์ index ล้วน และสร้างตัวเลือก (pattern, offset) ของทุกคน */
export function buildProblem(config: Config): Problem {
  const N = config.days
  const S = config.shifts.length
  const T = N * S
  const shiftIds = config.shifts.map((s) => s.id)
  const min = Array.from({ length: T }, (_, t) => config.shifts[t % S].min)
  const max = Array.from({ length: T }, (_, t) => config.shifts[t % S].max)

  // pattern ที่ผิดกฎหรือไม่มีวันทำงานเลย ไม่เอามาใช้
  const patterns = config.patterns.filter(
    (p) => p.seq.some((x) => x !== OFF) && checkPattern(p.seq, shiftIds) === null,
  )

  const candidates: Candidate[][] = []
  const idleCells: number[][] = []

  for (const emp of config.employees) {
    const leave = new Set(
      emp.leaves.map((d) => dayIndex(config.startDate, d)).filter((d) => d >= 0 && d < N),
    )
    const blocked = new Set<number>()
    for (const b of emp.blocked) {
      const s = shiftIds.indexOf(b.shiftId)
      if (s === -1) continue
      const from = Math.max(0, dayIndex(config.startDate, b.from))
      const to = Math.min(N - 1, dayIndex(config.startDate, b.to))
      for (let d = from; d <= to; d++) blocked.add(d * S + s)
    }

    const list: Candidate[] = []
    const seen = new Set<string>()
    for (const p of patterns) {
      const L = p.seq.length
      for (let o = 0; o < L; o++) {
        const cells: number[] = new Array(N)
        const slots: number[] = []
        let ok = true
        for (let d = 0; d < N; d++) {
          const x = p.seq[(d + o) % L]
          if (leave.has(d)) {
            // ลา = pattern เดินต่อ แต่วันนั้นไม่นับ (ไม่ต้องเช็คข้อห้าม เพราะไม่ได้ทำจริง)
            cells[d] = CELL_LEAVE
          } else if (x === OFF) {
            cells[d] = CELL_OFF
          } else {
            const s = shiftIds.indexOf(x)
            const t = d * S + s
            if (blocked.has(t)) {
              ok = false
              break
            }
            cells[d] = s
            slots.push(t)
          }
        }
        if (!ok) continue
        const key = cells.join(',')
        if (seen.has(key)) continue
        seen.add(key)
        list.push({ patternId: p.id, offset: o, cells, slots })
      }
    }
    candidates.push(list)
    idleCells.push(Array.from({ length: N }, (_, d) => (leave.has(d) ? CELL_LEAVE : CELL_OFF)))
  }

  return {
    N,
    S,
    T,
    min,
    max,
    employeeIds: config.employees.map((e) => e.id),
    candidates,
    idleCells,
  }
}
