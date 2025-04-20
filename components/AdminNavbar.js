"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import Swal from "sweetalert2";

export default function AdminNavbar() {
  const pathname = usePathname();
  const router = useRouter();

  const handleLogout = () => {
    Swal.fire({
      title: "ออกจากระบบ",
      text: "คุณต้องการออกจากระบบใช่หรือไม่?",
      icon: "question",
      showCancelButton: true,
      confirmButtonText: "ใช่, ออกจากระบบ",
      cancelButtonText: "ยกเลิก",
    }).then((result) => {
      if (result.isConfirmed) {
        console.log("Logging out...");
        router.push("/login");
      }
    });
  };

  return (
    <nav
      style={{
        backgroundColor: "#212529",
        color: "#fff",
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
          href="/stock"
          style={{
            fontWeight: "bold",
            fontSize: "1.25rem",
            textDecoration: "none",
            color: "#fff",
            display: "flex",
            alignItems: "center",
          }}
        >
          <i
            className="fas fa-user-shield"
            style={{ marginRight: "0.5rem" }}
          ></i>
          Admin Panel
        </Link>

        <button
          type="button"
          data-bs-toggle="collapse"
          data-bs-target="#adminNavbarNav"
          style={{
            backgroundColor: "transparent",
            border: "1px solid rgba(255,255,255,.2)",
            padding: "0.25rem 0.75rem",
            fontSize: "1.25rem",
            borderRadius: "0.25rem",
            display: "none", 
          }}
        >
          <span className="navbar-toggler-icon"></span>
        </button>

        <div
          id="adminNavbarNav"
          style={{
            display: "flex",
            flexWrap: "wrap",
            alignItems: "center",
            justifyContent: "space-between",
            width: "100%",
            marginTop: "0.5rem",
          }}
        >
          <ul
            style={{
              listStyle: "none",
              display: "flex",
              paddingLeft: 0,
              margin: 0,
              marginRight: "auto",
              gap: "1rem",
            }}
          >
            <li>
              <Link
                href="/stock"
                style={{
                  textDecoration: "none",
                  color: pathname === "/stock" ? "#0d6efd" : "#fff",
                  fontWeight: pathname === "/stock" ? "bold" : "normal",
                  display: "flex",
                  alignItems: "center",
                }}
              >
                <i
                  className="fas fa-boxes"
                  style={{ marginRight: "0.25rem" }}
                ></i>
                สต็อกสินค้า
              </Link>
            </li>
            <li>
              <Link
                href="/stock/add"
                style={{
                  textDecoration: "none",
                  color: pathname === "/stock/add" ? "#0d6efd" : "#fff",
                  fontWeight: pathname === "/stock/add" ? "bold" : "normal",
                  display: "flex",
                  alignItems: "center",
                }}
              >
                <i
                  className="fas fa-plus-circle"
                  style={{ marginRight: "0.25rem" }}
                ></i>
                เพิ่มสินค้า
              </Link>
            </li>
            <li>
              <Link
                href="/sales-history"
                style={{
                  textDecoration: "none",
                  color: pathname === "/sales-history" ? "#0d6efd" : "#fff",
                  fontWeight: pathname === "/sales-history" ? "bold" : "normal",
                  display: "flex",
                  alignItems: "center",
                }}
              >
                <i
                  className="fas fa-history"
                  style={{ marginRight: "0.25rem" }}
                ></i>
                ประวัติการขาย
              </Link>
            </li>
            <li>
              <Link
                href="/products"
                target="_blank"
                style={{
                  textDecoration: "none",
                  color: "#fff",
                  display: "flex",
                  alignItems: "center",
                }}
              >
                <i
                  className="fas fa-store"
                  style={{ marginRight: "0.25rem" }}
                ></i>
                ดูหน้าร้าน
              </Link>
            </li>
          </ul>

          <ul
            style={{
              listStyle: "none",
              display: "flex",
              paddingLeft: 0,
              margin: 0,
              gap: "1rem",
            }}
          >
            <li>
              <button
                onClick={handleLogout}
                style={{
                  backgroundColor: "transparent",
                  border: "1px solid #dc3545",
                  color: "#dc3545",
                  padding: "0.375rem 0.75rem",
                  borderRadius: "0.25rem",
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                }}
              >
                <i
                  className="fas fa-sign-out-alt"
                  style={{ marginRight: "0.25rem" }}
                ></i>
                ออกจากระบบ
              </button>
            </li>
          </ul>
        </div>
      </div>
    </nav>
  );
}
