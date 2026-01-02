import { NextResponse } from "next/server";
import { promises as fs } from "fs";
import path from "path";

const DATA_FILE = path.join(process.cwd(), "data", "generations.json");

interface Generation {
  id: string;
  numbers: number[];
  date: string;
  predictedNumbers?: number[];
}

async function ensureDataDirectory() {
  const dataDir = path.join(process.cwd(), "data");
  try {
    await fs.access(dataDir);
  } catch {
    await fs.mkdir(dataDir, { recursive: true });
  }
}

async function readGenerations(): Promise<Generation[]> {
  try {
    await ensureDataDirectory();
    const fileContent = await fs.readFile(DATA_FILE, "utf-8");
    return JSON.parse(fileContent);
  } catch (error) {
    return [];
  }
}

function predictNumbers(generations: Generation[]): number[] {
  if (generations.length === 0) {
    // No history, return random numbers
    const numbers: number[] = [];
    while (numbers.length < 5) {
      const num = Math.floor(Math.random() * 99) + 1;
      if (!numbers.includes(num)) {
        numbers.push(num);
      }
    }
    return numbers.sort((a, b) => a - b);
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
          pairFrequency[pairKey] = (pairFrequency[pairKey] || 0) + recencyWeight;
        }
      });
    });
  });

  // Phase 2: Expected Return Time Analysis (Gap Analysis)
  const avgInterval = generations.length > 1 
    ? (now - new Date(generations[generations.length - 1].date).getTime()) / (generations.length - 1)
    : 0;
  
  Object.keys(numberScores).forEach((numStr) => {
    const num = parseInt(numStr);
    const lastSeen = lastAppearance[num] || 0;
    const gap = now - lastSeen;
    const expectedReturn = avgInterval * (99 / 5); // Expected cycles for number to return
    
    // Boost numbers that are overdue (gap > expected return)
    if (gap > expectedReturn * 1.2) {
      const overdueFactor = Math.min((gap / expectedReturn) / 2, 3.0);
      numberScores[num] += 2.5 * overdueFactor;
    }
  });

  // Phase 3: Frequency Normalization & Under-representation Boost
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
  const topNumbers = Object.entries(numberScores)
    .map(([n, s]) => ({ num: parseInt(n), score: s }))
    .sort((a, b) => b.score - a.score)
    .slice(0, 15)
    .map(n => n.num);
  
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
  const avgSum = sumDistribution.reduce((a, b) => a + b, 0) / sumDistribution.length;
  const sumStdDev = Math.sqrt(
    sumDistribution.reduce((acc, s) => acc + Math.pow(s - avgSum, 2), 0) / sumDistribution.length
  );
  const optimalSumMin = avgSum - sumStdDev;
  const optimalSumMax = avgSum + sumStdDev;

  // Phase 6: Range Distribution Analysis
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

  // Phase 7: Consecutive Number Analysis
  // Check if consecutive numbers appear together frequently
  const consecutivePairs: { [key: string]: number } = {};
  recentGens.forEach((gen) => {
    for (let i = 0; i < gen.numbers.length - 1; i++) {
      const diff = gen.numbers[i + 1] - gen.numbers[i];
      if (diff <= 5) { // Close numbers (within 5)
        const key = `${gen.numbers[i]}-${gen.numbers[i + 1]}`;
        consecutivePairs[key] = (consecutivePairs[key] || 0) + 1;
      }
    }
  });

  // Phase 8: Monte Carlo Simulation - Generate multiple candidate sets
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
      const weights = available.map(c => c.score);
      const totalWeight = weights.reduce((a, b) => a + b, 0);
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
      if (!candidate.includes(selected.num)) {
        candidate.push(selected.num);
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
      
      // Pair frequency score
      for (let i = 0; i < candidate.length; i++) {
        for (let j = i + 1; j < candidate.length; j++) {
          const pairKey = `${candidate[i]}-${candidate[j]}`;
          comboScore += (pairFrequency[pairKey] || 0) * 0.5;
        }
      }
      
      // Individual number scores
      candidate.forEach((num) => {
        const numData = topCandidates.find(c => c.num === num);
        comboScore += (numData?.score || 0) * 0.3;
      });
      
      candidateSets.push({ numbers: candidate, score: comboScore });
    }
  }
  
  // Select the best combination
  candidateSets.sort((a, b) => b.score - a.score);
  const bestCombo = candidateSets[0];
  
  return bestCombo ? bestCombo.numbers : sortedNumbers.slice(0, 5).map(n => n.num).sort((a, b) => a - b);
}

export async function GET() {
  try {
    const generations = await readGenerations();
    const predictedNumbers = predictNumbers(generations);
    return NextResponse.json({ numbers: predictedNumbers });
  } catch (error) {
    console.error("Error predicting numbers:", error);
    return NextResponse.json(
      { error: "Failed to predict numbers" },
      { status: 500 }
    );
  }
}

