import { NextResponse } from "next/server";
import { readGenerations } from "@/lib/generations";
import { Generation } from "@/types/generation";
import { logger } from "@/lib/logger";

export interface AnalyticsData {
  totalGenerations: number;
  hotNumbers: { number: number; count: number; percentage: number }[];
  coldNumbers: { number: number; count: number; percentage: number }[];
  mostCommonPairs: { pair: string; count: number }[];
  numberFrequency: { [key: number]: number };
  rangeDistribution: {
    range: string;
    count: number;
    percentage: number;
  }[];
  oddEvenDistribution: {
    type: string;
    count: number;
    percentage: number;
  }[];
  sumDistribution: {
    min: number;
    max: number;
    average: number;
    mostCommon: number;
  };
  digitEndingDistribution: {
    ending: number;
    count: number;
    percentage: number;
  }[];
  recentTrends: {
    last10: { number: number; count: number }[];
    last30: { number: number; count: number }[];
  };
  consecutivePatterns: {
    hasConsecutive: number;
    noConsecutive: number;
    percentage: number;
  };
}

export async function GET() {
  try {
    const generations = await readGenerations();
    
    if (generations.length === 0) {
      return NextResponse.json({
        totalGenerations: 0,
        hotNumbers: [],
        coldNumbers: [],
        mostCommonPairs: [],
        numberFrequency: {},
        rangeDistribution: [],
        oddEvenDistribution: [],
        sumDistribution: { min: 0, max: 0, average: 0, mostCommon: 0 },
        digitEndingDistribution: [],
        recentTrends: { last10: [], last30: [] },
        consecutivePatterns: { hasConsecutive: 0, noConsecutive: 0, percentage: 0 },
      });
    }

    const numberFrequency: { [key: number]: number } = {};
    const pairFrequency: { [key: string]: number } = {};
    const sumCounts: number[] = [];
    const rangeCounts: { [key: string]: number } = {
      "1-20": 0,
      "21-40": 0,
      "41-60": 0,
      "61-80": 0,
      "81-90": 0,
    };
    const oddEvenCounts = { odd: 0, even: 0 };
    const digitEndingCounts: { [key: number]: number } = {};
    let consecutiveCount = 0;
    let noConsecutiveCount = 0;

    // Initialize number frequency
    for (let i = 1; i <= 90; i++) {
      numberFrequency[i] = 0;
    }

    // Initialize digit ending counts
    for (let i = 0; i <= 9; i++) {
      digitEndingCounts[i] = 0;
    }

    // Analyze all generations
    generations.forEach((gen) => {
      gen.numbers.forEach((num) => {
        numberFrequency[num]++;
        
        // Range distribution
        if (num >= 1 && num <= 20) rangeCounts["1-20"]++;
        else if (num >= 21 && num <= 40) rangeCounts["21-40"]++;
        else if (num >= 41 && num <= 60) rangeCounts["41-60"]++;
        else if (num >= 61 && num <= 80) rangeCounts["61-80"]++;
        else if (num >= 81 && num <= 90) rangeCounts["81-90"]++;

        // Odd/Even
        if (num % 2 === 0) oddEvenCounts.even++;
        else oddEvenCounts.odd++;

        // Digit ending
        const ending = num % 10;
        digitEndingCounts[ending]++;
      });

      // Pair frequency
      const sorted = [...gen.numbers].sort((a, b) => a - b);
      for (let i = 0; i < sorted.length; i++) {
        for (let j = i + 1; j < sorted.length; j++) {
          const pairKey = `${sorted[i]}-${sorted[j]}`;
          pairFrequency[pairKey] = (pairFrequency[pairKey] || 0) + 1;
        }
      }

      // Sum distribution
      const sum = gen.numbers.reduce((a, b) => a + b, 0);
      sumCounts.push(sum);

      // Consecutive patterns
      const hasConsecutive = sorted.some(
        (n, i) => i > 0 && sorted[i] - sorted[i - 1] === 1
      );
      if (hasConsecutive) consecutiveCount++;
      else noConsecutiveCount++;
    });

    const totalNumbers = generations.length * 5;

    // Hot numbers (most frequent)
    const hotNumbers = Object.entries(numberFrequency)
      .map(([num, count]) => ({
        number: parseInt(num),
        count,
        percentage: (count / totalNumbers) * 100,
      }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 20);

    // Cold numbers (least frequent, but appeared at least once)
    const coldNumbers = Object.entries(numberFrequency)
      .filter(([_, count]) => count > 0)
      .map(([num, count]) => ({
        number: parseInt(num),
        count,
        percentage: (count / totalNumbers) * 100,
      }))
      .sort((a, b) => a.count - b.count)
      .slice(0, 20);

    // Most common pairs
    const mostCommonPairs = Object.entries(pairFrequency)
      .map(([pair, count]) => ({ pair, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 20);

    // Range distribution
    const rangeDistribution = Object.entries(rangeCounts).map(
      ([range, count]) => ({
        range,
        count,
        percentage: (count / totalNumbers) * 100,
      })
    );

    // Odd/Even distribution
    const oddEvenDistribution = [
      {
        type: "Odd",
        count: oddEvenCounts.odd,
        percentage: (oddEvenCounts.odd / totalNumbers) * 100,
      },
      {
        type: "Even",
        count: oddEvenCounts.even,
        percentage: (oddEvenCounts.even / totalNumbers) * 100,
      },
    ];

    // Sum distribution
    const sumMin = Math.min(...sumCounts);
    const sumMax = Math.max(...sumCounts);
    const sumAverage = sumCounts.reduce((a, b) => a + b, 0) / sumCounts.length;
    
    // Most common sum
    const sumFrequency: { [key: number]: number } = {};
    sumCounts.forEach((sum) => {
      sumFrequency[sum] = (sumFrequency[sum] || 0) + 1;
    });
    const mostCommonSum = Object.entries(sumFrequency)
      .sort((a, b) => b[1] - a[1])[0]?.[0] || 0;

    // Digit ending distribution
    const digitEndingDistribution = Object.entries(digitEndingCounts)
      .map(([ending, count]) => ({
        ending: parseInt(ending),
        count,
        percentage: (count / totalNumbers) * 100,
      }))
      .sort((a, b) => b.count - a.count);

    // Recent trends (last 10 and last 30)
    const last10 = generations.slice(0, 10);
    const last30 = generations.slice(0, 30);

    const recentFrequency10: { [key: number]: number } = {};
    const recentFrequency30: { [key: number]: number } = {};

    last10.forEach((gen) => {
      gen.numbers.forEach((num) => {
        recentFrequency10[num] = (recentFrequency10[num] || 0) + 1;
      });
    });

    last30.forEach((gen) => {
      gen.numbers.forEach((num) => {
        recentFrequency30[num] = (recentFrequency30[num] || 0) + 1;
      });
    });

    const recentTrends = {
      last10: Object.entries(recentFrequency10)
        .map(([num, count]) => ({ number: parseInt(num), count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 15),
      last30: Object.entries(recentFrequency30)
        .map(([num, count]) => ({ number: parseInt(num), count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 15),
    };

    const analytics: AnalyticsData = {
      totalGenerations: generations.length,
      hotNumbers,
      coldNumbers,
      mostCommonPairs,
      numberFrequency,
      rangeDistribution,
      oddEvenDistribution,
      sumDistribution: {
        min: sumMin,
        max: sumMax,
        average: Math.round(sumAverage),
        mostCommon: parseInt(mostCommonSum.toString()),
      },
      digitEndingDistribution,
      recentTrends,
      consecutivePatterns: {
        hasConsecutive: consecutiveCount,
        noConsecutive: noConsecutiveCount,
        percentage: (consecutiveCount / generations.length) * 100,
      },
    };

    logger.info(`[ANALYTICS] Calculated analytics for ${analytics.totalGenerations} generations`);
    return NextResponse.json(analytics);
  } catch (error) {
    logger.error(`[ANALYTICS] Error calculating analytics: ${error instanceof Error ? error.message : String(error)}`);
    return NextResponse.json(
      { error: "Failed to calculate analytics" },
      { status: 500 }
    );
  }
}

