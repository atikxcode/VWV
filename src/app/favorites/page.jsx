'use client'

import React from 'react';
import { useFavorites } from '../../../components/hooks/useFavorites';
import { useCart } from '../../../components/hooks/useCart';
import Image from 'next/image';
import { Heart, ShoppingCart, Sparkles, Package, ArrowRight } from 'lucide-react';

export default function FavoritesPage() {
  const { favorites, toggleFavorite } = useFavorites();
  const { addToCart } = useCart();

  if (favorites.length === 0) {
    return (
      <div className="min-h-screen  flex items-center justify-center px-4">
        <div className="text-center max-w-md">
          {/* Empty State Illustration */}
          <div className="mb-8 relative">
            <div className="w-32 h-32 mx-auto bg-gradient-to-br from-purple-100 to-pink-100 rounded-full flex items-center justify-center shadow-lg">
              <Heart size={64} className="text-purple-300" />
            </div>
            <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-4">
              <Sparkles size={24} className="text-yellow-400 animate-pulse" />
            </div>
          </div>

          {/* Empty State Text */}
          <h2 className="text-3xl font-bold text-gray-900 mb-3">
            No favorites yet
          </h2>
          <p className="text-gray-600 mb-8 leading-relaxed">
            Start adding products you love to your favorites list and they'll appear here!
          </p>

          {/* CTA Button */}
          <a 
            href="/products" 
            className="inline-flex items-center gap-2 bg-gradient-to-r from-purple-600 to-pink-600 text-white px-8 py-4 rounded-xl font-semibold shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 transition-all duration-200"
          >
            <Package size={20} />
            Browse Products
            <ArrowRight size={20} />
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-blue-50 py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header Section */}
        <div className="mb-10">
          <div className="flex items-center gap-3 mb-3">
            <div className="p-3 bg-gradient-to-br from-purple-500 to-pink-500 rounded-xl shadow-lg">
              <Heart size={28} className="text-white" fill="white" />
            </div>
            <div>
              <h1 className="text-4xl font-bold text-gray-900">
                My Favorites
              </h1>
              <p className="text-gray-600 mt-1">
                {favorites.length} {favorites.length === 1 ? 'item' : 'items'} saved
              </p>
            </div>
          </div>
        </div>
        
        {/* Products Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {favorites.map(product => (
            <div 
              key={product._id} 
              className="group bg-white rounded-2xl shadow-md hover:shadow-2xl overflow-hidden transition-all duration-300 transform hover:-translate-y-1"
            >
              {/* Image Container */}
              <div className="relative h-56 bg-gray-100 overflow-hidden">
                <Image
                  src={product.images?.[0]?.url || '/placeholder.jpg'}
                  alt={product.name}
                  fill
                  className="object-cover group-hover:scale-110 transition-transform duration-500"
                  unoptimized
                />
                
                {/* Favorite Badge */}
                <div className="absolute top-3 right-3 bg-white rounded-full p-2 shadow-lg">
                  <Heart 
                    size={18} 
                    className="text-red-500" 
                    fill="currentColor"
                  />
                </div>

                {/* Hover Overlay */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/0 to-black/0 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
              </div>
              
              {/* Content */}
              <div className="p-5">
                {/* Product Name */}
                <h3 className="font-semibold text-lg text-gray-900 mb-2 line-clamp-2 group-hover:text-purple-600 transition-colors">
                  {product.name}
                </h3>

                {/* Brand (if exists) */}
                {product.brand && (
                  <p className="text-sm text-gray-500 mb-3">
                    {product.brand}
                  </p>
                )}

                {/* Price */}
                <div className="mb-4">
                  <div className="flex items-baseline gap-2">
                    <span className="text-2xl font-bold text-purple-600">
                      BDT {product.price?.toLocaleString()}
                    </span>
                  </div>
                </div>
                
                {/* Action Buttons */}
                <div className="flex gap-2">
                  <button
                    onClick={() => addToCart(product)}
                    className="flex-1 bg-gradient-to-r from-purple-600 to-pink-600 text-white py-3 px-4 rounded-xl font-medium flex items-center justify-center gap-2 hover:from-purple-700 hover:to-pink-700 transition-all duration-200 shadow-md hover:shadow-lg transform hover:-translate-y-0.5"
                  >
                    <ShoppingCart size={18} />
                    <span>Add to Cart</span>
                  </button>
                  <button
                    onClick={() => toggleFavorite(product)}
                    className="p-3 border-2 border-red-500 text-red-500 rounded-xl hover:bg-red-50 transition-all duration-200 shadow-sm hover:shadow-md"
                    title="Remove from favorites"
                  >
                    <Heart size={18} fill="currentColor" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
