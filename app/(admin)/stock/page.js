// app/(admin)/stock/page.js
"use client";

import React, { useState, useEffect, useCallback } from "react";
import axios from "axios";
import Swal from "sweetalert2";
import Link from "next/link";
import StatCard from "@/components/StatCard";
import LoadingSpinner from "@/components/LoadingSpinner";
import Image from "next/image";

function debounce(func, wait) {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
}

export default function StockPage() {
  const [products, setProducts] = useState([]);
  const [filteredProducts, setFilteredProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [stockFilter, setStockFilter] = useState("all");
  const [sortFilter, setSortFilter] = useState("name-asc");
  const [stats, setStats] = useState({ total: 0, low: 0, inStock: 0, out: 0 });

  const fetchStockData = useCallback(async () => {
    setLoading(true);
    try {
      const response = await axios.get("/api/products");
      setProducts(response.data);
      setFilteredProducts(response.data);
      calculateStats(response.data);
    } catch (error) {
      console.error("Error loading stock data:", error);
      Swal.fire("Error", "ไม่สามารถโหลดข้อมูลสต็อกได้", "error");
    } finally {
      setLoading(false);
    }
  }, []);

  const calculateStats = (data) => {
    const total = data.length;
    const low = data.filter(
      (p) => parseInt(p.Stocks) > 0 && parseInt(p.Stocks) <= 10
    ).length;
    const out = data.filter((p) => parseInt(p.Stocks) === 0).length;
    const inStock = total - low - out;
    setStats({ total, low, inStock, out });
  };

  const filterAndSortProducts = useCallback(() => {
    let tempProducts = [...products];

    if (searchTerm) {
      const lowerSearchTerm = searchTerm.toLowerCase();
      tempProducts = tempProducts.filter(
        (p) =>
          p.Fur_name.toLowerCase().includes(lowerSearchTerm) ||
          p.Fur_ID.toLowerCase().includes(lowerSearchTerm) ||
          p.typename?.toLowerCase().includes(lowerSearchTerm)
      );
    }

    switch (stockFilter) {
      case "low":
        tempProducts = tempProducts.filter(
          (p) => parseInt(p.Stocks) > 0 && parseInt(p.Stocks) <= 10
        );
        break;
      case "out":
        tempProducts = tempProducts.filter((p) => parseInt(p.Stocks) === 0);
        break;
      case "in":
        tempProducts = tempProducts.filter((p) => parseInt(p.Stocks) > 10);
        break;
    }

    tempProducts.sort((a, b) => {
      switch (sortFilter) {
        case "name-asc":
          return a.Fur_name.localeCompare(b.Fur_name);
        case "name-desc":
          return b.Fur_name.localeCompare(a.Fur_name);
        case "stock-low":
          return parseInt(a.Stocks) - parseInt(b.Stocks);
        case "stock-high":
          return parseInt(b.Stocks) - parseInt(a.Stocks);
        default:
          return 0;
      }
    });

    setFilteredProducts(tempProducts);
  }, [products, searchTerm, stockFilter, sortFilter]);

  const debouncedFilter = useCallback(debounce(filterAndSortProducts, 300), [
    filterAndSortProducts,
  ]);

  useEffect(() => {
    fetchStockData();
  }, [fetchStockData]);

  useEffect(() => {
    debouncedFilter();
  }, [searchTerm, stockFilter, sortFilter, debouncedFilter]);

  const handleUpdateStock = async (product) => {
    const { Fur_ID, Fur_name, Stocks } = product;
    const currentStock = parseInt(Stocks);

    const { value: formValues } = await Swal.fire({
      title: `อัปเดตสต็อก: ${Fur_name}`,
      html: `
        <div style="text-align: left;">
            <div style="margin-bottom: 15px;">
                <label style="display: block; margin-bottom: 5px; font-weight: 500;">ประเภทการอัปเดต</label>
                <select id="swal-updateType" style="width: 100%; padding: 8px; border: 1px solid #ced4da; border-radius: 4px;">
                    <option value="set" selected>กำหนดค่าใหม่</option>
                    <option value="add">เพิ่มสต็อก</option>
                    <option value="subtract">ลดสต็อก</option>
                </select>
            </div>
            <div style="margin-bottom: 15px;">
                <label style="display: block; margin-bottom: 5px; font-weight: 500;">จำนวน</label>
                <input type="number" id="swal-quantity" min="0" value="0" style="width: 100%; padding: 8px; border: 1px solid #ced4da; border-radius: 4px;">
                <small style="color: #6c757d; font-size: 80%;">ใส่จำนวนที่ต้องการ เพิ่ม/ลด หรือ กำหนดค่าใหม่</small>
            </div>
        </div>`,
      focusConfirm: false,
      showCancelButton: true,
      confirmButtonText: "อัปเดต",
      cancelButtonText: "ยกเลิก",
      preConfirm: () => {
        const updateType =
          Swal.getPopup().querySelector("#swal-updateType").value;
        const quantity = parseInt(
          Swal.getPopup().querySelector("#swal-quantity").value
        );

        if (isNaN(quantity) || quantity < 0) {
          Swal.showValidationMessage("กรุณาใส่จำนวนที่ถูกต้อง (>= 0)");
          return false;
        }

        let newStock;
        if (updateType === "add") {
          newStock = currentStock + quantity;
        } else if (updateType === "subtract") {
          newStock = currentStock - quantity;
          if (newStock < 0) {
            Swal.showValidationMessage("สต็อกคงเหลือไม่พอสำหรับการลด");
            return false;
          }
        } else {
          newStock = quantity;
        }
        return { newStock };
      },
    });

    if (formValues) {
      setLoading(true);
      try {
        await axios.put(`/api/products/${Fur_ID}`, {
          Stocks: formValues.newStock,
        });
        Swal.fire("สำเร็จ!", "อัปเดตสต็อกเรียบร้อย", "success");
        fetchStockData();
      } catch (error) {
        console.error("Error updating stock:", error);
        Swal.fire("ผิดพลาด", "ไม่สามารถอัปเดตสต็อกได้", "error");
        setLoading(false);
      }
    }
  };

  const handleDeleteProduct = async (product) => {
    const { Fur_ID, Fur_name } = product;
    const result = await Swal.fire({
      title: `ลบสินค้า: ${Fur_name}`,
      text: `คุณแน่ใจหรือไม่ว่าต้องการลบสินค้านี้ (${Fur_ID})? การกระทำนี้ไม่สามารถย้อนกลับได้`,
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#d33",
      cancelButtonColor: "#3085d6",
      confirmButtonText: "ใช่, ลบเลย!",
      cancelButtonText: "ยกเลิก",
    });

    if (result.isConfirmed) {
      setLoading(true);
      try {
        await axios.delete(`/api/products/${Fur_ID}`);
        Swal.fire("ลบแล้ว!", "สินค้าถูกลบเรียบร้อย", "success");
        fetchStockData();
      } catch (error) {
        console.error("Error deleting product:", error);
        if (error.response?.data?.error?.includes("foreign key constraint")) {
          Swal.fire(
            "ผิดพลาด",
            "ไม่สามารถลบสินค้าได้เนื่องจากมีการอ้างอิงในรายการขาย",
            "error"
          );
        } else {
          Swal.fire("ผิดพลาด", "ไม่สามารถลบสินค้าได้", "error");
        }
        setLoading(false);
      }
    }
  };

  const getStockStatus = (stock) => {
    const s = parseInt(stock);
    if (s === 0)
      return { text: "หมดสต็อก", badge: "bg-danger", icon: "fa-times-circle" };
    if (s <= 10)
      return {
        text: "ใกล้หมด",
        badge: "bg-warning text-dark",
        icon: "fa-exclamation-triangle",
      };
    return { text: "มีสินค้า", badge: "bg-success", icon: "fa-check-circle" };
  };

  const styles = {
    container: {
      padding: "0 15px",
      maxWidth: "1600px",
      margin: "0 auto",
    },
    cardShadow: {
      boxShadow: "0 4px 6px rgba(0, 0, 0, 0.1), 0 1px 3px rgba(0, 0, 0, 0.08)",
      borderRadius: "8px",
      border: "none",
    },
    cardHeader: {
      backgroundColor: "#f8f9fa",
      borderBottom: "1px solid #edf0f2",
      padding: "15px 20px",
      display: "flex",
      justifyContent: "space-between",
      alignItems: "center",
      flexWrap: "wrap",
      borderTopLeftRadius: "8px",
      borderTopRightRadius: "8px",
    },
    cardBody: {
      padding: "20px",
    },
    cardTitle: {
      margin: "0",
      fontWeight: "600",
      fontSize: "1.1rem",
      color: "#3c4858",
    },
    addButton: {
      backgroundColor: "#4361ee",
      color: "white",
      border: "none",
      borderRadius: "5px",
      padding: "7px 15px",
      fontSize: "0.85rem",
      fontWeight: "500",
      display: "inline-flex",
      alignItems: "center",
      transition: "all 0.2s ease",
      cursor: "pointer",
      boxShadow: "0 2px 4px rgba(0, 0, 0, 0.1)",
      textDecoration: 'none', // Added for Link
    },
    filtersContainer: {
      backgroundColor: "#f8f9fa",
      padding: "15px",
      borderRadius: "6px",
      marginBottom: "20px",
      boxShadow: "0 1px 3px rgba(0, 0, 0, 0.05)",
    },
    searchInput: {
      height: "38px",
      padding: "8px 12px",
      fontSize: "0.9rem",
      borderRadius: "4px",
      border: "1px solid #ced4da",
      width: "100%",
    },
    select: {
      height: "38px",
      padding: "8px 12px",
      fontSize: "0.9rem",
      borderRadius: "4px",
      border: "1px solid #ced4da",
      width: "100%",
      cursor: "pointer",
    },
    table: {
      width: "100%",
      borderCollapse: "separate",
      borderSpacing: "0",
      fontSize: "0.9rem",
    },
    tableHeader: {
      backgroundColor: "#f8f9fa",
      color: "#495057",
      fontWeight: "600",
      borderBottom: "2px solid #dee2e6",
      padding: "10px 15px",
    },
    tableRow: {
      transition: "background-color 0.15s ease",
      borderBottom: "1px solid #e9ecef",
    },
    tableCell: {
      padding: "12px 15px",
      verticalAlign: "middle",
    },
    tableCellCenter: {
      padding: "12px 15px",
      verticalAlign: "middle",
      textAlign: "center",
    },
    badge: {
      padding: "5px 10px",
      borderRadius: "30px",
      fontSize: "0.75rem",
      fontWeight: "500",
      display: "inline-flex",
      alignItems: "center",
      justifyContent: "center",
    },
    actionButton: {
      border: "1px solid",
      borderRadius: "4px",
      padding: "4px 10px",
      margin: "0 3px",
      cursor: "pointer",
      transition: "all 0.2s ease",
      backgroundColor: "transparent",
    },
    editButton: {
      borderColor: "#4361ee",
      color: "#4361ee",
    },
    deleteButton: {
      borderColor: "#ef476f",
      color: "#ef476f",
    },
    imageContainer: {
      width: "50px",
      height: "50px",
      borderRadius: "6px",
      overflow: "hidden",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      border: "1px solid #dee2e6",
    },
    statRow: {
      display: "flex",
      flexWrap: "wrap",
      marginBottom: "20px",
      gap: "15px",
    },
    emptyMessage: {
      textAlign: "center",
      color: "#6c757d",
      padding: "30px 0",
      fontStyle: "italic",
    },
  };

  return (
    <div style={styles.container}>
      {loading && <LoadingSpinner />}

      <div style={styles.statRow}>
        <div style={{ flex: "1 1 200px" }}>
          <StatCard
            title="สินค้าทั้งหมด"
            value={stats.total}
            icon="fa-boxes"
            color="primary"
          />
        </div>
        <div style={{ flex: "1 1 200px" }}>
          <StatCard
            title="ใกล้หมด "
            value={stats.low}
            icon="fa-exclamation-triangle"
            color="warning"
          />
        </div>
        <div style={{ flex: "1 1 200px" }}>
          <StatCard
            title="มีสินค้า "
            value={stats.inStock}
            icon="fa-check-circle"
            color="success"
          />
        </div>
        <div style={{ flex: "1 1 200px" }}>
          <StatCard
            title="หมดสต็อก"
            value={stats.out}
            icon="fa-times-circle"
            color="danger"
          />
        </div>
      </div>

      <div style={styles.cardShadow}>
        <div style={styles.cardHeader}>
          <h5 style={styles.cardTitle}>ภาพรวมสต็อกสินค้า</h5>
          <div>
            <Link href="/stock/add" style={styles.addButton}>
              <i className="fas fa-plus" style={{ marginRight: "5px" }}></i>{" "}
              เพิ่มสินค้าใหม่
            </Link>
          </div>
        </div>
        <div style={styles.cardBody}>
          <div style={styles.filtersContainer}>
            <div style={{ display: "flex", flexWrap: "wrap", gap: "10px" }}>
              <div style={{ flex: "1 1 200px" }}>
                <input
                  type="text"
                  style={styles.searchInput}
                  placeholder="ค้นหาด้วยชื่อ, ID, ประเภท..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
              <div style={{ flex: "1 1 200px" }}>
                <select
                  style={styles.select}
                  value={stockFilter}
                  onChange={(e) => setStockFilter(e.target.value)}
                >
                  <option value="all">สถานะสต็อกทั้งหมด</option>
                  <option value="in">มีสินค้า</option>
                  <option value="low">ใกล้หมด</option>
                  <option value="out">หมดสต็อก</option>
                </select>
              </div>
              <div style={{ flex: "1 1 200px" }}>
                <select
                  style={styles.select}
                  value={sortFilter}
                  onChange={(e) => setSortFilter(e.target.value)}
                >
                  <option value="name-asc">ชื่อ (ก-ฮ)</option>
                  <option value="name-desc">ชื่อ (ฮ-ก)</option>
                  <option value="stock-low">สต็อก (น้อยไปมาก)</option>
                  <option value="stock-high">สต็อก (มากไปน้อย)</option>
                </select>
              </div>
            </div>
          </div>

          <div style={{ overflowX: "auto" }}>
            <table style={styles.table}>
              <thead>
                <tr>
                  {[
                    "รูปภาพ",
                    "ID",
                    "ชื่อสินค้า",
                    "ประเภท",
                    "สต็อก",
                    "สถานะ",
                    "การกระทำ",
                  ].map((header, index) => (
                    <th
                      key={index}
                      style={{
                        ...styles.tableHeader,
                        textAlign: index >= 4 ? "center" : "left",
                      }}
                    >
                      {header}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filteredProducts.length > 0 ? (
                  filteredProducts.map((product) => {
                    const status = getStockStatus(product.Stocks);
                    let badgeStyle = {
                      ...styles.badge,
                      backgroundColor: status.badge.includes("bg-danger")
                        ? "#ef476f"
                        : status.badge.includes("bg-warning")
                        ? "#ffd166"
                        : "#06d6a0",
                      color: status.badge.includes("bg-warning")
                        ? "#212529"
                        : "white",
                    };

                    return (
                      <tr
                        key={product.Fur_ID}
                        style={{
                          ...styles.tableRow,
                          backgroundColor: "white",
                          ":hover": { backgroundColor: "#f8f9fa" },
                        }}
                      >
                        <td style={styles.tableCell}>
                          <div style={styles.imageContainer}>
                            <Image
                              src={product.image_url || "/placeholder.jpg"}
                              alt={product.Fur_name}
                              width={50}
                              height={50}
                              style={{ objectFit: "cover" }}
                              onError={(e) => {
                                e.target.src = "/placeholder.jpg";
                              }}
                            />
                          </div>
                        </td>
                        <td style={styles.tableCell}>{product.Fur_ID}</td>
                        <td style={styles.tableCell}>{product.Fur_name}</td>
                        <td style={styles.tableCell}>
                          {product.typename || "-"}
                        </td>
                        <td style={styles.tableCellCenter}>{product.Stocks}</td>
                        <td style={styles.tableCellCenter}>
                          <span style={badgeStyle}>
                            <i
                              className={`fas ${status.icon}`}
                              style={{ marginRight: "5px" }}
                            ></i>
                            {status.text}
                          </span>
                        </td>
                        <td style={styles.tableCellCenter}>
                          <button
                            style={{
                              ...styles.actionButton,
                              ...styles.editButton,
                            }}
                            title="แก้ไขสต็อก"
                            onClick={() => handleUpdateStock(product)}
                          >
                            <i className="fas fa-edit"></i>
                          </button>
                          <button
                            style={{
                              ...styles.actionButton,
                              ...styles.deleteButton,
                            }}
                            title="ลบสินค้า"
                            onClick={() => handleDeleteProduct(product)}
                          >
                            <i className="fas fa-trash-alt"></i>
                          </button>
                        </td>
                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td colSpan="7" style={styles.emptyMessage}>
                      ไม่พบข้อมูลสินค้า
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}