import { relative } from 'node:path'
import { CodeLens, EventEmitter } from 'vscode'
import type { CodeLensProvider as Provider, ProviderResult, TextDocument } from 'vscode'
import type { Context } from './context'
import { findMatchedTargets } from './utils'
import { EXT_ID } from './constants'

export class CodeLensProvider implements Provider {
  constructor(
    public ctx: Context,
  ) {
    ctx.ext.subscriptions.push(
      ctx.didConfigChanged(() => {
        this._onDidChangeCodeLenses.fire()
      }),
    )
  }

  private _onDidChangeCodeLenses = new EventEmitter<void>()
  public onDidChangeCodeLenses = this._onDidChangeCodeLenses.event

  provideCodeLenses(document: TextDocument): ProviderResult<CodeLens[]> {
    if (!this.ctx.codeLens)
      return

    const targets = findMatchedTargets(this.ctx.cwd, document.uri, this.ctx.patterns)
    if (targets?.length) {
      return [
        new CodeLens(
          document.lineAt(0).range,
          {
            title: 'Open diff with',
            command: '',
          },
        ),
        ...targets.map((target) => {
          return new CodeLens(
            document.lineAt(0).range,
            {
              title: `$(arrow-small-right)${relative(document.uri.fsPath, target.fsPath)}`,
              command: `${EXT_ID}.open`,
              arguments: [document.uri, target],
            },
          )
        }),
      ]
    }
  }

  resolveCodeLens(codeLens: CodeLens): ProviderResult<CodeLens> {
    return codeLens
  }
}
