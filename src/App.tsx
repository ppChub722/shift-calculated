import { useState } from 'react'
import { defaultConfig } from './domain/defaults'
import { checkPattern } from './domain/rules'
import { OFF, type Config } from './domain/types'
import { downloadText } from './io/download'
import { EmployeeStep } from './ui/EmployeeStep'
import { Icon, type IconName } from './ui/Icon'
import { PatternStep } from './ui/PatternStep'
import { PeriodStep } from './ui/PeriodStep'
import { ReviewStep } from './ui/ReviewStep'
import { ShiftStep } from './ui/ShiftStep'
import { useConfig } from './ui/useConfig'

type Step = { title: string; lead: string; icon: IconName }

const STEPS: Step[] = [
  { title: 'ช่วงเวลา', lead: 'เลือกวันเริ่มและความยาวของตาราง', icon: 'calendar' },
  {
    title: 'กะทำงาน',
    lead: 'กะในหนึ่งวัน เรียงตามเวลา พร้อมจำนวนคนที่ต้องการในแต่ละกะ',
    icon: 'clock',
  },
  {
    title: 'รูปแบบรอบ',
    lead: 'ลำดับกะที่แต่ละคนทำวนไปเรื่อย ๆ ระบบจะเลือกเองว่าใครใช้แบบไหน และเริ่มจากวันไหนของรอบ',
    icon: 'repeat',
  },
  {
    title: 'พนักงาน',
    lead: 'รายชื่อคนในทีม ใส่วันลาและกะที่ทำไม่ได้ของแต่ละคนได้',
    icon: 'users',
  },
  { title: 'จัดตาราง', lead: 'ตรวจข้อมูลก่อนให้ระบบจัดตาราง', icon: 'sparkle' },
]

function stepIssues(config: Config): boolean[] {
  const ids = config.shifts.map((s) => s.id)
  const badPattern =
    config.patterns.length === 0 ||
    config.patterns.some(
      (p) => checkPattern(p.seq, ids) !== null || p.seq.every((x) => x === OFF),
    )
  return [false, false, badPattern, config.employees.length === 0, false]
}

/** ขั้นปัจจุบันอยู่ใน URL (#step-3) รีเฟรชแล้วไม่เด้งกลับขั้นแรก */
function stepFromHash(): number {
  const n = Number(/^#step-(\d+)$/.exec(window.location.hash)?.[1])
  return n >= 1 && n <= STEPS.length ? n - 1 : 0
}

function App() {
  const { config, actions, brokenRaw, canSave } = useConfig()
  const [step, setStep] = useState(stepFromHash)
  const issues = stepIssues(config)
  const current = STEPS[step]

  const goto = (i: number) => {
    setStep(i)
    history.replaceState(null, '', `#step-${i + 1}`)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const props = { config, actions }

  return (
    <div className="app">
      <header className="app-header">
        <div className="brand">
          <svg className="logo" viewBox="0 0 32 32" aria-hidden="true">
            <rect width="32" height="32" rx="9" className="logo-bg" />
            <rect x="7" y="8" width="18" height="4" rx="2" className="logo-t0" />
            <rect x="7" y="14" width="12" height="4" rx="2" className="logo-t1" />
            <rect x="7" y="20" width="15" height="4" rx="2" className="logo-t2" />
          </svg>
          <div>
            <h1>จัดเวร 24 ชม.</h1>
            <p>{canSave ? 'บันทึกอัตโนมัติในเครื่องนี้' : 'เบราว์เซอร์นี้บันทึกข้อมูลไม่ได้'}</p>
          </div>
        </div>
        <button
          type="button"
          className="btn btn-ghost btn-sm"
          onClick={() => {
            if (window.confirm('ล้างข้อมูลทั้งหมดแล้วเริ่มใหม่?')) {
              actions.reset(defaultConfig())
              goto(0)
            }
          }}
        >
          <Icon name="rotate" size={18} /> เริ่มใหม่
        </button>
      </header>

      {brokenRaw !== null && (
        <div className="banner" role="alert">
          <Icon name="alert" />
          <div>
            <strong>อ่านข้อมูลที่บันทึกไว้ไม่ได้</strong>
            <p>
              ตอนนี้แสดงค่าเริ่มต้น และยังไม่ได้บันทึกทับข้อมูลเดิม
              ดาวน์โหลดเก็บไว้ก่อนได้
            </p>
            <div className="banner-actions">
              <button
                type="button"
                className="btn btn-secondary btn-sm"
                onClick={() => downloadText('shift-config-backup.json', brokenRaw)}
              >
                <Icon name="download" size={18} /> ดาวน์โหลดข้อมูลเดิม
              </button>
              <button
                type="button"
                className="btn btn-ghost btn-sm"
                onClick={() => actions.reset(config)}
              >
                ใช้ค่าใหม่ต่อเลย
              </button>
            </div>
          </div>
        </div>
      )}

      <nav className="steps" aria-label="ขั้นตอน">
        <ol>
          {STEPS.map((s, i) => (
            <li key={s.title}>
              <button
                type="button"
                className={`step ${i === step ? 'is-current' : ''} ${i < step ? 'is-past' : ''}`}
                aria-current={i === step ? 'step' : undefined}
                onClick={() => goto(i)}
              >
                <span className="step-icon">
                  <Icon name={s.icon} size={18} />
                  {issues[i] && <span className="step-dot" aria-label="ต้องแก้ไข" />}
                </span>
                <span className="step-title">{s.title}</span>
              </button>
            </li>
          ))}
        </ol>
      </nav>

      <main>
        <div className="step-head">
          <span className="step-count">
            ขั้นที่ {step + 1} จาก {STEPS.length}
          </span>
          <h2>{current.title}</h2>
          <p>{current.lead}</p>
        </div>

        {step === 0 && <PeriodStep {...props} />}
        {step === 1 && <ShiftStep {...props} />}
        {step === 2 && <PatternStep {...props} />}
        {step === 3 && <EmployeeStep {...props} />}
        {step === 4 && <ReviewStep {...props} onGoto={goto} />}
      </main>

      <div className="step-nav">
        <button
          type="button"
          className="btn btn-secondary"
          disabled={step === 0}
          onClick={() => goto(step - 1)}
        >
          <Icon name="chevronLeft" /> ย้อนกลับ
        </button>
        {step < STEPS.length - 1 && (
          <button type="button" className="btn btn-primary" onClick={() => goto(step + 1)}>
            ถัดไป: {STEPS[step + 1].title} <Icon name="chevronRight" />
          </button>
        )}
      </div>
    </div>
  )
}

export default App
