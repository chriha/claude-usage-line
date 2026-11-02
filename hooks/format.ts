type Limit = { kind: string; percentUsed: number; resetsAt?: string }

export type Usage = {
  /** 5h session, % used (rounded) */
  session: number | null
  /** weekly, % used (rounded) */
  week: number | null
  /** weekly pace: allowed-so-far minus used, in % points; negative = ahead of pace */
  budget: number | null
  /** next session reset, local HH:MM */
  reset: string | null
  /** next session reset, ISO 8601 */
  resetsAt: string | null
}

const HOUR = 3_600_000
const DAY = 24 * HOUR

export function parseUsage(limits: Limit[], now: number): Usage {
  const session = limits.find(l => l.kind === 'five_hour')
  const week = limits.find(l => l.kind === 'seven_day')
  const usage: Usage = { session: null, week: null, budget: null, reset: null, resetsAt: null }

  if (session) usage.session = Math.round(session.percentUsed)

  if (week) {
    usage.week = Math.round(week.percentUsed)

    if (week.resetsAt) {
      const hours = (now - (Date.parse(week.resetsAt) - 7 * DAY)) / HOUR
      const balance = Math.min(100, Math.max(0, hours) * (100 / 168)) - week.percentUsed
      usage.budget = Math.round(balance)
    }
  }

  if (session?.resetsAt) {
    const d = new Date(session.resetsAt)
    usage.reset = `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`
    usage.resetsAt = d.toISOString()
  }

  return usage
}

export function usageText(u: Usage): string | undefined {
  const parts: string[] = []
  if (u.session !== null) parts.push(`5h ${u.session}%`)
  if (u.week !== null) parts.push(`wk ${u.week}%`)
  if (u.budget !== null) parts.push(`budget ${u.budget >= 0 ? '+' : ''}${u.budget}%`)
  if (u.reset !== null) parts.push(`reset ${u.reset}`)
  return parts.length ? parts.join(' · ') : undefined
}

export function formatUsage(limits: Limit[], now: number): string | undefined {
  return usageText(parseUsage(limits, now))
}
