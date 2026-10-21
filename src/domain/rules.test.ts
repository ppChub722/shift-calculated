import { describe, expect, it } from 'vitest'
import { checkPattern, validatePattern } from './rules'

const SHIFTS = ['ช', 'บ', 'ด']
const p = (s: string) => s.split(' ')

describe('validatePattern', () => {
  it('ผ่านเมื่อมีวันหยุดคั่นก่อนวนกลับไปกะเช้า', () => {
    expect(validatePattern(p('ช ช บ บ ด OFF OFF'), SHIFTS)).toBe(true)
  })

  it('ไม่ผ่านเมื่อรอยต่อรอบเป็นดึกต่อเช้า', () => {
    // กลางรอบผ่านหมด แต่ ด วันสุดท้าย → ช วันแรกของรอบถัดไป ห่าง 1 slot
    expect(validatePattern(p('ช ช บ บ ด'), SHIFTS)).toBe(false)
  })

  it('ไม่ผ่านเมื่อดึกต่อด้วยเช้าวันรุ่งขึ้นกลางรอบ', () => {
    expect(validatePattern(p('บ บ ด ช OFF OFF'), SHIFTS)).toBe(false)
  })

  it('ไม่ผ่านเมื่อบ่ายต่อด้วยเช้าวันรุ่งขึ้น', () => {
    expect(validatePattern(p('บ ช OFF'), SHIFTS)).toBe(false)
  })

  it('ผ่านเมื่อทำกะเดิมทุกวัน', () => {
    expect(validatePattern(p('ด ด ด ด ด OFF OFF'), SHIFTS)).toBe(true)
  })

  it('ไม่ผ่านเมื่อมีกะที่ไม่รู้จัก', () => {
    expect(validatePattern(p('ช X OFF'), SHIFTS)).toBe(false)
  })
})

describe('checkPattern', () => {
  it('บอกตำแหน่งปัญหาตรงรอยต่อรอบ', () => {
    expect(checkPattern(p('ช ช บ บ ด'), SHIFTS)).toEqual({
      kind: 'rest',
      from: 4,
      to: 0,
      wraps: true,
    })
  })

  it('บอกตำแหน่งปัญหากลางรอบ', () => {
    expect(checkPattern(p('บ บ ด ช OFF OFF'), SHIFTS)).toEqual({
      kind: 'rest',
      from: 2,
      to: 3,
      wraps: false,
    })
  })

  it('บอกวันที่ใช้กะที่ไม่รู้จัก', () => {
    expect(checkPattern(p('ช X OFF'), SHIFTS)).toEqual({
      kind: 'unknown-shift',
      day: 1,
    })
  })
})
