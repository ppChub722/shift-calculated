import { useCallback, useEffect, useRef, useState } from 'react'
import type { Config } from '../domain/types'
import type { SolveResult } from '../solver/types'
import type { WorkerIn, WorkerOut } from '../solver/worker'

export type SolverState =
  | { kind: 'idle' }
  | { kind: 'running'; ms: number }
  /** config = ค่าที่ใช้คำนวณ เก็บไว้แสดงผล แม้ผู้ใช้จะแก้ข้อมูลทีหลัง */
  | { kind: 'done'; result: SolveResult; config: Config; key: string }
  | { kind: 'error'; message: string }

export function useSolver() {
  const [state, setState] = useState<SolverState>({ kind: 'idle' })
  const workerRef = useRef<Worker | null>(null)

  const stop = () => {
    workerRef.current?.terminate()
    workerRef.current = null
  }

  const cancel = useCallback(() => {
    stop()
    setState({ kind: 'idle' })
  }, [])

  const run = useCallback((config: Config) => {
    stop()
    const worker = new Worker(new URL('../solver/worker.ts', import.meta.url), {
      type: 'module',
    })
    workerRef.current = worker
    setState({ kind: 'running', ms: 0 })

    worker.onmessage = (e: MessageEvent<WorkerOut>) => {
      const m = e.data
      if (m.type === 'progress') {
        setState({ kind: 'running', ms: m.ms })
        return
      }
      stop()
      setState(
        m.type === 'done'
          ? { kind: 'done', result: m.result, config, key: JSON.stringify(config) }
          : { kind: 'error', message: m.message },
      )
    }
    worker.onerror = (e) => {
      stop()
      setState({ kind: 'error', message: e.message || 'คำนวณไม่สำเร็จ' })
    }
    worker.postMessage({ type: 'solve', config } satisfies WorkerIn)
  }, [])

  useEffect(() => stop, [])

  return { state, run, cancel }
}

export type SolverApi = ReturnType<typeof useSolver>
