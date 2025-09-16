import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';
import { publicAPI } from '../../services/api';
import AddToCartButton from '../../components/AddToCartButton';
import CartWidget from '../../components/CartWidget';
import './StorePage.css';

const StorePage = () => {
    const { t } = useTranslation();
    const navigate = useNavigate();
    const [searchParams, setSearchParams] = useSearchParams();

    const [products, setProducts] = useState([]);
    const [categories, setCategories] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    
    // Filters and search
    const [selectedCategory, setSelectedCategory] = useState(searchParams.get('category') || '');
    const [searchQuery, setSearchQuery] = useState(searchParams.get('search') || '');
    const [sortBy, setSortBy] = useState(searchParams.get('sort') || 'newest');
    const [priceRange, setPriceRange] = useState({
        min: searchParams.get('min_price') || '',
        max: searchParams.get('max_price') || ''
    });
    
    // Pagination
    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const itemsPerPage = 12;

    // Fetch categories
    useEffect(() => {
        const fetchCategories = async () => {
            try {
                const response = await publicAPI.getCategories();
                if (response.data.success) {
                    setCategories(response.data.data);
                }
            } catch (error) {
                console.error('Error fetching categories:', error);
            }
        };

        fetchCategories();
    }, []);

    // Fetch products
    useEffect(() => {
        const fetchProducts = async () => {
            setLoading(true);
            try {
                const params = {
                    page: currentPage,
                    limit: itemsPerPage,
                    sort: sortBy
                };

                if (selectedCategory) params.category_id = selectedCategory;
                if (searchQuery) params.search = searchQuery;
                if (priceRange.min) params.min_price = priceRange.min;
                if (priceRange.max) params.max_price = priceRange.max;

                const response = await publicAPI.getProducts(params);
                
                if (response.data.success) {
                    setProducts(response.data.data);
                    setTotalPages(Math.ceil(response.data.pagination.total / itemsPerPage));
                } else {
                    setError(response.data.message);
                }
            } catch (error) {
                console.error('Error fetching products:', error);
                setError(t('errors.networkError'));
            } finally {
                setLoading(false);
            }
        };

        fetchProducts();
    }, [currentPage, selectedCategory, searchQuery, sortBy, priceRange, t]);

    // Update URL params
    useEffect(() => {
        const params = new URLSearchParams();
        if (selectedCategory) params.set('category', selectedCategory);
        if (searchQuery) params.set('search', searchQuery);
        if (sortBy !== 'newest') params.set('sort', sortBy);
        if (priceRange.min) params.set('min_price', priceRange.min);
        if (priceRange.max) params.set('max_price', priceRange.max);
        
        setSearchParams(params);
    }, [selectedCategory, searchQuery, sortBy, priceRange, setSearchParams]);

    const handleSearch = (e) => {
        e.preventDefault();
        setCurrentPage(1);
    };

    const handleCategoryChange = (categoryId) => {
        setSelectedCategory(categoryId);
        setCurrentPage(1);
    };

    const handleSortChange = (newSort) => {
        setSortBy(newSort);
        setCurrentPage(1);
    };

    const handlePriceRangeChange = (range) => {
        setPriceRange(range);
        setCurrentPage(1);
    };

    const clearFilters = () => {
        setSelectedCategory('');
        setSearchQuery('');
        setPriceRange({ min: '', max: '' });
        setSortBy('newest');
        setCurrentPage(1);
    };

    const handleProductClick = (productId) => {
        navigate(`/boutique/produit/${productId}`);
    };

    if (loading) {
        return (
            <div className="store-page">
                <div className="store-loading">
                    <div className="loading-spinner"></div>
                    <p>{t('common.loading')}</p>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="store-page">
                <div className="store-error">
                    <p>{error}</p>
                    <button onClick={() => window.location.reload()}>
                        {t('common.retry')}
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="store-page">
            {/* Fixed Cart Widget */}
            <CartWidget className="cart-widget--fixed" />

            {/* Header */}
            <div className="store-header">
                <div className="container">
                    <h1 className="store-title">{t('store.title')}</h1>
                    
                    {/* Search Bar */}
                    <form className="store-search" onSubmit={handleSearch}>
                        <input
                            type="text"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            placeholder={t('store.search')}
                            className="store-search__input"
                        />
                        <button type="submit" className="store-search__button">
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <circle cx="11" cy="11" r="8"/>
                                <path d="m21 21-4.35-4.35"/>
                            </svg>
                        </button>
                    </form>
                </div>
            </div>

            <div className="container">
                <div className="store-content">
                    {/* Sidebar Filters */}
                    <aside className="store-sidebar">
                        <div className="filter-section">
                            <h3>{t('store.filters.title')}</h3>
                            
                            {/* Categories */}
                            <div className="filter-group">
                                <h4>{t('store.filters.category')}</h4>
                                <div className="category-list">
                                    <button
                                        className={`category-item ${!selectedCategory ? 'active' : ''}`}
                                        onClick={() => handleCategoryChange('')}
                                    >
                                        {t('store.allCategories')}
                                    </button>
                                    {categories.map(category => (
                                        <button
                                            key={category.id}
                                            className={`category-item ${selectedCategory === category.id.toString() ? 'active' : ''}`}
                                            onClick={() => handleCategoryChange(category.id.toString())}
                                        >
                                            {category.name} ({category.product_count || 0})
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Price Range */}
                            <div className="filter-group">
                                <h4>{t('store.filters.priceRange')}</h4>
                                <div className="price-range">
                                    <input
                                        type="number"
                                        placeholder="Min"
                                        value={priceRange.min}
                                        onChange={(e) => setPriceRange({...priceRange, min: e.target.value})}
                                        min="0"
                                    />
                                    <span>-</span>
                                    <input
                                        type="number"
                                        placeholder="Max"
                                        value={priceRange.max}
                                        onChange={(e) => setPriceRange({...priceRange, max: e.target.value})}
                                        min="0"
                                    />
                                </div>
                            </div>

                            {/* Clear Filters */}
                            <button className="clear-filters" onClick={clearFilters}>
                                {t('store.filters.clearAll')}
                            </button>
                        </div>
                    </aside>

                    {/* Main Content */}
                    <main className="store-main">
                        {/* Toolbar */}
                        <div className="store-toolbar">
                            <div className="results-info">
                                {searchQuery ? (
                                    <span>{t('store.searchResults')}: "{searchQuery}"</span>
                                ) : (
                                    <span>{products.length} {t('store.products')}</span>
                                )}
                            </div>

                            <div className="sort-controls">
                                <label>{t('store.sortBy')}:</label>
                                <select 
                                    value={sortBy} 
                                    onChange={(e) => handleSortChange(e.target.value)}
                                >
                                    <option value="newest">{t('store.sortOptions.newest')}</option>
                                    <option value="oldest">{t('store.sortOptions.oldest')}</option>
                                    <option value="price_asc">{t('store.sortOptions.priceAsc')}</option>
                                    <option value="price_desc">{t('store.sortOptions.priceDesc')}</option>
                                    <option value="name_asc">{t('store.sortOptions.nameAsc')}</option>
                                    <option value="name_desc">{t('store.sortOptions.nameDesc')}</option>
                                </select>
                            </div>
                        </div>

                        {/* Products Grid */}
                        {products.length === 0 ? (
                            <div className="no-results">
                                <div className="no-results__icon">
                                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1">
                                        <circle cx="11" cy="11" r="8"/>
                                        <path d="m21 21-4.35-4.35"/>
                                    </svg>
                                </div>
                                <h3>{t('store.noResults')}</h3>
                                <p>{t('store.noResultsDescription')}</p>
                                <button onClick={clearFilters} className="clear-filters-btn">
                                    {t('store.filters.clearAll')}
                                </button>
                            </div>
                        ) : (
                            <div className="products-grid">
                                {products.map((product, index) => (
                                    <motion.div
                                        key={product.id}
                                        className="product-card"
                                        initial={{ opacity: 0, y: 20 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ delay: index * 0.05 }}
                                    >
                                        <div className="product-card__image" onClick={() => handleProductClick(product.id)}>
                                            <img
                                                src={product.image_url || '/images/placeholder-product.jpg'}
                                                alt={product.name}
                                                onError={(e) => {
                                                    e.target.src = '/images/placeholder-product.jpg';
                                                }}
                                            />
                                            {product.stock_quantity === 0 && (
                                                <div className="product-card__overlay">
                                                    <span>{t('store.product.outOfStock')}</span>
                                                </div>
                                            )}
                                        </div>
                                        
                                        <div className="product-card__content">
                                            <h3 className="product-card__name" onClick={() => handleProductClick(product.id)}>
                                                {product.name}
                                            </h3>
                                            
                                            <p className="product-card__description">
                                                {product.description}
                                            </p>
                                            
                                            <div className="product-card__footer">
                                                <div className="product-card__price">
                                                    {product.price.toFixed(2)} MAD
                                                </div>
                                                
                                                <AddToCartButton
                                                    product={product}
                                                    variant="primary"
                                                    size="small"
                                                />
                                            </div>
                                        </div>
                                    </motion.div>
                                ))}
                            </div>
                        )}

                        {/* Pagination */}
                        {totalPages > 1 && (
                            <div className="pagination">
                                <button
                                    onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                                    disabled={currentPage === 1}
                                    className="pagination__btn"
                                >
                                    {t('common.previous')}
                                </button>
                                
                                <div className="pagination__info">
                                    {currentPage} / {totalPages}
                                </div>
                                
                                <button
                                    onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                                    disabled={currentPage === totalPages}
                                    className="pagination__btn"
                                >
                                    {t('common.next')}
                                </button>
                            </div>
                        )}
                    </main>
                </div>
            </div>
        </div>
    );
};

export default StorePage;