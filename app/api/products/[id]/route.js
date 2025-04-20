import { NextResponse } from "next/server";
import { promisePool as pool } from "@/lib/db";
import { unlink } from "fs/promises";
import path from "path";

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

export async function GET(request, { params }) {
  const { id } = params;
  if (!id) {
    return NextResponse.json(
      { message: "Product ID is required" },
      { status: 400 }
    );
  }

  try {
    const sql = `
            SELECT f.*, t.typename, m.matname
            FROM furniture f
            LEFT JOIN furtype t ON f.type_id = t.id
            LEFT JOIN materials m ON f.material_id = m.id
            WHERE f.Fur_ID = ?
        `;
    const [product] = await queryDB(sql, [id]);

    if (!product) {
      return NextResponse.json(
        { message: "Product not found" },
        { status: 404 }
      );
    }
    return NextResponse.json(product);
  } catch (error) {
    console.error(`API GET /api/products/${id} Error:`, error);
    return NextResponse.json(
      { message: "Failed to fetch product", error: error.message },
      { status: 500 }
    );
  }
}

export async function PUT(request, { params }) {
  const { id } = params;
  if (!id) {
    return NextResponse.json(
      { message: "Product ID is required" },
      { status: 400 }
    );
  }

  try {
    const body = await request.json();
    let newStock;
    let stockChange;

    if (body.hasOwnProperty("Stocks")) {
      newStock = parseInt(body.Stocks);
      if (isNaN(newStock) || newStock < 0) {
        return NextResponse.json(
          { success: false, message: "Invalid stock value provided" },
          { status: 400 }
        );
      }
    } else if (body.hasOwnProperty("stockChange")) {
      stockChange = parseInt(body.stockChange);
      if (isNaN(stockChange)) {
        return NextResponse.json(
          { success: false, message: "Invalid stock change value" },
          { status: 400 }
        );
      }
    } else {
      return NextResponse.json(
        {
          success: false,
          message: "Missing 'Stocks' or 'stockChange' in request body",
        },
        { status: 400 }
      );
    }

    const connection = await pool.getConnection();
    try {
      await connection.beginTransaction();

      const [productCheck] = await connection.execute(
        "SELECT Stocks FROM furniture WHERE Fur_ID = ? FOR UPDATE",
        [id]
      );
      if (productCheck.length === 0) {
        await connection.rollback();
        return NextResponse.json(
          { success: false, message: "Product not found" },
          { status: 404 }
        );
      }

      let sql = "";
      let queryParams = [];

      if (stockChange !== undefined) {
        const currentStock = parseInt(productCheck[0].Stocks);
        if (currentStock + stockChange < 0) {
          await connection.rollback();
          return NextResponse.json(
            {
              success: false,
              message: "Insufficient stock for the requested change",
            },
            { status: 400 }
          );
        }
        sql = "UPDATE furniture SET Stocks = Stocks + ? WHERE Fur_ID = ?";
        queryParams = [stockChange, id];
      } else {
        sql = "UPDATE furniture SET Stocks = ? WHERE Fur_ID = ?";
        queryParams = [newStock, id];
      }

      const [updateResult] = await connection.execute(sql, queryParams);

      if (updateResult.affectedRows === 0) {
        await connection.rollback();
        return NextResponse.json(
          { success: false, message: "Product not found or no changes made" },
          { status: 404 }
        );
      }

      await connection.commit();
      return NextResponse.json({
        success: true,
        message: "Stock updated successfully",
      });
    } catch (dbError) {
      await connection.rollback();
      console.error(`API PUT /api/products/${id} DB Error:`, dbError);
      return NextResponse.json(
        {
          success: false,
          message: "Failed to update product stock",
          error: dbError.message,
        },
        { status: 500 }
      );
    } finally {
      connection.release();
    }
  } catch (error) {
    console.error(`API PUT /api/products/${id} Error:`, error);
    if (error instanceof SyntaxError) {
      return NextResponse.json(
        { message: "Invalid JSON format in request body" },
        { status: 400 }
      );
    }
    return NextResponse.json(
      { message: "Failed to process request", error: error.message },
      { status: 500 }
    );
  }
}

export async function DELETE(request, { params }) {
  const { id } = params;
  if (!id) {
    return NextResponse.json(
      { message: "Product ID is required" },
      { status: 400 }
    );
  }

  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();

    const [product] = await connection.execute(
      "SELECT image_url FROM furniture WHERE Fur_ID = ?",
      [id]
    );

    if (product.length === 0) {
      await connection.rollback();
      return NextResponse.json(
        { success: false, message: "Product not found" },
        { status: 404 }
      );
    }

    const imageUrl = product[0].image_url;

    const [deleteResult] = await connection.execute(
      "DELETE FROM furniture WHERE Fur_ID = ?",
      [id]
    );

    if (deleteResult.affectedRows === 0) {
      await connection.rollback();
      return NextResponse.json(
        { success: false, message: "Product not found during delete attempt" },
        { status: 404 }
      );
    }

    if (imageUrl) {
      try {
        const imagePath = path.join(process.cwd(), "public", imageUrl);
        await unlink(imagePath);
        console.log(`Deleted image file: ${imagePath}`);
      } catch (fileError) {
        console.error(
          `Failed to delete image file ${imageUrl}:`,
          fileError.message
        );
      }
    }

    await connection.commit();
    return NextResponse.json({
      success: true,
      message: "Product deleted successfully",
    });
  } catch (dbError) {
    await connection.rollback();
    console.error(`API DELETE /api/products/${id} DB Error:`, dbError);
    if (
      dbError.code === "ER_ROW_IS_REFERENCED_2" ||
      dbError.message.includes("foreign key constraint")
    ) {
      return NextResponse.json(
        {
          success: false,
          message:
            "ไม่สามารถลบสินค้าได้ เนื่องจากมีการอ้างอิงในรายการขาย (Cannot delete product due to existing order references)",
          error: dbError.code,
        },
        { status: 409 }
      );
    }
    return NextResponse.json(
      {
        success: false,
        message: "Failed to delete product",
        error: dbError.message,
      },
      { status: 500 }
    );
  } finally {
    connection.release();
  }
}
