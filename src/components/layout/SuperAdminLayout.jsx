import React from 'react';
import SuperAdminSidebar from './SuperAdminSidebar';

const SuperAdminLayout = ({ children }) => {
  return (
    <div className="d-flex w-100 m-0 p-0 overflow-hidden">
      {/* Sidebar cố định bên trái */}
      <SuperAdminSidebar />
      
      {/* Nội dung chính bên phải */}
      <main className="flex-grow-1 min-vh-100 bg-light overflow-auto p-4" style={{ marginLeft: '280px' }}>
        <div className="container-fluid">
          {children}
        </div>
      </main>
    </div>
  );
};

export default SuperAdminLayout;
