// app/(public)/products/page.js
"use client";

import React, { useState, useEffect, useCallback } from "react";
import axios from "axios";
import Swal from "sweetalert2";
import Navbar from "@/components/Navbar";
import ProductCard from "@/components/ProductCard";
import LoadingSpinner from "@/components/LoadingSpinner";

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

export default function ProductsPage() {
  const [products, setProducts] = useState([]);
  const [filteredProducts, setFilteredProducts] = useState([]);
  const [types, setTypes] = useState([]);
  const [materials, setMaterials] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [typeFilter, setTypeFilter] = useState("");
  const [materialFilter, setMaterialFilter] = useState("");

  const styles = {
    container: {
      padding: "20px",
      maxWidth: "1200px",
      margin: "0 auto",
    },
    filterCard: {
      backgroundColor: "#f8f9fa",
      borderRadius: "10px",
      border: "1px solid #dee2e6",
      marginBottom: "1.5rem",
      padding: "20px",
      boxShadow: "0 4px 6px rgba(0, 0, 0, 0.05)",
    },
    formControl: {
      border: "1px solid #ced4da",
      borderRadius: "6px",
      padding: "10px 12px",
      fontSize: "0.95rem",
      width: "100%",
      transition: "border-color 0.2s ease",
    },
    searchInput: {
      backgroundImage:
        "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='16' height='16' fill='%236c757d' class='bi bi-search' viewBox='0 0 16 16'%3E%3Cpath d='M11.742 10.344a6.5 6.5 0 1 0-1.397 1.398h-.001c.03.04.062.078.098.115l3.85 3.85a1 1 0 0 0 1.415-1.414l-3.85-3.85a1.007 1.007 0 0 0-.115-.1zM12 6.5a5.5 5.5 0 1 1-11 0 5.5 5.5 0 0 1 11 0z'/%3E%3C/svg%3E\")",
      backgroundRepeat: "no-repeat",
      backgroundPosition: "right 10px center",
      backgroundSize: "16px",
      paddingRight: "35px",
    },
    formGroup: {
      margin: "0",
      padding: "0 10px",
    },
    select: {
      appearance: "auto",
      backgroundPosition: "right 10px center",
      backgroundSize: "16px",
      paddingRight: "35px",
    },
    row: {
      display: "flex",
      flexWrap: "wrap",
      margin: "0 -10px",
    },
    col: {
      flex: "1 0 0%",
      padding: "0 10px",
      marginBottom: "15px",
      minWidth: "250px",
    },
    productRow: {
      display: "flex",
      flexWrap: "wrap",
      margin: "0 -12px",
    },
    productCol: {
      flex: "0 0 25%",
      maxWidth: "25%",
      padding: "0 12px",
      marginBottom: "24px",
      transition: "transform 0.2s ease",
      ":hover": {
        transform: "translateY(-5px)",
      },
    },
    emptyResults: {
      padding: "50px 20px",
      backgroundColor: "#f8f9fa",
      borderRadius: "10px",
      textAlign: "center",
      width: "100%",
      boxShadow: "0 2px 4px rgba(0, 0, 0, 0.05)",
    },
    emptyIcon: {
      marginRight: "8px",
      color: "#6c757d",
    },
    emptyTitle: {
      fontSize: "1.25rem",
      fontWeight: "500",
      marginBottom: "10px",
      color: "#343a40",
    },
    emptyText: {
      color: "#6c757d",
      fontSize: "0.95rem",
    },
  };

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [productsRes, typesRes, materialsRes] = await Promise.all([
        axios.get("/api/products"),
        axios.get("/api/types"),
        axios.get("/api/materials"),
      ]);
      setProducts(productsRes.data);
      setFilteredProducts(productsRes.data);
      setTypes(typesRes.data);
      setMaterials(materialsRes.data);
    } catch (error) {
      console.error("Error loading data:", error);
      Swal.fire("Error", "ไม่สามารถโหลดข้อมูลได้", "error");
    } finally {
      setLoading(false);
    }
  }, []);

  const filterProducts = useCallback(() => {
    const lowerSearchTerm = searchTerm.toLowerCase();
    const filtered = products.filter(
      (p) =>
        p.Fur_name.toLowerCase().includes(lowerSearchTerm) &&
        (typeFilter === "" || p.type_id === typeFilter) &&
        (materialFilter === "" || p.material_id === materialFilter)
    );
    setFilteredProducts(filtered);
  }, [products, searchTerm, typeFilter, materialFilter]);

  const debouncedFilter = useCallback(debounce(filterProducts, 300), [
    filterProducts,
  ]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  useEffect(() => {
    debouncedFilter();
  }, [searchTerm, typeFilter, materialFilter, debouncedFilter]);

  const handleBuyClick = async (product) => {
    if (!product || parseInt(product.Stocks) <= 0) return;

    const { value: formData, isConfirmed } = await Swal.fire({
      title: "กรอกข้อมูลการสั่งซื้อ",
      html: `
            <div style="text-align: left;">
                <div style="margin-bottom: 15px;">
                    <label style="display: block; margin-bottom: 5px; font-weight: 500;">ชื่อ-นามสกุล *</label>
                    <input type="text" id="swal-name" style="width: 100%; padding: 8px; border: 1px solid #ced4da; border-radius: 4px;" required>
                </div>
                <div style="margin-bottom: 15px;">
                    <label style="display: block; margin-bottom: 5px; font-weight: 500;">เบอร์โทรศัพท์ *</label>
                    <input type="tel" id="swal-phone" style="width: 100%; padding: 8px; border: 1px solid #ced4da; border-radius: 4px;" pattern="[0-9]{10}" required>
                </div>
                <div style="margin-bottom: 15px;">
                    <label style="display: block; margin-bottom: 5px; font-weight: 500;">วิธีรับสินค้า *</label>
                    <div>
                        <input type="radio" name="delivery" id="swal-pickup" value="pickup" style="margin-right: 5px;" required>
                        <label for="swal-pickup" style="margin-right: 15px;">รับที่ร้าน (ฟรี)</label>
                        <input type="radio" name="delivery" id="swal-delivery" value="delivery" style="margin-right: 5px;">
                        <label for="swal-delivery">จัดส่ง (+฿100)</label>
                    </div>
                </div>
                <div id="swal-address-div" style="margin-bottom: 15px; display: none;">
                    <label style="display: block; margin-bottom: 5px; font-weight: 500;">ที่อยู่จัดส่ง *</label>
                    <textarea id="swal-address" style="width: 100%; padding: 8px; border: 1px solid #ced4da; border-radius: 4px;" rows="3"></textarea>
                </div>
            </div>
        `,
      didOpen: () => {
        const pickupRadio = Swal.getPopup().querySelector("#swal-pickup");
        const deliveryRadio = Swal.getPopup().querySelector("#swal-delivery");
        const addressDiv = Swal.getPopup().querySelector("#swal-address-div");
        const listener = () => {
          addressDiv.style.display = deliveryRadio.checked ? "block" : "none";
        };
        pickupRadio.addEventListener("change", listener);
        deliveryRadio.addEventListener("change", listener);
      },
      preConfirm: () => {
        const name = Swal.getPopup().querySelector("#swal-name").value;
        const phone = Swal.getPopup().querySelector("#swal-phone").value;
        const delivery = Swal.getPopup().querySelector(
          'input[name="delivery"]:checked'
        )?.value;
        const address = Swal.getPopup().querySelector("#swal-address").value;

        if (!name) return Swal.showValidationMessage("กรุณากรอกชื่อ");
        if (!phone || !/^[0-9]{10}$/.test(phone))
          return Swal.showValidationMessage("เบอร์โทรไม่ถูกต้อง");
        if (!delivery)
          return Swal.showValidationMessage("กรุณาเลือกวิธีรับสินค้า");
        if (delivery === "delivery" && !address)
          return Swal.showValidationMessage("กรุณากรอกที่อยู่");

        return {
          name,
          phone,
          delivery,
          address: delivery === "delivery" ? address : null,
        };
      },
      showCancelButton: true,
      confirmButtonText: "ยืนยัน",
      cancelButtonText: "ยกเลิก",
    });

    if (isConfirmed && formData) {
      setLoading(true);
      try {
        const custId = "C" + Date.now().toString().slice(-6);
        const invoiceId = "INV" + Date.now().toString().slice(-8);
        const orderDetailId = "OD" + Date.now().toString().slice(-8);

        const shippingCost = formData.delivery === "delivery" ? 100 : 0;
        const totalPrice = parseFloat(product.Prices) + shippingCost;

        await axios.post("/api/customers", {
          CustID: custId,
          CustName: formData.name,
          Phone: formData.phone,
          Address: formData.address,
        });

        await axios.post("/api/orders", {
          InvoiceID: invoiceId,
          CustID: custId,
          TotalPrice: totalPrice,
          deliveryMethod: formData.delivery,
          orderDate: new Date().toISOString().split("T")[0],
        });

        await axios.post("/api/orders/details", {
          OrderDetailID: orderDetailId,
          InvoiceID: invoiceId,
          Fur_ID: product.Fur_ID,
          Qty: 1,
          Price: product.Prices,
        });

        await axios.put(`/api/products/${product.Fur_ID}`, {
          stockChange: -1,
        });

        Swal.fire(
          "สำเร็จ!",
          `สั่งซื้อสินค้าเรียบร้อย เลขที่: ${invoiceId}`,
          "success"
        );
        fetchData();
      } catch (error) {
        console.error("Order error:", error);
        Swal.fire("ผิดพลาด", "ไม่สามารถดำเนินการสั่งซื้อได้", "error");
      } finally {
        setLoading(false);
      }
    }
  };

  const getColumnStyle = () => {
    const width = typeof window !== "undefined" ? window.innerWidth : 1200;
    let colStyle = { ...styles.productCol };

    if (width < 576) {
      colStyle = {
        ...colStyle,
        flex: "0 0 100%",
        maxWidth: "100%",
      };
    } else if (width < 768) {
      colStyle = {
        ...colStyle,
        flex: "0 0 50%",
        maxWidth: "50%",
      };
    } else if (width < 992) {
      colStyle = {
        ...colStyle,
        flex: "0 0 33.333%",
        maxWidth: "33.333%",
      };
    }

    return colStyle;
  };

  return (
    <div>
      <Navbar isPublic={true} />

      <div style={styles.container}>
        <div style={styles.filterCard}>
          <div style={styles.row}>
            <div
              style={{
                ...styles.col,
                flex: "2 1 300px",
              }}
            >
              <input
                type="text"
                style={{ ...styles.formControl, ...styles.searchInput }}
                placeholder="ค้นหาสินค้า..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <div style={styles.col}>
              <select
                style={{ ...styles.formControl, ...styles.select }}
                value={typeFilter}
                onChange={(e) => setTypeFilter(e.target.value)}
              >
                <option value="">ทุกประเภท</option>
                {types.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.typename}
                  </option>
                ))}
              </select>
            </div>
            <div style={styles.col}>
              <select
                style={{ ...styles.formControl, ...styles.select }}
                value={materialFilter}
                onChange={(e) => setMaterialFilter(e.target.value)}
              >
                <option value="">ทุกวัสดุ</option>
                {materials.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.matname}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {loading ? (
          <LoadingSpinner />
        ) : (
          <div style={styles.productRow}>
            {filteredProducts.length > 0 ? (
              filteredProducts.map((product) => (
                <div
                  key={product.Fur_ID}
                  style={getColumnStyle()}
                  onMouseOver={(e) => {
                    e.currentTarget.style.transform = "translateY(-5px)";
                  }}
                  onMouseOut={(e) => {
                    e.currentTarget.style.transform = "translateY(0)";
                  }}
                >
                  <ProductCard
                    product={product}
                    onBuyClick={() => handleBuyClick(product)}
                  />
                </div>
              ))
            ) : (
              <div style={styles.emptyResults}>
                <h4 style={styles.emptyTitle}>
                  <i className="fas fa-search" style={styles.emptyIcon}></i>
                  ไม่พบสินค้า
                </h4>
                <p style={styles.emptyText}>ลองปรับคำค้นหาหรือตัวกรอง</p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
