import { Generation } from "@/types/generation";
import { generateRandomNumbers } from "@/lib/utils";
import { buildUserProfile, UserProfile } from "@/lib/manipulationDetection";
import { logger } from "@/lib/logger";

/**
 * Calculates similarity between two number sets (0-1 scale)
 * Returns 1.0 if identical, 0.0 if completely different
 */
function calculateSimilarity(set1: number[], set2: number[]): number {
  const set1Set = new Set(set1);
  const set2Set = new Set(set2);
  let matches = 0;

  set1Set.forEach((num) => {
    if (set2Set.has(num)) {
      matches++;
    }
  });

  // Return similarity as ratio of matches (0-1)
  // 5 matches = 1.0, 4 matches = 0.8, 3 matches = 0.6, etc.
  return matches / 5;
}

/**
 * Predicts lottery numbers based on historical data using advanced algorithms
 * including exponential decay recency, frequency analysis, gap analysis, Monte Carlo simulation,
 * and behavioral pattern recognition
 */
export function predictNumbers(generations: Generation[]): number[] {
  const startTime = Date.now();
  logger.info(
    `[PREDICTION] Starting prediction with ${generations.length} historical records`
  );

  if (generations.length === 0) {
    // No history, return random numbers
    logger.info(`[PREDICTION] No history, returning random numbers`);
    return generateRandomNumbers(5);
  }

  const now = Date.now();
  const numberScores: { [key: number]: number } = {};
  const lastAppearance: { [key: number]: number } = {};
  const appearanceCount: { [key: number]: number } = {};
  const pairFrequency: { [key: string]: number } = {};
  const sumDistribution: number[] = [];

  // Initialize all numbers
  for (let i = 1; i <= 99; i++) {
    numberScores[i] = 0;
    appearanceCount[i] = 0;
  }

  // Advanced Analysis Phase 1: Exponential Decay Recency + Frequency
  logger.debug(
    `[PREDICTION] Phase 1: Analyzing recency and frequency patterns...`
  );
  generations.forEach((gen) => {
    const genDate = new Date(gen.date).getTime();
    const age = now - genDate;
    const ageInDays = age / (24 * 60 * 60 * 1000);

    // Exponential decay: e^(-λt) where λ controls decay rate
    // More recent = exponentially higher weight
    const decayRate = 0.1; // Adjustable: lower = slower decay
    const recencyWeight = Math.exp(-decayRate * ageInDays) * 5; // Scale factor

    // Calculate sum for distribution analysis
    const sum = gen.numbers.reduce((a, b) => a + b, 0);
    sumDistribution.push(sum);

    gen.numbers.forEach((num, pos) => {
      appearanceCount[num]++;

      // Position-based weighting (middle positions slightly more important)
      const positionWeight = 1.0 + (2 - Math.abs(pos - 2)) * 0.15;

      // Exponential recency scoring
      numberScores[num] += recencyWeight * positionWeight;
      lastAppearance[num] = Math.max(lastAppearance[num] || 0, genDate);

      // Pair frequency analysis (combinations within same generation)
      gen.numbers.forEach((otherNum) => {
        if (num < otherNum) {
          const pairKey = `${num}-${otherNum}`;
          pairFrequency[pairKey] =
            (pairFrequency[pairKey] || 0) + recencyWeight;
        }
      });
    });
  });

  // Phase 2: Expected Return Time Analysis (Gap Analysis)
  logger.debug(`[PREDICTION] Phase 2: Calculating gap analysis...`);
  const avgInterval =
    generations.length > 1
      ? (now - new Date(generations[generations.length - 1].date).getTime()) /
        (generations.length - 1)
      : 0;

  Object.keys(numberScores).forEach((numStr) => {
    const num = parseInt(numStr);
    const lastSeen = lastAppearance[num] || 0;
    const gap = now - lastSeen;
    const expectedReturn = avgInterval * (99 / 5); // Expected cycles for number to return

    // Boost numbers that are overdue (gap > expected return)
    if (gap > expectedReturn * 1.2) {
      const overdueFactor = Math.min(gap / expectedReturn / 2, 3.0);
      numberScores[num] += 2.5 * overdueFactor;
    }
  });

  // Phase 3: Frequency Normalization & Under-representation Boost
  logger.debug(`[PREDICTION] Phase 3: Normalizing frequencies...`);
  const totalAppearances = generations.length * 5;
  const expectedFrequency = 1 / 99;

  Object.keys(numberScores).forEach((numStr) => {
    const num = parseInt(numStr);
    const actualFrequency = appearanceCount[num] / totalAppearances;
    const frequencyRatio = actualFrequency / expectedFrequency;

    // Boost under-represented numbers (appear less than expected)
    if (frequencyRatio < 0.7) {
      numberScores[num] += 2.0 * (1 - frequencyRatio);
    }

    // Slight penalty for over-represented (to encourage diversity)
    if (frequencyRatio > 1.5) {
      numberScores[num] *= 0.9;
    }
  });

  // Phase 4: Pair/Combination Analysis
  // Boost numbers that frequently appear with other high-scoring numbers
  logger.debug(`[PREDICTION] Phase 4: Analyzing pair combinations...`);
  const topNumbers = Object.entries(numberScores)
    .map(([n, s]) => ({ num: parseInt(n), score: s }))
    .sort((a, b) => b.score - a.score)
    .slice(0, 15)
    .map((n) => n.num);

  Object.keys(numberScores).forEach((numStr) => {
    const num = parseInt(numStr);
    let pairScore = 0;

    topNumbers.forEach((topNum) => {
      if (num !== topNum) {
        const pairKey = num < topNum ? `${num}-${topNum}` : `${topNum}-${num}`;
        pairScore += pairFrequency[pairKey] || 0;
      }
    });

    numberScores[num] += pairScore * 0.3; // Weight pair analysis
  });

  // Phase 5: Sum Distribution Optimization
  logger.debug(`[PREDICTION] Phase 5: Optimizing sum distribution...`);
  const avgSum =
    sumDistribution.reduce((a, b) => a + b, 0) / sumDistribution.length;
  const sumStdDev = Math.sqrt(
    sumDistribution.reduce((acc, s) => acc + Math.pow(s - avgSum, 2), 0) /
      sumDistribution.length
  );
  const optimalSumMin = avgSum - sumStdDev;
  const optimalSumMax = avgSum + sumStdDev;

  // Phase 6: Range Distribution Analysis
  logger.debug(`[PREDICTION] Phase 6: Analyzing range distribution...`);
  const ranges = [
    { min: 1, max: 20, weight: 1 },
    { min: 21, max: 40, weight: 1 },
    { min: 41, max: 60, weight: 1 },
    { min: 61, max: 80, weight: 1 },
    { min: 81, max: 99, weight: 1 },
  ];

  const recentGens = generations.slice(0, Math.min(15, generations.length));
  const rangeCounts: number[] = [0, 0, 0, 0, 0];

  recentGens.forEach((gen) => {
    gen.numbers.forEach((num) => {
      ranges.forEach((range, idx) => {
        if (num >= range.min && num <= range.max) {
          rangeCounts[idx]++;
        }
      });
    });
  });

  const avgRangeCount = rangeCounts.reduce((a, b) => a + b, 0) / ranges.length;
  ranges.forEach((range, idx) => {
    if (rangeCounts[idx] < avgRangeCount * 0.6) {
      // Boost under-represented ranges
      for (let num = range.min; num <= range.max; num++) {
        numberScores[num] += 1.5;
      }
    }
  });

  // Phase 6.5: Behavioral Pattern Analysis & User Profile
  logger.debug(
    `[PREDICTION] Phase 6.5: Building user profile and analyzing behavioral patterns...`
  );
  const userProfile = buildUserProfile(generations);
  const manipulationScores = generations
    .filter((gen) => gen.manipulationScore)
    .map((gen) => gen.manipulationScore!.score);
  const avgManipulationScore =
    manipulationScores.length > 0
      ? manipulationScores.reduce((a, b) => a + b, 0) /
        manipulationScores.length
      : 0;

  // Weight behavioral patterns based on manipulation confidence
  const behavioralWeight = Math.min(1.0, avgManipulationScore / 50); // 0-1, higher when manipulation detected

  if (behavioralWeight > 0.2) {
    // Apply user profile preferences
    Object.keys(userProfile.favoriteNumbers).forEach((numStr) => {
      const num = parseInt(numStr);
      const preference = userProfile.favoriteNumbers[num];
      numberScores[num] += preference * 10 * behavioralWeight;
    });

    // Apply favorite range preferences
    Object.keys(userProfile.favoriteRanges).forEach((range) => {
      const [min, max] = range.split("-").map(Number);
      const preference = userProfile.favoriteRanges[range];
      for (let num = min; num <= max; num++) {
        numberScores[num] += preference * 5 * behavioralWeight;
      }
    });

    // Apply digit ending preferences
    Object.keys(userProfile.digitEndingPreferences).forEach((endingStr) => {
      const ending = parseInt(endingStr);
      const preference = userProfile.digitEndingPreferences[ending];
      for (let num = ending; num <= 99; num += 10) {
        numberScores[num] += preference * 3 * behavioralWeight;
      }
    });

    // Apply compensation patterns (if last generation had specific characteristics)
    if (generations.length > 0) {
      const lastGen = generations[0];
      const lastAvg = lastGen.numbers.reduce((a, b) => a + b, 0) / 5;
      const lastSorted = [...lastGen.numbers].sort((a, b) => a - b);
      const lastHasConsecutive = lastSorted.some(
        (n, i) => i > 0 && lastSorted[i] - lastSorted[i - 1] === 1
      );

      if (
        lastAvg < 30 &&
        userProfile.compensationPatterns.afterLow.length > 0
      ) {
        // User tends to go high after low numbers
        const compensationNumbers = [
          ...new Set(userProfile.compensationPatterns.afterLow),
        ];
        compensationNumbers.forEach((num) => {
          if (num >= 50) {
            numberScores[num] += 3 * behavioralWeight;
          }
        });
      } else if (
        lastAvg > 70 &&
        userProfile.compensationPatterns.afterHigh.length > 0
      ) {
        // User tends to go low after high numbers
        const compensationNumbers = [
          ...new Set(userProfile.compensationPatterns.afterHigh),
        ];
        compensationNumbers.forEach((num) => {
          if (num <= 50) {
            numberScores[num] += 3 * behavioralWeight;
          }
        });
      }

      if (
        lastHasConsecutive &&
        userProfile.compensationPatterns.afterConsecutive.length > 0
      ) {
        // User tends to avoid consecutive after having consecutive
        const compensationNumbers = [
          ...new Set(userProfile.compensationPatterns.afterConsecutive),
        ];
        compensationNumbers.forEach((num) => {
          numberScores[num] += 2 * behavioralWeight;
        });
      }
    }

    // Apply randomness strategy preferences
    if (userProfile.randomnessStrategy.avoidsConsecutive) {
      // Boost numbers that are far from each other
      // This will be handled in the Monte Carlo phase
    }
    if (userProfile.randomnessStrategy.prefersMiddleRange) {
      for (let num = 30; num <= 70; num++) {
        numberScores[num] += 2 * behavioralWeight;
      }
    }
    if (userProfile.randomnessStrategy.prefersSpread) {
      // Boost numbers that create good spread
      // This will be handled in the Monte Carlo phase
    }
  }

  // Phase 6.6: Avoid Recent Predictions - Penalize numbers from recent predictions
  logger.debug(
    `[PREDICTION] Phase 6.6: Avoiding similar predictions to recent ones...`
  );
  const recentPredictions = generations
    .filter((gen) => gen.predictedNumbers && gen.predictedNumbers.length === 5)
    .slice(0, 5); // Check last 5 predictions

  if (recentPredictions.length > 0) {
    recentPredictions.forEach((gen, idx) => {
      const recencyPenalty = 1.0 / (idx + 1); // More recent = higher penalty
      gen.predictedNumbers!.forEach((num) => {
        // Penalize numbers that appeared in recent predictions
        numberScores[num] *= 1 - recencyPenalty * 0.3; // Reduce score by up to 30%
      });
    });
    logger.debug(
      `[PREDICTION] Applied penalties to ${recentPredictions.length} recent predictions`
    );
  }

  // Phase 7: Consecutive Number Analysis
  // Check if consecutive numbers appear together frequently
  logger.debug(
    `[PREDICTION] Phase 7: Analyzing consecutive number patterns...`
  );
  const consecutivePairs: { [key: string]: number } = {};
  recentGens.forEach((gen) => {
    for (let i = 0; i < gen.numbers.length - 1; i++) {
      const diff = gen.numbers[i + 1] - gen.numbers[i];
      if (diff <= 5) {
        // Close numbers (within 5)
        const key = `${gen.numbers[i]}-${gen.numbers[i + 1]}`;
        consecutivePairs[key] = (consecutivePairs[key] || 0) + 1;
      }
    }
  });

  // Phase 8: Monte Carlo Simulation - Generate multiple candidate sets
  logger.debug(
    `[PREDICTION] Phase 8: Running Monte Carlo simulation (100 iterations)...`
  );
  const sortedNumbers = Object.entries(numberScores)
    .map(([num, score]) => ({ num: parseInt(num), score }))
    .sort((a, b) => b.score - a.score);

  const topCandidates = sortedNumbers.slice(0, 30);

  // Generate multiple candidate combinations and score them
  const candidateSets: { numbers: number[]; score: number }[] = [];

  for (let sim = 0; sim < 100; sim++) {
    const candidate: number[] = [];
    const available = [...topCandidates];

    while (candidate.length < 5 && available.length > 0) {
      const weights = available.map((c) => Math.max(0.001, c.score)); // Ensure positive weights
      const totalWeight = weights.reduce((a, b) => a + b, 0);

      if (totalWeight <= 0 || available.length === 0) {
        break; // Can't proceed with invalid weights
      }

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
      if (
        selected &&
        selected.num >= 1 &&
        selected.num <= 99 &&
        !candidate.includes(selected.num)
      ) {
        candidate.push(selected.num);
        available.splice(index, 1);
      } else {
        // Invalid selection, remove it and try again
        available.splice(index, 1);
      }
    }

    if (candidate.length === 5) {
      candidate.sort((a, b) => a - b);

      // Score this combination
      let comboScore = 0;
      const comboSum = candidate.reduce((a, b) => a + b, 0);

      // Sum optimization score
      if (comboSum >= optimalSumMin && comboSum <= optimalSumMax) {
        comboScore += 5;
      }

      // Range distribution score
      const comboRanges = new Set<number>();
      candidate.forEach((num) => {
        ranges.forEach((range, idx) => {
          if (num >= range.min && num <= range.max) {
            comboRanges.add(idx);
          }
        });
      });
      comboScore += comboRanges.size * 2; // Prefer diverse ranges

      // Avoid similar predictions - Penalize candidates similar to recent predictions
      if (recentPredictions.length > 0) {
        let maxSimilarity = 0;
        recentPredictions.forEach((gen, idx) => {
          if (gen.predictedNumbers) {
            const similarity = calculateSimilarity(
              candidate,
              gen.predictedNumbers
            );
            const recencyWeight = 1.0 / (idx + 1); // More recent = higher weight
            maxSimilarity = Math.max(maxSimilarity, similarity * recencyWeight);
          }
        });

        // Penalize high similarity (0-1 scale, where 1 = identical)
        // If similarity > 0.6 (3+ same numbers), heavily penalize
        if (maxSimilarity > 0.6) {
          comboScore -= 20 * maxSimilarity; // Heavy penalty for very similar predictions
        } else if (maxSimilarity > 0.4) {
          comboScore -= 10 * maxSimilarity; // Moderate penalty
        } else if (maxSimilarity > 0.2) {
          comboScore -= 5 * maxSimilarity; // Light penalty
        }

        // Bonus for being different from recent predictions
        if (maxSimilarity < 0.2) {
          comboScore += 3; // Small bonus for being different
        }
      }

      // Behavioral pattern scoring
      if (behavioralWeight > 0.2) {
        // Check if combination matches user's randomness strategy
        const sortedCandidate = [...candidate].sort((a, b) => a - b);
        const minSpacing = Math.min(
          ...sortedCandidate.slice(1).map((n, i) => n - sortedCandidate[i])
        );
        const hasConsecutive = sortedCandidate.some(
          (n, i) => i > 0 && sortedCandidate[i] - sortedCandidate[i - 1] === 1
        );
        const avgValue = candidate.reduce((a, b) => a + b, 0) / 5;

        if (
          userProfile.randomnessStrategy.avoidsConsecutive &&
          !hasConsecutive &&
          minSpacing > 10
        ) {
          comboScore += 5 * behavioralWeight; // Matches avoidance pattern
        }
        if (userProfile.randomnessStrategy.prefersSpread && minSpacing > 15) {
          comboScore += 4 * behavioralWeight; // Matches spread preference
        }
        if (
          userProfile.randomnessStrategy.prefersMiddleRange &&
          avgValue >= 30 &&
          avgValue <= 70
        ) {
          comboScore += 3 * behavioralWeight; // Matches middle range preference
        }

        // Check digit ending preferences
        const endingMatches = candidate.filter((num) => {
          const ending = num % 10;
          return userProfile.digitEndingPreferences[ending] > 0.12; // Above average preference
        }).length;
        comboScore += endingMatches * 2 * behavioralWeight;
      }

      // Pair frequency score
      for (let i = 0; i < candidate.length; i++) {
        for (let j = i + 1; j < candidate.length; j++) {
          const pairKey = `${candidate[i]}-${candidate[j]}`;
          comboScore += (pairFrequency[pairKey] || 0) * 0.5;
        }
      }

      // Individual number scores
      candidate.forEach((num) => {
        const numData = topCandidates.find((c) => c.num === num);
        comboScore += (numData?.score || 0) * 0.3;
      });

      candidateSets.push({ numbers: candidate, score: comboScore });
    }
  }

  // Select the best combination
  logger.debug(
    `[PREDICTION] Phase 9: Selecting best combination from ${candidateSets.length} candidates...`
  );
  candidateSets.sort((a, b) => b.score - a.score);

  // Find the best candidate that's not too similar to recent predictions
  let bestCombo: { numbers: number[]; score: number } | undefined;
  const mostRecentPrediction = recentPredictions[0]?.predictedNumbers;

  for (const candidate of candidateSets) {
    if (!candidate.numbers || candidate.numbers.length !== 5) continue;

    // Check similarity to most recent prediction
    if (mostRecentPrediction) {
      const similarity = calculateSimilarity(
        candidate.numbers,
        mostRecentPrediction
      );
      // Reject if more than 3 numbers match (similarity > 0.6)
      if (similarity > 0.6) {
        logger.debug(
          `[PREDICTION] Skipping candidate [${candidate.numbers.join(
            ", "
          )}] - too similar to recent prediction (${(similarity * 100).toFixed(
            0
          )}% match)`
        );
        continue;
      }
    }

    bestCombo = candidate;
    break;
  }

  // If no suitable candidate found, use the best one anyway (but log it)
  if (!bestCombo && candidateSets.length > 0) {
    bestCombo = candidateSets[0];
    if (mostRecentPrediction) {
      const similarity = calculateSimilarity(
        bestCombo.numbers,
        mostRecentPrediction
      );
      logger.warn(
        `[PREDICTION] Using best candidate despite ${(similarity * 100).toFixed(
          0
        )}% similarity to recent prediction`
      );
    }
  }

  const elapsed = ((Date.now() - startTime) / 1000).toFixed(2);
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

  // Validate result - ensure we have exactly 5 valid numbers
  const validResult = result.filter(
    (num) => num >= 1 && num <= 99 && !isNaN(num)
  );
  if (validResult.length !== 5) {
    logger.warn(
      `[PREDICTION] Invalid result generated: [${result.join(
        ", "
      )}]. Falling back to random numbers.`
    );
    result = generateRandomNumbers(5);
  }

  // Ensure no duplicates and exactly 5 numbers
  const uniqueResult = [...new Set(result)].filter(
    (num) => num >= 1 && num <= 99
  );
  if (uniqueResult.length !== 5) {
    logger.warn(
      `[PREDICTION] Duplicate or invalid numbers detected. Generating random numbers.`
    );
    result = generateRandomNumbers(5);
  } else {
    result = uniqueResult.sort((a, b) => a - b);
  }

  logger.info(
    `[PREDICTION] Complete! Predicted numbers: [${result.join(
      ", "
    )}] (took ${elapsed}s)`
  );
  return result;
}
