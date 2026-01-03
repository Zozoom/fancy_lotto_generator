import { NextResponse } from "next/server";
import { readGenerations } from "@/lib/generations";
import { predictFromAnalytics } from "@/lib/analyticsPrediction";
import { logger } from "@/lib/logger";

// Import analytics calculation logic
async function calculateAnalytics() {
  const generations = await readGenerations();
  
  if (generations.length === 0) {
    return null;
  }

  const numberFrequency: { [key: number]: number } = {};
  const pairFrequency: { [key: string]: number } = {};
  const rangeCounts: { [key: string]: number } = {
    "1-20": 0,
    "21-40": 0,
    "41-60": 0,
    "61-80": 0,
    "81-90": 0,
  };
  const oddEvenCounts = { odd: 0, even: 0 };
  const digitEndingCounts: { [key: number]: number } = {};
  const sumCounts: number[] = [];

  for (let i = 1; i <= 90; i++) {
    numberFrequency[i] = 0;
  }
  for (let i = 0; i <= 9; i++) {
    digitEndingCounts[i] = 0;
  }

  generations.forEach((gen) => {
    gen.numbers.forEach((num) => {
      numberFrequency[num]++;
      
      if (num >= 1 && num <= 20) rangeCounts["1-20"]++;
      else if (num >= 21 && num <= 40) rangeCounts["21-40"]++;
      else if (num >= 41 && num <= 60) rangeCounts["41-60"]++;
      else if (num >= 61 && num <= 80) rangeCounts["61-80"]++;
      else if (num >= 81 && num <= 90) rangeCounts["81-90"]++;

      if (num % 2 === 0) oddEvenCounts.even++;
      else oddEvenCounts.odd++;

      const ending = num % 10;
      digitEndingCounts[ending]++;
    });

    const sorted = [...gen.numbers].sort((a, b) => a - b);
    for (let i = 0; i < sorted.length; i++) {
      for (let j = i + 1; j < sorted.length; j++) {
        const pairKey = `${sorted[i]}-${sorted[j]}`;
        pairFrequency[pairKey] = (pairFrequency[pairKey] || 0) + 1;
      }
    }

    const sum = gen.numbers.reduce((a, b) => a + b, 0);
    sumCounts.push(sum);
  });

  const totalNumbers = generations.length * 5;

  const hotNumbers = Object.entries(numberFrequency)
    .map(([num, count]) => ({
      number: parseInt(num),
      count,
      percentage: (count / totalNumbers) * 100,
    }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 20);

  const coldNumbers = Object.entries(numberFrequency)
    .filter(([_, count]) => count > 0)
    .map(([num, count]) => ({
      number: parseInt(num),
      count,
      percentage: (count / totalNumbers) * 100,
    }))
    .sort((a, b) => a.count - b.count)
    .slice(0, 20);

  const mostCommonPairs = Object.entries(pairFrequency)
    .map(([pair, count]) => ({ pair, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 20);

  const rangeDistribution = Object.entries(rangeCounts).map(
    ([range, count]) => ({
      range,
      count,
      percentage: (count / totalNumbers) * 100,
    })
  );

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

  const sumMin = Math.min(...sumCounts);
  const sumMax = Math.max(...sumCounts);
  const sumAverage = sumCounts.reduce((a, b) => a + b, 0) / sumCounts.length;
  
  const sumFrequency: { [key: number]: number } = {};
  sumCounts.forEach((sum) => {
    sumFrequency[sum] = (sumFrequency[sum] || 0) + 1;
  });
  const mostCommonSum = Object.entries(sumFrequency)
    .sort((a, b) => b[1] - a[1])[0]?.[0] || 0;

  const digitEndingDistribution = Object.entries(digitEndingCounts)
    .map(([ending, count]) => ({
      ending: parseInt(ending),
      count,
      percentage: (count / totalNumbers) * 100,
    }))
    .sort((a, b) => b.count - a.count);

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

  return {
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
    recentTrends: {
      last10: Object.entries(recentFrequency10)
        .map(([num, count]) => ({ number: parseInt(num), count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 15),
      last30: Object.entries(recentFrequency30)
        .map(([num, count]) => ({ number: parseInt(num), count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 15),
    },
    consecutivePatterns: {
      hasConsecutive: 0,
      noConsecutive: 0,
      percentage: 0,
    },
  };
}

export async function GET() {
  try {
    const analytics = await calculateAnalytics();
    
    if (!analytics) {
      return NextResponse.json(
        { error: "No data available for analytics prediction" },
        { status: 400 }
      );
    }

    const predictedNumbers = predictFromAnalytics(analytics);
    logger.info(`[PREDICT-ANALYTICS] Predicted numbers: [${predictedNumbers.join(", ")}]`);
    
    return NextResponse.json({ numbers: predictedNumbers });
  } catch (error) {
    logger.error(`[PREDICT-ANALYTICS] Error: ${error instanceof Error ? error.message : String(error)}`);
    return NextResponse.json(
      { error: "Failed to predict numbers from analytics" },
      { status: 500 }
    );
  }
}

