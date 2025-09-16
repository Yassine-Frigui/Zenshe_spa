import React, { createContext, useContext, useReducer, useEffect } from 'react';

// Cart context
const CartContext = createContext();

// Cart actions
const CART_ACTIONS = {
    ADD_ITEM: 'ADD_ITEM',
    REMOVE_ITEM: 'REMOVE_ITEM',
    UPDATE_QUANTITY: 'UPDATE_QUANTITY',
    CLEAR_CART: 'CLEAR_CART',
    LOAD_CART: 'LOAD_CART',
    SET_LOADING: 'SET_LOADING'
};

// Initial cart state
const initialCartState = {
    items: [],
    totalItems: 0,
    totalAmount: 0,
    isLoading: false,
    lastUpdated: null
};

// Cart reducer
const cartReducer = (state, action) => {
    switch (action.type) {
        case CART_ACTIONS.ADD_ITEM: {
            const { product, quantity = 1 } = action.payload;
            const existingItemIndex = state.items.findIndex(item => item.id === product.id);
            
            let newItems;
            if (existingItemIndex >= 0) {
                // Update existing item quantity
                newItems = state.items.map((item, index) => 
                    index === existingItemIndex 
                        ? { ...item, quantity: item.quantity + quantity }
                        : item
                );
            } else {
                // Add new item
                const newItem = {
                    id: product.id,
                    name: product.name,
                    price: product.price,
                    image_url: product.image_url,
                    sku: product.sku,
                    stock_quantity: product.stock_quantity,
                    quantity: quantity,
                    subtotal: product.price * quantity
                };
                newItems = [...state.items, newItem];
            }
            
            return calculateTotals({ ...state, items: newItems, lastUpdated: Date.now() });
        }

        case CART_ACTIONS.REMOVE_ITEM: {
            const productId = action.payload;
            const newItems = state.items.filter(item => item.id !== productId);
            return calculateTotals({ ...state, items: newItems, lastUpdated: Date.now() });
        }

        case CART_ACTIONS.UPDATE_QUANTITY: {
            const { productId, quantity } = action.payload;
            
            if (quantity <= 0) {
                // Remove item if quantity is 0 or less
                const newItems = state.items.filter(item => item.id !== productId);
                return calculateTotals({ ...state, items: newItems, lastUpdated: Date.now() });
            }
            
            const newItems = state.items.map(item => 
                item.id === productId 
                    ? { ...item, quantity, subtotal: item.price * quantity }
                    : item
            );
            
            return calculateTotals({ ...state, items: newItems, lastUpdated: Date.now() });
        }

        case CART_ACTIONS.CLEAR_CART:
            return { ...initialCartState, lastUpdated: Date.now() };

        case CART_ACTIONS.LOAD_CART:
            return calculateTotals({ ...state, ...action.payload });

        case CART_ACTIONS.SET_LOADING:
            return { ...state, isLoading: action.payload };

        default:
            return state;
    }
};

// Helper function to calculate cart totals
const calculateTotals = (state) => {
    const totalItems = state.items.reduce((sum, item) => sum + item.quantity, 0);
    const totalAmount = state.items.reduce((sum, item) => sum + item.subtotal, 0);
    
    return {
        ...state,
        totalItems,
        totalAmount: parseFloat(totalAmount.toFixed(2))
    };
};

