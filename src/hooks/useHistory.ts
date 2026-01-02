import { useState, useEffect, useCallback } from "react";
import { Generation } from "@/types/generation";
import { getCurrentISODate } from "@/lib/utils";

export function useHistory() {
  const [history, setHistory] = useState<Generation[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const loadHistory = useCallback(async () => {
    setIsLoading(true);
    try {
      const response = await fetch("/api/history");
      if (response.ok) {
        const data = await response.json();
        setHistory(data);
      }
    } catch (error) {
      console.error("Failed to load history:", error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const saveGeneration = useCallback(async (numbers: number[], predictedNumbers?: number[]) => {
    try {
      const response = await fetch("/api/save", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          numbers,
          date: getCurrentISODate(),
          predictedNumbers: predictedNumbers && predictedNumbers.length > 0 ? predictedNumbers : undefined,
        }),
      });
      if (response.ok) {
        await loadHistory();
        return true;
      }
      return false;
    } catch (error) {
      console.error("Failed to save generation:", error);
      return false;
    }
  }, [loadHistory]);

  useEffect(() => {
    loadHistory();
  }, [loadHistory]);

  return { history, isLoading, loadHistory, setHistory, saveGeneration };
}

