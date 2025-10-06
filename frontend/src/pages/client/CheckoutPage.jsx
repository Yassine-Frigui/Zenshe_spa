import React, { useState, useEffect } from 'react';
import { Container, Form, Button, Row, Col, Card, Alert, ListGroup } from 'react-bootstrap';
import { useNavigate, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useCart } from '../../context/CartContext';

const CheckoutPage = () => {
  const { cartItems, getCartTotal } = useCart();
  const navigate = useNavigate();
  const location = useLocation();

  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    phone: '',
    email: '',
    address: '',
    city: '',
    postalCode: '',
    notes: ''
  });
  const [validated, setValidated] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  // Prefill form if coming back from confirmation page (edit)
  useEffect(() => {
    if (location.state?.orderData) {
      setFormData(location.state.orderData);
    }
  }, [location.state]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const form = e.currentTarget;
    setErrorMsg('');
    if (form.checkValidity() === false) {
      e.stopPropagation();
      setValidated(true);
      return;
    }
    // Navigate to confirmation page with form data and cart items
    navigate('/boutique/confirmation', { state: { orderData: formData, cartItems } });
  };

  if (cartItems.length === 0) {
    navigate('/boutique/panier');
    return null;
  }

  return (
    <div className="checkout-page">
      <Container fluid className="checkout-bg py-5" style={{ minHeight: '100vh', background: 'linear-gradient(120deg, #f8f9fa 60%, #e9ecef 100%)' }}>
      <Row className="justify-content-center align-items-start">
        <Col lg={5} className="mb-4">
          <motion.div
            initial={{ opacity: 0, x: -40 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6 }}
          >
            <Card className="shadow-lg border-0" style={{ borderRadius: 24 }}>
              <Card.Body>
                <h2 className="mb-4 text-center">
                  <i className="bi bi-bag-check-fill text-dark" /> Récapitulatif
                </h2>
                <ListGroup variant="flush">
                  {cartItems.map(item => (
                    <ListGroup.Item key={item.id} className="d-flex align-items-center border-0 px-0 py-3">
                      <div style={{ width: 60, height: 60, borderRadius: 16, overflow: 'hidden', marginRight: 16, background: '#f3f3f3' }}>
                        {item.image_url ? (
                          <img src={`http://localhost:5000${item.image_url}`} alt={item.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                        ) : (
                          <div className="d-flex align-items-center justify-content-center h-100 text-muted">
                            <span style={{ fontSize: '12px' }}>Image</span>
                          </div>
                        )}
                      </div>
                      <div className="flex-grow-1">
                        <div className="fw-bold">{item.name}</div>
                        <div className="text-muted small">{item.category}</div>
                        <div className="text-muted small">{item.quantity} x {Number(item.price).toFixed(2)} DT</div>
                      </div>
                      <div className="fw-bold ms-2">{(item.price * item.quantity).toFixed(2)} DT</div>
                    </ListGroup.Item>
                  ))}
                </ListGroup>
                <hr />
                <div className="d-flex justify-content-between mb-2">
                  <span>Sous-total</span>
                  <span className="fw-bold">{getCartTotal().toFixed(2)} DT</span>
                </div>
                <div className="d-flex justify-content-between mb-2">
                  <span>Livraison</span>
                  <span>À payer à la livraison</span>
                </div>
                <hr />
                <div className="d-flex justify-content-between mb-0 fw-bold fs-5">
                  <span>Total</span>
                  <span>{getCartTotal().toFixed(2)} DT</span>
                </div>
                <div className="mt-4 bg-light p-3 rounded-3">
                  <p className="small mb-0">
                    <i className="bi bi-info-circle text-dark" /> 
                    Cette commande sera traitée manuellement. Vous recevrez un appel pour confirmation et livraison.
                  </p>
                </div>
              </Card.Body>
            </Card>
          </motion.div>
        </Col>
        <Col lg={5} className="mb-4">
          <motion.div
            initial={{ opacity: 0, x: 40 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6 }}
          >
            <Card className="shadow-lg border-0 glassy-card" style={{
              borderRadius: 24,
              background: 'rgba(255,255,255,0.85)',
              backdropFilter: 'blur(8px)'
            }}>
              <Card.Body>
                <h2 className="mb-4 text-center">
                  <i className="bi bi-person-lines-fill text-dark" /> Vos coordonnées
                </h2>
                <div className="mb-4 d-flex justify-content-center">
                  <div className="progress" style={{ width: 180, height: 10, background: '#e9ecef' }}>
                    <div className="progress-bar bg-dark" style={{ width: '60%' }} />
                  </div>
                </div>
                {errorMsg && <Alert variant="danger">{errorMsg}</Alert>}
                <Form noValidate validated={validated} onSubmit={handleSubmit} autoComplete="off">
                  <Row>
                    <Col md={6}>
                      <Form.Group className="mb-3">
                        <Form.Label><i className="bi bi-person-fill" /> Prénom *</Form.Label>
                        <Form.Control
                          type="text"
                          name="firstName"
                          value={formData.firstName}
                          onChange={handleChange}
                          required
                        />
                        <Form.Control.Feedback type="invalid">
                          Veuillez entrer votre prénom.
                        </Form.Control.Feedback>
                      </Form.Group>
                    </Col>
                    <Col md={6}>
                      <Form.Group className="mb-3">
                        <Form.Label><i className="bi bi-person-fill" /> Nom *</Form.Label>
                        <Form.Control
                          type="text"
                          name="lastName"
                          value={formData.lastName}
                          onChange={handleChange}
                          required
                        />
                        <Form.Control.Feedback type="invalid">
                          Veuillez entrer votre nom.
                        </Form.Control.Feedback>
                      </Form.Group>
                    </Col>
                  </Row>
                  <Row>
                    <Col md={6}>
                      <Form.Group className="mb-3">
                        <Form.Label><i className="bi bi-telephone-fill" /> Téléphone *</Form.Label>
                        <Form.Control
                          type="tel"
                          name="phone"
                          value={formData.phone}
                          onChange={handleChange}
                          required
                        />
                        <Form.Control.Feedback type="invalid">
                          Veuillez entrer votre numéro de téléphone.
                        </Form.Control.Feedback>
                      </Form.Group>
                    </Col>
                    <Col md={6}>
                      <Form.Group className="mb-3">
                        <Form.Label><i className="bi bi-envelope-fill" /> Email *</Form.Label>
                        <Form.Control
                          type="email"
                          name="email"
                          value={formData.email}
                          onChange={handleChange}
                          required
                        />
                        <Form.Control.Feedback type="invalid">
                          Veuillez entrer une adresse email valide.
                        </Form.Control.Feedback>
                      </Form.Group>
                    </Col>
                  </Row>
                  <Form.Group className="mb-3">
                    <Form.Label><i className="bi bi-geo-alt-fill" /> Adresse *</Form.Label>
                    <Form.Control
                      type="text"
                      name="address"
                      value={formData.address}
                      onChange={handleChange}
                      required
                    />
                    <Form.Control.Feedback type="invalid">
                      Veuillez entrer votre adresse.
                    </Form.Control.Feedback>
                      </Form.Group>
                  <Row>
                    <Col md={6}>
                      <Form.Group className="mb-3">
                        <Form.Label><i className="bi bi-building" /> Ville *</Form.Label>
                        <Form.Control
                          type="text"
                          name="city"
                          value={formData.city}
                          onChange={handleChange}
                          required
                        />
                        <Form.Control.Feedback type="invalid">
                          Veuillez entrer votre ville.
                        </Form.Control.Feedback>
                      </Form.Group>
                    </Col>
                    <Col md={6}>
                      <Form.Group className="mb-3">
                        <Form.Label><i className="bi bi-mailbox" /> Code postal *</Form.Label>
                        <Form.Control
                          type="text"
                          name="postalCode"
                          value={formData.postalCode}
                          onChange={handleChange}
                          required
                        />
                        <Form.Control.Feedback type="invalid">
                          Veuillez entrer votre code postal.
                        </Form.Control.Feedback>
                      </Form.Group>
                    </Col>
                  </Row>
                  <Form.Group className="mb-4">
                    <Form.Label><i className="bi bi-chat-left-text" /> Instructions de livraison (optionnel)</Form.Label>
                    <Form.Control
                      as="textarea"
                      rows={2}
                      name="notes"
                      value={formData.notes}
                      onChange={handleChange}
                    />
                  </Form.Group>
                  <div className="mb-3">
                    <p className="mb-0">
                      <strong><i className="bi bi-cash-coin" /> Paiement:</strong> À la livraison
                    </p>
                  </div>
                  <motion.div
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    className="d-grid"
                  >
                    <Button variant="dark" size="lg" type="submit">
                      Continuer
                    </Button>
                  </motion.div>
                </Form>
              </Card.Body>
            </Card>
          </motion.div>
        </Col>
      </Row>
      <style>{`
        .glassy-card {
          box-shadow: 0 8px 32px 0 rgba(31, 38, 135, 0.15);
        }
        .bg-dark, .btn-dark, .progress-bar.bg-dark {
          background: #212529 !important;
          color: #fff !important;
        }
        .text-dark { color: #212529 !important; }
      `}</style>
    </Container>
    </div>
  );
};

export default CheckoutPage;