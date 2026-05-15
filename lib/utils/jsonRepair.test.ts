import { describe, it, expect } from 'vitest'
import { repairTruncatedJSON } from '@/lib/utils/jsonRepair'

describe('repairTruncatedJSON', () => {
  it('closes truncated array', () => {
    const raw = '[{"step":1,"title":"a","action":"b","details":"c","tip":null},{"step":2,'
    const repaired = repairTruncatedJSON(raw)
    expect(() => JSON.parse(repaired)).not.toThrow()
    const arr = JSON.parse(repaired)
    expect(Array.isArray(arr)).toBe(true)
  })
})
