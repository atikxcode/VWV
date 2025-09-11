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
  ShoppingCart,
  ChevronDown
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

  // Branch specification states
  const [selectedNicotineStrength, setSelectedNicotineStrength] = useState('');
  const [selectedVgPgRatio, setSelectedVgPgRatio] = useState('');
  const [selectedColor, setSelectedColor] = useState('');

  // Add cart and favorites hooks
  const { addToCart } = useCart();
  const { toggleFavorite, isFavorite } = useFavorites();

  useEffect(() => {
    const fetchProduct = async () => {
      try {
        setLoading(true);
        const response = await fetch(`/api/products?id=${params.id}`);
        
        if (!response.ok) {
          router.push('/products');
          return;
        }
        
        const data = await response.json();
        setProduct(data);
      } catch (error) {
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
    }
  };

  const handleToggleFavorite = () => {
    if (product) {
      toggleFavorite(product);
    }
  };

  // Helper function to get all branches from stock
  const getBranches = () => {
    if (!product?.stock) {
      return [];
    }
    
    const stockKeys = Object.keys(product.stock);
    const stockKeysFiltered = stockKeys.filter(key => key.endsWith('_stock'));
    const branches = stockKeysFiltered.map(key => key.replace('_stock', ''));
    
    return branches;
  };

  // Helper function to get branch stock availability (raw stock only)
  const getBranchStockStatus = (branchName) => {
    const stockKey = `${branchName}_stock`;
    const stockValue = product?.stock?.[stockKey] || 0;
    
    return stockValue > 0;
  };

  // Helper function to check if branch has selected specification
  const branchHasSpecification = (branchName, specType, specValue) => {
    if (!product?.branchSpecifications?.[branchName]?.[specType]) return false;
    return product.branchSpecifications[branchName][specType].includes(specValue);
  };

  // Helper function to check if any specifications are selected
  const hasAnySelections = () => {
    return selectedNicotineStrength || selectedVgPgRatio || selectedColor;
  };

  // Helper function to get branch display status based on selections
  const getBranchDisplayStatus = (branchName) => {
    const hasStock = getBranchStockStatus(branchName);
    
    // If no selections made, show raw stock status only
    if (!hasAnySelections()) {
      return hasStock;
    }

    // Check if branch has all selected specifications
    let hasAllSpecs = true;
    
    if (selectedNicotineStrength && !branchHasSpecification(branchName, 'nicotineStrength', selectedNicotineStrength)) {
      hasAllSpecs = false;
    }
    
    if (selectedVgPgRatio && !branchHasSpecification(branchName, 'vgPgRatio', selectedVgPgRatio)) {
      hasAllSpecs = false;
    }
    
    if (selectedColor && !branchHasSpecification(branchName, 'colors', selectedColor)) {
      hasAllSpecs = false;
    }

    return hasStock && hasAllSpecs;
  };

  // Helper function to get unique values across all branches for a specification
  const getUniqueSpecificationValues = (specType) => {
    if (!product?.branchSpecifications) return [];
    
    const allValues = new Set();
    Object.values(product.branchSpecifications).forEach(branchSpec => {
      if (branchSpec[specType]) {
        branchSpec[specType].forEach(value => allValues.add(value));
      }
    });
    
    return Array.from(allValues);
  };

  // Helper function to check if all branches have identical single value
  const shouldShowAsText = (specType) => {
    if (!product?.branchSpecifications) return false;
    
    const branches = Object.values(product.branchSpecifications);
    if (branches.length === 0) return false;

    // Check if all branches have exactly 1 item and all items are identical
    let firstValue = null;
    
    for (const branchSpec of branches) {
      if (!branchSpec[specType] || branchSpec[specType].length !== 1) {
        return false;
      }
      
      if (firstValue === null) {
        firstValue = branchSpec[specType][0];
      } else if (branchSpec[specType][0] !== firstValue) {
        return false;
      }
    }
    
    return firstValue !== null;
  };

  // 🔧 FIXED: Helper function to get the single value for text display
  const getSingleSpecificationValue = (specType) => {
    if (!product?.branchSpecifications) return '';
    const firstBranch = Object.values(product.branchSpecifications)[0];
    return firstBranch?.[specType]?.[0] || '';
  };

  // Helper function to check if product has branch specifications
  const hasBranchSpecifications = () => {
    return product?.branchSpecifications && Object.keys(product.branchSpecifications).length > 0;
  };

  // Helper function to check if product has any specifications at all
  const hasAnySpecifications = () => {
    const nicotineOptions = getUniqueSpecificationValues('nicotineStrength');
    const vgPgOptions = getUniqueSpecificationValues('vgPgRatio');
    const colorOptions = getUniqueSpecificationValues('colors');
    
    return nicotineOptions.length > 0 || vgPgOptions.length > 0 || colorOptions.length > 0;
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

  const branches = getBranches();
  const nicotineOptions = getUniqueSpecificationValues('nicotineStrength');
  const vgPgOptions = getUniqueSpecificationValues('vgPgRatio');
  const colorOptions = getUniqueSpecificationValues('colors');

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-blue-50 to-indigo-100">
      {/* Clean Header - No Cart/Favorites Icons */}
      <header className="bg-white shadow-lg sticky top-0 z-30 mb-10">
        <div className="max-w-7xl mx-auto px-4 py-6">
          <div className="flex justify-between items-center">
            <button
              onClick={() => router.push('/products')}
              className="flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors"
            >
              <ArrowLeft size={24} />
              <span className="text-lg font-semibold">Back to Products</span>
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

            {/* Additional Product Info */}
            {(product.flavor || product.resistance || product.wattageRange) && (
              <div className="bg-white rounded-lg shadow p-4">
                <h3 className="text-lg font-semibold text-gray-900 mb-3">Specifications</h3>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  {product.flavor && (
                    <div>
                      <span className="text-sm font-medium text-gray-500">Flavor</span>
                      <p className="text-gray-900">{product.flavor}</p>
                    </div>
                  )}
                  {product.resistance && (
                    <div>
                      <span className="text-sm font-medium text-gray-500">Resistance</span>
                      <p className="text-gray-900">{product.resistance}Ω</p>
                    </div>
                  )}
                  {product.wattageRange && (
                    <div>
                      <span className="text-sm font-medium text-gray-500">Wattage</span>
                      <p className="text-gray-900">{product.wattageRange}W</p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Branch Specifications - Only show if there are actual specifications */}
            {hasBranchSpecifications() && hasAnySpecifications() && (
              <div className="bg-white rounded-lg shadow p-4">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Product Options</h3>
                <div className="space-y-4">
                  
                  {/* Nicotine Strength */}
                  {nicotineOptions.length > 0 && (
                    <div>
                      {shouldShowAsText('nicotineStrength') ? (
                        <div>
                          <span className="text-sm font-medium text-gray-500">Nicotine Strength</span>
                          <p className="text-gray-900 font-semibold">{getSingleSpecificationValue('nicotineStrength')}</p>
                        </div>
                      ) : (
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Nicotine Strength
                          </label>
                          <div className="relative">
                            <select
                              value={selectedNicotineStrength}
                              onChange={(e) => setSelectedNicotineStrength(e.target.value)}
                              className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 appearance-none bg-white"
                            >
                              <option value="">Select nicotine strength</option>
                              {nicotineOptions.map((option) => (
                                <option key={option} value={option}>
                                  {option}
                                </option>
                              ))}
                            </select>
                            <ChevronDown size={20} className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 pointer-events-none" />
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  {/* VG/PG Ratio */}
                  {vgPgOptions.length > 0 && (
                    <div>
                      {shouldShowAsText('vgPgRatio') ? (
                        <div>
                          <span className="text-sm font-medium text-gray-500">VG/PG Ratio</span>
                          <p className="text-gray-900 font-semibold">{getSingleSpecificationValue('vgPgRatio')}</p>
                        </div>
                      ) : (
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            VG/PG Ratio
                          </label>
                          <div className="relative">
                            <select
                              value={selectedVgPgRatio}
                              onChange={(e) => setSelectedVgPgRatio(e.target.value)}
                              className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 appearance-none bg-white"
                            >
                              <option value="">Select VG/PG ratio</option>
                              {vgPgOptions.map((option) => (
                                <option key={option} value={option}>
                                  {option}
                                </option>
                              ))}
                            </select>
                            <ChevronDown size={20} className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 pointer-events-none" />
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Colors */}
                  {colorOptions.length > 0 && (
                    <div>
                      {shouldShowAsText('colors') ? (
                        <div>
                          <span className="text-sm font-medium text-gray-500">Color</span>
                          <p className="text-gray-900 font-semibold capitalize">{getSingleSpecificationValue('colors')}</p>
                        </div>
                      ) : (
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Color
                          </label>
                          <div className="relative">
                            <select
                              value={selectedColor}
                              onChange={(e) => setSelectedColor(e.target.value)}
                              className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 appearance-none bg-white"
                            >
                              <option value="">Select color</option>
                              {colorOptions.map((option) => (
                                <option key={option} value={option}>
                                  {option.charAt(0).toUpperCase() + option.slice(1)}
                                </option>
                              ))}
                            </select>
                            <ChevronDown size={20} className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 pointer-events-none" />
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Outlet Wise Stock Status - Always show if branches exist */}
            {branches.length > 0 && (
              <div className="bg-white rounded-lg shadow p-4">
                <h3 className="text-lg font-semibold text-gray-900 mb-3">Outlet Wise Stock:</h3>
                <div className="space-y-2">
                  {branches.map((branch) => {
                    const isAvailable = hasBranchSpecifications() ? getBranchDisplayStatus(branch) : getBranchStockStatus(branch);
                    
                    return (
                      <div key={branch} className="flex items-center gap-3">
                        <Store size={18} className={isAvailable ? "text-green-600" : "text-red-600"} />
                        <span className="font-medium text-gray-900 uppercase">
                          {branch.toUpperCase()}:
                        </span>
                        <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                          isAvailable 
                            ? 'bg-green-100 text-green-800' 
                            : 'bg-red-100 text-red-800'
                        }`}>
                          {isAvailable ? 'In Stock' : 'Out of Stock'}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Fallback - if no stock data at all */}
            {branches.length === 0 && product.stock && product.stock.available !== undefined && (
              <div className="bg-white rounded-lg shadow p-4">
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
                  disabled={branches.length > 0 ? !branches.some(branch => hasBranchSpecifications() ? getBranchDisplayStatus(branch) : getBranchStockStatus(branch)) : !product.stock?.available}
                  className={`flex-1 py-4 rounded-xl font-bold text-xl transition-all flex items-center justify-center gap-2 ${
                    (branches.length > 0 ? branches.some(branch => hasBranchSpecifications() ? getBranchDisplayStatus(branch) : getBranchStockStatus(branch)) : product.stock?.available)
                      ? 'bg-gradient-to-r from-purple-500 to-purple-600 text-white hover:from-purple-600 hover:to-purple-700 shadow-lg hover:shadow-xl'
                      : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                  }`}
                >
                  <ShoppingCart size={20} />
                  {(branches.length > 0 ? branches.some(branch => hasBranchSpecifications() ? getBranchDisplayStatus(branch) : getBranchStockStatus(branch)) : product.stock?.available)
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
