import { NextResponse } from "next/server";
import { promisePool as pool } from '@/lib/db';
export async function GET() {
  try {
    const sql = "SELECT id, typename FROM furtype ORDER BY typename ASC";
    const [rows] = await pool.execute(sql);
    return NextResponse.json(rows);
  } catch (error) {
    console.error("API GET /api/types Error:", error);
    return NextResponse.json(
      { message: "Failed to fetch furniture types", error: error.message },
      { status: 500 }
    );
  }
}
