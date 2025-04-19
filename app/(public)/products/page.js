// app/(public)/products/page.js
"use client"; // จำเป็นสำหรับ Hooks และ Event Handlers

import React, { useState, useEffect, useCallback } from "react";
import axios from "axios";
import Swal from "sweetalert2";
import Navbar from "@/components/Navbar";
import ProductCard from "@/components/ProductCard";
import LoadingSpinner from "@/components/LoadingSpinner";
// Utility function (debounce)
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

  // --- Fetch Data Functions ---
  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [productsRes, typesRes, materialsRes] = await Promise.all([
        axios.get("/api/products"), // เรียก Next.js API route
        axios.get("/api/types"),
        axios.get("/api/materials"),
      ]);
      setProducts(productsRes.data);
      setFilteredProducts(productsRes.data); // Initialize filtered list
      setTypes(typesRes.data);
      setMaterials(materialsRes.data);
    } catch (error) {
      console.error("Error loading data:", error);
      Swal.fire("Error", "ไม่สามารถโหลดข้อมูลได้", "error");
    } finally {
      setLoading(false);
    }
  }, []);

  // --- Filter Logic ---
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

  // Debounced search handler
  const debouncedFilter = useCallback(debounce(filterProducts, 300), [
    filterProducts,
  ]);

  // --- Effects ---
  useEffect(() => {
    fetchData(); // Fetch initial data
  }, [fetchData]);

  useEffect(() => {
    debouncedFilter(); // Apply filters when dependencies change
  }, [searchTerm, typeFilter, materialFilter, debouncedFilter]);

  // --- Buy Product Logic ---
  const handleBuyClick = async (product) => {
    if (!product || parseInt(product.Stocks) <= 0) return;

    // Logic การแสดง Swal Form (คล้ายเดิม แต่ใช้ React)
    const { value: formData, isConfirmed } = await Swal.fire({
      title: "กรอกข้อมูลการสั่งซื้อ",
      html: `
            <div class="text-start">
                <div class="mb-3">
                    <label class="form-label">ชื่อ-นามสกุล *</label>
                    <input type="text" id="swal-name" class="form-control" required>
                </div>
                <div class="mb-3">
                    <label class="form-label">เบอร์โทรศัพท์ *</label>
                    <input type="tel" id="swal-phone" class="form-control" pattern="[0-9]{10}" required>
                </div>
                <div class="mb-3">
                    <label class="form-label">วิธีรับสินค้า *</label>
                    <div>
                        <input type="radio" name="delivery" id="swal-pickup" value="pickup" class="form-check-input me-1" required>
                        <label for="swal-pickup" class="form-check-label me-3">รับที่ร้าน (ฟรี)</label>
                        <input type="radio" name="delivery" id="swal-delivery" value="delivery" class="form-check-input me-1">
                        <label for="swal-delivery" class="form-check-label">จัดส่ง (+฿100)</label>
                    </div>
                </div>
                <div id="swal-address-div" class="mb-3 d-none">
                    <label class="form-label">ที่อยู่จัดส่ง *</label>
                    <textarea id="swal-address" class="form-control" rows="3"></textarea>
                </div>
            </div>
        `,
      didOpen: () => {
        // Add event listener to show/hide address field
        const pickupRadio = Swal.getPopup().querySelector("#swal-pickup");
        const deliveryRadio = Swal.getPopup().querySelector("#swal-delivery");
        const addressDiv = Swal.getPopup().querySelector("#swal-address-div");
        const listener = () => {
          addressDiv.classList.toggle("d-none", !deliveryRadio.checked);
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
        // สร้าง IDs (อาจทำใน Backend)
        const custId = "C" + Date.now().toString().slice(-6);
        const invoiceId = "INV" + Date.now().toString().slice(-8);
        const orderDetailId = "OD" + Date.now().toString().slice(-8);

        const shippingCost = formData.delivery === "delivery" ? 100 : 0;
        const totalPrice = parseFloat(product.Prices) + shippingCost;

        // 1. สร้าง Customer
        await axios.post("/api/customers", {
          CustID: custId,
          CustName: formData.name,
          Phone: formData.phone,
          Address: formData.address,
        });

        // 2. สร้าง Order
        await axios.post("/api/orders", {
          InvoiceID: invoiceId,
          CustID: custId,
          TotalPrice: totalPrice,
          deliveryMethod: formData.delivery,
          orderDate: new Date().toISOString().split("T")[0], // ควรทำใน Backend
        });

        // 3. สร้าง OrderDetail
        await axios.post("/api/orders/details", {
          OrderDetailID: orderDetailId,
          InvoiceID: invoiceId,
          Fur_ID: product.Fur_ID,
          Qty: 1, // สมมติสั่งทีละ 1
          Price: product.Prices,
        });

        // 4. Update Stock (ควรทำพร้อมกับสร้าง OrderDetail ใน Transaction เดียว)
        await axios.put(`/api/products/${product.Fur_ID}`, {
          // Endpoint สำหรับ Update Stock
          stockChange: -1, // ส่งจำนวนที่เปลี่ยนแปลง
        });

        Swal.fire(
          "สำเร็จ!",
          `สั่งซื้อสินค้าเรียบร้อย เลขที่: ${invoiceId}`,
          "success"
        );
        fetchData(); // Refresh ข้อมูล
      } catch (error) {
        console.error("Order error:", error);
        Swal.fire("ผิดพลาด", "ไม่สามารถดำเนินการสั่งซื้อได้", "error");
      } finally {
        setLoading(false);
      }
    }
  };

  // --- Render ---
  return (
    <div>
      <Navbar isPublic={true} /> {/* ส่ง prop บอกว่าเป็นหน้า Public */}
      <div className="container my-4">
        {/* Filters */}
        <div className="card card-body shadow-sm mb-4">
          <div className="row g-3 align-items-center">
            <div className="col-md-5">
              <input
                type="text"
                className="form-control"
                placeholder="ค้นหาสินค้า..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <div className="col-md-3">
              <select
                className="form-select"
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
            <div className="col-md-3">
              <select
                className="form-select"
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
            {/* Optional: Clear filters button */}
          </div>
        </div>

        {/* Product Grid */}
        {loading ? (
          <LoadingSpinner />
        ) : (
          <div className="row">
            {filteredProducts.length > 0 ? (
              filteredProducts.map((product) => (
                <div
                  key={product.Fur_ID}
                  className="col-lg-3 col-md-4 col-sm-6 mb-4"
                >
                  <ProductCard
                    product={product}
                    onBuyClick={() => handleBuyClick(product)}
                  />
                </div>
              ))
            ) : (
              <div className="col-12 text-center mt-5">
                <h4>
                  <i className="fas fa-search me-2"></i>ไม่พบสินค้า
                </h4>
                <p className="text-muted">ลองปรับคำค้นหาหรือตัวกรอง</p>
              </div>
            )}
          </div>
        )}
      </div>
      {/* Footer or Contact Section */}
    </div>
  );
  const globalStyles = `
    .products-container {
      padding: 20px;
      max-width: 1200px;
      margin: 0 auto;
    }

    .filter-card {
      background-color: #f8f9fa;
      border-radius: 10px;
      border: 1px solid #dee2e6;
      margin-bottom: 1.5rem;
    }

    .product-card-col {
      transition: transform 0.2s ease;
    }

    .product-card-col:hover {
      transform: translateY(-5px);
    }

    .no-products {
      padding: 50px 20px;
      background-color: #f8f9fa;
      border-radius: 10px;
      text-align: center;
    }

    @media (max-width: 768px) {
      .filter-card .row {
        gap: 15px;
      }
      
      .product-card-col {
        flex: 0 0 100% !important;
        max-width: 100% !important;
      }
    }

    @media (max-width: 576px) {
      .form-select {
        margin-top: 10px;
      }
    }
  `;

  return (
    <div>
      <Navbar isPublic={true} />

      {/* เพิ่ม global styles */}
      <style dangerouslySetInnerHTML={{ __html: globalStyles }} />

      <div className="products-container">
        {/* Filter Section */}
        <div className="filter-card card card-body shadow-sm mb-4">
          {/* ... existing filter code ... */}
        </div>

        {/* Product Grid */}
        {loading ? (
          <LoadingSpinner />
        ) : (
          <div className="row">
            {filteredProducts.length > 0 ? (
              filteredProducts.map((product) => (
                <div
                  key={product.Fur_ID}
                  className="product-card-col col-lg-3 col-md-4 col-sm-6 mb-4"
                >
                  <ProductCard
                    product={product}
                    onBuyClick={() => handleBuyClick(product)}
                  />
                </div>
              ))
            ) : (
              <div className="no-products">
                <h4>
                  <i className="fas fa-search me-2"></i>ไม่พบสินค้า
                </h4>
                <p className="text-muted">ลองปรับคำค้นหาหรือตัวกรอง</p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
