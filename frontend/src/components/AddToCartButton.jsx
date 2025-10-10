import React from 'react';
import { useTranslation } from 'react-i18next';

const AddToCartButton = ({ product, onClick, disabled }) => {
  const { t } = useTranslation();
  
  return (
    <button 
      onClick={() => onClick(product)}
      disabled={disabled}
      className="add-to-cart-button"
    >
      {disabled ? t('store.outOfStock') : t('store.addToCart')}
    </button>
  );
};

export default AddToCartButton;