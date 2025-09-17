'use client'

import React, { useState, useMemo } from 'react';
import { useCart } from '../../../components/hooks/useCart';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Trash2, 
  Plus, 
  Minus, 
  Package, 
  ShoppingCart,
  ArrowLeft,
  Percent,
  Tag,
  Shield,
  CreditCard,
  Star,
  Droplets
} from 'lucide-react';
import Swal from 'sweetalert2';

export default function CartPage() {
  const router = useRouter();
  const { 
    cartItems, 
    removeFromCart, 
    updateQuantity, 
    getCartTotal, 
    clearCart, 
    getProductOptionsText 
  } = useCart();

  // Enhanced state management
  const [isLoading, setIsLoading] = useState(false);

  // Calculate totals (simplified - just subtotal and total)
  const cartCalculations = useMemo(() => {
    const subtotal = getCartTotal();
    const total = subtotal; // No additional fees
    
    return {
      subtotal,
      total,
      itemCount: cartItems.reduce((sum, item) => sum + item.quantity, 0)
    };
  }, [cartItems, getCartTotal]);

  // Enhanced remove item with confirmation
  const handleRemoveItem = async (item) => {
    const result = await Swal.fire({
      title: 'Remove Item?',
      html: `
        <div class="text-left">
          <p class="text-gray-700 mb-2">Are you sure you want to remove:</p>
          <p class="font-semibold text-gray-900">${item.product.name}</p>
          ${item.selectedOptions && Object.keys(item.selectedOptions).length > 0 
            ? `<p class="text-sm text-gray-600 mt-1">Options: ${Object.entries(item.selectedOptions)
                .map(([key, value]) => `${key}: ${value}`).join(', ')}</p>`
            : ''
          }
        </div>
      `,
      icon: 'question',
      showCancelButton: true,
      confirmButtonText: 'Yes, Remove',
      cancelButtonText: 'Cancel',
      confirmButtonColor: '#ef4444',
      cancelButtonColor: '#6b7280',
    });

    if (result.isConfirmed) {
      removeFromCart(item.id);
      
      Swal.fire({
        title: 'Removed!',
        text: 'Item has been removed from your cart.',
        icon: 'success',
        timer: 2000,
        showConfirmButton: false,
        toast: true,
        position: 'top-end'
      });
    }
  };

  // Enhanced clear cart with confirmation
  const handleClearCart = async () => {
    const result = await Swal.fire({
      title: 'Clear Cart?',
      text: `This will remove all ${cartCalculations.itemCount} items from your cart.`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Yes, Clear All',
      cancelButtonText: 'Cancel',
      confirmButtonColor: '#ef4444',
      cancelButtonColor: '#6b7280',
    });

    if (result.isConfirmed) {
      clearCart();
      
      Swal.fire({
        title: 'Cart Cleared!',
        text: 'All items have been removed from your cart.',
        icon: 'success',
        timer: 2000,
        showConfirmButton: false
      });
    }
  };

  // Empty cart state
  if (cartItems.length === 0) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
        <div className="max-w-4xl mx-auto px-4 py-16">
          <motion.div 
            className="text-center"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <div className="bg-white rounded-2xl shadow-xl p-12 max-w-md mx-auto">
              <div className="w-24 h-24 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <ShoppingCart size={40} className="text-purple-600" />
              </div>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">Your cart is empty</h2>
              <p className="text-gray-600 mb-8">Looks like you haven't added any items to your cart yet.</p>
              
              <button
                onClick={() => router.push('/products')}
                className="bg-gradient-to-r from-purple-600 to-purple-700 text-white px-8 py-3 rounded-lg hover:from-purple-700 hover:to-purple-800 transition-all duration-200 transform hover:scale-105 shadow-lg font-semibold"
              >
                Start Shopping
              </button>
              
              <div className="mt-8 grid grid-cols-3 gap-4 text-center">
                <div className="flex flex-col items-center">
                  <Package size={20} className="text-green-600 mb-2" />
                  <span className="text-xs text-gray-600">Quality Products</span>
                </div>
                <div className="flex flex-col items-center">
                  <Shield size={20} className="text-blue-600 mb-2" />
                  <span className="text-xs text-gray-600">Secure Payment</span>
                </div>
                <div className="flex flex-col items-center">
                  <Star size={20} className="text-yellow-600 mb-2" />
                  <span className="text-xs text-gray-600">Best Service</span>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      <div className="max-w-7xl mx-auto px-4 py-8">
        
        {/* Header Section */}
        <motion.div 
          className="flex items-center justify-between mb-8"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <div className="flex items-center gap-4">
            <button
              onClick={() => router.push('/products')}
              className="p-2 rounded-lg bg-white shadow-md hover:shadow-lg transition-all duration-200 hover:scale-105"
            >
              <ArrowLeft size={20} className="text-gray-600" />
            </button>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Shopping Cart</h1>
              <p className="text-gray-600">{cartCalculations.itemCount} items in your cart</p>
            </div>
          </div>
          
          {/* Quick Actions */}
          <div className="flex gap-3">
            <button
              onClick={handleClearCart}
              className="flex items-center gap-2 px-4 py-2 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 transition-colors"
            >
              <Trash2 size={16} />
              Clear All
            </button>
          </div>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Cart Items Section */}
          <div className="lg:col-span-2">
            
            {/* Cart Items */}
            <div className="bg-white rounded-xl shadow-lg overflow-hidden">
              <div className="p-6 border-b border-gray-200">
                <h2 className="text-xl font-semibold text-gray-900">Cart Items</h2>
              </div>
              
              <div className="divide-y divide-gray-200">
                <AnimatePresence>
                  {cartItems.map((item, index) => (
                    <motion.div
                      key={item.id}
                      className="p-6 hover:bg-gray-50 transition-colors"
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: 20 }}
                      transition={{ duration: 0.3, delay: index * 0.1 }}
                      layout
                    >
                      <div className="flex items-start gap-4">
                        
                        {/* Product Image */}
                        <div className="relative w-20 h-20 flex-shrink-0">
                          {item.product.images?.[0]?.url ? (
                            <Image
                              src={item.product.images[0].url}
                              alt={item.product.name}
                              fill
                              className="object-cover rounded-lg"
                              sizes="80px"
                            />
                          ) : (
                            <div className="w-full h-full bg-gray-200 rounded-lg flex items-center justify-center">
                              <Package size={24} className="text-gray-400" />
                            </div>
                          )}
                        </div>
                        
                        {/* Product Info */}
                        <div className="flex-1 min-w-0">
                          <div className="flex justify-between items-start mb-2">
                            <h3 className="text-lg font-semibold text-gray-900 line-clamp-2">
                              {item.product.name}
                            </h3>
                            <button
                              onClick={() => handleRemoveItem(item)}
                              className="p-2 text-red-500 hover:text-red-700 hover:bg-red-50 rounded-lg transition-colors ml-4"
                              title="Remove item"
                            >
                              <Trash2 size={18} />
                            </button>
                          </div>
                          
                          {/* Brand */}
                          {item.product.brand && (
                            <p className="text-sm text-gray-600 mb-2">{item.product.brand}</p>
                          )}
                          
                          {/* Selected Options */}
                          {item.selectedOptions && Object.keys(item.selectedOptions).length > 0 && (
                            <div className="mb-3">
                              <div className="flex flex-wrap gap-2">
                                {item.selectedOptions.nicotineStrength && (
                                  <span className="inline-flex items-center gap-1 bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded-full">
                                    <Droplets size={12} />
                                    {item.selectedOptions.nicotineStrength} nicotine
                                  </span>
                                )}
                                {item.selectedOptions.vgPgRatio && (
                                  <span className="inline-flex items-center gap-1 bg-green-100 text-green-800 text-xs px-2 py-1 rounded-full">
                                    <Percent size={12} />
                                    {item.selectedOptions.vgPgRatio} VG/PG
                                  </span>
                                )}
                                {item.selectedOptions.color && (
                                  <span className="inline-flex items-center gap-1 bg-purple-100 text-purple-800 text-xs px-2 py-1 rounded-full">
                                    <Tag size={12} />
                                    {item.selectedOptions.color} color
                                  </span>
                                )}
                              </div>
                            </div>
                          )}
                          
                          {/* Price and Quantity Row */}
                          <div className="flex items-center justify-between">
                            <div>
                              <div className="flex items-center gap-2">
                                <span className="text-xl font-bold text-purple-600">
                                  BDT {item.product.price.toLocaleString()}
                                </span>
                                {item.product.comparePrice && item.product.comparePrice > item.product.price && (
                                  <span className="text-sm text-gray-400 line-through">
                                    BDT {item.product.comparePrice.toLocaleString()}
                                  </span>
                                )}
                              </div>
                              <p className="text-sm font-medium text-gray-700">
                                Subtotal: BDT {(item.product.price * item.quantity).toLocaleString()}
                              </p>
                            </div>
                            
                            {/* Quantity Controls */}
                            <div className="flex items-center gap-3 bg-gray-100 rounded-lg p-1">
                              <button
                                onClick={() => updateQuantity(item.id, item.quantity - 1)}
                                className="p-2 rounded-md bg-white shadow-sm hover:bg-gray-50 transition-colors disabled:opacity-50"
                                disabled={item.quantity <= 1}
                              >
                                <Minus size={14} />
                              </button>
                              <span className="w-12 text-center font-semibold text-gray-900">
                                {item.quantity}
                              </span>
                              <button
                                onClick={() => updateQuantity(item.id, item.quantity + 1)}
                                className="p-2 rounded-md bg-white shadow-sm hover:bg-gray-50 transition-colors"
                              >
                                <Plus size={14} />
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </AnimatePresence>
              </div>
            </div>
          </div>

          {/* Order Summary Sidebar */}
          <div className="lg:col-span-1">
            <motion.div
              className="bg-white rounded-xl shadow-lg overflow-hidden sticky top-8"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
            >
              
              {/* Order Summary Header */}
              <div className="p-6 bg-gradient-to-r from-purple-600 to-purple-700 text-white">
                <h3 className="text-xl font-semibold flex items-center gap-2">
                  <ShoppingCart size={20} />
                  Order Summary
                </h3>
              </div>
              
              {/* Summary Details */}
              <div className="p-6">
                
                {/* Price Breakdown */}
                <div className="space-y-3 mb-6">
                  <div className="flex justify-between text-gray-600">
                    <span>Subtotal ({cartCalculations.itemCount} items)</span>
                    <span>BDT {cartCalculations.subtotal.toLocaleString()}</span>
                  </div>
                </div>
                
                {/* Total */}
                <div className="border-t pt-4 mb-6">
                  <div className="flex justify-between items-center text-xl font-bold text-gray-900">
                    <span>Total</span>
                    <span className="text-purple-600">BDT {cartCalculations.total.toLocaleString()}</span>
                  </div>
                </div>
                
                {/* Checkout Button */}
                <motion.button
                onClick={() => router.push('/checkout')}
                  className="w-full bg-gradient-to-r from-purple-600 to-purple-700 text-white py-4 rounded-lg font-semibold text-lg hover:from-purple-700 hover:to-purple-800 transition-all duration-200 transform hover:scale-105 shadow-lg flex items-center justify-center gap-2"
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <CreditCard size={20} />
                  Proceed to Checkout
                </motion.button>
                
                {/* Payment Methods */}
                <div className="mt-4 text-center">
                  <p className="text-xs text-gray-500 mb-2">Secure Payment Methods</p>
                  <div className="flex justify-center items-center gap-2 text-gray-400">
                    <CreditCard size={16} />
                    <Shield size={16} />
                    <span className="text-xs">SSL Encrypted</span>
                  </div>
                </div>
                
                {/* Continue Shopping */}
                <button
                  onClick={() => router.push('/products')}
                  className="w-full mt-4 border border-gray-300 text-gray-700 py-3 rounded-lg font-medium hover:bg-gray-50 transition-colors"
                >
                  Continue Shopping
                </button>
              </div>
            </motion.div>
          </div>
        </div>
      </div>
      
      {/* Custom Styles */}
      <style jsx global>{`
        .line-clamp-2 {
          display: -webkit-box;
          -webkit-line-clamp: 2;
          -webkit-box-orient: vertical;
          overflow: hidden;
        }
      `}</style>
    </div>
  );
}
