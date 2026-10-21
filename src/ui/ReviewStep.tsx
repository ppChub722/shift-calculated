import { addDays, formatThaiShort } from '../domain/dates'
import { checkPattern } from '../domain/rules'
import { OFF } from '../domain/types'
import { Icon } from './Icon'
import type { StepProps } from './useConfig'

type Props = StepProps & { onGoto: (step: number) => void }

type Check = { ok: boolean; title: string; detail: string; step: number }

export function ReviewStep({ config, onGoto }: Props) {
  const { shifts, patterns, employees } = config
  const ids = shifts.map((s) => s.id)
  const end = addDays(config.startDate, config.days - 1)
  const sumMin = shifts.reduce((n, s) => n + s.min, 0)
  const badPatterns = patterns.filter(
    (p) => checkPattern(p.seq, ids) !== null || p.seq.every((x) => x === OFF),
  ).length
  const leaves = employees.reduce((n, e) => n + e.leaves.length, 0)
  const blocked = employees.reduce((n, e) => n + e.blocked.length, 0)

  const checks: Check[] = [
    {
      ok: true,
      title: `${formatThaiShort(config.startDate)} – ${formatThaiShort(end)}`,
      detail: `${config.days} วัน`,
      step: 0,
    },
    {
      ok: true,
      title: `${shifts.length} กะ: ${shifts.map((s) => s.name).join(' · ')}`,
      detail: `ต้องการอย่างน้อย ${sumMin} คนต่อวัน`,
      step: 1,
    },
    {
      ok: patterns.length > 0 && badPatterns === 0,
      title: `รูปแบบรอบ ${patterns.length} แบบ`,
      detail:
        patterns.length === 0
          ? 'ต้องมีอย่างน้อย 1 แบบ'
          : badPatterns > 0
            ? `มี ${badPatterns} แบบที่ต้องแก้`
            : 'ทุกแบบพักเพียงพอ',
      step: 2,
    },
    {
      ok: employees.length >= sumMin && employees.length > 0,
      title: `พนักงาน ${employees.length} คน`,
      detail:
        employees.length === 0
          ? 'ยังไม่มีพนักงาน'
          : employees.length < sumMin
            ? `น้อยกว่าที่ต้องการต่อวัน (${sumMin} คน)`
            : `ลา ${leaves} วัน · ข้อห้าม ${blocked} ข้อ`,
      step: 3,
    },
  ]
  const ready = checks.every((c) => c.ok)

  return (
    <div className="stack">
      <ul className="card list-card checklist">
        {checks.map((c) => (
          <li key={c.step} className={c.ok ? 'is-ok' : 'is-issue'}>
            <span className="check-icon">
              <Icon name={c.ok ? 'check' : 'alert'} size={18} />
            </span>
            <div className="check-text">
              <strong>{c.title}</strong>
              <span className="muted small">{c.detail}</span>
            </div>
            <button type="button" className="btn btn-ghost btn-sm" onClick={() => onGoto(c.step)}>
              แก้ไข
            </button>
          </li>
        ))}
      </ul>

      <section className="card cta">
        <button type="button" className="btn btn-primary btn-lg" disabled>
          <Icon name="sparkle" /> จัดตาราง
        </button>
        <p className="muted small">
          {ready
            ? 'ข้อมูลพร้อมแล้ว ส่วนคำนวณตารางกำลังพัฒนา เร็ว ๆ นี้'
            : 'แก้รายการที่มีเครื่องหมายเตือนก่อน แล้วค่อยจัดตาราง'}
        </p>
      </section>
    </div>
  )
}
