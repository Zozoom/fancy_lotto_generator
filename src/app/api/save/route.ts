import { NextRequest, NextResponse } from "next/server";
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

async function writeGenerations(generations: Generation[]) {
  await ensureDataDirectory();
  await fs.writeFile(DATA_FILE, JSON.stringify(generations, null, 2), "utf-8");
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { numbers, date, predictedNumbers } = body;

    if (!numbers || !Array.isArray(numbers) || numbers.length !== 5) {
      return NextResponse.json(
        { error: "Invalid numbers array" },
        { status: 400 }
      );
    }

    const generations = await readGenerations();
    const newGeneration: Generation = {
      id: Date.now().toString(),
      numbers,
      date: date || new Date().toISOString(),
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

