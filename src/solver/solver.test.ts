import { describe, expect, it } from 'vitest'
import type { Config } from '../domain/types'
import { solve } from './solver'
import { CELL_LEAVE, type SolveResult } from './types'

const p = (s: string) => s.split(' ')

function makeConfig(people: number, patterns: string[], patch: Partial<Config> = {}): Config {
  return {
    version: 1,
    startDate: '2026-11-01',
    days: 30,
    shifts: [
      { id: 'ช', name: 'เช้า', min: 1, max: 2 },
      { id: 'บ', name: 'บ่าย', min: 1, max: 2 },
      { id: 'ด', name: 'ดึก', min: 1, max: 2 },
    ],
    patterns: patterns.map((seq, i) => ({ id: `p${i}`, name: `p${i}`, seq: p(seq) })),
    employees: Array.from({ length: people }, (_, i) => ({
      id: `e${i}`,
      name: `e${i}`,
      leaves: [],
      blocked: [],
    })),
    rules: { restShifts: 2 },
    solver: { timeLimitMs: 5000 },
    ...patch,
  }
}

/** ตรวจซ้ำจากแถวจริง ไม่เชื่อ coverage ที่ solver คืนมา */
function expectAllCovered(config: Config, r: SolveResult) {
  for (let d = 0; d < config.days; d++) {
    config.shifts.forEach((s, si) => {
      const n = r.rows.filter((row) => row.cells[d] === si).length
      expect(n).toBeGreaterThanOrEqual(s.min)
      expect(n).toBeLessThanOrEqual(s.max)
    })
  }
}

const ROTATION = 'ช ช บ บ ด OFF OFF'

/** max 3 ต่อกะ ให้มีที่ว่างพอสำหรับเทสวันลาและข้อห้าม */
const WIDE_SHIFTS = [
  { id: 'ช', name: 'เช้า', min: 1, max: 3 },
  { id: 'บ', name: 'บ่าย', min: 1, max: 3 },
  { id: 'ด', name: 'ดึก', min: 1, max: 3 },
]

describe('solve', () => {
  it('7 คน pattern เดียว จัดได้ครบ', () => {
    const config = makeConfig(7, [ROTATION])
    const r = solve(config)
    expect(r.status).toBe('solved')
    expect(r.issues).toEqual([])
    expectAllCovered(config, r)
  })

  it('5 คน pattern เดียว กะดึกไม่พอ ไม่ผ่านตรวจเบื้องต้น', () => {
    const r = solve(makeConfig(5, [ROTATION]))
    expect(r.status).toBe('infeasible')
    expect(r.reasons).toContainEqual(
      expect.objectContaining({ kind: 'shift-capacity', shift: 2 }),
    )
    // ยังได้ตารางใกล้เคียงที่สุดกลับมา พร้อมรายการที่ขาด
    expect(r.rows).toHaveLength(5)
    expect(r.issues.length).toBeGreaterThan(0)
  })

  it('5 คน เพิ่ม pattern ดึกล้วน จัดได้ครบ', () => {
    const config = makeConfig(5, [ROTATION, 'ด ด ด ด ด OFF OFF'])
    const r = solve(config)
    expect(r.status).toBe('solved')
    expectAllCovered(config, r)
  })

  it('8 คน pattern เดียว กะเช้าคนล้น ไม่ผ่านตรวจเบื้องต้น', () => {
    // ทุกคนทำเช้า 2 วันต่อ 7 วัน: 8 คนได้เช้าอย่างน้อย 64 ครั้ง แต่เช้ารับได้ 2 × 30 = 60
    const r = solve(makeConfig(8, [ROTATION]))
    expect(r.status).toBe('infeasible')
    expect(r.reasons).toContainEqual(
      expect.objectContaining({ kind: 'shift-overflow', shift: 0 }),
    )
  })

  it('วันลา: pattern เดินต่อ แต่วันนั้นไม่ถูกนับ', () => {
    const config = makeConfig(8, [ROTATION], { shifts: WIDE_SHIFTS })
    config.employees[0].leaves = ['2026-11-03']
    const r = solve(config)
    expect(r.status).toBe('solved')
    expect(r.rows[0].cells[2]).toBe(CELL_LEAVE)
    expectAllCovered(config, r)
  })

  it('ข้อห้าม: ไม่มีใครได้กะที่ห้ามในช่วงนั้น', () => {
    const config = makeConfig(8, [ROTATION, 'ช ช บ บ OFF OFF'], { shifts: WIDE_SHIFTS })
    config.employees[0].blocked = [{ shiftId: 'ด', from: '2026-11-01', to: '2026-11-15' }]
    const r = solve(config)
    expect(r.status).toBe('solved')
    for (let d = 0; d < 15; d++) expect(r.rows[0].cells[d]).not.toBe(2)
    expectAllCovered(config, r)
  })

  it('คนที่ติดข้อห้ามทุกรูปแบบ ถูกรายงาน', () => {
    const config = makeConfig(8, [ROTATION])
    config.employees[0].blocked = [{ shiftId: 'ด', from: '2026-11-01', to: '2026-11-30' }]
    const r = solve(config)
    expect(r.reasons).toContainEqual({ kind: 'no-candidate', employeeId: 'e0' })
  })

  it('2 กะต่อวัน เว้น 1 กะ: ใช้ pattern ที่ทำกะเดิมติดกันได้', () => {
    const config = makeConfig(4, ['ช ช ด ด OFF OFF'], {
      shifts: [
        { id: 'ช', name: 'กลางวัน', min: 1, max: 2 },
        { id: 'ด', name: 'กลางคืน', min: 1, max: 2 },
      ],
      rules: { restShifts: 1 },
    })
    const r = solve(config)
    expect(r.status).toBe('solved')
    expectAllCovered(config, r)
  })

  it('pattern ที่ผิดกฎพักไม่ถูกเอามาใช้', () => {
    // ดึกต่อเช้า ผิดกฎเว้น 2 กะ → ไม่มีตัวเลือกเลย ทุกคนถูกรายงาน
    const r = solve(makeConfig(3, ['ด ช OFF']))
    expect(r.reasons.filter((x) => x.kind === 'no-candidate')).toHaveLength(3)
  })

  it('คนเกิน: ฟ้อง ไม่แอบให้หยุดเพิ่ม', () => {
    const r = solve(makeConfig(30, [ROTATION]))
    expect(r.status).toBe('infeasible')
    expect(r.reasons).toContainEqual(expect.objectContaining({ kind: 'too-many-people' }))
  })
})
