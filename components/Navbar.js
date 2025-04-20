"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export default function Navbar() {
  const pathname = usePathname();

  return (
    <nav
      style={{
        backgroundColor: "white",
        boxShadow: "0 0.125rem 0.25rem rgba(0, 0, 0, 0.075)",
        position: "sticky",
        top: 0,
        zIndex: 1020,
      }}
    >
      <div
        style={{
          maxWidth: "1140px",
          margin: "0 auto",
          padding: "0.5rem 1rem",
          display: "flex",
          flexWrap: "wrap",
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        <Link
          href="/products"
          style={{
            fontWeight: "bold",
            fontSize: "1.5rem",
            textDecoration: "none",
            color: "black",
            display: "flex",
            alignItems: "center",
          }}
        >
          <i
            className="fas fa-couch"
            style={{ marginRight: "0.5rem", color: "#0d6efd" }}
          ></i>
          ร้านน้องเฟรน
        </Link>

        <button
          type="button"
          data-bs-toggle="collapse"
          data-bs-target="#publicNavbarNav"
          style={{
            backgroundColor: "transparent",
            border: "1px solid rgba(0,0,0,.1)",
            padding: "0.25rem 0.75rem",
            fontSize: "1.25rem",
            borderRadius: "0.25rem",
            display: "none", // ซ่อนไว้หากไม่ทำ responsive จริง
          }}
        >
          <span className="navbar-toggler-icon"></span>
        </button>

        <div
          id="publicNavbarNav"
          style={{
            display: "flex",
            flexDirection: "row",
            alignItems: "center",
            marginLeft: "auto",
            gap: "1rem",
          }}
        >
          <Link
            href="/products"
            style={{
              textDecoration: "none",
              color:
                pathname === "/" || pathname === "/products"
                  ? "#0d6efd"
                  : "#000",
              fontWeight:
                pathname === "/" || pathname === "/products"
                  ? "bold"
                  : "normal",
              display: "flex",
              alignItems: "center",
            }}
          >
            <i
              className="fas fa-shopping-bag"
              style={{ marginRight: "0.25rem" }}
            ></i>
            สินค้า
          </Link>

          <a
            href="/#contact"
            style={{
              textDecoration: "none",
              color: "#000",
              display: "flex",
              alignItems: "center",
            }}
          ></a>

          <Link
            href="/login"
            style={{
              textDecoration: "none",
              color: pathname === "/login" ? "#0d6efd" : "#000",
              fontWeight: pathname === "/login" ? "bold" : "normal",
              display: "flex",
              alignItems: "center",
            }}
          >
            <i
              className="fas fa-sign-in-alt"
              style={{ marginRight: "0.25rem" }}
            ></i>
            เข้าสู่ระบบ
          </Link>
        </div>
      </div>
    </nav>
  );
}
