import { test, expect } from 'claude-code/testing'
import { formatReset, formatTokens, formatUsage, parseUsage, ICON } from './format'

const now = Date.parse('2026-10-12T12:00:00Z')
const limits = [
  { kind: 'five_hour', percentUsed: 23.5, resetsAt: '2026-10-12T15:00:00Z' },
  { kind: 'seven_day', percentUsed: 30, resetsAt: '2026-10-14T12:00:00Z' },
]
const input = { tokens: 24_500, context: 37.6, cost: 1.836, limits }

test('groups session, 5h and week', () => {
  const out = formatUsage(input, now)!
  expect(out).toContain(`${ICON.session} 24.5k · ctx 38% · $1.84`)
  expect(out).toContain(`${ICON.fiveHour} 5h 24% [`)
  // week started 10-07 12:00 → 120h × 100/168 = 71.4 → minus 30 used = +41
  expect(out).toContain(`${ICON.week} wk 30% (+41%) [`)
})

test('negative budget when ahead of pace', () => {
  const out = formatUsage(
    { ...input, limits: [{ kind: 'seven_day', percentUsed: 30, resetsAt: '2026-10-14T12:00:00Z' }] },
    Date.parse('2026-10-08T12:00:00Z'),
  )
  // 24h → 14.3 allowed, 30 used → -16
  expect(out).toContain('(-16%)')
})

test('parseUsage exposes each value on its own', () => {
  const u = parseUsage(input, now)
  expect(u).toEqual({
    tokens: 24_500,
    context: 38,
    cost: 1.84,
    fiveHour: 24,
    fiveHourResetsAt: '2026-10-12T15:00:00.000Z',
    week: 30,
    budget: 41,
    weekResetsAt: '2026-10-14T12:00:00.000Z',
  })
})

test('parseUsage leaves missing values null', () => {
  expect(parseUsage({ tokens: null, context: null, cost: null, limits: [] }, 0)).toEqual({
    tokens: null,
    context: null,
    cost: null,
    fiveHour: null,
    fiveHourResetsAt: null,
    week: null,
    budget: null,
    weekResetsAt: null,
  })
})

test('formats token counts', () => {
  expect(formatTokens(950)).toBe('950')
  expect(formatTokens(24_500)).toBe('24.5k')
  expect(formatTokens(1_250_000)).toBe('1.3M')
})

test('reset shows weekday only when not today', () => {
  const today = new Date(2026, 9, 12, 14, 40).toISOString()
  const later = new Date(2026, 9, 14, 18, 59).toISOString()
  const n = new Date(2026, 9, 12, 12, 0).getTime()
  expect(formatReset(today, n)).toBe('02:40pm')
  expect(formatReset(later, n)).toBe('Wed 06:59pm')
})
