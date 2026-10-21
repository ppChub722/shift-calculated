import { useEffect, useMemo, useState } from 'react'
import { defaultConfig } from '../domain/defaults'
import {
  OFF,
  type Config,
  type Employee,
  type Pattern,
  type Shift,
} from '../domain/types'
import { isStorageWritable, loadConfig, saveConfig } from '../io/storage'

function patchById<T extends { id: string }>(
  list: T[],
  id: string,
  patch: Partial<T>,
): T[] {
  return list.map((x) => (x.id === id ? { ...x, ...patch } : x))
}

export function useConfig() {
  const [initial] = useState(loadConfig)
  const [config, setConfig] = useState<Config>(() =>
    initial.status === 'ok' ? initial.config : defaultConfig(),
  )
  // ข้อมูลเดิมอ่านไม่ได้: เก็บไว้ ไม่บันทึกทับ จนกว่าผู้ใช้จะเลือกเริ่มใหม่
  const [brokenRaw, setBrokenRaw] = useState(
    initial.status === 'invalid' ? initial.raw : null,
  )
  const [canSave] = useState(isStorageWritable)

  useEffect(() => {
    if (brokenRaw !== null) return
    saveConfig(config)
  }, [config, brokenRaw])

  const actions = useMemo(() => {
    const update = (fn: (c: Config) => Config) => setConfig(fn)
    return {
      setPeriod(patch: Partial<Pick<Config, 'startDate' | 'days'>>) {
        update((c) => ({ ...c, ...patch }))
      },
      addShift() {
        update((c) => ({
          ...c,
          shifts: [
            ...c.shifts,
            {
              id: crypto.randomUUID(),
              name: `กะ ${c.shifts.length + 1}`,
              min: 1,
              max: 2,
            },
          ],
        }))
      },
      updateShift(id: string, patch: Partial<Shift>) {
        update((c) => ({ ...c, shifts: patchById(c.shifts, id, patch) }))
      },
      /** ช่องใน pattern ที่ใช้กะนี้กลายเป็นวันหยุด ข้อห้ามของกะนี้ถูกลบ */
      removeShift(id: string) {
        update((c) => ({
          ...c,
          shifts: c.shifts.filter((s) => s.id !== id),
          patterns: c.patterns.map((p) => ({
            ...p,
            seq: p.seq.map((x) => (x === id ? OFF : x)),
          })),
          employees: c.employees.map((e) => ({
            ...e,
            blocked: e.blocked.filter((b) => b.shiftId !== id),
          })),
        }))
      },
      addPattern(name: string, seq: string[]) {
        update((c) => ({
          ...c,
          patterns: [...c.patterns, { id: crypto.randomUUID(), name, seq }],
        }))
      },
      updatePattern(id: string, patch: Partial<Pattern>) {
        update((c) => ({ ...c, patterns: patchById(c.patterns, id, patch) }))
      },
      removePattern(id: string) {
        update((c) => ({
          ...c,
          patterns: c.patterns.filter((p) => p.id !== id),
        }))
      },
      addEmployees(employees: Employee[]) {
        update((c) => ({ ...c, employees: [...c.employees, ...employees] }))
      },
      updateEmployee(id: string, patch: Partial<Employee>) {
        update((c) => ({ ...c, employees: patchById(c.employees, id, patch) }))
      },
      removeEmployee(id: string) {
        update((c) => ({
          ...c,
          employees: c.employees.filter((e) => e.id !== id),
        }))
      },
      reset(next: Config) {
        setBrokenRaw(null)
        setConfig(next)
      },
    }
  }, [])

  return { config, actions, brokenRaw, canSave }
}

export type ConfigActions = ReturnType<typeof useConfig>['actions']

export type StepProps = { config: Config; actions: ConfigActions }
