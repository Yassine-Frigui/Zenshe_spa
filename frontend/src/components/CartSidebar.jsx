import React, { useState } from 'react';
import { useCart } from '../context/CartContext';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import './CartSidebar.css';

const CartSidebar = ({ isOpen, onClose }) => {
    const { t } = useTranslation();
    const navigate = useNavigate();
    const {
        getCartItems,
        getCartTotal,
        getCartItemsCount,
        updateQuantity,
        removeFromCart,
        clearCart,
        hasItems
    } = useCart();

    const [isClearing, setIsClearing] = useState(false);
    const cartItems = getCartItems();
    const totalAmount = getCartTotal();
    const itemsCount = getCartItemsCount();

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

    const handleClearCart = async () => {
        if (window.confirm(t('cart.confirmClear'))) {
            setIsClearing(true);
            try {
                clearCart();
            } finally {
                setIsClearing(false);
            }
        }
    };

    const handleCheckout = () => {
        onClose();
        navigate('/boutique/panier');
    };

    const handleContinueShopping = () => {
        onClose();
        navigate('/boutique');
    };

    // Handle overlay click
    const handleOverlayClick = (e) => {
        if (e.target === e.currentTarget) {
            onClose();
        }
    };

    if (!isOpen) return null;

    return (
        <div className="cart-sidebar-overlay" onClick={handleOverlayClick}>
            <div className="cart-sidebar">
                {/* Header */}
                <div className="cart-sidebar__header">
                    <h3 className="cart-sidebar__title">
                        {t('cart.title')} ({itemsCount})
                    </h3>
                    <button
                        className="cart-sidebar__close"
                        onClick={onClose}
                        aria-label={t('common.close')}
                    >
                        <svg
                            width="24"
                            height="24"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                        >
                            <line x1="18" y1="6" x2="6" y2="18"></line>
                            <line x1="6" y1="6" x2="18" y2="18"></line>
                        </svg>
                    </button>
                </div>

                {/* Content */}
                <div className="cart-sidebar__content">
                    {!hasItems() ? (
                        <div className="cart-sidebar__empty">
                            <div className="cart-sidebar__empty-icon">
                                <svg
                                    width="64"
                                    height="64"
                                    viewBox="0 0 24 24"
                                    fill="none"
                                    stroke="currentColor"
                                    strokeWidth="1"
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                >
                                    <path d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17M17 13v6a2 2 0 01-2 2H9a2 2 0 01-2-2v-6m8 0V9a2 2 0 00-2-2H9a2 2 0 00-2 2v4.01"/>
                                </svg>
                            </div>
                            <p className="cart-sidebar__empty-text">
                                {t('cart.empty')}
                            </p>
                            <button
                                className="cart-sidebar__continue-shopping"
                                onClick={handleContinueShopping}
                            >
                                {t('cart.continueShopping')}
                            </button>
                        </div>
                    ) : (
                        <>
                            {/* Items List */}
                            <div className="cart-sidebar__items">
                                {cartItems.map((item) => (
                                    <div key={item.id} className="cart-item">
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
                                            <h4 className="cart-item__name">{item.name}</h4>
                                            {item.sku && (
                                                <p className="cart-item__sku">SKU: {item.sku}</p>
                                            )}
                                            <p className="cart-item__price">
                                                {item.price.toFixed(2)} MAD
                                            </p>
                                        </div>

                                        <div className="cart-item__quantity">
                                            <button
                                                className="cart-item__quantity-btn"
                                                onClick={() => handleQuantityChange(item.id, item.quantity - 1)}
                                                disabled={item.quantity <= 1}
                                                aria-label={t('cart.decreaseQuantity')}
                                            >
                                                -
                                            </button>
                                            <span className="cart-item__quantity-value">
                                                {item.quantity}
                                            </span>
                                            <button
                                                className="cart-item__quantity-btn"
                                                onClick={() => handleQuantityChange(item.id, item.quantity + 1)}
                                                disabled={item.quantity >= item.stock_quantity}
                                                aria-label={t('cart.increaseQuantity')}
                                            >
                                                +
                                            </button>
                                        </div>

                                        <div className="cart-item__subtotal">
                                            {item.subtotal.toFixed(2)} MAD
                                        </div>

                                        <button
                                            className="cart-item__remove"
                                            onClick={() => handleRemoveItem(item.id)}
                                            aria-label={t('cart.removeItem')}
                                        >
                                            <svg
                                                width="16"
                                                height="16"
                                                viewBox="0 0 24 24"
                                                fill="none"
                                                stroke="currentColor"
                                                strokeWidth="2"
                                                strokeLinecap="round"
                                                strokeLinejoin="round"
                                            >
                                                <polyline points="3,6 5,6 21,6"></polyline>
                                                <path d="m19,6v14a2,2 0,0 1,-2,2H7a2,2 0,0 1,-2,-2V6m3,0V4a2,2 0,0 1,2,-2h4a2,2 0,0 1,2,2v2"></path>
                                                <line x1="10" y1="11" x2="10" y2="17"></line>
                                                <line x1="14" y1="11" x2="14" y2="17"></line>
                                            </svg>
                                        </button>
                                    </div>
                                ))}
                            </div>

                            {/* Footer */}
                            <div className="cart-sidebar__footer">
                                <div className="cart-sidebar__total">
                                    <span className="cart-sidebar__total-label">
                                        {t('cart.total')}:
                                    </span>
                                    <span className="cart-sidebar__total-amount">
                                        {totalAmount.toFixed(2)} MAD
                                    </span>
                                </div>

                                <div className="cart-sidebar__actions">
                                    <button
                                        className="cart-sidebar__clear"
                                        onClick={handleClearCart}
                                        disabled={isClearing}
                                    >
                                        {isClearing ? t('common.loading') : t('cart.clear')}
                                    </button>
                                    
                                    <button
                                        className="cart-sidebar__checkout"
                                        onClick={handleCheckout}
                                    >
                                        {t('cart.checkout')}
                                    </button>
                                </div>

                                <button
                                    className="cart-sidebar__continue-shopping-footer"
                                    onClick={handleContinueShopping}
                                >
                                    {t('cart.continueShopping')}
                                </button>
                            </div>
                        </>
                    )}
                </div>
            </div>
        </div>
    );
};

export default CartSidebar;