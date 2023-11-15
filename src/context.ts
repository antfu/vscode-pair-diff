import { parse, resolve } from 'node:path'
import { existsSync } from 'node:fs'
import type { ExtensionContext, TextEditor } from 'vscode'
import { EventEmitter, Uri, commands, window, workspace } from 'vscode'
import mm from 'picomatch'
import { normalizePatterns, slash } from './utils'
import type { MatchPattern, ResolvedMatchPattern } from './types'
import { EXT_ID, EXT_NAME } from './constants'

export class Context {
  cwd: string
  patterns: ResolvedMatchPattern[] = []
  codeLens = true
  output = window.createOutputChannel(EXT_NAME)

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
    const targets = this.findMatchedTargets(uri)
    commands.executeCommand('setContext', `${EXT_ID}.available`, !!targets?.length)
  }

  findMatchedTargets(source: Uri | undefined) {
    if (!source)
      return

    const pattern = this.patterns.find(p => mm.isMatch(source.fsPath, p.source) && !mm.isMatch(source.fsPath, p.ignore))
    if (!pattern)
      return

    const sourcePathOriginal = slash(source.fsPath)
    let sourcePath = sourcePathOriginal
    for (const [key, value] of Object.entries(pattern.replace || {}))
      sourcePath = sourcePath.replaceAll(key, value)

    const parsed = parse(sourcePath)
    const targets: Uri[] = []

    for (const target of pattern.target) {
      let targetPath = target
      Object.entries({
        ...parsed,
        basename: parsed.base,
        dirname: parsed.dir,
      })
        .forEach(([key, value]) => {
          targetPath = targetPath.replaceAll(`<${key}>`, value)
        })

      // remove duplicated slashes
      targetPath = targetPath.replace(/\/+/g, '/')

      targetPath = resolve(this.cwd, targetPath)

      if (existsSync(targetPath))
        targets.push(Uri.file(targetPath))
    }

    this.output.appendLine('\n')
    this.output.appendLine(`Matched targets for ${sourcePathOriginal}:`)
    if (sourcePathOriginal !== sourcePath)
      this.output.appendLine(` | Rewrite as       ${sourcePath}`)
    this.output.appendLine(` | Target patterns  ${pattern.target.join(', ')}`)
    this.output.appendLine(` | Matched targets  ${targets.length}`)
    this.output.appendLine(
      targets.map(i => `   -  ${i.fsPath}`).join('\n'),
    )

    if (targets.length)
      return targets
  }
}
