'use client'

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useRouter, useSearchParams, usePathname } from 'next/navigation';
import Image from 'next/image';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Package, 
  Heart, 
  ShoppingCart, 
  ChevronLeft, 
  ChevronRight,
  Search,
  Loader2,
  Filter,
  X
} from 'lucide-react';
import { Suspense } from 'react';
import { useCart } from '../../../components/hooks/useCart';
import { useFavorites } from '../../../components/hooks/useFavorites';
import Loading from '../../../components/Loading';

// Enterprise-level configuration
const PRODUCTS_PER_PAGE = 12;
const DEFAULT_MIN_PRICE = 0;
const FALLBACK_MAX_PRICE = 10000; // Fallback if no products found

// Price Range Slider Component with dynamic bounds
const PriceRangeSlider = React.memo(({ 
  minPrice, 
  maxPrice, 
  onRangeChange, 
  minValue = DEFAULT_MIN_PRICE, 
  maxValue = FALLBACK_MAX_PRICE 
}) => {
  const [localMinPrice, setLocalMinPrice] = useState(minPrice || DEFAULT_MIN_PRICE);
  const [localMaxPrice, setLocalMaxPrice] = useState(maxPrice || maxValue);
  const [isDragging, setIsDragging] = useState(false);

  useEffect(() => {
    setLocalMinPrice(minPrice || DEFAULT_MIN_PRICE);
    setLocalMaxPrice(maxPrice || maxValue);
  }, [minPrice, maxPrice, maxValue]);

  const handleMinChange = useCallback((e) => {
    const value = parseInt(e.target.value) || minValue;
    if (value >= minValue && value <= (localMaxPrice - 100)) {
      setLocalMinPrice(value);
      setIsDragging(true);
    }
  }, [localMaxPrice, minValue]);

  const handleMaxChange = useCallback((e) => {
    const value = parseInt(e.target.value) || maxValue;
    if (value <= maxValue && value >= (localMinPrice + 100)) {
      setLocalMaxPrice(value);
      setIsDragging(true);
    }
  }, [localMinPrice, maxValue]);

  const handleMouseUp = useCallback(() => {
    if (isDragging) {
      setIsDragging(false);
      onRangeChange([localMinPrice, localMaxPrice]);
    }
  }, [isDragging, localMinPrice, localMaxPrice, onRangeChange]);

  const handleInputChange = useCallback((type, value) => {
    const numValue = parseInt(value) || 0;
    if (type === 'min') {
      if (numValue >= minValue && numValue <= (localMaxPrice - 100)) {
        setLocalMinPrice(numValue);
        onRangeChange([numValue, localMaxPrice]);
      }
    } else {
      if (numValue <= maxValue && numValue >= (localMinPrice + 100)) {
        setLocalMaxPrice(numValue);
        onRangeChange([localMinPrice, numValue]);
      }
    }
  }, [localMinPrice, localMaxPrice, minValue, maxValue, onRangeChange]);

  const minPercent = useMemo(() => {
    const range = maxValue - minValue;
    return range > 0 ? ((localMinPrice - minValue) / range) * 100 : 0;
  }, [localMinPrice, minValue, maxValue]);
  
  const maxPercent = useMemo(() => {
    const range = maxValue - minValue;
    return range > 0 ? ((localMaxPrice - minValue) / range) * 100 : 100;
  }, [localMaxPrice, minValue, maxValue]);

  return (
    <div className="w-full">
      <div className="mb-4">
        <div className="flex justify-between items-center mb-2">
          <span className="text-sm font-medium text-gray-700">Price Range</span>
          <span className="text-sm text-gray-500">
            BDT {(localMinPrice || 0).toLocaleString()} - BDT {(localMaxPrice || 0).toLocaleString()}
          </span>
        </div>
        
        <div className="text-xs text-gray-400 mb-2">
          Available range: BDT {minValue.toLocaleString()} - BDT {maxValue.toLocaleString()}
        </div>
        
        {/* Dual Range Slider */}
        <div className="relative h-6 mb-4">
          <div className="absolute w-full h-2 bg-gray-200 rounded top-2"></div>
          <div 
            className="absolute h-2 bg-purple-500 rounded top-2"
            style={{
              left: `${Math.max(0, minPercent)}%`,
              width: `${Math.max(0, maxPercent - minPercent)}%`
            }}
          ></div>
          
          <input
            type="range"
            min={minValue}
            max={maxValue}
            value={localMinPrice}
            onChange={handleMinChange}
            onMouseUp={handleMouseUp}
            onTouchEnd={handleMouseUp}
            className="absolute w-full h-6 bg-transparent appearance-none cursor-pointer slider-thumb"
            style={{ zIndex: 1 }}
          />
          
          <input
            type="range"
            min={minValue}
            max={maxValue}
            value={localMaxPrice}
            onChange={handleMaxChange}
            onMouseUp={handleMouseUp}
            onTouchEnd={handleMouseUp}
            className="absolute w-full h-6 bg-transparent appearance-none cursor-pointer slider-thumb"
            style={{ zIndex: 2 }}
          />
        </div>

        {/* Input Fields */}
        <div className="flex items-center space-x-2">
          <div className="flex-1">
            <label className="block text-xs text-gray-500 mb-1">Min Price</label>
            <input
              type="number"
              value={localMinPrice || 0}
              onChange={(e) => handleInputChange('min', e.target.value)}
              className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:ring-1 focus:ring-purple-500 focus:border-transparent outline-none"
              min={minValue}
              max={maxValue}
            />
          </div>
          <div className="flex-shrink-0 mt-4">
            <span className="text-gray-400">-</span>
          </div>
          <div className="flex-1">
            <label className="block text-xs text-gray-500 mb-1">Max Price</label>
            <input
              type="number"
              value={localMaxPrice || 0}
              onChange={(e) => handleInputChange('max', e.target.value)}
              className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:ring-1 focus:ring-purple-500 focus:border-transparent outline-none"
              min={minValue}
              max={maxValue}
            />
          </div>
        </div>
      </div>
    </div>
  );
});

