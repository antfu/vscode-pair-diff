export interface MatchPattern {
  source: string | string[]
  target: string | string[]
}

export interface ResolvedMatchPattern {
  source: string[]
  target: string[]
}
