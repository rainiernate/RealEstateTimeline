// Helper function to check if a date is a holiday
export function isHoliday(date: Date): boolean {
  const month = date.getMonth()
  const day = date.getDate()
  const dayOfWeek = date.getDay()

  // New Year's Day
  if (month === 0 && day === 1) return true

  // Martin Luther King Jr. Day (3rd Monday in January)
  if (month === 0 && dayOfWeek === 1 && day >= 15 && day <= 21) return true

  // Presidents' Day (3rd Monday in February)
  if (month === 1 && dayOfWeek === 1 && day >= 15 && day <= 21) return true

  // Memorial Day (Last Monday in May)
  if (month === 4 && dayOfWeek === 1 && day >= 25 && day <= 31) return true

  // Juneteenth (June 19)
  if (month === 5 && day === 19) return true

  // Independence Day (July 4)
  if (month === 6 && day === 4) return true

  // Labor Day (1st Monday in September)
  if (month === 8 && dayOfWeek === 1 && day <= 7) return true

  // Indigenous Peoples' Day/Columbus Day (2nd Monday in October)
  if (month === 9 && dayOfWeek === 1 && day >= 8 && day <= 14) return true

  // Veterans Day (November 11)
  if (month === 10 && day === 11) return true

  // Thanksgiving Day (4th Thursday in November)
  if (month === 10 && dayOfWeek === 4 && day >= 22 && day <= 28) return true

  // Native American Heritage Day (Day after Thanksgiving)
  if (month === 10 && dayOfWeek === 5 && day >= 23 && day <= 29) return true

  // Christmas Day (December 25)
  if (month === 11 && day === 25) return true

  return false
}

// Helper function to get holiday name
export function getHolidayName(date: Date): string {
  const month = date.getMonth()
  const day = date.getDate()
  const dayOfWeek = date.getDay()

  if (month === 0 && day === 1) return "New Year's Day"
  if (month === 0 && dayOfWeek === 1 && day >= 15 && day <= 21) return "Martin Luther King Jr. Day"
  if (month === 1 && dayOfWeek === 1 && day >= 15 && day <= 21) return "Presidents' Day"
  if (month === 4 && dayOfWeek === 1 && day >= 25 && day <= 31) return "Memorial Day"
  if (month === 5 && day === 19) return "Juneteenth"
  if (month === 6 && day === 4) return "Independence Day"
  if (month === 8 && dayOfWeek === 1 && day <= 7) return "Labor Day"
  if (month === 9 && dayOfWeek === 1 && day >= 8 && day <= 14) return "Indigenous Peoples' Day"
  if (month === 10 && day === 11) return "Veterans Day"
  if (month === 10 && dayOfWeek === 4 && day >= 22 && day <= 28) return "Thanksgiving Day"
  if (month === 10 && dayOfWeek === 5 && day >= 23 && day <= 29) return "Native American Heritage Day"
  if (month === 11 && day === 25) return "Christmas Day"

  return ""
}
