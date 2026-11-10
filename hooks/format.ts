type Limit = { kind: string; percentUsed: number; resetsAt?: string }

export type Input = {
  /** tokens this session, cache reads excluded */
  tokens: number | null
  /** context window fill, % */
  context: number | null
  /** session cost, USD */
  cost: number | null
  limits: Limit[]
}

export type Usage = {
  /** tokens this session (input + output + cache writes; cache reads excluded) */
  tokens: number | null
  /** context window fill, % used (rounded) */
  context: number | null
  /** session cost, USD (2 decimals) */
  cost: number | null
  /** 5h window, % used (rounded) */
  fiveHour: number | null
  /** 5h window reset, ISO 8601 */
  fiveHourResetsAt: string | null
  /** weekly, % used (rounded) */
  week: number | null
  /** weekly pace: allowed-so-far minus used, in % points; negative = ahead of pace */
  budget: number | null
  /** weekly reset, ISO 8601 */
  weekResetsAt: string | null
}

const HOUR = 3_600_000
const DAY = 24 * HOUR

// Nerd Font, Material Design set
export const ICON = { session: '\u{F0B79}', fiveHour: '\u{F0954}', week: '\u{F00ED}' }

export function parseUsage(input: Input, now: number): Usage {
  const five = input.limits.find(l => l.kind === 'five_hour')
  const week = input.limits.find(l => l.kind === 'seven_day')

  let budget: number | null = null
  if (week?.resetsAt) {
    const hours = (now - (Date.parse(week.resetsAt) - 7 * DAY)) / HOUR
    budget = Math.round(Math.min(100, Math.max(0, hours) * (100 / 168)) - week.percentUsed)
  }

  const iso = (l?: Limit) => (l?.resetsAt ? new Date(l.resetsAt).toISOString() : null)

  return {
    tokens: input.tokens,
    context: input.context === null ? null : Math.round(input.context),
    cost: input.cost === null ? null : Math.round(input.cost * 100) / 100,
    fiveHour: five ? Math.round(five.percentUsed) : null,
    fiveHourResetsAt: iso(five),
    week: week ? Math.round(week.percentUsed) : null,
    budget,
    weekResetsAt: iso(week),
  }
}

export function formatTokens(n: number): string {
  if (n < 1000) return String(n)
  if (n < 1_000_000) return `${+(n / 1000).toFixed(1)}k`
  return `${+(n / 1_000_000).toFixed(1)}M`
}

const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

/** 12h local time, `02:40am`; prefixed with the weekday when not today. */
export function formatReset(iso: string, now: number): string {
  const d = new Date(iso)
  const h = d.getHours()
  const time = `${String(h % 12 || 12).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}${h < 12 ? 'am' : 'pm'}`
  return d.toDateString() === new Date(now).toDateString() ? time : `${WEEKDAYS[d.getDay()]} ${time}`
}

const signed = (n: number) => `${n >= 0 ? '+' : ''}${n}%`

// ANSI 256-color foreground per group: blue, green, orange
const COLOR = { session: 75, fiveHour: 78, week: 208 }

export function usageText(u: Usage, now: number, color = false): string | undefined {
  const paint = (code: number, s: string) => (color ? `\x1b[38;5;${code}m${s}\x1b[39m` : s)
  const groups: string[] = []

  const session: string[] = []
  if (u.tokens !== null) session.push(formatTokens(u.tokens))
  if (u.context !== null) session.push(`ctx ${u.context}%`)
  // if (u.cost !== null) session.push(`$${u.cost.toFixed(2)}`)
  if (session.length) groups.push(paint(COLOR.session, `${ICON.session} ${session.join(' · ')}`))

  if (u.fiveHour !== null) {
    const reset = u.fiveHourResetsAt ? ` [${formatReset(u.fiveHourResetsAt, now)}]` : ''
    groups.push(paint(COLOR.fiveHour, `${ICON.fiveHour} 5h ${u.fiveHour}%${reset}`))
  }

  if (u.week !== null) {
    const budget = u.budget !== null ? ` (${signed(u.budget)})` : ''
    const reset = u.weekResetsAt ? ` [${formatReset(u.weekResetsAt, now)}]` : ''
    groups.push(paint(COLOR.week, `${ICON.week} wk ${u.week}%${budget}${reset}`))
  }

  return groups.length ? groups.join('  ·  ') : undefined
}

export function formatUsage(input: Input, now: number): string | undefined {
  return usageText(parseUsage(input, now), now)
}
