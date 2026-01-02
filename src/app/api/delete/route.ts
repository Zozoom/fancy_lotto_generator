import { NextRequest, NextResponse } from "next/server";
import { readGenerations, writeGenerations } from "@/lib/generations";

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

