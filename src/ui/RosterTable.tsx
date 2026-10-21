import {
  addDays,
  formatMonth,
  formatWeekday,
  isWeekend,
} from '../domain/dates'
import type { Config } from '../domain/types'
import { CELL_LEAVE, type SolveResult } from '../solver/types'
import { firstLetter, toneByIndex } from './shiftStyle'

type Props = { config: Config; result: SolveResult }

export function RosterTable({ config, result }: Props) {
  const { shifts } = config
  const days = Array.from({ length: config.days }, (_, d) => addDays(config.startDate, d))
  const nameOf = new Map(config.employees.map((e) => [e.id, e.name]))

  return (
    <div className="roster-wrap">
      <table className="roster">
        <thead>
          <tr>
            <th className="sticky-col" scope="col">
              ชื่อ
            </th>
            {days.map((iso, d) => {
              const dom = Number(iso.slice(8))
              return (
                <th key={iso} scope="col" className={isWeekend(iso) ? 'is-weekend' : ''}>
                  <span className="r-month">{d === 0 || dom === 1 ? formatMonth(iso) : ' '}</span>
                  <span className="r-dom">{dom}</span>
                  <span className="r-dow">{formatWeekday(iso)}</span>
                </th>
              )
            })}
          </tr>
        </thead>
        <tbody>
          {result.rows.map((row) => {
            const work = row.cells.filter((c) => c >= 0).length
            return (
              <tr key={row.employeeId}>
                <th className="sticky-col" scope="row">
                  <span className="r-name">{nameOf.get(row.employeeId) ?? '?'}</span>
                  <span className="r-sub">ทำ {work} วัน</span>
                </th>
                {row.cells.map((c, d) => (
                  <td key={d} className={isWeekend(days[d]) ? 'is-weekend' : ''}>
                    {c >= 0 ? (
                      <span className={`rc ${toneByIndex(c)}`} title={shifts[c]?.name}>
                        {firstLetter(shifts[c]?.name ?? '?')}
                      </span>
                    ) : c === CELL_LEAVE ? (
                      <span className="rc rc-leave">ลา</span>
                    ) : (
                      <span className="rc rc-off" aria-label="หยุด">
                        ·
                      </span>
                    )}
                  </td>
                ))}
              </tr>
            )
          })}
        </tbody>
        <tfoot>
          {shifts.map((s, si) => (
            <tr key={s.id}>
              <th className="sticky-col" scope="row">
                <span className="r-sub">คนกะ{s.name}</span>
              </th>
              {result.coverage.map((day, d) => {
                const n = day[si]
                const cls = n < s.min ? 'short' : n > s.max ? 'over' : ''
                return (
                  <td key={d} className={`cov ${cls}`}>
                    {n}
                  </td>
                )
              })}
            </tr>
          ))}
        </tfoot>
      </table>
    </div>
  )
}
