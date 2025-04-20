"use client";

import React, { useState, useEffect, useCallback } from "react";
import axios from "axios";
import Swal from "sweetalert2";
import Navbar from "@/components/Navbar";
import ProductCard from "@/components/ProductCard";
import LoadingSpinner from "@/components/LoadingSpinner";

function debounce(func, wait) {
  let timeout;
  return function (...args) {
    const context = this;
    clearTimeout(timeout);
    timeout = setTimeout(() => func.apply(context, args), wait);
  };
}

export default function HomePage() {
  const [products, setProducts] = useState([]);
  const [filteredProducts, setFilteredProducts] = useState([]);
  const [types, setTypes] = useState([]);
  const [materials, setMaterials] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [typeFilter, setTypeFilter] = useState("");
  const [materialFilter, setMaterialFilter] = useState("");

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
      Swal.fire("Error", "ไม่สามารถโหลดข้อมูลสินค้าได้", "error");
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

  // Fix for the useCallback warning
  const debouncedFilter = useCallback(() => {
    const debouncedFn = debounce(() => {
      filterProducts();
    }, 300);
    debouncedFn();
  }, [filterProducts]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  useEffect(() => {
    debouncedFilter();
  }, [searchTerm, typeFilter, materialFilter, debouncedFilter]);

  const handleBuyClick = async (product) => {
    if (!product || parseInt(product.Stocks) <= 0) return;

    console.log("Buy button clicked for:", product.Fur_ID);
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
        await axios.put(`/api/products/${product.Fur_ID}`, { stockChange: -1 });

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

  return (
    <div>
      <Navbar isPublic={true} />
      {loading && <LoadingSpinner />}
      <div className="container my-4">
        <div className="card card-body shadow-sm mb-4 filters">
          <div className="row g-3 align-items-center">
            <div className="col-md-5">
              <div className="input-group input-group-sm">
                <span className="input-group-text bg-light border-end-0">
                  <i className="fas fa-search"></i>
                </span>
                <input
                  type="text"
                  className="form-control form-control-sm border-start-0"
                  placeholder="ค้นหาสินค้า..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  style={{
                    width: "100%",
                    borderRadius: "0 0.25rem 0.25rem 0",
                  }}
                />
              </div>
            </div>
            <div className="col-md-3">
              <select
                className="form-select form-select-sm"
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
                className="form-select form-select-sm"
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
            <div className="col-md-1 text-end">
              <button
                className="btn btn-outline-secondary btn-sm"
                onClick={() => {
                  setSearchTerm("");
                  setTypeFilter("");
                  setMaterialFilter("");
                }}
                title="ล้างตัวกรอง"
                disabled={!searchTerm && !typeFilter && !materialFilter}
              >
                <i className="fas fa-times"></i>
              </button>
            </div>
          </div>
        </div>

        {!loading && (
          <div className="row row-cols-1 row-cols-sm-2 row-cols-md-3 row-cols-lg-4 g-4">
            {filteredProducts.length > 0 ? (
              filteredProducts.map((product) => (
                <div key={product.Fur_ID} className="col">
                  <ProductCard product={product} onBuyClick={handleBuyClick} />
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

      <div className="bg-light py-5 mt-5" id="contact">
        <div className="container">
          <div className="row">
            <div className="col-md-6 mb-4 mb-md-0">
              <h4 className="mb-4">
                <i className="fas fa-phone-alt me-2"></i>ติดต่อเรา
              </h4>
              <p>
                <i
                  className="fas fa-map-marker-alt me-2 text-secondary"
                  style={{ width: "20px" }}
                ></i>
                Khlong Sam, Khlong Luang District, Pathum Thani 12120
              </p>
              <p>
                <i
                  className="fas fa-phone me-2 text-secondary"
                  style={{ width: "20px" }}
                ></i>
                02-123-4567
              </p>
              <p>
                <i
                  className="fas fa-clock me-2 text-secondary"
                  style={{ width: "20px" }}
                ></i>
                เปิดทุกวัน 9:00 - 20:00 น.
              </p>
            </div>
            <div className="col-md-6">
              <h4 className="mb-4">
                <i className="fas fa-map-marked-alt me-2"></i>แผนที่ร้าน
              </h4>
              <div className="ratio ratio-16x9 rounded overflow-hidden shadow-sm">
                <iframe
                  src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d15496.992657500983!2d100.6488767!3d14.0458147!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x30e27f7c5c536967%3A0x2959a49e91f2f3e7!2sKhlong%20Sam%2C%20Khlong%20Luang%20District%2C%20Pathum%20Thani%2012120!5e0!3m2!1sen!2sth!4v1713542485707!5m2!1sen!2sth"
                  style={{ border: 0 }}
                  allowFullScreen=""
                  loading="lazy"
                  referrerPolicy="no-referrer-when-downgrade"
                  title="Map Location"
                ></iframe>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
