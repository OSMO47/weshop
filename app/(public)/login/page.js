// app/(public)/login/page.js
"use client";

import React, { useState } from "react";
import axios from "axios";
import Swal from "sweetalert2";
import { useRouter } from "next/navigation"; // ใช้สำหรับ redirect
import Link from "next/link";
import LoadingSpinner from "@/components/LoadingSpinner"; // Import LoadingSpinner

export default function LoginPage() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const router = useRouter();

  const handleLogin = async (event) => {
    event.preventDefault();
    if (!username || !password) {
      Swal.fire("ข้อมูลไม่ครบ", "กรุณากรอกชื่อผู้ใช้และรหัสผ่าน", "warning");
      return;
    }

    setLoading(true);
    try {
      const response = await axios.post("/api/auth/login", {
        // เรียก API Login ของ Next.js
        username,
        password,
      });

      if (response.data.success) {
        // --- FIXME: Implement Secure Session/Token Handling ---
        // ตัวอย่าง: เก็บ token ใน localStorage (ไม่แนะนำสำหรับข้อมูล sensitive)
        // หรือใช้ HttpOnly cookie ที่ตั้งค่าจาก Server (ปลอดภัยกว่า)
        // localStorage.setItem('authToken', response.data.token); // ตัวอย่างที่ไม่ปลอดภัย
        // ----------------------------------------------------

        await Swal.fire({
          icon: "success",
          title: "เข้าสู่ระบบสำเร็จ",
          text: "กำลังนำท่านไปยังหน้าจัดการ...",
          timer: 1500,
          showConfirmButton: false,
          timerProgressBar: true,
        });
        router.push("/stock");
      } else {
        // ใช้ message จาก API ถ้ามี, หรือ default message
        Swal.fire(
          "เข้าสู่ระบบไม่สำเร็จ",
          response.data.message || "ชื่อผู้ใช้หรือรหัสผ่านไม่ถูกต้อง",
          "error"
        );
      }
    } catch (error) {
      console.error("Login error:", error);
      const errorMessage =
        error.response?.data?.message ||
        "เกิดข้อผิดพลาดในการเชื่อมต่อ กรุณาลองใหม่อีกครั้ง";
      Swal.fire("เกิดข้อผิดพลาด", errorMessage, "error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="d-flex align-items-center justify-content-center min-vh-100"
      style={{
        background: "linear-gradient(135deg, #0061ff 0%, #60efff 100%)",
      }}
    >
      {loading && <LoadingSpinner />}
      <div
        className="login-container bg-white p-4 p-md-5 rounded-3 shadow-lg"
        style={{ maxWidth: "400px", width: "90%" }}
      >
        <div className="text-center mb-4">
          <i className="fas fa-home fa-3x text-primary mb-3"></i>
          <h1 className="h3 mb-2 fw-normal">OF Furniture</h1>
          <p className="text-muted small">กรุณาเข้าสู่ระบบเพื่อจัดการร้านค้า</p>
        </div>

        <form onSubmit={handleLogin}>
          <div className="form-floating mb-3">
            <input
              type="text"
              className="form-control"
              id="username"
              placeholder="ชื่อผู้ใช้"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
              autoComplete="username"
            />
            <label htmlFor="username">
              <i className="fas fa-user me-2"></i>ชื่อผู้ใช้
            </label>
          </div>

          <div className="form-floating mb-3">
            <input
              type={showPassword ? "text" : "password"}
              className="form-control"
              id="password"
              placeholder="รหัสผ่าน"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              autoComplete="current-password"
            />
            <label htmlFor="password">
              <i className="fas fa-lock me-2"></i>รหัสผ่าน
            </label>
            <span
              className="position-absolute end-0 top-50 translate-middle-y pe-3"
              onClick={() => setShowPassword(!showPassword)}
              style={{ cursor: "pointer" }}
            >
              <i
                className={`fas ${
                  showPassword ? "fa-eye-slash" : "fa-eye"
                } text-secondary`}
              ></i>
            </span>
          </div>

          <button
            type="submit"
            className="w-100 btn btn-lg btn-primary"
            disabled={loading}
          >
            <i
              className={`fas ${
                loading ? "fa-spinner fa-spin" : "fa-sign-in-alt"
              } me-2`}
            ></i>
            {loading ? "กำลังเข้าสู่ระบบ..." : "เข้าสู่ระบบ"}
          </button>
        </form>

        <div className="d-flex align-items-center my-3">
          <hr className="flex-grow-1" />
          <span className="px-2 text-muted small">หรือ</span>
          <hr className="flex-grow-1" />
        </div>

        <Link href="/" className="btn btn-outline-secondary w-100">
          <i className="fas fa-arrow-left me-2"></i>กลับไปยังหน้าร้านค้า
        </Link>
      </div>
    </div>
  );
}
