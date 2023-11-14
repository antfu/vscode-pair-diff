import { parse, resolve } from 'node:path'
import { existsSync } from 'node:fs'
import { Uri } from 'vscode'
import mm from 'micromatch'
import type { MatchPattern } from './types'

export function normalizePatterns(cwd: string, patterns: MatchPattern[]) {
  return patterns.map(i => ({
    source: resolve(cwd, i.source),
    target: i.target,
  }))
}

export function slash(path: string) {
  return path.replace(/\\/g, '/')
}

export function findMatchedTarget(cwd: string, source: Uri | undefined, patterns: MatchPattern[]) {
  if (!source)
    return
  const pattern = patterns.find(p => mm.isMatch(source.fsPath, p.source))
  if (!pattern)
    return

  const parsed = parse(slash(source.fsPath))

  let targetPath = pattern.target

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

  targetPath = resolve(cwd, targetPath)

  if (existsSync(targetPath))
    return Uri.file(targetPath)
}
