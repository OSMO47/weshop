import { NextResponse } from 'next/server';
import { promisePool as pool } from '@/lib/db';

export async function POST(request) {
    try {
        const { username, password } = await request.json();

        if (!username || !password) {
            return NextResponse.json({ success: false, message: "Username and password are required" }, { status: 400 });
        }

        const sql = "SELECT UserID FROM users WHERE UserID = ? AND Passwords = ?";
        const [users] = await pool.execute(sql, [username, password]);

        if (users.length > 0) {
             return NextResponse.json({ success: true, message: "Login successful (INSECURE - Placeholder!)" });

        } else {
            // Invalid credentials
            return NextResponse.json({ success: false, message: "Invalid username or password" }, { status: 401 }); // Unauthorized
        }

    } catch (error) {
        console.error("API POST /api/auth/login Error:", error);
         if (error instanceof SyntaxError) {
            return NextResponse.json({ message: "Invalid JSON format" }, { status: 400 });
         }
        return NextResponse.json({ success: false, message: "Login failed due to server error", error: error.message }, { status: 500 });
    }
}