import { promises as fs } from "fs";
import path from "path";
import { Generation } from "@/types/generation";

const DATA_FILE = path.join(process.cwd(), "data", "generations.json");

export async function ensureDataDirectory(): Promise<void> {
  const dataDir = path.join(process.cwd(), "data");
  try {
    await fs.access(dataDir);
  } catch {
    await fs.mkdir(dataDir, { recursive: true });
  }
}

export async function readGenerations(): Promise<Generation[]> {
  try {
    await ensureDataDirectory();
    const fileContent = await fs.readFile(DATA_FILE, "utf-8");
    return JSON.parse(fileContent);
  } catch (error) {
    return [];
  }
}

export async function writeGenerations(generations: Generation[]): Promise<void> {
  await ensureDataDirectory();
  await fs.writeFile(DATA_FILE, JSON.stringify(generations, null, 2), "utf-8");
}

