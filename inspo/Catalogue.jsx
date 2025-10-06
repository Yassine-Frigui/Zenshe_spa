import React, { useEffect, useState } from 'react';
import { Container, Row, Col, Card, Badge, Form } from 'react-bootstrap';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { fetchProducts, fetchCategories } from '../api/productApi';
import { useCart } from '../context/CartContext';

const Catalogue = () => {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState('');
  const [search, setSearch] = useState('');
  const [sort, setSort] = useState('newest');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchProducts()
      .then(setProducts)
      .catch(() => setProducts([]))
      .finally(() => setLoading(false));
    fetchCategories()
      .then(setCategories)
      .catch(() => setCategories([]));
  }, []);

  let filteredProducts = products.filter(product =>
    (!selectedCategory || product.category === selectedCategory) &&
    (!search || product.name.toLowerCase().includes(search.toLowerCase()))
  );

  if (sort === 'price-asc') {
    filteredProducts = filteredProducts.sort((a, b) => a.price - b.price);
  } else if (sort === 'price-desc') {
    filteredProducts = filteredProducts.sort((a, b) => b.price - a.price);
  } else if (sort === 'newest') {
    filteredProducts = filteredProducts.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  }

  const getAvailabilityBadge = (stock) => {
    const qty = typeof stock !== 'undefined' ? stock : 0;
    if (qty === 0) {
      return <Badge bg="danger">Épuisé</Badge>;
    }
    if (qty < 5) {
      return <Badge bg="warning" text="dark">Stock bas</Badge>;
    }
    return <Badge bg="success">En stock</Badge>;
  };

  const { addToCart } = useCart();

  const [addedIds, setAddedIds] = useState([]);
  const [notifications, setNotifications] = useState([]);

  const addNotification = (message, href) => {
    const id = Date.now() + Math.random();
    setNotifications(prev => [...prev, { id, message, href }]);
    setTimeout(() => {
      setNotifications(prev => prev.filter(n => n.id !== id));
    }, 5000);
  };

  const handleQuickOrder = (product) => {
    addToCart(product, 1);
    setAddedIds(prev => [...prev, product.id]);
  addNotification(`${product.name} ajouté au panier`, '/panier');
    setTimeout(() => setAddedIds(prev => prev.filter(id => id !== product.id)), 1500);
  };

  return (
    <div style={{ backgroundColor: '#f8f9fa', minHeight: '100vh' }}>
      <motion.div
        className="py-5 mb-4"
        style={{
          backgroundColor: '#343a40',
          color: 'white',
        }}
        initial={{ opacity: 0, y: -30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.7 }}
      >
        <Container className="text-center">
          <h1 className="display-4 fw-bold mb-3">Explorez Notre Collection</h1>
          <p className="lead mx-auto text-black" style={{ maxWidth: 700 }}>
            Découvrez Nos Produits et routines, formulés pour répondre aux besoins de chaque type de peau.
          </p>
        </Container>
      </motion.div>

      <Container>
        <Row className="mb-4 align-items-center">
          <Col md={4} className="mb-3 mb-md-0">
            <Form.Control
              type="text"
              placeholder="Rechercher un produit..."
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </Col>
          <Col md={4} className="mb-3 mb-md-0">
            <Form.Select
              value={selectedCategory}
              onChange={e => setSelectedCategory(e.target.value)}
            >
              <option value="">Toutes les catégories</option>
              {categories.map(cat => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </Form.Select>
          </Col>
          <Col md={4}>
            <Form.Select
              value={sort}
              onChange={e => setSort(e.target.value)}
            >
              <option value="newest">Nouveautés</option>
              <option value="price-asc">Prix croissant</option>
              <option value="price-desc">Prix décroissant</option>
            </Form.Select>
          </Col>
        </Row>

        <Row className="g-4 justify-content-center">
          {loading ? (
            <Col xs={12} className="text-center py-5">
              <div className="spinner-border text-primary" />
            </Col>
          ) : filteredProducts.length === 0 ? (
            <Col xs={12} className="text-center py-5">
              <p className="text-muted">Aucun produit trouvé.</p>
            </Col>
          ) : (
            <AnimatePresence>
              {filteredProducts.map(product => (
                <Col xs={12} sm={6} md={4} lg={3} key={product.id}>
                  <motion.div
                    initial={{ opacity: 0, scale: 0.95, y: 20 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95, y: 20 }}
                    transition={{ duration: 0.4 }}
                    whileHover={{ y: -5 }}
                  >
                    <Card className="h-100 border-0 shadow-sm">
                      <Link to={`/produits/${product.id}`}>
                        <Card.Img
                          variant="top"
                          src={`http://localhost:5000/${product.image}`}
                          alt={product.name}
                          style={{ height: '260px', objectFit: 'cover' }}
                        />
                      </Link>
                      <Card.Body className="text-center d-flex flex-column">
                        <Card.Title className="fw-bold mb-2">{product.name}</Card.Title>
                        <Card.Text className="text-muted mb-3" style={{ minHeight: 48 }}>
                          {product.description ? product.description.substring(0, 60) + '...' : ''}
                        </Card.Text>
                        <div className="mb-3 fs-5 fw-bold text-primary">
                          {Number(product.price).toFixed(2)} DT
                        </div>
                        <div className="mt-auto d-flex flex-column align-items-center gap-2" style={{ paddingTop: 8 }}>
                          <Link to={`/produits/${product.id}`} className="btn btn-outline-primary btn-sm rounded-pill py-1 px-3">
                            Détails
                          </Link>
                          <button
                            className="btn btn-success btn-sm rounded-pill py-1 px-3"
                            onClick={() => handleQuickOrder(product)}
                            disabled={(product.stock ?? 0) === 0}
                          >
                            {addedIds.includes(product.id) ? 'Ajouté' : 'Commander'}
                          </button>
                        </div>
                      </Card.Body>
                      <Card.Footer className="text-center">
                        {getAvailabilityBadge(product.stock)}
                      </Card.Footer>
                    </Card>
                  </motion.div>
                </Col>
              ))}
            </AnimatePresence>
          )}
        </Row>
      </Container>
      {/* Notification strip container (animated) */}
      <div style={{ position: 'fixed', right: 16, bottom: 24, zIndex: 1050, display: 'flex', flexDirection: 'column', alignItems: 'flex-end' }}>
        <AnimatePresence initial={false}>
          {notifications.map((n, idx) => (
            <motion.div
              key={n.id}
              initial={{ x: 320, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: 320, opacity: 0 }}
              transition={{ type: 'spring', stiffness: 350, damping: 28 }}
              style={{
                minWidth: 320,
                background: '#fff',
                color: '#333',
                padding: '12px 16px',
                borderRadius: 10,
                boxShadow: '0 8px 28px rgba(0,0,0,0.14)',
                marginTop: idx === 0 ? 0 : 12,
                display: 'flex',
                alignItems: 'center',
                gap: 12
              }}
            >
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 700, fontSize: 15 }}>{n.message}</div>
                <a href={n.href} style={{ fontSize: 14, color: '#0d6efd', textDecoration: 'underline' }}>Voir le panier</a>
              </div>
              <div style={{ fontSize: 20, color: '#0d6efd' }}>🧺</div>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default Catalogue;
