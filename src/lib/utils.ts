/**
 * Format date to locale string
 */
export function formatDate(date: string | Date): string {
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  return dateObj.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

/**
 * Get current date in ISO format
 */
export function getCurrentISODate(): string {
  return new Date().toISOString();
}

/**
 * Convert date string to ISO format
 */
export function convertDateToISO(dateStr: string): string {
  // Handle different date formats
  if (dateStr.includes('.')) {
    const [year, month, day] = dateStr.split('.');
    return new Date(`${year}-${month}-${day}`).toISOString();
  } else if (dateStr.includes('-')) {
    return new Date(dateStr).toISOString();
  }
  return new Date(dateStr).toISOString();
}

/**
 * Sort generations by date (newest first)
 */
export function sortGenerationsByDate<T extends { date: string }>(generations: T[]): T[] {
  return generations.sort((a, b) => {
    const dateA = new Date(a.date).getTime();
    const dateB = new Date(b.date).getTime();
    return dateB - dateA; // Descending order (newest first)
  });
}

/**
 * Validate lottery numbers array
 */
export function validateNumbers(numbers: unknown): numbers is number[] {
  if (!Array.isArray(numbers) || numbers.length !== 5) {
    return false;
  }
  return numbers.every(num => typeof num === 'number' && num >= 1 && num <= 90);
}

/**
 * Generate random unique numbers (1-90)
 */
export function generateRandomNumbers(count: number = 5): number[] {
  const numbers: number[] = [];
  while (numbers.length < count) {
    const num = Math.floor(Math.random() * 90) + 1;
    if (!numbers.includes(num)) {
      numbers.push(num);
    }
  }
  return numbers.sort((a, b) => a - b);
}

