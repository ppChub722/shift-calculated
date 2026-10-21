import { configSchema } from '../domain/schema'
import type { Config } from '../domain/types'

const KEY = 'shift-calculated:config'

export type LoadResult =
  | { status: 'empty' }
  | { status: 'ok'; config: Config }
  | { status: 'invalid'; raw: string }

export function loadConfig(): LoadResult {
  let raw: string | null
  try {
    raw = localStorage.getItem(KEY)
  } catch {
    return { status: 'empty' }
  }
  if (raw === null) return { status: 'empty' }
  try {
    const parsed = configSchema.safeParse(JSON.parse(raw))
    return parsed.success
      ? { status: 'ok', config: parsed.data }
      : { status: 'invalid', raw }
  } catch {
    return { status: 'invalid', raw }
  }
}

/** เช็คครั้งเดียวตอนเปิดแอป ว่าเบราว์เซอร์ให้บันทึกไหม (เช่น โหมดส่วนตัว หรือบล็อกข้อมูลเว็บ) */
export function isStorageWritable(): boolean {
  try {
    localStorage.setItem(`${KEY}:probe`, '1')
    localStorage.removeItem(`${KEY}:probe`)
    return true
  } catch {
    return false
  }
}

/** คืน false ถ้าเขียนไม่ได้ (เช่น โหมดส่วนตัว หรือพื้นที่เต็ม) */
export function saveConfig(config: Config): boolean {
  try {
    localStorage.setItem(KEY, JSON.stringify(config))
    return true
  } catch {
    return false
  }
}
