import { NextRequest, NextResponse } from "next/server";
import { writeGenerations } from "@/lib/generations";
import { Generation } from "@/types/generation";

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
        if (typeof num !== "number" || num < 1 || num > 99) {
          return NextResponse.json(
            { error: "Invalid format: Numbers must be between 1 and 99" },
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
          if (typeof num !== "number" || num < 1 || num > 99) {
            return NextResponse.json(
              { error: "Invalid format: Predicted numbers must be between 1 and 99" },
              { status: 400 }
            );
          }
        }
      }
    }

    // No record limit - import all records
    await writeGenerations(body);

    return NextResponse.json({
      success: true,
      imported: body.length,
      total: body.length,
    });
  } catch (error) {
    console.error("Error importing generations:", error);
    return NextResponse.json(
      { error: "Failed to import history" },
      { status: 500 }
    );
  }
}

