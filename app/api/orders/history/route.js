import { NextResponse } from 'next/server';
import { promisePool as pool } from '@/lib/db';

export async function GET(request) {
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
        const orders = await pool.query(sql);
        return NextResponse.json(orders[0]);
    } catch (error) {
        console.error("API GET /api/orders/history Error:", error);
        return NextResponse.json({ message: "Failed to fetch order history", error: error.message }, { status: 500 });
    }
}