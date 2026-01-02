import { Generation } from "@/types/generation";

/**
 * Manipulation Detection and Behavioral Pattern Analysis
 * Detects non-random patterns in lottery number selections
 */

export interface ManipulationScore {
  score: number; // 0-100, higher = more likely manipulated
  confidence: number; // 0-100, how confident we are in the score
  patterns: string[]; // List of detected patterns
  details: {
    runsTest: number;
    chiSquare: number;
    serialCorrelation: number;
    consecutiveAvoidance: number;
    spreadPreference: number;
    middleRangePreference: number;
    digitEndingPreference: number;
    visualPattern: number;
  };
}

export interface UserProfile {
  favoriteRanges: { [range: string]: number };
  favoriteNumbers: { [num: number]: number };
  digitEndingPreferences: { [ending: number]: number };
  compensationPatterns: {
    afterLow: number[];
    afterHigh: number[];
    afterConsecutive: number[];
  };
  randomnessStrategy: {
    avoidsConsecutive: boolean;
    prefersSpread: boolean;
    prefersMiddleRange: boolean;
  };
}

/**
 * Runs Test: Detects if sequences of odd/even or high/low numbers are too regular or irregular
 */
function runsTest(numbers: number[]): number {
  if (numbers.length < 3) return 0;

  // Test 1: Odd/Even runs
  const oddEvenSequence = numbers.map(n => n % 2 === 0 ? 'E' : 'O');
  const oddEvenRuns = countRuns(oddEvenSequence);
  const expectedOddEvenRuns = (numbers.length + 1) / 2;
  const oddEvenDeviation = Math.abs(oddEvenRuns - expectedOddEvenRuns) / expectedOddEvenRuns;

  // Test 2: High/Low runs (above/below median)
  const median = 50;
  const highLowSequence = numbers.map(n => n >= median ? 'H' : 'L');
  const highLowRuns = countRuns(highLowSequence);
  const expectedHighLowRuns = (numbers.length + 1) / 2;
  const highLowDeviation = Math.abs(highLowRuns - expectedHighLowRuns) / expectedHighLowRuns;

  // Score: deviation from expected randomness (0-100)
  const score = Math.min(100, (oddEvenDeviation + highLowDeviation) * 50);
  return score;
}

function countRuns(sequence: string[]): number {
  if (sequence.length === 0) return 0;
  let runs = 1;
  for (let i = 1; i < sequence.length; i++) {
    if (sequence[i] !== sequence[i - 1]) {
      runs++;
    }
  }
  return runs;
}

/**
 * Chi-Square Test: Checks if number distribution deviates significantly from uniform
 */
function chiSquareTest(allGenerations: Generation[]): number {
  if (allGenerations.length < 5) return 0;

  // Create frequency distribution for all numbers (1-99)
  const observedFreq: { [key: number]: number } = {};
  for (let i = 1; i <= 99; i++) {
    observedFreq[i] = 0;
  }

  // Count occurrences across all generations
  allGenerations.forEach(gen => {
    gen.numbers.forEach(num => {
      observedFreq[num] = (observedFreq[num] || 0) + 1;
    });
  });

  const totalSelections = allGenerations.length * 5;
  const expectedFreq = totalSelections / 99;

  // Calculate chi-square statistic
  let chiSquare = 0;
  for (let i = 1; i <= 99; i++) {
    const observed = observedFreq[i] || 0;
    const diff = observed - expectedFreq;
    chiSquare += (diff * diff) / expectedFreq;
  }

  // Normalize to 0-100 scale (higher chi-square = more deviation from uniform)
  // For 99 degrees of freedom, critical value around 123, so scale accordingly
  const score = Math.min(100, (chiSquare / 200) * 100);
  return score;
}

/**
 * Serial Correlation Test: Detects if consecutive draws are too similar or different
 */