// Cart Provider Component
export const CartProvider = ({ children }) => {
    const [cartState, dispatch] = useReducer(cartReducer, initialCartState);

    // Load cart from localStorage on mount
    useEffect(() => {
        const savedCart = localStorage.getItem('zenshe_spa_cart');
        if (savedCart) {
            try {
                const parsedCart = JSON.parse(savedCart);
                dispatch({ type: CART_ACTIONS.LOAD_CART, payload: parsedCart });
            } catch (error) {
                console.error('Error loading cart from localStorage:', error);
                localStorage.removeItem('zenshe_spa_cart');
            }
        }
    }, []);

    // Save cart to localStorage whenever it changes
    useEffect(() => {
        if (cartState.lastUpdated) {
            localStorage.setItem('zenshe_spa_cart', JSON.stringify({
                items: cartState.items,
                totalItems: cartState.totalItems,
                totalAmount: cartState.totalAmount,
                lastUpdated: cartState.lastUpdated
            }));
        }
    }, [cartState]);

    // Cart actions
    const addToCart = (product, quantity = 1) => {
        // Validation
        if (!product || !product.id || !product.price) {
            throw new Error('Invalid product data');
        }

        if (!product.is_active) {
            throw new Error('Ce produit n\'est pas disponible');
        }

        if (product.stock_quantity < quantity) {
            throw new Error('Stock insuffisant');
        }

        // Check if adding this quantity would exceed stock
        const existingItem = cartState.items.find(item => item.id === product.id);
        const currentCartQuantity = existingItem ? existingItem.quantity : 0;
        const newTotalQuantity = currentCartQuantity + quantity;

        if (newTotalQuantity > product.stock_quantity) {
            throw new Error(`Stock insuffisant. Quantité disponible: ${product.stock_quantity - currentCartQuantity}`);
        }

        dispatch({ 
            type: CART_ACTIONS.ADD_ITEM, 
            payload: { product, quantity } 
        });
        
        return true;
    };

    const removeFromCart = (productId) => {
        dispatch({ type: CART_ACTIONS.REMOVE_ITEM, payload: productId });
    };

    const updateQuantity = (productId, quantity) => {
        const item = cartState.items.find(item => item.id === productId);
        if (item && quantity > item.stock_quantity) {
            throw new Error(`Stock insuffisant. Maximum disponible: ${item.stock_quantity}`);
        }

        dispatch({ 
            type: CART_ACTIONS.UPDATE_QUANTITY, 
            payload: { productId, quantity } 
        });
    };

    const clearCart = () => {
        dispatch({ type: CART_ACTIONS.CLEAR_CART });
    };

    const getItemQuantity = (productId) => {
        const item = cartState.items.find(item => item.id === productId);
        return item ? item.quantity : 0;
    };

    const isItemInCart = (productId) => {
        return cartState.items.some(item => item.id === productId);
    };

    const getCartItemsCount = () => {
        return cartState.totalItems;
    };

    const getCartTotal = () => {
        return cartState.totalAmount;
    };

    const getCartItems = () => {
        return cartState.items;
    };

    // Prepare order data for checkout
    const getOrderData = () => {
        return {
            items: cartState.items.map(item => ({
                product_id: item.id,
                quantity: item.quantity,
                price: item.price
            })),
            total_amount: cartState.totalAmount,
            items_count: cartState.totalItems
        };
    };

    // Check if cart has items
    const hasItems = () => {
        return cartState.items.length > 0;
    };

    // Get cart summary for display
    const getCartSummary = () => {
        return {
            itemsCount: cartState.totalItems,
            totalAmount: cartState.totalAmount,
            isEmpty: cartState.items.length === 0,
            items: cartState.items.map(item => ({
                id: item.id,
                name: item.name,
                quantity: item.quantity,
                price: item.price,
                subtotal: item.subtotal,
                image_url: item.image_url
            }))
        };
    };

    const contextValue = {
        // State
        ...cartState,
        
        // Actions
        addToCart,
        removeFromCart,
        updateQuantity,
        clearCart,
        
        // Getters
        getItemQuantity,
        isItemInCart,
        getCartItemsCount,
        getCartTotal,
        getCartItems,
        getOrderData,
        hasItems,
        getCartSummary
    };

    return (
        <CartContext.Provider value={contextValue}>
            {children}
        </CartContext.Provider>
    );
};

// Custom hook to use cart context
export const useCart = () => {
    const context = useContext(CartContext);
    if (!context) {
        throw new Error('useCart must be used within a CartProvider');
    }
    return context;
};

// Export actions for external use if needed
export { CART_ACTIONS };

export default CartContext;