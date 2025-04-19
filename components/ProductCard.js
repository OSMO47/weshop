// components/ProductCard.js
import React from 'react';
import Image from 'next/image'; // ใช้ Next.js Image

export default function ProductCard({ product, onBuyClick }) {
  const stock = parseInt(product.Stocks || 0);
  const isOutOfStock = stock === 0;
  const price = parseFloat(product.Prices || 0);

  return (
    <div className="card h-100 shadow-sm product-card border-0">
      <div className="position-relative" style={{ height: '200px' }}> {/* กำหนดความสูงคงที่ */}
         {stock > 0 ? (
            <span className="badge bg-success position-absolute top-0 end-0 m-2" style={{zIndex: 1}}>
                <i className="fas fa-check-circle me-1"></i>พร้อมจำหน่าย
            </span>
         ) : (
             <span className="badge bg-danger position-absolute top-0 end-0 m-2" style={{zIndex: 1}}>
                 <i className="fas fa-times-circle me-1"></i>สินค้าหมด
             </span>
         )}
        <Image
          src={product.image_url || '/placeholder.jpg'}
          alt={product.Fur_name}
          fill // ใช้ fill เพื่อให้ Image component จัดการขนาดเอง
          style={{ objectFit: 'cover' }} // จัดรูปภาพให้เต็ม card โดยไม่เสียสัดส่วน
          className="card-img-top"
          sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw" // Responsive sizes
          onError={(e) => { e.target.src = '/placeholder.jpg'; }} // Fallback เพิ่มเติม
        />
      </div>
      <div className="card-body d-flex flex-column">
        <h5 className="card-title fs-6 fw-bold mb-1 text-truncate">{product.Fur_name}</h5>
        <div className="small text-muted mb-2">
            <span className="me-2"><i className="fas fa-tag me-1"></i>{product.typename || 'N/A'}</span>
            <span><i className="fas fa-cube me-1"></i>{product.matname || 'N/A'}</span>
        </div>
        <div className="mt-auto"> {/* ดันราคาและปุ่มลงล่าง */}
            <p className="card-text fs-5 fw-bold text-success mb-2">฿{price.toLocaleString('th-TH', { minimumFractionDigits: 2 })}</p>
            <button
                className={`btn btn-primary w-100 btn-sm ${isOutOfStock ? 'disabled' : ''}`}
                onClick={() => !isOutOfStock && onBuyClick(product)}
                disabled={isOutOfStock}
                >
                <i className={`fas ${isOutOfStock ? 'fa-times' : 'fa-shopping-cart'} me-1`}></i>
                {isOutOfStock ? 'สินค้าหมด' : 'สั่งซื้อ'}
            </button>
        </div>
      </div>
    </div>
  );
}