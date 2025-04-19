// app/(admin)/stock/add/page.js
'use client';

import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import Swal from 'sweetalert2';
import { useRouter } from 'next/navigation';
import LoadingSpinner from '@/components/LoadingSpinner';
import ImageUpload from '@/components/ImageUpload'; // Import component อัปโหลดรูป

export default function AddProductPage() {
  const [productName, setProductName] = useState('');
  const [productType, setProductType] = useState('');
  const [productMaterial, setProductMaterial] = useState('');
  const [productStock, setProductStock] = useState(0);
  const [productPrice, setProductPrice] = useState(0);
  const [productImage, setProductImage] = useState(null); // เก็บ File object
  const [imagePreview, setImagePreview] = useState(null); // เก็บ Data URL สำหรับ preview
  const [types, setTypes] = useState([]);
  const [materials, setMaterials] = useState([]);
  const [loading, setLoading] = useState(false);
  const [productId, setProductId] = useState(''); // Auto-generated ID
  const router = useRouter();

  // --- Fetch Types, Materials, and New ID ---
  const loadInitialData = useCallback(async () => {
    setLoading(true);
     // FIXME: Add Authentication Check
    try {
      const [typesRes, materialsRes, productsRes] = await Promise.all([
        axios.get('/api/types'),
        axios.get('/api/materials'),
        axios.get('/api/products') // Get all products to determine next ID
      ]);

      setTypes(typesRes.data);
      setMaterials(materialsRes.data);

      // Generate next ID (simple example, might need refinement)
      let maxIdNum = 0;
      if (productsRes.data.length > 0) {
        const ids = productsRes.data.map(p => parseInt(p.Fur_ID.replace('F', ''), 10)).filter(n => !isNaN(n));
        if (ids.length > 0) {
             maxIdNum = Math.max(...ids);
        }
      }
      setProductId(`F${String(maxIdNum + 1).padStart(3, '0')}`);

    } catch (error) {
      console.error('Error loading initial data:', error);
      Swal.fire('Error', 'ไม่สามารถโหลดข้อมูลสำหรับฟอร์มได้', 'error');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadInitialData();
  }, [loadInitialData]);

  // --- Image Handling ---
  const handleImageChange = (file) => {
    if (file) {
        // Validation (optional but recommended)
        if (!file.type.startsWith('image/')) {
            Swal.fire('ผิดพลาด', 'กรุณาเลือกไฟล์รูปภาพเท่านั้น', 'error');
            return;
        }
        if (file.size > 5 * 1024 * 1024) { // 5MB Limit
             Swal.fire('ผิดพลาด', 'ขนาดไฟล์ต้องไม่เกิน 5MB', 'error');
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

  // --- Form Submission ---
  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!productImage) {
        Swal.fire('Error', 'กรุณาเลือกรูปภาพสินค้า', 'warning');
        return;
    }
    if (!productType || !productMaterial) {
         Swal.fire('Error', 'กรุณาเลือกประเภทและวัสดุ', 'warning');
         return;
    }
     if (productStock < 0 || productPrice <= 0) {
         Swal.fire('Error', 'จำนวนสต็อกและราคาต้องเป็นค่าที่ถูกต้อง', 'warning');
         return;
    }

    setLoading(true);
     // FIXME: Add Authentication Check
    const formData = new FormData();
    formData.append('image', productImage);
    formData.append('Fur_ID', productId);
    formData.append('Fur_name', productName);
    formData.append('Types', productType); // ชื่อ field ตรงกับ API POST
    formData.append('Materials', productMaterial); // ชื่อ field ตรงกับ API POST
    formData.append('Stocks', productStock);
    formData.append('Price', productPrice);

    try {
      const response = await axios.post('/api/products', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      if (response.data.success) {
        await Swal.fire({
            icon: 'success',
            title: 'เพิ่มสินค้าสำเร็จ!',
            text: `สินค้า ${response.data.productId} ถูกเพิ่มในระบบแล้ว`,
            timer: 2000,
            showConfirmButton: false
        });
        router.push('/stock'); // กลับไปหน้า Stock list
      } else {
         // Handle specific errors from API if available
         Swal.fire('ผิดพลาด', response.data.message || 'ไม่สามารถเพิ่มสินค้าได้', 'error');
      }
    } catch (error) {
      console.error('Error adding product:', error);
      Swal.fire('ผิดพลาด', error.response?.data?.message || 'เกิดข้อผิดพลาดในการเชื่อมต่อ', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mt-4 mb-5">
       {loading && <LoadingSpinner />}
       <div className="row justify-content-center">
           <div className="col-md-8">
               <div className="card shadow-sm">
                    <div className="card-header bg-primary text-white">
                        <h5 className="mb-0"><i className="fas fa-plus-circle me-2"></i>เพิ่มสินค้าใหม่</h5>
                    </div>
                    <div className="card-body">
                         <form onSubmit={handleSubmit}>
                            {/* Image Upload Component */}
                            <ImageUpload onImageChange={handleImageChange} previewUrl={imagePreview} />

                            <div className="row g-3 mb-3">
                                <div className="col-md-6">
                                    <label htmlFor="productId" className="form-label">รหัสสินค้า (Auto)</label>
                                    <input type="text" id="productId" className="form-control" value={productId} readOnly disabled />
                                </div>
                                <div className="col-md-6">
                                    <label htmlFor="productName" className="form-label">ชื่อสินค้า <span className="text-danger">*</span></label>
                                    <input type="text" id="productName" className="form-control" value={productName} onChange={(e) => setProductName(e.target.value)} required />
                                </div>
                            </div>

                             <div className="row g-3 mb-3">
                                <div className="col-md-6">
                                    <label htmlFor="productType" className="form-label">ประเภท <span className="text-danger">*</span></label>
                                    <select id="productType" className="form-select" value={productType} onChange={(e) => setProductType(e.target.value)} required>
                                        <option value="" disabled>-- เลือกประเภท --</option>
                                        {types.map(t => <option key={t.id} value={t.id}>{t.typename}</option>)}
                                    </select>
                                </div>
                                <div className="col-md-6">
                                    <label htmlFor="productMaterial" className="form-label">วัสดุ <span className="text-danger">*</span></label>
                                     <select id="productMaterial" className="form-select" value={productMaterial} onChange={(e) => setProductMaterial(e.target.value)} required>
                                        <option value="" disabled>-- เลือกวัสดุ --</option>
                                        {materials.map(m => <option key={m.id} value={m.id}>{m.matname}</option>)}
                                    </select>
                                </div>
                            </div>

                             <div className="row g-3 mb-4">
                                <div className="col-md-6">
                                    <label htmlFor="productStock" className="form-label">จำนวนสต็อกเริ่มต้น <span className="text-danger">*</span></label>
                                    <input type="number" id="productStock" className="form-control" value={productStock} onChange={(e) => setProductStock(Math.max(0, parseInt(e.target.value) || 0))} required min="0" />
                                </div>
                                <div className="col-md-6">
                                    <label htmlFor="productPrice" className="form-label">ราคา (บาท) <span className="text-danger">*</span></label>
                                     <input type="number" id="productPrice" className="form-control" value={productPrice} onChange={(e) => setProductPrice(Math.max(0, parseFloat(e.target.value) || 0))} required min="0.01" step="0.01" />
                                </div>
                            </div>

                             <div className="d-grid gap-2 d-md-flex justify-content-md-end">
                                 <button type="button" className="btn btn-secondary" onClick={() => router.back()}>
                                      <i className="fas fa-times me-1"></i> ยกเลิก
                                 </button>
                                <button type="submit" className="btn btn-primary" disabled={loading}>
                                    <i className={`fas ${loading ? 'fa-spinner fa-spin' : 'fa-save'} me-1`}></i>
                                    {loading ? 'กำลังบันทึก...' : 'บันทึกสินค้า'}
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