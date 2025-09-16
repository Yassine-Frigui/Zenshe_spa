import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';
import { useCart } from '../../context/CartContext';
import { publicAPI } from '../../services/api';
import './CartPage.css';

const CartPage = () => {
    const { t } = useTranslation();
    const navigate = useNavigate();
    const {
        getCartItems,
        getCartTotal,
        getCartItemsCount,
        updateQuantity,
        removeFromCart,
        clearCart,
        hasItems,
        getOrderData
    } = useCart();

    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [sessionId, setSessionId] = useState(null);
    const [autoSaveStatus, setAutoSaveStatus] = useState('');
    const [orderForm, setOrderForm] = useState({
        client_name: '',
        client_email: '',
        client_phone: '',
        delivery_address: '',
        notes: ''
    });

    const cartItems = getCartItems();
    const totalAmount = getCartTotal();
    const itemsCount = getCartItemsCount();

    // Initialize session and load draft on component mount
    useEffect(() => {
        initializeSession();
    }, []);

    // Initialize session with unique ID that persists only for this tab session
    const initializeSession = async () => {
        let currentSessionId = sessionStorage.getItem('zenshe_order_session');
        
        if (!currentSessionId) {
            // Generate truly unique session ID
            currentSessionId = 'order_' + Date.now() + '_' + Math.random().toString(36).substr(2, 12);
            sessionStorage.setItem('zenshe_order_session', currentSessionId);
        }
        
        setSessionId(currentSessionId);
        
        // Try to load existing draft for this session
        try {
            const response = await publicAPI.getOrderDraft(currentSessionId);
            if (response.data.success && response.data.data) {
                const draftData = response.data.data;
                
                // Load form data from draft
                if (draftData.form_data) {
                    setOrderForm({
                        client_name: draftData.form_data.client_name || '',
                        client_email: draftData.form_data.client_email || '',
                        client_phone: draftData.form_data.client_phone || '',
                        delivery_address: draftData.form_data.delivery_address || '',
                        notes: draftData.form_data.notes || ''
                    });
                }
                
                setAutoSaveStatus('📄 Brouillon chargé');
                setTimeout(() => setAutoSaveStatus(''), 3000);
            }
        } catch (error) {
            // 404 is expected when no draft exists - this is normal for new sessions
            if (error.response?.status !== 404) {
                console.error('Erreur lors du chargement du brouillon:', error);
            }
            // For 404 or any other error, just continue with empty form - no need to show error to user
        }
    };

    const handleQuantityChange = (productId, newQuantity) => {
        try {
            if (newQuantity === 0) {
                removeFromCart(productId);
            } else {
                updateQuantity(productId, newQuantity);
            }
        } catch (error) {
            alert(error.message);
        }
    };

    const handleRemoveItem = (productId) => {
        removeFromCart(productId);
    };

    const handleClearCart = () => {
        if (window.confirm(t('cart.confirmClear'))) {
            clearCart();
        }
    };

    const handleFormChange = (e) => {
        setOrderForm({
            ...orderForm,
            [e.target.name]: e.target.value
        });
    };

    // Auto-save function - updates the SAME draft every time
    const saveDraft = useCallback(async (formData, cartData) => {
        if (!sessionId) return;
        
        // Only save if client has provided at least a phone number (minimum requirement)
        if (!formData.client_phone || formData.client_phone.trim() === '') {
            return; // Don't save draft without phone number
        }
        
        try {
            const draftData = {
                sessionId,
                ...formData,
                cart_items: cartData || []
            };
            
            await publicAPI.saveOrderDraft(draftData);
            setAutoSaveStatus('💾 Auto-sauvegardé');
            setTimeout(() => setAutoSaveStatus(''), 1500);
        } catch (error) {
            console.error('Erreur auto-sauvegarde:', error);
            setAutoSaveStatus('⚠️ Erreur sauvegarde');
            setTimeout(() => setAutoSaveStatus(''), 3000);
        }
    }, [sessionId]);

    // Auto-save with debouncing - always updates the SAME draft
    useEffect(() => {
        const timer = setTimeout(() => {
            // Only auto-save if client has at least a phone number and there are items in cart
            const hasPhoneNumber = orderForm.client_phone && orderForm.client_phone.trim() !== '';
            const hasCartItems = cartItems && cartItems.length > 0;
            
            if (hasPhoneNumber && hasCartItems && sessionId) {
                saveDraft(orderForm, cartItems); // Always updates the same draft for this session
            }
        }, 1500); // Save 1.5 seconds after user stops typing

        return () => clearTimeout(timer);
    }, [orderForm, cartItems, saveDraft, sessionId]);

    const validateForm = () => {
        if (!orderForm.client_name.trim()) {
            setError('Le nom est requis');
            return false;
        }
        if (!orderForm.client_email.trim()) {
            setError('L\'email est requis');
            return false;
        }
        if (!orderForm.client_phone.trim()) {
            setError('Le téléphone est requis');
            return false;
        }
        if (!orderForm.delivery_address.trim()) {
            setError('L\'adresse de livraison est requise');
            return false;
        }
        return true;
    };

    const handleSubmitOrder = async (e) => {
        e.preventDefault();
        
        if (!hasItems()) {
            setError('Votre panier est vide');
            return;
        }

        if (!validateForm()) {
            return;
        }

        setLoading(true);
        setError('');

        try {
            const orderData = getOrderData();
            const fullOrderData = {
                ...orderData,
                ...orderForm,
                // Session ID for draft conversion
                sessionId
            };

            const response = await publicAPI.createOrder(fullOrderData);

            if (response.data.success) {
                // Delete the draft after successful order (clean up)
                if (sessionId) {
                    try {
                        await publicAPI.deleteOrderDraft(sessionId);
                    } catch (draftError) {
                        console.error('Erreur suppression brouillon:', draftError);
                        // Don't fail the order if draft deletion fails
                    }
                }
                
                // Clear cart after successful order
                clearCart();
                
                // Navigate to order confirmation
                navigate(`/boutique/commande/${response.data.order.id}`, {
                    state: { orderConfirmed: true }
                });
            } else {
                setError(response.data.message || 'Erreur lors de la commande');
            }
        } catch (error) {
            console.error('Error submitting order:', error);
            setError('Erreur de connexion. Veuillez réessayer.');
        } finally {
            setLoading(false);
        }
    };

    const handleContinueShopping = () => {
        navigate('/boutique');
    };

    if (!hasItems()) {
        return (
            <div className="cart-page">
                <div className="container">
                    <div className="cart-empty">
                        <div className="cart-empty__icon">
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1">
                                <path d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17M17 13v6a2 2 0 01-2 2H9a2 2 0 01-2-2v-6m8 0V9a2 2 0 00-2-2H9a2 2 0 00-2 2v4.01"/>
                            </svg>
                        </div>
                        <h2>{t('cart.empty')}</h2>
                        <p>Ajoutez des produits à votre panier pour passer commande</p>
                        <button onClick={handleContinueShopping} className="continue-shopping-btn">
                            {t('cart.continueShopping')}
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="cart-page">
            <div className="container">
                <div className="cart-header">
                    <h1 className="cart-title">
                        {t('cart.title')} ({itemsCount} {itemsCount > 1 ? 'articles' : 'article'})
                    </h1>
                    <button onClick={handleContinueShopping} className="continue-shopping-link">
                        ← {t('cart.continueShopping')}
                    </button>
                </div>

                <div className="cart-content">
                    {/* Cart Items */}
                    <div className="cart-items-section">
                        <div className="cart-items-header">
                            <h2>Articles</h2>
                            <button onClick={handleClearCart} className="clear-cart-btn">
                                {t('cart.clear')}
                            </button>
                        </div>

                        <div className="cart-items">
                            {cartItems.map((item, index) => (
                                <motion.div
                                    key={item.id}
                                    className="cart-item"
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: index * 0.05 }}
                                >
                                    <div className="cart-item__image">
                                        <img
                                            src={item.image_url || '/images/placeholder-product.jpg'}
                                            alt={item.name}
                                            onError={(e) => {
                                                e.target.src = '/images/placeholder-product.jpg';
                                            }}
                                        />
                                    </div>

                                    <div className="cart-item__details">
                                        <h3 className="cart-item__name">{item.name}</h3>
                                        {item.sku && (
                                            <p className="cart-item__sku">SKU: {item.sku}</p>
                                        )}
                                        <p className="cart-item__price">
                                            {item.price.toFixed(2)} MAD
                                        </p>
                                    </div>

                                    <div className="cart-item__quantity">
                                        <label>Quantité:</label>
                                        <div className="quantity-controls">
                                            <button
                                                onClick={() => handleQuantityChange(item.id, item.quantity - 1)}
                                                disabled={item.quantity <= 1}
                                                className="quantity-btn"
                                            >
                                                -
                                            </button>
                                            <input
                                                type="number"
                                                value={item.quantity}
                                                onChange={(e) => handleQuantityChange(item.id, parseInt(e.target.value) || 1)}
                                                min="1"
                                                max={item.stock_quantity}
                                                className="quantity-input"
                                            />
                                            <button
                                                onClick={() => handleQuantityChange(item.id, item.quantity + 1)}
                                                disabled={item.quantity >= item.stock_quantity}
                                                className="quantity-btn"
                                            >
                                                +
                                            </button>
                                        </div>
                                    </div>

                                    <div className="cart-item__subtotal">
                                        <strong>{item.subtotal.toFixed(2)} MAD</strong>
                                    </div>

                                    <button
                                        onClick={() => handleRemoveItem(item.id)}
                                        className="cart-item__remove"
                                        aria-label="Supprimer l'article"
                                    >
                                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                            <polyline points="3,6 5,6 21,6"></polyline>
                                            <path d="m19,6v14a2,2 0,0 1,-2,2H7a2,2 0,0 1,-2,-2V6m3,0V4a2,2 0,0 1,2,-2h4a2,2 0,0 1,2,2v2"></path>
                                            <line x1="10" y1="11" x2="10" y2="17"></line>
                                            <line x1="14" y1="11" x2="14" y2="17"></line>
                                        </svg>
                                    </button>
                                </motion.div>
                            ))}
                        </div>
                    </div>

                    {/* Checkout Form */}
                    <div className="checkout-section">
                        <div className="cart-summary">
                            <h3>Résumé de la commande</h3>
                            <div className="summary-line">
                                <span>Sous-total ({itemsCount} articles):</span>
                                <span>{totalAmount.toFixed(2)} MAD</span>
                            </div>
                            <div className="summary-line">
                                <span>Livraison:</span>
                                <span>Calculée lors de la confirmation</span>
                            </div>
                            <div className="summary-total">
                                <span>Total:</span>
                                <span>{totalAmount.toFixed(2)} MAD</span>
                            </div>
                        </div>

                        <form onSubmit={handleSubmitOrder} className="checkout-form">
                            <div className="form-header">
                                <h3>Informations de livraison</h3>
                                {autoSaveStatus && (
                                    <div className="auto-save-status">
                                        {autoSaveStatus}
                                    </div>
                                )}
                            </div>
                            
                            {error && (
                                <div className="error-message">
                                    {error}
                                </div>
                            )}

                            <div className="form-group">
                                <label htmlFor="client_name">Nom complet *</label>
                                <input
                                    type="text"
                                    id="client_name"
                                    name="client_name"
                                    value={orderForm.client_name}
                                    onChange={handleFormChange}
                                    required
                                    placeholder="Votre nom complet"
                                />
                            </div>

                            <div className="form-group">
                                <label htmlFor="client_email">Email *</label>
                                <input
                                    type="email"
                                    id="client_email"
                                    name="client_email"
                                    value={orderForm.client_email}
                                    onChange={handleFormChange}
                                    required
                                    placeholder="votre@email.com"
                                />
                            </div>

                            <div className="form-group">
                                <label htmlFor="client_phone">Téléphone *</label>
                                <input
                                    type="tel"
                                    id="client_phone"
                                    name="client_phone"
                                    value={orderForm.client_phone}
                                    onChange={handleFormChange}
                                    required
                                    placeholder="+212 6XX XX XX XX"
                                />
                            </div>

                            <div className="form-group">
                                <label htmlFor="delivery_address">Adresse de livraison *</label>
                                <textarea
                                    id="delivery_address"
                                    name="delivery_address"
                                    value={orderForm.delivery_address}
                                    onChange={handleFormChange}
                                    required
                                    placeholder="Adresse complète de livraison"
                                    rows="3"
                                />
                            </div>

                            <div className="form-group">
                                <label htmlFor="notes">Notes (optionnel)</label>
                                <textarea
                                    id="notes"
                                    name="notes"
                                    value={orderForm.notes}
                                    onChange={handleFormChange}
                                    placeholder="Instructions spéciales, commentaires..."
                                    rows="2"
                                />
                            </div>

                            <button
                                type="submit"
                                disabled={loading}
                                className="submit-order-btn"
                            >
                                {loading ? 'Commande en cours...' : `Passer commande - ${totalAmount.toFixed(2)} MAD`}
                            </button>

                            <p className="checkout-note">
                                En passant commande, vous acceptez nos conditions d'utilisation.
                                Vous serez contacté pour confirmer votre commande et la livraison.
                            </p>
                        </form>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default CartPage;