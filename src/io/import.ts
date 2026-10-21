import { configSchema } from '../domain/schema'
import type { Config } from '../domain/types'

export type ImportResult = { ok: true; config: Config } | { ok: false; error: string }

/** รับได้ทั้ง config ตรง ๆ และ { config, result } ที่ export ไว้ */
export function parseConfigFile(text: string): ImportResult {
  let data: unknown
  try {
    data = JSON.parse(text.replace(/^﻿/, ''))
  } catch {
    return { ok: false, error: 'ไฟล์นี้ไม่ใช่ JSON' }
  }
  const candidate =
    data !== null && typeof data === 'object' && 'config' in data ? data.config : data
  const parsed = configSchema.safeParse(candidate)
  if (!parsed.success) return { ok: false, error: 'ไฟล์นี้ไม่ใช่ไฟล์ตั้งค่าของแอปนี้ หรือข้อมูลไม่ครบ' }
  return { ok: true, config: parsed.data }
}
