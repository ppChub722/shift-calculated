import { addDays, dayIndex, formatThaiLong } from '../domain/dates'
import { Icon } from './Icon'
import type { StepProps } from './useConfig'

const DAY_PRESETS = [14, 30, 60, 90]
const MAX_DAYS = 366

export function PeriodStep({ config, actions }: StepProps) {
  const end = addDays(config.startDate, config.days - 1)

  return (
    <div className="stack">
      <section className="card stack">
        <div className="date-range">
          <div className="field">
            <label htmlFor="start-date">วันเริ่มตาราง</label>
            <input
              id="start-date"
              type="date"
              className="input"
              value={config.startDate}
              onChange={(e) =>
                e.target.value && actions.setPeriod({ startDate: e.target.value })
              }
            />
          </div>
          <div className="field">
            <label htmlFor="end-date">วันสิ้นสุด</label>
            <input
              id="end-date"
              type="date"
              className="input"
              min={config.startDate}
              max={addDays(config.startDate, MAX_DAYS - 1)}
              value={end}
              onChange={(e) => {
                if (!e.target.value) return
                const n = dayIndex(config.startDate, e.target.value) + 1
                if (n >= 1 && n <= MAX_DAYS) actions.setPeriod({ days: n })
              }}
            />
          </div>
        </div>

        <div className="field">
          <span className="label" id="days-label">
            หรือเลือกจำนวนวัน
          </span>
          <div className="chip-group" role="group" aria-labelledby="days-label">
            {DAY_PRESETS.map((n) => (
              <button
                key={n}
                type="button"
                className="chip"
                aria-pressed={config.days === n}
                onClick={() => actions.setPeriod({ days: n })}
              >
                {n} วัน
              </button>
            ))}
          </div>
          <label className="inline-number">
            หรือพิมพ์เอง
            <input
              type="number"
              inputMode="numeric"
              className="input input-num"
              min={1}
              max={MAX_DAYS}
              value={config.days}
              onChange={(e) => {
                const n = Number(e.target.value)
                if (Number.isInteger(n) && n >= 1 && n <= MAX_DAYS) {
                  actions.setPeriod({ days: n })
                }
              }}
            />
            วัน
          </label>
        </div>
      </section>

      <section className="summary">
        <span className="summary-icon">
          <Icon name="calendar" />
        </span>
        <div>
          <strong>
            {formatThaiLong(config.startDate)} – {formatThaiLong(end)}
          </strong>
          <p>
            รวม {config.days} วัน ตารางเดินต่อเนื่องทุกวัน
            ไม่แยกวันเสาร์อาทิตย์หรือวันหยุดนักขัตฤกษ์
          </p>
        </div>
      </section>
    </div>
  )
}
