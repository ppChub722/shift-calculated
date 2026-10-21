import { useState } from 'react'
import { rotationSeq, singleShiftSeq } from '../domain/defaults'
import { checkPattern, MIN_SLOT_GAP, type PatternIssue } from '../domain/rules'
import { OFF, type Pattern, type Shift } from '../domain/types'
import { Icon } from './Icon'
import { NumberStepper } from './NumberStepper'
import { shiftLabel, shiftShort, toneClass } from './shiftStyle'
import type { StepProps } from './useConfig'

const MAX_LENGTH = 28

function issueText(issue: PatternIssue, seq: string[], shifts: Shift[]): string {
  if (issue.kind === 'unknown-shift') {
    return `วันที่ ${issue.day + 1} ใช้กะที่ถูกลบไปแล้ว`
  }
  const a = shiftLabel(shifts, seq[issue.from])
  const b = shiftLabel(shifts, seq[issue.to])
  const gap = MIN_SLOT_GAP - 1
  if (issue.wraps) {
    return `กะ${a}วันสุดท้าย (วันที่ ${issue.from + 1}) วนกลับไปกะ${b}วันที่ ${issue.to + 1} ของรอบถัดไปเร็วเกินไป ต้องเว้นอย่างน้อย ${gap} กะ ลองเพิ่มวันหยุดท้ายรอบ`
  }
  return `กะ${a}วันที่ ${issue.from + 1} ต่อด้วยกะ${b}วันที่ ${issue.to + 1} เร็วเกินไป ต้องเว้นอย่างน้อย ${gap} กะ`
}

function presets(shifts: Shift[]): { name: string; seq: string[] }[] {
  const ids = shifts.map((s) => s.id)
  return [
    { name: 'หมุนเวียน', seq: rotationSeq(ids) },
    ...shifts.map((s) => ({ name: `${s.name}ล้วน`, seq: singleShiftSeq(s.id) })),
    { name: 'กำหนดเอง', seq: Array<string>(7).fill(OFF) },
  ]
}

export function PatternStep({ config, actions }: StepProps) {
  const { shifts, patterns } = config

  return (
    <div className="stack">
      {patterns.length === 0 && (
        <p className="empty">ยังไม่มีรูปแบบรอบ เลือกแบบสำเร็จด้านล่างเพื่อเริ่ม</p>
      )}

      {patterns.map((p) => (
        <PatternCard
          key={p.id}
          pattern={p}
          shifts={shifts}
          onChange={(patch) => actions.updatePattern(p.id, patch)}
          onRemove={() => {
            if (window.confirm(`ลบรูปแบบ "${p.name}"?`)) actions.removePattern(p.id)
          }}
        />
      ))}

      <section className="card">
        <h3 className="card-title">เพิ่มรูปแบบรอบ</h3>
        <p className="muted small">เลือกแบบสำเร็จแล้วค่อยปรับทีหลังได้</p>
        <div className="preset-grid">
          {presets(shifts).map((pr) => (
            <button
              key={pr.name}
              type="button"
              className="preset"
              onClick={() => actions.addPattern(pr.name, pr.seq)}
            >
              <span className="preset-name">
                <Icon name="plus" size={16} /> {pr.name}
              </span>
              <span className="mini-cells" aria-hidden="true">
                {pr.seq.map((x, i) => (
                  <span key={i} className={`mini-cell ${toneClass(shifts, x)}`} />
                ))}
              </span>
            </button>
          ))}
        </div>
      </section>
    </div>
  )
}

type CardProps = {
  pattern: Pattern
  shifts: Shift[]
  onChange: (patch: Partial<Pattern>) => void
  onRemove: () => void
}

function PatternCard({ pattern, shifts, onChange, onRemove }: CardProps) {
  const { seq } = pattern
  const [picked, setPicked] = useState<string>(shifts[0]?.id ?? OFF)
  const brush = picked === OFF || shifts.some((s) => s.id === picked) ? picked : OFF
  const brushes = [...shifts.map((s) => s.id), OFF]
  const issue = checkPattern(seq, shifts.map((s) => s.id))
  const work = seq.filter((x) => x !== OFF).length
  const bad = new Set<number>(
    issue === null ? [] : issue.kind === 'rest' ? [issue.from, issue.to] : [issue.day],
  )

  const paint = (i: number) => {
    const value = seq[i] === brush ? OFF : brush
    onChange({ seq: seq.map((x, j) => (j === i ? value : x)) })
  }

  return (
    <section className={`card pattern-card ${issue ? 'has-issue' : ''}`}>
      <div className="pattern-head">
        <input
          className="input input-title"
          value={pattern.name}
          placeholder="ชื่อรูปแบบ"
          aria-label="ชื่อรูปแบบรอบ"
          onChange={(e) => onChange({ name: e.target.value })}
        />
        <button type="button" className="icon-btn" aria-label="ลบรูปแบบนี้" onClick={onRemove}>
          <Icon name="trash" />
        </button>
      </div>
      <p className="muted small">
        รอบละ {seq.length} วัน · ทำ {work} หยุด {seq.length - work}
      </p>

      <div className="brush-panel">
        <span className="brush-hint">เลือกกะ แล้วแตะช่องวันด้านล่าง (แตะซ้ำ = หยุด)</span>
        <div className="brush-options" role="radiogroup" aria-label={`กะที่จะใส่ใน ${pattern.name}`}>
          {brushes.map((id) => (
            <button
              key={id}
              type="button"
              role="radio"
              aria-checked={brush === id}
              className={`brush ${toneClass(shifts, id)}`}
              onClick={() => setPicked(id)}
            >
              <span className="brush-dot" aria-hidden="true" />
              {shiftLabel(shifts, id)}
            </button>
          ))}
        </div>
      </div>

      <div className="cells">
        {seq.map((x, i) => (
          <button
            key={i}
            type="button"
            className={`day-cell ${toneClass(shifts, x)} ${bad.has(i) ? 'is-bad' : ''}`}
            aria-label={`วันที่ ${i + 1}: ${shiftLabel(shifts, x)}`}
            onClick={() => paint(i)}
          >
            <span className="day-num">{i + 1}</span>
            <span className="day-chip">{shiftShort(shifts, x)}</span>
          </button>
        ))}
      </div>

      <div className="len-ctrl">
        <span className="muted">จำนวนวันในรอบ</span>
        <NumberStepper
          value={seq.length}
          min={1}
          max={MAX_LENGTH}
          label="จำนวนวันในรอบ"
          onChange={(n) =>
            onChange({
              seq: n < seq.length ? seq.slice(0, n) : [...seq, ...Array<string>(n - seq.length).fill(OFF)],
            })
          }
        />
      </div>

      {issue ? (
        <p className="status status-bad">
          <Icon name="alert" /> {issueText(issue, seq, shifts)}
        </p>
      ) : work === 0 ? (
        <p className="status status-warn">
          <Icon name="info" /> ยังไม่มีวันทำงานในรอบนี้
        </p>
      ) : (
        <p className="status status-ok">
          <Icon name="check" /> พักเพียงพอ ใช้ได้
        </p>
      )}
    </section>
  )
}