function serialCorrelationTest(generations: Generation[]): number {
  if (generations.length < 3) return 0;

  const correlations: number[] = [];
  
  for (let i = 1; i < generations.length; i++) {
    const prev = generations[i - 1].numbers;
    const curr = generations[i].numbers;
    
    // Calculate similarity (how many numbers overlap)
    const overlap = prev.filter(n => curr.includes(n)).length;
    const similarity = overlap / 5; // Normalize to 0-1
    
    // Random expectation: ~0.05 overlap (5/99 chance per number)
    const expectedSimilarity = 0.05;
    const deviation = Math.abs(similarity - expectedSimilarity);
    
    correlations.push(deviation);
  }

  const avgDeviation = correlations.reduce((a, b) => a + b, 0) / correlations.length;
  const score = Math.min(100, avgDeviation * 200); // Scale to 0-100
  return score;
}

/**
 * Detects avoidance of consecutive numbers (e.g., 23-24-25)
 */
function detectConsecutiveAvoidance(numbers: number[]): number {
  if (numbers.length < 2) return 0;

  const sorted = [...numbers].sort((a, b) => a - b);
  let consecutiveCount = 0;
  let closePairs = 0;

  for (let i = 0; i < sorted.length - 1; i++) {
    const diff = sorted[i + 1] - sorted[i];
    if (diff === 1) {
      consecutiveCount++;
    }
    if (diff <= 3) {
      closePairs++;
    }
  }

  // In random selection, expect ~0.2 consecutive pairs per set
  // If consecutiveCount is very low (< 0.1), suggests avoidance
  const expectedConsecutive = 0.2;
  const actualRate = consecutiveCount / (sorted.length - 1);
  
  if (actualRate < expectedConsecutive * 0.5) {
    return Math.min(100, (expectedConsecutive - actualRate) * 500);
  }
  
  return 0;
}

/**
 * Detects over-representation of "spread out" numbers
 */
function detectSpreadPreference(numbers: number[]): number {
  if (numbers.length < 2) return 0;

  const sorted = [...numbers].sort((a, b) => a - b);
  const minSpacing = Math.min(...sorted.slice(1).map((n, i) => n - sorted[i]));
  const avgSpacing = (sorted[sorted.length - 1] - sorted[0]) / (sorted.length - 1);
  
  // Random expectation: min spacing ~5-10, avg spacing ~20
  // If min spacing is consistently high (>15) and avg spacing is high (>25), suggests spread preference
  if (minSpacing > 15 && avgSpacing > 25) {
    return Math.min(100, ((minSpacing - 10) / 20 + (avgSpacing - 20) / 20) * 50);
  }
  
  return 0;
}

/**
 * Identifies preference for middle-range numbers (avoiding extremes)
 */
function detectMiddleRangePreference(numbers: number[]): number {
  const lowRange = numbers.filter(n => n >= 1 && n <= 20).length;
  const highRange = numbers.filter(n => n >= 80 && n <= 99).length;
  const middleRange = numbers.filter(n => n >= 30 && n <= 70).length;
  
  // Random expectation: ~1 number in each extreme range, ~2-3 in middle
  // If extremes are avoided (< 0.5 each) and middle is over-represented (> 3), suggests preference
  const totalExtremes = lowRange + highRange;
  const expectedExtremes = 1.0;
  const expectedMiddle = 2.5;
  
  let score = 0;
  if (totalExtremes < expectedExtremes * 0.5) {
    score += 30;
  }
  if (middleRange > expectedMiddle * 1.5) {
    score += 30;
  }
  
  return Math.min(100, score);
}

/**
 * Tracks digit-ending preferences
 */
function detectDigitEndingPreference(numbers: number[], allGenerations: Generation[]): number {
  if (allGenerations.length < 5) return 0;

  const endingCounts: { [ending: number]: number } = {};
  for (let i = 0; i <= 9; i++) {
    endingCounts[i] = 0;
  }

  allGenerations.forEach(gen => {
    gen.numbers.forEach(num => {
      const ending = num % 10;
      endingCounts[ending]++;
    });
  });

  const total = allGenerations.length * 5;
  const expectedPerEnding = total / 10;
  
  // Calculate variance from expected uniform distribution
  let variance = 0;
  for (let i = 0; i <= 9; i++) {
    const diff = endingCounts[i] - expectedPerEnding;
    variance += diff * diff;
  }
  
  const normalizedVariance = variance / (expectedPerEnding * expectedPerEnding);
  return Math.min(100, normalizedVariance * 10);
}

