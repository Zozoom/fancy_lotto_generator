import { NextResponse } from "next/server";
import { promises as fs } from "fs";
import path from "path";

const DATA_FILE = path.join(process.cwd(), "data", "generations.json");

async function ensureDataDirectory() {
  const dataDir = path.join(process.cwd(), "data");
  try {
    await fs.access(dataDir);
  } catch {
    await fs.mkdir(dataDir, { recursive: true });
  }
}

export async function GET() {
  try {
    await ensureDataDirectory();
    const fileContent = await fs.readFile(DATA_FILE, "utf-8");
    const generations = JSON.parse(fileContent);
    
    // Sort by date (newest first)
    const sortedGenerations = generations.sort((a: any, b: any) => {
      const dateA = new Date(a.date).getTime();
      const dateB = new Date(b.date).getTime();
      return dateB - dateA; // Descending order (newest first)
    });
    
    return NextResponse.json(sortedGenerations);
  } catch (error) {
    // If file doesn't exist, return empty array
    return NextResponse.json([]);
  }
}

