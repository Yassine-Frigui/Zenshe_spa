import React, { useState } from 'react';
import CartIcon from './CartIcon';
import CartSidebar from './CartSidebar';
import { useCart } from '../context/CartContext';
import './CartWidget.css';

const CartWidget = ({ className = '' }) => {
    const [isCartOpen, setIsCartOpen] = useState(false);
    const { getCartItemsCount } = useCart();

    const handleCartToggle = () => {
        setIsCartOpen(!isCartOpen);
    };

    const handleCartClose = () => {
        setIsCartOpen(false);
    };

    return (
        <div className={`cart-widget ${className}`}>
            <CartIcon 
                onClick={handleCartToggle}
                showCount={true}
                size="medium"
            />
            
            <CartSidebar 
                isOpen={isCartOpen}
                onClose={handleCartClose}
            />
        </div>
    );
};

export default CartWidget;