import { addDays } from '../domain/dates'
import type { Config } from '../domain/types'
import { CELL_LEAVE, type SolveResult } from '../solver/types'

const quote = (v: string | number) => {
  const s = String(v)
  return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s
}

/** ตารางคน × วัน + แถวสรุปจำนวนคนต่อกะ ใส่ BOM ให้ Excel อ่านภาษาไทยถูก */
export function rosterCsv(config: Config, result: SolveResult): string {
  const days = Array.from({ length: config.days }, (_, d) => addDays(config.startDate, d))
  const nameOf = new Map(config.employees.map((e) => [e.id, e.name]))
  const cellText = (c: number) =>
    c === CELL_LEAVE ? 'ลา' : c < 0 ? 'หยุด' : (config.shifts[c]?.name ?? '?')

  const lines = [
    ['ชื่อ', ...days],
    ...result.rows.map((r) => [nameOf.get(r.employeeId) ?? '', ...r.cells.map(cellText)]),
    [],
    ...config.shifts.map((s, si) => [
      `จำนวนคนกะ${s.name}`,
      ...result.coverage.map((day) => day[si]),
    ]),
  ]
  return '﻿' + lines.map((row) => row.map(quote).join(',')).join('\r\n')
}
