import React from 'react';
import { Container, Row, Col, Card, Button, Image, Form, Alert, ListGroup } from 'react-bootstrap';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useCart } from '../../context/CartContext';

const CartPage = () => {
  const { cartItems, removeFromCart, updateQuantity, getCartTotal } = useCart();
  const navigate = useNavigate();
  console.log(localStorage.getItem('cart'));  


  if (cartItems.length === 0) {
    return (
      <div className="cart-page">
        <Container className="py-5 text-center">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5 }}
        >
          <Alert variant="secondary" className="mb-4">
            <i className="bi bi-cart-x fs-2 mb-2 d-block"></i>
            Votre panier est vide
          </Alert>
          <p className="mb-4">Ajoutez vos produits préférés pour les retrouver ici !</p>
          <Link to="/boutique" className="btn btn-primary">
            Découvrir nos produits
          </Link>
        </motion.div>
      </Container>
      </div>
    );
  }

  return (
    <div className="cart-page">
      <Container className="py-5">
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <Row className="g-4">
          <Col md={8}>
            <h2 className="mb-4">Votre sélection</h2>
            <ListGroup variant="flush">
              {cartItems.map(item => (
                <motion.li
                  key={item.id}
                  className="list-group-item px-0 py-4 border-bottom"
                  initial={{ opacity: 0, x: -30 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.3 }}
                >
                  <Row className="align-items-center">
                    <Col xs={3} md={2}>
                      <div className="bg-light rounded d-flex align-items-center justify-content-center" style={{ width: 80, height: 80, overflow: 'hidden' }}>
                        {item.image_url ? (
                          <Image   src={`http://localhost:5000${item.image_url}`}
                          alt={item.name} fluid style={{ maxHeight: 80, maxWidth: 80 }} />
                        ) : (
                          <span className="text-muted small">Image</span>
                        )}
                      </div>
                    </Col>
                    <Col xs={9} md={4}>
                      <h5 className="mb-1">{item.name}</h5>
                      <div className="text-muted small">{item.category}</div>
                    </Col>
                    <Col xs={6} md={2} className="mt-3 mt-md-0">
                      <div className="fw-bold">{Number(item.price).toFixed(2)} DT</div>
                    </Col>
                    <Col xs={6} md={2} className="mt-3 mt-md-0">
                      <div className="d-flex align-items-center">
                        <Button
                          variant="outline-secondary"
                          size="sm"
                          onClick={() => updateQuantity(item.id, item.quantity - 1)}
                          disabled={item.quantity <= 1}
                        >
                          -
                        </Button>
                        <Form.Control
                          type="number"
                          min="1"
                          value={item.quantity}
                          onChange={(e) => updateQuantity(item.id, parseInt(e.target.value))}
                          className="mx-2 text-center"
                          style={{ width: '50px' }}
                        />
                        <Button
                          variant="outline-secondary"
                          size="sm"
                          onClick={() => updateQuantity(item.id, item.quantity + 1)}
                        >
                          +
                        </Button>
                      </div>
                    </Col>
                    <Col xs={12} md={2} className="mt-3 mt-md-0 text-end">
                      <div className="fw-bold mb-2">{(item.price * item.quantity).toFixed(2)} DT</div>
                      <Button
                        variant="outline-danger"
                        size="sm"
                        onClick={() => removeFromCart(item.id)}
                      >
                        <i className="bi bi-trash"></i> Retirer
                      </Button>
                    </Col>
                  </Row>
                </motion.li>
              ))}
            </ListGroup>
            <div className="mt-4">
              <Link to="/boutique" className="btn btn-outline-primary">
                Continuer vos achats
              </Link>
            </div>
          </Col>
          <Col md={4}>
            <Card className="shadow-sm sticky-top" style={{ top: 90, borderColor: '#e8f5e9' }}>
              <Card.Body>
                <h4 className="mb-4">Résumé de la commande</h4>
                <div className="d-flex justify-content-between mb-2">
                  <span>Sous-total</span>
                  <span>{getCartTotal().toFixed(2)} DT</span>
                </div>
                <div className="d-flex justify-content-between mb-2">
                  <span>Livraison</span>
                  <span>À payer à la livraison</span>
                </div>
                <hr style={{ borderColor: '#e8f5e9' }} />
                <div className="d-flex justify-content-between mb-4 fw-bold">
                  <span>Total</span>
                  <span>{getCartTotal().toFixed(2)} DT</span>
                </div>
                <motion.div
                  whileHover={{ scale: 1.03 }}
                  whileTap={{ scale: 0.97 }}
                >
                  <Button
                    variant="success"
                    className="w-100"
                    size="lg"
                    onClick={() => navigate('/boutique/checkout')}
                  >
                    Passer la commande
                  </Button>
                </motion.div>
              </Card.Body>
            </Card>
          </Col>
        </Row>
      </motion.div>
    </Container>
    </div>
  );
};

export default CartPage;