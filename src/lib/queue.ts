export function parseQueueNumber(queueNumber: string): number {
  return parseInt(queueNumber.replace('Q', ''), 10)
}

export function generateQueueNumber(existingNumbers: string[]): string {
  if (existingNumbers.length === 0) return 'Q001'
  const max = Math.max(...existingNumbers.map(parseQueueNumber))
  return `Q${String(max + 1).padStart(3, '0')}`
}
