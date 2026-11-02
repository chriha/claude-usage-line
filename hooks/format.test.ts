import { test, expect } from 'claude-code/testing'
import { formatUsage, parseUsage } from './format'

test('formats session, week, hourly budget and reset', () => {
  const now = Date.parse('2026-10-12T12:00:00Z')
  const out = formatUsage(
    [
      { kind: 'five_hour', percentUsed: 23.5, resetsAt: '2026-10-12T15:00:00Z' },
      { kind: 'seven_day', percentUsed: 30, resetsAt: '2026-10-14T12:00:00Z' },
    ],
    now,
  )
  // week started 10-07 12:00 → 120h × 100/168 = 71.4 → minus 30 used = +41
  expect(out).toContain('5h 24%')
  expect(out).toContain('wk 30%')
  expect(out).toContain('budget +41%')
})

test('negative budget when ahead of pace', () => {
  const now = Date.parse('2026-10-08T12:00:00Z')
  const out = formatUsage([{ kind: 'seven_day', percentUsed: 30, resetsAt: '2026-10-14T12:00:00Z' }], now)
  // 24h → 14.3 allowed, 30 used → -16
  expect(out).toContain('budget -16%')
})

test('parseUsage exposes each value on its own', () => {
  const u = parseUsage(
    [
      { kind: 'five_hour', percentUsed: 23.5, resetsAt: '2026-10-12T15:00:00Z' },
      { kind: 'seven_day', percentUsed: 30, resetsAt: '2026-10-14T12:00:00Z' },
    ],
    Date.parse('2026-10-12T12:00:00Z'),
  )
  expect(u.session).toBe(24)
  expect(u.week).toBe(30)
  expect(u.budget).toBe(41)
  expect(u.resetsAt).toBe('2026-10-12T15:00:00.000Z')
  expect(u.reset).toMatch(/^\d\d:\d\d$/)
})

test('parseUsage leaves missing values null', () => {
  expect(parseUsage([], 0)).toEqual({ session: null, week: null, budget: null, reset: null, resetsAt: null })
})
