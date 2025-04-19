// app/api/products/[id]/route.js
import { NextResponse } from 'next/server';
import pool from '@/lib/db';
import { unlink } from 'fs/promises';
import path from 'path';

// Helper function for DB queries
async function queryDB(sql, params = []) {
    const connection = await pool.getConnection();
    try {
        const [results] = await connection.execute(sql, params);
        return results;
    } catch (error) {
        console.error("Database Query Error:", error);
        throw new Error(`Database operation failed: ${error.message}`);
    } finally {
        connection.release();
    }
}

// GET: ดึงข้อมูลสินค้าตาม ID
export async function GET(request, { params }) {
    const { id } = params; // id คือ Fur_ID
    if (!id) {
        return NextResponse.json({ message: "Product ID is required" }, { status: 400 });
    }

    try {
        const sql = `
            SELECT f.*, t.typename, m.matname
            FROM furniture f
            LEFT JOIN furtype t ON f.type_id = t.id
            LEFT JOIN materials m ON f.material_id = m.id
            WHERE f.Fur_ID = ?
        `;
        const [product] = await queryDB(sql, [id]); // ใช้ [product] เพราะคาดว่าได้ผลลัพธ์เดียว

        if (!product) {
            return NextResponse.json({ message: "Product not found" }, { status: 404 });
        }
        return NextResponse.json(product);
    } catch (error) {
        console.error(`API GET /api/products/${id} Error:`, error);
        return NextResponse.json({ message: "Failed to fetch product", error: error.message }, { status: 500 });
    }
}

// PUT: อัปเดตข้อมูลสินค้า (ตอนนี้เน้นอัปเดตสต็อก)
export async function PUT(request, { params }) {
    // FIXME: Add Authentication Check (Admin Only or specific logic for stock)
    const { id } = params;
    if (!id) {
        return NextResponse.json({ message: "Product ID is required" }, { status: 400 });
    }

    try {
        const body = await request.json();
        let newStock;
        let stockChange;

        if (body.hasOwnProperty('Stocks')) {
            // กรณีส่งค่า Stock ใหม่มาเลย (จากหน้า Stock Admin)
             newStock = parseInt(body.Stocks);
             if (isNaN(newStock) || newStock < 0) {
                return NextResponse.json({ success: false, message: "Invalid stock value provided" }, { status: 400 });
            }
        } else if (body.hasOwnProperty('stockChange')) {
            // กรณีส่งค่าการเปลี่ยนแปลง (จากหน้าสั่งซื้อ)
             stockChange = parseInt(body.stockChange);
             if (isNaN(stockChange)) {
                 return NextResponse.json({ success: false, message: "Invalid stock change value" }, { status: 400 });
             }
             // การคำนวณ newStock จะทำใน query เพื่อป้องกัน race condition
        } else {
             return NextResponse.json({ success: false, message: "Missing 'Stocks' or 'stockChange' in request body" }, { status: 400 });
        }

        const connection = await pool.getConnection();
        try {
             await connection.beginTransaction();

             // ตรวจสอบสินค้าว่ามีอยู่จริงหรือไม่ก่อนอัปเดต
             const [productCheck] = await connection.execute("SELECT Stocks FROM furniture WHERE Fur_ID = ? FOR UPDATE", [id]); // Lock row
             if (productCheck.length === 0) {
                 await connection.rollback();
                 return NextResponse.json({ success: false, message: "Product not found" }, { status: 404 });
             }

             let sql = "";
             let queryParams = [];

             if (stockChange !== undefined) {
                 // อัปเดตโดยใช้ค่าเปลี่ยนแปลง (ป้องกันการติดลบ)
                 const currentStock = parseInt(productCheck[0].Stocks);
                 if (currentStock + stockChange < 0) {
                     await connection.rollback();
                     return NextResponse.json({ success: false, message: "Insufficient stock for the requested change" }, { status: 400 });
                 }
                 sql = "UPDATE furniture SET Stocks = Stocks + ? WHERE Fur_ID = ?";
                 queryParams = [stockChange, id];
             } else {
                  // อัปเดตโดยตั้งค่าใหม่
                 sql = "UPDATE furniture SET Stocks = ? WHERE Fur_ID = ?";
                 queryParams = [newStock, id];
                 // Note: อาจต้องเพิ่ม fields อื่นๆ ที่ต้องการอัปเดตได้ในอนาคต
             }

             const [updateResult] = await connection.execute(sql, queryParams);

             if (updateResult.affectedRows === 0) {
                 // ไม่ควรเกิดขึ้นถ้า check แล้ว แต่เผื่อไว้
                 await connection.rollback();
                 return NextResponse.json({ success: false, message: "Product not found or no changes made" }, { status: 404 });
             }

             await connection.commit();
             return NextResponse.json({ success: true, message: "Stock updated successfully" });

        } catch (dbError) {
             await connection.rollback();
             console.error(`API PUT /api/products/${id} DB Error:`, dbError);
             return NextResponse.json({ success: false, message: "Failed to update product stock", error: dbError.message }, { status: 500 });
        } finally {
             connection.release();
        }

    } catch (error) {
        console.error(`API PUT /api/products/${id} Error:`, error);
         if (error instanceof SyntaxError) { // JSON parsing error
            return NextResponse.json({ message: "Invalid JSON format in request body" }, { status: 400 });
         }
        return NextResponse.json({ message: "Failed to process request", error: error.message }, { status: 500 });
    }
}


