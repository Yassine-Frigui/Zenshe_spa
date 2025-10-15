import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Card, Badge } from 'react-bootstrap';
import { motion } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { 
  FaCrown, 
  FaStar, 
  FaGem, 
  FaCheck,
  FaInfoCircle,
  FaStore
} from 'react-icons/fa';
import { publicAPI } from '../../services/api';
import './MembershipsPage.css';

const MembershipsPage = () => {
  const { t, i18n } = useTranslation();
  const [memberships, setMemberships] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchMemberships();
  }, []);

  const fetchMemberships = async () => {
    try {
      const response = await publicAPI.getMemberships();
      const membershipsData = response.data.memberships || response.data || [];
      setMemberships(Array.isArray(membershipsData) ? membershipsData : []);
      console.log('✅ Memberships loaded:', membershipsData.length);
    } catch (error) {
      console.error('❌ Error loading memberships:', error);
      setMemberships([]);
    } finally {
      setLoading(false);
    }
  };

  const getMembershipIcon = (nom) => {
    const icons = {
      'SILVER': <FaStar className="membership-icon" />,
      'GOLD': <FaGem className="membership-icon" />,
      'PLATINUM': <FaCrown className="membership-icon" />,
      'VIP': <FaCrown className="membership-icon vip-icon" />
    };
    return icons[nom] || <FaStar className="membership-icon" />;
  };

  const getMembershipColor = (nom) => {
    const colors = {
      'SILVER': '#C0C0C0',
      'GOLD': '#FFD700',
      'PLATINUM': '#E5E4E2',
      'VIP': '#9B59B6'
    };
    return colors[nom] || '#6DB78A';
  };

  const parseAvantages = (avantages) => {
    if (!avantages) return [];
    
    // Split by common delimiters and clean up
    const items = avantages
      .split(/[+•\n]/)
      .map(item => item.trim())
      .filter(item => item.length > 0);
    
    return items;
  };

  if (loading) {
    return (
      <div className="d-flex justify-content-center align-items-center" style={{ height: '100vh' }}>
        <div className="spinner-green"></div>
      </div>
    );
  }

  return (
    <div className="memberships-page">
      {/* Hero Section */}
      <section className="memberships-hero">
        <Container>
          <motion.div
            initial={{ y: -50, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.8 }}
            className="text-center"
          >
            <FaCrown className="hero-icon mb-4" style={{ fontSize: '4rem', color: '#FFD700' }} />
            <h1 className="display-4 fw-bold mb-3">
              Nos Abonnements
            </h1>
            <p className="lead text-muted mb-4">
              Profitez de nos soins de luxe avec des abonnements mensuels exclusifs
            </p>
            <div className="alert alert-info d-inline-flex align-items-center">
              <FaStore className="me-2" />
              <strong>Abonnements disponibles en spa uniquement</strong> - Visitez-nous pour souscrire
            </div>
          </motion.div>
        </Container>
      </section>

      {/* Memberships Grid */}
      <section className="py-5">
        <Container>
          <Row className="g-4">
            {memberships.map((membership, index) => (
              <Col key={membership.id} lg={6} xl={3}>
                <motion.div
                  initial={{ y: 50, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: index * 0.1, duration: 0.6 }}
                >
                  <Card 
                    className={`membership-card h-100 ${membership.nom.toLowerCase()}-tier`}
                    style={{ borderTop: `5px solid ${getMembershipColor(membership.nom)}` }}
                  >
                    <Card.Body className="d-flex flex-column">
                      {/* Header */}
                      <div className="text-center mb-4">
                        {getMembershipIcon(membership.nom)}
                        <h3 className="membership-title mt-3 mb-2">
                          {membership.membership_nom || membership.nom}
                        </h3>
                        {membership.nom === 'VIP' && (
                          <Badge bg="warning" text="dark" className="mb-2">
                            ⭐ Most Popular
                          </Badge>
                        )}
                        <p className="text-muted small">
                          {membership.services_par_mois} services/mois
                        </p>
                      </div>

                      {/* Pricing */}
                      <div className="text-center mb-4 pricing-section">
                        <div className="price-monthly">
                          <span className="price-amount">{membership.prix_mensuel}DT</span>
                          <span className="price-period">/mois</span>
                        </div>
                        {membership.prix_3_mois && (
                          <div className="price-3months mt-2">
                            <Badge bg="success" className="me-2">Économisez!</Badge>
                            <span className="text-success fw-bold">{membership.prix_3_mois}DT/mois</span>
                            <span className="text-muted small"> (engagement 3 mois)</span>
                          </div>
                        )}
                      </div>

                      {/* Description */}
                      {membership.membership_description || membership.description ? (
                        <div className="mb-3">
                          <p className="text-muted small">
                            <FaInfoCircle className="me-2" />
                            {membership.membership_description || membership.description}
                          </p>
                        </div>
                      ) : null}

                      {/* Avantages */}
                      {membership.membership_avantages || membership.avantages ? (
                        <div className="avantages-list flex-grow-1">
                          <h6 className="text-green mb-3">
                            <FaCheck className="me-2" />
                            Avantages inclus:
                          </h6>
                          <ul className="list-unstyled">
                            {parseAvantages(membership.membership_avantages || membership.avantages).map((avantage, idx) => (
                              <li key={idx} className="mb-2">
                                <FaCheck className="text-success me-2" style={{ fontSize: '0.8rem' }} />
                                <small>{avantage}</small>
                              </li>
                            ))}
                          </ul>
                        </div>
                      ) : null}

                      {/* CTA */}
                      <div className="text-center mt-4">
                        <button 
                          className="btn btn-outline-green w-100"
                          disabled
                          style={{ cursor: 'not-allowed', opacity: 0.7 }}
                        >
                          <FaStore className="me-2" />
                          Disponible en spa
                        </button>
                        <small className="text-muted d-block mt-2">
                          Visitez-nous pour souscrire
                        </small>
                      </div>
                    </Card.Body>
                  </Card>
                </motion.div>
              </Col>
            ))}
          </Row>
        </Container>
      </section>

      {/* Info Section */}
      <section className="py-5 bg-light">
        <Container>
          <Row className="justify-content-center">
            <Col lg={8}>
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.5, duration: 0.8 }}
                className="text-center"
              >
                <h3 className="mb-4">Comment ça marche?</h3>
                <Row className="g-4">
                  <Col md={4}>
                    <div className="info-step">
                      <div className="step-number">1</div>
                      <h5>Visitez le spa</h5>
                      <p className="text-muted small">
                        Venez nous voir pour choisir votre abonnement
                      </p>
                    </div>
                  </Col>
                  <Col md={4}>
                    <div className="info-step">
                      <div className="step-number">2</div>
                      <h5>Souscrivez</h5>
                      <p className="text-muted small">
                        Notre équipe vous aide à choisir le forfait idéal
                      </p>
                    </div>
                  </Col>
                  <Col md={4}>
                    <div className="info-step">
                      <div className="step-number">3</div>
                      <h5>Profitez</h5>
                      <p className="text-muted small">
                        Réservez en ligne avec votre compte membre
                      </p>
                    </div>
                  </Col>
                </Row>
              </motion.div>
            </Col>
          </Row>
        </Container>
      </section>

      {/* FAQ Section */}
      <section className="py-5">
        <Container>
          <Row className="justify-content-center">
            <Col lg={8}>
              <h3 className="text-center mb-4">Questions Fréquentes</h3>
              <div className="faq-list">
                <div className="faq-item mb-4">
                  <h5 className="text-green">Puis-je réserver un abonnement en ligne?</h5>
                  <p className="text-muted">
                    Non, les abonnements doivent être souscrits en personne au spa. Une fois membre, 
                    vous pourrez réserver vos services en ligne avec votre compte.
                  </p>
                </div>
                <div className="faq-item mb-4">
                  <h5 className="text-green">Que se passe-t-il si je n'utilise pas tous mes services?</h5>
                  <p className="text-muted">
                    Les services non utilisés expirent à la fin de votre période d'abonnement mensuel. 
                    Ils ne sont pas reportés au mois suivant.
                  </p>
                </div>
                <div className="faq-item mb-4">
                  <h5 className="text-green">Puis-je annuler mon abonnement?</h5>
                  <p className="text-muted">
                    Les abonnements mensuels peuvent être annulés à tout moment. Les engagements de 3 mois 
                    doivent être honorés selon les termes du contrat.
                  </p>
                </div>
                <div className="faq-item mb-4">
                  <h5 className="text-green">Comment réserver avec mon abonnement?</h5>
                  <p className="text-muted">
                    Une fois membre, connectez-vous à votre compte et visitez la page de réservation. 
                    Vous verrez une option pour utiliser votre abonnement sans avoir à sélectionner un service.
                  </p>
                </div>
              </div>
            </Col>
          </Row>
        </Container>
      </section>
    </div>
  );
};

export default MembershipsPage;
