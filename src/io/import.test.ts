import { describe, expect, it } from 'vitest'
import { defaultConfig, sampleEmployees } from '../domain/defaults'
import { configJson } from './export-json'
import { parseConfigFile } from './import'

describe('parseConfigFile', () => {
  it('นำเข้าไฟล์ที่ export ไว้ได้ครบ', () => {
    const config = { ...defaultConfig(), employees: sampleEmployees() }
    expect(parseConfigFile(configJson(config))).toEqual({ ok: true, config })
  })

  it('รับ config ตรง ๆ และไฟล์ที่มี BOM', () => {
    const config = defaultConfig()
    expect(parseConfigFile('﻿' + JSON.stringify(config))).toEqual({ ok: true, config })
  })

  it('ปฏิเสธไฟล์ที่ไม่ใช่ JSON', () => {
    expect(parseConfigFile('ชื่อ,วันที่')).toMatchObject({ ok: false })
  })

  it('ปฏิเสธ JSON ที่ไม่ใช่ไฟล์ตั้งค่า', () => {
    expect(parseConfigFile('{"config":{"version":2}}')).toMatchObject({ ok: false })
  })
})
