// app/api/orders/history/route.js
import { NextResponse } from 'next/server';
import pool from '@/lib/db';

// GET: ดึงข้อมูล Order ทั้งหมด พร้อมข้อมูลลูกค้า
export async function GET(request) {
    // FIXME: Add Authentication Check (Admin Only)
    try {
        const sql = `
            SELECT
                o.InvoiceID,
                o.CustID,
                o.TotalPrice,
                o.deliveryMethod,
                o.orderDate,
                c.CustName,
                c.Phone,
                c.Address
            FROM orders o
            LEFT JOIN customer c ON o.CustID = c.CustID
            ORDER BY o.orderDate DESC, o.InvoiceID DESC
        `;
        const orders = await pool.query(sql); // Use query for simpler SELECT
        // pool.query returns [rows, fields], we only need rows ([0])
        return NextResponse.json(orders[0]);
    } catch (error) {
        console.error("API GET /api/orders/history Error:", error);
        return NextResponse.json({ message: "Failed to fetch order history", error: error.message }, { status: 500 });
    }
}