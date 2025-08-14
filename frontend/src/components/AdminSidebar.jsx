import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
  FaTachometerAlt,
  FaCalendarAlt,
  FaUsers,
  FaCut,
  FaBoxes,
  FaCog,
  FaSignOutAlt,
  FaChevronLeft,
  FaChevronRight
} from 'react-icons/fa';
import { useAuth } from '../context/AuthContext';

const AdminSidebar = ({ isCollapsed, setIsCollapsed }) => {
  const location = useLocation();
  const { logout } = useAuth();

  const menuItems = [
    {
      path: '/admin',
      icon: <FaTachometerAlt />,
      label: 'Tableau de bord',
      exact: true
    },
    {
      path: '/admin/reservations',
      icon: <FaCalendarAlt />,
      label: 'Réservations'
    },
    {
      path: '/admin/clients',
      icon: <FaUsers />,
      label: 'Clients'
    },
    {
      path: '/admin/services',
      icon: <FaCut />,
      label: 'Services'
    },
    {
      path: '/admin/inventaire',
      icon: <FaBoxes />,
      label: 'Inventaire'
    },
    {
      path: '/admin/parametres',
      icon: <FaCog />,
      label: 'Paramètres'
    }
  ];

  const isActive = (path, exact = false) => {
    if (exact) {
      return location.pathname === path;
    }
    return location.pathname.startsWith(path);
  };

  const handleLogout = () => {
    logout();
  };

  return (
    <motion.div
      className={`admin-sidebar bg-white shadow-sm border-end d-flex flex-column ${
        isCollapsed ? 'collapsed' : ''
      }`}
      style={{
        width: isCollapsed ? '70px' : '250px',
        minHeight: '100vh',
        position: 'fixed',
        left: 0,
        top: 0,
        zIndex: 1000,
        transition: 'width 0.3s ease'
      }}
      initial={false}
      animate={{ width: isCollapsed ? 70 : 250 }}
      transition={{ duration: 0.3 }}
    >
      {/* Header */}
      <div className="sidebar-header p-3 border-bottom bg-gradient-pink text-white">
        <div className="d-flex align-items-center justify-content-between">
          {!isCollapsed && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
            >
              <h6 className="mb-0 fw-bold">Beauty Nails</h6>
              <small className="opacity-75">Administration</small>
            </motion.div>
          )}
          <button
            className="btn btn-sm text-white p-1"
            onClick={() => setIsCollapsed(!isCollapsed)}
            title={isCollapsed ? 'Étendre' : 'Réduire'}
          >
            {isCollapsed ? <FaChevronRight /> : <FaChevronLeft />}
          </button>
        </div>
      </div>

      {/* Navigation */}
      <nav className="sidebar-nav flex-grow-1 py-3">
        <ul className="list-unstyled mb-0">
          {menuItems.map((item, index) => (
            <li key={index} className="mb-1">
              <Link
                to={item.path}
                className={`sidebar-link d-flex align-items-center px-3 py-2 text-decoration-none ${
                  isActive(item.path, item.exact)
                    ? 'active bg-pink-100 text-pink-600 border-end border-3 border-pink-500'
                    : 'text-muted hover-bg-light'
                }`}
                title={isCollapsed ? item.label : ''}
              >
                <motion.div
                  className="sidebar-icon me-3 d-flex align-items-center justify-content-center"
                  style={{ width: '20px', height: '20px' }}
                  whileHover={{ scale: 1.1 }}
                  transition={{ duration: 0.2 }}
                >
                  {item.icon}
                </motion.div>
                {!isCollapsed && (
                  <motion.span
                    className="sidebar-text"
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.2, delay: 0.1 }}
                  >
                    {item.label}
                  </motion.span>
                )}
              </Link>
            </li>
          ))}
        </ul>
      </nav>

      {/* Footer */}
      <div className="sidebar-footer p-3 border-top">
        <button
          onClick={handleLogout}
          className={`btn btn-outline-danger d-flex align-items-center ${
            isCollapsed ? 'btn-sm p-2' : 'w-100'
          }`}
          title={isCollapsed ? 'Déconnexion' : ''}
        >
          <FaSignOutAlt className={isCollapsed ? '' : 'me-2'} />
          {!isCollapsed && 'Déconnexion'}
        </button>
      </div>

      <style jsx>{`
        .sidebar-link:hover {
          background-color: #f8f9fa;
          color: #e91e63;
        }
        
        .sidebar-link.active {
          font-weight: 600;
        }
        
        .hover-bg-light:hover {
          background-color: #f8f9fa !important;
        }
      `}</style>
    </motion.div>
  );
};

export default AdminSidebar;
