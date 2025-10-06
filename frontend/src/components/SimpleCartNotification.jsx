import React, { useState, useEffect } from 'react';
import { useCart } from '../context/CartContext';

const SimpleCartNotification = () => {
  const { cartItems } = useCart();
  const [show, setShow] = useState(false);

  useEffect(() => {
    if (cartItems.length > 0) {
      setShow(true);
      const timer = setTimeout(() => setShow(false), 2000);
      return () => clearTimeout(timer);
    }
  }, [cartItems.length]);

  if (!show) return null;

  return (
    <div className="cart-notification">
      Item added to cart!
    </div>
  );
};

export default SimpleCartNotification;