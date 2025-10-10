import React, { useState } from 'react'
import { Navbar, Nav, Container, Dropdown } from 'react-bootstrap'
import { Link, useLocation } from 'react-router-dom'
import { motion } from 'framer-motion'
import { 
  FaHome, 
  FaInfoCircle, 
  FaSpa, 
  FaCalendarAlt, 
  FaPhone,
  FaBars,
  FaTimes,
  FaUser,
  FaSignInAlt,
  FaUserPlus,
  FaSignOutAlt,
  FaStore
} from 'react-icons/fa'
import { useClientAuth } from '../context/ClientAuthContext'
import { useTranslation } from 'react-i18next'
import { useCart } from '../context/CartContext'
import LanguageSwitcher from './LanguageSwitcher'
import { FaShoppingCart } from 'react-icons/fa'


const ClientNavbar = () => {
  const location = useLocation()
  const [expanded, setExpanded] = useState(false)
  const { isAuthenticated, logout } = useClientAuth()
  const { getCartItemsCount } = useCart()
  const { t } = useTranslation()
  const cartItemsCount = getCartItemsCount()

  const navItems = [
    { path: '/', label: t('navigation.home'), icon: FaHome },
    { path: '/about', label: t('navigation.about'), icon: FaInfoCircle },
    { path: '/services', label: t('navigation.services'), icon: FaSpa },
    { path: '/boutique', label: t('store.title'), icon: FaStore },
    { path: '/booking', label: t('navigation.booking'), icon: FaCalendarAlt },
    { path: '/contact', label: t('navigation.contact'), icon: FaPhone }
  ]

  return (
    <Navbar 
      expand="lg" 
      className="navbar-green fixed-top" 
      expanded={expanded}
      onToggle={setExpanded}
    >
      <Container>
        <Navbar.Brand as={Link} to="/" className="fw-bold text-white" style={{ fontSize: '1.25rem' }}>
          <motion.div
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="d-flex align-items-center"
          >
            <img 
              src="/images/zenshe_logo.png" 
              alt="ZenShe Spa"
              style={{ 
                height: '28px', 
                marginRight: '8px', 
                borderRadius: '6px',
                objectFit: 'cover'
              }}


            />
Zen she spa
          </motion.div>
        </Navbar.Brand>

        <Navbar.Toggle 
          aria-controls="basic-navbar-nav"
          className="border-0 text-white"
          onClick={() => setExpanded(!expanded)}
        >
          {expanded ? <FaTimes /> : <FaBars />}
        </Navbar.Toggle>

        <Navbar.Collapse id="basic-navbar-nav">
          <Nav className="ms-auto">
            {navItems.map((item) => (
              <Nav.Link
                key={item.path}
                as={Link}
                to={item.path}
                className={`text-white mx-2 fw-500 ${
                  location.pathname === item.path ? 'active' : ''
                }`}
                onClick={() => setExpanded(false)}
              >
                <motion.div
                  whileHover={{ y: -2 }}
                  className="d-flex align-items-center"
                >
                  <item.icon className="me-2" />
                  {item.label}
                </motion.div>
              </Nav.Link>
            ))}

            {/* User Dropdown for Auth/Profile */}
            <Dropdown align="end" as={Nav.Item} className="mx-2">
              <Dropdown.Toggle as={Nav.Link} className="text-white d-flex align-items-center px-2" style={{ background: 'none', border: 'none' }}>
                <FaUser size={22} />
              </Dropdown.Toggle>
              <Dropdown.Menu align="end" className="shadow">
                {!isAuthenticated ? (
                  <>
                    <Dropdown.Item as={Link} to="/client/login" onClick={() => setExpanded(false)}>
                      <FaSignInAlt className="me-2" /> {t('navigation.login')}
                    </Dropdown.Item>
                    <Dropdown.Item as={Link} to="/client/signup" onClick={() => setExpanded(false)}>
                      <FaUserPlus className="me-2" /> {t('navigation.signup')}
                    </Dropdown.Item>
                  </>
                ) : (
                  <>
                    <Dropdown.Item as={Link} to="/profile" onClick={() => setExpanded(false)}>
                      <FaUser className="me-2" /> {t('navigation.profile')}
                    </Dropdown.Item>
                    <Dropdown.Divider />
                    <Dropdown.Item as="button" onClick={async () => { await logout(); setExpanded(false); }}>
                      <FaSignOutAlt className="me-2" /> {t('navigation.logout')}
                    </Dropdown.Item>
                  </>
                )}
              </Dropdown.Menu>
            </Dropdown>

            {/* Cart Link */}
            <Nav.Link
              as={Link}
              to="/boutique/panier"
              className="text-white position-relative mx-2"
              onClick={() => setExpanded(false)}
            >
              <motion.div
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                className="d-flex align-items-center"
              >
                <FaShoppingCart size={22} />
                {cartItemsCount > 0 && (
                  <motion.span
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    className="badge bg-danger position-absolute"
                    style={{
                      top: '-5px',
                      right: '-10px',
                      minWidth: '20px',
                      height: '20px',
                      borderRadius: '10px',
                      fontSize: '11px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}
                  >
                    {cartItemsCount}
                  </motion.span>
                )}
              </motion.div>
            </Nav.Link>

            {/* Language Switcher */}
            <LanguageSwitcher />

            {/* Bouton de réservation spécial */}
            <Nav.Link
              as={Link}
              to="/booking"
              className="ms-3"
              onClick={() => setExpanded(false)}
            >
              <motion.button
                whileHover={{ scale: 1.05, y: -2 }}
                whileTap={{ scale: 0.95 }}
                className="btn btn-outline-light rounded-pill px-4"
                style={{
                  background: 'rgba(255, 255, 255, 0.1)',
                  backdropFilter: 'blur(10px)',
                  border: '2px solid rgba(255, 255, 255, 0.3)'
                }}
              >
                <FaCalendarAlt className="me-2" />
                {t('navigation.bookAppointment')}
              </motion.button>
            </Nav.Link>
          </Nav>
        </Navbar.Collapse>
      </Container>

      <style>{`
        .navbar-green {
          padding: 0.35rem 0 !important;
          min-height: auto !important;
        }
        
        .navbar-green .container {
          padding-top: 0.25rem;
          padding-bottom: 0.25rem;
        }
        
        .navbar-green .navbar-brand {
          padding-top: 0.25rem !important;
          padding-bottom: 0.25rem !important;
          margin-right: 1rem !important;
        }
        
        .navbar-green .nav-link {
          padding: 0.35rem 0.7rem !important;
          font-size: 0.9rem !important;
          line-height: 1.3 !important;
        }
        
        .navbar-green .nav-link.active {
          background: rgba(255, 255, 255, 0.2);
          border-radius: 18px;
          padding: 0.35rem 0.9rem !important;
        }
        
        .navbar-green .navbar-nav {
          align-items: center;
        }
        
        .navbar-green .btn {
          padding: 0.35rem 1rem !important;
          font-size: 0.9rem !important;
        }
        
        .navbar-green .navbar-toggler {
          padding: 0.25rem 0.5rem;
          font-size: 1rem;
        }
        
        .navbar-green .navbar-toggler:focus {
          box-shadow: none;
        }
        
        /* Reduce dropdown padding */
        .navbar-green .dropdown-toggle {
          padding: 0.35rem 0.5rem !important;
        }
        
        @media (max-width: 991.98px) {
          .navbar-green .navbar-collapse {
            background: rgba(46, 77, 76, 0.95);
            backdrop-filter: blur(10px);
            border-radius: 15px;
            margin-top: 10px;
            padding: 15px;
          }
        }
      `}</style>
    </Navbar>
  )
}

export default ClientNavbar
