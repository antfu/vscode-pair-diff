import { basename, relative } from 'node:path'
import type { ExtensionContext } from 'vscode'
import { Uri, commands, languages, window, workspace } from 'vscode'
import { findMatchedTargets } from './utils'
import { EXT_ID, EXT_NAME } from './constants'
import { Context } from './context'
import { CodeLensProvider } from './codelens'

export function activate(ext: ExtensionContext) {
  const ctx = new Context(ext)

  ctx.readConfig()

  ext.subscriptions.push(
    languages.registerCodeLensProvider('*', new CodeLensProvider(ctx)),
    workspace.onDidChangeConfiguration((e) => {
      if (e.affectsConfiguration(`${EXT_ID}.patterns`))
        ctx.readConfig()
    }),
    commands.registerCommand(`${EXT_ID}.open`, async (...args) => {
      const uri = args[0] instanceof Uri
        ? args[0]
        : window.activeTextEditor?.document.uri
      const targets = args[1] instanceof Uri
        ? [args[1]]
        : findMatchedTargets(ctx.cwd, uri, ctx.patterns)

      if (!targets || !uri)
        return

      let target: Uri | undefined
      if (targets.length === 1) {
        target = targets[0]
      }
      else {
        const result = await window.showQuickPick(
          targets.map(i => ({
            label: relative(ctx.cwd, i.fsPath),
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
      ctx.updateEnv(editor)
    }),
  )
}

export function deactivate() {

}
