import { addDays, formatThaiShort } from '../domain/dates'
import { checkPattern } from '../domain/rules'
import { OFF, type Config } from '../domain/types'
import { rosterCsv } from '../io/export-csv'
import { downloadText } from '../io/download'
import type { SolveResult } from '../solver/types'
import { Icon } from './Icon'
import { RosterTable } from './RosterTable'
import { ShortageReport } from './ShortageReport'
import { toneByIndex } from './shiftStyle'
import type { StepProps } from './useConfig'
import type { SolverApi } from './useSolver'

type Props = StepProps & { onGoto: (step: number) => void; solver: SolverApi }

type Check = { ok: boolean; title: string; detail: string; step: number }

export function ReviewStep({ config, onGoto, solver }: Props) {
  const { shifts, patterns, employees } = config
  const ids = shifts.map((s) => s.id)
  const end = addDays(config.startDate, config.days - 1)
  const sumMin = shifts.reduce((n, s) => n + s.min, 0)
  const badPatterns = patterns.filter(
    (p) =>
      checkPattern(p.seq, ids, config.rules.restShifts) !== null ||
      p.seq.every((x) => x === OFF),
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
  // คนน้อยกว่าที่ต้องการยังกดจัดได้ ระบบจะอธิบายว่าขาดตรงไหน
  const ready = checks[2].ok && employees.length > 0
  const { state } = solver

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
        {state.kind === 'running' ? (
          <>
            <p className="running" role="status">
              <span className="spinner" aria-hidden="true" /> กำลังจัดตาราง…{' '}
              {(state.ms / 1000).toFixed(1)} วินาที
            </p>
            <button type="button" className="btn btn-secondary" onClick={solver.cancel}>
              ยกเลิก
            </button>
          </>
        ) : (
          <>
            <button
              type="button"
              className="btn btn-primary btn-lg"
              disabled={!ready}
              onClick={() => solver.run(config)}
            >
              <Icon name="sparkle" /> {state.kind === 'done' ? 'จัดตารางใหม่' : 'จัดตาราง'}
            </button>
            <p className="muted small">
              {ready
                ? `ใช้เวลาคำนวณไม่เกิน ${Math.round(config.solver.timeLimitMs / 1000)} วินาที`
                : 'แก้รายการที่มีเครื่องหมายเตือนก่อน แล้วค่อยจัดตาราง'}
            </p>
          </>
        )}
      </section>

      {state.kind === 'error' && (
        <p className="status status-bad" role="alert">
          <Icon name="alert" /> คำนวณไม่สำเร็จ: {state.message}
        </p>
      )}

      {state.kind === 'done' && (
        <Result
          config={state.config}
          result={state.result}
          stale={state.key !== JSON.stringify(config)}
        />
      )}
    </div>
  )
}

function Result({ config, result, stale }: { config: Config; result: SolveResult; stale: boolean }) {
  const took =
    result.stats.ms < 1000
      ? 'ใช้เวลาไม่ถึง 1 วินาที'
      : `ใช้เวลา ${(result.stats.ms / 1000).toFixed(1)} วินาที`
  const banner =
    result.status === 'solved'
      ? { cls: 'status-ok', icon: 'check' as const, text: `จัดได้ครบทุกกะ ทุกวัน (${took})` }
      : result.status === 'partial'
        ? {
            cls: 'status-warn',
            icon: 'alert' as const,
            text: `หมดเวลาก่อนหาแบบที่ครบได้ นี่คือตารางที่ใกล้เคียงที่สุด ขาดหรือเกิน ${result.issues.length} จุด`,
          }
        : {
            cls: 'status-bad',
            icon: 'alert' as const,
            text: `จัดให้ครบตามเงื่อนไขไม่ได้ ตารางด้านล่างเป็นแบบที่ใกล้เคียงที่สุด ขาดหรือเกิน ${result.issues.length} จุด`,
          }

  return (
    <div className="stack result">
      <h3 className="result-title">ผลการจัดตาราง</h3>
      {stale && (
        <p className="status status-warn">
          <Icon name="info" /> ข้อมูลถูกแก้หลังจัดตาราง ตารางนี้ยังเป็นของเดิม กด “จัดตารางใหม่” เพื่ออัปเดต
        </p>
      )}
      <p className={`status ${banner.cls}`}>
        <Icon name={banner.icon} /> {banner.text}
      </p>

      <ShortageReport config={config} result={result} />

      <div className="legend" aria-label="คำอธิบายสี">
        {config.shifts.map((s, i) => (
          <span key={s.id} className="legend-item">
            <span className={`rc ${toneByIndex(i)}`} aria-hidden="true" /> {s.name}
          </span>
        ))}
        <span className="legend-item">
          <span className="rc rc-off" aria-hidden="true">
            ·
          </span>{' '}
          หยุด
        </span>
        <span className="legend-item">
          <span className="rc rc-leave" aria-hidden="true">
            ลา
          </span>{' '}
          ลา
        </span>
      </div>

      <RosterTable config={config} result={result} />
      <p className="muted small">เลื่อนตารางไปทางซ้าย–ขวาเพื่อดูวันอื่น แถวล่างคือจำนวนคนต่อกะ (สีแดง = ขาด, สีส้ม = เกิน)</p>

      <div className="export-row">
        <button
          type="button"
          className="btn btn-secondary"
          onClick={() =>
            downloadText(
              `ตารางเวร-${config.startDate}.csv`,
              rosterCsv(config, result),
              'text/csv;charset=utf-8',
            )
          }
        >
          <Icon name="download" /> ดาวน์โหลด CSV (เปิดใน Excel ได้)
        </button>
      </div>
    </div>
  )
}
