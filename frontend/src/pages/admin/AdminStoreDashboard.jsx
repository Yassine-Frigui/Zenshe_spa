import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { FaStore, FaShoppingBag, FaBoxOpen, FaEye, FaEdit, FaPlus, FaTrash, FaImage, FaTimes, FaPhone, FaEnvelope, FaMapMarkerAlt, FaSave } from 'react-icons/fa';
import { Modal, Button, Form } from 'react-bootstrap';
import { toast } from 'react-toastify';
import { adminAPI } from '../../services/api';

const AdminStoreDashboard = () => {
  const [loading, setLoading] = useState(true);
  const [products, setProducts] = useState([]);
  const [orders, setOrders] = useState([]);
  const [categories, setCategories] = useState([]);
  
  // Product modal state
  const [showProductModal, setShowProductModal] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [productForm, setProductForm] = useState({
    name: '',
    description: '',
    detailed_description: '',
    price: '',
    category_id: '',
    image_url: '',
    is_active: true,
    is_featured: false,
    estimated_delivery_days: 14,
    weight: '',
    dimensions: '',
    sku: ''
  });
  const [uploadingImage, setUploadingImage] = useState(false);
  
  // Order modal state
  const [showOrderModal, setShowOrderModal] = useState(false);
  const [editingOrder, setEditingOrder] = useState(null);
  const [orderForm, setOrderForm] = useState({
    status: '',
    notes: ''
  });
  
  // Active tab
  const [activeTab, setActiveTab] = useState('products'); // 'products' or 'orders'

  useEffect(() => {
    fetchStoreData();
    fetchCategories();
  }, []);

  const fetchStoreData = async () => {
    try {
      setLoading(true);
      
      const productsResponse = await adminAPI.getStoreProducts({ limit: 100 });
      if (productsResponse.data.success) {
        setProducts(productsResponse.data.data || []);
      }

      const ordersResponse = await adminAPI.getStoreOrders({ limit: 100 });
      if (ordersResponse.data.success) {
        setOrders(ordersResponse.data.data || []);
      }

    } catch (error) {
      console.error('Error fetching store data:', error);
      toast.error('Erreur lors du chargement des données boutique');
    } finally {
      setLoading(false);
    }
  };
  
  const fetchCategories = async () => {
    try {
      const response = await adminAPI.getStoreCategories();
      if (response.data.success) {
        setCategories(response.data.data || []);
      }
    } catch (error) {
      console.error('Error fetching categories:', error);
    }
  };
  
  // Product handlers
  const handleAddProduct = () => {
    setEditingProduct(null);
    setProductForm({
      name: '',
      description: '',
      detailed_description: '',
      price: '',
      category_id: '',
      image_url: '',
      is_active: true,
      is_featured: false,
      estimated_delivery_days: 14,
      weight: '',
      dimensions: '',
      sku: ''
    });
    setShowProductModal(true);
  };
  
  const handleEditProduct = (product) => {
    setEditingProduct(product);
    setProductForm({
      name: product.name || '',
      description: product.description || '',
      detailed_description: product.detailed_description || '',
      price: product.price || '',
      category_id: product.category_id || '',
      image_url: product.image_url || '',
      is_active: product.is_active !== undefined ? product.is_active : true,
      is_featured: product.is_featured || false,
      estimated_delivery_days: product.estimated_delivery_days || 14,
      weight: product.weight || '',
      dimensions: product.dimensions || '',
      sku: product.sku || ''
    });
    setShowProductModal(true);
  };
  
  const handleImageUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    
    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast.error('Veuillez sélectionner une image valide');
      return;
    }
    
    // Validate file size (5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast.error('L\'image doit faire moins de 5MB');
      return;
    }
    
    try {
      setUploadingImage(true);
      const response = await adminAPI.uploadProductImage(file);
      
      if (response.data.success) {
        setProductForm(prev => ({ ...prev, image_url: response.data.data.imageUrl }));
        toast.success('Image téléchargée avec succès');
      }
    } catch (error) {
      console.error('Error uploading image:', error);
      toast.error('Erreur lors du téléchargement de l\'image');
    } finally {
      setUploadingImage(false);
    }
  };
  
  const handleSaveProduct = async () => {
    try {
      // Validation
      if (!productForm.name || !productForm.price || !productForm.category_id) {
        toast.error('Veuillez remplir tous les champs obligatoires');
        return;
      }
      
      const productData = {
        ...productForm,
        price: parseFloat(productForm.price),
        category_id: parseInt(productForm.category_id),
        is_active: productForm.is_active ? 1 : 0,
        is_featured: productForm.is_featured ? 1 : 0,
        is_preorder: 1, // All products are preorder
        estimated_delivery_days: parseInt(productForm.estimated_delivery_days) || 14,
        weight: productForm.weight ? parseFloat(productForm.weight) : null,
        dimensions: productForm.dimensions || null,
        sku: productForm.sku || null
      };
      
      if (editingProduct) {
        await adminAPI.updateStoreProduct(editingProduct.id, productData);
        toast.success('Produit mis à jour avec succès');
      } else {
        await adminAPI.createStoreProduct(productData);
        toast.success('Produit créé avec succès');
      }
      
      setShowProductModal(false);
      fetchStoreData();
    } catch (error) {
      console.error('Error saving product:', error);
      toast.error(error.response?.data?.message || 'Erreur lors de la sauvegarde du produit');
    }
  };
  
  const handleDeleteProduct = async (productId) => {
    if (!window.confirm('Êtes-vous sûr de vouloir supprimer ce produit ?')) return;
    
    try {
      await adminAPI.deleteStoreProduct(productId);
      toast.success('Produit supprimé avec succès');
      fetchStoreData();
    } catch (error) {
      console.error('Error deleting product:', error);
      toast.error('Erreur lors de la suppression du produit');
    }
  };
  
  // Order handlers
  const handleEditOrder = (order) => {
    setEditingOrder(order);
    setOrderForm({
      status: order.status || 'pending',
      notes: order.notes || ''
    });
    setShowOrderModal(true);
  };
  
  const handleSaveOrder = async () => {
    try {
      await adminAPI.updateStoreOrderStatus(editingOrder.id, orderForm.status);
      toast.success('Commande mise à jour avec succès');
      setShowOrderModal(false);
      fetchStoreData();
    } catch (error) {
      console.error('Error updating order:', error);
      toast.error('Erreur lors de la mise à jour de la commande');
    }
  };

  const getStatusBadge = (status) => {
    const statusMap = {
      'pending': { class: 'bg-warning text-dark', label: 'En attente' },
      'confirmed': { class: 'bg-success text-white', label: 'Confirmée' },
      'processing': { class: 'bg-info text-white', label: 'En traitement' },
      'shipped': { class: 'bg-primary text-white', label: 'Expédiée' },
      'delivered': { class: 'bg-success text-white', label: 'Livrée' },
      'cancelled': { class: 'bg-danger text-white', label: 'Annulée' }
    };
    const statusInfo = statusMap[status] || { class: 'bg-secondary text-white', label: status };
    return <span className={`badge ${statusInfo.class}`}>{statusInfo.label}</span>;
  };

  if (loading) {
    return (
      <div className="d-flex justify-content-center align-items-center" style={{ minHeight: '60vh' }}>
        <div className="spinner-border text-primary" />
      </div>
    );
  }

  return (
    <div className="container-fluid">
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="mb-4">
        <div className="d-flex justify-content-between align-items-center">
          <h2 className="fw-bold">
            <FaStore className="text-primary me-2" />
            Gestion Boutique
          </h2>
        </div>
      </motion.div>

      {/* Tabs */}
      <ul className="nav nav-tabs mb-4">
        <li className="nav-item">
          <button 
            className={`nav-link ${activeTab === 'products' ? 'active' : ''}`}
            onClick={() => setActiveTab('products')}
          >
            <FaBoxOpen className="me-2" />Produits ({products.length})
          </button>
        </li>
        <li className="nav-item">
          <button 
            className={`nav-link ${activeTab === 'orders' ? 'active' : ''}`}
            onClick={() => setActiveTab('orders')}
          >
            <FaShoppingBag className="me-2" />Commandes ({orders.length})
          </button>
        </li>
      </ul>

      {/* Products Tab */}
      {activeTab === 'products' && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
          <div className="d-flex justify-content-end mb-3">
            <Button variant="primary" onClick={handleAddProduct}>
              <FaPlus className="me-2" />Ajouter un Produit
            </Button>
          </div>
          
          <div className="card">
            <div className="card-body">
              <div className="table-responsive">
                <table className="table table-hover">
                  <thead>
                    <tr>
                      <th style={{width: '80px'}}>Image</th>
                      <th>Nom</th>
                      <th>Catégorie</th>
                      <th>Prix</th>
                      <th>Livraison</th>
                      <th>Statut</th>
                      <th style={{width: '150px'}}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {products.map((product) => (
                      <tr key={product.id}>
                        <td>
                          {product.image_url ? (
                            <img 
                              src={product.image_url} 
                              alt={product.name}
                              style={{width: '60px', height: '60px', objectFit: 'cover', borderRadius: '8px'}}
                              onError={(e) => {
                                e.target.src = 'https://via.placeholder.com/60?text=No+Image';
                              }}
                            />
                          ) : (
                            <div className="d-flex align-items-center justify-content-center bg-light rounded" style={{width: '60px', height: '60px'}}>
                              <FaImage className="text-muted" />
                            </div>
                          )}
                        </td>
                        <td>
                          <strong>{product.name}</strong>
                          <br />
                          <small className="text-muted">{product.sku}</small>
                        </td>
                        <td>{product.category_name || product.category || 'N/A'}</td>
                        <td><strong>{parseFloat(product.price || 0).toFixed(2)} DT</strong></td>
                        <td>
                          <span className="badge bg-info">
                            {product.estimated_delivery_days || 14} jours
                          </span>
                        </td>
                        <td>
                          {product.is_active ? (
                            <span className="badge bg-success">Actif</span>
                          ) : (
                            <span className="badge bg-secondary">Inactif</span>
                          )}
                          {product.is_featured && (
                            <span className="badge bg-warning text-dark ms-1">★ Vedette</span>
                          )}
                        </td>
                        <td>
                          <Button 
                            variant="outline-primary" 
                            size="sm" 
                            className="me-1"
                            onClick={() => handleEditProduct(product)}
                          >
                            <FaEdit />
                          </Button>
                          <Button 
                            variant="outline-danger" 
                            size="sm"
                            onClick={() => handleDeleteProduct(product.id)}
                          >
                            <FaTrash />
                          </Button>
                        </td>
                      </tr>
                    ))}
                    {products.length === 0 && (
                      <tr>
                        <td colSpan="7" className="text-center py-4">
                          <FaBoxOpen size={48} className="text-muted mb-2" />
                          <p className="text-muted">Aucun produit trouvé</p>
                          <Button variant="primary" onClick={handleAddProduct}>
                            <FaPlus className="me-2" />Ajouter votre premier produit
                          </Button>
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </motion.div>
      )}

      {/* Orders Tab */}
      {activeTab === 'orders' && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
          <div className="card">
            <div className="card-body">
              <div className="table-responsive">
                <table className="table table-hover">
                  <thead>
                    <tr>
                      <th>N° Commande</th>
                      <th>Client</th>
                      <th>Contact</th>
                      <th>Adresse</th>
                      <th>Produits</th>
                      <th>Total</th>
                      <th>Statut</th>
                      <th>Date</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {orders.map((order) => (
                      <tr key={order.id}>
                        <td><strong>#{order.order_number || order.id}</strong></td>
                        <td>
                          <strong>{order.client_name}</strong>
                        </td>
                        <td>
                          <div className="small">
                            <FaPhone className="me-1 text-muted" size={12} />
                            {order.client_phone}
                          </div>
                          <div className="small">
                            <FaEnvelope className="me-1 text-muted" size={12} />
                            {order.client_email}
                          </div>
                        </td>
                        <td>
                          <div className="small">
                            <FaMapMarkerAlt className="me-1 text-muted" size={12} />
                            {order.client_address}
                          </div>
                        </td>
                        <td>
                          <span className="badge bg-secondary">
                            {order.items_count || 0} article(s)
                          </span>
                        </td>
                        <td>
                          <strong>{parseFloat(order.total_amount || 0).toFixed(2)} DT</strong>
                        </td>
                        <td>{getStatusBadge(order.status)}</td>
                        <td className="small text-muted">
                          {new Date(order.created_at).toLocaleDateString('fr-FR')}
                        </td>
                        <td>
                          <Button 
                            variant="outline-primary" 
                            size="sm"
                            onClick={() => handleEditOrder(order)}
                          >
                            <FaEdit className="me-1" />Modifier
                          </Button>
                        </td>
                      </tr>
                    ))}
                    {orders.length === 0 && (
                      <tr>
                        <td colSpan="9" className="text-center py-4">
                          <FaShoppingBag size={48} className="text-muted mb-2" />
                          <p className="text-muted">Aucune commande trouvée</p>
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </motion.div>
      )}

      {/* Product Modal */}
      <Modal show={showProductModal} onHide={() => setShowProductModal(false)} size="lg">
        <Modal.Header closeButton>
          <Modal.Title>
            {editingProduct ? 'Modifier le Produit' : 'Ajouter un Produit'}
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form>
            <div className="row">
              <div className="col-md-8">
                <Form.Group className="mb-3">
                  <Form.Label>Nom du Produit *</Form.Label>
                  <Form.Control
                    type="text"
                    value={productForm.name}
                    onChange={(e) => setProductForm({ ...productForm, name: e.target.value })}
                    placeholder="Ex: Chaise de Spa Luxe"
                  />
                </Form.Group>
                
                <Form.Group className="mb-3">
                  <Form.Label>Description Courte</Form.Label>
                  <Form.Control
                    as="textarea"
                    rows={2}
                    value={productForm.description}
                    onChange={(e) => setProductForm({ ...productForm, description: e.target.value })}
                    placeholder="Description courte pour les listes de produits"
                  />
                </Form.Group>
                
                <Form.Group className="mb-3">
                  <Form.Label>Description Détaillée</Form.Label>
                  <Form.Control
                    as="textarea"
                    rows={3}
                    value={productForm.detailed_description}
                    onChange={(e) => setProductForm({ ...productForm, detailed_description: e.target.value })}
                    placeholder="Description complète du produit"
                  />
                </Form.Group>
                
                <div className="row">
                  <div className="col-md-6">
                    <Form.Group className="mb-3">
                      <Form.Label>Prix (DT) *</Form.Label>
                      <Form.Control
                        type="number"
                        step="0.01"
                        value={productForm.price}
                        onChange={(e) => setProductForm({ ...productForm, price: e.target.value })}
                        placeholder="0.00"
                      />
                    </Form.Group>
                  </div>
                  <div className="col-md-6">
                    <Form.Group className="mb-3">
                      <Form.Label>Catégorie *</Form.Label>
                      <Form.Select
                        value={productForm.category_id}
                        onChange={(e) => setProductForm({ ...productForm, category_id: e.target.value })}
                      >
                        <option value="">Sélectionner une catégorie</option>
                        {categories.map(cat => (
                          <option key={cat.id} value={cat.id}>{cat.name}</option>
                        ))}
                      </Form.Select>
                    </Form.Group>
                  </div>
                </div>
                
                <div className="row">
                  <div className="col-md-4">
                    <Form.Group className="mb-3">
                      <Form.Label>SKU</Form.Label>
                      <Form.Control
                        type="text"
                        value={productForm.sku}
                        onChange={(e) => setProductForm({ ...productForm, sku: e.target.value })}
                        placeholder="ZS001"
                      />
                    </Form.Group>
                  </div>
                  <div className="col-md-4">
                    <Form.Group className="mb-3">
                      <Form.Label>Poids (kg)</Form.Label>
                      <Form.Control
                        type="number"
                        step="0.01"
                        value={productForm.weight}
                        onChange={(e) => setProductForm({ ...productForm, weight: e.target.value })}
                        placeholder="0.00"
                      />
                    </Form.Group>
                  </div>
                  <div className="col-md-4">
                    <Form.Group className="mb-3">
                      <Form.Label>Délai Livraison (jours)</Form.Label>
                      <Form.Control
                        type="number"
                        value={productForm.estimated_delivery_days}
                        onChange={(e) => setProductForm({ ...productForm, estimated_delivery_days: e.target.value })}
                        placeholder="14"
                      />
                    </Form.Group>
                  </div>
                </div>
                
                <Form.Group className="mb-3">
                  <Form.Label>Dimensions</Form.Label>
                  <Form.Control
                    type="text"
                    value={productForm.dimensions}
                    onChange={(e) => setProductForm({ ...productForm, dimensions: e.target.value })}
                    placeholder="Ex: 100x50x80 cm"
                  />
                </Form.Group>
                
                <Form.Group className="mb-3">
                  <Form.Check
                    type="checkbox"
                    label="Produit actif (visible sur la boutique)"
                    checked={productForm.is_active}
                    onChange={(e) => setProductForm({ ...productForm, is_active: e.target.checked })}
                  />
                </Form.Group>
                
                <Form.Group className="mb-3">
                  <Form.Check
                    type="checkbox"
                    label="Produit en vedette"
                    checked={productForm.is_featured}
                    onChange={(e) => setProductForm({ ...productForm, is_featured: e.target.checked })}
                  />
                </Form.Group>
              </div>
              
              <div className="col-md-4">
                <Form.Group className="mb-3">
                  <Form.Label>Image du Produit</Form.Label>
                  <div className="text-center">
                    {productForm.image_url ? (
                      <div className="position-relative d-inline-block">
                        <img 
                          src={productForm.image_url} 
                          alt="Product" 
                          className="img-fluid rounded mb-2"
                          style={{maxHeight: '200px'}}
                        />
                        <Button
                          variant="danger"
                          size="sm"
                          className="position-absolute top-0 end-0 m-2"
                          onClick={() => setProductForm({ ...productForm, image_url: '' })}
                        >
                          <FaTimes />
                        </Button>
                      </div>
                    ) : (
                      <div 
                        className="border border-dashed rounded p-4 mb-2 bg-light"
                        style={{minHeight: '200px', display: 'flex', alignItems: 'center', justifyContent: 'center'}}
                      >
                        <FaImage size={48} className="text-muted" />
                      </div>
                    )}
                    <Form.Control
                      type="file"
                      accept="image/*"
                      onChange={handleImageUpload}
                      disabled={uploadingImage}
                    />
                    {uploadingImage && (
                      <div className="mt-2">
                        <div className="spinner-border spinner-border-sm me-2" />
                        Téléchargement...
                      </div>
                    )}
                    <Form.Text className="text-muted">
                      Formats acceptés: JPG, PNG, GIF, WebP (Max 5MB)
                    </Form.Text>
                  </div>
                </Form.Group>
              </div>
            </div>
          </Form>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowProductModal(false)}>
            Annuler
          </Button>
          <Button variant="primary" onClick={handleSaveProduct}>
            <FaSave className="me-2" />
            {editingProduct ? 'Mettre à jour' : 'Créer le produit'}
          </Button>
        </Modal.Footer>
      </Modal>

      {/* Order Edit Modal */}
      <Modal show={showOrderModal} onHide={() => setShowOrderModal(false)}>
        <Modal.Header closeButton>
          <Modal.Title>Modifier la Commande #{editingOrder?.id}</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {editingOrder && (
            <Form>
              <div className="mb-3">
                <h6>Client</h6>
                <p className="mb-1"><strong>{editingOrder.client_name}</strong></p>
                <p className="mb-1 small"><FaPhone className="me-2" />{editingOrder.client_phone}</p>
                <p className="mb-1 small"><FaEnvelope className="me-2" />{editingOrder.client_email}</p>
              </div>
              
              <div className="mb-3">
                <h6>Adresse de Livraison</h6>
                <p className="small mb-0">
                  <FaMapMarkerAlt className="me-2" />
                  {editingOrder.client_address}
                </p>
                {editingOrder.notes && (
                  <p className="small text-muted mt-2 mb-0">
                    <strong>Notes:</strong> {editingOrder.notes}
                  </p>
                )}
              </div>
              
              <Form.Group className="mb-3">
                <Form.Label>Statut de la Commande</Form.Label>
                <Form.Select
                  value={orderForm.status}
                  onChange={(e) => setOrderForm({ ...orderForm, status: e.target.value })}
                >
                  <option value="pending">En attente</option>
                  <option value="confirmed">Confirmée</option>
                  <option value="processing">En traitement</option>
                  <option value="shipped">Expédiée</option>
                  <option value="delivered">Livrée</option>
                  <option value="cancelled">Annulée</option>
                </Form.Select>
              </Form.Group>
              
              <div className="mb-3">
                <h6>Montant Total</h6>
                <p className="h5 text-primary mb-0">{parseFloat(editingOrder.total_amount || 0).toFixed(2)} DT</p>
              </div>
            </Form>
          )}
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowOrderModal(false)}>
            Annuler
          </Button>
          <Button variant="primary" onClick={handleSaveOrder}>
            <FaSave className="me-2" />
            Enregistrer
          </Button>
        </Modal.Footer>
      </Modal>
    </div>
  );
};

export default AdminStoreDashboard;
