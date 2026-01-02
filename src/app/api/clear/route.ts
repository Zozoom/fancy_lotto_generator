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

export async function DELETE() {
  try {
    await ensureDataDirectory();
    // Write empty array to clear the database
    await fs.writeFile(DATA_FILE, JSON.stringify([], null, 2), "utf-8");
    return NextResponse.json({ success: true, message: "Database cleared" });
  } catch (error) {
    console.error("Error clearing database:", error);
    return NextResponse.json(
      { error: "Failed to clear database" },
      { status: 500 }
    );
  }
}

