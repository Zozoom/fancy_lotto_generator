import { NextResponse } from "next/server";
import { readGenerations } from "@/lib/generations";
import { sortGenerationsByDate } from "@/lib/utils";

export async function GET() {
  try {
    const generations = await readGenerations();
    const sortedGenerations = sortGenerationsByDate(generations);
    return NextResponse.json(sortedGenerations);
  } catch (error) {
    // If file doesn't exist, return empty array
    return NextResponse.json([]);
  }
}

