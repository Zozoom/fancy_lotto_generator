import { useState, useCallback } from "react";

export function useNumberSelection(maxCount: number = 5) {
  const [selectedNumbers, setSelectedNumbers] = useState<number[]>([]);

  const toggleNumber = useCallback((num: number) => {
    setSelectedNumbers((prev) => {
      if (prev.includes(num)) {
        return prev.filter((n) => n !== num);
      } else {
        if (prev.length < maxCount) {
          return [...prev, num].sort((a, b) => a - b);
        }
        return prev;
      }
    });
  }, [maxCount]);

  const clearSelection = useCallback(() => {
    setSelectedNumbers([]);
  }, []);

  return {
    selectedNumbers,
    setSelectedNumbers,
    toggleNumber,
    clearSelection,
  };
}

