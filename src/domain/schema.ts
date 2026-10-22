import { z } from 'zod'
import { DEFAULT_REST_SHIFTS } from './rules'
import type { Config } from './types'

const isoDate = z.iso.date()

const shiftSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  min: z.number().int().nonnegative(),
  max: z.number().int().nonnegative(),
})

const patternSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  seq: z.array(z.string().min(1)).min(1),
})

const employeeSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  leaves: z.array(isoDate),
  blocked: z.array(
    z.object({ shiftId: z.string().min(1), from: isoDate, to: isoDate }),
  ),
})

/** schema เดียวใช้ทั้งตอน import json และตอนอ่าน localStorage */
export const configSchema: z.ZodType<Config> = z.object({
  version: z.literal(1),
  startDate: isoDate,
  days: z.number().int().positive(),
  shifts: z.array(shiftSchema).min(1),
  patterns: z.array(patternSchema).min(1),
  employees: z.array(employeeSchema),
  // ข้อมูลเก่าที่ยังไม่มีฟิลด์นี้ ใช้กฎเดิม (เว้น 2 กะ)
  rules: z
    .object({ restShifts: z.number().int().nonnegative() })
    .default({ restShifts: DEFAULT_REST_SHIFTS }),
  solver: z.object({ timeLimitMs: z.number().int().positive() }),
})
