export interface MatchPattern {
  source: string | string[]
  target: string | string[]
  ignore?: string | string[]
  replace?: Record<string, string>
}

export interface ResolvedMatchPattern {
  source: string[]
  target: string[]
  ignore: string[]
  replace?: Record<string, string>
}
