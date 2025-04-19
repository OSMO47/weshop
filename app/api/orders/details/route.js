// app/api/orders/details/route.js
import { NextResponse } from 'next/server';
import pool from '@/lib/db';

// POST: สร้างข้อมูล Order Detail
// FIXME: ควรทำใน Transaction เดียวกับการสร้าง Order และ Update Stock
export async function POST(request) {
    // ไม่จำเป็นต้องมี Auth เพราะสร้างตอนลูกค้าสั่งซื้อ
    try {
        const { OrderDetailID, InvoiceID, Fur_ID, Qty, Price } = await request.json();

        if (!OrderDetailID || !InvoiceID || !Fur_ID || Qty === undefined || Price === undefined) {
            return NextResponse.json({ success: false, message: "Missing required order detail data" }, { status: 400 });
        }
         if (isNaN(parseInt(Qty)) || parseInt(Qty) <= 0) {
            return NextResponse.json({ success: false, message: "Invalid quantity" }, { status: 400 });
         }
         if (isNaN(parseFloat(Price)) || parseFloat(Price) < 0) {
             return NextResponse.json({ success: false, message: "Invalid price" }, { status: 400 });
         }

        const sql = "INSERT INTO orderdetail (OrderDetailID, InvoiceID, Fur_ID, Qty, Price) VALUES (?, ?, ?, ?, ?)";
        const [result] = await pool.execute(sql, [OrderDetailID, InvoiceID, Fur_ID, Qty, Price]);

         if (result.affectedRows > 0) {
             return NextResponse.json({ success: true, message: "Order detail created successfully", orderDetailId: OrderDetailID }, { status: 201 });
         } else {
              return NextResponse.json({ success: false, message: "Failed to create order detail, no rows affected" }, { status: 500 });
         }

    } catch (error) {
        console.error("API POST /api/orders/details Error:", error);
        if (error.code === 'ER_DUP_ENTRY') {
            return NextResponse.json({ success: false, message: "Order Detail ID already exists" }, { status: 409 });
        }
        if (error.code === 'ER_NO_REFERENCED_ROW_2') {
             // Check which foreign key failed
             if (error.message.includes('orderdetail_ibfk_1')) { // Constraint name from SQL
                return NextResponse.json({ success: false, message: "Invalid Invoice ID reference" }, { status: 400 });
             } else if (error.message.includes('orderdetail_ibfk_2')) {
                 return NextResponse.json({ success: false, message: "Invalid Furniture ID reference" }, { status: 400 });
             } else {
                 return NextResponse.json({ success: false, message: "Invalid foreign key reference" }, { status: 400 });
             }
        }
         if (error instanceof SyntaxError) {
            return NextResponse.json({ message: "Invalid JSON format" }, { status: 400 });
         }
        return NextResponse.json({ success: false, message: "Failed to create order detail", error: error.message }, { status: 500 });
    }
}