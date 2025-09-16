import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';
import api from '../../services/api';
import AddToCartButton from '../../components/AddToCartButton';
import CartWidget from '../../components/CartWidget';
import { useCart } from '../../context/CartContext';
import './ProductDetailPage.css';

const ProductDetailPage = () => {
    const { t } = useTranslation();
    const { productId } = useParams();
    const navigate = useNavigate();
    const { getItemQuantity } = useCart();

    const [product, setProduct] = useState(null);
    const [relatedProducts, setRelatedProducts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [quantity, setQuantity] = useState(1);
    const [selectedImage, setSelectedImage] = useState(0);

    useEffect(() => {
        const fetchProduct = async () => {
            setLoading(true);
            try {
                const response = await api.get(`/api/store/products/${productId}`);
                
                if (response.data.success) {
                    setProduct(response.data.product);
                    // Fetch related products
                    if (response.data.product.category_id) {
                        fetchRelatedProducts(response.data.product.category_id, productId);
                    }
                } else {
                    setError(response.data.message);
                }
            } catch (error) {
                console.error('Error fetching product:', error);
                setError(t('errors.networkError'));
            } finally {
                setLoading(false);
            }
        };

        if (productId) {
            fetchProduct();
        }
    }, [productId, t]);

    const fetchRelatedProducts = async (categoryId, excludeId) => {
        try {
            const response = await api.get('/api/store/products', {
                params: {
                    category_id: categoryId,
                    limit: 4,
                    exclude: excludeId
                }
            });
            
            if (response.data.success) {
                setRelatedProducts(response.data.products);
            }
        } catch (error) {
            console.error('Error fetching related products:', error);
        }
    };

    const handleQuantityChange = (newQuantity) => {
        const currentInCart = getItemQuantity(product?.id);
        const maxAllowed = product ? product.stock_quantity - currentInCart : 0;
        
        if (newQuantity >= 1 && newQuantity <= maxAllowed) {
            setQuantity(newQuantity);
        }
    };

    const handleBackToStore = () => {
        navigate('/boutique');
    };

    const handleRelatedProductClick = (relatedProductId) => {
        navigate(`/boutique/produit/${relatedProductId}`);
    };

    if (loading) {
        return (
            <div className="product-detail-page">
                <div className="product-loading">
                    <div className="loading-spinner"></div>
                    <p>{t('common.loading')}</p>
                </div>
            </div>
        );
    }

    if (error || !product) {
        return (
            <div className="product-detail-page">
                <div className="product-error">
                    <h2>{t('errors.pageNotFound')}</h2>
                    <p>{error || t('errors.pageNotFoundDesc')}</p>
                    <button onClick={handleBackToStore} className="back-to-store-btn">
                        {t('navigation.back')}
                    </button>
                </div>
            </div>
        );
    }

    const currentInCart = getItemQuantity(product.id);
    const maxQuantity = product.stock_quantity - currentInCart;
    const isOutOfStock = product.stock_quantity === 0;
    const isLowStock = product.stock_quantity > 0 && product.stock_quantity <= 5;

    // Handle multiple images (for future enhancement)
    const productImages = product.image_url ? [product.image_url] : ['/images/placeholder-product.jpg'];

    return (
        <div className="product-detail-page">
            {/* Fixed Cart Widget */}
            <CartWidget className="cart-widget--fixed" />

            <div className="container">
                {/* Breadcrumb */}
                <nav className="breadcrumb">
                    <button onClick={handleBackToStore} className="breadcrumb-link">
                        {t('store.title')}
                    </button>
                    <span className="breadcrumb-separator">›</span>
                    <span className="breadcrumb-current">{product.name}</span>
                </nav>

                {/* Product Content */}
                <div className="product-content">
                    {/* Product Gallery */}
                    <div className="product-gallery">
                        <div className="gallery-main">
                            <img
                                src={productImages[selectedImage]}
                                alt={product.name}
                                className="gallery-main__image"
                                onError={(e) => {
                                    e.target.src = '/images/placeholder-product.jpg';
                                }}
                            />
                            {isOutOfStock && (
                                <div className="gallery-main__overlay">
                                    <span>{t('store.product.outOfStock')}</span>
                                </div>
                            )}
                        </div>
                        
                        {productImages.length > 1 && (
                            <div className="gallery-thumbnails">
                                {productImages.map((image, index) => (
                                    <button
                                        key={index}
                                        className={`gallery-thumbnail ${selectedImage === index ? 'active' : ''}`}
                                        onClick={() => setSelectedImage(index)}
                                    >
                                        <img src={image} alt={`${product.name} ${index + 1}`} />
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Product Info */}
                    <div className="product-info">
                        <motion.div
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: 0.2 }}
                        >
                            <h1 className="product-title">{product.name}</h1>
                            
                            <div className="product-meta">
                                {product.sku && (
                                    <span className="product-sku">
                                        {t('store.product.sku')}: {product.sku}
                                    </span>
                                )}
                                {product.category_name && (
                                    <span className="product-category">
                                        {t('store.product.category')}: {product.category_name}
                                    </span>
                                )}
                            </div>

                            <div className="product-price">
                                {product.price.toFixed(2)} MAD
                            </div>

                            <div className="product-availability">
                                {isOutOfStock ? (
                                    <span className="status status--out-of-stock">
                                        {t('store.product.outOfStock')}
                                    </span>
                                ) : isLowStock ? (
                                    <span className="status status--limited">
                                        {t('store.product.limitedStock')} ({product.stock_quantity})
                                    </span>
                                ) : (
                                    <span className="status status--in-stock">
                                        {t('store.product.inStock')}
                                    </span>
                                )}
                                
                                {currentInCart > 0 && (
                                    <span className="cart-info">
                                        {currentInCart} {t('cart.quantity')} en panier
                                    </span>
                                )}
                            </div>

                            <div className="product-description">
                                <h3>{t('store.product.description')}</h3>
                                <p>{product.description}</p>
                            </div>

                            {/* Add to Cart Section */}
                            {!isOutOfStock && maxQuantity > 0 && (
                                <div className="add-to-cart-section">
                                    <div className="quantity-selector">
                                        <label htmlFor="quantity">{t('cart.quantity')}:</label>
                                        <div className="quantity-controls">
                                            <button
                                                onClick={() => handleQuantityChange(quantity - 1)}
                                                disabled={quantity <= 1}
                                                className="quantity-btn"
                                            >
                                                -
                                            </button>
                                            <input
                                                type="number"
                                                id="quantity"
                                                value={quantity}
                                                onChange={(e) => handleQuantityChange(parseInt(e.target.value) || 1)}
                                                min="1"
                                                max={maxQuantity}
                                                className="quantity-input"
                                            />
                                            <button
                                                onClick={() => handleQuantityChange(quantity + 1)}
                                                disabled={quantity >= maxQuantity}
                                                className="quantity-btn"
                                            >
                                                +
                                            </button>
                                        </div>
                                    </div>

                                    <AddToCartButton
                                        product={product}
                                        quantity={quantity}
                                        variant="primary"
                                        size="large"
                                        className="add-to-cart-btn--full"
                                        onSuccess={() => {
                                            // Reset quantity after successful add
                                            setQuantity(1);
                                        }}
                                    />
                                </div>
                            )}

                            {maxQuantity === 0 && !isOutOfStock && (
                                <div className="max-in-cart-message">
                                    <p>{t('cart.maxInCart')} - {product.stock_quantity} {t('cart.quantity')}</p>
                                    <p>{t('cart.viewCart')}</p>
                                </div>
                            )}
                        </motion.div>
                    </div>
                </div>

                {/* Related Products */}
                {relatedProducts.length > 0 && (
                    <div className="related-products">
                        <h2>{t('store.product.relatedProducts')}</h2>
                        <div className="related-products-grid">
                            {relatedProducts.map((relatedProduct, index) => (
                                <motion.div
                                    key={relatedProduct.id}
                                    className="related-product-card"
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: index * 0.1 }}
                                    onClick={() => handleRelatedProductClick(relatedProduct.id)}
                                >
                                    <div className="related-product-image">
                                        <img
                                            src={relatedProduct.image_url || '/images/placeholder-product.jpg'}
                                            alt={relatedProduct.name}
                                            onError={(e) => {
                                                e.target.src = '/images/placeholder-product.jpg';
                                            }}
                                        />
                                    </div>
                                    <div className="related-product-info">
                                        <h4>{relatedProduct.name}</h4>
                                        <p className="related-product-price">
                                            {relatedProduct.price.toFixed(2)} MAD
                                        </p>
                                    </div>
                                </motion.div>
                            ))}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default ProductDetailPage;