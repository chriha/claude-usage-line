# claude-usage-line

A Claude Code mod that shows your usage at the end of the prompt hint line, grouped by current session, 5h window and week:

```
󰭹 24.5k · ctx 38% · $1.84  ·  󰥔 5h 1% [02:40am]  ·  󰃭 wk 9% (+4%) [Wed 06:59am]
```

- `24.5k` – tokens this session (input + output + cache writes, cache reads excluded)
- `ctx` – context window fill
- `$` – session cost
- `5h` – 5 hour window usage, `[…]` is its next reset
- `wk` – weekly usage, `(…)` is the pace: allowed so far minus used (negative = ahead of pace), `[…]` is the weekly reset

Icons need a [Nerd Font](https://www.nerdfonts.com/). Times are 12h local; the weekday shows when the reset isn't today.

## Install

```
/plugin marketplace add chriha/claude-usage-line
/plugin install usage-line@claude-usage-line
```

## Use the values elsewhere

On every usage update the mod writes `<config dir>/usage-line.json`
(`$CLAUDE_CONFIG_DIR`, default `~/.claude`), so other tools can read each value:

```json
{
  "text": "󰭹 24.5k · ctx 38% · $1.84  ·  󰥔 5h 1% [02:40am]  ·  󰃭 wk 9% (+4%) [Wed 06:59am]",
  "tokens": 24500,
  "context": 38,
  "cost": 1.84,
  "fiveHour": 1,
  "fiveHourResetsAt": "2026-11-10T01:40:00.000Z",
  "week": 9,
  "budget": 4,
  "weekResetsAt": "2026-11-18T05:59:00.000Z",
  "at": 1793661462
}
```

Values Claude doesn't report are `null`. `at` is a Unix timestamp in seconds.

## Develop

```
claude plugin validate .
claude plugin test .
```
