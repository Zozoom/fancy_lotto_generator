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

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const idsParam = searchParams.get("ids");
    
    if (!idsParam) {
      return NextResponse.json(
        { error: "No IDs provided" },
        { status: 400 }
      );
    }

    const idsToDelete = idsParam.split(",").filter(id => id.trim() !== "");
    
    if (idsToDelete.length === 0) {
      return NextResponse.json(
        { error: "Invalid IDs provided" },
        { status: 400 }
      );
    }

    const generations = await readGenerations();
    const initialCount = generations.length;
    
    // Filter out the generations with matching IDs
    const filteredGenerations = generations.filter(gen => !idsToDelete.includes(gen.id));
    const deletedCount = initialCount - filteredGenerations.length;

    await writeGenerations(filteredGenerations);

    return NextResponse.json({
      success: true,
      deleted: deletedCount,
      remaining: filteredGenerations.length,
    });
  } catch (error) {
    console.error("Error deleting generations:", error);
    return NextResponse.json(
      { error: "Failed to delete generations" },
      { status: 500 }
    );
  }
}

