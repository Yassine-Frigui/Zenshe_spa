import React, { useState, useEffect } from 'react'
import { Container, Row, Col, Card, Button, Nav, Badge } from 'react-bootstrap'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { useTranslation } from 'react-i18next'
import { 
  FaSpa, 
  FaCalendarAlt, 
  FaClock,
  FaMoneyBill,
  FaLeaf,
  FaHeart,
  FaStar,
  FaGem,
  FaCrown,
  FaStore,
  FaCheck,
  FaInfoCircle
} from 'react-icons/fa'
import { publicAPI } from '../../services/api'

const ServicesPage = () => {
  const { t, i18n } = useTranslation()
  const [services, setServices] = useState([])
  const [categories, setCategories] = useState([])
  const [memberships, setMemberships] = useState([])
  const [mainTab, setMainTab] = useState('services') // 'services' or 'memberships'
  const [selectedCategory, setSelectedCategory] = useState('all')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchData()
  }, [i18n.language]) // Re-fetch when language changes

  const fetchData = async () => {
    try {
      const [servicesRes, categoriesRes, membershipsRes] = await Promise.all([
        publicAPI.getServices(),
        publicAPI.getCategories(),
        publicAPI.getMemberships()
      ])
      // Handle services response - wrapped in {success, services, ...}
      const servicesData = servicesRes.data.services || servicesRes.data || []

      // Handle categories response - wrapped in {success, data, ...}
      const rawCategories = categoriesRes.data.data || categoriesRes.data || []
      
      // Handle memberships response
      const membershipsData = membershipsRes.data.memberships || membershipsRes.data || []

      // Normalize category object shape so UI always reads `.nom`, `.description`, `.couleur_theme`, `.id`
      const normalizeCategory = (c) => {
        if (!c || typeof c !== 'object') return null
        return {
          id: c.id || c.ID || c.category_id || null,
          nom: c.nom || c.name || c.label || '',
          description: c.description || c.desc || c.description_text || '',
          couleur_theme: c.couleur_theme || c.color || c.couleur || null,
          ordre_affichage: c.ordre_affichage || c.display_order || null,
          actif: typeof c.actif !== 'undefined' ? c.actif : (typeof c.is_active !== 'undefined' ? c.is_active : true),
          // keep the original for debugging if needed
          __raw: c
        }
      }

      const categoriesData = Array.isArray(rawCategories)
        ? rawCategories.map(normalizeCategory).filter(Boolean)
        : []

      console.log('✅ Services loaded:', servicesData.length, 'items')
      console.log('✅ Categories loaded:', categoriesData.length, 'items')
      console.log('✅ Memberships loaded:', membershipsData.length, 'items')

      setServices(Array.isArray(servicesData) ? servicesData : [])
      setCategories(categoriesData)
      setMemberships(Array.isArray(membershipsData) ? membershipsData : [])
    } catch (error) {
      console.error('❌ Error loading services:', error)
      setServices([])
      setCategories([])
      setMemberships([])
    } finally {
      setLoading(false)
    }
  }

  const filteredServices = selectedCategory === 'all' 
    ? (Array.isArray(services) ? services : [])
    : (Array.isArray(services) ? services.filter(service => 
        service.categorie_id === parseInt(selectedCategory)
      ) : [])

  const getServiceIcon = (categoryName) => {
    const icons = {
      'V-Steam': <FaLeaf className="text-green" />,
      'Vajacials': <FaHeart className="text-green" />, 
      'Massages et Soins Corps': <FaSpa className="text-green" />,
      'ZenShe Rituals': <FaStar className="text-green" />,
      'Japanese Head Spa': <FaGem className="text-green" />,
      'Épilation': <FaLeaf className="text-green" />
    }
    return icons[categoryName] || <FaLeaf className="text-green" />
  }

  const getCategoryColor = (couleur) => {
    return couleur || 'var(--primary-green)'
  }

  if (loading) {
    return (
      <div className="d-flex justify-content-center align-items-center" style={{ height: '100vh' }}>
        <div className="spinner-green"></div>
      </div>
    )
  }

  return (
    <div className="services-page">{/* services-page class already includes proper margin */}
      {/* Header */}
      <section className="py-5 text-white"
      style={{
          background: 'linear-gradient(135deg, var(--secondary-green) 0%, var(--accent-green) 100%)',
      }}
      >
        <Container>
          <Row className="text-center">
            <Col>
              <motion.div
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8 }}
              >
                <h1 className="display-4 fw-bold mb-4">
                  <FaSpa className="me-3" />
                  {t('services.title')}
                </h1>
                <p className="lead mb-0 opacity-90">
                  {t('services.subtitle')}
                </p>
              </motion.div>
            </Col>
          </Row>
        </Container>
      </section>

      {/* Main Tabs - Services vs Memberships */}
      <section className="py-4 bg-light sticky-top" style={{ top: '60px', zIndex: 100 }}>
        <Container>
          <Row>
            <Col>
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.2 }}
              >
                {/* Main Tab Navigation */}
                <Nav variant="tabs" className="justify-content-center mb-4 border-0">
                  <Nav.Item>
                    <Nav.Link
                      active={mainTab === 'services'}
                      onClick={() => {
                        setMainTab('services')
                        setSelectedCategory('all')
                      }}
                      className={`px-4 py-3 fw-bold ${
                        mainTab === 'services' ? 'text-green' : 'text-muted'
                      }`}
                      style={{
                        fontSize: '1.1rem',
                        borderBottom: mainTab === 'services' ? '3px solid var(--primary-green)' : 'none',
                        background: 'transparent',
                        border: 'none',
                        borderRadius: 0
                      }}
                    >
                      <FaSpa className="me-2" />
                      {t('services.tab.services')}                    </Nav.Link>
                  </Nav.Item>
                  <Nav.Item>
                    <Nav.Link
                      active={mainTab === 'memberships'}
                      onClick={() => setMainTab('memberships')}
                      className={`px-4 py-3 fw-bold ${
                        mainTab === 'memberships' ? 'text-warning' : 'text-muted'
                      }`}
                      style={{
                        fontSize: '1.1rem',
                        borderBottom: mainTab === 'memberships' ? '3px solid #FFD700' : 'none',
                        background: 'transparent',
                        border: 'none',
                        borderRadius: 0
                      }}
                    >
                      <FaCrown className="me-2" />
                      {t('services.tab.memberships')}
                    </Nav.Link>
                  </Nav.Item>
                </Nav>

                {/* Category Pills - Only show when Services tab is active */}
                {mainTab === 'services' && (
                  <Nav variant="pills" className="justify-content-center flex-wrap">
                    <Nav.Item className="mb-2">
                      <Nav.Link
                        active={selectedCategory === 'all'}
                        onClick={() => setSelectedCategory('all')}
                        className={`rounded-pill mx-1 ${
                          selectedCategory === 'all' ? 'bg-green text-white' : 'text-green'
                        }`}
                        style={{ 
                          background: selectedCategory === 'all' ? 'var(--primary-green)' : 'transparent',
                          border: `2px solid var(--primary-green)`
                        }}
                      >
                        <FaStar className="me-2" />
                        {t('services.allServices')}
                        <Badge className="ms-2" bg="light" text="dark">
                          {Array.isArray(services) ? services.length : 0}
                        </Badge>
                      </Nav.Link>
                    </Nav.Item>
                    
                    {Array.isArray(categories) && categories.map((category) => {
                      const categoryServices = Array.isArray(services) ? services.filter(s => s.categorie_id === category.id) : []
                      return (
                        <Nav.Item key={category.id} className="mb-2">
                          <Nav.Link
                            active={selectedCategory === category.id.toString()}
                            onClick={() => setSelectedCategory(category.id.toString())}
                            className={`rounded-pill mx-1 ${
                              selectedCategory === category.id.toString() ? 'text-white' : ''
                            }`}
                            style={{ 
                              background: selectedCategory === category.id.toString() 
                                ? getCategoryColor(category.couleur_theme) 
                                : 'transparent',
                              border: `2px solid ${getCategoryColor(category.couleur_theme)}`,
                              color: selectedCategory === category.id.toString() 
                                ? 'white' 
                                : getCategoryColor(category.couleur_theme)
                            }}
                          >
                            <span className="me-2">{getServiceIcon(category.nom)}</span>
                            {category.nom}
                            <Badge className="ms-2" bg="light" text="dark">
                              {categoryServices.length}
                            </Badge>
                          </Nav.Link>
                        </Nav.Item>
                      )
                    })}
                  </Nav>
                )}
              </motion.div>
            </Col>
          </Row>
        </Container>
      </section>

      {/* Content - Services or Memberships */}
      <section className="py-5">
        <Container>
          {/* Memberships Tab Content */}
          {mainTab === 'memberships' ? (
            <>
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6 }}
                className="text-center mb-5"
              >
                <h2 className="fw-bold mb-3" style={{ color: '#FFD700' }}>
                  <FaCrown className="me-3" style={{ fontSize: '2.5rem' }} />
                  {t('services.memberships.hero.title')}
                </h2>
                <p className="lead text-muted mb-4">
                  {t('services.memberships.hero.subtitle')}
                </p>
                <div className="alert alert-info d-inline-flex align-items-center">
                  <FaStore className="me-2" />
                  <strong>{t('services.memberships.available_notice.title')}</strong> - {t('services.memberships.available_notice.detail')}
                </div>
              </motion.div>

              <Row className="g-4">
                {memberships.map((membership, index) => (
                  <Col key={membership.id} lg={3} md={6}>
                    <motion.div
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.6, delay: index * 0.1 }}
                      whileHover={{ y: -10 }}
                    >
                      <Card className="h-100 border-0 shadow-lg" style={{ borderTop: `5px solid ${membership.nom === 'SILVER' ? '#C0C0C0' : membership.nom === 'GOLD' ? '#FFD700' : membership.nom === 'PLATINUM' ? '#E5E4E2' : '#9B59B6'}` }}>
                        <Card.Body className="d-flex flex-column">
                          <div className="text-center mb-3">
                            <FaCrown style={{ fontSize: '3rem', color: membership.nom === 'SILVER' ? '#C0C0C0' : membership.nom === 'GOLD' ? '#FFD700' : membership.nom === 'PLATINUM' ? '#E5E4E2' : '#9B59B6' }} />
                            <h3 className="fw-bold mt-3">{membership.membership_nom || membership.nom}</h3>
                            {membership.nom === 'VIP' && (
                              <Badge bg="warning" text="dark">⭐ Most Popular</Badge>
                            )}
                          </div>

                          <div className="text-center mb-3 py-3" style={{ borderTop: '1px solid #eee', borderBottom: '1px solid #eee' }}>
                            <h2 className="text-green mb-0">
                              {membership.prix_mensuel}DT
                              <small className="text-muted" style={{ fontSize: '1rem' }}>/mois</small>
                            </h2>
                            {membership.prix_3_mois && (
                              <div className="mt-2">
                                <Badge bg="success">Économisez!</Badge>
                                <div className="text-success fw-bold">{membership.prix_3_mois}DT/mois</div>
                                <small className="text-muted">(engagement 3 mois)</small>
                              </div>
                            )}
                          </div>

                            <p className="text-center text-muted mb-3">
                            <FaInfoCircle className="me-2" />
                            {membership.services_par_mois} {t('memberships.services_per_month')}
                          </p>

                          {membership.membership_description || membership.description ? (
                            <p className="small text-muted mb-3">{membership.membership_description || membership.description}</p>
                          ) : null}

                          {membership.membership_avantages || membership.avantages ? (
                            <div className="flex-grow-1 mb-3 p-3 bg-light rounded">
                              <h6 className="text-green mb-2">
                                <FaCheck className="me-2" />
                                {t('memberships.advantages.label')}
                              </h6>
                              <ul className="list-unstyled small mb-0">
                                {(membership.membership_avantages || membership.avantages).split(/[+•\n]/).map((item, idx) => 
                                  item.trim() && (
                                    <li key={idx} className="mb-1">
                                      <FaCheck className="text-success me-2" style={{ fontSize: '0.7rem' }} />
                                      {item.trim()}
                                    </li>
                                  )
                                )}
                              </ul>
                            </div>
                          ) : null}

                          <Button variant="outline-success" disabled className="w-100 mt-auto" style={{ opacity: 0.7, cursor: 'not-allowed' }}>
                            <FaStore className="me-2" />
                            {t('memberships.available_in_spa')}
                          </Button>
                          <small className="text-center text-muted mt-2">{t('memberships.visit_to_subscribe')}</small>
                        </Card.Body>
                      </Card>
                    </motion.div>
                  </Col>
                ))}
              </Row>
            </>
          ) : (
            <>
              {selectedCategory !== 'all' && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6 }}
                  className="text-center mb-5"
                >
                  {categories
                    .filter(cat => cat.id.toString() === selectedCategory)
                    .map(category => (
                      <div key={category.id}>
                        <h2 className="fw-bold mb-3" style={{ color: getCategoryColor(category.couleur_theme) }}>
                          <span className="me-3" style={{ fontSize: '2rem' }}>
                            {getServiceIcon(category.nom)}
                          </span>
                          {category.nom}
                        </h2>
                        <p className="lead text-muted mb-4">
                          {category.description}
                        </p>
                      </div>
                    ))}
                </motion.div>
              )}

              <Row className="g-4">
            {filteredServices.map((service, index) => (
              <Col lg={4} md={6} key={service.id}>
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, delay: index * 0.1 }}
                  whileHover={{ y: -10 }}
                >
                  <Card className="service-card h-100 border-0 shadow-sm position-relative overflow-hidden">
                    {/* Popular/New badges */}
                    {Boolean(service.populaire) && (
                      <div className="position-absolute top-0 end-0 m-3" style={{ zIndex: 2 }}>
                        <Badge bg="warning" className="rounded-pill">
                          <FaHeart className="me-1" />
                          Populaire
                        </Badge>
                      </div>
                    )}
                    {Boolean(service.nouveau) && (
                      <div className="position-absolute top-0 start-0 m-3" style={{ zIndex: 2 }}>
                        <Badge bg="success" className="rounded-pill">
                          <FaStar className="me-1" />
                          New
                        </Badge>
                      </div>
                    )}

                    {/* Category icon background */}
                    <div 
                      className="position-absolute top-0 end-0 opacity-25"
                      style={{ 
                        fontSize: '4rem',
                        transform: 'translate(25%, -25%)',
                        color: getCategoryColor(service.couleur_theme)
                      }}
                    >
                      {getServiceIcon(service.categorie)}
                    </div>

                    <Card.Body className="p-4 position-relative">
                      <div className="mb-3">
                        <span 
                          className="badge rounded-pill px-3 py-2 small"
                          style={{ 
                            background: getCategoryColor(service.couleur_theme),
                            color: 'white'
                          }}
                        >
                          {service.categorie}
                        </span>
                      </div>

                      <Card.Title className="fw-bold mb-3" style={{ color: getCategoryColor(service.couleur_theme) }}>
                        {service.nom}
                      </Card.Title>

                      <Card.Text className="text-muted mb-4">
                        {service.description}
                      </Card.Text>

                      {/* Price and duration */}
                      <Row className="align-items-center mb-4">
                        <Col>
                          <div className="d-flex align-items-center text-muted small">
                            <FaClock className="me-2" />
                            {service.duree} {t('services.minutes')}
                          </div>
                        </Col>
                        <Col className="text-end">
                          <div className="service-price d-flex align-items-center justify-content-end">
                            <FaMoneyBill className="me-1 small" />
                            {service.prix} TND 
                          </div>
                        </Col>
                      </Row>

                      {/* Additional information */}
                      {service.materiel_necessaire && (
                        <div className="mb-3">
                          <small className="text-muted">
                            <FaGem className="me-2" />
                            {service.materiel_necessaire}
                          </small>
                        </div>
                      )}

                      {service.instructions_speciales && (
                        <div className="mb-3">
                          <small className="text-info">
                            💡 {service.instructions_speciales}
                          </small>
                        </div>
                      )}

                      <div className="d-grid gap-2">
                        <Link 
                          to={`/services/${service.id}`}
                          className="btn btn-outline-green"
                        >
                          {t('services.viewDetails')}
                        </Link>
                        <Link 
                          to={`/booking?service=${service.id}`}
                          className="btn btn-green"
                          style={{
                            background: `linear-gradient(135deg, ${getCategoryColor(service.couleur_theme)}, var(--accent-green))`
                          }}
                        >
                          <FaCalendarAlt className="me-2" />
                          {t('services.bookService')}
                        </Link>
                      </div>
                    </Card.Body>
                  </Card>
                </motion.div>
              </Col>
            ))}
              </Row>
            </>
          )}

          {mainTab === 'services' && filteredServices.length === 0 && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.6 }}
              className="text-center py-5"
            >
              <div style={{ fontSize: '4rem' }} className="mb-3">
                {selectedCategory === 'all' ? '🔍' : '🌟'}
              </div>
              <h3 className="text-muted">{t('services.noServicesFound')}</h3>
              <p className="text-muted mb-4">
                {selectedCategory === 'all' 
                  ? t('services.noServicesAvailable')
                  : t('services.categoryComingSoon')}
              </p>
              {selectedCategory !== 'all' && (
                <Button 
                  variant="outline-green"
                  onClick={() => setSelectedCategory('all')}
                  className="mt-3"
                >
                  <FaStar className="me-2" />
                  {t('services.viewAllServices')}
                </Button>
              )}
            </motion.div>
          )}
        </Container>
      </section>

      {/* Call to Action */}
      <section className="py-5 bg-soft-green">
        <Container>
          <Row className="text-center">
            <Col>
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                whileInView={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.6 }}
              >
                <h3 className="text-green fw-bold mb-4">
                  {t('services.cta.title')}
                </h3>
                <p className="lead text-muted mb-4">
                  {t('services.cta.description')}
                </p>
                <div className="d-flex justify-content-center gap-3 flex-wrap">
                  <Link to="/contact" className="btn btn-outline-green">
                    <FaCalendarAlt className="me-2" />
                    {t('contact.title')}
                  </Link>
                  <Link to="/booking" className="btn btn-green">
                    <FaCalendarAlt className="me-2" />
                    {t('booking.title')}
                  </Link>
                </div>
              </motion.div>
            </Col>
          </Row>
        </Container>
      </section>
    </div>
  )
}

export default ServicesPage
