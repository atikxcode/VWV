'use client'

import React from 'react';
import { useCart } from '../../../components/hooks/useCart';
import Image from 'next/image';
import { Trash2, Plus, Minus } from 'lucide-react';

export default function CartPage() {
  const { cartItems, removeFromCart, updateQuantity, getCartTotal, clearCart } = useCart();

  if (cartItems.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Your cart is empty</h2>
          <a href="/products" className="bg-purple-600 text-white px-6 py-3 rounded-lg">
            Continue Shopping
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">Shopping Cart</h1>
        
        <div className="bg-white rounded-lg shadow-md p-6">
          {cartItems.map(item => (
            <div key={item.id} className="flex items-center py-6 border-b">
              <div className="relative w-20 h-20">
                <Image
                  src={item.product.images?.[0]?.url || '/placeholder.jpg'}
                  alt={item.product.name}
                  fill
                  className="object-cover rounded"
                />
              </div>
              
              <div className="flex-1 ml-4">
                <h3 className="text-lg font-semibold">{item.product.name}</h3>
                <p className="text-purple-600 font-bold">BDT {item.product.price.toLocaleString()}</p>
              </div>
              
              <div className="flex items-center gap-2">
                <button
                  onClick={() => updateQuantity(item.id, item.quantity - 1)}
                  className="p-1 rounded bg-gray-200"
                >
                  <Minus size={16} />
                </button>
                <span className="w-8 text-center">{item.quantity}</span>
                <button
                  onClick={() => updateQuantity(item.id, item.quantity + 1)}
                  className="p-1 rounded bg-gray-200"
                >
                  <Plus size={16} />
                </button>
              </div>
              
              <button
                onClick={() => removeFromCart(item.id)}
                className="ml-4 text-red-500 hover:text-red-700"
              >
                <Trash2 size={20} />
              </button>
            </div>
          ))}
          
          <div className="flex justify-between items-center mt-6">
            <button
              onClick={clearCart}
              className="text-red-500 hover:text-red-700"
            >
              Clear Cart
            </button>
            <div className="text-right">
              <p className="text-2xl font-bold">Total: BDT {getCartTotal().toLocaleString()}</p>
              <button className="mt-4 bg-purple-600 text-white px-8 py-3 rounded-lg">
                Checkout
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
