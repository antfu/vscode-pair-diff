import type { ExtensionContext, TextEditor } from 'vscode'
import { EventEmitter, commands, window, workspace } from 'vscode'
import { findMatchedTargets, normalizePatterns, slash } from './utils'
import type { MatchPattern, ResolvedMatchPattern } from './types'
import { EXT_ID } from './constants'

export class Context {
  cwd: string
  patterns: ResolvedMatchPattern[] = []
  codeLens = true

  constructor(
    public ext: ExtensionContext,
  ) {
    this.cwd = slash(workspace.workspaceFolders![0]!.uri.fsPath)
  }

  private _didConfigChanged = new EventEmitter<void>()
  public didConfigChanged = this._didConfigChanged.event

  readConfig() {
    const config = workspace.getConfiguration(EXT_ID)
    this.patterns = normalizePatterns(this.cwd, config.get<MatchPattern[]>('patterns') || [])
    this.codeLens = config.get<boolean>('codeLens') ?? true
    this.updateEnv(window.activeTextEditor)
    this._didConfigChanged.fire()
  }

  updateEnv(editor: TextEditor | undefined) {
    const uri = editor?.document.uri
    const targets = findMatchedTargets(this.cwd, uri, this.patterns)
    commands.executeCommand('setContext', `${EXT_ID}.available`, !!targets?.length)
  }
}
