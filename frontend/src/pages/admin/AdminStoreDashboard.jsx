import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { FaStore, FaShoppingBag, FaBoxOpen, FaEye, FaEdit, FaPlus } from 'react-icons/fa';
import { toast } from 'react-toastify';
import axios from 'axios';

const AdminStoreDashboard = () => {
  const [loading, setLoading] = useState(true);
  const [products, setProducts] = useState([]);
  const [orders, setOrders] = useState([]);

  useEffect(() => {
    fetchStoreData();
  }, []);

  const fetchStoreData = async () => {
    try {
      setLoading(true);
      
      const productsResponse = await axios.get('/api/admin/store/products?limit=10');
      if (productsResponse.data.success) {
        setProducts(productsResponse.data.data || []);
      }

      const ordersResponse = await axios.get('/api/admin/store/orders?limit=10');
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

  const getStatusBadge = (status) => {
    const statusMap = {
      'pending': 'bg-warning text-dark',
      'confirmed': 'bg-success text-white',
      'processing': 'bg-info text-white'
    };
    const badgeClass = statusMap[status] || 'bg-secondary text-white';
    return <span className={`badge ${badgeClass}`}>{status}</span>;
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
        <h2 className="fw-bold">
          <FaStore className="text-primary me-2" />
          Tableau de Bord Boutique
        </h2>
      </motion.div>

      <div className="row">
        <div className="col-lg-6 mb-4">
          <div className="card">
            <div className="card-header">
              <h5><FaBoxOpen className="me-2" />Produits</h5>
            </div>
            <div className="card-body">
              <table className="table">
                <thead>
                  <tr>
                    <th>Nom</th>
                    <th>Prix</th>
                    <th>Type</th>
                  </tr>
                </thead>
                <tbody>
                  {products.map((product) => (
                    <tr key={product.id}>
                      <td>{product.name}</td>
                      <td>{product.price}€</td>
                      <td><span className="badge bg-info">Pré-commande</span></td>
                    </tr>
                  ))}
                  {products.length === 0 && (
                    <tr>
                      <td colSpan="3" className="text-center">Aucun produit trouvé</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        <div className="col-lg-6 mb-4">
          <div className="card">
            <div className="card-header">
              <h5><FaShoppingBag className="me-2" />Commandes</h5>
            </div>
            <div className="card-body">
              <table className="table">
                <thead>
                  <tr>
                    <th>Client</th>
                    <th>Total</th>
                    <th>Statut</th>
                  </tr>
                </thead>
                <tbody>
                  {orders.map((order) => (
                    <tr key={order.id}>
                      <td>{order.client_name}</td>
                      <td>{parseFloat(order.total_amount || 0).toFixed(2)}€</td>
                      <td>{getStatusBadge(order.status)}</td>
                    </tr>
                  ))}
                  {orders.length === 0 && (
                    <tr>
                      <td colSpan="3" className="text-center">Aucune commande trouvée</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminStoreDashboard;
