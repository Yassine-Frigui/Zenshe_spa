import React, { useState } from 'react';
import { useCart } from '../../context/CartContext';
import { useTranslation } from 'react-i18next';
import './AddToCartButton.css';

const AddToCartButton = ({
    product,
    quantity = 1,
    variant = 'primary',
    size = 'medium',
    disabled = false,
    showIcon = true,
    className = '',
    children,
    onSuccess,
    onError
}) => {
    const { t } = useTranslation();
    const { addToCart, isItemInCart, getItemQuantity } = useCart();
    const [isLoading, setIsLoading] = useState(false);
    const [justAdded, setJustAdded] = useState(false);

    // Check if product is valid and available
    const isProductValid = product && 
        product.id && 
        product.price && 
        product.is_active && 
        product.stock_quantity > 0;

    const currentCartQuantity = getItemQuantity(product?.id);
    const canAddMore = isProductValid && 
        (currentCartQuantity + quantity) <= product.stock_quantity;

    const isDisabled = disabled || 
        !isProductValid || 
        !canAddMore || 
        isLoading;

    const handleAddToCart = async () => {
        if (isDisabled || !product) return;

        setIsLoading(true);
        try {
            const success = addToCart(product, quantity);
            
            if (success) {
                setJustAdded(true);
                setTimeout(() => setJustAdded(false), 2000);
                
                if (onSuccess) {
                    onSuccess(product, quantity);
                }
            }
        } catch (error) {
            console.error('Error adding to cart:', error);
            if (onError) {
                onError(error);
            } else {
                alert(error.message);
            }
        } finally {
            setIsLoading(false);
        }
    };

    // Button variants
    const getVariantClass = () => {
        switch (variant) {
            case 'secondary':
                return 'add-to-cart-btn--secondary';
            case 'outline':
                return 'add-to-cart-btn--outline';
            case 'minimal':
                return 'add-to-cart-btn--minimal';
            default:
                return 'add-to-cart-btn--primary';
        }
    };

    // Button sizes
    const getSizeClass = () => {
        switch (size) {
            case 'small':
                return 'add-to-cart-btn--small';
            case 'large':
                return 'add-to-cart-btn--large';
            default:
                return 'add-to-cart-btn--medium';
        }
    };

    // Button text
    const getButtonText = () => {
        if (isLoading) {
            return t('cart.adding');
        }
        
        if (justAdded) {
            return t('cart.added');
        }

        if (!isProductValid) {
            return t('cart.unavailable');
        }

        if (!canAddMore) {
            if (currentCartQuantity > 0) {
                return t('cart.maxInCart');
            }
            return t('cart.outOfStock');
        }

        if (children) {
            return children;
        }

        if (isItemInCart(product.id)) {
            return t('cart.addMore');
        }

        return t('cart.addToCart');
    };

    // Button icon
    const renderIcon = () => {
        if (!showIcon) return null;

        if (isLoading) {
            return (
                <svg className="add-to-cart-btn__spinner" viewBox="0 0 24 24">
                    <circle 
                        cx="12" 
                        cy="12" 
                        r="10" 
                        fill="none" 
                        stroke="currentColor" 
                        strokeWidth="4" 
                        strokeDasharray="31.416" 
                        strokeDashoffset="31.416"
                    />
                </svg>
            );
        }

        if (justAdded) {
            return (
                <svg className="add-to-cart-btn__check" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <polyline points="20,6 9,17 4,12"></polyline>
                </svg>
            );
        }

        return (
            <svg className="add-to-cart-btn__cart" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17M17 13v6a2 2 0 01-2 2H9a2 2 0 01-2-2v-6m8 0V9a2 2 0 00-2-2H9a2 2 0 00-2 2v4.01"/>
            </svg>
        );
    };

    return (
        <button
            className={`
                add-to-cart-btn 
                ${getVariantClass()} 
                ${getSizeClass()}
                ${justAdded ? 'add-to-cart-btn--success' : ''}
                ${isDisabled ? 'add-to-cart-btn--disabled' : ''}
                ${className}
            `.trim()}
            onClick={handleAddToCart}
            disabled={isDisabled}
            aria-label={`${getButtonText()}${product ? ` - ${product.name}` : ''}`}
            title={!canAddMore && currentCartQuantity > 0 ? 
                t('cart.stockLimit', { stock: product?.stock_quantity, current: currentCartQuantity }) : 
                undefined
            }
        >
            {showIcon && (
                <span className="add-to-cart-btn__icon">
                    {renderIcon()}
                </span>
            )}
            
            <span className="add-to-cart-btn__text">
                {getButtonText()}
            </span>

            {quantity > 1 && (
                <span className="add-to-cart-btn__quantity">
                    ({quantity})
                </span>
            )}
        </button>
    );
};

export default AddToCartButton;