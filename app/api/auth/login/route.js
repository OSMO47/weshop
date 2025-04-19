// app/api/auth/login/route.js
import { NextResponse } from 'next/server';
import pool from '@/lib/db';
// import { sign } from 'jsonwebtoken'; // Example if using JWT
// import { cookies } from 'next/headers'; // Example if using HttpOnly cookies

export async function POST(request) {
    try {
        const { username, password } = await request.json();

        if (!username || !password) {
            return NextResponse.json({ success: false, message: "Username and password are required" }, { status: 400 });
        }

        // --- WARNING: Storing plain text passwords is insecure! ---
        // In a real application, hash passwords during registration and compare hashes here.
        // Example using plain text as per original DB:
        const sql = "SELECT UserID FROM users WHERE UserID = ? AND Passwords = ?";
        const [users] = await pool.execute(sql, [username, password]);

        if (users.length > 0) {
            // Login successful
            // --- FIXME: Implement Secure Session/Token Generation ---
            // Option 1: JWT (Send token back to client)
            // const secret = process.env.JWT_SECRET;
            // const token = sign({ userId: users[0].UserID, /* other claims */ }, secret, { expiresIn: '1h' });
            // return NextResponse.json({ success: true, message: "Login successful", token });

            // Option 2: Server-side Session with HttpOnly Cookie (More Secure)
            // const sessionId = generateSecureSessionId();
            // await storeSessionInDbOrCache(sessionId, { userId: users[0].UserID });
            // cookies().set('session_id', sessionId, { httpOnly: true, secure: process.env.NODE_ENV === 'production', path: '/', maxAge: 3600 });
            // return NextResponse.json({ success: true, message: "Login successful" });
            // --------------------------------------------------------

            // Simple success response for now (Insecure - only for structure demo)
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