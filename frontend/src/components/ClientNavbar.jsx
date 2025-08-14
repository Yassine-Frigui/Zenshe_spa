import React, { useState } from 'react'
import { Navbar, Nav, Container } from 'react-bootstrap'
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
  FaSignOutAlt
} from 'react-icons/fa'
import { useClientAuth } from '../context/ClientAuthContext'
import { useTranslation } from 'react-i18next'
import LanguageSwitcher from './LanguageSwitcher'


const ClientNavbar = () => {
  const location = useLocation()
  const [expanded, setExpanded] = useState(false)
  const { isAuthenticated, logout } = useClientAuth()
  const { t } = useTranslation()

  const navItems = [
    { path: '/', label: t('navigation.home'), icon: FaHome },
    { path: '/about', label: t('navigation.about'), icon: FaInfoCircle },
    { path: '/services', label: t('navigation.services'), icon: FaSpa },
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
        <Navbar.Brand as={Link} to="/" className="fw-bold text-white fs-3">
          <motion.div
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="d-flex align-items-center"
          >
            <img 
              src="/images/zenshe_logo.png" 
              alt="ZenShe Spa"
              style={{ 
                height: '32px', 
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

            {/* Auth links: show Login/Signup if not authenticated, Profile/Logout if authenticated */}
            {!isAuthenticated ? (
              <>
                <Nav.Link
                  as={Link}
                  to="/client/login"
                  className={`text-white mx-2 fw-500 ${location.pathname === '/client/login' ? 'active' : ''}`}
                  onClick={() => setExpanded(false)}
                >
                  <FaSignInAlt className="me-2" />
                  {t('navigation.login')}
                </Nav.Link>
                <Nav.Link
                  as={Link}
                  to="/client/signup"
                  className={`text-white mx-2 fw-500 ${location.pathname === '/client/signup' ? 'active' : ''}`}
                  onClick={() => setExpanded(false)}
                >
                  <FaUserPlus className="me-2" />
                  {t('navigation.signup')}
                </Nav.Link>
              </>
            ) : (
              <>
                <Nav.Link
                  as={Link}
                  to="/profile"
                  className={`text-white mx-2 fw-500 ${location.pathname === '/profile' ? 'active' : ''}`}
                >
                  <FaUser className="me-2" />
                  {t('navigation.profile')}
                </Nav.Link>
                <Nav.Link
                  as={Link}
                  to="#"
                  className="text-white mx-2 fw-500"
                  onClick={async () => {
                    await logout();
                    setExpanded(false);
                  }}
                >
                  <FaSignOutAlt className="me-2" />
                  {t('navigation.logout')}
                </Nav.Link>
              </>
            )}

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

      <style jsx>{`
        .navbar-green .nav-link.active {
          background: rgba(255, 255, 255, 0.2);
          border-radius: 20px;
          padding: 8px 16px !important;
        }
        
        .navbar-green .navbar-toggler:focus {
          box-shadow: none;
        }
        
        @media (max-width: 991.98px) {
          .navbar-green .navbar-collapse {
            background: rgba(46, 77, 76, 0.95);
            backdrop-filter: blur(10px);
            border-radius: 15px;
            margin-top: 10px;
            padding: 20px;
          }
        }
      `}</style>
    </Navbar>
  )
}

export default ClientNavbar
