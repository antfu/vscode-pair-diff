import { parse, resolve } from 'node:path'
import { existsSync } from 'node:fs'
import { Uri } from 'vscode'
import mm from 'micromatch'
import type { MatchPattern, ResolvedMatchPattern } from './types'

export function toArray<T>(value: T | T[]): T[] {
  return Array.isArray(value) ? value : [value]
}

export function normalizePatterns(
  cwd: string,
  patterns: MatchPattern[],
): ResolvedMatchPattern[] {
  return patterns.map(i => ({
    source: toArray(i.source).map(s => resolve(cwd, s)),
    target: toArray(i.target),
  }))
}

export function slash(path: string) {
  return path.replace(/\\/g, '/')
}

export function findMatchedTargets(
  cwd: string,
  source: Uri | undefined,
  patterns: ResolvedMatchPattern[],
) {
  if (!source)
    return
  const pattern = patterns.find(p => mm.isMatch(source.fsPath, p.source))
  if (!pattern)
    return

  const parsed = parse(slash(source.fsPath))

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
    targetPath = resolve(cwd, targetPath)

    if (existsSync(targetPath))
      targets.push(Uri.file(targetPath))
  }

  if (targets.length)
    return targets
}
