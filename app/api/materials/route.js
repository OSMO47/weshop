import { NextResponse } from "next/server";
import { promisePool as pool } from '@/lib/db';

export async function GET(request) {
  try {
    const sql = "SELECT id, matname FROM materials ORDER BY matname ASC";
    const [materials] = await pool.execute(sql);
    return NextResponse.json(materials);
  } catch (error) {
    console.error("API GET /api/materials Error:", error);
    return NextResponse.json(
      { message: "Failed to fetch materials", error: error.message },
      { status: 500 }
    );
  }
}
