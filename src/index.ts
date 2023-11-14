import { basename, relative } from 'node:path'
import type { ExtensionContext, TextEditor, Uri } from 'vscode'
import { commands, window, workspace } from 'vscode'
import { findMatchedTargets, normalizePatterns, slash } from './utils'
import type { MatchPattern, ResolvedMatchPattern } from './types'
import { EXT_ID, EXT_NAME } from './constants'

export function activate(ext: ExtensionContext) {
  const cwd = slash(workspace.workspaceFolders![0]!.uri.fsPath)

  let patterns: ResolvedMatchPattern[] = []

  function readConfig() {
    patterns = normalizePatterns(cwd, workspace.getConfiguration(EXT_ID).get<MatchPattern[]>('patterns') || [])
    updateContext(window.activeTextEditor)
    window.showInformationMessage(`${EXT_NAME}: ${patterns.length} patterns loaded`)
  }

  function updateContext(editor: TextEditor | undefined) {
    const uri = editor?.document.uri
    const targets = findMatchedTargets(cwd, uri, patterns)
    commands.executeCommand('setContext', `${EXT_ID}.available`, !!targets?.length)
    if (targets?.length)
      window.showInformationMessage(`Matched ${targets.map(i => i.fsPath).join(', ')}`)
  }

  ext.subscriptions.push(
    workspace.onDidChangeConfiguration((e) => {
      if (e.affectsConfiguration(`${EXT_ID}.patterns`))
        readConfig()
    }),
    commands.registerCommand(`${EXT_ID}.open`, async () => {
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
          `${EXT_NAME}: ${basename(uri.fsPath)} ↔ ${basename(target.fsPath)}`,
        )
      }
    }),

    window.onDidChangeActiveTextEditor((editor) => {
      updateContext(editor)
    }),
  )

  readConfig()
}

export function deactivate() {

}
