import React from 'react';

const AddToCartButton = ({ product, onClick, disabled }) => {
  return (
    <button 
      onClick={() => onClick(product)}
      disabled={disabled}
      className="add-to-cart-button"
    >
      {disabled ? 'Out of Stock' : 'Add to Cart'}
    </button>
  );
};

export default AddToCartButton;