// DELETE: ลบสินค้าตาม ID
export async function DELETE(request, { params }) {
    // FIXME: Add Authentication Check (Admin Only)
    const { id } = params;
    if (!id) {
        return NextResponse.json({ message: "Product ID is required" }, { status: 400 });
    }

    const connection = await pool.getConnection();
    try {
        await connection.beginTransaction();

        // 1. ค้นหาสินค้าและ URL รูปภาพก่อนลบ
        const [product] = await connection.execute("SELECT image_url FROM furniture WHERE Fur_ID = ?", [id]);

        if (product.length === 0) {
            await connection.rollback();
            return NextResponse.json({ success: false, message: "Product not found" }, { status: 404 });
        }

        const imageUrl = product[0].image_url;

        // 2. ลบข้อมูลออกจากฐานข้อมูล
        const [deleteResult] = await connection.execute("DELETE FROM furniture WHERE Fur_ID = ?", [id]);

        if (deleteResult.affectedRows === 0) {
            // ไม่ควรเกิดขึ้น แต่ตรวจสอบไว้
            await connection.rollback();
            return NextResponse.json({ success: false, message: "Product not found during delete attempt" }, { status: 404 });
        }

        // 3. ถ้าลบข้อมูล DB สำเร็จ ให้ลบไฟล์รูปภาพ (ถ้ามี)
        if (imageUrl) {
            try {
                const imagePath = path.join(process.cwd(), 'public', imageUrl);
                await unlink(imagePath); // ลบไฟล์จริง
                console.log(`Deleted image file: ${imagePath}`);
            } catch (fileError) {
                // Log error แต่ไม่ rollback transaction เพราะข้อมูล DB ลบไปแล้ว
                // อาจจะบันทึกไว้ว่าลบไฟล์ไม่สำเร็จ
                console.error(`Failed to delete image file ${imageUrl}:`, fileError.message);
            }
        }

        await connection.commit();
        return NextResponse.json({ success: true, message: "Product deleted successfully" });

    } catch (dbError) {
        await connection.rollback();
        console.error(`API DELETE /api/products/${id} DB Error:`, dbError);
        // ตรวจสอบ Foreign Key Constraint Error (ถ้าสินค้าถูกใช้ใน OrderDetail)
        if (dbError.code === 'ER_ROW_IS_REFERENCED_2' || dbError.message.includes('foreign key constraint')) {
             return NextResponse.json({
                 success: false,
                 message: "ไม่สามารถลบสินค้าได้ เนื่องจากมีการอ้างอิงในรายการขาย (Cannot delete product due to existing order references)",
                 error: dbError.code
                }, { status: 409 }); // 409 Conflict
        }
        return NextResponse.json({ success: false, message: "Failed to delete product", error: dbError.message }, { status: 500 });
    } finally {
        connection.release();
    }
}