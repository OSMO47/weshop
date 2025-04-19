// app/api/orders/history/details/route.js
import { NextResponse } from 'next/server';
import pool from '@/lib/db';

// GET: ดึงข้อมูล Order Detail ทั้งหมด พร้อมข้อมูลสินค้า
export async function GET(request) {
    // FIXME: Add Authentication Check (Admin Only)
    // FIXME: This might be inefficient for large datasets. Consider fetching details per order.
    try {
        const sql = `
            SELECT
                od.OrderDetailID,
                od.InvoiceID,
                od.Fur_ID,
                od.Qty,
                od.Price,
                od.note,
                f.Fur_name,
                f.image_url,
                t.typename,
                m.matname
            FROM orderdetail od
            LEFT JOIN furniture f ON od.Fur_ID = f.Fur_ID
            LEFT JOIN furtype t ON f.type_id = t.id
            LEFT JOIN materials m ON f.material_id = m.id
            ORDER BY od.InvoiceID, od.OrderDetailID
        `;
        const details = await pool.query(sql);
        return NextResponse.json(details[0]);
    } catch (error) {
        console.error("API GET /api/orders/history/details Error:", error);
        return NextResponse.json({ message: "Failed to fetch order details history", error: error.message }, { status: 500 });
    }
}