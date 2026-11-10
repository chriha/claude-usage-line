import { atom, read, update } from 'claude-code'
import type { EngineInterface, Register } from 'claude-code'
import { parseUsage, usageText } from './format'

const text = atom({ plugin: 'usage-line', key: 'text' } as const, null)

// Tokens this session, cache reads excluded: summed from each model response.
let tokens = 0

// Also written to <config dir>/usage-line.json so tools outside Claude (lanes' claude_dir) show the same text, plus one prop per value.
async function publish($: EngineInterface) {
  const now = Date.now()
  const { context, cost, rateLimits } = await $.session.usage()
  const usage = parseUsage(
    { tokens, context: context.percent ?? null, cost: cost?.usd ?? null, limits: rateLimits },
    now,
  )
  const line = usageText(usage, now) ?? null
  await update($, text, () => line)
  const dir = (await $.env.get('CLAUDE_CONFIG_DIR')) || `${await $.env.get('HOME')}/.claude`
  await $.fs.write(`${dir}/usage-line.json`, JSON.stringify({ text: line, ...usage, at: Math.floor(now / 1000) }))
}

export const register: Register = on => {
  on('session.start', async ($, e, next) => {
    tokens = 0
    await publish($)
    return next(e)
  })

  on('session.measure', async ($, e, next) => {
    await publish($)
    return next(e)
  })

  on('turn.step', async function* ($, e, next) {
    const r = yield* next(e)
    if (r.usage) {
      tokens += r.usage.input_tokens + r.usage.output_tokens + r.usage.cache_creation_input_tokens
      await publish($)
    }
    return r
  })

  // Drawn at the end of the hint line, beside the mode pill, instead of a status row of its own.
  on('ui.render', { component: 'PromptHint' }, async ($, e, next) => {
    const usage = await read($, text)
    if (!usage) return next(e)
    return next({ ...e, props: { ...e.props, tail: `  ${usage}` } })
  })
}
