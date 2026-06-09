import { describe, it, expect } from 'vitest'
import { cn } from './utils'

describe('cn', () => {
  it('merges class names', () => {
    expect(cn('foo', 'bar')).toBe('foo bar')
  })

  it('handles conditional classes with objects', () => {
    expect(cn('base', { active: true, hidden: false })).toBe('base active')
  })

  it('removes conflicting tailwind classes', () => {
    expect(cn('px-4', 'px-2')).toBe('px-2')
  })

  it('handles empty inputs', () => {
    expect(cn()).toBe('')
  })

  it('filters out falsy values', () => {
    expect(cn('a', false && 'b', 'c', undefined, null, 'd')).toBe('a c d')
  })

  it('merges multiple conditional objects', () => {
    expect(cn('btn', { 'btn-primary': true }, { 'btn-lg': false, 'btn-sm': true })).toBe('btn btn-primary btn-sm')
  })

  it('handles array arguments', () => {
    expect(cn(['a', 'b'], 'c')).toBe('a b c')
  })
})
