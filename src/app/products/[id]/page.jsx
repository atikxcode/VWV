'use client'

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Image from 'next/image';
import { motion } from 'framer-motion';
import {
  ArrowLeft,
  Package,
  Store,
  Plus,
  Minus,
  Heart,
  ShoppingCart
} from 'lucide-react';
import { useCart } from '../../../../components/hooks/useCart';
import { useFavorites } from '../../../../components/hooks/useFavorites';

export default function ProductDetailPage() {
  const params = useParams();
  const router = useRouter();
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [quantity, setQuantity] = useState(1);

  // Add cart and favorites hooks
  const { addToCart } = useCart();
  const { toggleFavorite, isFavorite } = useFavorites();

  useEffect(() => {
    const fetchProduct = async () => {
      try {
        setLoading(true);
        console.log('🔍 Fetching product with ID:', params.id);
        const response = await fetch(`/api/products?id=${params.id}`);
        
        if (!response.ok) {
          console.error('❌ Product not found:', response.status);
          router.push('/products');
          return;
        }
        
        const data = await response.json();
        console.log('🔍 Product loaded:', data.name);
        setProduct(data);
      } catch (error) {
        console.error('❌ Error fetching product:', error);
        router.push('/products');
      } finally {
        setLoading(false);
      }
    };

    if (params.id) {
      fetchProduct();
    }
  }, [params.id, router]);

  const handleAddToCart = () => {
    if (product) {
      addToCart(product, quantity);
      console.log(`✅ Added ${quantity} ${product.name} to cart!`);
    }
  };

  const handleToggleFavorite = () => {
    if (product) {
      toggleFavorite(product);
      console.log('❤️ Toggled favorite:', product.name);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 via-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-purple-500"></div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 via-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center">
          <Package size={64} className="mx-auto text-gray-400 mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Product not found</h2>
          <button
            onClick={() => router.push('/products')}
            className="px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
          >
            Back to Products
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-blue-50 to-indigo-100">
      {/* Clean Header - No Cart/Favorites Icons */}
      <header className="bg-white shadow-lg sticky top-0 z-30">
        <div className="max-w-7xl mx-auto px-4 py-6">
          <div className="flex justify-between items-center">
            <button
              onClick={() => router.push('/products')}
              className="flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors"
            >
              <ArrowLeft size={24} />
              <span className="text-lg font-semibold">Back to Products</span>
            </button>

            {/* Favorite Button in Header */}
            <button
              onClick={handleToggleFavorite}
              className="p-3 rounded-full bg-gray-100 hover:bg-gray-200 transition-colors"
            >
              <Heart
                size={24}
                className={`${
                  isFavorite(product._id) 
                    ? 'text-red-500 fill-red-500' 
                    : 'text-gray-400 hover:text-red-500'
                } transition-colors`}
              />
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
          {/* Product Images */}
          <div className="space-y-4">
            <motion.div 
              className="relative w-full h-96 bg-white rounded-2xl shadow-lg overflow-hidden"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.5 }}
            >
              {product.images && product.images.length > 0 ? (
                <Image
                  src={product.images[currentImageIndex]?.url || product.images[0].url}
                  alt={product.images[currentImageIndex]?.alt || product.name}
                  fill
                  sizes="(max-width: 1024px) 100vw, 50vw"
                  className="object-cover"
                  priority
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center bg-gray-100">
                  <Package size={64} className="text-gray-400" />
                </div>
              )}
            </motion.div>

            {/* Image Thumbnails */}
            {product.images && product.images.length > 1 && (
              <div className="flex gap-2 overflow-x-auto">
                {product.images.map((image, index) => (
                  <button
                    key={index}
                    onClick={() => setCurrentImageIndex(index)}
                    className={`relative w-20 h-20 rounded-lg overflow-hidden flex-shrink-0 ${
                      currentImageIndex === index ? 'ring-2 ring-purple-500' : ''
                    }`}
                  >
                    <Image
                      src={image.url}
                      alt={image.alt || `${product.name} image ${index + 1}`}
                      fill
                      sizes="80px"
                      className="object-cover"
                    />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Product Details */}
          <motion.div 
            className="space-y-6"
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
          >
            <div>
              <h1 className="text-4xl font-bold text-gray-900 mb-2">{product.name}</h1>
              {product.brand && (
                <p className="text-xl text-gray-600 mb-4">{product.brand}</p>
              )}
              
              <div className="flex items-center gap-4 mb-6">
                <span className="text-4xl font-bold text-purple-600">
                  BDT {product.price?.toLocaleString() || '0'}
                </span>
                {product.comparePrice && (
                  <span className="text-2xl text-gray-400 line-through">
                    BDT {product.comparePrice.toLocaleString()}
                  </span>
                )}
              </div>
            </div>

            {product.description && (
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Description</h3>
                <p className="text-gray-700 leading-relaxed">{product.description}</p>
              </div>
            )}

            {/* Product Category & Type */}
            {(product.category || product.subcategory) && (
              <div className="grid grid-cols-2 gap-4 p-4 bg-white rounded-lg shadow">
                {product.category && (
                  <div>
                    <span className="text-sm font-medium text-gray-500">Category</span>
                    <p className="text-gray-900">{product.category}</p>
                  </div>
                )}
                {product.subcategory && (
                  <div>
                    <span className="text-sm font-medium text-gray-500">Type</span>
                    <p className="text-gray-900">{product.subcategory}</p>
                  </div>
                )}
              </div>
            )}

            {/* Stock Status */}
            {product.stock && (
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Availability</h3>
                <div className="flex items-center gap-2">
                  <Store size={20} className="text-green-600" />
                  <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                    product.stock.available 
                      ? 'bg-green-100 text-green-800' 
                      : 'bg-red-100 text-red-800'
                  }`}>
                    {product.stock.available ? 'In Stock' : 'Out of Stock'}
                  </span>
                </div>
              </div>
            )}

            {/* Quantity & Add to Cart */}
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Quantity</label>
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => setQuantity(Math.max(1, quantity - 1))}
                    className="w-12 h-12 rounded-lg bg-gray-100 hover:bg-gray-200 flex items-center justify-center transition-colors"
                  >
                    <Minus size={20} />
                  </button>
                  <input
                    type="number"
                    min="1"
                    value={quantity}
                    onChange={(e) => setQuantity(Math.max(1, parseInt(e.target.value) || 1))}
                    className="w-24 text-center p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 text-lg"
                  />
                  <button
                    onClick={() => setQuantity(quantity + 1)}
                    className="w-12 h-12 rounded-lg bg-gray-100 hover:bg-gray-200 flex items-center justify-center transition-colors"
                  >
                    <Plus size={20} />
                  </button>
                </div>
              </div>

              <div className="flex gap-4">
                <button
                  onClick={handleAddToCart}
                  disabled={!product.stock?.available}
                  className={`flex-1 py-4 rounded-xl font-bold text-xl transition-all flex items-center justify-center gap-2 ${
                    product.stock?.available
                      ? 'bg-gradient-to-r from-purple-500 to-purple-600 text-white hover:from-purple-600 hover:to-purple-700 shadow-lg hover:shadow-xl'
                      : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                  }`}
                >
                  <ShoppingCart size={20} />
                  {product.stock?.available 
                    ? `Add to Cart - BDT ${(product.price * quantity).toLocaleString()}` 
                    : 'Out of Stock'
                  }
                </button>

                <button
                  onClick={handleToggleFavorite}
                  className="p-4 rounded-xl border-2 border-gray-300 hover:border-red-500 transition-colors"
                >
                  <Heart
                    size={24}
                    className={`${
                      isFavorite(product._id) 
                        ? 'text-red-500 fill-red-500' 
                        : 'text-gray-400 hover:text-red-500'
                    } transition-colors`}
                  />
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
