import { atom, read, update } from 'claude-code'
import type { EngineInterface, Register } from 'claude-code'
import { parseUsage, usageText } from './format'

const text = atom({ plugin: 'usage-line', key: 'text' } as const, null)

type Limits = Parameters<typeof parseUsage>[0]

// Also written to <config dir>/usage-line.json so tools outside Claude (lanes' claude_dir) show the same text, plus one prop per value (session, week, budget, reset, resetsAt).
async function publish($: EngineInterface, limits: Limits) {
  const now = Date.now()
  const usage = parseUsage(limits, now)
  const line = usageText(usage) ?? null
  await update($, text, () => line)
  const dir = (await $.env.get('CLAUDE_CONFIG_DIR')) || `${await $.env.get('HOME')}/.claude`
  await $.fs.write(`${dir}/usage-line.json`, JSON.stringify({ text: line, ...usage, at: Math.floor(now / 1000) }))
}

export const register: Register = on => {
  on('session.start', async ($, e, next) => {
    const { rateLimits } = await $.session.usage()
    await publish($, rateLimits)
    return next(e)
  })

  on('session.measure', async ($, e, next) => {
    await publish($, e.rateLimits)
    return next(e)
  })

  // Drawn at the end of the hint line, beside the mode pill, instead of a status row of its own.
  on('ui.render', { component: 'PromptHint' }, async ($, e, next) => {
    const usage = await read($, text)
    if (!usage) return next(e)
    return next({ ...e, props: { ...e.props, tail: `  ${usage}` } })
  })
}
