'use client'

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { motion } from 'framer-motion';
import { Package, Heart, ShoppingCart } from 'lucide-react';
import { useCart } from '../../../components/hooks/useCart';
import { useFavorites } from '../../../components/hooks/useFavorites';

export default function ProductsPage() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  
  // Add cart and favorites hooks
  const { addToCart } = useCart();
  const { toggleFavorite, isFavorite } = useFavorites();

  useEffect(() => {
    async function fetchProducts() {
      setLoading(true);
      try {
        console.log('🔍 Fetching products...');
        const response = await fetch('/api/products?status=active');
        console.log('🔍 Response status:', response.status);
        const data = await response.json();
        console.log('🔍 Products loaded:', data.products?.length || 0);
        setProducts(data.products || []);
      } catch (error) {
        console.error('❌ Error fetching products:', error);
      } finally {
        setLoading(false);
      }
    }

    fetchProducts();
  }, []);

  const handleProductClick = (product) => {
    console.log('🔍 Navigating to product:', product.name, product._id);
    router.push(`/products/${product._id}`);
  };

  const handleAddToCart = (e, product) => {
    e.stopPropagation(); // Prevent navigation when clicking add to cart
    addToCart(product, 1);
    console.log('✅ Added to cart:', product.name);
  };

  const handleToggleFavorite = (e, product) => {
    e.stopPropagation(); // Prevent navigation when clicking favorite
    toggleFavorite(product);
    console.log('❤️ Toggled favorite:', product.name);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 via-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-purple-500"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-blue-50 to-indigo-100">
      {/* Main Content - No Header needed since you have Navbar */}
      <div className="max-w-7xl mx-auto px-4 py-8">
        
        {/* Products Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-8">
          {products.length === 0 ? (
            <div className="col-span-full text-center py-20">
              <Package size={64} className="mx-auto text-gray-400 mb-4" />
              <h3 className="text-xl font-semibold text-gray-900 mb-2">No products available</h3>
              <p className="text-gray-600">Please check back later</p>
            </div>
          ) : (
            products.map(product => (
              <motion.div
                key={product._id}
                whileHover={{ y: -8, scale: 1.02 }}
                className="bg-white rounded-2xl shadow-lg overflow-hidden cursor-pointer group hover:shadow-2xl transition-all duration-300 relative"
                onClick={() => handleProductClick(product)}
              >
                {/* Favorite Button */}
                <button
                  onClick={(e) => handleToggleFavorite(e, product)}
                  className="absolute top-4 right-4 z-10 p-2 rounded-full bg-white shadow-md hover:shadow-lg transition-all duration-200"
                >
                  <Heart
                    size={20}
                    className={`${
                      isFavorite(product._id) 
                        ? 'text-red-500 fill-red-500' 
                        : 'text-gray-400 hover:text-red-500'
                    } transition-colors`}
                  />
                </button>

                {/* Clean Product Image */}
                <div className="relative w-full h-64 bg-gradient-to-br from-gray-50 to-gray-100">
                  {product.images && product.images.length > 0 ? (
                    <Image
                      src={product.images[0].url}
                      alt={product.images[0].alt || product.name || 'Product image'}
                      fill
                      sizes="(max-width: 640px) 100vw, (max-width: 768px) 50vw, (max-width: 1024px) 33vw, 25vw"
                      className="object-cover group-hover:scale-105 transition-transform duration-300"
                      priority={false}
                      placeholder="blur"
                      blurDataURL="data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAYEBQYFBAYGBQYHBwYIChAKCgkJChQODwwQFxQYGBcUFhYaHSUfGhsjHBYWICwgIyYnKSopGR8tMC0oMCUoKSj/2wBDAQcHBwoIChMKChMoGhYaKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCj/wAARCAABAAEDASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAv/xAAUEAEAAAAAAAAAAAAAAAAAAAAA/8QAFQEBAQAAAAAAAAAAAAAAAAAAAAX/xAAUEQEAAAAAAAAAAAAAAAAAAAAA/9oADAMBAAIRAxEAPwCdABmX/9k="
                      loading="lazy"
                      onLoad={() => console.log('✅ Image loaded:', product.name)}
                      onError={() => console.error('❌ Image failed:', product.name)}
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-gray-100">
                      <Package size={48} className="text-gray-400" />
                    </div>
                  )}
                </div>

                {/* Product Info */}
                <div className="p-6">
                  <h3 className="font-bold text-gray-900 text-lg mb-2 line-clamp-2 group-hover:text-purple-600 transition-colors">
                    {product.name || 'Unnamed Product'}
                  </h3>
                  
                  {product.brand && (
                    <p className="text-gray-600 text-sm mb-3 truncate">{product.brand}</p>
                  )}

                  <div className="text-2xl font-bold text-purple-600 mb-4">
                    BDT {product.price?.toLocaleString() || '0'}
                  </div>

                  {/* Add to Cart Button */}
                  <button
                    onClick={(e) => handleAddToCart(e, product)}
                    className="w-full bg-purple-600 text-white py-3 px-4 rounded-lg hover:bg-purple-700 transition-colors duration-200 flex items-center justify-center gap-2 font-semibold"
                  >
                    <ShoppingCart size={18} />
                    Add to Cart
                  </button>
                </div>
              </motion.div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
