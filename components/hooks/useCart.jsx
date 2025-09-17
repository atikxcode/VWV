'use client'

import { createContext, useContext, useState, useEffect } from 'react';

const CartContext = createContext();

export function useCart() {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
}

export function CartProvider({ children }) {
  const [cartItems, setCartItems] = useState([]);
  const [isHydrated, setIsHydrated] = useState(false);

  useEffect(() => {
    setIsHydrated(true);
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('vwv-cart');
      if (saved) {
        try {
          setCartItems(JSON.parse(saved));
        } catch {
          setCartItems([]);
        }
      }
    }
  }, []);

  useEffect(() => {
    if (isHydrated) {
      localStorage.setItem('vwv-cart', JSON.stringify(cartItems));
    }
  }, [cartItems, isHydrated]);

  // 🆕 UPDATED: Add to cart with selected options support
  const addToCart = (product, quantity = 1, selectedOptions = {}) => {
    // Create a unique identifier based on product ID and selected options
    const optionsString = JSON.stringify(selectedOptions);
    const uniqueId = `${product._id}_${optionsString}`;
    
    const existingItem = cartItems.find(item => 
      item.product._id === product._id && 
      JSON.stringify(item.selectedOptions || {}) === optionsString
    );

    if (existingItem) {
      // Update quantity of existing item with same options
      setCartItems(items =>
        items.map(item =>
          item.id === existingItem.id
            ? { ...item, quantity: item.quantity + quantity }
            : item
        )
      );
    } else {
      // Add new item with selected options
      setCartItems(items => [...items, {
        id: uniqueId,
        product,
        quantity,
        selectedOptions, // 🆕 Store selected options
        addedAt: new Date().toISOString()
      }]);
    }
  };

  const removeFromCart = (id) => {
    setCartItems(items => items.filter(item => item.id !== id));
  };

  const updateQuantity = (id, quantity) => {
    if (quantity <= 0) {
      removeFromCart(id);
    } else {
      setCartItems(items =>
        items.map(item =>
          item.id === id ? { ...item, quantity } : item
        )
      );
    }
  };

  const clearCart = () => {
    setCartItems([]);
  };

  const getCartTotal = () => {
    return cartItems.reduce((sum, item) => sum + item.product.price * item.quantity, 0);
  };

  const getCartItemsCount = () => {
    return cartItems.reduce((sum, item) => sum + item.quantity, 0);
  };

  // 🆕 NEW: Helper function to format product options for display
  const getProductOptionsText = (selectedOptions) => {
    if (!selectedOptions || Object.keys(selectedOptions).length === 0) {
      return '';
    }

    const options = [];
    if (selectedOptions.nicotineStrength) {
      options.push(`${selectedOptions.nicotineStrength} nicotine`);
    }
    if (selectedOptions.vgPgRatio) {
      options.push(`${selectedOptions.vgPgRatio} VG/PG`);
    }
    if (selectedOptions.color) {
      options.push(`${selectedOptions.color} color`);
    }

    return options.length > 0 ? `(${options.join(', ')})` : '';
  };

  return (
    <CartContext.Provider value={{
      cartItems,
      addToCart,
      removeFromCart,
      updateQuantity,
      clearCart,
      getCartTotal,
      getCartItemsCount,
      getProductOptionsText, // 🆕 Export helper function
      isHydrated,
    }}>
      {children}
    </CartContext.Provider>
  );
}
