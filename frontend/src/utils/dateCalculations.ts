// Helper function to get date from string
export function parseDate(dateString: string): Date {
  const date = new Date(dateString)
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
  const currentDate = new Date(start)
  const endDate = new Date(end)
  
  // Set both dates to midnight
  currentDate.setHours(0, 0, 0, 0)
  endDate.setHours(0, 0, 0, 0)

  // Add dates until we reach or exceed the end date
  while (currentDate.getTime() <= endDate.getTime()) {
    dates.push(new Date(currentDate)) // Create new Date object for each day
    currentDate.setDate(currentDate.getDate() + 1)
    currentDate.setHours(0, 0, 0, 0) // Ensure we stay at midnight after adding a day
  }

  return dates
}
