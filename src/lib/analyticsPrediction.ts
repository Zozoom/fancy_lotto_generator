import { AnalyticsData } from "@/app/api/analytics/route";
import { generateRandomNumbers } from "@/lib/utils";
import { logger } from "@/lib/logger";

/**
 * Predicts numbers based on analytics data
 * Uses hot numbers, recent trends, cold numbers, and statistical patterns
 */
export function predictFromAnalytics(analytics: AnalyticsData): number[] {
  logger.info("[ANALYTICS-PREDICTION] Starting analytics-based prediction");
  
  if (analytics.totalGenerations === 0) {
    logger.info("[ANALYTICS-PREDICTION] No data, returning random numbers");
    return generateRandomNumbers(5);
  }

  const numberScores: { [key: number]: number } = {};
  
  // Initialize all numbers
  for (let i = 1; i <= 99; i++) {
    numberScores[i] = 0;
  }

  // Strategy 1: Hot Numbers (most frequent) - High weight
  // Top hot numbers get high scores, but we want variety
  analytics.hotNumbers.slice(0, 15).forEach((item, index) => {
    const weight = (15 - index) / 15; // Decreasing weight
    numberScores[item.number] += item.percentage * 10 * weight;
  });

  // Strategy 2: Recent Trends - Very high weight (most recent patterns)
  // Last 10 generations - strongest weight
  analytics.recentTrends.last10.forEach((item) => {
    numberScores[item.number] += item.count * 15; // High weight for recent
  });

  // Last 30 generations - medium weight
  analytics.recentTrends.last30.forEach((item) => {
    if (!analytics.recentTrends.last10.find(n => n.number === item.number)) {
      numberScores[item.number] += item.count * 8; // Medium weight
    }
  });

  // Strategy 3: Cold Numbers - Medium weight (for variety and balance)
  // Boost cold numbers that haven't appeared recently
  analytics.coldNumbers.slice(0, 10).forEach((item) => {
    // Only boost if not in recent trends
    const inRecent = analytics.recentTrends.last10.some(n => n.number === item.number) ||
                     analytics.recentTrends.last30.some(n => n.number === item.number);
    if (!inRecent) {
      numberScores[item.number] += (100 - item.percentage) * 0.5; // Inverse weight
    }
  });

  // Strategy 4: Most Common Pairs - Boost numbers that appear together frequently
  analytics.mostCommonPairs.slice(0, 10).forEach((pair) => {
    const [num1, num2] = pair.pair.split("-").map(Number);
    numberScores[num1] += pair.count * 2;
    numberScores[num2] += pair.count * 2;
  });

  // Strategy 5: Range Distribution - Boost under-represented ranges
  const avgRangePercentage = analytics.rangeDistribution.reduce((sum, r) => sum + r.percentage, 0) / 5;
  analytics.rangeDistribution.forEach((range) => {
    if (range.percentage < avgRangePercentage * 0.8) {
      // Under-represented range
      const [min, max] = range.range.split("-").map(Number);
      for (let num = min; num <= max; num++) {
        numberScores[num] += 3;
      }
    }
  });

  // Strategy 6: Sum Distribution - Prefer numbers that create optimal sum
  const optimalSum = analytics.sumDistribution.average;
  const sumRange = analytics.sumDistribution.max - analytics.sumDistribution.min;
  
  // Strategy 7: Digit Ending Distribution - Boost popular endings
  analytics.digitEndingDistribution.slice(0, 5).forEach((item) => {
    for (let num = item.ending; num <= 99; num += 10) {
      numberScores[num] += item.percentage * 0.3;
    }
  });

  // Strategy 8: Odd/Even Balance - Try to maintain balance
  const oddPercentage = analytics.oddEvenDistribution.find(d => d.type === "Odd")?.percentage || 50;
  const evenPercentage = analytics.oddEvenDistribution.find(d => d.type === "Even")?.percentage || 50;
  
  // If odd is over-represented, boost even numbers slightly
  if (oddPercentage > 55) {
    for (let num = 2; num <= 98; num += 2) {
      numberScores[num] += 2;
    }
  } else if (evenPercentage > 55) {
    for (let num = 1; num <= 99; num += 2) {
      numberScores[num] += 2;
    }
  }

  // Generate candidate combinations
  const sortedNumbers = Object.entries(numberScores)
    .map(([num, score]) => ({ num: parseInt(num), score }))
    .sort((a, b) => b.score - a.score);

  const topCandidates = sortedNumbers.slice(0, 30);
  const candidateSets: { numbers: number[]; score: number }[] = [];

  // Generate multiple combinations
  for (let sim = 0; sim < 50; sim++) {
    const candidate: number[] = [];
    const available = [...topCandidates];

    while (candidate.length < 5 && available.length > 0) {
      const weights = available.map((c) => Math.max(0.001, c.score));
      const totalWeight = weights.reduce((a, b) => a + b, 0);

      if (totalWeight <= 0 || available.length === 0) break;

      let random = Math.random() * totalWeight;
      let index = 0;
      for (let i = 0; i < weights.length; i++) {
        random -= weights[i];
        if (random <= 0) {
          index = i;
          break;
        }
      }

      const selected = available[index];
      if (selected && selected.num >= 1 && selected.num <= 99 && !candidate.includes(selected.num)) {
        candidate.push(selected.num);
        available.splice(index, 1);
      } else {
        available.splice(index, 1);
      }
    }

    if (candidate.length === 5) {
      candidate.sort((a, b) => a - b);
      
      // Score this combination
      let comboScore = 0;
      const comboSum = candidate.reduce((a, b) => a + b, 0);
      
      // Sum optimization
      const sumDiff = Math.abs(comboSum - optimalSum);
      comboScore += Math.max(0, 10 - sumDiff / 10);

      // Range diversity
      const comboRanges = new Set<number>();
      candidate.forEach((num) => {
        if (num >= 1 && num <= 20) comboRanges.add(0);
        else if (num >= 21 && num <= 40) comboRanges.add(1);
        else if (num >= 41 && num <= 60) comboRanges.add(2);
        else if (num >= 61 && num <= 80) comboRanges.add(3);
        else if (num >= 81 && num <= 99) comboRanges.add(4);
      });
      comboScore += comboRanges.size * 3; // Prefer diverse ranges

      // Pair frequency bonus
      for (let i = 0; i < candidate.length; i++) {
        for (let j = i + 1; j < candidate.length; j++) {
          const pairKey = `${candidate[i]}-${candidate[j]}`;
          const pairData = analytics.mostCommonPairs.find(p => p.pair === pairKey);
          if (pairData) {
            comboScore += pairData.count * 2;
          }
        }
      }

      // Hot numbers bonus
      candidate.forEach((num) => {
        const hotData = analytics.hotNumbers.find(h => h.number === num);
        if (hotData) {
          comboScore += hotData.percentage * 2;
        }
      });

      // Recent trends bonus
      candidate.forEach((num) => {
        const recent10 = analytics.recentTrends.last10.find(r => r.number === num);
        const recent30 = analytics.recentTrends.last30.find(r => r.number === num);
        if (recent10) comboScore += recent10.count * 5;
        else if (recent30) comboScore += recent30.count * 2;
      });

      // Odd/Even balance
      const oddCount = candidate.filter(n => n % 2 === 1).length;
      if (oddCount >= 2 && oddCount <= 3) {
        comboScore += 3; // Balanced
      }

      candidateSets.push({ numbers: candidate, score: comboScore });
    }
  }

  // Select best combination
  candidateSets.sort((a, b) => b.score - a.score);
  const bestCombo = candidateSets[0];

  let result: number[] = [];
  if (bestCombo && bestCombo.numbers && bestCombo.numbers.length === 5) {
    result = bestCombo.numbers;
  } else if (sortedNumbers.length >= 5) {
    result = sortedNumbers
      .slice(0, 5)
      .map((n) => n.num)
      .filter((num) => num >= 1 && num <= 99)
      .sort((a, b) => a - b);
  }

  // Validate result
  const validResult = result.filter((num) => num >= 1 && num <= 99 && !isNaN(num));
  if (validResult.length !== 5) {
    logger.warn("[ANALYTICS-PREDICTION] Invalid result, falling back to random");
    result = generateRandomNumbers(5);
  }

  // Ensure no duplicates
  const uniqueResult = [...new Set(result)].filter((num) => num >= 1 && num <= 99);
  if (uniqueResult.length !== 5) {
    logger.warn("[ANALYTICS-PREDICTION] Duplicates detected, generating random");
    result = generateRandomNumbers(5);
  } else {
    result = uniqueResult.sort((a, b) => a - b);
  }

  logger.info(`[ANALYTICS-PREDICTION] Predicted: [${result.join(", ")}]`);
  return result;
}