PriceRangeSlider.displayName = 'PriceRangeSlider';

// Optimized Pagination Component
const PaginationControls = React.memo(({ 
  currentPage, 
  totalPages, 
  onPageChange, 
  loading 
}) => {
  const getVisiblePages = useMemo(() => {
    const delta = 2;
    const range = [];
    const rangeWithDots = [];

    for (let i = Math.max(2, currentPage - delta); 
         i <= Math.min(totalPages - 1, currentPage + delta); 
         i++) {
      range.push(i);
    }

    if (currentPage - delta > 2) {
      rangeWithDots.push(1, '...');
    } else {
      rangeWithDots.push(1);
    }

    rangeWithDots.push(...range);

    if (currentPage + delta < totalPages - 1) {
      rangeWithDots.push('...', totalPages);
    } else if (totalPages > 1) {
      rangeWithDots.push(totalPages);
    }

    return rangeWithDots;
  }, [currentPage, totalPages]);

  return (
    <div className="flex items-center justify-center space-x-2 mt-12">
      {/* Previous Button */}
      <button
        onClick={() => onPageChange(currentPage - 1)}
        disabled={currentPage === 1 || loading}
        className="flex items-center px-4 py-2 text-sm font-medium text-gray-500 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 hover:text-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
      >
        <ChevronLeft size={16} className="mr-1" />
        Previous
      </button>

      {/* Page Numbers */}
      <div className="flex space-x-1">
        {getVisiblePages.map((page, index) => (
          <React.Fragment key={index}>
            {page === '...' ? (
              <span className="px-3 py-2 text-gray-500">...</span>
            ) : (
              <button
                onClick={() => onPageChange(page)}
                disabled={loading}
                className={`px-3 py-2 text-sm font-medium rounded-lg transition-colors ${
                  currentPage === page
                    ? 'bg-purple-600 text-white'
                    : 'text-gray-700 bg-white border border-gray-300 hover:bg-purple-50 hover:text-purple-700'
                } disabled:opacity-50`}
              >
                {page}
              </button>
            )}
          </React.Fragment>
        ))}
      </div>

      {/* Next Button */}
      <button
        onClick={() => onPageChange(currentPage + 1)}
        disabled={currentPage === totalPages || loading}
        className="flex items-center px-4 py-2 text-sm font-medium text-gray-500 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 hover:text-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
      >
        Next
        <ChevronRight size={16} className="ml-1" />
      </button>
    </div>
  );
});

