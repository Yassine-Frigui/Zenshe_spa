import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Button, Form, Alert, Badge } from 'react-bootstrap';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { useCart } from '../../context/CartContext';
import api from '../../services/api';
import { getImageUrl } from '../../utils/apiConfig';

const ProductDetailPage = () => {
  const { t, i18n } = useTranslation();
  const { productId } = useParams();
  const id = productId;
  const navigate = useNavigate();
  const { addToCart } = useCart();
  const [quantity, setQuantity] = useState(1);
  const [addedToCart, setAddedToCart] = useState(false);
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const currentLanguage = i18n.language || 'fr';
    api.publicAPI.getProduct(id, { lang: currentLanguage })
      .then(response => {
        console.log('Product API response:', response.data);
        // Backend returns { success: true, data: product }
        const productData = response.data?.data || response.data;
        setProduct(productData);
      })
      .catch(error => {
        console.error('Error fetching product:', error);
        setProduct(null);
      })
      .finally(() => setLoading(false));
  }, [id, i18n.language]); // Re-fetch when language changes

  const handleQuantityChange = (e) => {
    const value = parseInt(e.target.value);
    if (value >= 1) {
      setQuantity(value);
    }
  };

  const getPreorderStatus = () => {
    return <Badge bg="info">{t('productDetail.preorder', { days: product.estimated_delivery_days || 14 })}</Badge>;
  };

  const handleAddToCart = () => {
    addToCart(product, quantity);
    setAddedToCart(true);
    setTimeout(() => setAddedToCart(false), 3000);
  };

  if (loading) return <Container className="py-5"><p>{t('productDetail.loading')}</p></Container>;
  if (!product) return <Container className="py-5"><Alert variant="danger">{t('productDetail.notFound')}</Alert></Container>;

  return (
    <div className="product-detail-page" style={{ backgroundColor: '#fff', color: '#333' }}>
      <Container className="py-5">
        {addedToCart && (
          <motion.div
            initial={{ opacity: 0, y: -50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -50 }}
          >
            <Alert variant="success" className="mb-4">
              {t('productDetail.addedToCart')}
              <Button variant="link" className="text-success" onClick={() => navigate('/boutique/panier')}>{t('productDetail.viewCart')}</Button>
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
              {product.image_url ? (
                <img
                  src={getImageUrl(product.image_url)}
                  alt={product.name}
                  style={{ width: '100%', borderRadius: '15px' ,objectFit : 'contain', height: '500px' }}
                />
              ) : (
                <div style={{ height: '500px', backgroundColor: '#f8f9fa', display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: '15px' }}>
                  <p className="text-muted">{t('productDetail.noImage')}</p>
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
                <Form.Label className="me-3 mb-0">{t('productDetail.quantity')}:</Form.Label>
                <Form.Control 
                  type="number" 
                  min="1" 
                  max={99}
                  value={quantity} 
                  onChange={handleQuantityChange}
                  style={{ width: '80px' }}
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
                >
                  {t('productDetail.orderPreorder')}
                </Button>
              </motion.div>
              
                <div style={{ backgroundColor: '#f8f9fa', padding: '15px', borderRadius: '10px' }}>
                <p className="mb-2"><strong>{t('productDetail.delivery')}:</strong> {product.estimated_delivery_days || 14} {t('productDetail.workingDays')}</p>
                <p className="mb-2"><strong>{t('productDetail.status')}:</strong> {getPreorderStatus()}</p>
                <p className="mb-0"><strong>{t('productDetail.payment')}:</strong> {t('productDetail.payOnDelivery')}</p>
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
      <h2 className="fw-bold mb-4">{t('productDetail.details')}</h2>
          <Row>
            <Col md={8}>
        <p><strong>{t('productDetail.volumeWeight')}:</strong> {product.volume || product.weight}</p>
        <p><strong>{t('productDetail.ingredients')}:</strong> {product.ingredients}</p>
            </Col>
          </Row>
        </motion.div>
      </Container>
    </div>
  );
};

export default ProductDetailPage;
