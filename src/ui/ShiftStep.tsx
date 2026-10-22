import { forbiddenNextDay, maxRestShifts } from '../domain/rules'
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
          <p>กะเรียงตามเวลาในหนึ่งวัน ระบบใช้ลำดับนี้ตรวจกฎการพักด้านล่าง</p>
        </div>
      </section>

      <RestRule
        shifts={shifts}
        restShifts={config.rules.restShifts}
        onChange={actions.setRestShifts}
      />
    </div>
  )
}

function RestRule({
  shifts,
  restShifts,
  onChange,
}: {
  shifts: Shift[]
  restShifts: number
  onChange: (r: number) => void
}) {
  const S = shifts.length
  const top = maxRestShifts(S)
  const current = Math.min(restShifts, top)
  const pairs = forbiddenNextDay(S, current)
  const name = (i: number) => shifts[i]?.name ?? '?'

  return (
    <section className="card stack-sm">
      <h3 className="card-title">กฎการพัก</h3>
      {S === 1 ? (
        <p className="muted small">มีกะเดียวต่อวัน ทำได้วันละกะอยู่แล้ว ไม่ต้องตั้งกฎพัก</p>
      ) : (
        <>
          <p className="muted small">
            ทำกะหนึ่งแล้ว ต้องเว้นกี่กะก่อนเข้ากะถัดไป (ทุกแบบทำได้วันละกะเดียว)
          </p>
          <div className="chip-group" role="radiogroup" aria-label="กฎการพัก">
            {Array.from({ length: top + 1 }, (_, r) => (
              <button
                key={r}
                type="button"
                role="radio"
                aria-checked={current === r}
                className="chip"
                onClick={() => onChange(r)}
              >
                {r === 0 ? 'ไม่จำกัด' : `เว้น ${r} กะ`}
              </button>
            ))}
          </div>
          <p className="rest-explain">
            {pairs.length === 0 ? (
              <>
                <Icon name="info" size={18} /> ไม่มีข้อห้าม เช่น ทำกะ{name(S - 1)}แล้วต่อกะ
                {name(0)}วันรุ่งขึ้นได้
              </>
            ) : (
              <>
                <Icon name="info" size={18} /> ห้ามต่อกันวันรุ่งขึ้น:{' '}
                {pairs.map(([a, b]) => `${name(a)} → ${name(b)}`).join(', ')}
              </>
            )}
          </p>
        </>
      )}
    </section>
  )
}
