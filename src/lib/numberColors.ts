/**
 * Get color class for a number based on whether it matches selected numbers
 */
export function getNumberColor(num: number, selectedNumbers: number[]): string {
  // If no selected numbers, show green (neutral state)
  if (!selectedNumbers || selectedNumbers.length === 0) {
    return "bg-gradient-to-br from-green-500 to-emerald-600 dark:from-green-600 dark:to-emerald-700";
  }
  
  // Check if this number matches any selected number
  const isMatched = selectedNumbers.includes(num);
  
  if (isMatched) {
    // Match: green (generated number that matches selected number)
    return "bg-gradient-to-br from-green-500 to-emerald-600 dark:from-green-600 dark:to-emerald-700";
  } else {
    // Not matched: red gradient (generated but not in selected numbers) - redish gradient
    return "!bg-gradient-to-br !from-red-500 !to-red-700 dark:!from-red-500 dark:!to-red-700 !border-2 !border-red-700 dark:!border-red-600";
  }
}

