import { resolve } from 'node:path'
import type { MatchPattern, ResolvedMatchPattern } from './types'

export function toArray<T>(value: T | T[]): T[] {
  return Array.isArray(value) ? value : [value]
}

export function normalizePatterns(
  cwd: string,
  patterns: MatchPattern[],
): ResolvedMatchPattern[] {
  return patterns.map(i => ({
    ...i,
    source: toArray(i.source).map(s => resolve(cwd, s)),
    target: toArray(i.target),
    ignore: toArray(i.ignore || []),
  }))
}

export function slash(path: string) {
  return path.replace(/\\/g, '/')
}
