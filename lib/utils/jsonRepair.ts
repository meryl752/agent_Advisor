/**
 * Répare une chaîne JSON tronquée (réponse LLM coupée) en fermant tableaux / objets.
 * Utilisable pour des objets `{...}` ou des tableaux `[...]`.
 */
export function repairTruncatedJSON(raw: string): string {
  const stack: string[] = []
  let inString = false
  let escape = false
  let lastSafePos = 0

  for (let i = 0; i < raw.length; i++) {
    const ch = raw[i]
    if (escape) {
      escape = false
      continue
    }
    if (ch === '\\' && inString) {
      escape = true
      continue
    }
    if (ch === '"') {
      inString = !inString
      continue
    }
    if (inString) continue

    if (ch === '{' || ch === '[') {
      stack.push(ch)
    } else if (ch === '}' || ch === ']') {
      stack.pop()
      if (stack.length === 0) lastSafePos = i + 1
    } else if ((ch === ',' || ch === ':') && stack.length <= 2) {
      lastSafePos = i
    }
  }

  if (stack.length === 0) return raw

  let repaired = raw.slice(0, lastSafePos).trimEnd()
  if (repaired.endsWith(',')) repaired = repaired.slice(0, -1)

  for (let i = stack.length - 1; i >= 0; i--) {
    repaired += stack[i] === '{' ? '}' : ']'
  }

  return repaired
}
