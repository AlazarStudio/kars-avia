import { SlashSourceKey } from '../extensions/slashSourceKey'

export function logSlashSource(editor, action) {
  const state = SlashSourceKey.getState(editor.state)
  console.log(`[${action}] fromPlus:`, state?.fromPlus)
}