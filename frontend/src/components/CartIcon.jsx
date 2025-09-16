import React from 'react';
import { useCart } from '../../context/CartContext';
import './CartIcon.css';

const CartIcon = ({ onClick, showCount = true, size = 'medium' }) => {
    const { getCartItemsCount } = useCart();
    const itemCount = getCartItemsCount();

    const sizeClasses = {
        small: 'cart-icon--small',
        medium: 'cart-icon--medium',
        large: 'cart-icon--large'
    };

    return (
        <div 
            className={`cart-icon ${sizeClasses[size]}`}
            onClick={onClick}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                    onClick && onClick();
                }
            }}
            aria-label={`Panier de courses, ${itemCount} article${itemCount !== 1 ? 's' : ''}`}
        >
            <div className="cart-icon__container">
                <svg
                    className="cart-icon__svg"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                    xmlns="http://www.w3.org/2000/svg"
                >
                    <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17M17 13v6a2 2 0 01-2 2H9a2 2 0 01-2-2v-6m8 0V9a2 2 0 00-2-2H9a2 2 0 00-2 2v4.01"
                    />
                </svg>
                
                {showCount && itemCount > 0 && (
                    <span className="cart-icon__badge">
                        {itemCount > 99 ? '99+' : itemCount}
                    </span>
                )}
            </div>
        </div>
    );
};

export default CartIcon;