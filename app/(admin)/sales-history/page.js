"use client";

import React, { useState, useEffect, useCallback, useMemo } from "react";
import axios from "axios";
import Swal from "sweetalert2";
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

export default function SalesHistoryPage() {
  const [orders, setOrders] = useState([]);
  const [orderDetails, setOrderDetails] = useState({});
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [deliveryFilter, setDeliveryFilter] = useState("");
  const [sortBy, setSortBy] = useState("date-desc");
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [stats, setStats] = useState({
    totalSales: 0,
    totalOrders: 0,
    pickup: 0,
    delivery: 0,
  });

  const fetchSalesData = useCallback(async () => {
    setLoading(true);
    try {
      const ordersRes = await axios.get("/api/orders/history");

      const detailsRes = await axios.get("/api/orders/history/details");

      const detailsMap = detailsRes.data.reduce((acc, detail) => {
        if (!acc[detail.InvoiceID]) {
          acc[detail.InvoiceID] = [];
        }
        acc[detail.InvoiceID].push(detail);
        return acc;
      }, {});

      setOrders(ordersRes.data);
      setOrderDetails(detailsMap);
      calculateStats(ordersRes.data);
    } catch (error) {
      console.error("Error loading sales data:", error);
      Swal.fire("Error", "ไม่สามารถโหลดข้อมูลการขายได้", "error");
    } finally {
      setLoading(false);
    }
  }, []);

  const calculateStats = (data) => {
    const totalSales = data.reduce(
      (sum, order) => sum + parseFloat(order.TotalPrice || 0),
      0
    );
    const totalOrders = data.length;
    const pickup = data.filter((o) => o.deliveryMethod === "pickup").length;
    const delivery = data.filter((o) => o.deliveryMethod === "delivery").length;
    setStats({ totalSales, totalOrders, pickup, delivery });
  };

  const filteredAndSortedOrders = useMemo(() => {
    let tempOrders = [...orders];
    if (searchTerm) {
      const lowerSearchTerm = searchTerm.toLowerCase();
      tempOrders = tempOrders.filter(
        (o) =>
          o.InvoiceID.toLowerCase().includes(lowerSearchTerm) ||
          o.CustName?.toLowerCase().includes(lowerSearchTerm) ||
          o.Phone?.includes(searchTerm)
      );
    }
    if (deliveryFilter) {
      tempOrders = tempOrders.filter(
        (o) => o.deliveryMethod === deliveryFilter
      );
    }
    tempOrders.sort((a, b) => {
      switch (sortBy) {
        case "date-asc":
          return new Date(a.orderDate) - new Date(b.orderDate);
        case "amount-desc":
          return parseFloat(b.TotalPrice || 0) - parseFloat(a.TotalPrice || 0);
        case "amount-asc":
          return parseFloat(a.TotalPrice || 0) - parseFloat(b.TotalPrice || 0);
        case "date-desc":
        default:
          return new Date(b.orderDate) - new Date(a.orderDate);
      }
    });
    return tempOrders;
  }, [orders, searchTerm, deliveryFilter, sortBy]);

  const totalPages = Math.ceil(filteredAndSortedOrders.length / itemsPerPage);
  const paginatedOrders = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    return filteredAndSortedOrders.slice(startIndex, endIndex);
  }, [filteredAndSortedOrders, currentPage, itemsPerPage]);

  const handlePageChange = (page) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
    }
  };

  const handleItemsPerPageChange = (event) => {
    setItemsPerPage(parseInt(event.target.value, 10));
    setCurrentPage(1);
  };

  const debouncedSearch = useCallback(
    debounce(() => {
      setCurrentPage(1);
    }, 300),
    []
  );
  useEffect(() => {
    debouncedSearch();
  }, [searchTerm, debouncedSearch]);
  useEffect(() => {
    setCurrentPage(1);
  }, [deliveryFilter, sortBy, itemsPerPage]);

  useEffect(() => {
    fetchSalesData();
  }, [fetchSalesData]);

  const viewOrderDetails = (order) => {
    const details = orderDetails[order.InvoiceID] || [];
    const detailsHtml =
      details.length > 0
        ? details
            .map(
              (d) => `
          <tr>
              <td class="order-detail-cell order-detail-code">${d.Fur_ID}</td>
              <td class="order-detail-cell order-detail-product">
                  <img src="${d.image_url || "/placeholder.jpg"}" alt="${
                d.Fur_name || "N/A"
              }" class="order-detail-image"/>
                  <span class="order-detail-product-name">${
                    d.Fur_name || "N/A"
                  }</span>
              </td>
              <td class="order-detail-cell order-detail-qty">${d.Qty}</td>
              <td class="order-detail-cell order-detail-price">${parseFloat(
                d.Price || 0
              ).toLocaleString("th-TH", { minimumFractionDigits: 2 })}</td>
              <td class="order-detail-cell order-detail-total">${(
                parseFloat(d.Price || 0) * parseInt(d.Qty || 0)
              ).toLocaleString("th-TH", { minimumFractionDigits: 2 })}</td>
          </tr>
       `
            )
            .join("")
        : '<tr><td colspan="5" class="order-detail-no-data">ไม่พบรายละเอียดสินค้า</td></tr>';

    Swal.fire({
      title: `<div class="order-detail-title"><i class="fas fa-receipt order-detail-icon"></i> รายละเอียดออเดอร์ #${order.InvoiceID}</div>`,
      html: `
        <style>
          .order-detail-container {
            text-align: left;
            max-height: 75vh;
            overflow-y: auto;
            padding: 0 8px;
            font-family: 'Kanit', 'Sarabun', sans-serif;
          }
          
          .order-detail-title {
            display: flex;
            align-items: center;
            font-size: 1.25rem;
            color: #1e40af;
          }
          
          .order-detail-icon {
            margin-right: 0.5rem;
            color: #3b82f6;
          }
          
          .order-detail-section {
            margin-bottom: 1.5rem;
            border-radius: 8px;
            overflow: hidden;
          }
          
          .order-detail-section-header {
            display: flex;
            align-items: center;
            padding: 0.75rem 1rem;
            background-color: #f0f9ff;
            border-left: 4px solid #3b82f6;
            border-radius: 4px;
            margin-bottom: 0.75rem;
            font-weight: 500;
            color: #1e40af;
          }
          
          .order-detail-section-icon {
            margin-right: 0.5rem;
            color: #3b82f6;
          }
          
          .order-detail-info-table {
            width: 100%;
            margin-bottom: 1rem;
            border-collapse: collapse;
            border-radius: 4px;
            overflow: hidden;
            box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
          }
          
          .order-detail-info-table th, .order-detail-info-table td {
            padding: 0.625rem 1rem;
            border: 1px solid #e5e7eb;
          }
          
          .order-detail-info-table th {
            width: 30%;
            background-color: #f9fafb;
            font-weight: 500;
            color: #4b5563;
          }
          
          .order-detail-info-table td {
            background-color: #fff;
          }
          
          .order-detail-badge {
            display: inline-flex;
            align-items: center;
            padding: 0.25rem 0.625rem;
            border-radius: 9999px;
            font-size: 0.75rem;
            font-weight: 500;
          }
          
          .order-detail-badge-pickup {
            background-color: #e0f2fe;
            color: #0369a1;
          }
          
          .order-detail-badge-delivery {
            background-color: #fef3c7;
            color: #b45309;
          }
          
          .order-detail-badge-icon {
            margin-right: 0.25rem;
          }
          
          .order-detail-products-table {
            width: 100%;
            border-collapse: collapse;
            box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
            border-radius: 4px;
            overflow: hidden;
          }
          
          .order-detail-products-table thead {
            background-color: #f3f4f6;
          }
          
          .order-detail-products-table th {
            padding: 0.75rem 1rem;
            font-weight: 500;
            color: #374151;
            text-align: left;
            border-bottom: 2px solid #e5e7eb;
          }
          
          .order-detail-products-table th.text-center {
            text-align: center;
          }
          
          .order-detail-products-table th.text-end {
            text-align: right;
          }
          
          .order-detail-cell {
            padding: 0.75rem 1rem;
            border-bottom: 1px solid #e5e7eb;
          }
          
          .order-detail-code {
            font-family: monospace;
            color: #6b7280;
          }
          
          .order-detail-product {
            display: flex;
            align-items: center;
          }
          
          .order-detail-image {
            width: 48px;
            height: 48px;
            object-fit: cover;
            border-radius: 4px;
            margin-right: 0.75rem;
            border: 1px solid #e5e7eb;
            background-color: #f9fafb;
          }
          
          .order-detail-product-name {
            font-weight: 500;
            color: #1f2937;
          }
          
          .order-detail-qty {
            text-align: center;
            font-weight: 500;
          }
          
          .order-detail-price {
            text-align: right;
            color: #6b7280;
          }
          
          .order-detail-total {
            text-align: right;
            font-weight: 500;
            color: #1f2937;
          }
          
          .order-detail-footer {
            display: flex;
            justify-content: flex-end;
            padding: 0.75rem 1rem;
            background-color: #f3f4f6;
            border-top: 2px solid #e5e7eb;
          }
          
          .order-detail-grand-total-label {
            margin-right: 1rem;
            font-weight: 500;
            color: #4b5563;
          }
          
          .order-detail-grand-total-value {
            font-weight: 600;
            color: #1e40af;
            font-size: 1.125rem;
          }
          
          .order-detail-no-data {
            text-align: center;
            padding: 2rem;
            color: #9ca3af;
            font-style: italic;
          }
          
          /* สำหรับ Responsive */
          @media (max-width: 640px) {
            .order-detail-info-table th {
              width: 40%;
            }
            
            .order-detail-product {
              flex-direction: column;
              align-items: flex-start;
            }
            
            .order-detail-image {
              margin-bottom: 0.5rem;
              margin-right: 0;
            }
          }
        </style>
        
        <div class="order-detail-container">
          <div class="order-detail-section">
            <h6 class="order-detail-section-header">
              <i class="fas fa-user order-detail-section-icon"></i>ข้อมูลลูกค้า
            </h6>
            <table class="order-detail-info-table">
              <tbody>
                <tr>
                  <th>ชื่อ:</th>
                  <td>${order.CustName || "-"}</td>
                </tr>
                <tr>
                  <th>โทรศัพท์:</th>
                  <td>${order.Phone || "-"}</td>
                </tr>
                <tr>
                  <th>ที่อยู่:</th>
                  <td>${order.Address || "-"}</td>
                </tr>
                <tr>
                  <th>วันที่สั่ง:</th>
                  <td>${new Date(order.orderDate).toLocaleDateString("th-TH", {
                    year: "numeric",
                    month: "long",
                    day: "numeric",
                  })}</td>
                </tr>
                <tr>
                  <th>การจัดส่ง:</th>
                  <td>
                    <span class="order-detail-badge ${
                      order.deliveryMethod === "pickup"
                        ? "order-detail-badge-pickup"
                        : "order-detail-badge-delivery"
                    }">
                      <i class="fas ${
                        order.deliveryMethod === "pickup"
                          ? "fa-store"
                          : "fa-truck"
                      } order-detail-badge-icon"></i>
                      ${
                        order.deliveryMethod === "pickup"
                          ? "รับที่ร้าน"
                          : "จัดส่ง"
                      }
                    </span>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
  
          <div class="order-detail-section">
            <h6 class="order-detail-section-header">
              <i class="fas fa-box-open order-detail-section-icon"></i>รายการสินค้า
            </h6>
            <div class="order-detail-products-wrapper">
              <table class="order-detail-products-table">
                <thead>
                  <tr>
                    <th>รหัส</th>
                    <th>สินค้า</th>
                    <th class="text-center">จำนวน</th>
                    <th class="text-end">ราคา/หน่วย (฿)</th>
                    <th class="text-end">รวม (฿)</th>
                  </tr>
                </thead>
                <tbody>
                  ${detailsHtml}
                </tbody>
                <tfoot>
                  <tr>
                    <td colspan="5" class="order-detail-footer">
                      <span class="order-detail-grand-total-label">ยอดรวมสุทธิ:</span>
                      <span class="order-detail-grand-total-value">${parseFloat(
                        order.TotalPrice || 0
                      ).toLocaleString("th-TH", {
                        minimumFractionDigits: 2,
                      })} บาท</span>
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>
        </div>
        `,
      width: "90%",
      padding: "1rem",
      customClass: {
        container: "order-detail-modal-container",
        popup: "order-detail-modal-popup",
        header: "order-detail-modal-header",
        title: "order-detail-modal-title",
        closeButton: "order-detail-modal-close",
        content: "order-detail-modal-content",
        confirmButton: "order-detail-modal-confirm-btn",
      },
      showCloseButton: true,
      confirmButtonText: '<i class="fas fa-times me-1"></i>ปิด',
      confirmButtonColor: "#3b82f6",
      focusConfirm: false,
      buttonsStyling: true,
    });
  };

  const styles = {
    container: {
      marginBottom: "3rem",
    },
    rowContainer: {
      display: "flex",
      flexWrap: "wrap",
      margin: "0 -0.75rem 1.5rem -0.75rem",
      gap: "1rem",
    },
    statCol: {
      flex: "1 0 21%",
      padding: "0 0.75rem",
      minWidth: "250px",
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
      backgroundColor: "#f8f9fa",
      borderBottom: "1px solid rgba(0, 0, 0, 0.125)",
    },
    cardTitle: {
      margin: "0",
      fontSize: "0.875rem",
      fontWeight: "500",
    },
    cardIcon: {
      marginRight: "0.5rem",
    },
    cardBody: {
      flex: "1 1 auto",
      padding: "1.25rem",
    },
    filtersContainer: {
      display: "flex",
      flexWrap: "wrap",
      padding: "1rem",
      backgroundColor: "#f8f9fa",
      borderRadius: "0.25rem",
      marginBottom: "1rem",
      gap: "0.5rem",
    },
    filterRow: {
      display: "flex",
      flexWrap: "wrap",
      width: "100%",
      alignItems: "center",
      gap: "0.5rem",
    },
    filterCol: {
      flex: "1 0 auto",
      minWidth: "200px",
    },
    formControl: {
      display: "block",
      width: "80%",
      padding: "0.25rem 0.5rem",
      fontSize: "0.875rem",
      fontWeight: "400",
      lineHeight: "1.5",
      color: "#212529",
      backgroundColor: "#fff",
      backgroundClip: "padding-box",
      border: "1px solid #ced4da",
      borderRadius: "0.2rem",
      transition: "border-color .15s ease-in-out,box-shadow .15s ease-in-out",
    },
    formSelect: {
      display: "block",
      width: "100%",
      padding: "0.25rem 0.5rem",
      fontSize: "0.875rem",
      fontWeight: "400",
      lineHeight: "1.5",
      color: "#212529",
      backgroundColor: "#fff",
      backgroundImage: `url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 16 16'%3e%3cpath fill='none' stroke='%23343a40' stroke-linecap='round' stroke-linejoin='round' stroke-width='2' d='M2 5l6 6 6-6'/%3e%3c/svg%3e")`,
      backgroundRepeat: "no-repeat",
      backgroundPosition: "right 0.5rem center",
      backgroundSize: "16px 12px",
      border: "1px solid #ced4da",
      borderRadius: "0.2rem",
      appearance: "none",
    },
    tableContainer: {
      overflowX: "auto",
    },
    table: {
      width: "100%",
      marginBottom: "1rem",
      color: "#212529",
      verticalAlign: "middle",
      borderColor: "#dee2e6",
      captionSide: "bottom",
      borderCollapse: "collapse",
    },
    tableHeader: {
      backgroundColor: "#f8f9fa",
    },
    tableHeaderCell: {
      padding: "0.5rem",
      borderBottom: "2px solid #dee2e6",
      verticalAlign: "bottom",
      fontWeight: "500",
    },
    tableCell: {
      padding: "0.5rem",
      borderBottom: "1px solid #dee2e6",
    },
    tableCellCenter: {
      padding: "0.5rem",
      borderBottom: "1px solid #dee2e6",
      textAlign: "center",
    },
    tableCellRight: {
      padding: "0.5rem",
      borderBottom: "1px solid #dee2e6",
      textAlign: "right",
    },
    tableRow: {
      cursor: "pointer",
      "&:hover": {
        backgroundColor: "rgba(0, 0, 0, 0.075)",
      },
    },
    badge: {
      display: "inline-block",
      padding: "0.25em 0.4em",
      fontSize: "75%",
      fontWeight: "700",
      lineHeight: "1",
      textAlign: "center",
      whiteSpace: "nowrap",
      verticalAlign: "baseline",
      borderRadius: "0.25rem",
    },
    badgeInfo: {
      color: "#fff",
      backgroundColor: "#0dcaf0",
    },
    badgeWarning: {
      color: "#212529",
      backgroundColor: "#ffc107",
    },
    btn: {
      display: "inline-block",
      fontWeight: "400",
      textAlign: "center",
      verticalAlign: "middle",
      userSelect: "none",
      border: "1px solid transparent",
      padding: "0.25rem 0.5rem",
      fontSize: "0.875rem",
      lineHeight: "1.5",
      borderRadius: "0.2rem",
      transition:
        "color .15s ease-in-out,background-color .15s ease-in-out,border-color .15s ease-in-out,box-shadow .15s ease-in-out",
      cursor: "pointer",
    },
    btnOutlinePrimary: {
      color: "#0d6efd",
      borderColor: "#0d6efd",
      backgroundColor: "transparent",
      "&:hover": {
        color: "#fff",
        backgroundColor: "#0d6efd",
        borderColor: "#0d6efd",
      },
    },
    paginationContainer: {
      marginTop: "1rem",
      display: "flex",
      justifyContent: "center",
    },
    pagination: {
      display: "flex",
      paddingLeft: "0",
      listStyle: "none",
      flexWrap: "wrap",
    },
    pageItem: {
      margin: "0 0.25rem",
    },
    pageLink: {
      position: "relative",
      display: "block",
      padding: "0.375rem 0.75rem",
      lineHeight: "1.25",
      color: "#0d6efd",
      backgroundColor: "#fff",
      border: "1px solid #dee2e6",
      cursor: "pointer",
      borderRadius: "0.25rem",
    },
    pageLinkActive: {
      color: "#fff",
      backgroundColor: "#0d6efd",
      borderColor: "#0d6efd",
    },
    pageLinkDisabled: {
      color: "#6c757d",
      backgroundColor: "#fff",
      borderColor: "#dee2e6",
      cursor: "not-allowed",
    },
    icon: {
      marginRight: "0.25rem",
    },
    noDataText: {
      textAlign: "center",
      color: "#6c757d",
      padding: "2rem 0",
    },
  };

  const Pagination = () => {
    if (totalPages <= 1) return null;

    const pageNumbers = [];
    const maxPagesToShow = 5;
    let startPage, endPage;

    if (totalPages <= maxPagesToShow) {
      startPage = 1;
      endPage = totalPages;
    } else {
      const maxPagesBeforeCurrent = Math.floor(maxPagesToShow / 2);
      const maxPagesAfterCurrent = Math.ceil(maxPagesToShow / 2) - 1;
      if (currentPage <= maxPagesBeforeCurrent) {
        startPage = 1;
        endPage = maxPagesToShow;
      } else if (currentPage + maxPagesAfterCurrent >= totalPages) {
        startPage = totalPages - maxPagesToShow + 1;
        endPage = totalPages;
      } else {
        startPage = currentPage - maxPagesBeforeCurrent;
        endPage = currentPage + maxPagesAfterCurrent;
      }
    }

    for (let i = startPage; i <= endPage; i++) {
      pageNumbers.push(i);
    }

    return (
      <nav aria-label="Page navigation" style={styles.paginationContainer}>
        <ul style={styles.pagination}>
          <li style={styles.pageItem}>
            <button
              style={
                currentPage === 1
                  ? { ...styles.pageLink, ...styles.pageLinkDisabled }
                  : styles.pageLink
              }
              onClick={() => handlePageChange(1)}
              disabled={currentPage === 1}
              aria-label="First"
            >
              <i className="fas fa-angle-double-left"></i>
            </button>
          </li>
          <li style={styles.pageItem}>
            <button
              style={
                currentPage === 1
                  ? { ...styles.pageLink, ...styles.pageLinkDisabled }
                  : styles.pageLink
              }
              onClick={() => handlePageChange(currentPage - 1)}
              disabled={currentPage === 1}
              aria-label="Previous"
            >
              <i className="fas fa-angle-left"></i>
            </button>
          </li>
          {startPage > 1 && (
            <li style={styles.pageItem}>
              <span style={{ ...styles.pageLink, ...styles.pageLinkDisabled }}>
                ...
              </span>
            </li>
          )}
          {pageNumbers.map((number) => (
            <li key={number} style={styles.pageItem}>
              <button
                style={
                  currentPage === number
                    ? { ...styles.pageLink, ...styles.pageLinkActive }
                    : styles.pageLink
                }
                onClick={() => handlePageChange(number)}
              >
                {number}
              </button>
            </li>
          ))}
          {endPage < totalPages && (
            <li style={styles.pageItem}>
              <span style={{ ...styles.pageLink, ...styles.pageLinkDisabled }}>
                ...
              </span>
            </li>
          )}
          <li style={styles.pageItem}>
            <button
              style={
                currentPage === totalPages
                  ? { ...styles.pageLink, ...styles.pageLinkDisabled }
                  : styles.pageLink
              }
              onClick={() => handlePageChange(currentPage + 1)}
              disabled={currentPage === totalPages}
              aria-label="Next"
            >
              <i className="fas fa-angle-right"></i>
            </button>
          </li>
          <li style={styles.pageItem}>
            <button
              style={
                currentPage === totalPages
                  ? { ...styles.pageLink, ...styles.pageLinkDisabled }
                  : styles.pageLink
              }
              onClick={() => handlePageChange(totalPages)}
              disabled={currentPage === totalPages}
              aria-label="Last"
            >
              <i className="fas fa-angle-double-right"></i>
            </button>
          </li>
        </ul>
      </nav>
    );
  };

  return (
    <div style={styles.container}>
      {loading && <LoadingSpinner />}

      <div style={styles.rowContainer}>
        <div style={styles.statCol}>
          <StatCard
            title="ยอดขายรวม"
            value={`฿${stats.totalSales.toLocaleString("th-TH", {
              minimumFractionDigits: 2,
            })}`}
            icon="fa-coins"
            color="success"
          />
        </div>
        <div style={styles.statCol}>
          <StatCard
            title="จำนวนออเดอร์"
            value={stats.totalOrders.toLocaleString()}
            icon="fa-file-invoice-dollar"
            color="primary"
          />
        </div>
        <div style={styles.statCol}>
          <StatCard
            title="รับที่ร้าน"
            value={stats.pickup.toLocaleString()}
            icon="fa-store"
            color="info"
          />
        </div>
        <div style={styles.statCol}>
          <StatCard
            title="จัดส่ง"
            value={stats.delivery.toLocaleString()}
            icon="fa-truck"
            color="warning"
          />
        </div>
      </div>

      <div style={styles.card}>
        <div style={styles.cardHeader}>
          <h5 style={styles.cardTitle}>
            <i className="fas fa-history" style={styles.cardIcon}></i>
            ประวัติรายการขาย
          </h5>
        </div>
        <div style={styles.cardBody}>
          <div style={styles.filtersContainer}>
            <div style={styles.filterRow}>
              <div style={{ ...styles.filterCol, maxWidth: "30%" }}>
                <input
                  type="text"
                  style={styles.formControl}
                  placeholder="ค้นหาเลข Order, ชื่อ, เบอร์โทร..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
              <div style={{ ...styles.filterCol, maxWidth: "15%" }}>
                <select
                  style={styles.formSelect}
                  value={deliveryFilter}
                  onChange={(e) => setDeliveryFilter(e.target.value)}
                >
                  <option value="">การจัดส่งทั้งหมด</option>
                  <option value="pickup">รับที่ร้าน</option>
                  <option value="delivery">จัดส่ง</option>
                </select>
              </div>
              <div style={{ ...styles.filterCol, maxWidth: "25%" }}>
                <select
                  style={styles.formSelect}
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                >
                  <option value="date-desc">วันที่ (ล่าสุด-เก่าสุด)</option>
                  <option value="date-asc">วันที่ (เก่าสุด-ล่าสุด)</option>
                  <option value="amount-desc">ยอดรวม (มาก-น้อย)</option>
                  <option value="amount-asc">ยอดรวม (น้อย-มาก)</option>
                </select>
              </div>
              <div style={{ ...styles.filterCol, maxWidth: "15%" }}>
                <select
                  style={styles.formSelect}
                  value={itemsPerPage}
                  onChange={handleItemsPerPageChange}
                >
                  <option value="10">แสดง 10 รายการ</option>
                  <option value="25">แสดง 25 รายการ</option>
                  <option value="50">แสดง 50 รายการ</option>
                  <option value="100">แสดง 100 รายการ</option>
                </select>
              </div>
            </div>
          </div>

          <div style={styles.tableContainer}>
            <table style={styles.table}>
              <thead style={styles.tableHeader}>
                <tr>
                  <th style={styles.tableHeaderCell}>เลขที่ออเดอร์</th>
                  <th style={styles.tableHeaderCell}>วันที่</th>
                  <th style={styles.tableHeaderCell}>ลูกค้า</th>
                  <th style={styles.tableHeaderCell}>เบอร์โทร</th>
                  <th style={styles.tableHeaderCell}>การจัดส่ง</th>
                  <th
                    style={{ ...styles.tableHeaderCell, textAlign: "center" }}
                  >
                    จำนวนสินค้า
                  </th>
                  <th style={{ ...styles.tableHeaderCell, textAlign: "right" }}>
                    ยอดรวม (฿)
                  </th>
                  <th
                    style={{ ...styles.tableHeaderCell, textAlign: "center" }}
                  >
                    รายละเอียดออเดอร์
                  </th>
                </tr>
              </thead>
              <tbody>
                {paginatedOrders.length > 0 ? (
                  paginatedOrders.map((order) => {
                    const detailsCount =
                      orderDetails[order.InvoiceID]?.reduce(
                        (sum, d) => sum + parseInt(d.Qty || 0),
                        0
                      ) || 0;
                    return (
                      <tr key={order.InvoiceID} style={styles.tableRow}>
                        <td style={styles.tableCell}>{order.InvoiceID}</td>
                        <td style={styles.tableCell}>
                          {new Date(order.orderDate).toLocaleDateString(
                            "th-TH"
                          )}
                        </td>
                        <td style={styles.tableCell}>
                          {order.CustName || "-"}
                        </td>
                        <td style={styles.tableCell}>{order.Phone || "-"}</td>
                        <td style={styles.tableCell}>
                          <span
                            style={
                              order.deliveryMethod === "pickup"
                                ? { ...styles.badge, ...styles.badgeInfo }
                                : { ...styles.badge, ...styles.badgeWarning }
                            }
                          >
                            <i
                              className={`fas ${
                                order.deliveryMethod === "pickup"
                                  ? "fa-store"
                                  : "fa-truck"
                              }`}
                              style={styles.icon}
                            ></i>
                            {order.deliveryMethod === "pickup"
                              ? "รับที่ร้าน"
                              : "จัดส่ง"}
                          </span>
                        </td>
                        <td style={styles.tableCellCenter}>{detailsCount}</td>
                        <td style={styles.tableCellRight}>
                          {parseFloat(order.TotalPrice || 0).toLocaleString(
                            "th-TH",
                            { minimumFractionDigits: 2 }
                          )}
                        </td>
                        <td style={styles.tableCellCenter}>
                          <button
                            style={{
                              ...styles.btn,
                              ...styles.btnOutlinePrimary,
                            }}
                            title="ดูรายละเอียด"
                            onClick={() => viewOrderDetails(order)}
                          >
                            <i className="fas fa-eye"></i>
                          </button>
                        </td>
                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td colSpan="8" style={styles.noDataText}>
                      ไม่พบข้อมูลรายการขาย
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
          <div>
            <Pagination />
          </div>
        </div>
      </div>
    </div>
  );
}
