import React, { useState } from 'react';
import { Container, Card, Button, Alert, Spinner, ListGroup, Row, Col } from 'react-bootstrap';
import { Link, useLocation, useNavigate, Navigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useCart } from '../../context/CartContext';
import api from '../../services/api';

const ConfirmationPage = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { clearCart } = useCart();
  const orderData = location.state?.orderData;
  const cartItems = location.state?.cartItems;
  const [loading, setLoading] = useState(false);
  const [orderComplete, setOrderComplete] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  if (!orderData || !cartItems) {
    return <Navigate to="/" replace />;
  }

  const handleConfirm = async () => {
    setLoading(true);
    setErrorMsg('');
    try {
      // Transform data to match backend expected format
      const orderPayload = {
        client_name: `${orderData.firstName} ${orderData.lastName}`,
        client_email: orderData.email,
        client_phone: orderData.phone,
        client_address: `${orderData.address}, ${orderData.city} ${orderData.postalCode}`,
        notes: orderData.notes || '',
        items: cartItems.map(item => ({
          product_id: item.id,
          quantity: parseInt(item.quantity) || 1,
          price: parseFloat(item.price) || 0
        }))
      };

      console.log('Order payload being sent:', orderPayload);
      
      await api.publicAPI.createOrder(orderPayload);
      setOrderComplete(true);
      clearCart();
    } catch (err) {
      console.error('Order creation error:', err);
      const errorMessage = err.response?.data?.message || 'Erreur lors de la commande. Veuillez réessayer.';
      setErrorMsg(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = () => {
    navigate('/boutique/checkout', { state: { orderData } });
  };

  return (
    <Container fluid className="confirmation-bg py-5" style={{ 
      minHeight: '100vh', 
      background: 'linear-gradient(120deg, #f8f9fa 60%, #e8f5e9 100%)' 
    }}>
      <Row className="justify-content-center align-items-center">
        <Col md={8} lg={7}>
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <Card className="shadow-lg border-0" style={{ borderRadius: 32, overflow: 'hidden' }}>
              <div
                className="d-flex flex-column align-items-center justify-content-center"
                style={{
                  background: 'linear-gradient(90deg, #2e7d32 0%, #4caf50 100%)',
                  padding: '2rem 0'
                }}
              >
                <i className="bi bi-clipboard-check text-white" style={{ fontSize: 48 }} />
                <h2 className="text-white mt-2 mb-0 text-center">Vérification de la commande</h2>
              </div>
              <Card.Body className="p-4">
                <Row>
                  <Col md={6} className="mb-4 mb-md-0">
                    <h5 className="mb-3 text-dark">Vos informations</h5>
                    <ListGroup variant="flush">
                      <ListGroup.Item><strong>Nom:</strong> {orderData.firstName} {orderData.lastName}</ListGroup.Item>
                      <ListGroup.Item><strong>Email:</strong> {orderData.email}</ListGroup.Item>
                      <ListGroup.Item><strong>Téléphone:</strong> {orderData.phone}</ListGroup.Item>
                      <ListGroup.Item><strong>Adresse:</strong> {orderData.address}, {orderData.city}, {orderData.postalCode}</ListGroup.Item>
                      {orderData.notes && <ListGroup.Item><strong>Notes:</strong> {orderData.notes}</ListGroup.Item>}
                    </ListGroup>
                  </Col>
                  <Col md={6}>
                    <h5 className="mb-3 text-dark">Votre panier</h5>
                    <ListGroup variant="flush">
                      {cartItems.map(item => (
                        <ListGroup.Item key={item.id} className="d-flex align-items-center">
                          <img 
                            src={item.image_url ? `http://localhost:5000${item.image_url}` : '/placeholder.jpg'} 
                            alt={item.name} 
                            style={{ width: 40, height: 40, objectFit: 'cover', borderRadius: 8, marginRight: 12 }} 
                          />
                          <div>
                            <div className="fw-bold">{item.name}</div>
                            <div className="small text-muted">{item.quantity} x {Number(item.price).toFixed(2)} DT</div>
                          </div>
                          <div className="ms-auto fw-bold">{(item.price * item.quantity).toFixed(2)} DT</div>
                        </ListGroup.Item>
                      ))}
                    </ListGroup>
                    <div className="d-flex justify-content-between mt-3">
                      <span className="fw-bold">Total</span>
                      <span className="fw-bold text-dark">{cartItems.reduce((t, i) => t + i.price * i.quantity, 0).toFixed(2)} DT</span>
                    </div>
                  </Col>
                </Row>
                <hr className="my-4" />
                {errorMsg && <Alert variant="danger">{errorMsg}</Alert>}
                {orderComplete ? (
                  <Alert variant="success" className="text-center">
                    <i className="bi bi-check-circle-fill fs-2 text-success" /> <br />
                    Commande envoyée ! Merci pour votre achat.
                    <div className="mt-3">
                      <Link to="/" className="btn btn-success px-4">
                        Retour à l'accueil
                      </Link>
                    </div>
                  </Alert>
                ) : (
                  <div className="d-flex justify-content-center gap-3">
                    <Button variant="outline-success" onClick={handleEdit} disabled={loading}>
                      <i className="bi bi-pencil-square me-2" />Modifier
                    </Button>
                    <Button variant="success" onClick={handleConfirm} disabled={loading} style={{ minWidth: 180 }}>
                      {loading ? <Spinner animation="border" size="sm" /> : <><i className="bi bi-check2-circle me-2" />Confirmer la commande</>}
                    </Button>
                  </div>
                )}
              </Card.Body>
            </Card>
            <div className="text-center mt-4">
              <span className="text-muted">Des questions ? </span>
              <Link to="/contact" className="text-decoration-none text-dark">Contactez-nous</Link>
            </div>
          </motion.div>
        </Col>
      </Row>
      <style>{`
        .text-dark { color: #2e7d32 !important; }
        .btn-success, .bg-success {
          background: #2e7d32 !important;
          color: #fff !important;
          border: none;
        }
        .btn-success:hover {
          background: #1b5e20 !important;
        }
        .btn-outline-success {
          color: #2e7d32 !important;
          border-color: #2e7d32 !important;
        }
        .btn-outline-success:hover {
          background: #2e7d32 !important;
          color: #fff !important;
        }
      `}</style>
    </Container>
  );
};

export default ConfirmationPage;