/**
 * Detects visual/aesthetic patterns (balanced odd/even, avoiding "ugly" combinations)
 */
function detectVisualPatterns(numbers: number[]): number {
  const oddCount = numbers.filter(n => n % 2 === 1).length;
  const evenCount = numbers.length - oddCount;
  
  // Perfect balance (2-3 or 3-2 split) suggests intentional selection
  const balance = Math.abs(oddCount - evenCount);
  let score = 0;
  
  if (balance <= 1) {
    score += 40; // Very balanced
  }
  
  // Check for "round" numbers (ending in 0 or 5)
  const roundNumbers = numbers.filter(n => n % 10 === 0 || n % 10 === 5).length;
  if (roundNumbers >= 3) {
    score += 30; // Preference for round numbers
  }
  
  // Check for repeated digits (e.g., 11, 22, 33)
  const repeatedDigits = numbers.filter(n => {
    const str = n.toString();
    return str.length === 2 && str[0] === str[1];
  }).length;
  if (repeatedDigits >= 2) {
    score += 20; // Preference for repeated digits
  }
  
  return Math.min(100, score);
}

/**
 * Builds a user profile based on historical selections
 */
export function buildUserProfile(generations: Generation[]): UserProfile {
  const profile: UserProfile = {
    favoriteRanges: {},
    favoriteNumbers: {},
    digitEndingPreferences: {},
    compensationPatterns: {
      afterLow: [],
      afterHigh: [],
      afterConsecutive: [],
    },
    randomnessStrategy: {
      avoidsConsecutive: false,
      prefersSpread: false,
      prefersMiddleRange: false,
    },
  };

  if (generations.length === 0) return profile;

  // Track favorite ranges
  const rangeCounts: { [range: string]: number } = {
    '1-20': 0,
    '21-40': 0,
    '41-60': 0,
    '61-80': 0,
    '81-99': 0,
  };

  // Track favorite numbers
  const numberCounts: { [num: number]: number } = {};
  const digitEndingCounts: { [ending: number]: number } = {};

  let consecutiveAvoidanceCount = 0;
  let spreadPreferenceCount = 0;
  let middleRangePreferenceCount = 0;

  generations.forEach((gen, idx) => {
    gen.numbers.forEach(num => {
      numberCounts[num] = (numberCounts[num] || 0) + 1;
      
      if (num >= 1 && num <= 20) rangeCounts['1-20']++;
      else if (num >= 21 && num <= 40) rangeCounts['21-40']++;
      else if (num >= 41 && num <= 60) rangeCounts['41-60']++;
      else if (num >= 61 && num <= 80) rangeCounts['61-80']++;
      else if (num >= 81 && num <= 99) rangeCounts['81-99']++;

      const ending = num % 10;
      digitEndingCounts[ending] = (digitEndingCounts[ending] || 0) + 1;
    });

    // Analyze patterns
    const sorted = [...gen.numbers].sort((a, b) => a - b);
    const hasConsecutive = sorted.some((n, i) => i > 0 && sorted[i] - sorted[i - 1] === 1);
    if (!hasConsecutive) consecutiveAvoidanceCount++;

    const minSpacing = Math.min(...sorted.slice(1).map((n, i) => n - sorted[i]));
    if (minSpacing > 15) spreadPreferenceCount++;

    const middleCount = gen.numbers.filter(n => n >= 30 && n <= 70).length;
    if (middleCount >= 3) middleRangePreferenceCount++;

    // Track compensation patterns
    if (idx > 0) {
      const prevGen = generations[idx - 1];
      const prevAvg = prevGen.numbers.reduce((a, b) => a + b, 0) / 5;
      const currAvg = gen.numbers.reduce((a, b) => a + b, 0) / 5;

      if (prevAvg < 30) {
        profile.compensationPatterns.afterLow.push(...gen.numbers);
      } else if (prevAvg > 70) {
        profile.compensationPatterns.afterHigh.push(...gen.numbers);
      }

      const prevHasConsecutive = sorted.some((n, i) => i > 0 && sorted[i] - sorted[i - 1] === 1);
      if (prevHasConsecutive) {
        profile.compensationPatterns.afterConsecutive.push(...gen.numbers);
      }
    }
  });

  // Normalize favorite ranges
  const totalSelections = generations.length * 5;
  Object.keys(rangeCounts).forEach(range => {
    profile.favoriteRanges[range] = rangeCounts[range] / totalSelections;
  });

  // Normalize favorite numbers (top 20)
  const topNumbers = Object.entries(numberCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 20);
  topNumbers.forEach(([num, count]) => {
    profile.favoriteNumbers[parseInt(num)] = count / totalSelections;
  });

  // Normalize digit ending preferences
  Object.keys(digitEndingCounts).forEach(ending => {
    profile.digitEndingPreferences[parseInt(ending)] = digitEndingCounts[parseInt(ending)] / totalSelections;
  });

  // Determine randomness strategy
  const threshold = generations.length * 0.6;
  profile.randomnessStrategy.avoidsConsecutive = consecutiveAvoidanceCount > threshold;
  profile.randomnessStrategy.prefersSpread = spreadPreferenceCount > threshold;
  profile.randomnessStrategy.prefersMiddleRange = middleRangePreferenceCount > threshold;

  return profile;
}

