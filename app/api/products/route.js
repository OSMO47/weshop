// app/api/products/route.js
import { NextResponse } from "next/server";
import pool from "@/lib/db";
import { writeFile, unlink } from "fs/promises"; // For file handling
import path from "path";
import { mkdir } from "fs/promises"; // To create directory if not exists

// Helper function for DB queries
async function queryDB(sql, params = []) {
  let connection; // ประกาศ connection นอก try block
  try {
    connection = await pool.getConnection(); // getConnection ควรจะทำงานได้ถ้า pool ถูก import ถูกต้อง
    const [results] = await connection.execute(sql, params);
    return results;
  } catch (error) {
    console.error("Database Query Error in helper:", error);
    // โยน error ต่อไปเพื่อให้ route handler จัดการ
    throw new Error(`Database operation failed in helper: ${error.message}`);
  } finally {
    // ตรวจสอบว่า connection ถูกสร้างก่อนที่จะ release
    if (connection) {
      connection.release();
    }
  }
}

// GET: ดึงข้อมูลสินค้าทั้งหมดพร้อมชื่อประเภทและวัสดุ
export async function GET(request) {
  try {
    const sql = `
      SELECT f.*, t.typename, m.matname
      FROM furniture f
      LEFT JOIN furtype t ON f.type_id = t.id
      LEFT JOIN materials m ON f.material_id = m.id
      ORDER BY f.Fur_ID ASC
    `;
    const products = await queryDB(sql);
    return NextResponse.json(products);
  } catch (error) {
    console.error("API GET /api/products Error:", error);
    return NextResponse.json(
      { message: "Failed to fetch products", error: error.message },
      { status: 500 }
    );
  }
}

// POST: เพิ่มสินค้าใหม่ (รวม Upload รูปภาพ)
export async function POST(request) {
  // FIXME: Add Authentication Check (Admin Only)
  const formData = await request.formData();
  const imageFile = formData.get("image");
  const furId = formData.get("Fur_ID");
  const furName = formData.get("Fur_name");
  const typeId = formData.get("Types");
  const materialId = formData.get("Materials");
  const stocks = formData.get("Stocks");
  const price = formData.get("Price");

  if (
    !imageFile ||
    !(imageFile instanceof File) ||
    !furId ||
    !furName ||
    !typeId ||
    !materialId ||
    stocks === null ||
    price === null
  ) {
    return NextResponse.json(
      { success: false, message: "ข้อมูลไม่ครบถ้วน (Missing required fields)" },
      { status: 400 }
    );
  }
  if (parseInt(stocks) < 0 || parseFloat(price) <= 0) {
    return NextResponse.json(
      { success: false, message: "สต็อกหรือราคาไม่ถูกต้อง" },
      { status: 400 }
    );
  }

  // --- File Upload Logic ---
  let imageUrl = null;
  let uploadPath = null;
  const uploadDir = path.join(process.cwd(), "public/images/furniture");
  try {
    await mkdir(uploadDir, { recursive: true }); // Ensure directory exists

    const bytes = await imageFile.arrayBuffer();
    const buffer = Buffer.from(bytes);
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    const filename = `furniture-${uniqueSuffix}${path.extname(imageFile.name)}`;
    uploadPath = path.join(uploadDir, filename);

    await writeFile(uploadPath, buffer);
    imageUrl = `/images/furniture/${filename}`; // Relative path for client access
  } catch (uploadError) {
    console.error("File Upload Error:", uploadError);
    return NextResponse.json(
      {
        success: false,
        message: "ไม่สามารถอัปโหลดรูปภาพได้ (Image upload failed)",
      },
      { status: 500 }
    );
  }

  // --- Database Insertion ---
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();

    const [existing] = await connection.execute(
      "SELECT Fur_ID FROM furniture WHERE Fur_ID = ?",
      [furId]
    );
    if (existing.length > 0) {
      await connection.rollback();
      if (uploadPath) await unlink(uploadPath); // Delete uploaded file if ID exists
      return NextResponse.json(
        {
          success: false,
          message: "รหัสสินค้านี้มีอยู่แล้ว (Product ID already exists)",
        },
        { status: 409 }
      ); // 409 Conflict
    }

    const insertSql = `
            INSERT INTO furniture (Fur_ID, Fur_name, type_id, material_id, Stocks, Prices, image_url)
            VALUES (?, ?, ?, ?, ?, ?, ?)
        `;
    await connection.execute(insertSql, [
      furId,
      furName,
      typeId,
      materialId,
      stocks,
      price,
      imageUrl,
    ]);

    await connection.commit();
    return NextResponse.json(
      {
        success: true,
        message: "เพิ่มสินค้าสำเร็จ (Product added successfully)",
        productId: furId,
      },
      { status: 201 }
    );
  } catch (dbError) {
    await connection.rollback();
    if (uploadPath) await unlink(uploadPath); // Delete uploaded file on DB error
    console.error("API POST DB Error:", dbError);
    if (dbError.code === "ER_NO_REFERENCED_ROW_2") {
      return NextResponse.json(
        {
          success: false,
          message: "ประเภทหรือวัสดุไม่ถูกต้อง (Invalid type or material ID)",
        },
        { status: 400 }
      );
    }
    return NextResponse.json(
      {
        success: false,
        message: "เกิดข้อผิดพลาดในการบันทึกข้อมูล (Database error)",
        error: dbError.message,
      },
      { status: 500 }
    );
  } finally {
    connection.release();
  }
}
