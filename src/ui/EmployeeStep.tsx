import { useState } from 'react'
import { addDays, formatThaiShort } from '../domain/dates'
import { sampleEmployees } from '../domain/defaults'
import type { Blocked, Config, Employee } from '../domain/types'
import { Icon } from './Icon'
import { firstLetter, toneByIndex } from './shiftStyle'
import type { ConfigActions, StepProps } from './useConfig'

export function EmployeeStep({ config, actions }: StepProps) {
  const [draft, setDraft] = useState('')
  const [openId, setOpenId] = useState<string | null>(null)
  const { employees } = config

  const add = () => {
    const names = draft
      .split(/[,\n]/)
      .map((s) => s.trim())
      .filter(Boolean)
    if (names.length === 0) return
    actions.addEmployees(
      names.map((name) => ({ id: crypto.randomUUID(), name, leaves: [], blocked: [] })),
    )
    setDraft('')
  }

  return (
    <div className="stack">
      <form
        className="card add-row"
        onSubmit={(e) => {
          e.preventDefault()
          add()
        }}
      >
        <label htmlFor="new-emp" className="sr-only">
          ชื่อพนักงาน
        </label>
        <input
          id="new-emp"
          className="input"
          value={draft}
          placeholder="พิมพ์ชื่อ (หลายคนคั่นด้วย , )"
          autoComplete="off"
          onChange={(e) => setDraft(e.target.value)}
        />
        <button type="submit" className="btn btn-primary" disabled={!draft.trim()}>
          <Icon name="plus" /> เพิ่ม
        </button>
      </form>

      {employees.length === 0 ? (
        <div className="card empty-card">
          <span className="summary-icon">
            <Icon name="users" />
          </span>
          <p>ยังไม่มีพนักงาน เพิ่มชื่อด้านบน หรือลองใช้รายชื่อตัวอย่างก่อนก็ได้</p>
          <button
            type="button"
            className="btn btn-secondary"
            onClick={() => actions.addEmployees(sampleEmployees())}
          >
            ใช้รายชื่อตัวอย่าง 7 คน
          </button>
        </div>
      ) : (
        <>
          <p className="muted small">
            ทั้งหมด {employees.length} คน · แตะ “วันลา / ข้อห้าม” เพื่อตั้งค่ารายคน
          </p>
          <ul className="emp-list">
            {employees.map((emp, i) => (
              <EmployeeRow
                key={emp.id}
                emp={emp}
                index={i}
                config={config}
                actions={actions}
                open={openId === emp.id}
                onToggle={() => setOpenId(openId === emp.id ? null : emp.id)}
              />
            ))}
          </ul>
        </>
      )}
    </div>
  )
}

type RowProps = {
  emp: Employee
  index: number
  config: Config
  actions: ConfigActions
  open: boolean
  onToggle: () => void
}

