// app/api/orders/route.js
import { NextResponse } from 'next/server';
import pool from '@/lib/db';

// POST: สร้างข้อมูล Order หลัก
export async function POST(request) {
     // ไม่จำเป็นต้องมี Auth เพราะสร้างตอนลูกค้าสั่งซื้อ
     // FIXME: แต่ควรมี Rate Limiting หรือ Captcha เพื่อป้องกันการ Spam
    try {
        const { InvoiceID, CustID, TotalPrice, deliveryMethod, orderDate } = await request.json();

        if (!InvoiceID || !CustID || TotalPrice === undefined || !deliveryMethod || !orderDate) {
            return NextResponse.json({ success: false, message: "Missing required order data" }, { status: 400 });
        }
         // Validate deliveryMethod
        if (!['pickup', 'delivery'].includes(deliveryMethod)) {
             return NextResponse.json({ success: false, message: "Invalid delivery method" }, { status: 400 });
        }
         // Validate TotalPrice
        if (isNaN(parseFloat(TotalPrice)) || parseFloat(TotalPrice) < 0) {
            return NextResponse.json({ success: false, message: "Invalid total price" }, { status: 400 });
        }
         // Validate orderDate (simple check)
         if (!/^\d{4}-\d{2}-\d{2}$/.test(orderDate)) {
              return NextResponse.json({ success: false, message: "Invalid order date format (YYYY-MM-DD required)" }, { status: 400 });
         }


        const sql = "INSERT INTO orders (InvoiceID, CustID, TotalPrice, deliveryMethod, orderDate) VALUES (?, ?, ?, ?, ?)";
        const [result] = await pool.execute(sql, [InvoiceID, CustID, TotalPrice, deliveryMethod, orderDate]);

        if (result.affectedRows > 0) {
             return NextResponse.json({ success: true, message: "Order created successfully", invoiceId: InvoiceID }, { status: 201 });
        } else {
             return NextResponse.json({ success: false, message: "Failed to create order, no rows affected" }, { status: 500 });
        }

    } catch (error) {
        console.error("API POST /api/orders Error:", error);
        if (error.code === 'ER_DUP_ENTRY') {
            return NextResponse.json({ success: false, message: "Invoice ID already exists" }, { status: 409 });
        }
        if (error.code === 'ER_NO_REFERENCED_ROW_2') {
             return NextResponse.json({ success: false, message: "Invalid Customer ID reference" }, { status: 400 });
        }
         if (error instanceof SyntaxError) {
            return NextResponse.json({ message: "Invalid JSON format" }, { status: 400 });
         }
        return NextResponse.json({ success: false, message: "Failed to create order", error: error.message }, { status: 500 });
    }
}