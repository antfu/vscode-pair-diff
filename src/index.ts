import { basename, relative } from 'node:path'
import type { ExtensionContext, Uri } from 'vscode'
import { commands, window, workspace } from 'vscode'
import { findMatchedTargets, normalizePatterns, slash } from './utils'
import type { MatchPattern } from './types'

export function activate(ext: ExtensionContext) {
  const cwd = slash(workspace.workspaceFolders![0]!.uri.fsPath)

  const config = workspace.getConfiguration('auto-diff')
  const patterns = normalizePatterns(cwd, config.get<MatchPattern[]>('patterns') || [])

  ext.subscriptions.push(
    commands.registerCommand('auto-diff.open', async () => {
      const uri = window.activeTextEditor?.document.uri
      const targets = findMatchedTargets(cwd, uri, patterns)
      if (!targets || !uri)
        return

      let target: Uri | undefined
      if (targets.length === 1) {
        target = targets[0]
      }
      else {
        const result = await window.showQuickPick(
          targets.map(i => ({
            label: relative(cwd, i.fsPath),
            tag: i,
          })),
          {
            title: 'Select a target file to diff with',
          },
        )
        if (result?.tag)
          target = result.tag
      }

      if (target) {
        commands.executeCommand(
          'vscode.diff',
          uri,
          target,
          `Auto Diff: ${basename(uri.fsPath)} ↔ ${basename(target.fsPath)}`,
        )
      }
    }),

    window.onDidChangeActiveTextEditor((editor) => {
      const uri = editor?.document.uri
      const targets = findMatchedTargets(cwd, uri, patterns)
      commands.executeCommand('setContext', 'auto-diff.available', !!targets?.length)
      if (targets?.length)
        window.showInformationMessage(`Matched ${targets.map(i => i.fsPath).join(', ')}`)
    }),
  )
}

export function deactivate() {

}
