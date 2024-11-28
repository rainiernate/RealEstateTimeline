// Helper function to get date from string
export function parseDate(dateString: string): Date {
  const [year, month, day] = dateString.split('-').map(Number)
  const date = new Date(year, month - 1, day)
  date.setHours(0, 0, 0, 0)
  return date
}

// Helper function to calculate days between dates
export function daysBetween(start: Date, end: Date): number {
  const startDate = new Date(start)
  startDate.setHours(0, 0, 0, 0)
  const endDate = new Date(end)
  endDate.setHours(0, 0, 0, 0)
  const diffTime = endDate.getTime() - startDate.getTime()
  return Math.floor(diffTime / (1000 * 60 * 60 * 24))
}

// Helper function to get all dates between start and end
export function getDatesBetween(start: Date, end: Date): Date[] {
  const dates: Date[] = []
  const startDate = new Date(start)
  startDate.setHours(0, 0, 0, 0)
  const endDate = new Date(end)
  endDate.setHours(0, 0, 0, 0)

  while (startDate <= endDate) {
    dates.push(new Date(startDate))
    startDate.setDate(startDate.getDate() + 1)
  }
  return dates
}
