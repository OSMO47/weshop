// app/(admin)/stock/page.js
'use client';

import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import Swal from 'sweetalert2';
import Link from 'next/link';
import StatCard from '@/components/StatCard'; // Import StatCard
import LoadingSpinner from '@/components/LoadingSpinner'; // Import LoadingSpinner
import Image from 'next/image'; // Use Next.js Image for optimization

// Utility function (debounce)
function debounce(func, wait) {
  let timeout;
  return function executedFunction(...args) {
    const later = () => { clearTimeout(timeout); func(...args); };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
}

export default function StockPage() {
  const [products, setProducts] = useState([]);
  const [filteredProducts, setFilteredProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [stockFilter, setStockFilter] = useState('all');
  const [sortFilter, setSortFilter] = useState('name-asc');
  const [stats, setStats] = useState({ total: 0, low: 0, inStock: 0, out: 0 });

   // --- Fetch Data ---
   const fetchStockData = useCallback(async () => {
    setLoading(true);
    // FIXME: Add Authentication Check before fetching
    try {
      const response = await axios.get('/api/products'); // Fetch from API route
      setProducts(response.data);
      setFilteredProducts(response.data); // Initialize filter
      calculateStats(response.data);
    } catch (error) {
      console.error('Error loading stock data:', error);
      Swal.fire('Error', 'ไม่สามารถโหลดข้อมูลสต็อกได้', 'error');
    } finally {
      setLoading(false);
    }
  }, []);

   // --- Calculate Stats ---
   const calculateStats = (data) => {
     const total = data.length;
     const low = data.filter(p => parseInt(p.Stocks) > 0 && parseInt(p.Stocks) <= 10).length;
     const out = data.filter(p => parseInt(p.Stocks) === 0).length;
     const inStock = total - low - out; // Or filter > 10
     setStats({ total, low, inStock, out });
   };

  // --- Filter and Sort Logic ---
  const filterAndSortProducts = useCallback(() => {
    let tempProducts = [...products];

    // Filter by search term
    if (searchTerm) {
      const lowerSearchTerm = searchTerm.toLowerCase();
      tempProducts = tempProducts.filter(p =>
        p.Fur_name.toLowerCase().includes(lowerSearchTerm) ||
        p.Fur_ID.toLowerCase().includes(lowerSearchTerm) ||
        p.typename?.toLowerCase().includes(lowerSearchTerm) // Include type if available
      );
    }

    // Filter by stock status
    switch (stockFilter) {
      case 'low':
        tempProducts = tempProducts.filter(p => parseInt(p.Stocks) > 0 && parseInt(p.Stocks) <= 10);
        break;
      case 'out':
        tempProducts = tempProducts.filter(p => parseInt(p.Stocks) === 0);
        break;
      case 'in':
         // Consider 'in stock' as > 10 or just > 0 depending on definition
        tempProducts = tempProducts.filter(p => parseInt(p.Stocks) > 10);
        break;
      // 'all' case needs no filtering here
    }

    // Sort
    tempProducts.sort((a, b) => {
      switch (sortFilter) {
        case 'name-asc': return a.Fur_name.localeCompare(b.Fur_name);
        case 'name-desc': return b.Fur_name.localeCompare(a.Fur_name);
        case 'stock-low': return parseInt(a.Stocks) - parseInt(b.Stocks);
        case 'stock-high': return parseInt(b.Stocks) - parseInt(a.Stocks);
        default: return 0;
      }
    });

    setFilteredProducts(tempProducts);
  }, [products, searchTerm, stockFilter, sortFilter]);

  // Debounced filter execution
  const debouncedFilter = useCallback(debounce(filterAndSortProducts, 300), [filterAndSortProducts]);

  // --- Effects ---
  useEffect(() => {
    // FIXME: Add Authentication Check
    fetchStockData();
  }, [fetchStockData]);

  useEffect(() => {
    debouncedFilter();
  }, [searchTerm, stockFilter, sortFilter, debouncedFilter]);

  // --- Action Handlers ---
  const handleUpdateStock = async (product) => {
    const { Fur_ID, Fur_name, Stocks } = product;
    const currentStock = parseInt(Stocks);

    const { value: formValues } = await Swal.fire({
      title: `อัปเดตสต็อก: ${Fur_name}`,
      html: `
        <div class="text-start">
            <div class="mb-3">
                <label class="form-label">ประเภทการอัปเดต</label>
                <select id="swal-updateType" class="form-select">
                    <option value="set" selected>กำหนดค่าใหม่</option>
                    <option value="add">เพิ่มสต็อก</option>
                    <option value="subtract">ลดสต็อก</option>
                </select>
            </div>
            <div class="mb-3">
                <label class="form-label">จำนวน</label>
                <input type="number" id="swal-quantity" class="form-control" min="0" value="0">
                 <small class="text-muted">ใส่จำนวนที่ต้องการ เพิ่ม/ลด หรือ กำหนดค่าใหม่</small>
            </div>
        </div>`,
      focusConfirm: false,
      showCancelButton: true,
      confirmButtonText: 'อัปเดต',
      cancelButtonText: 'ยกเลิก',
      preConfirm: () => {
        const updateType = Swal.getPopup().querySelector('#swal-updateType').value;
        const quantity = parseInt(Swal.getPopup().querySelector('#swal-quantity').value);

        if (isNaN(quantity) || quantity < 0) {
          Swal.showValidationMessage('กรุณาใส่จำนวนที่ถูกต้อง (>= 0)');
          return false;
        }

        let newStock;
        if (updateType === 'add') {
          newStock = currentStock + quantity;
        } else if (updateType === 'subtract') {
          newStock = currentStock - quantity;
          if (newStock < 0) {
            Swal.showValidationMessage('สต็อกคงเหลือไม่พอสำหรับการลด');
            return false;
          }
        } else { // 'set'
          newStock = quantity;
        }
        return { newStock };
      }
    });

    if (formValues) {
      setLoading(true);
      // FIXME: Add Authentication Check
      try {
        await axios.put(`/api/products/${Fur_ID}`, { // Endpoint สำหรับ update
          Stocks: formValues.newStock // ส่งค่าสต็อกใหม่
        });
        Swal.fire('สำเร็จ!', 'อัปเดตสต็อกเรียบร้อย', 'success');
        fetchStockData(); // Reload data
      } catch (error) {
        console.error('Error updating stock:', error);
        Swal.fire('ผิดพลาด', 'ไม่สามารถอัปเดตสต็อกได้', 'error');
         setLoading(false);
      }
      // setLoading(false); // ถูกย้ายไปใน finally ของ fetchStockData
    }
  };

  const handleDeleteProduct = async (product) => {
     const { Fur_ID, Fur_name } = product;
     const result = await Swal.fire({
        title: `ลบสินค้า: ${Fur_name}`,
        text: `คุณแน่ใจหรือไม่ว่าต้องการลบสินค้านี้ (${Fur_ID})? การกระทำนี้ไม่สามารถย้อนกลับได้`,
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#d33',
        cancelButtonColor: '#3085d6',
        confirmButtonText: 'ใช่, ลบเลย!',
        cancelButtonText: 'ยกเลิก'
     });

     if (result.isConfirmed) {
         setLoading(true);
         // FIXME: Add Authentication Check
         try {
             await axios.delete(`/api/products/${Fur_ID}`);
             Swal.fire('ลบแล้ว!', 'สินค้าถูกลบเรียบร้อย', 'success');
             fetchStockData(); // Reload data
         } catch (error) {
             console.error('Error deleting product:', error);
             // ตรวจสอบ constraint error
             if (error.response?.data?.error?.includes('foreign key constraint')) {
                  Swal.fire('ผิดพลาด', 'ไม่สามารถลบสินค้าได้เนื่องจากมีการอ้างอิงในรายการขาย', 'error');
             } else {
                  Swal.fire('ผิดพลาด', 'ไม่สามารถลบสินค้าได้', 'error');
             }
              setLoading(false);
         }
          // setLoading(false); // ถูกย้ายไปใน finally ของ fetchStockData
     }
  };

  // --- Stock Status Helper ---
  const getStockStatus = (stock) => {
    const s = parseInt(stock);
    if (s === 0) return { text: 'หมดสต็อก', badge: 'bg-danger', icon: 'fa-times-circle' };
    if (s <= 10) return { text: 'ใกล้หมด', badge: 'bg-warning text-dark', icon: 'fa-exclamation-triangle' };
    return { text: 'มีสินค้า', badge: 'bg-success', icon: 'fa-check-circle' };
  };

  // --- Render ---
  return (
    <div>
      {loading && <LoadingSpinner />}

      {/* Quick Stats */}
      <div className="row mb-4 g-3">
        <div className="col-md-3">
          <StatCard title="สินค้าทั้งหมด" value={stats.total} icon="fa-boxes" color="primary" />
        </div>
        <div className="col-md-3">
          <StatCard title="ใกล้หมด (<10)" value={stats.low} icon="fa-exclamation-triangle" color="warning" />
        </div>
        <div className="col-md-3">
           <StatCard title="มีสินค้า (>10)" value={stats.inStock} icon="fa-check-circle" color="success" />
        </div>
        <div className="col-md-3">
          <StatCard title="หมดสต็อก" value={stats.out} icon="fa-times-circle" color="danger" />
        </div>
      </div>

      {/* Main Card */}
      <div className="card shadow-sm">
        <div className="card-header d-flex justify-content-between align-items-center flex-wrap bg-light">
          <h5 className="mb-0 h6">ภาพรวมสต็อกสินค้า</h5>
           <div className="mt-2 mt-md-0">
              {/* <button className="btn btn-outline-secondary btn-sm me-2">
                <i className="fas fa-file-excel me-1"></i> Export
              </button> */}
              <Link href="/stock/add" className="btn btn-primary btn-sm">
                  <i className="fas fa-plus me-1"></i> เพิ่มสินค้าใหม่
              </Link>
          </div>
        </div>
        <div className="card-body">
           {/* Filters */}
           <div className="filters bg-light p-3 rounded mb-3">
              <div className="row g-2">
                 <div className="col-md-4">
                     <input
                         type="text"
                         className="form-control form-control-sm"
                         placeholder="ค้นหาด้วยชื่อ, ID, ประเภท..."
                         value={searchTerm}
                         onChange={(e) => setSearchTerm(e.target.value)}
                     />
                 </div>
                 <div className="col-md-4">
                      <select className="form-select form-select-sm" value={stockFilter} onChange={(e) => setStockFilter(e.target.value)}>
                         <option value="all">สถานะสต็อกทั้งหมด</option>
                         <option value="in">มีสินค้า (10)</option>
                         <option value="low">ใกล้หมด (1-10)</option>
                         <option value="out">หมดสต็อก (0)</option>
                      </select>
                 </div>
                 <div className="col-md-4">
                     <select className="form-select form-select-sm" value={sortFilter} onChange={(e) => setSortFilter(e.target.value)}>
                         <option value="name-asc">ชื่อ (ก-ฮ)</option>
                         <option value="name-desc">ชื่อ (ฮ-ก)</option>
                         <option value="stock-low">สต็อก (น้อยไปมาก)</option>
                         <option value="stock-high">สต็อก (มากไปน้อย)</option>
                      </select>
                 </div>
              </div>
           </div>

           {/* Table */}
           <div className="table-responsive">
                <table className="table table-hover align-middle table-sm">
                    <thead className="table-light">
                        <tr>
                            <th>รูปภาพ</th>
                            <th>ID</th>
                            <th>ชื่อสินค้า</th>
                            <th>ประเภท</th>
                            <th className="text-center">สต็อก</th>
                            <th className="text-center">สถานะ</th>
                            <th className="text-center">การกระทำ</th>
                        </tr>
                    </thead>
                    <tbody>
                        {filteredProducts.length > 0 ? (
                            filteredProducts.map(product => {
                                const status = getStockStatus(product.Stocks);
                                return (
                                    <tr key={product.Fur_ID}>
                                        <td>
                                            <Image
                                                src={product.image_url || '/placeholder.jpg'} // ใช้ placeholder ถ้าไม่มีรูป
                                                alt={product.Fur_name}
                                                width={50}
                                                height={50}
                                                className="img-thumbnail"
                                                style={{ objectFit: 'cover' }}
                                                onError={(e) => { e.target.src = '/placeholder.jpg'; }} // Fallback เพิ่มเติม
                                            />
                                        </td>
                                        <td>{product.Fur_ID}</td>
                                        <td>{product.Fur_name}</td>
                                        <td>{product.typename || '-'}</td> {/* แสดงชื่อประเภท */}
                                        <td className="text-center">{product.Stocks}</td>
                                        <td className="text-center">
                                            <span className={`badge ${status.badge}`}>
                                                <i className={`fas ${status.icon} me-1`}></i>{status.text}
                                            </span>
                                        </td>
                                        <td className="text-center">
                                            <button
                                                className="btn btn-outline-primary btn-sm me-1"
                                                title="แก้ไขสต็อก"
                                                onClick={() => handleUpdateStock(product)}>
                                                <i className="fas fa-edit"></i>
                                            </button>
                                            <button
                                                className="btn btn-outline-danger btn-sm"
                                                title="ลบสินค้า"
                                                onClick={() => handleDeleteProduct(product)}>
                                                <i className="fas fa-trash-alt"></i>
                                            </button>
                                             {/* อาจเพิ่มปุ่มดูรายละเอียดสินค้า */}
                                        </td>
                                    </tr>
                                );
                            })
                        ) : (
                            <tr>
                                <td colSpan="7" className="text-center text-muted py-4">
                                    ไม่พบข้อมูลสินค้า
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
              {/* อาจเพิ่ม Pagination ถ้าข้อมูลเยอะ */}
        </div>
      </div>
    </div>
  );
}