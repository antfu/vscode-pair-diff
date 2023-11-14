import { basename } from 'node:path'
import type { ExtensionContext } from 'vscode'
import { commands, window, workspace } from 'vscode'
import { findMatchedTarget, normalizePatterns, slash } from './utils'
import type { MatchPattern } from './types'

export function activate(ext: ExtensionContext) {
  const cwd = slash(workspace.workspaceFolders![0]!.uri.fsPath)

  const config = workspace.getConfiguration('auto-diff')
  const patterns = normalizePatterns(cwd, config.get<MatchPattern[]>('patterns') || [])

  ext.subscriptions.push(
    commands.registerCommand('auto-diff.open', () => {
      const uri = window.activeTextEditor?.document.uri
      const target = findMatchedTarget(cwd, uri, patterns)
      if (!target || !uri)
        return

      commands.executeCommand(
        'vscode.diff',
        uri,
        target,
        `Auto Diff: ${basename(uri.fsPath)} ↔ ${basename(target.fsPath)}`,
      )
    }),

    window.onDidChangeActiveTextEditor((editor) => {
      const uri = editor?.document.uri
      const target = findMatchedTarget(cwd, uri, patterns)
      commands.executeCommand('setContext', 'auto-diff.available', !!target)
    }),
  )
}

export function deactivate() {

}
