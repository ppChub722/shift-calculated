import type { Config } from '../domain/types'
import { buildProblem } from './candidates'
import { precheck } from './precheck'
import { backtrack, bestEffort } from './search'
import type { CoverageIssue, Problem, Progress, RosterRow, SolveResult } from './types'

export type SolveOptions = {
  now?: () => number
  timeLimitMs?: number
  onProgress?: (p: Progress) => void
}

const PROGRESS_EVERY_MS = 150
const BEST_EFFORT_MS = 2000

export function solve(config: Config, opts: SolveOptions = {}): SolveResult {
  const now = opts.now ?? (() => performance.now())
  const t0 = now()
  const limit = opts.timeLimitMs ?? config.solver.timeLimitMs

  const problem = buildProblem(config)
  const reasons = precheck(problem)

  let choice: Int32Array | null = null
  let exhausted = false
  let nodes = 0
  // ไม่ผ่านขั้น 3 = รู้แล้วว่าครบไม่ได้ ข้ามการค้นหา ไปหาตารางใกล้เคียงที่สุดเลย
  if (reasons.length === 0) {
    let lastTick = t0
    const r = backtrack(problem, {
      deadline: t0 + limit,
      now,
      onTick: (n) => {
        const t = now()
        if (t - lastTick >= PROGRESS_EVERY_MS) {
          lastTick = t
          opts.onProgress?.({ nodes: n, ms: Math.round(t - t0) })
        }
      },
    })
    choice = r.choice
    exhausted = r.exhausted
    nodes = r.nodes
  }
  if (!choice) choice = bestEffort(problem, { deadline: now() + BEST_EFFORT_MS, now })

  const { rows, coverage, issues } = evaluate(problem, choice)
  const status =
    issues.length === 0 ? 'solved' : reasons.length > 0 || exhausted ? 'infeasible' : 'partial'

  return { status, rows, coverage, issues, reasons, stats: { nodes, ms: Math.round(now() - t0) } }
}

/** นับคนต่อวันต่อกะ และรายการช่องที่ขาด min / เกิน max */
export function evaluate(p: Problem, choice: Int32Array) {
  const { N, S, min, max } = p
  const rows: RosterRow[] = p.employeeIds.map((employeeId, e) => {
    const c = choice[e] >= 0 ? p.candidates[e][choice[e]] : null
    return c
      ? { employeeId, patternId: c.patternId, offset: c.offset, cells: c.cells }
      : { employeeId, patternId: null, offset: 0, cells: p.idleCells[e] }
  })

  const coverage = Array.from({ length: N }, () => new Array<number>(S).fill(0))
  for (const r of rows) r.cells.forEach((s, d) => s >= 0 && coverage[d][s]++)

  const issues: CoverageIssue[] = []
  for (let d = 0; d < N; d++) {
    for (let s = 0; s < S; s++) {
      const v = coverage[d][s]
      const t = d * S + s
      if (v < min[t]) issues.push({ day: d, shift: s, kind: 'short', amount: min[t] - v })
      else if (v > max[t]) issues.push({ day: d, shift: s, kind: 'over', amount: v - max[t] })
    }
  }
  return { rows, coverage, issues }
}
