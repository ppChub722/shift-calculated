import type { Problem, Reason } from './types'

/** ขั้น 3: เงื่อนไขจำเป็นที่เช็คได้เร็ว ถ้าข้อไหนไม่ผ่าน แปลว่าจัดให้ครบไม่ได้แน่นอน */
export function precheck(p: Problem): Reason[] {
  const { N, S, T, min, max, candidates } = p
  const reasons: Reason[] = []

  candidates.forEach((cs, e) => {
    if (cs.length === 0) reasons.push({ kind: 'no-candidate', employeeId: p.employeeIds[e] })
  })
  const active = candidates.filter((cs) => cs.length > 0)

  // 1. คนเกิน: ต่อให้ทุกคนเลือกแบบที่ทำน้อยสุด ยังเกินที่ทุกกะรับได้รวมกัน
  const minWork = active.reduce((n, cs) => n + Math.min(...cs.map((c) => c.slots.length)), 0)
  const capacity = max.reduce((n, m) => n + m, 0)
  if (minWork > capacity) reasons.push({ kind: 'too-many-people', minWork, capacity })

  // potential[t] = จำนวนคนที่มีอย่างน้อยหนึ่งตัวเลือกที่ทำ slot t
  const potential = new Int32Array(T)
  // availableDay[d] = จำนวนคนที่มีตัวเลือกที่ทำงานวัน d (คนหนึ่งทำได้วันละกะ)
  const availableDay = new Int32Array(N)
  // shiftCap[s] / shiftFloor[s] = ผลรวมของ "จำนวนกะ s มากสุด / น้อยสุด ที่คนนั้นทำได้" ของทุกคน
  const shiftCap = new Int32Array(S)
  const shiftFloor = new Int32Array(S)
  for (const cs of active) {
    const slotSet = new Set<number>()
    const daySet = new Set<number>()
    const most = new Int32Array(S)
    const least = new Array<number>(S).fill(Infinity)
    for (const c of cs) {
      const count = new Int32Array(S)
      for (const t of c.slots) {
        slotSet.add(t)
        daySet.add(Math.floor(t / S))
        count[t % S]++
      }
      for (let s = 0; s < S; s++) {
        most[s] = Math.max(most[s], count[s])
        least[s] = Math.min(least[s], count[s])
      }
    }
    for (const t of slotSet) potential[t]++
    for (const d of daySet) availableDay[d]++
    for (let s = 0; s < S; s++) {
      shiftCap[s] += most[s]
      shiftFloor[s] += least[s]
    }
  }

  // 1b. กะล้น: ต่อให้ทุกคนเลือกแบบที่ทำกะ s น้อยสุด ยังเกิน max ของกะ s รวมทั้งช่วง
  for (let s = 0; s < S; s++) {
    let cap = 0
    for (let d = 0; d < N; d++) cap += max[d * S + s]
    if (shiftFloor[s] > cap) {
      reasons.push({ kind: 'shift-overflow', shift: s, minCount: shiftFloor[s], capacity: cap })
    }
  }

  // 2. คนไม่พอรายวัน
  for (let d = 0; d < N; d++) {
    let need = 0
    for (let s = 0; s < S; s++) need += min[d * S + s]
    if (availableDay[d] < need) {
      reasons.push({ kind: 'day-short', day: d, available: availableDay[d], need })
    }
  }

  // 3. กะที่ไม่มีใครเข้าได้พอ
  for (let t = 0; t < T; t++) {
    if (potential[t] < min[t]) {
      reasons.push({
        kind: 'slot-unreachable',
        day: Math.floor(t / S),
        shift: t % S,
        potential: potential[t],
        need: min[t],
      })
    }
  }

  // 4. ทั้งทีมเข้ากะ s ได้รวมไม่ถึงที่ต้องการทั้งช่วง
  for (let s = 0; s < S; s++) {
    let need = 0
    for (let d = 0; d < N; d++) need += min[d * S + s]
    if (shiftCap[s] < need) reasons.push({ kind: 'shift-capacity', shift: s, capacity: shiftCap[s], need })
  }

  return reasons
}
