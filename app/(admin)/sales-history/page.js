// app/(admin)/sales-history/page.js
'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import axios from 'axios';
import Swal from 'sweetalert2';
import StatCard from '@/components/StatCard';
import LoadingSpinner from '@/components/LoadingSpinner';
import Image from 'next/image';

// Utility function (debounce) - Define it here or import from a utils file
function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => { clearTimeout(timeout); func(...args); };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

export default function SalesHistoryPage() {
  const [orders, setOrders] = useState([]);
  const [orderDetails, setOrderDetails] = useState({}); // Store details keyed by InvoiceID
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [deliveryFilter, setDeliveryFilter] = useState('');
  const [sortBy, setSortBy] = useState('date-desc');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10); // Default items per page
  const [stats, setStats] = useState({ totalSales: 0, totalOrders: 0, pickup: 0, delivery: 0 });

  // --- Fetch Data ---
  const fetchSalesData = useCallback(async () => {
    setLoading(true);
    // FIXME: Add Authentication Check
    try {
        // Fetch main order records (includes customer data based on original API)
        const ordersRes = await axios.get('/api/orders/history');

        // Fetch ALL order details (Consider fetching only needed details later for performance)
        const detailsRes = await axios.get('/api/orders/history/details');

        // Process details into a lookup map
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
      console.error('Error loading sales data:', error);
      Swal.fire('Error', 'ไม่สามารถโหลดข้อมูลการขายได้', 'error');
    } finally {
      setLoading(false);
    }
  }, []);

  // --- Calculate Stats ---
   const calculateStats = (data) => {
     const totalSales = data.reduce((sum, order) => sum + parseFloat(order.TotalPrice || 0), 0);
     const totalOrders = data.length;
     const pickup = data.filter(o => o.deliveryMethod === 'pickup').length;
     const delivery = data.filter(o => o.deliveryMethod === 'delivery').length;
     setStats({ totalSales, totalOrders, pickup, delivery });
   };

  // --- Filtering and Sorting ---
  const filteredAndSortedOrders = useMemo(() => {
    let tempOrders = [...orders];
    if (searchTerm) {
      const lowerSearchTerm = searchTerm.toLowerCase();
      tempOrders = tempOrders.filter(o =>
        o.InvoiceID.toLowerCase().includes(lowerSearchTerm) ||
        o.CustName?.toLowerCase().includes(lowerSearchTerm) ||
        o.Phone?.includes(searchTerm)
      );
    }
    if (deliveryFilter) {
      tempOrders = tempOrders.filter(o => o.deliveryMethod === deliveryFilter);
    }
    tempOrders.sort((a, b) => {
      switch (sortBy) {
        case 'date-asc': return new Date(a.orderDate) - new Date(b.orderDate);
        case 'amount-desc': return parseFloat(b.TotalPrice || 0) - parseFloat(a.TotalPrice || 0);
        case 'amount-asc': return parseFloat(a.TotalPrice || 0) - parseFloat(b.TotalPrice || 0);
        case 'date-desc': default: return new Date(b.orderDate) - new Date(a.orderDate);
      }
    });
    return tempOrders;
  }, [orders, searchTerm, deliveryFilter, sortBy]);

  // --- Pagination Logic ---
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
      setCurrentPage(1); // Reset to first page
  }

  // Debounced search handler
   const debouncedSearch = useCallback(debounce(() => { setCurrentPage(1); /* Trigger re-filter via useMemo */ }, 300), []);
   useEffect(() => { debouncedSearch(); }, [searchTerm, debouncedSearch]);
   useEffect(() => { setCurrentPage(1); }, [deliveryFilter, sortBy, itemsPerPage]); // Reset page on filter/sort/page size change

  // --- Effects ---
  useEffect(() => {
    // FIXME: Add Authentication Check
    fetchSalesData();
  }, [fetchSalesData]);

  // --- View Order Details ---
  const viewOrderDetails = (order) => {
     const details = orderDetails[order.InvoiceID] || [];
     const detailsHtml = details.length > 0 ? details.map(d => `
        <tr>
            <td>${d.Fur_ID}</td>
            <td class="d-flex align-items-center">
                 <img src="${d.image_url || '/placeholder.jpg'}" alt="${d.Fur_name || 'N/A'}" width="40" height="40" class="img-thumbnail me-2" style="object-fit: cover;"/>
                 <span>${d.Fur_name || 'N/A'}</span>
             </td>
            <td class="text-center">${d.Qty}</td>
            <td class="text-end">${parseFloat(d.Price || 0).toLocaleString('th-TH', { minimumFractionDigits: 2 })}</td>
            <td class="text-end fw-bold">${(parseFloat(d.Price || 0) * parseInt(d.Qty || 0)).toLocaleString('th-TH', { minimumFractionDigits: 2 })}</td>
        </tr>
     `).join('') : '<tr><td colspan="5" class="text-center text-muted">ไม่พบรายละเอียดสินค้า</td></tr>';

     Swal.fire({
        title: `รายละเอียดออเดอร์ #${order.InvoiceID}`,
        html: `
        <div class="text-start" style="max-height: 70vh; overflow-y: auto;">
            <h6><i class="fas fa-user me-2"></i>ข้อมูลลูกค้า</h6>
            <table class="table table-sm table-bordered mb-3">
                <tbody>
                    <tr><th style="width: 120px;">ชื่อ:</th><td>${order.CustName || '-'}</td></tr>
                    <tr><th>โทรศัพท์:</th><td>${order.Phone || '-'}</td></tr>
                    <tr><th>ที่อยู่:</th><td>${order.Address || '-'}</td></tr>
                    <tr><th>วันที่สั่ง:</th><td>${new Date(order.orderDate).toLocaleDateString('th-TH', { year: 'numeric', month: 'long', day: 'numeric'})}</td></tr>
                    <tr><th>การจัดส่ง:</th><td><span class="badge ${order.deliveryMethod === 'pickup' ? 'bg-info' : 'bg-warning text-dark'}"><i class="fas ${order.deliveryMethod === 'pickup' ? 'fa-store' : 'fa-truck'} me-1"></i>${order.deliveryMethod === 'pickup' ? 'รับที่ร้าน' : 'จัดส่ง'}</span></td></tr>
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
                            <td class="text-end fw-bold fs-6">${parseFloat(order.TotalPrice || 0).toLocaleString('th-TH', { minimumFractionDigits: 2 })} บาท</td>
                        </tr>
                    </tfoot>
                </table>
            </div>
        </div>
        `,
        width: '90%', // Wider popup
        customClass: {
             popup: 'swal2-popup-wide' // Add custom class if needed for CSS
        },
        confirmButtonText: '<i class="fas fa-times me-1"></i>ปิด',
     });
  };

   // --- Pagination Component ---
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
            <nav aria-label="Page navigation">
                <ul className="pagination justify-content-center flex-wrap">
                    <li className={`page-item ${currentPage === 1 ? 'disabled' : ''}`}>
                        <button className="page-link" onClick={() => handlePageChange(1)} aria-label="First">
                            <i className="fas fa-angle-double-left"></i>
                        </button>
                    </li>
                    <li className={`page-item ${currentPage === 1 ? 'disabled' : ''}`}>
                        <button className="page-link" onClick={() => handlePageChange(currentPage - 1)} aria-label="Previous">
                            <i className="fas fa-angle-left"></i>
                        </button>
                    </li>
                    {startPage > 1 && (
                         <li className="page-item disabled"><span className="page-link">...</span></li>
                    )}
                    {pageNumbers.map(number => (
                        <li key={number} className={`page-item ${currentPage === number ? 'active' : ''}`}>
                            <button className="page-link" onClick={() => handlePageChange(number)}>
                                {number}
                            </button>
                        </li>
                    ))}
                     {endPage < totalPages && (
                         <li className="page-item disabled"><span className="page-link">...</span></li>
                    )}
                    <li className={`page-item ${currentPage === totalPages ? 'disabled' : ''}`}>
                        <button className="page-link" onClick={() => handlePageChange(currentPage + 1)} aria-label="Next">
                            <i className="fas fa-angle-right"></i>
                        </button>
                    </li>
                     <li className={`page-item ${currentPage === totalPages ? 'disabled' : ''}`}>
                        <button className="page-link" onClick={() => handlePageChange(totalPages)} aria-label="Last">
                            <i className="fas fa-angle-double-right"></i>
                        </button>
                    </li>
                </ul>
            </nav>
        );
   };

  // --- Render ---
  return (
    <div className="mb-5">
       {loading && <LoadingSpinner />}

       {/* Stats */}
        <div className="row mb-4 g-3">
            <div className="col-md-3">
                <StatCard title="ยอดขายรวม" value={`฿${stats.totalSales.toLocaleString('th-TH', { minimumFractionDigits: 2 })}`} icon="fa-coins" color="success" />
            </div>
            <div className="col-md-3">
                <StatCard title="จำนวนออเดอร์" value={stats.totalOrders.toLocaleString()} icon="fa-file-invoice-dollar" color="primary" />
            </div>
            <div className="col-md-3">
                <StatCard title="รับที่ร้าน" value={stats.pickup.toLocaleString()} icon="fa-store" color="info" />
            </div>
            <div className="col-md-3">
                <StatCard title="จัดส่ง" value={stats.delivery.toLocaleString()} icon="fa-truck" color="warning" />
            </div>
        </div>

       {/* Main Card */}
        <div className="card shadow-sm">
            <div className="card-header bg-light">
                <h5 className="mb-0 h6"><i className="fas fa-history me-2"></i>ประวัติรายการขาย</h5>
            </div>
             <div className="card-body">
                 {/* Filters */}
                 <div className="filters bg-light p-3 rounded mb-3">
                    <div className="row g-2 align-items-center">
                        <div className="col-md-4">
                             <input
                                type="text"
                                className="form-control form-control-sm"
                                placeholder="ค้นหาเลข Order, ชื่อ, เบอร์โทร..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                             />
                        </div>
                         <div className="col-md-2">
                            <select className="form-select form-select-sm" value={deliveryFilter} onChange={(e) => setDeliveryFilter(e.target.value)}>
                                <option value="">การจัดส่งทั้งหมด</option>
                                <option value="pickup">รับที่ร้าน</option>
                                <option value="delivery">จัดส่ง</option>
                            </select>
                        </div>
                         <div className="col-md-3">
                             <select className="form-select form-select-sm" value={sortBy} onChange={(e) => setSortBy(e.target.value)}>
                                <option value="date-desc">วันที่ (ล่าสุด-เก่าสุด)</option>
                                <option value="date-asc">วันที่ (เก่าสุด-ล่าสุด)</option>
                                <option value="amount-desc">ยอดรวม (มาก-น้อย)</option>
                                <option value="amount-asc">ยอดรวม (น้อย-มาก)</option>
                             </select>
                        </div>
                         <div className="col-md-2">
                            <select className="form-select form-select-sm" value={itemsPerPage} onChange={handleItemsPerPageChange}>
                                <option value="10">แสดง 10 รายการ</option>
                                <option value="25">แสดง 25 รายการ</option>
                                <option value="50">แสดง 50 รายการ</option>
                                <option value="100">แสดง 100 รายการ</option>
                             </select>
                         </div>
                          {/* Optional: Export Button */}
                         {/* <div className="col-md-1 text-end">
                             <button className="btn btn-outline-secondary btn-sm" title="Export to Excel">
                                 <i className="fas fa-file-excel"></i>
                             </button>
                         </div> */}
                    </div>
                 </div>

                 {/* Table */}
                 <div className="table-responsive">
                    <table className="table table-sm table-hover align-middle">
                        <thead className="table-light">
                             <tr>
                                <th>เลขที่ออเดอร์</th>
                                <th>วันที่</th>
                                <th>ลูกค้า</th>
                                <th>เบอร์โทร</th>
                                <th>การจัดส่ง</th>
                                <th className="text-center">จำนวนสินค้า</th>
                                <th className="text-end">ยอดรวม (฿)</th>
                                <th className="text-center">การกระทำ</th>
                             </tr>
                        </thead>
                         <tbody>
                            {paginatedOrders.length > 0 ? (
                                paginatedOrders.map(order => {
                                    const detailsCount = orderDetails[order.InvoiceID]?.reduce((sum, d) => sum + parseInt(d.Qty || 0), 0) || 0;
                                    return (
                                        <tr key={order.InvoiceID}>
                                            <td>{order.InvoiceID}</td>
                                            <td>{new Date(order.orderDate).toLocaleDateString('th-TH')}</td>
                                            <td>{order.CustName || '-'}</td>
                                            <td>{order.Phone || '-'}</td>
                                            <td>
                                                <span className={`badge ${order.deliveryMethod === 'pickup' ? 'bg-info' : 'bg-warning text-dark'}`}>
                                                    <i className={`fas ${order.deliveryMethod === 'pickup' ? 'fa-store' : 'fa-truck'} me-1`}></i>
                                                    {order.deliveryMethod === 'pickup' ? 'รับที่ร้าน' : 'จัดส่ง'}
                                                </span>
                                            </td>
                                            <td className="text-center">{detailsCount}</td>
                                            <td className="text-end">{parseFloat(order.TotalPrice || 0).toLocaleString('th-TH', { minimumFractionDigits: 2 })}</td>
                                            <td className="text-center">
                                                <button className="btn btn-outline-primary btn-sm" title="ดูรายละเอียด" onClick={() => viewOrderDetails(order)}>
                                                    <i className="fas fa-eye"></i>
                                                </button>
                                                 {/* อาจเพิ่มปุ่มอื่นๆ เช่น พิมพ์ใบเสร็จ */}
                                            </td>
                                        </tr>
                                    );
                                })
                            ) : (
                                <tr>
                                    <td colSpan="8" className="text-center text-muted py-4">
                                        ไม่พบข้อมูลรายการขาย
                                    </td>
                                </tr>
                            )}
                         </tbody>
                    </table>
                 </div>
                 {/* Pagination */}
                 <div className="mt-3">
                     <Pagination />
                 </div>
             </div>
        </div>
    </div>
  );
}