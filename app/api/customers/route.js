import { NextResponse } from "next/server";
import { promisePool as pool } from "@/lib/db";

export async function POST(request) {
  try {
    const { CustID, CustName, Phone, Address } = await request.json();

    if (!CustID || !CustName || !Phone) {
      return NextResponse.json(
        {
          success: false,
          message: "Missing required customer data (CustID, CustName, Phone)",
        },
        { status: 400 }
      );
    }

    if (!/^[0-9]{9,10}$/.test(Phone)) {
      return NextResponse.json(
        { success: false, message: "Invalid phone number format" },
        { status: 400 }
      );
    }

    const sql =
      "INSERT INTO customer (CustID, CustName, Phone, Address) VALUES (?, ?, ?, ?)";
    const [result] = await pool.execute(sql, [
      CustID,
      CustName,
      Phone,
      Address || null,
    ]);

    if (result.affectedRows > 0) {
      return NextResponse.json(
        {
          success: true,
          message: "Customer created successfully",
          customerId: CustID,
        },
        { status: 201 }
      );
    } else {
      return NextResponse.json(
        {
          success: false,
          message: "Failed to create customer, no rows affected",
        },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error("API POST /api/customers Error:", error);
    if (error.code === "ER_DUP_ENTRY") {
      return NextResponse.json(
        { success: false, message: "Customer ID already exists" },
        { status: 409 }
      ); 
    }
    if (error instanceof SyntaxError) {
      return NextResponse.json(
        { message: "Invalid JSON format" },
        { status: 400 }
      );
    }
    return NextResponse.json(
      {
        success: false,
        message: "Failed to create customer",
        error: error.message,
      },
      { status: 500 }
    );
  }
}
