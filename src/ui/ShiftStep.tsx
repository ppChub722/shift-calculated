import { MIN_SLOT_GAP } from '../domain/rules'
import type { Shift } from '../domain/types'
import { Icon } from './Icon'
import { NumberStepper } from './NumberStepper'
import { firstLetter, toneByIndex } from './shiftStyle'
import type { StepProps } from './useConfig'

const MAX_PEOPLE = 50

export function ShiftStep({ config, actions }: StepProps) {
  const { shifts } = config
  const used = new Set(config.patterns.flatMap((p) => p.seq))
  const sumMin = shifts.reduce((n, s) => n + s.min, 0)
  const sumMax = shifts.reduce((n, s) => n + s.max, 0)

  const remove = (s: Shift) => {
    if (
      used.has(s.id) &&
      !window.confirm(
        `กะ${s.name}ถูกใช้ในรูปแบบรอบอยู่ ถ้าลบ ช่องเหล่านั้นจะกลายเป็นวันหยุด ลบเลยไหม?`,
      )
    ) {
      return
    }
    actions.removeShift(s.id)
  }

  return (
    <div className="stack">
      <ol className="card list-card">
        {shifts.map((s, i) => (
          <li key={s.id} className="shift-row">
            <div className="shift-name">
              <span className={`badge ${toneByIndex(i)}`} aria-hidden="true">
                {firstLetter(s.name)}
              </span>
              <input
                className="input"
                value={s.name}
                placeholder="ชื่อกะ"
                aria-label={`ชื่อกะที่ ${i + 1}`}
                onChange={(e) => actions.updateShift(s.id, { name: e.target.value })}
              />
              <button
                type="button"
                className="icon-btn"
                aria-label={`ลบกะ${s.name}`}
                disabled={shifts.length === 1}
                onClick={() => remove(s)}
              >
                <Icon name="trash" />
              </button>
            </div>
            <div className="shift-need">
              <div className="need-field">
                <span className="muted small">อย่างน้อย (คน)</span>
                <NumberStepper
                  value={s.min}
                  max={MAX_PEOPLE}
                  label={`คนกะ${s.name}อย่างน้อย`}
                  onChange={(v) =>
                    actions.updateShift(s.id, { min: v, max: Math.max(v, s.max) })
                  }
                />
              </div>
              <div className="need-field">
                <span className="muted small">มากสุด (คน)</span>
                <NumberStepper
                  value={s.max}
                  min={1}
                  max={MAX_PEOPLE}
                  label={`คนกะ${s.name}มากสุด`}
                  onChange={(v) =>
                    actions.updateShift(s.id, { max: v, min: Math.min(v, s.min) })
                  }
                />
              </div>
            </div>
          </li>
        ))}
      </ol>

      <button type="button" className="btn btn-dashed" onClick={actions.addShift}>
        <Icon name="plus" /> เพิ่มกะ
      </button>

      <section className="summary">
        <span className="summary-icon">
          <Icon name="users" />
        </span>
        <div>
          <strong>
            ทั้งวันต้องการ {sumMin === sumMax ? sumMin : `${sumMin}–${sumMax}`} คน
          </strong>
          <p>
            กะเรียงตามเวลาในหนึ่งวัน ระบบใช้ลำดับนี้ตรวจว่าได้พักพอ
            คือทำหนึ่งกะแล้วต้องเว้นอย่างน้อย {MIN_SLOT_GAP - 1} กะ
          </p>
        </div>
      </section>
    </div>
  )
}
