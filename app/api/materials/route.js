// app/api/materials/route.js
import { NextResponse } from "next/server";
import pool from "@/lib/db"; // ตรวจสอบว่า import ถูกต้อง

export async function GET(request) {
  try {
    const sql = "SELECT id, matname FROM materials ORDER BY matname ASC";
    // ใช้ pool.execute() แทน pool.query()
    const [materials] = await pool.execute(sql);
    return NextResponse.json(materials);
  } catch (error) {
    console.error("API GET /api/materials Error:", error);
    // ส่งคืนข้อผิดพลาดที่สื่อความหมายมากขึ้นถ้าเป็นไปได้
    return NextResponse.json(
      { message: "Failed to fetch materials", error: error.message },
      { status: 500 }
    );
  }
}