PaginationControls.displayName = 'PaginationControls';

// Optimized Product Card Component
const ProductCard = React.memo(({ product, onProductClick, onAddToCart, onToggleFavorite, isFavorite }) => {
  const [imageLoaded, setImageLoaded] = useState(false);
  const [imageError, setImageError] = useState(false);

  // Check if we have a valid image URL with safe property access
  const hasValidImage = product?.images && 
                       product.images.length > 0 && 
                       product.images[0]?.url && 
                       product.images[0].url.trim() !== '';

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      whileHover={{ y: -8, scale: 1.02 }}
      className="bg-white rounded-sm shadow-lg overflow-hidden cursor-pointer group hover:shadow-2xl transition-all duration-300 relative max-w-sm mx-auto w-full"
      onClick={() => onProductClick(product)}
    >
      {/* Favorite Button */}
      <button
        onClick={(e) => onToggleFavorite(e, product)}
        className="absolute top-4 right-4 z-10 p-2 rounded-full bg-white/90 backdrop-blur-sm shadow-md hover:shadow-lg transition-all duration-200"
        aria-label={`${isFavorite ? 'Remove from' : 'Add to'} favorites`}
      >
        <Heart
          size={20}
          className={`${
            isFavorite 
              ? 'text-red-500 fill-red-500' 
              : 'text-gray-400 hover:text-purple-500'
          } transition-colors`}
        />
      </button>

      {/* Optimized Product Image with proper validation */}
      <div className="relative w-full h-90 bg-gradient-to-br from-gray-50 to-gray-100 overflow-hidden">
        {hasValidImage && !imageError ? (
          <>
            {!imageLoaded && (
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="animate-pulse bg-gray-200 w-full h-full"></div>
              </div>
            )}
            <Image
              src={product.images[0].url}
              alt={product.images[0]?.alt || product?.name || 'Product image'}
              fill
              sizes="(max-width: 640px) 100vw, (max-width: 768px) 100vw, (max-width: 1024px) 50vw, 33vw"
              className={`object-cover group-hover:scale-105 transition-all duration-300 ${
                imageLoaded ? 'opacity-100' : 'opacity-0'
              }`}
              priority={false}
              placeholder="blur"
              blurDataURL="data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAYEBQYFBAYGBQYHBwYIChAKCgkJChQODwwQFxQYGBcUFhYaHSUfGhsjHBYWICwgIyYnKSopGR8tMC0oMCUoKSj/2wBDAQcHBwoIChMKChMoGhYaKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCj/wAARCAABAAEDASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAv/xAAUEAEAAAAAAAAAAAAAAAAAAAAA/8QAFQEBAQAAAAAAAAAAAAAAAAAAAAX/xAAUEQEAAAAAAAAAAAAAAAAAAAAA/9oADAMBAAIRAxEAPwCdABmX/9k="
              loading="lazy"
              onLoad={() => setImageLoaded(true)}
              onError={() => setImageError(true)}
            />
          </>
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-gray-100">
            <Package size={48} className="text-gray-400" />
          </div>
        )}
      </div>

      {/* Product Info */}
      <div className="p-6">
        <h3 className="font-semibold text-gray-900 text-md mb-2 line-clamp-2 group-hover:text-purple-600 transition-colors">
          {product?.name || 'Unnamed Product'}
        </h3>
        
        {product?.brand && (
          <p className="text-gray-600 text-sm mb-3 inline-block transition-all duration-300 group-hover:text-purple-600">
            {product.brand}
          </p>
        )}

        

        <div className="text-xl font-semibold text-purple-600 mb-4">
          BDT {(product?.price || 0).toLocaleString()}
        </div>

        {/* Add to Cart Button */}
        {/* <button
          onClick={(e) => onAddToCart(e, product)}
          className="w-full bg-purple-600 text-white py-3 px-4 rounded-lg hover:bg-purple-700 active:scale-95 transition-all duration-200 flex items-center justify-center gap-2 font-semibold"
        >
          <ShoppingCart size={18} />
          Add to Cart
        </button> */}
      </div>
    </motion.div>
  );
});

