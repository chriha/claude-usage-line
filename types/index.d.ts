export type UsageText = string | null

declare module 'claude-code' {
  interface PluginState {
    'usage-line': { text: UsageText }
  }
}
