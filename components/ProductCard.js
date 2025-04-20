import React from "react";
import Image from "next/image";

export default function ProductCard({ product, onBuyClick }) {
  const stock = parseInt(product.Stocks || 0);
  const isOutOfStock = stock === 0;
  const price = parseFloat(product.Prices || 0);

  return (
    <div
      style={{
        border: "none",
        borderRadius: "0.5rem",
        boxShadow: "0 .125rem .25rem rgba(0,0,0,.075)",
        height: "100%",
        display: "flex",
        flexDirection: "column",
        backgroundColor: "#fff",
        overflow: "hidden",
      }}
    >
      <div style={{ position: "relative", height: "200px" }}>
        {stock > 0 ? (
          <span
            style={{
              position: "absolute",
              top: "0.5rem",
              right: "0.5rem",
              backgroundColor: "#198754",
              color: "#fff",
              padding: "0.25rem 0.5rem",
              borderRadius: "0.375rem",
              fontSize: "0.75rem",
              zIndex: 1,
            }}
          >
            <i
              className="fas fa-check-circle"
              style={{ marginRight: "0.25rem" }}
            ></i>
            พร้อมจำหน่าย
          </span>
        ) : (
          <span
            style={{
              position: "absolute",
              top: "0.5rem",
              right: "0.5rem",
              backgroundColor: "#dc3545",
              color: "#fff",
              padding: "0.25rem 0.5rem",
              borderRadius: "0.375rem",
              fontSize: "0.75rem",
              zIndex: 1,
            }}
          >
            <i
              className="fas fa-times-circle"
              style={{ marginRight: "0.25rem" }}
            ></i>
            สินค้าหมด
          </span>
        )}
        <Image
          src={product.image_url || "/placeholder.jpg"}
          alt={product.Fur_name}
          fill
          style={{
            objectFit: "cover",
          }}
          sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
          onError={(e) => {
            e.target.src = "/placeholder.jpg";
          }}
        />
      </div>
      <div
        style={{
          padding: "1rem",
          display: "flex",
          flexDirection: "column",
          flexGrow: 1,
        }}
      >
        <h5
          style={{
            fontSize: "1rem",
            fontWeight: "bold",
            marginBottom: "0.25rem",
            whiteSpace: "nowrap",
            overflow: "hidden",
            textOverflow: "ellipsis",
          }}
        >
          {product.Fur_name}
        </h5>
        <div
          style={{
            fontSize: "0.875rem",
            color: "#6c757d",
            marginBottom: "0.5rem",
          }}
        >
          <span style={{ marginRight: "0.75rem" }}>
            <i className="fas fa-tag" style={{ marginRight: "0.25rem" }}></i>
            {product.typename || "N/A"}
          </span>
          <span>
            <i className="fas fa-cube" style={{ marginRight: "0.25rem" }}></i>
            {product.matname || "N/A"}
          </span>
        </div>
        <div style={{ marginTop: "auto" }}>
          <p
            style={{
              fontSize: "1.25rem",
              fontWeight: "bold",
              color: "#198754",
              marginBottom: "0.5rem",
            }}
          >
            ฿{price.toLocaleString("th-TH", { minimumFractionDigits: 2 })}
          </p>
          <button
            onClick={() => !isOutOfStock && onBuyClick(product)}
            disabled={isOutOfStock}
            style={{
              width: "100%",
              fontSize: "0.875rem",
              backgroundColor: isOutOfStock ? "#6c757d" : "#0d6efd",
              color: "#fff",
              border: "none",
              padding: "0.5rem",
              borderRadius: "0.375rem",
              cursor: isOutOfStock ? "not-allowed" : "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: "0.5rem",
            }}
          >
            <i
              className={`fas ${
                isOutOfStock ? "fa-times" : "fa-shopping-cart"
              }`}
            ></i>
            {isOutOfStock ? "สินค้าหมด" : "สั่งซื้อ"}
          </button>
        </div>
      </div>
    </div>
  );
}
