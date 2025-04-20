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
            <td>${d.Fur_ID}</td>
            <td class="d-flex align-items-center">
                 <img src="${d.image_url || "/placeholder.jpg"}" alt="${
                d.Fur_name || "N/A"
              }" width="40" height="40" class="img-thumbnail me-2" style="object-fit: cover;"/>
                 <span>${d.Fur_name || "N/A"}</span>
             </td>
            <td class="text-center">${d.Qty}</td>
            <td class="text-end">${parseFloat(d.Price || 0).toLocaleString(
              "th-TH",
              { minimumFractionDigits: 2 }
            )}</td>
            <td class="text-end fw-bold">${(
              parseFloat(d.Price || 0) * parseInt(d.Qty || 0)
            ).toLocaleString("th-TH", { minimumFractionDigits: 2 })}</td>
        </tr>
     `
            )
            .join("")
        : '<tr><td colspan="5" class="text-center text-muted">ไม่พบรายละเอียดสินค้า</td></tr>';

    Swal.fire({
      title: `รายละเอียดออเดอร์ #${order.InvoiceID}`,
      html: `
        <div class="text-start" style="max-height: 70vh; overflow-y: auto;">
            <h6><i class="fas fa-user me-2"></i>ข้อมูลลูกค้า</h6>
            <table class="table table-sm table-bordered mb-3">
                <tbody>
                    <tr><th style="width: 120px;">ชื่อ:</th><td>${
                      order.CustName || "-"
                    }</td></tr>
                    <tr><th>โทรศัพท์:</th><td>${order.Phone || "-"}</td></tr>
                    <tr><th>ที่อยู่:</th><td>${order.Address || "-"}</td></tr>
                    <tr><th>วันที่สั่ง:</th><td>${new Date(
                      order.orderDate
                    ).toLocaleDateString("th-TH", {
                      year: "numeric",
                      month: "long",
                      day: "numeric",
                    })}</td></tr>
                    <tr><th>การจัดส่ง:</th><td><span class="badge ${
                      order.deliveryMethod === "pickup"
                        ? "bg-info"
                        : "bg-warning text-dark"
                    }"><i class="fas ${
        order.deliveryMethod === "pickup" ? "fa-store" : "fa-truck"
      } me-1"></i>${
        order.deliveryMethod === "pickup" ? "รับที่ร้าน" : "จัดส่ง"
      }</span></td></tr>
                </tbody>
            </table>

            <h6><i class="fas fa-list me-2"></i>รายการสินค้า</h6>
            <div class="table-responsive">
                <table class="table table-sm table-bordered">
                    <thead class="table-light">
                        <tr><th>รหัส</th><th>สินค้า</th><th class="text-center">จำนวน</th><th class="text-end">ราคา/หน่วย (฿)</th><th class="text-end">รวม (฿)</th></tr>
                    </thead>
                    <tbody>${detailsHtml}</tbody>
                    <tfoot>
                        <tr class="table-light">
                            <td colspan="4" class="text-end fw-bold">ยอดรวมสุทธิ:</td>
                            <td class="text-end fw-bold fs-6">${parseFloat(
                              order.TotalPrice || 0
                            ).toLocaleString("th-TH", {
                              minimumFractionDigits: 2,
                            })} บาท</td>
                        </tr>
                    </tfoot>
                </table>
            </div>
        </div>
        `,
      width: "90%",
      customClass: {
        popup: "swal2-popup-wide",
      },
      confirmButtonText: '<i class="fas fa-times me-1"></i>ปิด',
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
      width: "100%",
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
                    การกระทำ
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