function EmployeeRow({ emp, index, config, actions, open, onToggle }: RowProps) {
  const [leaveDraft, setLeaveDraft] = useState('')
  const start = config.startDate
  const end = addDays(start, config.days - 1)
  const inRange = (d: string) => d >= start && d <= end
  const update = (patch: Partial<Employee>) => actions.updateEmployee(emp.id, patch)
  const bodyId = `emp-body-${emp.id}`

  const addLeave = () => {
    if (!leaveDraft || emp.leaves.includes(leaveDraft)) return
    update({ leaves: [...emp.leaves, leaveDraft].sort() })
    setLeaveDraft('')
  }

  const setBlocked = (i: number, patch: Partial<Blocked>) =>
    update({ blocked: emp.blocked.map((b, j) => (j === i ? { ...b, ...patch } : b)) })

  return (
    <li className={`card emp ${open ? 'is-open' : ''}`}>
      <div className="emp-head">
        <span className={`avatar ${toneByIndex(index)}`} aria-hidden="true">
          {firstLetter(emp.name)}
        </span>
        <input
          className="input input-plain"
          value={emp.name}
          placeholder="ชื่อ"
          aria-label={`ชื่อพนักงานคนที่ ${index + 1}`}
          onChange={(e) => update({ name: e.target.value })}
        />
        <button
          type="button"
          className="icon-btn"
          aria-label={`ลบ ${emp.name}`}
          onClick={() => {
            if (window.confirm(`ลบ ${emp.name || 'พนักงานคนนี้'}?`)) actions.removeEmployee(emp.id)
          }}
        >
          <Icon name="trash" />
        </button>
      </div>

      <button
        type="button"
        className="emp-toggle"
        aria-expanded={open}
        aria-controls={bodyId}
        onClick={onToggle}
      >
        <span>วันลา / ข้อห้าม</span>
        {emp.leaves.length > 0 && <span className="tag">ลา {emp.leaves.length} วัน</span>}
        {emp.blocked.length > 0 && <span className="tag">ห้าม {emp.blocked.length} ข้อ</span>}
        <span className="chev">
          <Icon name="chevronDown" size={18} />
        </span>
      </button>

      {open && (
        <div className="emp-body" id={bodyId}>
          <div className="sub">
            <h4>วันลา</h4>
            <p className="muted small">วันที่ลาจะไม่ถูกนับเข้ากะ แต่รอบเวรยังเดินต่อตามปกติ</p>
            {emp.leaves.length > 0 && (
              <div className="date-chips">
                {emp.leaves.map((d) => (
                  <span key={d} className={`date-chip ${inRange(d) ? '' : 'is-out'}`}>
                    {formatThaiShort(d)}
                    {!inRange(d) && ' · นอกช่วงตาราง'}
                    <button
                      type="button"
                      aria-label={`ลบวันลา ${formatThaiShort(d)}`}
                      onClick={() => update({ leaves: emp.leaves.filter((x) => x !== d) })}
                    >
                      <Icon name="x" size={16} />
                    </button>
                  </span>
                ))}
              </div>
            )}
            <div className="inline-form">
              <input
                type="date"
                className="input"
                aria-label="วันที่ลา"
                min={start}
                max={end}
                value={leaveDraft}
                onChange={(e) => setLeaveDraft(e.target.value)}
              />
              <button
                type="button"
                className="btn btn-secondary"
                disabled={!leaveDraft}
                onClick={addLeave}
              >
                <Icon name="plus" /> เพิ่มวันลา
              </button>
            </div>
          </div>

          <div className="sub">
            <h4>กะที่ทำไม่ได้</h4>
            <p className="muted small">เช่น ช่วงนี้เข้ากะดึกไม่ได้</p>
            {emp.blocked.map((b, i) => (
              <div key={i} className="blocked-row">
                <label className="blocked-field">
                  <span>ห้ามเข้ากะ</span>
                  <select
                    className="input"
                    value={b.shiftId}
                    onChange={(e) => setBlocked(i, { shiftId: e.target.value })}
                  >
                    {config.shifts.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.name}
                      </option>
                    ))}
                  </select>
                </label>
                <label className="blocked-field">
                  <span>ตั้งแต่</span>
                  <input
                    type="date"
                    className="input"
                    value={b.from}
                    onChange={(e) => e.target.value && setBlocked(i, { from: e.target.value })}
                  />
                </label>
                <label className="blocked-field">
                  <span>ถึง</span>
                  <input
                    type="date"
                    className="input"
                    value={b.to}
                    onChange={(e) => e.target.value && setBlocked(i, { to: e.target.value })}
                  />
                </label>
                <button
                  type="button"
                  className="icon-btn blocked-remove"
                  aria-label="ลบข้อห้ามนี้"
                  onClick={() => update({ blocked: emp.blocked.filter((_, j) => j !== i) })}
                >
                  <Icon name="x" />
                </button>
                {b.to < b.from && (
                  <p className="status status-bad blocked-error">
                    <Icon name="alert" /> วันสิ้นสุดต้องไม่ก่อนวันเริ่ม
                  </p>
                )}
              </div>
            ))}
            <button
              type="button"
              className="btn btn-dashed btn-sm"
              onClick={() =>
                update({
                  blocked: [
                    ...emp.blocked,
                    { shiftId: config.shifts[config.shifts.length - 1].id, from: start, to: end },
                  ],
                })
              }
            >
              <Icon name="plus" /> เพิ่มข้อห้าม
            </button>
          </div>
        </div>
      )}
    </li>
  )
}