ProductCard.displayName = 'ProductCard';

// FIXED: Main Products Page Component - Simplified with direct useSearchParams
function ProductsPageContent() {
  const [products, setProducts] = useState([]);
  const [allProducts, setAllProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalProducts, setTotalProducts] = useState(0);
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [priceRange, setPriceRange] = useState([DEFAULT_MIN_PRICE, FALLBACK_MAX_PRICE]);
  const [showFilters, setShowFilters] = useState(false);
  const [dynamicMinPrice, setDynamicMinPrice] = useState(DEFAULT_MIN_PRICE);
  const [dynamicMaxPrice, setDynamicMaxPrice] = useState(FALLBACK_MAX_PRICE);
  const [priceRangeLoaded, setPriceRangeLoaded] = useState(false);
  const [initialized, setInitialized] = useState(false);
  
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams(); // Direct usage - wrapped in Suspense at parent level
  const { addToCart } = useCart();
  const { toggleFavorite, isFavorite } = useFavorites();

  // Calculate dynamic price range from all available products
  const calculatePriceRange = useCallback((products) => {
    if (products && products.length > 0) {
      const prices = products.map(product => product?.price || 0).filter(price => price > 0);
      
      if (prices.length > 0) {
        const minPrice = Math.min(...prices);
        const maxPrice = Math.max(...prices);
        
        console.log('📊 Dynamic price range calculated from products:', { 
          productCount: products.length,
          validPrices: prices.length,
          minPrice, 
          maxPrice 
        });
        
        setDynamicMinPrice(minPrice);
        setDynamicMaxPrice(maxPrice);
        
        // Update price range if it's still the default values
        if (priceRange[0] === DEFAULT_MIN_PRICE && priceRange[1] === FALLBACK_MAX_PRICE) {
          setPriceRange([minPrice, maxPrice]);
        }
        
        setPriceRangeLoaded(true);
        return { minPrice, maxPrice };
      }
    }
    
    console.log('📊 Using fallback price range');
    setDynamicMinPrice(DEFAULT_MIN_PRICE);
    setDynamicMaxPrice(FALLBACK_MAX_PRICE);
    setPriceRangeLoaded(true);
    return { minPrice: DEFAULT_MIN_PRICE, maxPrice: FALLBACK_MAX_PRICE };
  }, [priceRange]);

  // Fetch all products to calculate price range (without pagination)
  const fetchAllProductsForPriceRange = useCallback(async () => {
    try {
      console.log('🔍 Fetching all products for price range calculation...');
      
      const response = await fetch('/api/products?status=active&limit=1000');
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      const allProductsData = data?.products || [];
      
      console.log('✅ All products loaded for price calculation:', {
        count: allProductsData.length
      });
      
      setAllProducts(allProductsData);
      calculatePriceRange(allProductsData);
      
    } catch (error) {
      console.error('❌ Error fetching all products for price range:', error);
      calculatePriceRange([]);
    }
  }, [calculatePriceRange]);

  // Initialize from URL params and fetch price range on mount (FIXED: Run only once)
  useEffect(() => {
    if (initialized) return; // Prevent multiple initializations
    
    const page = parseInt(searchParams.get('page') || '1') || 1;
    const search = searchParams.get('search') || '';
    const minPrice = parseInt(searchParams.get('minPrice') || DEFAULT_MIN_PRICE.toString()) || DEFAULT_MIN_PRICE;
    const maxPrice = parseInt(searchParams.get('maxPrice') || FALLBACK_MAX_PRICE.toString()) || FALLBACK_MAX_PRICE;
    
    setCurrentPage(page);
    setSearchQuery(search);
    setDebouncedSearch(search);
    setPriceRange([minPrice, maxPrice]);
    setInitialized(true);
    
    // Fetch all products for price range calculation
    fetchAllProductsForPriceRange();
  }, [searchParams, fetchAllProductsForPriceRange, initialized]);

  // Debounced search effect
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchQuery);
      if (currentPage !== 1) {
        setCurrentPage(1);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [searchQuery, currentPage]);

  // Update URL when search, price range, or page changes (FIXED: Prevent circular updates)
  useEffect(() => {
    if (!priceRangeLoaded || !initialized) return;
    
    const params = new URLSearchParams();
    
    if (debouncedSearch?.trim()) {
      params.set('search', debouncedSearch);
    }
    
    if (priceRange && priceRange[0] !== dynamicMinPrice) {
      params.set('minPrice', (priceRange[0] || DEFAULT_MIN_PRICE).toString());
    }
    
    if (priceRange && priceRange[1] !== dynamicMaxPrice) {
      params.set('maxPrice', (priceRange[1] || dynamicMaxPrice).toString());
    }
    
    if (currentPage > 1) {
      params.set('page', currentPage.toString());
    }
    
    const newUrl = `${pathname}${params.toString() ? `?${params.toString()}` : ''}`;
    const currentUrl = window.location.pathname + window.location.search;
    
    // Only update URL if it's different and we're not in the middle of initialization
    if (currentUrl !== newUrl) {
      router.replace(newUrl, { scroll: false });
    }
  }, [debouncedSearch, priceRange, currentPage, pathname, router, dynamicMinPrice, dynamicMaxPrice, priceRangeLoaded, initialized]);

  // Fetch products function
  const fetchProducts = useCallback(async () => {
    if (!priceRangeLoaded) return;
    
    setLoading(true);

    try {
      const queryParams = new URLSearchParams({
        status: 'active',
        page: currentPage.toString(),
        limit: PRODUCTS_PER_PAGE.toString(),
        ...(debouncedSearch && { search: debouncedSearch })
      });

      console.log('🔍 Fetching products for display:', { 
        page: currentPage, 
        search: debouncedSearch,
        priceRange,
        dynamicRange: { min: dynamicMinPrice, max: dynamicMaxPrice }
      });
      
      const response = await fetch(`/api/products?${queryParams}`);

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      
      console.log('✅ Products loaded from API:', {
        page: currentPage,
        count: data?.products?.length || 0,
        total: data?.pagination?.total || 0
      });

      let loadedProducts = data?.products || [];
      
      // Apply client-side price filtering
      if (priceRange && (priceRange[0] !== dynamicMinPrice || priceRange[1] !== dynamicMaxPrice)) {
        loadedProducts = loadedProducts.filter(product => {
          const productPrice = product?.price || 0;
          return productPrice >= priceRange[0] && productPrice <= priceRange[1];
        });
        
        console.log('✅ Products after price filtering:', {
          originalCount: data?.products?.length || 0,
          filteredCount: loadedProducts.length,
          priceRange,
          dynamicRange: { min: dynamicMinPrice, max: dynamicMaxPrice }
        });
      }

      setProducts(loadedProducts);
      setTotalPages(data?.pagination?.totalPages || 1);
      setTotalProducts(loadedProducts.length);

    } catch (error) {
      console.error('❌ Error fetching products:', error);
      setProducts([]);
      setTotalPages(1);
      setTotalProducts(0);
    } finally {
      setLoading(false);
    }
  }, [currentPage, debouncedSearch, priceRange, dynamicMinPrice, dynamicMaxPrice, priceRangeLoaded]);

  // Fetch products when dependencies change
  useEffect(() => {
    if (priceRangeLoaded && initialized) {
      fetchProducts();
    }
  }, [fetchProducts, priceRangeLoaded, initialized]);

  // Event handlers
  const handleProductClick = useCallback((product) => {
    if (product?._id) {
      console.log('🔍 Navigating to product:', product.name, product._id);
      router.push(`/products/${product._id}`);
    }
  }, [router]);

  const handleAddToCart = useCallback((e, product) => {
    e.stopPropagation();
    if (product) {
      addToCart(product, 1);
      console.log('✅ Added to cart:', product.name);
    }
  }, [addToCart]);

  const handleToggleFavorite = useCallback((e, product) => {
    e.stopPropagation();
    if (product?._id) {
      toggleFavorite(product);
      console.log('❤️ Toggled favorite:', product.name);
    }
  }, [toggleFavorite]);

  const handlePageChange = useCallback((page) => {
    if (page !== currentPage && page >= 1 && page <= totalPages && !loading) {
      setCurrentPage(page);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }, [currentPage, totalPages, loading]);

  const handleSearchChange = useCallback((e) => {
    setSearchQuery(e.target.value || '');
  }, []);

  const handlePriceRangeChange = useCallback((newRange) => {
    if (newRange && Array.isArray(newRange) && newRange.length === 2) {
      setPriceRange(newRange);
      if (currentPage !== 1) {
        setCurrentPage(1);
      }
    }
  }, [currentPage]);

  const handleClearFilters = useCallback(() => {
    setPriceRange([dynamicMinPrice, dynamicMaxPrice]);
    setSearchQuery('');
    setDebouncedSearch('');
    setCurrentPage(1);
  }, [dynamicMinPrice, dynamicMaxPrice]);

  const hasActiveFilters = useMemo(() => {
    return (debouncedSearch?.trim() || '') !== '' || 
           (priceRange && (priceRange[0] !== dynamicMinPrice || priceRange[1] !== dynamicMaxPrice));
  }, [debouncedSearch, priceRange, dynamicMinPrice, dynamicMaxPrice]);

  if (loading && currentPage === 1 && products.length === 0) {
    return <Loading />;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-blue-50 to-indigo-100">
      <div className="max-w-7xl mx-auto px-4 py-8">
        
        {/* Header Section */}
        <div className="mb-8">
          <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4 mb-6">
            
            {/* Search and Filter Controls */}
            <div className="flex flex-col sm:flex-row gap-4 lg:ml-auto">
              {/* Search */}
              <div className="relative">
                <Search size={20} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search products..."
                  value={searchQuery}
                  onChange={handleSearchChange}
                  className="pl-10 pr-4 py-2 w-80 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none transition-all"
                />
              </div>
              
              {/* Filter Toggle Button */}
              <button
                onClick={() => setShowFilters(!showFilters)}
                className={`flex items-center px-4 py-2 border rounded-lg transition-all ${
                  showFilters || hasActiveFilters
                    ? 'bg-purple-600 text-white border-purple-600'
                    : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
                }`}
              >
                <Filter size={20} className="mr-2" />
                Filters
                {hasActiveFilters && (
                  <span className="ml-2 bg-white text-purple-600 px-2 py-0.5 rounded-full text-xs font-medium">
                    {[
                      (debouncedSearch?.trim() || '') !== '' && 'Search', 
                      priceRange && (priceRange[0] !== dynamicMinPrice || priceRange[1] !== dynamicMaxPrice) && 'Price'
                    ].filter(Boolean).length}
                  </span>
                )}
              </button>
            </div>
          </div>

          {/* Filter Panel */}
          <AnimatePresence>
            {showFilters && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.2 }}
                className="overflow-hidden bg-white rounded-lg border border-gray-200 shadow-sm mb-6"
              >
                <div className="p-6">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-semibold text-gray-900">Filters</h3>
                    {hasActiveFilters && (
                      <button
                        onClick={handleClearFilters}
                        className="flex items-center px-3 py-1 text-sm text-purple-600 hover:text-purple-700 hover:bg-purple-50 rounded-md transition-colors"
                      >
                        <X size={16} className="mr-1" />
                        Clear All
                      </button>
                    )}
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Dynamic Price Range Filter */}
                    <div>
                      <PriceRangeSlider
                        minPrice={priceRange?.[0] || dynamicMinPrice}
                        maxPrice={priceRange?.[1] || dynamicMaxPrice}
                        onRangeChange={handlePriceRangeChange}
                        minValue={dynamicMinPrice}
                        maxValue={dynamicMaxPrice}
                      />
                    </div>
                    
                    {/* Additional filters info */}
                    <div className="flex items-end">
                      <div className="text-sm text-gray-500">
                        <p>Showing {totalProducts || 0} products</p>
                        {hasActiveFilters && (
                          <p className="mt-1 text-purple-600">Filters applied</p>
                        )}
                        {priceRangeLoaded && (
                          <p className="mt-1 text-gray-400">
                            Products range: BDT {dynamicMinPrice.toLocaleString()} - BDT {dynamicMaxPrice.toLocaleString()}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Products Grid */}
        <div className="relative">
          {loading && (
            <div className="absolute top-0 left-0 right-0 bg-white/80 backdrop-blur-sm z-10 flex items-center justify-center py-4">
              <Loader2 size={24} className="animate-spin text-purple-600" />
              <span className="ml-2 text-purple-600">Loading...</span>
            </div>
          )}
          
          <AnimatePresence mode="wait">
            <motion.div
              key={`${currentPage}-${debouncedSearch}-${priceRange?.[0]}-${priceRange?.[1]}`}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="grid grid-cols-1 sm:grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3 gap-8"
            >
              {products.length === 0 && !loading ? (
                <div className="col-span-full text-center py-20">
                  <Package size={64} className="mx-auto text-gray-400 mb-4" />
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">
                    {hasActiveFilters ? 'No products found' : 'No products available'}
                  </h3>
                  <p className="text-gray-600">
                    {hasActiveFilters 
                      ? 'Try adjusting your filters or search terms' 
                      : 'Please check back later'
                    }
                  </p>
                  {hasActiveFilters && (
                    <button
                      onClick={handleClearFilters}
                      className="mt-4 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
                    >
                      Clear Filters
                    </button>
                  )}
                </div>
              ) : (
                products.map((product) => (
                  <ProductCard
                    key={product?._id || Math.random()}
                    product={product}
                    onProductClick={handleProductClick}
                    onAddToCart={handleAddToCart}
                    onToggleFavorite={handleToggleFavorite}
                    isFavorite={isFavorite(product?._id)}
                  />
                ))
              )}
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <PaginationControls
            currentPage={currentPage}
            totalPages={totalPages}
            onPageChange={handlePageChange}
            loading={loading}
          />
        )}
      </div>

      {/* Custom CSS for range slider */}
      <style jsx>{`
        .slider-thumb {
          -webkit-appearance: none;
          pointer-events: none;
        }
        
        .slider-thumb::-webkit-slider-thumb {
          -webkit-appearance: none;
          height: 20px;
          width: 20px;
          background: #7c3aed;
          border-radius: 50%;
          border: 2px solid white;
          box-shadow: 0 2px 4px rgba(0,0,0,0.2);
          cursor: pointer;
          pointer-events: auto;
        }
        
        .slider-thumb::-moz-range-thumb {
          height: 20px;
          width: 20px;
          background: #7c3aed;
          border-radius: 50%;
          border: 2px solid white;
          box-shadow: 0 2px 4px rgba(0,0,0,0.2);
          cursor: pointer;
          pointer-events: auto;
        }
      `}</style>
    </div>
  );
}

// Main export component with Suspense boundary
export default function ProductsPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gradient-to-br from-purple-50 via-blue-50 to-indigo-100 flex items-center justify-center">
        <Loading />
      </div>
    }>
      <ProductsPageContent />
    </Suspense>
  );
}
