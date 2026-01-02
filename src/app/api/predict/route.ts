import { NextResponse } from "next/server";
import { readGenerations } from "@/lib/generations";
import { predictNumbers } from "@/lib/prediction";

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

