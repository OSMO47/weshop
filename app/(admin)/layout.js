// app/(admin)/layout.js
import React from 'react';
import AdminNavbar from '@/components/AdminNavbar'; // สมมติว่าสร้าง Component นี้แล้ว
// import { checkAuth } from '@/lib/auth'; // สมมติว่ามี function ตรวจสอบสิทธิ์
// import { redirect } from 'next/navigation';

export default async function AdminLayout({ children }) {
  // FIXME: Add Authentication Check
  // ในแอปจริง ให้ตรวจสอบ session/token ที่นี่
  // const isAuthenticated = await checkAuth(); // ตัวอย่างการเรียกใช้ (ต้องสร้าง checkAuth เอง)
  // if (!isAuthenticated) {
  //   redirect('/login'); // ถ้าไม่ผ่าน ให้ redirect ไปหน้า login
  // }

  return (
    <div>
      <AdminNavbar />
      <main className="container mt-4">
        {/* FIXME: เพิ่มการตรวจสอบสิทธิ์ใน Client Components ที่อยู่ข้างในด้วยถ้าจำเป็น */}
        {children}
      </main>
      {/* อาจมี Footer สำหรับ Admin */}
    </div>
  );
}