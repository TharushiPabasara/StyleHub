import React, { createContext, useState, useEffect } from 'react';
import { message } from 'antd';

export const CartContext = createContext();

export const CartProvider = ({ children }) => {
  const [cartItems, setCartItems] = useState(() => {
    const savedCart = localStorage.getItem('stylehub_cart');
    return savedCart ? JSON.parse(savedCart) : [];
  });

  useEffect(() => {
    localStorage.setItem('stylehub_cart', JSON.stringify(cartItems));
  }, [cartItems]);

  const addToCart = (product, variant, quantity) => {
    // Generate a unique ID based on product and size
    const cartItemId = `${product._id}-${variant?.size || 'standard'}`;

    setCartItems(prev => {
      const existingItemIndex = prev.findIndex(item => item.id === cartItemId);
      if (existingItemIndex >= 0) {
        const existingItem = prev[existingItemIndex];
        const newQuantity = existingItem.quantity + quantity;
        
        // Check stock
        if (newQuantity > variant.stock) {
          message.warning(`Only ${variant.stock} items available in stock for this variant.`);
          return prev;
        }

        const updatedCart = [...prev];
        updatedCart[existingItemIndex].quantity = newQuantity;
        message.success('Cart updated successfully!');
        return updatedCart;
      } else {
        message.success('Item added to cart!');
        return [...prev, { id: cartItemId, product, variant, quantity }];
      }
    });
  };

  const removeFromCart = (cartItemId) => {
    setCartItems(prev => prev.filter(item => item.id !== cartItemId));
    message.success('Item removed from cart');
  };

  const updateQuantity = (cartItemId, newQuantity) => {
    setCartItems(prev => {
      return prev.map(item => {
        if (item.id === cartItemId) {
          if (newQuantity > item.variant.stock) {
            message.warning(`Only ${item.variant.stock} items available in stock.`);
          }
          if (newQuantity < 1) return item;
          return { ...item, quantity: newQuantity };
        }
        return item;
      });
    });
  };

  const clearCart = () => {
    setCartItems([]);
  };

  return (
    <CartContext.Provider value={{ cartItems, addToCart, removeFromCart, updateQuantity, clearCart }}>
      {children}
    </CartContext.Provider>
  );
};
