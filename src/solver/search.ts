import type { Problem } from './types'

export type SearchOptions = {
  deadline: number
  now: () => number
  onTick?: (nodes: number) => void
}

export type SearchResult = {
  /** index ตัวเลือกต่อพนักงาน (-1 = ไม่มีตัวเลือก) หรือ null ถ้าไม่เจอ */
  choice: Int32Array | null
  /** ค้นครบทุกทางแล้วไม่เจอ = พิสูจน์ว่าจัดไม่ได้ */
  exhausted: boolean
  nodes: number
}

/** คนที่ตัวเลือกน้อยไปก่อน คนที่ตัวเลือกเหมือนกันทุกอย่างอยู่ติดกัน */
function orderEmployees(p: Problem) {
  const keys = p.candidates.map((cs) => cs.map((c) => c.cells.join(',')).join('|'))
  const order = p.candidates.map((_, e) => e).filter((e) => p.candidates[e].length > 0)
  order.sort(
    (a, b) =>
      p.candidates[a].length - p.candidates[b].length ||
      (keys[a] < keys[b] ? -1 : keys[a] > keys[b] ? 1 : 0),
  )
  // คนที่เหมือนกันสลับกันได้ ให้เลือก index ไม่ลดลง จะได้ไม่ค้นทางซ้ำ
  const same = order.map((e, i) => i > 0 && keys[order[i - 1]] === keys[e])
  return { order, same }
}

/** ขั้น 4: backtracking ตัดกิ่งด้วย max และ "ยังไปถึง min ได้ไหม" */
export function backtrack(p: Problem, opts: SearchOptions): SearchResult {
  const { T, min, max, candidates } = p
  const { order, same } = orderEmployees(p)
  const n = order.length

  const canCells = order.map((e) => {
    const set = new Set<number>()
    for (const c of candidates[e]) for (const t of c.slots) set.add(t)
    return [...set]
  })
  const potential = new Int32Array(T)
  for (const cells of canCells) for (const t of cells) potential[t]++
  const cov = new Int32Array(T)
  const choice = new Int32Array(n)
  let nodes = 0
  let timedOut = false

  const rec = (i: number): boolean => {
    // ทุก slot ผ่าน cov + potential >= min มาตลอด และตอนนี้ potential = 0 แล้ว
    if (i === n) return true
    nodes++
    if ((nodes & 1023) === 0) {
      opts.onTick?.(nodes)
      if (opts.now() > opts.deadline) timedOut = true
    }
    if (timedOut) return false

    const cands = candidates[order[i]]
    const mine = canCells[i]
    for (const t of mine) potential[t]--

    // score = ช่องที่ยังขาด min ที่แถวนี้เติม (×2) ลบช่องที่จะชน max พอดี
    const scored: { c: number; score: number }[] = []
    for (let c = same[i] ? choice[i - 1] : 0; c < cands.length; c++) {
      let fits = true
      let score = 0
      for (const t of cands[c].slots) {
        const v = cov[t]
        if (v >= max[t]) {
          fits = false
          break
        }
        if (v < min[t]) score += 2
        if (v + 1 === max[t]) score -= 1
      }
      if (fits) scored.push({ c, score })
    }
    scored.sort((a, b) => b.score - a.score)

    for (const { c } of scored) {
      const slots = cands[c].slots
      for (const t of slots) cov[t]++
      // slot อื่นนอก mine ไม่เปลี่ยน จึงเช็คแค่ mine พอ
      let reachable = true
      for (const t of mine) {
        if (cov[t] + potential[t] < min[t]) {
          reachable = false
          break
        }
      }
      if (reachable) {
        choice[i] = c
        if (rec(i + 1)) return true
      }
      for (const t of slots) cov[t]--
      if (timedOut) break
    }

    for (const t of mine) potential[t]++
    return false
  }

  const found = rec(0)
  if (!found) return { choice: null, exhausted: !timedOut, nodes }
  const perEmployee = new Int32Array(candidates.length).fill(-1)
  order.forEach((e, i) => (perEmployee[e] = choice[i]))
  return { choice: perEmployee, exhausted: false, nodes }
}

/**
 * ขั้น 5: หาตารางที่ penalty ต่ำสุดเมื่อจัดให้ครบไม่ได้
 * penalty = ผลรวมคนที่ขาดจาก min + ผลรวมคนที่เกินจาก max
 * เริ่มจาก greedy แล้วไล่เปลี่ยนตัวเลือกทีละคนจนไม่ดีขึ้น
 */
export function bestEffort(p: Problem, opts: { deadline: number; now: () => number }): Int32Array {
  const { T, min, max, candidates } = p
  const cov = new Int32Array(T)
  const choice = new Int32Array(candidates.length).fill(-1)

  const addCost = (slots: number[]) => {
    let d = 0
    for (const t of slots) {
      const v = cov[t]
      if (v < min[t]) d--
      else if (v >= max[t]) d++
    }
    return d
  }
  const apply = (slots: number[], k: number) => {
    for (const t of slots) cov[t] += k
  }
  const pickBest = (e: number) => {
    let best = -1
    let bestCost = Infinity
    candidates[e].forEach((c, i) => {
      const cost = addCost(c.slots)
      if (cost < bestCost) {
        bestCost = cost
        best = i
      }
    })
    return { best, bestCost }
  }

  const order = candidates
    .map((_, e) => e)
    .filter((e) => candidates[e].length > 0)
    .sort((a, b) => candidates[a].length - candidates[b].length)

  for (const e of order) {
    const { best } = pickBest(e)
    choice[e] = best
    apply(candidates[e][best].slots, 1)
  }

  for (let round = 0; round < 200 && opts.now() < opts.deadline; round++) {
    let improved = false
    for (const e of order) {
      const current = candidates[e][choice[e]].slots
      apply(current, -1)
      const currentCost = addCost(current)
      const { best, bestCost } = pickBest(e)
      if (bestCost < currentCost) {
        choice[e] = best
        improved = true
      }
      apply(candidates[e][choice[e]].slots, 1)
    }
    if (!improved) break
  }
  return choice
}
