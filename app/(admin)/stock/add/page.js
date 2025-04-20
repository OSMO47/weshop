"use client";

import React, { useState, useEffect, useCallback } from "react";
import axios from "axios";
import Swal from "sweetalert2";
import { useRouter } from "next/navigation";
import LoadingSpinner from "@/components/LoadingSpinner";
import ImageUpload from "@/components/ImageUpload";

export default function AddProductPage() {
  const [productName, setProductName] = useState("");
  const [productType, setProductType] = useState("");
  const [productMaterial, setProductMaterial] = useState("");
  const [productStock, setProductStock] = useState(0);
  const [productPrice, setProductPrice] = useState(0);
  const [productImage, setProductImage] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [types, setTypes] = useState([]);
  const [materials, setMaterials] = useState([]);
  const [loading, setLoading] = useState(false);
  const [productId, setProductId] = useState("");
  const router = useRouter();

  const loadInitialData = useCallback(async () => {
    setLoading(true);
    try {
      const [typesRes, materialsRes, productsRes] = await Promise.all([
        axios.get("/api/types"),
        axios.get("/api/materials"),
        axios.get("/api/products"),
      ]);

      setTypes(typesRes.data);
      setMaterials(materialsRes.data);

      let maxIdNum = 0;
      if (productsRes.data.length > 0) {
        const ids = productsRes.data
          .map((p) => parseInt(p.Fur_ID.replace("F", ""), 10))
          .filter((n) => !isNaN(n));
        if (ids.length > 0) {
          maxIdNum = Math.max(...ids);
        }
      }
      setProductId(`F${String(maxIdNum + 1).padStart(3, "0")}`);
    } catch (error) {
      console.error("Error loading initial data:", error);
      Swal.fire("Error", "ไม่สามารถโหลดข้อมูลสำหรับฟอร์มได้", "error");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadInitialData();
  }, [loadInitialData]);

  const handleImageChange = (file) => {
    if (file) {
      if (!file.type.startsWith("image/")) {
        Swal.fire("ผิดพลาด", "กรุณาเลือกไฟล์รูปภาพเท่านั้น", "error");
        return;
      }
      if (file.size > 5 * 1024 * 1024) {
        Swal.fire("ผิดพลาด", "ขนาดไฟล์ต้องไม่เกิน 5MB", "error");
        return;
      }

      setProductImage(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result);
      };
      reader.readAsDataURL(file);
    } else {
      setProductImage(null);
      setImagePreview(null);
    }
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!productImage) {
      Swal.fire("Error", "กรุณาเลือกรูปภาพสินค้า", "warning");
      return;
    }
    if (!productType || !productMaterial) {
      Swal.fire("Error", "กรุณาเลือกประเภทและวัสดุ", "warning");
      return;
    }
    if (productStock < 0 || productPrice <= 0) {
      Swal.fire("Error", "จำนวนสต็อกและราคาต้องเป็นค่าที่ถูกต้อง", "warning");
      return;
    }

    setLoading(true);
    const formData = new FormData();
    formData.append("image", productImage);
    formData.append("Fur_ID", productId);
    formData.append("Fur_name", productName);
    formData.append("Types", productType);
    formData.append("Materials", productMaterial);
    formData.append("Stocks", productStock);
    formData.append("Price", productPrice);

    try {
      const response = await axios.post("/api/products", formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });

      if (response.data.success) {
        await Swal.fire({
          icon: "success",
          title: "เพิ่มสินค้าสำเร็จ!",
          text: `สินค้า ${response.data.productId} ถูกเพิ่มในระบบแล้ว`,
          timer: 2000,
          showConfirmButton: false,
        });
        router.push("/stock");
      } else {
        Swal.fire(
          "ผิดพลาด",
          response.data.message || "ไม่สามารถเพิ่มสินค้าได้",
          "error"
        );
      }
    } catch (error) {
      console.error("Error adding product:", error);
      Swal.fire(
        "ผิดพลาด",
        error.response?.data?.message || "เกิดข้อผิดพลาดในการเชื่อมต่อ",
        "error"
      );
    } finally {
      setLoading(false);
    }
  };

  const styles = {
    container: {
      maxWidth: "1140px",
      margin: "1.5rem auto 3rem auto",
      padding: "0 15px",
    },
    row: {
      display: "flex",
      flexWrap: "wrap",
      justifyContent: "center",
      margin: "0 -15px",
    },
    col: {
      flex: "0 0 auto",
      width: "66.666667%",
      padding: "0 15px",
    },
    card: {
      position: "relative",
      display: "flex",
      flexDirection: "column",
      minWidth: "0",
      wordWrap: "break-word",
      backgroundColor: "#fff",
      backgroundClip: "border-box",
      border: "1px solid rgba(0, 0, 0, 0.125)",
      borderRadius: "0.25rem",
      boxShadow: "0 .125rem .25rem rgba(0, 0, 0, .075)",
    },
    cardHeader: {
      padding: "0.75rem 1.25rem",
      backgroundColor: "#0d6efd",
      color: "#fff",
      borderBottom: "1px solid rgba(0, 0, 0, 0.125)",
      borderTopLeftRadius: "calc(0.25rem - 1px)",
      borderTopRightRadius: "calc(0.25rem - 1px)",
    },
    cardTitle: {
      margin: "0",
      fontSize: "1.25rem",
      fontWeight: "500",
    },
    cardBody: {
      padding: "1.25rem",
    },
    formRow: {
      display: "flex",
      flexWrap: "wrap",
      margin: "0 -15px 1rem -15px",
      gap: "1rem",
    },
    formCol: {
      flex: "1 0 0%",
      padding: "0 15px",
      minWidth: "250px",
    },
    formLabel: {
      display: "block",
      marginBottom: "0.5rem",
      fontSize: "1rem",
      fontWeight: "400",
    },
    formControl: {
      display: "block",
      width: "100%",
      padding: "0.375rem 0.75rem",
      fontSize: "1rem",
      lineHeight: "1.5",
      color: "#212529",
      backgroundColor: "#fff",
      backgroundClip: "padding-box",
      border: "1px solid #ced4da",
      borderRadius: "0.25rem",
      transition: "border-color .15s ease-in-out,box-shadow .15s ease-in-out",
    },
    formSelect: {
      display: "block",
      width: "100%",
      padding: "0.375rem 2.25rem 0.375rem 0.75rem",
      fontSize: "1rem",
      lineHeight: "1.5",
      color: "#212529",
      backgroundColor: "#fff",
      backgroundImage: `url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 16 16'%3e%3cpath fill='none' stroke='%23343a40' stroke-linecap='round' stroke-linejoin='round' stroke-width='2' d='M2 5l6 6 6-6'/%3e%3c/svg%3e")`,
      backgroundRepeat: "no-repeat",
      backgroundPosition: "right 0.75rem center",
      backgroundSize: "16px 12px",
      border: "1px solid #ced4da",
      borderRadius: "0.25rem",
      appearance: "none",
    },
    requiredMark: {
      color: "#dc3545",
    },
    btnContainer: {
      display: "flex",
      justifyContent: "flex-end",
      marginTop: "1.5rem",
      gap: "0.5rem",
    },
    btnSecondary: {
      color: "#fff",
      backgroundColor: "#6c757d",
      borderColor: "#6c757d",
      padding: "0.375rem 0.75rem",
      fontSize: "1rem",
      lineHeight: "1.5",
      borderRadius: "0.25rem",
      cursor: "pointer",
      textAlign: "center",
      textDecoration: "none",
      border: "1px solid transparent",
    },
    btnPrimary: {
      color: "#fff",
      backgroundColor: "#0d6efd",
      borderColor: "#0d6efd",
      padding: "0.375rem 0.75rem",
      fontSize: "1rem",
      lineHeight: "1.5",
      borderRadius: "0.25rem",
      cursor: "pointer",
      textAlign: "center",
      textDecoration: "none",
      border: "1px solid transparent",
    },
    icon: {
      marginRight: "0.25rem",
    },
    inputControlDisabled: {
      backgroundColor: "#e9ecef",
      opacity: "1",
    },
  };

  return (
    <div style={styles.container}>
      {loading && <LoadingSpinner />}
      <div style={styles.row}>
        <div style={styles.col}>
          <div style={styles.card}>
            <div style={styles.cardHeader}>
              <h5 style={styles.cardTitle}>
                <i className="fas fa-plus-circle" style={styles.icon}></i>
                เพิ่มสินค้าใหม่
              </h5>
            </div>
            <div style={styles.cardBody}>
              <form onSubmit={handleSubmit}>
                <ImageUpload
                  onImageChange={handleImageChange}
                  previewUrl={imagePreview}
                />

                <div style={styles.formRow}>
                  <div style={styles.formCol}>
                    <label htmlFor="productId" style={styles.formLabel}>
                      รหัสสินค้า (Auto)
                    </label>
                    <input
                      type="text"
                      id="productId"
                      style={{
                        ...styles.formControl,
                        ...styles.inputControlDisabled,
                      }}
                      value={productId}
                      readOnly
                      disabled
                    />
                  </div>
                  <div style={styles.formCol}>
                    <label htmlFor="productName" style={styles.formLabel}>
                      ชื่อสินค้า <span style={styles.requiredMark}>*</span>
                    </label>
                    <input
                      type="text"
                      id="productName"
                      style={styles.formControl}
                      value={productName}
                      onChange={(e) => setProductName(e.target.value)}
                      required
                    />
                  </div>
                </div>

                <div style={styles.formRow}>
                  <div style={styles.formCol}>
                    <label htmlFor="productType" style={styles.formLabel}>
                      ประเภท <span style={styles.requiredMark}>*</span>
                    </label>
                    <select
                      id="productType"
                      style={styles.formSelect}
                      value={productType}
                      onChange={(e) => setProductType(e.target.value)}
                      required
                    >
                      <option value="" disabled>
                        -- เลือกประเภท --
                      </option>
                      {types.map((t) => (
                        <option key={t.id} value={t.id}>
                          {t.typename}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div style={styles.formCol}>
                    <label htmlFor="productMaterial" style={styles.formLabel}>
                      วัสดุ <span style={styles.requiredMark}>*</span>
                    </label>
                    <select
                      id="productMaterial"
                      style={styles.formSelect}
                      value={productMaterial}
                      onChange={(e) => setProductMaterial(e.target.value)}
                      required
                    >
                      <option value="" disabled>
                        -- เลือกวัสดุ --
                      </option>
                      {materials.map((m) => (
                        <option key={m.id} value={m.id}>
                          {m.matname}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div style={styles.formRow}>
                  <div style={styles.formCol}>
                    <label htmlFor="productStock" style={styles.formLabel}>
                      จำนวนสต็อกเริ่มต้น{" "}
                      <span style={styles.requiredMark}>*</span>
                    </label>
                    <input
                      type="number"
                      id="productStock"
                      style={styles.formControl}
                      value={productStock}
                      onChange={(e) =>
                        setProductStock(
                          Math.max(0, parseInt(e.target.value) || 0)
                        )
                      }
                      required
                      min="0"
                    />
                  </div>
                  <div style={styles.formCol}>
                    <label htmlFor="productPrice" style={styles.formLabel}>
                      ราคา (บาท) <span style={styles.requiredMark}>*</span>
                    </label>
                    <input
                      type="number"
                      id="productPrice"
                      style={styles.formControl}
                      value={productPrice}
                      onChange={(e) =>
                        setProductPrice(
                          Math.max(0, parseFloat(e.target.value) || 0)
                        )
                      }
                      required
                      min="0.01"
                      step="0.01"
                    />
                  </div>
                </div>

                <div style={styles.btnContainer}>
                  <button
                    type="button"
                    style={styles.btnSecondary}
                    onClick={() => router.back()}
                  >
                    <i className="fas fa-times" style={styles.icon}></i> ยกเลิก
                  </button>
                  <button
                    type="submit"
                    style={styles.btnPrimary}
                    disabled={loading}
                  >
                    <i
                      className={`fas ${
                        loading ? "fa-spinner fa-spin" : "fa-save"
                      }`}
                      style={styles.icon}
                    ></i>
                    {loading ? "กำลังบันทึก..." : "บันทึกสินค้า"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}