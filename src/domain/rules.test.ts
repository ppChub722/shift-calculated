import { describe, expect, it } from 'vitest'
import { checkPattern, forbiddenNextDay, validatePattern } from './rules'

const SHIFTS = ['ช', 'บ', 'ด']
const TWO_SHIFTS = ['ช', 'ด']
const REST = 2
const p = (s: string) => s.split(' ')

describe('validatePattern (3 กะ เว้น 2 กะ)', () => {
  it('ผ่านเมื่อมีวันหยุดคั่นก่อนวนกลับไปกะเช้า', () => {
    expect(validatePattern(p('ช ช บ บ ด OFF OFF'), SHIFTS, REST)).toBe(true)
  })

  it('ไม่ผ่านเมื่อรอยต่อรอบเป็นดึกต่อเช้า', () => {
    // กลางรอบผ่านหมด แต่ ด วันสุดท้าย → ช วันแรกของรอบถัดไป ห่าง 1 slot
    expect(validatePattern(p('ช ช บ บ ด'), SHIFTS, REST)).toBe(false)
  })

  it('ไม่ผ่านเมื่อดึกต่อด้วยเช้าวันรุ่งขึ้นกลางรอบ', () => {
    expect(validatePattern(p('บ บ ด ช OFF OFF'), SHIFTS, REST)).toBe(false)
  })

  it('ไม่ผ่านเมื่อบ่ายต่อด้วยเช้าวันรุ่งขึ้น', () => {
    expect(validatePattern(p('บ ช OFF'), SHIFTS, REST)).toBe(false)
  })

  it('ผ่านเมื่อทำกะเดิมทุกวัน', () => {
    expect(validatePattern(p('ด ด ด ด ด OFF OFF'), SHIFTS, REST)).toBe(true)
  })

  it('ไม่ผ่านเมื่อมีกะที่ไม่รู้จัก', () => {
    expect(validatePattern(p('ช X OFF'), SHIFTS, REST)).toBe(false)
  })
})

describe('validatePattern ปรับกฎพักได้', () => {
  it('3 กะ เว้น 1 กะ: บ่ายต่อเช้าได้ แต่ดึกต่อเช้าไม่ได้', () => {
    expect(validatePattern(p('บ ช OFF'), SHIFTS, 1)).toBe(true)
    expect(validatePattern(p('ด ช OFF'), SHIFTS, 1)).toBe(false)
  })

  it('ไม่จำกัด: ดึกต่อเช้าได้ เหลือแค่วันละกะเดียว', () => {
    expect(validatePattern(p('ด ช ด ช'), SHIFTS, 0)).toBe(true)
  })

  it('2 กะ เว้น 2 กะ (กฎเดิม) ทำกะเดิมสองวันติดไม่ได้', () => {
    expect(validatePattern(p('ช ช OFF'), TWO_SHIFTS, 2)).toBe(false)
  })

  it('2 กะ เว้น 1 กะ: ทำกะเดิมติดกันได้ แต่ดึกต่อเช้าไม่ได้', () => {
    expect(validatePattern(p('ช ช ด ด OFF'), TWO_SHIFTS, 1)).toBe(true)
    expect(validatePattern(p('ด ช OFF'), TWO_SHIFTS, 1)).toBe(false)
  })
})

describe('checkPattern', () => {
  it('บอกตำแหน่งปัญหาตรงรอยต่อรอบ', () => {
    expect(checkPattern(p('ช ช บ บ ด'), SHIFTS, REST)).toEqual({
      kind: 'rest',
      from: 4,
      to: 0,
      wraps: true,
    })
  })

  it('บอกตำแหน่งปัญหากลางรอบ', () => {
    expect(checkPattern(p('บ บ ด ช OFF OFF'), SHIFTS, REST)).toEqual({
      kind: 'rest',
      from: 2,
      to: 3,
      wraps: false,
    })
  })

  it('บอกวันที่ใช้กะที่ไม่รู้จัก', () => {
    expect(checkPattern(p('ช X OFF'), SHIFTS, REST)).toEqual({
      kind: 'unknown-shift',
      day: 1,
    })
  })
})

describe('forbiddenNextDay', () => {
  it('3 กะ เว้น 2 กะ: ดึก → เช้า/บ่าย และ บ่าย → เช้า', () => {
    expect(forbiddenNextDay(3, 2)).toEqual([
      [1, 0],
      [2, 0],
      [2, 1],
    ])
  })

  it('2 กะ เว้น 1 กะ: ดึก → เช้า', () => {
    expect(forbiddenNextDay(2, 1)).toEqual([[1, 0]])
  })

  it('ไม่จำกัด: ไม่มีคู่ที่ห้าม', () => {
    expect(forbiddenNextDay(3, 0)).toEqual([])
  })
})
