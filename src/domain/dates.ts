import type { IsoDate } from './types'

// ใช้ Date แบบ UTC เฉพาะแปลงและแสดงผลวันที่ ไม่มี timezone มาทำให้วันเลื่อน

const DAY_MS = 86_400_000

function toUtc(iso: IsoDate): number {
  const [y, m, d] = iso.split('-').map(Number)
  return Date.UTC(y, m - 1, d)
}

function fromUtc(ms: number): IsoDate {
  return new Date(ms).toISOString().slice(0, 10)
}

export function addDays(iso: IsoDate, n: number): IsoDate {
  return fromUtc(toUtc(iso) + n * DAY_MS)
}

export function dayIndex(start: IsoDate, iso: IsoDate): number {
  return Math.round((toUtc(iso) - toUtc(start)) / DAY_MS)
}

/** วันนี้ตามเวลาเครื่องผู้ใช้ */
export function todayIso(): IsoDate {
  const d = new Date()
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`
}

const longFmt = new Intl.DateTimeFormat('th-TH', {
  weekday: 'short',
  day: 'numeric',
  month: 'short',
  year: 'numeric',
  timeZone: 'UTC',
})

const shortFmt = new Intl.DateTimeFormat('th-TH', {
  day: 'numeric',
  month: 'short',
  timeZone: 'UTC',
})

/** "ศ. 1 พ.ย. 2569" */
export function formatThaiLong(iso: IsoDate): string {
  return longFmt.format(toUtc(iso))
}

/** "1 พ.ย." */
export function formatThaiShort(iso: IsoDate): string {
  return shortFmt.format(toUtc(iso))
}

const dowFmt = new Intl.DateTimeFormat('th-TH', { weekday: 'narrow', timeZone: 'UTC' })
const monthFmt = new Intl.DateTimeFormat('th-TH', { month: 'short', timeZone: 'UTC' })

/** "พ", "พฤ", "อา" */
export function formatWeekday(iso: IsoDate): string {
  return dowFmt.format(toUtc(iso))
}

/** "พ.ย." */
export function formatMonth(iso: IsoDate): string {
  return monthFmt.format(toUtc(iso))
}

export function isWeekend(iso: IsoDate): boolean {
  const dow = new Date(toUtc(iso)).getUTCDay()
  return dow === 0 || dow === 6
}
