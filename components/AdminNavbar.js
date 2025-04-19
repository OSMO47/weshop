// componentsNavbar.js
'use client'; // ถ้ามี logic เช่น logout

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation'; // สำหรับ active link และ logout
import Swal from 'sweetalert2';

export default function AdminNavbar() {
  const pathname = usePathname();
  const router = useRouter();

  const handleLogout = () => {
    Swal.fire({
      title: 'ออกจากระบบ',
      text: 'คุณต้องการออกจากระบบใช่หรือไม่?',
      icon: 'question',
      showCancelButton: true,
      confirmButtonText: 'ใช่, ออกจากระบบ',
      cancelButtonText: 'ยกเลิก',
    }).then((result) => {
      if (result.isConfirmed) {
        // FIXME: Implement actual logout logic (clear session/token)
        console.log('Logging out...');
        // Redirect to login page
        router.push('/login');
      }
    });
  };

  return (
    <nav className="navbar navbar-expand-lg navbar-dark bg-dark sticky-top">
      <div className="container">
        <Link className="navbar-brand" href="/stock">
          <i className="fas fa-user-shield me-2"></i>Admin Panel
        </Link>
        <button className="navbar-toggler" type="button" data-bs-toggle="collapse" data-bs-target="#adminNavbarNav">
          <span className="navbar-toggler-icon"></span>
        </button>
        <div className="collapse navbar-collapse" id="adminNavbarNav">
          <ul className="navbar-nav me-auto mb-2 mb-lg-0">
            <li className="nav-item">
              <Link className={`nav-link ${pathname === '/stock' ? 'active' : ''}`} href="/stock">
                <i className="fas fa-boxes me-1"></i>สต็อกสินค้า
              </Link>
            </li>
            <li className="nav-item">
              <Link className={`nav-link ${pathname === '/stock/add' ? 'active' : ''}`} href="/stock/add">
                <i className="fas fa-plus-circle me-1"></i>เพิ่มสินค้า
              </Link>
            </li>
            <li className="nav-item">
              <Link className={`nav-link ${pathname === '/sales-history' ? 'active' : ''}`} href="/sales-history">
                <i className="fas fa-history me-1"></i>ประวัติการขาย
              </Link>
            </li>
             <li className="nav-item">
              <Link className="nav-link" href="/products" target="_blank"> {/* เปิดใน tab ใหม่ */}
                <i className="fas fa-store me-1"></i>ดูหน้าร้าน
              </Link>
            </li>
          </ul>
          <ul className="navbar-nav">
             <li className="nav-item">
                <button className="btn btn-outline-danger" onClick={handleLogout}>
                    <i className="fas fa-sign-out-alt me-1"></i>ออกจากระบบ
                </button>
            </li>
          </ul>
        </div>
      </div>
    </nav>
  );
}