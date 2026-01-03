import { NextRequest, NextResponse } from "next/server";
import { readGenerations, writeGenerations } from "@/lib/generations";
import { Generation } from "@/types/generation";
import { calculateManipulationScore } from "@/lib/manipulationDetection";
import { logger } from "@/lib/logger";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    if (!Array.isArray(body)) {
      return NextResponse.json(
        { error: "Invalid format: Expected an array" },
        { status: 400 }
      );
    }

    // Validate each generation object
    for (const gen of body) {
      if (!gen.id || typeof gen.id !== "string") {
        return NextResponse.json(
          { error: "Invalid format: Missing or invalid 'id' field" },
          { status: 400 }
        );
      }
      if (!gen.numbers || !Array.isArray(gen.numbers) || gen.numbers.length !== 5) {
        return NextResponse.json(
          { error: "Invalid format: 'numbers' must be an array of 5 numbers" },
          { status: 400 }
        );
      }
      if (!gen.date || typeof gen.date !== "string") {
        return NextResponse.json(
          { error: "Invalid format: Missing or invalid 'date' field" },
          { status: 400 }
        );
      }
      // Validate numbers are actually numbers
      for (const num of gen.numbers) {
        if (typeof num !== "number" || num < 1 || num > 90) {
          return NextResponse.json(
            { error: "Invalid format: Numbers must be between 1 and 90" },
            { status: 400 }
          );
        }
      }
      // Validate predictedNumbers if present
      if (gen.predictedNumbers) {
        if (!Array.isArray(gen.predictedNumbers)) {
          return NextResponse.json(
            { error: "Invalid format: 'predictedNumbers' must be an array" },
            { status: 400 }
          );
        }
        for (const num of gen.predictedNumbers) {
          if (typeof num !== "number" || num < 1 || num > 90) {
            return NextResponse.json(
              { error: "Invalid format: Predicted numbers must be between 1 and 90" },
              { status: 400 }
            );
          }
        }
      }
    }

    // Read existing generations to calculate manipulation scores
    const existingGenerations = await readGenerations();
    
    // Calculate manipulation scores for imported generations
    // We'll calculate scores based on existing + already processed imports
    const allGenerationsForScoring = [...existingGenerations];
    const importedGenerations: Generation[] = [];
    
    for (let i = 0; i < body.length; i++) {
      const gen = body[i] as Generation;
      
      // Calculate manipulation score using existing + previously imported generations
      const manipulationResult = calculateManipulationScore(gen, allGenerationsForScoring);
      gen.manipulationScore = {
        score: manipulationResult.score,
        confidence: manipulationResult.confidence,
        patterns: manipulationResult.patterns,
      };
      
      importedGenerations.push(gen);
      // Add to scoring context for next iterations
      allGenerationsForScoring.push(gen);
    }
    
    // Merge with existing generations (new imports go to the front)
    const allGenerations = [...importedGenerations, ...existingGenerations];
    
    // No record limit - import all records
    await writeGenerations(allGenerations);

    logger.info(`[IMPORT] Successfully imported ${importedGenerations.length} generations. Total: ${allGenerations.length}`);
    return NextResponse.json({
      success: true,
      imported: importedGenerations.length,
      total: allGenerations.length,
    });
  } catch (error) {
    logger.error(`[IMPORT] Error importing generations: ${error instanceof Error ? error.message : String(error)}`);
    return NextResponse.json(
      { error: "Failed to import history" },
      { status: 500 }
    );
  }
}

