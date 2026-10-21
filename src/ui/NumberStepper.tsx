import { Icon } from './Icon'

type Props = {
  value: number
  min?: number
  max?: number
  label: string
  onChange: (v: number) => void
}

export function NumberStepper({ value, min = 0, max = 99, label, onChange }: Props) {
  return (
    <div className="num-stepper" role="group" aria-label={label}>
      <button
        type="button"
        aria-label={`ลด ${label}`}
        disabled={value <= min}
        onClick={() => onChange(value - 1)}
      >
        <Icon name="minus" size={18} />
      </button>
      <output aria-live="polite">{value}</output>
      <button
        type="button"
        aria-label={`เพิ่ม ${label}`}
        disabled={value >= max}
        onClick={() => onChange(value + 1)}
      >
        <Icon name="plus" size={18} />
      </button>
    </div>
  )
}
