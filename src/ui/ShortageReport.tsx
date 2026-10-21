import { addDays, formatThaiShort } from '../domain/dates'
import type { Config } from '../domain/types'
import type { Reason, SolveResult } from '../solver/types'
import { Icon } from './Icon'

const MAX_LINES = 8

type Props = { config: Config; result: SolveResult }

function reasonText(r: Reason, config: Config): string {
  const date = (d: number) => formatThaiShort(addDays(config.startDate, d))
  const shift = (s: number) => config.shifts[s]?.name ?? '?'
  switch (r.kind) {
    case 'no-candidate': {
      const name = config.employees.find((e) => e.id === r.employeeId)?.name ?? '?'
      return `${name} ติดข้อห้ามจนไม่มีรูปแบบรอบไหนใช้ได้ เลยไม่ได้ถูกจัดเข้าตาราง ลองลดช่วงห้าม หรือเพิ่มรูปแบบรอบที่ไม่มีกะนั้น`
    }
    case 'too-many-people':
      return `คนเยอะเกิน: ต่อให้ทุกคนทำน้อยที่สุดก็ยังรวม ${r.minWork} กะ แต่ทุกกะรับได้รวมสูงสุด ${r.capacity} กะ ลองเพิ่มจำนวนคนมากสุดต่อกะ หรือเพิ่มวันหยุดในรูปแบบรอบ`
    case 'shift-overflow':
      return `กะ${shift(r.shift)}คนล้น: ทุกคนต้องเข้ากะ${shift(r.shift)}รวมอย่างน้อย ${r.minCount} ครั้ง แต่กะนี้รับได้รวมสูงสุด ${r.capacity} ครั้ง ลองเพิ่มจำนวนคนมากสุดของกะ${shift(r.shift)} หรือเพิ่มรูปแบบที่มีกะนี้น้อยลง`
    case 'shift-capacity':
      return `กะ${shift(r.shift)}คนไม่พอ: ทั้งทีมเข้ากะ${shift(r.shift)}ได้รวมสูงสุด ${r.capacity} ครั้ง แต่ต้องการ ${r.need} ครั้ง ลองเพิ่มคน หรือเพิ่มรูปแบบที่มีกะ${shift(r.shift)}มากขึ้น`
    case 'day-short':
      return `${date(r.day)}: มีคนว่างทำงานได้ ${r.available} คน แต่ต้องการอย่างน้อย ${r.need} คน`
    case 'slot-unreachable':
      return `${date(r.day)} กะ${shift(r.shift)}: มีคนที่เข้ากะนี้ได้แค่ ${r.potential} คน แต่ต้องการ ${r.need} คน`
  }
}

export function ShortageReport({ config, result }: Props) {
  const { reasons, issues } = result
  if (reasons.length === 0 && issues.length === 0) return null

  const reasonLines = reasons.map((r) => reasonText(r, config))
  const issueLines = issues.map((i) => {
    const date = formatThaiShort(addDays(config.startDate, i.day))
    const shift = config.shifts[i.shift]?.name ?? '?'
    return `${date} กะ${shift} ${i.kind === 'short' ? 'ขาด' : 'เกิน'} ${i.amount} คน`
  })

  return (
    <section className="card stack report">
      {reasonLines.length > 0 && (
        <div>
          <h3 className="card-title">สาเหตุที่จัดให้ครบไม่ได้</h3>
          <ul className="report-list">
            {reasonLines.slice(0, MAX_LINES).map((t, i) => (
              <li key={i}>
                <Icon name="alert" size={18} /> {t}
              </li>
            ))}
          </ul>
          {reasonLines.length > MAX_LINES && (
            <p className="muted small">และอีก {reasonLines.length - MAX_LINES} ข้อ</p>
          )}
        </div>
      )}
      {issueLines.length > 0 && (
        <div>
          <h3 className="card-title">จุดที่ยังไม่ครบในตารางด้านล่าง ({issueLines.length})</h3>
          <ul className="report-list chips-list">
            {issueLines.slice(0, MAX_LINES * 2).map((t, i) => (
              <li key={i} className={issues[i].kind}>
                {t}
              </li>
            ))}
          </ul>
          {issueLines.length > MAX_LINES * 2 && (
            <p className="muted small">และอีก {issueLines.length - MAX_LINES * 2} จุด ดูตัวเลขสีแดงท้ายตาราง</p>
          )}
        </div>
      )}
    </section>
  )
}
