import type { Config } from '../domain/types'
import { solve } from './solver'
import type { Progress, SolveResult } from './types'

export type WorkerIn = { type: 'solve'; config: Config }
export type WorkerOut =
  | ({ type: 'progress' } & Progress)
  | { type: 'done'; result: SolveResult }
  | { type: 'error'; message: string }

// ยกเลิก = ฝั่ง UI terminate worker ทิ้ง
const post = (m: WorkerOut) => (self as unknown as Worker).postMessage(m)

self.onmessage = (e: MessageEvent<WorkerIn>) => {
  try {
    const result = solve(e.data.config, {
      onProgress: (p) => post({ type: 'progress', ...p }),
    })
    post({ type: 'done', result })
  } catch (err) {
    post({ type: 'error', message: err instanceof Error ? err.message : String(err) })
  }
}