/**
 * Calculates manipulation confidence score for a single generation
 */
export function calculateManipulationScore(
  generation: Generation,
  allGenerations: Generation[]
): ManipulationScore {
  const patterns: string[] = [];
  const details = {
    runsTest: 0,
    chiSquare: 0,
    serialCorrelation: 0,
    consecutiveAvoidance: 0,
    spreadPreference: 0,
    middleRangePreference: 0,
    digitEndingPreference: 0,
    visualPattern: 0,
  };

  // Only calculate if we have enough data
  if (allGenerations.length >= 3) {
    details.runsTest = runsTest(generation.numbers);
    if (details.runsTest > 30) patterns.push("Non-random odd/even or high/low patterns");

    details.chiSquare = chiSquareTest(allGenerations);
    if (details.chiSquare > 40) patterns.push("Non-uniform number distribution");

    details.serialCorrelation = serialCorrelationTest(allGenerations.slice(0, Math.min(20, allGenerations.length)));
    if (details.serialCorrelation > 30) patterns.push("Consecutive draws show patterns");
  }

  details.consecutiveAvoidance = detectConsecutiveAvoidance(generation.numbers);
  if (details.consecutiveAvoidance > 30) patterns.push("Avoids consecutive numbers");

  details.spreadPreference = detectSpreadPreference(generation.numbers);
  if (details.spreadPreference > 30) patterns.push("Prefers spread-out numbers");

  details.middleRangePreference = detectMiddleRangePreference(generation.numbers);
  if (details.middleRangePreference > 30) patterns.push("Prefers middle-range numbers");

  if (allGenerations.length >= 5) {
    details.digitEndingPreference = detectDigitEndingPreference(generation.numbers, allGenerations);
    if (details.digitEndingPreference > 30) patterns.push("Digit-ending preferences detected");
  }

  details.visualPattern = detectVisualPatterns(generation.numbers);
  if (details.visualPattern > 30) patterns.push("Visual/aesthetic patterns detected");

  // Calculate overall score (weighted average)
  const weights = {
    runsTest: 0.15,
    chiSquare: 0.20,
    serialCorrelation: 0.15,
    consecutiveAvoidance: 0.12,
    spreadPreference: 0.10,
    middleRangePreference: 0.10,
    digitEndingPreference: 0.10,
    visualPattern: 0.08,
  };

  const score = Math.min(100,
    details.runsTest * weights.runsTest +
    details.chiSquare * weights.chiSquare +
    details.serialCorrelation * weights.serialCorrelation +
    details.consecutiveAvoidance * weights.consecutiveAvoidance +
    details.spreadPreference * weights.spreadPreference +
    details.middleRangePreference * weights.middleRangePreference +
    details.digitEndingPreference * weights.digitEndingPreference +
    details.visualPattern * weights.visualPattern
  );

  // Confidence increases with more data
  const confidence = Math.min(100, 30 + (allGenerations.length * 5));

  return {
    score: Math.round(score),
    confidence: Math.min(100, confidence),
    patterns,
    details,
  };
}

