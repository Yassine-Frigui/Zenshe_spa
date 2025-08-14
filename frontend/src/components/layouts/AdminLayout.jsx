import React, { useState } from 'react'
import { Outlet } from 'react-router-dom'
import AdminSidebar from '../AdminSidebar'
import AdminNavbar from '../AdminNavbar'

const AdminLayout = () => {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  return (
    <div className="admin-layout">
      <AdminSidebar isCollapsed={sidebarCollapsed} setIsCollapsed={setSidebarCollapsed} />
      <div className="admin-content">
        <AdminNavbar sidebarCollapsed={sidebarCollapsed} />
        <main 
          className="admin-main p-4"
          style={{
            marginLeft: sidebarCollapsed ? '70px' : '250px',
            marginTop: '60px',
            transition: 'margin-left 0.3s ease',
            minHeight: 'calc(100vh - 60px)',
            backgroundColor: '#f8f9fa'
          }}
        >
          <Outlet />
        </main>
      </div>
    </div>
  )
}

export default AdminLayout
