import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';
import api from '../../services/api';
import './AdminStoreDashboard.css';

const AdminStoreDashboard = () => {
    const { t } = useTranslation();
    const [stats, setStats] = useState({
        totalProducts: 0,
        totalCategories: 0,
        totalOrders: 0,
        pendingOrders: 0,
        totalRevenue: 0,
        lowStockProducts: 0
    });
    const [recentOrders, setRecentOrders] = useState([]);
    const [topProducts, setTopProducts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        fetchDashboardData();
    }, []);

    const fetchDashboardData = async () => {
        setLoading(true);
        try {
            const [statsResponse, ordersResponse, productsResponse] = await Promise.all([
                api.get('/api/admin/store/stats'),
                api.get('/api/admin/store/orders?limit=5&sort=created_at'),
                api.get('/api/admin/store/products/top-sellers?limit=5')
            ]);

            if (statsResponse.data.success) {
                setStats(statsResponse.data.stats);
            }

            if (ordersResponse.data.success) {
                setRecentOrders(ordersResponse.data.orders);
            }

            if (productsResponse.data.success) {
                setTopProducts(productsResponse.data.products);
            }
        } catch (error) {
            console.error('Error fetching dashboard data:', error);
            setError('Erreur lors du chargement des données');
        } finally {
            setLoading(false);
        }
    };

    const formatMoney = (amount) => {
        return `${parseFloat(amount || 0).toFixed(2)} MAD`;
    };

    const getOrderStatusBadge = (status) => {
        const statusColors = {
            pending: 'badge-warning',
            confirmed: 'badge-info',
            processing: 'badge-primary',
            shipped: 'badge-secondary',
            delivered: 'badge-success',
            cancelled: 'badge-danger'
        };

        const statusLabels = {
            pending: 'En attente',
            confirmed: 'Confirmé',
            processing: 'En traitement',
            shipped: 'Expédié',
            delivered: 'Livré',
            cancelled: 'Annulé'
        };

        return (
            <span className={`badge ${statusColors[status] || 'badge-secondary'}`}>
                {statusLabels[status] || status}
            </span>
        );
    };

    if (loading) {
        return (
            <div className="admin-store-dashboard">
                <div className="dashboard-loading">
                    <div className="loading-spinner"></div>
                    <p>Chargement du tableau de bord...</p>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="admin-store-dashboard">
                <div className="dashboard-error">
                    <p>{error}</p>
                    <button onClick={fetchDashboardData} className="retry-btn">
                        Réessayer
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="admin-store-dashboard">
            <div className="dashboard-header">
                <h1>Tableau de bord Boutique</h1>
                <p>Vue d'ensemble de votre boutique en ligne</p>
            </div>

            {/* Statistics Cards */}
            <div className="stats-grid">
                <motion.div 
                    className="stat-card"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 }}
                >
                    <div className="stat-icon stat-icon--products">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17M17 13v6a2 2 0 01-2 2H9a2 2 0 01-2-2v-6m8 0V9a2 2 0 00-2-2H9a2 2 0 00-2 2v4.01"/>
                        </svg>
                    </div>
                    <div className="stat-content">
                        <h3>{stats.totalProducts}</h3>
                        <p>Produits</p>
                        <Link to="/admin/store/products" className="stat-link">
                            Gérer les produits →
                        </Link>
                    </div>
                </motion.div>

                <motion.div 
                    className="stat-card"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                >
                    <div className="stat-icon stat-icon--categories">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <rect x="3" y="3" width="7" height="7"/>
                            <rect x="14" y="3" width="7" height="7"/>
                            <rect x="14" y="14" width="7" height="7"/>
                            <rect x="3" y="14" width="7" height="7"/>
                        </svg>
                    </div>
                    <div className="stat-content">
                        <h3>{stats.totalCategories}</h3>
                        <p>Catégories</p>
                        <Link to="/admin/store/categories" className="stat-link">
                            Gérer les catégories →
                        </Link>
                    </div>
                </motion.div>

                <motion.div 
                    className="stat-card"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3 }}
                >
                    <div className="stat-icon stat-icon--orders">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M16 4h2a2 2 0 012 2v14a2 2 0 01-2 2H6a2 2 0 01-2-2V6a2 2 0 012-2h2"/>
                            <rect x="8" y="2" width="8" height="4" rx="1" ry="1"/>
                            <path d="M9 14l2 2 4-4"/>
                        </svg>
                    </div>
                    <div className="stat-content">
                        <h3>{stats.totalOrders}</h3>
                        <p>Commandes totales</p>
                        {stats.pendingOrders > 0 && (
                            <span className="pending-badge">{stats.pendingOrders} en attente</span>
                        )}
                        <Link to="/admin/store/orders" className="stat-link">
                            Gérer les commandes →
                        </Link>
                    </div>
                </motion.div>

                <motion.div 
                    className="stat-card"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.4 }}
                >
                    <div className="stat-icon stat-icon--revenue">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <line x1="12" y1="1" x2="12" y2="23"/>
                            <path d="M17 5H9.5a3.5 3.5 0 000 7h5a3.5 3.5 0 010 7H6"/>
                        </svg>
                    </div>
                    <div className="stat-content">
                        <h3>{formatMoney(stats.totalRevenue)}</h3>
                        <p>Chiffre d'affaires</p>
                        <Link to="/admin/store/analytics" className="stat-link">
                            Voir les analyses →
                        </Link>
                    </div>
                </motion.div>
            </div>

            {/* Alerts */}
            {stats.lowStockProducts > 0 && (
                <motion.div 
                    className="alert alert-warning"
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.5 }}
                >
                    <div className="alert-content">
                        <svg className="alert-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/>
                            <line x1="12" y1="9" x2="12" y2="13"/>
                            <line x1="12" y1="17" x2="12.01" y2="17"/>
                        </svg>
                        <div>
                            <h4>Attention - Stock faible</h4>
                            <p>{stats.lowStockProducts} produit{stats.lowStockProducts > 1 ? 's ont' : ' a'} un stock faible</p>
                        </div>
                        <Link to="/admin/store/products?filter=low-stock" className="alert-action">
                            Voir les produits
                        </Link>
                    </div>
                </motion.div>
            )}

            <div className="dashboard-content">
                {/* Recent Orders */}
                <motion.div 
                    className="dashboard-section"
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.6 }}
                >
                    <div className="section-header">
                        <h2>Commandes récentes</h2>
                        <Link to="/admin/store/orders" className="section-link">
                            Voir toutes les commandes
                        </Link>
                    </div>

                    {recentOrders.length === 0 ? (
                        <div className="empty-state">
                            <p>Aucune commande récente</p>
                        </div>
                    ) : (
                        <div className="orders-table">
                            <table>
                                <thead>
                                    <tr>
                                        <th>ID</th>
                                        <th>Client</th>
                                        <th>Total</th>
                                        <th>Statut</th>
                                        <th>Date</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {recentOrders.map(order => (
                                        <tr key={order.id}>
                                            <td>
                                                <Link to={`/admin/store/orders/${order.id}`} className="order-id">
                                                    #{order.id}
                                                </Link>
                                            </td>
                                            <td>{order.client_name}</td>
                                            <td className="amount">{formatMoney(order.total_amount)}</td>
                                            <td>{getOrderStatusBadge(order.status)}</td>
                                            <td>{new Date(order.created_at).toLocaleDateString('fr-FR')}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </motion.div>

                {/* Top Products */}
                <motion.div 
                    className="dashboard-section"
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.7 }}
                >
                    <div className="section-header">
                        <h2>Produits les plus vendus</h2>
                        <Link to="/admin/store/analytics" className="section-link">
                            Voir l'analyse complète
                        </Link>
                    </div>

                    {topProducts.length === 0 ? (
                        <div className="empty-state">
                            <p>Aucune donnée de vente disponible</p>
                        </div>
                    ) : (
                        <div className="top-products">
                            {topProducts.map((product, index) => (
                                <div key={product.id} className="top-product-item">
                                    <div className="product-rank">#{index + 1}</div>
                                    <div className="product-image">
                                        <img 
                                            src={product.image_url || '/images/placeholder-product.jpg'}
                                            alt={product.name}
                                            onError={(e) => {
                                                e.target.src = '/images/placeholder-product.jpg';
                                            }}
                                        />
                                    </div>
                                    <div className="product-info">
                                        <h4>
                                            <Link to={`/admin/store/products/${product.id}`}>
                                                {product.name}
                                            </Link>
                                        </h4>
                                        <p>{product.sales_count || 0} ventes</p>
                                        <p className="product-price">{formatMoney(product.price)}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </motion.div>
            </div>

            {/* Quick Actions */}
            <motion.div 
                className="quick-actions"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.8 }}
            >
                <h2>Actions rapides</h2>
                <div className="actions-grid">
                    <Link to="/admin/store/products/new" className="action-card">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <line x1="12" y1="5" x2="12" y2="19"/>
                            <line x1="5" y1="12" x2="19" y2="12"/>
                        </svg>
                        <span>Ajouter un produit</span>
                    </Link>

                    <Link to="/admin/store/categories/new" className="action-card">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <rect x="3" y="3" width="7" height="7"/>
                            <rect x="14" y="3" width="7" height="7"/>
                            <rect x="14" y="14" width="7" height="7"/>
                            <rect x="3" y="14" width="7" height="7"/>
                        </svg>
                        <span>Créer une catégorie</span>
                    </Link>

                    <Link to="/admin/store/orders?status=pending" className="action-card">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M16 4h2a2 2 0 012 2v14a2 2 0 01-2 2H6a2 2 0 01-2-2V6a2 2 0 012-2h2"/>
                            <rect x="8" y="2" width="8" height="4" rx="1" ry="1"/>
                        </svg>
                        <span>Commandes en attente</span>
                    </Link>

                    <Link to="/admin/store/products?filter=low-stock" className="action-card">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/>
                            <line x1="12" y1="9" x2="12" y2="13"/>
                            <line x1="12" y1="17" x2="12.01" y2="17"/>
                        </svg>
                        <span>Stock faible</span>
                    </Link>
                </div>
            </motion.div>
        </div>
    );
};

export default AdminStoreDashboard;