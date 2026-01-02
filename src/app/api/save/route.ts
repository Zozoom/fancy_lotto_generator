import { NextRequest, NextResponse } from "next/server";
import { readGenerations, writeGenerations } from "@/lib/generations";
import { Generation } from "@/types/generation";
import { getCurrentISODate, validateNumbers } from "@/lib/utils";

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

    generations.unshift(newGeneration);
    // No record limit - save all generations
    await writeGenerations(generations);

    return NextResponse.json({ success: true, generation: newGeneration });
  } catch (error) {
    console.error("Error saving generation:", error);
    return NextResponse.json(
      { error: "Failed to save generation" },
      { status: 500 }
    );
  }
}

