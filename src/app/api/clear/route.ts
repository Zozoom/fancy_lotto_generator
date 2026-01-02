import { NextResponse } from "next/server";
import { writeGenerations } from "@/lib/generations";

export async function DELETE() {
  try {
    // Write empty array to clear the database
    await writeGenerations([]);
    return NextResponse.json({ success: true, message: "Database cleared" });
  } catch (error) {
    console.error("Error clearing database:", error);
    return NextResponse.json(
      { error: "Failed to clear database" },
      { status: 500 }
    );
  }
}

