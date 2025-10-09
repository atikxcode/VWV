'use client'

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Image from 'next/image';
import { motion } from 'framer-motion';
import Swal from 'sweetalert2';
import {
  ArrowLeft,
  Package,
  Store,
  Plus,
  Minus,
  Heart,
  ShoppingCart,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Zap,
  Droplets,
  Clock,
  Battery,
  Settings,
  Star,
  Gift,
  AlertCircle,
  Lock
} from 'lucide-react';
import { useCart } from '../../../../components/hooks/useCart';
import { useFavorites } from '../../../../components/hooks/useFavorites';
import Loading from '../../../../components/Loading';

export default function ProductDetailPage() {
  const params = useParams();
  const router = useRouter();
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [quantity, setQuantity] = useState(1);
  const [imageLoadErrors, setImageLoadErrors] = useState({});

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

        // 🔥 CRITICAL DEBUG: Log the actual product data structure
        console.log('🔍 FETCHED PRODUCT DATA:');
        console.log('Product:', data);
        console.log('Branch specs:', data.branchSpecifications);
        console.log('Stock:', data.stock);
        
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

  // 🔥 CRITICAL DEBUG: Add case sensitivity debug
  useEffect(() => {
    if (product) {
      console.log('🔥 CASE SENSITIVITY DEBUG:');
      console.log('🔥 Branches from getBranches():', getBranches());
      console.log('🔥 BranchSpecifications keys:', Object.keys(product.branchSpecifications || {}));
      console.log('🔥 Stock keys:', Object.keys(product.stock || {}));
      
      // Check exact case matching
      getBranches().forEach(branch => {
        console.log(`🔥 Branch "${branch}" specifications:`, product.branchSpecifications?.[branch]);
        console.log(`🔥 Branch "${branch}" stock:`, product.stock?.[`${branch}_stock`]);
      });
    }
  }, [product]);

  // 🔥 ENHANCED: Get branches with stock for selected specifications with case sensitivity handling
  const getAvailableBranchesForSelection = () => {
    console.log('🔥 === DEBUGGING getAvailableBranchesForSelection ===');
    console.log('🔥 Product:', product?.name);
    console.log('🔥 Selected Nicotine:', selectedNicotineStrength);
    console.log('🔥 Selected VG/PG:', selectedVgPgRatio);
    console.log('🔥 Selected Color:', selectedColor);
    console.log('🔥 Product branchSpecifications:', product?.branchSpecifications);

    if (!product?.branchSpecifications) {
      console.log('🔥 NO BRANCH SPECIFICATIONS - returning branches with stock');
      const branches = getBranches();
      const result = branches.filter(branch => getBranchStockStatus(branch));
      console.log('🔥 Result (no spec):', result);
      return result;
    }
    
    const branches = getBranches();
    console.log('🔥 All branches:', branches);
    
    const result = branches.filter(branch => {
      console.log(`\n🔥 Checking branch: ${branch.toUpperCase()}`);
      
      // First check if branch has stock
      const hasStock = getBranchStockStatus(branch);
      console.log(`🔥   Has stock: ${hasStock}`);
      if (!hasStock) {
        console.log(`🔥   ❌ EXCLUDED: No stock`);
        return false;
      }

      // If no selections are made, return all branches with stock
      if (!hasAnySelections()) {
        console.log(`🔥   ✅ INCLUDED: No selections made`);
        return true;
      }

      // 🔥 CASE-INSENSITIVE BRANCH SPECIFICATION LOOKUP
        // 🔥 FIXED: CASE-INSENSITIVE BRANCH SPECIFICATION LOOKUP
      const branchSpec = product.branchSpecifications[branch] || 
                        product.branchSpecifications[branch.toLowerCase()] ||
                        product.branchSpecifications[branch.toUpperCase()] ||
                        product.branchSpecifications[branch.charAt(0).toUpperCase() + branch.slice(1).toLowerCase()] ||
                        product.branchSpecifications[branch.charAt(0).toLowerCase() + branch.slice(1).toLowerCase()]

      console.log(`🔥 CASE DEBUG - Branch: ${branch}`)
      console.log(`🔥 Available keys:`, Object.keys(product.branchSpecifications))
      console.log(`🔥 Found branchSpec:`, branchSpec)

      // Check nicotine
      if (selectedNicotineStrength) {
        const branchNicotineSpecs = branchSpec?.nicotineStrength;
        const hasNicotineSpec = branchNicotineSpecs && branchNicotineSpecs.includes(selectedNicotineStrength);
        const noNicotineSpec = !branchNicotineSpecs;
        
        console.log(`🔥   Nicotine check:`);
        console.log(`🔥     Branch nicotine specs:`, branchNicotineSpecs);
        console.log(`🔥     Has nicotine spec:`, hasNicotineSpec);
        console.log(`🔥     No nicotine spec (should include):`, noNicotineSpec);
        
        if (branchNicotineSpecs && !branchNicotineSpecs.includes(selectedNicotineStrength)) {
          console.log(`🔥   ❌ EXCLUDED: Nicotine mismatch`);
          return false;
        }
      }
      
      // Check VG/PG
      if (selectedVgPgRatio) {
        const branchVgPgSpecs = branchSpec?.vgPgRatio;
        const hasVgPgSpec = branchVgPgSpecs && branchVgPgSpecs.includes(selectedVgPgRatio);
        const noVgPgSpec = !branchVgPgSpecs;
        
        console.log(`🔥   VG/PG check:`);
        console.log(`🔥     Branch VG/PG specs:`, branchVgPgSpecs);
        console.log(`🔥     Has VG/PG spec:`, hasVgPgSpec);
        console.log(`🔥     No VG/PG spec (should include):`, noVgPgSpec);
        
        if (branchVgPgSpecs && !branchVgPgSpecs.includes(selectedVgPgRatio)) {
          console.log(`🔥   ❌ EXCLUDED: VG/PG mismatch`);
          return false;
        }
      }
      
      // Check color
      if (selectedColor) {
        const branchColorSpecs = branchSpec?.colors;
        const hasColorSpec = branchColorSpecs && branchColorSpecs.includes(selectedColor);
        const noColorSpec = !branchColorSpecs;
        
        console.log(`🔥   Color check:`);
        console.log(`🔥     Branch color specs:`, branchColorSpecs);
        console.log(`🔥     Has color spec:`, hasColorSpec);
        console.log(`🔥     No color spec (should include):`, noColorSpec);
        
        if (branchColorSpecs && !branchColorSpecs.includes(selectedColor)) {
          console.log(`🔥   ❌ EXCLUDED: Color mismatch`);
          return false;
        }
      }

      console.log(`🔥   ✅ INCLUDED: All checks passed`);
      return true;
    });

    console.log('🔥 FINAL RESULT:', result);
    console.log('🔥 Expected result: ["bashundhara", "mirpur"]');
    console.log('🔥 === END DEBUGGING ===\n');
    return result;
  };

  // Check if user must select specifications
  const mustSelectSpecifications = () => {
    if (!hasBranchSpecifications() || !hasAnySpecifications()) return false;
    
    const nicotineOptions = getUniqueSpecificationValues('nicotineStrength');
    const vgPgOptions = getUniqueSpecificationValues('vgPgRatio');  
    const colorOptions = getUniqueSpecificationValues('colors');

    // If any specification has multiple options, user must select
    const needsNicotineSelection = nicotineOptions.length > 1 && !shouldShowAsText('nicotineStrength');
    const needsVgPgSelection = vgPgOptions.length > 1 && !shouldShowAsText('vgPgRatio');
    const needsColorSelection = colorOptions.length > 1 && !shouldShowAsText('colors');

    return needsNicotineSelection || needsVgPgSelection || needsColorSelection;
  };

  // Validate required selections
  const validateSelections = () => {
    const nicotineOptions = getUniqueSpecificationValues('nicotineStrength');
    const vgPgOptions = getUniqueSpecificationValues('vgPgRatio');
    const colorOptions = getUniqueSpecificationValues('colors');

    const errors = [];

    if (nicotineOptions.length > 1 && !shouldShowAsText('nicotineStrength') && !selectedNicotineStrength) {
      errors.push('Nicotine Strength');
    }
    if (vgPgOptions.length > 1 && !shouldShowAsText('vgPgRatio') && !selectedVgPgRatio) {
      errors.push('VG/PG Ratio');
    }
    if (colorOptions.length > 1 && !shouldShowAsText('colors') && !selectedColor) {
      errors.push('Color');
    }

    return errors;
  };

  // Check if all required selections are made
  const areAllRequiredSelectionsMade = () => {
    if (!mustSelectSpecifications()) return true; // No selections required
    
    const missingSelections = validateSelections();
    return missingSelections.length === 0;
  };

  // Check if button should be enabled
  const isAddToCartEnabled = () => {
    // Check if there's stock available
    const hasStock = branches.length > 0 ? branches.some(branch => getBranchStockStatus(branch)) : product?.stock?.available;
    
    // Check if all required selections are made
    const allSelectionsMade = areAllRequiredSelectionsMade();
    
    // Check if there are available branches for current selection
    const hasAvailableBranches = getAvailableBranchesForSelection().length > 0;
    
    return hasStock && allSelectionsMade && hasAvailableBranches;
  };

  // 🆕 UPDATED: Simplified button text - always shows "Add To Cart"
  const getButtonText = () => {
    const hasStock = branches.length > 0 ? branches.some(branch => getBranchStockStatus(branch)) : product?.stock?.available;
    
    if (!hasStock) {
      return 'Out of Stock';
    }
    
    return 'Add To Cart';
  };

  // 🆕 NEW: Get tooltip message for disabled button
  const getTooltipMessage = () => {
    const hasStock = branches.length > 0 ? branches.some(branch => getBranchStockStatus(branch)) : product?.stock?.available;
    
    if (!hasStock) {
      return 'This product is currently out of stock';
    }
    
    if (!areAllRequiredSelectionsMade()) {
      return 'Please select all the product specifications';
    }
    
    if (getAvailableBranchesForSelection().length === 0) {
      return 'Not available with your selected options';
    }
    
    return '';
  };

  // 🔥 ENHANCED: Updated handleAddToCart function with comprehensive debugging
  const handleAddToCart = () => {
    if (!product || !isAddToCartEnabled()) return;

    const selectedOptions = {};
    
    if (selectedNicotineStrength) {
      selectedOptions.nicotineStrength = selectedNicotineStrength;
    }
    if (selectedVgPgRatio) {
      selectedOptions.vgPgRatio = selectedVgPgRatio;
    }
    if (selectedColor) {
      selectedOptions.color = selectedColor;
    }

    // Get filtered branches
    const availableBranches = getAvailableBranchesForSelection();
    console.log('\n🎯 Final available branches:', availableBranches);
    console.log('🔍 Expected branches: ["bashundhara", "mirpur"]');

    // Pass the filtered branch names to cart
    addToCart(product, quantity, selectedOptions, availableBranches);
    
    Swal.fire({
      title: 'Added to Cart!',
      text: `${product.name} added successfully`,
      icon: 'success',
      confirmButtonText: 'OK',
      confirmButtonColor: '#8b5cf6',
      timer: 2000,
      showConfirmButton: false,
      toast: true,
      position: 'top-end',
      timerProgressBar: true,
    });
  };

  const handleToggleFavorite = () => {
    if (product) {
      toggleFavorite(product);
    }
  };

  // Handle image load errors
  const handleImageError = (imageIndex) => {
    setImageLoadErrors(prev => ({
      ...prev,
      [imageIndex]: true
    }));
  };

  // Helper functions (keeping all existing helper functions)
  const getBranches = () => {
    if (!product?.stock) {
      return [];
    }
    
    const stockKeys = Object.keys(product.stock);
    const stockKeysFiltered = stockKeys.filter(key => key.endsWith('_stock'));
    const branches = stockKeysFiltered.map(key => key.replace('_stock', ''));
    
    return branches;
  };

  const getBranchStockStatus = (branchName) => {
    const stockKey = `${branchName}_stock`;
    const stockValue = product?.stock?.[stockKey] || 0;
    
    return stockValue > 0;
  };

  // 🔥 ENHANCED: Updated branchHasSpecification function with case sensitivity
  const branchHasSpecification = (branchName, specType, specValue) => {
    // Try different case variations to find branch specifications
    const branchSpec = product?.branchSpecifications?.[branchName] ||
                      product?.branchSpecifications?.[branchName.toLowerCase()] ||
                      product?.branchSpecifications?.[branchName.toUpperCase()] ||
                      product?.branchSpecifications?.[branchName.charAt(0).toUpperCase() + branchName.slice(1)];

    if (!branchSpec?.[specType]) {
      // If branch doesn't have this spec type defined, it supports all values
      return true;
    }
    return branchSpec[specType].includes(specValue);
  };

  const hasAnySelections = () => {
    return selectedNicotineStrength || selectedVgPgRatio || selectedColor;
  };

  const getBranchDisplayStatus = (branchName) => {
    const hasStock = getBranchStockStatus(branchName);
    
    if (!hasAnySelections()) {
      return hasStock;
    }

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

  // 🔥 ENHANCED: Case-insensitive specification values extraction
  const getUniqueSpecificationValues = (specType) => {
    if (!product?.branchSpecifications) return [];
    
    const allValues = new Set();
    
    // Check all possible case variations of branch names
    Object.keys(product.branchSpecifications).forEach(branchName => {
      const branchSpec = product.branchSpecifications[branchName];
      if (branchSpec[specType]) {
        branchSpec[specType].forEach(value => allValues.add(value));
      }
    });
    
    return Array.from(allValues);
  };

  const shouldShowAsText = (specType) => {
    if (!product?.branchSpecifications) return false;
    
    const branches = Object.values(product.branchSpecifications);
    if (branches.length === 0) return false;

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

  const getSingleSpecificationValue = (specType) => {
    if (!product?.branchSpecifications) return '';
    const firstBranch = Object.values(product.branchSpecifications)[0];
    return firstBranch?.[specType]?.[0] || '';
  };

  const hasBranchSpecifications = () => {
    return product?.branchSpecifications && Object.keys(product.branchSpecifications).length > 0;
  };

  const hasAnySpecifications = () => {
    const nicotineOptions = getUniqueSpecificationValues('nicotineStrength');
    const vgPgOptions = getUniqueSpecificationValues('vgPgRatio');
    const colorOptions = getUniqueSpecificationValues('colors');
    
    return nicotineOptions.length > 0 || vgPgOptions.length > 0 || colorOptions.length > 0;
  };

  // Function to get technical specifications (excluding features and eachSetContains)
  const getAvailableSpecifications = () => {
    if (!product) return [];
    
    const specifications = [];
    
    // Define specification mapping with icons and labels - EXCLUDING features and eachSetContains
    const specificationMap = {
      flavor: { label: 'Flavor', icon: Droplets, color: 'text-blue-500' },
      resistance: { label: 'Resistance', icon: Zap, color: 'text-yellow-500', unit: 'Ω' },
      wattageRange: { label: 'Wattage Range', icon: Battery, color: 'text-green-500', unit: 'W' },
      bottleSizes: { label: 'Bottle Size', icon: Package, color: 'text-purple-500' },
      bottleType: { label: 'Bottle Type', icon: Package, color: 'text-indigo-500' },
      unit: { label: 'Unit', icon: Settings, color: 'text-gray-500' },
      puffs: { label: 'Puffs', icon: Droplets, color: 'text-pink-500' },
      coil: { label: 'Coil Type', icon: Settings, color: 'text-orange-500' },
      volume: { label: 'Volume', icon: Droplets, color: 'text-cyan-500' },
      charging: { label: 'Charging', icon: Battery, color: 'text-green-600' },
      chargingTime: { label: 'Charging Time', icon: Clock, color: 'text-red-500' }
    };

    // Check each specification field (EXCLUDING features and eachSetContains)
    Object.entries(specificationMap).forEach(([key, config]) => {
      if (product[key] && product[key].toString().trim() !== '') {
        specifications.push({
          key,
          label: config.label,
          value: product[key],
          icon: config.icon,
          color: config.color,
          unit: config.unit || ''
        });
      }
    });

    return specifications;
  };

  // Navigation functions for image carousel
  const goToPrevious = () => {
    setCurrentImageIndex((prevIndex) => 
      prevIndex === 0 ? product.images.length - 1 : prevIndex - 1
    );
  };

  const goToNext = () => {
    setCurrentImageIndex((prevIndex) => 
      prevIndex === product.images.length - 1 ? 0 : prevIndex + 1
    );
  };

  if (loading) {
    return <Loading />;
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
  const availableSpecs = getAvailableSpecifications();

  // Check if we have multiple images
  const hasMultipleImages = product.images && product.images.length > 1;

  // Check button state
  const buttonEnabled = isAddToCartEnabled();
  const buttonText = getButtonText();

  return (
    <div className="min-h-screen">
      {/* Clean Header */}
      <header className="bg-purple-50 shadow-lg sticky top-0 z-0 mb-10">
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
          {/* Left Side - Product Images + Features + Each Set Contains */}
          <div className="space-y-6">
            {/* Main Image with Navigation */}
            <motion.div 
              className="relative w-full h-[40rem] bg-gray-50 rounded-2xl shadow-lg overflow-hidden group"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.5 }}
            >
              {product.images && product.images.length > 0 && !imageLoadErrors[currentImageIndex] ? (
                <>
                  <Image
                    src={product.images[currentImageIndex]?.url || product.images[0].url}
                    alt={product.images[currentImageIndex]?.alt || product.name}
                    fill
                    sizes="(max-width: 1024px) 100vw, 50vw"
                    className="object-cover"
                    priority
                    onError={() => handleImageError(currentImageIndex)}
                    unoptimized={true}
                  />
                  
                  {/* Navigation Arrows - Only show if multiple images */}
                  {hasMultipleImages && (
                    <>
                      <button
                        onClick={goToPrevious}
                        className="absolute left-4 top-1/2 transform -translate-y-1/2 w-12 h-12 bg-purple-400 bg-opacity-50 hover:bg-opacity-70 text-white rounded-full flex items-center justify-center transition-all opacity-0 group-hover:opacity-100 backdrop-blur-sm z-10"
                        aria-label="Previous image"
                      >
                        <ChevronLeft size={24} />
                      </button>
                      
                      <button
                        onClick={goToNext}
                        className="absolute right-4 top-1/2 transform -translate-y-1/2 w-12 h-12 bg-purple-400 bg-opacity-50 hover:bg-opacity-70 text-white rounded-full flex items-center justify-center transition-all opacity-0 group-hover:opacity-100 backdrop-blur-sm z-10"
                        aria-label="Next image"
                      >
                        <ChevronRight size={24} />
                      </button>
                    </>
                  )}

                  {/* Image Counter - Only show if multiple images */}
                  {hasMultipleImages && (
                    <div className="absolute bottom-4 right-4 bg-purple-400 bg-opacity-60 text-white px-3 py-1 rounded-full text-sm backdrop-blur-sm z-10">
                      {currentImageIndex + 1} / {product.images.length}
                    </div>
                  )}
                </>
              ) : (
                <div className="w-full h-full flex items-center justify-center bg-gray-100">
                  <Package size={64} className="text-gray-400" />
                </div>
              )}
            </motion.div>

            {/* Beautiful Image Carousel - Only show if multiple images */}
            {hasMultipleImages && (
              <motion.div 
                className="space-y-4"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.3 }}
              >
                {/* Header */}
                <div className="flex items-center justify-between">
                  <h4 className="text-lg font-semibold text-gray-800">Product Gallery</h4>
                  <span className="text-sm text-purple-600 bg-purple-50 px-3 py-1 rounded-full">
                    {product.images.length} images
                  </span>
                </div>

                {/* Scrollable Thumbnail Carousel */}
                <div className="pb-4">
                  <div className="flex gap-3 min-w-max">
                    {product.images.map((image, index) => (
                      <motion.button
                        key={index}
                        onClick={() => setCurrentImageIndex(index)}
                        className={`relative flex-shrink-0 w-20 h-20 rounded-xl overflow-hidden transition-all duration-300 border-2 bg-gray-50 ${
                          currentImageIndex === index 
                            ? 'border-purple-500 shadow-lg transform scale-110' 
                            : 'border-gray-200 hover:border-purple-300 hover:shadow-md hover:scale-105'
                        }`}
                        whileHover={{ scale: currentImageIndex === index ? 1.1 : 1.05 }}
                        whileTap={{ scale: 0.95 }}
                      >
                        {!imageLoadErrors[index] ? (
                          <Image
                            src={image.url}
                            alt={image.alt || `${product.name} view ${index + 1}`}
                            fill
                            sizes="80px"
                            className="object-cover p-1"
                            onError={() => handleImageError(index)}
                            unoptimized={true}
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center bg-gray-100">
                            <Package size={24} className="text-gray-400" />
                          </div>
                        )}
                        
                        {/* Active Overlay */}
                        {currentImageIndex === index && (
                          <div className="absolute inset-0 bg-opacity-10 flex items-center justify-center">
                            <div className="rounded-full shadow-lg"></div>
                          </div>
                        )}
                        
                        {/* Hover Overlay */}
                        <div className="absolute inset-0 bg-opacity-0 hover:bg-opacity-5 transition-all duration-200"></div>
                      </motion.button>
                    ))}
                  </div>
                </div>

                {/* Navigation Dots */}
                <div className="flex justify-center gap-2 pt-2">
                  {product.images.slice(0, Math.min(product.images.length, 10)).map((_, index) => (
                    <button
                      key={index}
                      onClick={() => setCurrentImageIndex(index)}
                      className={`w-2 h-2 rounded-full transition-all duration-300 ${
                        currentImageIndex === index 
                          ? 'bg-purple-600 w-6' 
                          : 'bg-gray-300 hover:bg-purple-400'
                      }`}
                      aria-label={`Go to image ${index + 1}`}
                    />
                  ))}
                  {product.images.length > 10 && (
                    <span className="text-xs text-gray-500 ml-2">
                      +{product.images.length - 10} more
                    </span>
                  )}
                </div>
              </motion.div>
            )}

            {/* Features Section - On the left side */}
            {product.features && Array.isArray(product.features) && product.features.length > 0 && (
              <motion.div 
                className="bg-white rounded-lg shadow p-6"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.4 }}
              >
                <h3 className="text-xl font-semibold text-gray-900 mb-4 flex items-center gap-2">
                  Features
                </h3>
                <div className="space-y-2">
                  {product.features.map((feature, index) => (
                    <div key={index} className="flex items-center gap-3 p-2 bg-amber-50 rounded-lg">
                      <span className="text-gray-800 font-medium">{feature}</span>
                    </div>
                  ))}
                </div>
              </motion.div>
            )}

            {/* Each Set Contains Section - On the left side */}
            {product.eachSetContains && Array.isArray(product.eachSetContains) && product.eachSetContains.length > 0 && (
              <motion.div 
                className="bg-white rounded-lg shadow p-6"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.5 }}
              >
                <h3 className="text-xl font-semibold text-gray-900 mb-4 flex items-center gap-2">
                  Each Set Contains
                </h3>
                <div className="space-y-2">
                  {product.eachSetContains.map((item, index) => (
                    <div key={index} className="flex items-start gap-3 p-3 bg-amber-50 rounded-lg">
                      <span className="text-gray-600 font-bold text-sm mt-0.5 flex-shrink-0">
                        {index + 1}.
                      </span>
                      <span className="text-gray-800 font-medium">{item}</span>
                    </div>
                  ))}
                </div>
              </motion.div>
            )}
          </div>

          {/* Right Side - Product Details */}
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

            {/* Technical Specifications Section (excluding features and eachSetContains) */}
            {availableSpecs.length > 0 && (
              <div className="bg-white rounded-lg shadow p-6">
                <h3 className="text-xl font-semibold text-gray-900 mb-4 flex items-center gap-2">
                  <Settings size={20} className="text-purple-600" />
                  Specifications
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {availableSpecs.map((spec) => {
                    const IconComponent = spec.icon;
                    return (
                      <div key={spec.key} className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
                        <IconComponent size={18} className={`${spec.color} mt-0.5 flex-shrink-0`} />
                        <div className="flex-1 min-w-0">
                          <span className="text-sm font-medium text-gray-500 block">
                            {spec.label}
                          </span>
                          <p className="text-gray-900 font-semibold break-words">
                            {spec.value}{spec.unit && ` ${spec.unit}`}
                          </p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Branch Specifications with Required Warning */}
            {hasBranchSpecifications() && hasAnySpecifications() && (
              <div className="bg-white rounded-lg shadow p-4">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-gray-900">Product Options</h3>
                  {mustSelectSpecifications() && (
                    <div className="flex items-center gap-1 text-red-600 text-sm">
                      <AlertCircle size={16} />
                      <span>Required</span>
                    </div>
                  )}
                </div>
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
                            {nicotineOptions.length > 1 && (
                              <span className="text-red-500 ml-1">*</span>
                            )}
                          </label>
                          <div className="relative">
                            <select
                              value={selectedNicotineStrength}
                              onChange={(e) => setSelectedNicotineStrength(e.target.value)}
                              className={`w-full p-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 appearance-none bg-white ${
                                mustSelectSpecifications() && !selectedNicotineStrength && nicotineOptions.length > 1
                                  ? 'border-red-300' 
                                  : 'border-gray-300'
                              }`}
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
                            {vgPgOptions.length > 1 && (
                              <span className="text-red-500 ml-1">*</span>
                            )}
                          </label>
                          <div className="relative">
                            <select
                              value={selectedVgPgRatio}
                              onChange={(e) => setSelectedVgPgRatio(e.target.value)}
                              className={`w-full p-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 appearance-none bg-white ${
                                mustSelectSpecifications() && !selectedVgPgRatio && vgPgOptions.length > 1
                                  ? 'border-red-300' 
                                  : 'border-gray-300'
                              }`}
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
                            {colorOptions.length > 1 && (
                              <span className="text-red-500 ml-1">*</span>
                            )}
                          </label>
                          <div className="relative">
                            <select
                              value={selectedColor}
                              onChange={(e) => setSelectedColor(e.target.value)}
                              className={`w-full p-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 appearance-none bg-white ${
                                mustSelectSpecifications() && !selectedColor && colorOptions.length > 1
                                  ? 'border-red-300' 
                                  : 'border-gray-300'
                              }`}
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

            {/* Outlet Wise Stock Status */}
            {branches.length > 0 && (
              <div className="bg-white rounded-lg shadow p-4">
                <h3 className="text-lg font-semibold text-gray-900 mb-3">Outlet Wise Stock:</h3>
                <div className="space-y-2">
                  {branches.map((branch) => {
                    const isAvailable = hasBranchSpecifications() ? getBranchDisplayStatus(branch) : getBranchStockStatus(branch);
                    
                    return (
                      <div key={branch} className="flex items-center gap-3">
                        <Store size={18} className={isAvailable ? "text-purple-600" : "text-red-600"} />
                        <span className="font-medium text-gray-900 uppercase">
                          {branch.toUpperCase()}:
                        </span>
                        <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                          isAvailable 
                            ? 'bg-purple-400 text-white' 
                            : 'bg-red-400 text-black'
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
                {/* 🆕 UPDATED: Add to Cart Button with Tooltip */}
                <div className="flex-1 relative group">
                  <button
                    onClick={handleAddToCart}
                    disabled={!buttonEnabled}
                    className={`w-full py-4 rounded-xl font-bold text-xl transition-all flex items-center justify-center gap-2 ${
                      buttonEnabled
                        ? 'bg-gradient-to-r from-purple-500 to-purple-600 text-white hover:from-purple-600 hover:to-purple-700 shadow-lg hover:shadow-xl'
                        : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                    }`}
                  >
                    {buttonEnabled ? (
                      <>
                        <ShoppingCart size={20} />
                        {`${buttonText} - BDT ${(product.price * quantity).toLocaleString()}`}
                      </>
                    ) : (
                      <>
                        <Lock size={20} />
                        {buttonText}
                      </>
                    )}
                  </button>

                  {/* 🆕 NEW: Tooltip for disabled button */}
                  {!buttonEnabled && getTooltipMessage() && (
                    <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-2 bg-gray-800 text-white text-sm rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200 whitespace-nowrap z-50 pointer-events-none">
                      {getTooltipMessage()}
                      {/* Tooltip Arrow */}
                      <div className="absolute top-full left-1/2 transform -translate-x-1/2 border-4 border-transparent border-t-gray-800"></div>
                    </div>
                  )}
                </div>

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

      {/* Custom CSS for hiding scrollbars */}
      <style jsx global>{`
        .scrollbar-hide {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
        .scrollbar-hide::-webkit-scrollbar {
          display: none;
        }
      `}</style>
    </div>
  );
}