import { NextRequest, NextResponse } from "next/server";
import { readGenerations, writeGenerations } from "@/lib/generations";
import { Generation } from "@/types/generation";
import { getCurrentISODate, validateNumbers } from "@/lib/utils";
import { calculateManipulationScore } from "@/lib/manipulationDetection";
import { logger } from "@/lib/logger";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { numbers, date, predictedNumbers } = body;

    if (!validateNumbers(numbers)) {
      return NextResponse.json(
        { error: "Invalid numbers array" },
        { status: 400 }
      );
    }

    const generations = await readGenerations();
    const newGeneration: Generation = {
      id: Date.now().toString(),
      numbers,
      date: date || getCurrentISODate(),
      ...(predictedNumbers && Array.isArray(predictedNumbers) && predictedNumbers.length > 0
        ? { predictedNumbers }
        : {}),
    };

    // Calculate manipulation score before adding to history
    logger.info(`[SAVE] Calculating manipulation score for numbers: [${numbers.join(", ")}]`);
    const manipulationStartTime = Date.now();
    try {
      // Limit generations used for calculation to prevent timeout (use most recent 200)
      const recentGenerations = generations.slice(0, 200);
      const manipulationResult = calculateManipulationScore(newGeneration, recentGenerations);
      const manipulationElapsed = ((Date.now() - manipulationStartTime) / 1000).toFixed(2);
      logger.info(`[SAVE] Manipulation score: ${manipulationResult.score}% (confidence: ${manipulationResult.confidence}%, took ${manipulationElapsed}s)`);
      if (manipulationResult.patterns.length > 0) {
        logger.debug(`[SAVE] Detected patterns: ${manipulationResult.patterns.join(", ")}`);
      }
      newGeneration.manipulationScore = {
        score: manipulationResult.score,
        confidence: manipulationResult.confidence,
        patterns: manipulationResult.patterns,
      };
    } catch (error) {
      logger.error(`[SAVE] Error calculating manipulation score: ${error instanceof Error ? error.message : String(error)}`);
      // Continue without manipulation score if calculation fails
      newGeneration.manipulationScore = {
        score: 0,
        confidence: 0,
        patterns: [],
      };
    }

    generations.unshift(newGeneration);
    // No record limit - save all generations
    await writeGenerations(generations);

    logger.info(`[SAVE] Successfully saved generation ${newGeneration.id}`);
    return NextResponse.json({ success: true, generation: newGeneration });
  } catch (error) {
    logger.error(`[SAVE] Error saving generation: ${error instanceof Error ? error.message : String(error)}`);
    return NextResponse.json(
      { error: "Failed to save generation" },
      { status: 500 }
    );
  }
}

