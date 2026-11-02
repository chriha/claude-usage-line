# claude-usage-line

A Claude Code mod that shows your usage at the end of the prompt hint line:

```
5h 57% · wk 90% · budget -30% · reset 04:00
```

- `5h` – session (5 hour) usage
- `wk` – weekly usage
- `budget` – weekly pace: allowed so far minus used (negative = ahead of pace)
- `reset` – next session reset, local time

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
  "text": "5h 57% · wk 90% · budget -30% · reset 04:00",
  "session": 57,
  "week": 90,
  "budget": -30,
  "reset": "04:00",
  "resetsAt": "2026-11-03T03:00:00.000Z",
  "at": 1793661462
}
```

Values Claude doesn't report are `null`. `at` is a Unix timestamp in seconds.

## Develop

```
claude plugin validate .
claude plugin test .
```
