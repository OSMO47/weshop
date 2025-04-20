"use client";

import React, { useState, useEffect } from "react";
import axios from "axios";
import Swal from "sweetalert2";
import { useRouter } from "next/navigation";
import Link from "next/link";
import LoadingSpinner from "@/components/LoadingSpinner";

export default function LoginPage() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const router = useRouter();

  const styles = {
    pageWrapper: {
      display: "flex",
      justifyContent: "center",
      alignItems: "center",
      minHeight: "100vh",
      width: "100%",
      background: "linear-gradient(135deg, #0078ff 0%, #00c6ff 100%)",
      padding: "20px",
    },
    loginContainer: {
      width: "100%",
      maxWidth: "480px",
      backgroundColor: "#ffffff",
      borderRadius: "24px",
      boxShadow: "0 10px 25px rgba(0, 0, 0, 0.1)",
      padding: "40px",
      textAlign: "center",
    },
    title: {
      fontSize: "28px",
      fontWeight: "700",
      color: "#1e293b",
      marginBottom: "12px",
      letterSpacing: "0.5px",
    },
    subtitle: {
      fontSize: "16px",
      color: "#64748b",
      marginBottom: "32px",
    },
    inputField: {
      width: "100%",
      padding: "16px",
      fontSize: "16px",
      backgroundColor: "#ffffff",
      border: "1px solid #e2e8f0",
      borderRadius: "12px",
      marginBottom: "16px",
      outline: "none",
      transition: "all 0.3s ease",
    },
    loginButton: {
      width: "100%",
      padding: "16px",
      backgroundColor: "#0078ff",
      color: "#ffffff",
      border: "none",
      borderRadius: "12px",
      fontSize: "16px",
      fontWeight: "600",
      cursor: "pointer",
      marginTop: "8px",
      marginBottom: "24px",
      transition: "all 0.3s ease",
      boxShadow: "0 4px 12px rgba(0, 120, 255, 0.2)",
    },
    divider: {
      display: "flex",
      alignItems: "center",
      margin: "20px 0",
    },
    dividerLine: {
      flexGrow: 1,
      height: "1px",
      backgroundColor: "#e2e8f0",
    },
    dividerText: {
      padding: "0 16px",
      color: "#94a3b8",
      fontSize: "14px",
    },
    backButton: {
      display: "inline-block",
      padding: "12px 24px",
      color: "#64748b",
      textDecoration: "none",
      fontSize: "16px",
      transition: "all 0.3s ease",
      borderRadius: "12px",
    },
    footer: {
      fontSize: "14px",
      color: "#94a3b8",
      marginTop: "32px",
    },
    passwordContainer: {
      position: "relative",
      width: "100%",
      marginBottom: "16px",
    },
    passwordToggle: {
      position: "absolute",
      right: "16px",
      top: "50%",
      transform: "translateY(-50%)",
      background: "none",
      border: "none",
      color: "#94a3b8",
      cursor: "pointer",
      fontSize: "16px",
    },
  };

  const handleLogin = async (event) => {
    event.preventDefault();
    if (!username || !password) {
      Swal.fire({
        title: "ข้อมูลไม่ครบ",
        text: "กรุณากรอกชื่อผู้ใช้และรหัสผ่าน",
        icon: "warning",
        confirmButtonColor: "#0078ff",
      });
      return;
    }

    setLoading(true);
    try {
      const response = await axios.post("/api/auth/login", {
        username,
        password,
      });

      if (response.data.success) {
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
        Swal.fire({
          icon: "error",
          title: "เข้าสู่ระบบไม่สำเร็จ",
          text: response.data.message || "ชื่อผู้ใช้หรือรหัสผ่านไม่ถูกต้อง",
          confirmButtonColor: "#0078ff",
        });
      }
    } catch (error) {
      console.error("Login error:", error);
      const errorMessage =
        error.response?.data?.message ||
        "เกิดข้อผิดพลาดในการเชื่อมต่อ กรุณาลองใหม่อีกครั้ง";
      Swal.fire({
        icon: "error",
        title: "เกิดข้อผิดพลาด",
        text: errorMessage,
        confirmButtonColor: "#0078ff",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={styles.pageWrapper}>
      {loading && <LoadingSpinner />}

      <div style={styles.loginContainer}>
        <h1 style={styles.title}>จัดการสินค้าความปลอดภัยสูง</h1>
        <p style={styles.subtitle}>กรุณาเข้าสู่ระบบเพื่อจัดการร้านค้า</p>

        <form onSubmit={handleLogin}>
          <input
            type="text"
            placeholder="ชื่อผู้ใช้"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            required
            autoComplete="username"
            style={styles.inputField}
          />

          <div style={styles.passwordContainer}>
            <input
              type={showPassword ? "text" : "password"}
              placeholder="รหัสผ่าน"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              autoComplete="current-password"
              style={styles.inputField}
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              style={styles.passwordToggle}
            >
              <i
                className={`fas ${showPassword ? "fa-eye-slash" : "fa-eye"}`}
              ></i>
            </button>
          </div>

          <button type="submit" disabled={loading} style={styles.loginButton}>
            {loading ? "กำลังเข้าสู่ระบบ..." : "เข้าสู่ระบบ"}
          </button>
        </form>

        <div style={styles.divider}>
          <div style={styles.dividerLine}></div>
          <span style={styles.dividerText}>หรือ</span>
          <div style={styles.dividerLine}></div>
        </div>

        <Link href="/products" style={styles.backButton}>
          กลับไปยังหน้าร้านค้า
        </Link>

        <div style={styles.footer}>© {new Date().getFullYear()}</div>
      </div>
    </div>
  );
}
