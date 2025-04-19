// components/Navbar.js
'use client'; // ใช้ usePathname

import Link from 'next/link';
import { usePathname } from 'next/navigation';

export default function Navbar() { // ไม่ต้องรับ prop isPublic แล้ว
  const pathname = usePathname();

  return (
    <nav className="navbar navbar-expand-lg navbar-light bg-white shadow-sm sticky-top">
      <div className="container">
        <Link className="navbar-brand fw-bold fs-4" href="/">
          <i className="fas fa-couch me-2 text-primary"></i>OF Furniture
        </Link>
        <button className="navbar-toggler" type="button" data-bs-toggle="collapse" data-bs-target="#publicNavbarNav">
          <span className="navbar-toggler-icon"></span>
        </button>
        <div className="collapse navbar-collapse" id="publicNavbarNav">
          <ul className="navbar-nav ms-auto mb-2 mb-lg-0">
            <li className="nav-item">
              <Link className={`nav-link ${pathname === '/' || pathname === '/products' ? 'active' : ''}`} href="/products">
                 <i className="fas fa-shopping-bag me-1"></i>สินค้า
              </Link>
            </li>
            <li className="nav-item">
              <a className="nav-link" href="/#contact"> {/* ใช้ anchor link ไปยังส่วน Contact ในหน้าหลัก */}
                 <i className="fas fa-phone me-1"></i>ติดต่อเรา
              </a>
            </li>
            <li className="nav-item">
              <Link className={`nav-link ${pathname === '/login' ? 'active' : ''}`} href="/login">
                <i className="fas fa-sign-in-alt me-1"></i>เข้าสู่ระบบ
              </Link>
            </li>
          </ul>
        </div>
      </div>
    </nav>
  );
}