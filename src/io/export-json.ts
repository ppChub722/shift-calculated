import type { Config } from '../domain/types'

/** ไฟล์ตั้งค่า: { config } นำเข้ากลับได้ด้วย parseConfigFile */
export function configJson(config: Config): string {
  return JSON.stringify({ config }, null, 2)
}

export function configFileName(config: Config): string {
  return `ตั้งค่าตารางเวร-${config.startDate}.json`
}
