import React from 'react';
import AdminNavbar from '@/components/AdminNavbar'; 

export default async function AdminLayout({ children }) {

  return (
    <div>
      <AdminNavbar />
      <main className="container mt-4">
        {children}
      </main>

    </div>
  );
}