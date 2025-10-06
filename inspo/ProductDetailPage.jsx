import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Button, Form, Alert, Badge } from 'react-bootstrap';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useCart } from '../context/CartContext';
import { fetchProduct } from '../api/productApi';

const ProductDetailPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { addToCart } = useCart();
  const [quantity, setQuantity] = useState(1);
  const [addedToCart, setAddedToCart] = useState(false);
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchProduct(id)
      .then(data => setProduct(data))
      .catch(() => setProduct(null))
      .finally(() => setLoading(false));
  }, [id]);

  const handleQuantityChange = (e) => {
    const value = parseInt(e.target.value);
    if (value >= 1) {
      setQuantity(value);
    }
  };

  const getStockStatus = (stock) => {
    const qty = typeof stock !== 'undefined' ? stock : 0;
    if (qty === 0) return <Badge bg="danger">Épuisé</Badge>;
    if (qty < 5) return <Badge bg="warning" text="dark">Stock bas</Badge>;
    return <Badge bg="success">En stock</Badge>;
  };

  const handleAddToCart = () => {
    addToCart(product, quantity);
    setAddedToCart(true);
    setTimeout(() => setAddedToCart(false), 3000);
  };

  if (loading) return <Container className="py-5"><p>Chargement...</p></Container>;
  if (!product) return <Container className="py-5"><Alert variant="danger">Produit introuvable</Alert></Container>;

  return (
    <div style={{ backgroundColor: '#fff', color: '#333', paddingTop: '42px' }}>
      <Container className="py-5">
        {addedToCart && (
          <motion.div
            initial={{ opacity: 0, y: -50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -50 }}
          >
            <Alert variant="success" className="mb-4">
              Produit ajouté au panier avec succès!
              <Button variant="link" className="text-success" onClick={() => navigate('/panier')}>Voir le panier</Button>
            </Alert>
          </motion.div>
        )}

        <Row>
          <Col lg={6} className="mb-4">
            <motion.div
              initial={{ opacity: 0, x: -50 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5 }}
            >
              {product.image ? (
                <img
                  src={`http://localhost:5000/${product.image}`}
                  alt={product.name}
                  style={{ width: '100%', borderRadius: '15px' ,objectFit : 'contain', height: '500px' }}
                />
              ) : (
                <div style={{ height: '500px', backgroundColor: '#f8f9fa', display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: '15px' }}>
                  <p className="text-muted">Image non disponible</p>
                </div>
              )}
            </motion.div>
          </Col>
          
          <Col lg={6}>
            <motion.div
              initial={{ opacity: 0, x: 50 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5 }}
            >
              <h1 className="fw-bold mb-2">{product.name}</h1>
              <p className="fs-2 fw-bold mb-3 text-primary">{Number(product.price).toFixed(2)} DT</p>
              
              <p className="mb-4">{product.description}</p>
              
              <div className="d-flex align-items-center mb-4">
                <Form.Label className="me-3 mb-0">Quantité:</Form.Label>
                <Form.Control 
                  type="number" 
                  min="1" 
                  value={quantity} 
                  onChange={handleQuantityChange}
                  style={{ width: '80px' }}
                  disabled={(product.stock ?? 0) === 0}
                />
              </div>
              
              <motion.div
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="mb-4"
              >
                <Button 
                  variant="primary"
                  size="lg"
                  onClick={handleAddToCart}
                  className="w-100"
                  disabled={(product.stock ?? 0) === 0}
                >
                  {(product.stock ?? 0) === 0 ? "Épuisé" : "Ajouter au panier"}
                </Button>
              </motion.div>
              
                <div style={{ backgroundColor: '#f8f9fa', padding: '15px', borderRadius: '10px' }}>
                <p className="mb-2"><strong>Livraison:</strong> 2-3 jours ouvrables</p>
                <p className="mb-2"><strong>Statut:</strong> {getStockStatus(product.stock)}</p>
                <p className="mb-0"><strong>Paiement:</strong> À la livraison</p>
              </div>
            </motion.div>
          </Col>
        </Row>
        
        <motion.div
          initial={{ opacity: 0, y: 50 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          viewport={{ once: true }}
          className="mt-5 pt-4 border-top"
        >
      <h2 className="fw-bold mb-4">Détails du produit</h2>
          <Row>
            <Col md={8}>
        <p><strong>Volume / Poids:</strong> {product.volume || product.weight}</p>
        <p><strong>Ingrédients:</strong> {product.ingredients}</p>
            </Col>
          </Row>
        </motion.div>
      </Container>
    </div>
  );
};

export default ProductDetailPage;
