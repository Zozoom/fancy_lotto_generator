# Prediction & Detection Algorithms Documentation

This document explains how the lottery number prediction and manipulation detection algorithms work in this application.

## Table of Contents

1. [Overview](#overview)
2. [Prediction Algorithms](#prediction-algorithms)
   - [History-Based Prediction](#history-based-prediction)
   - [Analytics-Based Prediction](#analytics-based-prediction)
3. [Manipulation Detection](#manipulation-detection)
4. [User Profile & Behavioral Analysis](#user-profile--behavioral-analysis)
5. [How It All Works Together](#how-it-all-works-together)

---

## Overview

The application uses two main prediction algorithms and a comprehensive manipulation detection system:

- **History-Based Prediction**: Advanced algorithm using exponential decay, frequency analysis, gap analysis, Monte Carlo simulation, and behavioral patterns
- **Analytics-Based Prediction**: Statistical approach using hot numbers, recent trends, cold numbers, and distribution patterns
- **Manipulation Detection**: Detects non-random patterns and human biases in number selection

---

## Prediction Algorithms

### History-Based Prediction

**Location**: `src/lib/prediction.ts`

This is the primary prediction algorithm that analyzes historical data using multiple sophisticated techniques.

#### Phase 1: Exponential Decay Recency + Frequency Analysis

- **Purpose**: Weight recent generations more heavily than older ones
- **Method**: Uses exponential decay formula `e^(-λt)` where:
  - `λ` (decay rate) = 0.1
  - `t` = age in days
  - More recent generations get exponentially higher weights
- **Position Weighting**: Middle positions (2nd and 3rd) get slightly higher weight (15% boost)
- **Pair Frequency**: Tracks which numbers appear together frequently

#### Phase 2: Expected Return Time Analysis (Gap Analysis)

- **Purpose**: Identify numbers that are "overdue" to appear
- **Method**:
  - Calculates average interval between generations
  - Determines expected return time for each number
  - Boosts numbers that haven't appeared in a while (gap > 120% of expected return)
- **Boost Factor**: Up to 3x multiplier for overdue numbers

#### Phase 3: Frequency Normalization & Under-representation Boost

- **Purpose**: Balance number distribution
- **Method**:
  - Compares actual frequency vs expected uniform distribution (1/99 per number)
  - Boosts under-represented numbers (< 70% of expected frequency)
  - Slight penalty for over-represented numbers (> 150% of expected frequency)

#### Phase 4: Pair/Combination Analysis

- **Purpose**: Leverage numbers that frequently appear together
- **Method**:
  - Identifies top 15 highest-scoring numbers
  - Boosts numbers that frequently pair with these top numbers
  - Uses weighted pair frequency scores

#### Phase 5: Sum Distribution Optimization

- **Purpose**: Predict combinations with optimal sum ranges
- **Method**:
  - Calculates average sum and standard deviation from historical data
  - Defines optimal sum range: `average ± 1 standard deviation`
  - Used later in Monte Carlo scoring

#### Phase 6: Range Distribution Analysis

- **Purpose**: Ensure balanced distribution across number ranges
- **Method**:
  - Divides numbers into 5 ranges: 1-20, 21-40, 41-60, 61-80, 81-99
  - Analyzes last 15 generations
  - Boosts under-represented ranges (< 60% of average)

#### Phase 6.5: Behavioral Pattern Analysis & User Profile

- **Purpose**: Adapt predictions based on detected user behavior patterns
- **Method**:
  - Builds user profile from historical selections
  - Calculates manipulation confidence score
  - If manipulation detected (> 20% confidence):
    - Applies favorite number preferences
    - Applies favorite range preferences
    - Applies digit-ending preferences
    - Applies compensation patterns (e.g., high after low numbers)

#### Phase 6.6: Avoid Recent Predictions

- **Purpose**: Prevent predicting similar numbers to recent predictions
- **Method**:
  - Checks last 5 predictions
  - Penalizes numbers that appeared in recent predictions
  - More recent predictions get higher penalties (up to 30% score reduction)

#### Phase 7: Consecutive Number Analysis

- **Purpose**: Track patterns in consecutive number appearances
- **Method**: Analyzes how often consecutive numbers (within 5) appear together

#### Phase 8: Monte Carlo Simulation

- **Purpose**: Generate and score multiple candidate combinations
- **Method**:
  - Generates 100 candidate sets from top 30 scoring numbers
  - Scores each combination based on:
    - Sum optimization (within optimal range)
    - Range diversity (prefer numbers from different ranges)
    - Pair frequency (boost common pairs)
    - Behavioral pattern matching
    - Similarity penalties (avoid recent predictions)
  - Selects best-scoring combination

#### Phase 9: Final Selection & Validation

- **Purpose**: Ensure valid, diverse prediction
- **Method**:
  - Filters out candidates too similar to recent predictions (> 60% similarity)
  - Validates all numbers are between 1-99
  - Ensures no duplicates
  - Falls back to random if validation fails

---

### Analytics-Based Prediction

**Location**: `src/lib/analyticsPrediction.ts`

This algorithm uses statistical analysis of historical data to predict numbers.

#### Strategy 1: Hot Numbers (Most Frequent)

- **Weight**: High
- **Method**:
  - Top 15 hot numbers get scores based on their frequency percentage
  - Decreasing weight: first hot number gets 100% weight, 15th gets ~7% weight
- **Formula**: `score += percentage × 10 × weight`

#### Strategy 2: Recent Trends

- **Weight**: Very High
- **Method**:
  - **Last 10 generations**: Each appearance gets +15 points
  - **Last 30 generations**: Each appearance gets +8 points (if not in last 10)
- **Rationale**: Recent patterns are most predictive

#### Strategy 3: Cold Numbers (Least Frequent)

- **Weight**: Medium
- **Method**:
  - Top 10 cold numbers get boosted
  - Only if NOT in recent trends (to avoid conflicts)
  - Uses inverse percentage: `(100 - percentage) × 0.5`
- **Purpose**: Add variety and balance

#### Strategy 4: Most Common Pairs

- **Weight**: Medium
- **Method**:
  - Top 10 most common pairs boost both numbers
  - Each pair occurrence adds +2 points per number

#### Strategy 5: Range Distribution

- **Weight**: Low-Medium
- **Method**:
  - Identifies under-represented ranges (< 80% of average)
  - Boosts all numbers in those ranges by +3 points

#### Strategy 6: Sum Distribution

- **Weight**: Medium
- **Method**:
  - Targets optimal sum (historical average)
  - Used in Monte Carlo scoring phase

#### Strategy 7: Digit Ending Distribution

- **Weight**: Low
- **Method**:
  - Top 5 digit endings boost all numbers ending in those digits
  - Formula: `percentage × 0.3`

#### Strategy 8: Odd/Even Balance

- **Weight**: Low
- **Method**:
  - If odd numbers > 55%, boost even numbers (+2)
  - If even numbers > 55%, boost odd numbers (+2)
- **Purpose**: Maintain statistical balance

#### Monte Carlo Scoring

- Generates 50 candidate combinations
- Scores each based on:
  - Sum optimization (closer to average = higher score)
  - Range diversity (more ranges = higher score)
  - Pair frequency matches
  - Hot number presence
  - Recent trend matches
  - Odd/even balance

---

## Manipulation Detection

**Location**: `src/lib/manipulationDetection.ts`

Detects non-random patterns that suggest human manipulation of number selection.

### Statistical Tests

#### 1. Runs Test

- **Purpose**: Detect if sequences of odd/even or high/low numbers are too regular or irregular
- **Method**:
  - Converts numbers to odd/even sequence (O/E)
  - Converts numbers to high/low sequence (H/L) based on median (50)
  - Counts "runs" (consecutive same values)
  - Compares actual runs to expected runs: `(n+1)/2`
  - Calculates deviation score
- **Score**: 0-100, higher = more non-random

#### 2. Chi-Square Test

- **Purpose**: Check if number distribution deviates significantly from uniform
- **Method**:
  - Calculates observed frequency for each number (1-99)
  - Compares to expected uniform frequency
  - Calculates chi-square statistic: `Σ((observed - expected)² / expected)`
  - Normalizes to 0-100 scale
- **Score**: 0-100, higher = more deviation from uniform

#### 3. Serial Correlation Test

- **Purpose**: Detect if consecutive draws are too similar or different
- **Method**:
  - Compares each generation to previous one
  - Calculates overlap (how many numbers match)
  - Expected similarity: ~5% (5/99 chance per number)
  - Measures deviation from expected
- **Score**: 0-100, higher = more pattern detected

### Behavioral Pattern Recognition

#### 1. Consecutive Avoidance

- **Detects**: Avoidance of consecutive numbers (e.g., 23-24-25)
- **Method**:
  - Counts consecutive pairs in sorted numbers
  - Expected rate: ~0.2 consecutive pairs per set
  - If actual rate < 0.1, suggests avoidance
- **Score**: 0-100

#### 2. Spread Preference

- **Detects**: Over-representation of "spread out" numbers
- **Method**:
  - Calculates minimum spacing between numbers
  - Calculates average spacing
  - Random expectation: min spacing ~5-10, avg spacing ~20
  - If min spacing > 15 AND avg spacing > 25, suggests preference
- **Score**: 0-100

#### 3. Middle-Range Preference

- **Detects**: Preference for middle-range numbers (avoiding extremes)
- **Method**:
  - Counts numbers in ranges: 1-20 (low), 80-99 (high), 30-70 (middle)
  - Expected: ~1 in each extreme, ~2-3 in middle
  - If extremes < 0.5 each AND middle > 3, suggests preference
- **Score**: 0-100

#### 4. Digit-Ending Preference

- **Detects**: Unconscious preference for certain digit endings
- **Method**:
  - Tracks frequency of each ending (0-9)
  - Expected: uniform distribution (10% each)
  - Calculates variance from expected
- **Score**: 0-100

#### 5. Visual/Aesthetic Patterns

- **Detects**: Intentional visual patterns
- **Checks**:
  - Perfect odd/even balance (2-3 or 3-2 split) = +40 points
  - Round numbers (ending in 0 or 5) = +30 points if ≥3
  - Repeated digits (11, 22, 33) = +20 points if ≥2
- **Score**: 0-100

### Overall Manipulation Score

**Calculation**:

```
score = (runsTest × 0.15) +
        (chiSquare × 0.20) +
        (serialCorrelation × 0.15) +
        (consecutiveAvoidance × 0.12) +
        (spreadPreference × 0.10) +
        (middleRangePreference × 0.10) +
        (digitEndingPreference × 0.10) +
        (visualPattern × 0.08)
```

**Confidence**: Increases with more data (30% base + 5% per generation, max 100%)

**Interpretation**:

- **0-39%**: Likely random
- **40-69%**: Some patterns detected
- **70-100%**: Strong manipulation indicators

---

## User Profile & Behavioral Analysis

**Location**: `src/lib/manipulationDetection.ts` - `buildUserProfile()`

Builds a comprehensive profile of user's selection behavior over time.

### Profile Components

#### 1. Favorite Ranges

- Tracks frequency of numbers in each range: 1-20, 21-40, 41-60, 61-80, 81-99
- Normalized to percentages

#### 2. Favorite Numbers

- Tracks top 20 most frequently selected numbers
- Normalized to percentages

#### 3. Digit Ending Preferences

- Tracks frequency of each digit ending (0-9)
- Normalized to percentages

#### 4. Compensation Patterns

- **After Low Numbers**: Tracks numbers selected after generations with average < 30
- **After High Numbers**: Tracks numbers selected after generations with average > 70
- **After Consecutive**: Tracks numbers selected after generations with consecutive numbers

#### 5. Randomness Strategy

- **avoidsConsecutive**: True if >60% of generations avoid consecutive numbers
- **prefersSpread**: True if >60% have minimum spacing > 15
- **prefersMiddleRange**: True if >60% have ≥3 numbers in 30-70 range

### How Profile is Used

When manipulation is detected (score > 20%), the prediction algorithm:

1. **Applies Favorite Numbers**: Boosts user's frequently selected numbers
2. **Applies Range Preferences**: Boosts numbers in preferred ranges
3. **Applies Digit Preferences**: Boosts numbers ending in preferred digits
4. **Applies Compensation**:
   - If last generation was low average → boost high numbers
   - If last generation was high average → boost low numbers
   - If last generation had consecutive → boost non-consecutive patterns

---

## How It All Works Together

### Prediction Flow

1. **User requests prediction** (History or Analytics method)
2. **Load historical data** from `data/generations.json`
3. **Calculate manipulation scores** for recent generations (if not already calculated)
4. **Run prediction algorithm**:
   - History-based: Uses all phases (1-9)
   - Analytics-based: Uses statistical patterns
5. **Avoid similar predictions** by checking against recent predictions
6. **Validate and return** 5 unique numbers between 1-99

### Detection Flow

1. **When saving a generation**:
   - Calculate manipulation score using all detection methods
   - Store score, confidence, and detected patterns
2. **Score calculation**:
   - Runs all statistical tests
   - Detects behavioral patterns
   - Combines into weighted score
3. **Display in history**:
   - Shows score (0-100%)
   - Shows confidence level
   - Shows detected patterns on hover

### Adaptive Learning

The system learns and adapts:

1. **More data = Better predictions**: Algorithms improve with more historical data
2. **Behavioral adaptation**: If manipulation detected, predictions adapt to user's patterns
3. **Pattern avoidance**: Actively avoids repeating recent predictions
4. **Balance maintenance**: Tries to maintain statistical balance (ranges, odd/even, etc.)

---

## Algorithm Parameters

### History-Based Prediction

- **Decay Rate (λ)**: 0.1 (controls how quickly older data loses weight)
- **Monte Carlo Iterations**: 100 (number of candidate combinations to generate)
- **Top Candidates**: 30 (numbers considered for final selection)
- **Similarity Threshold**: 60% (rejects candidates with >3 matching numbers)

### Analytics-Based Prediction

- **Monte Carlo Iterations**: 50
- **Hot Numbers Considered**: Top 15
- **Cold Numbers Considered**: Top 10
- **Recent Trends**: Last 10 and last 30 generations

### Manipulation Detection

- **Minimum Data**: 3 generations for basic tests, 5 for advanced tests
- **Weight Distribution**:
  - Chi-Square: 20% (most important)
  - Runs Test: 15%
  - Serial Correlation: 15%
  - Consecutive Avoidance: 12%
  - Others: 8-10% each

---

## Performance Considerations

- **History-Based Prediction**: ~0.01-0.1 seconds (depends on data size)
- **Analytics-Based Prediction**: ~0.01-0.05 seconds (faster, less complex)
- **Manipulation Detection**: Limited to recent 200 generations for performance
- **Monte Carlo Simulation**: Most time-consuming phase (100 iterations)

---

## Future Enhancements

Potential improvements:

1. **Machine Learning**: Train models on historical patterns
2. **Temporal Patterns**: Detect day-of-week, time-of-day patterns
3. **Advanced Pair Analysis**: 3-number and 4-number combinations
4. **Seasonal Patterns**: Detect if certain numbers appear more in certain periods
5. **Cross-User Analysis**: Compare patterns across multiple users (if applicable)

---

## References

- **Runs Test**: Statistical test for randomness
- **Chi-Square Test**: Test for distribution uniformity
- **Monte Carlo Simulation**: Probabilistic method for optimization
- **Exponential Decay**: Mathematical model for recency weighting
- **Behavioral Pattern Recognition**: Cognitive bias detection in number selection
