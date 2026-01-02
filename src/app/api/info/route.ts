import { NextResponse } from "next/server";
import packageJson from "../../../../package.json";

export async function GET() {
  return NextResponse.json({
    name: packageJson.name,
    version: packageJson.version,
    description: packageJson.description,
    dependencies: packageJson.dependencies || {},
    devDependencies: packageJson.devDependencies || {},
    packageManager: packageJson.packageManager || "bun@latest",
  });
}

