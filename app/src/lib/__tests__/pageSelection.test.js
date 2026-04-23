import { describe, expect, it } from 'vitest'
import { parsePageSelection } from '../pageSelection'

describe('parsePageSelection', () => {
  it('parses single pages and ranges into sorted unique values', () => {
    expect(parsePageSelection('5, 2-4, 4, 1', 10)).toEqual([1, 2, 3, 4, 5])
  })

  it('rejects descending ranges', () => {
    expect(() => parsePageSelection('5-3', 10)).toThrow('טווח עמודים חייב להיות בסדר עולה.')
  })

  it('rejects out-of-bounds pages', () => {
    expect(() => parsePageSelection('1,12', 8)).toThrow('יש לבחור עמודים בין 1 ל-8.')
  })
})
