import { NextResponse } from "next/server";
import { readGenerations } from "@/lib/generations";
import { predictNumbers } from "@/lib/prediction";
import { logger } from "@/lib/logger";

export async function GET() {
  try {
    const generations = await readGenerations();
    const predictedNumbers = predictNumbers(generations);
    return NextResponse.json({ numbers: predictedNumbers });
  } catch (error) {
    logger.error(`[PREDICT] Error predicting numbers: ${error instanceof Error ? error.message : String(error)}`);
    return NextResponse.json(
      { error: "Failed to predict numbers" },
      { status: 500 }
    );
  }
}

