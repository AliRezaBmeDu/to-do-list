import { NextResponse } from "next/server";

// Seed endpoint disabled — no demo data is loaded.
export async function POST() {
  return NextResponse.json({ error: "Not found" }, { status: 404 });
}
