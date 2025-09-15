'use client'

import React, { 
  useState, 
  useEffect, 
  useCallback, 
  useMemo, 
  useRef,
  startTransition,
  useDeferredValue
} from 'react';
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
  X,
  Zap
} from 'lucide-react';
import { Suspense } from 'react';
import { useCart } from '../../../components/hooks/useCart';
import { useFavorites } from '../../../components/hooks/useFavorites';
import Loading from '../../../components/Loading';

// Enterprise-level configuration
const PRODUCTS_PER_PAGE = 12;
const DEFAULT_MIN_PRICE = 0;
const FALLBACK_MAX_PRICE = 10000;

// Enhanced Skeleton Component
const ProductSkeleton = React.memo(() => (
  <div className="bg-white rounded-sm shadow-lg overflow-hidden max-w-sm mx-auto w-full">
    <div className="relative w-full h-90 bg-gradient-to-r from-gray-200 via-gray-300 to-gray-200 bg-[length:200%_100%] animate-shimmer" />
    <div className="p-6">
      <div className="h-4 bg-gradient-to-r from-gray-200 via-gray-300 to-gray-200 bg-[length:200%_100%] animate-shimmer rounded mb-2" />
      <div className="h-4 bg-gradient-to-r from-gray-200 via-gray-300 to-gray-200 bg-[length:200%_100%] animate-shimmer rounded w-2/3 mb-3" />
      <div className="h-6 bg-gradient-to-r from-gray-200 via-gray-300 to-gray-200 bg-[length:200%_100%] animate-shimmer rounded w-1/3" />
    </div>
  </div>
));
ProductSkeleton.displayName = 'ProductSkeleton';

// Enhanced Price Range Slider
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
  const [activeThumb, setActiveThumb] = useState(null);
  const updateTimeoutRef = useRef(null);
  
  // Add deferred values for performance
  const deferredMinPrice = useDeferredValue(localMinPrice);
  const deferredMaxPrice = useDeferredValue(localMaxPrice);

  useEffect(() => {
    setLocalMinPrice(minPrice || DEFAULT_MIN_PRICE);
    setLocalMaxPrice(maxPrice || maxValue);
  }, [minPrice, maxPrice, maxValue]);

  const debouncedRangeChange = useCallback((newRange) => {
    if (updateTimeoutRef.current) {
      clearTimeout(updateTimeoutRef.current);
    }
    updateTimeoutRef.current = setTimeout(() => {
      startTransition(() => {
        onRangeChange(newRange);
      });
    }, 150);
  }, [onRangeChange]);

  const handleMinChange = useCallback((e) => {
    const value = parseInt(e.target.value) || minValue;
    if (value >= minValue && value <= (localMaxPrice - 100)) {
      setLocalMinPrice(value);
      setIsDragging(true);
      setActiveThumb('min');
    }
  }, [localMaxPrice, minValue]);

  const handleMaxChange = useCallback((e) => {
    const value = parseInt(e.target.value) || maxValue;
    if (value <= maxValue && value >= (localMinPrice + 100)) {
      setLocalMaxPrice(value);
      setIsDragging(true);
      setActiveThumb('max');
    }
  }, [localMinPrice, maxValue]);

  const handleMouseUp = useCallback(() => {
    if (isDragging) {
      setIsDragging(false);
      setActiveThumb(null);
      debouncedRangeChange([localMinPrice, localMaxPrice]);
    }
  }, [isDragging, localMinPrice, localMaxPrice, debouncedRangeChange]);

  const handleInputChange = useCallback((type, value) => {
    const numValue = parseInt(value) || 0;
    if (type === 'min') {
      if (numValue >= minValue && numValue <= (localMaxPrice - 100)) {
        setLocalMinPrice(numValue);
        debouncedRangeChange([numValue, localMaxPrice]);
      }
    } else {
      if (numValue <= maxValue && numValue >= (localMinPrice + 100)) {
        setLocalMaxPrice(numValue);
        debouncedRangeChange([localMinPrice, numValue]);
      }
    }
  }, [localMinPrice, localMaxPrice, minValue, maxValue, debouncedRangeChange]);

  const minPercent = useMemo(() => {
    const range = maxValue - minValue;
    return range > 0 ? ((deferredMinPrice - minValue) / range) * 100 : 0;
  }, [deferredMinPrice, minValue, maxValue]);
  
  const maxPercent = useMemo(() => {
    const range = maxValue - minValue;
    return range > 0 ? ((deferredMaxPrice - minValue) / range) * 100 : 100;
  }, [deferredMaxPrice, minValue, maxValue]);

  useEffect(() => {
    return () => {
      if (updateTimeoutRef.current) {
        clearTimeout(updateTimeoutRef.current);
      }
    };
  }, []);

  return (
    <div className="w-full">
      <div className="mb-4">
        <div className="flex justify-between items-center mb-2">
          <span className="text-sm font-medium text-gray-700 flex items-center">
            <Zap size={16} className="mr-1 text-purple-500" />
            Price Range
          </span>
          <span className="text-sm text-gray-500 font-mono">
            BDT {(deferredMinPrice || 0).toLocaleString()} - BDT {(deferredMaxPrice || 0).toLocaleString()}
          </span>
        </div>
        
        <div className="text-xs text-gray-400 mb-2 flex items-center justify-between">
          <span>Range: BDT {minValue.toLocaleString()} - BDT {maxValue.toLocaleString()}</span>
          {isDragging && (
            <span className="text-purple-500 animate-pulse">Adjusting...</span>
          )}
        </div>
        
        <div className="relative h-6 mb-4">
          <div className="absolute w-full h-2 bg-gray-200 rounded top-2"></div>
          <div 
            className={`absolute h-2 rounded top-2 transition-all duration-200 ${
              isDragging ? 'bg-purple-600 shadow-lg' : 'bg-purple-500'
            }`}
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
            className={`absolute w-full h-6 bg-transparent appearance-none cursor-pointer slider-thumb ${
              activeThumb === 'min' ? 'z-30' : 'z-10'
            }`}
          />
          
          <input
            type="range"
            min={minValue}
            max={maxValue}
            value={localMaxPrice}
            onChange={handleMaxChange}
            onMouseUp={handleMouseUp}
            onTouchEnd={handleMouseUp}
            className={`absolute w-full h-6 bg-transparent appearance-none cursor-pointer slider-thumb ${
              activeThumb === 'max' ? 'z-30' : 'z-20'
            }`}
          />
        </div>

        <div className="flex items-center space-x-2">
          <div className="flex-1">
            <label className="block text-xs text-gray-500 mb-1">Min Price</label>
            <input
              type="number"
              value={localMinPrice || 0}
              onChange={(e) => handleInputChange('min', e.target.value)}
              className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-purple-500 focus:border-purple-500 outline-none transition-all"
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
              className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-purple-500 focus:border-purple-500 outline-none transition-all"
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

// Keep your existing PaginationControls - they work perfectly
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
      <button
        onClick={() => onPageChange(currentPage - 1)}
        disabled={currentPage === 1 || loading}
        className="flex items-center px-4 py-2 text-sm font-medium text-gray-500 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 hover:text-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
      >
        <ChevronLeft size={16} className="mr-1" />
        Previous
      </button>

      <div className="flex space-x-1">
        {getVisiblePages.map((page, index) => (
          <React.Fragment key={index}>
            {page === '...' ? (
              <span className="px-3 py-2 text-gray-500">...</span>
            ) : (
              <button
                onClick={() => onPageChange(page)}
                disabled={loading}
                className={`px-3 py-2 text-sm font-medium rounded-lg transition-all duration-200 ${
                  currentPage === page
                    ? 'bg-purple-600 text-white shadow-md transform scale-105'
                    : 'text-gray-700 bg-white border border-gray-300 hover:bg-purple-50 hover:text-purple-700 hover:border-purple-300'
                } disabled:opacity-50 relative`}
              >
                {page}
              </button>
            )}
          </React.Fragment>
        ))}
      </div>

      <button
        onClick={() => onPageChange(currentPage + 1)}
        disabled={currentPage === totalPages || loading}
        className="flex items-center px-4 py-2 text-sm font-medium text-gray-500 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 hover:text-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
      >
        Next
        <ChevronRight size={16} className="ml-1" />
      </button>
    </div>
  );
});
PaginationControls.displayName = 'PaginationControls';

// Enhanced Product Card
const ProductCard = React.memo(({ product, onProductClick, onAddToCart, onToggleFavorite, isFavorite, index = 0 }) => {
  const [imageLoaded, setImageLoaded] = useState(false);
  const [imageError, setImageError] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const cardRef = useRef(null);

  const hasValidImage = useMemo(() => {
    return product?.images && 
           product.images.length > 0 && 
           product.images[0]?.url && 
           product.images[0].url.trim() !== '';
  }, [product?.images]);

  const blurDataURL = useMemo(() => 
    "data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSIjZjNmNGY2Ii8+PC9zdmc+", 
    []
  );

  return (
    <motion.div
      ref={cardRef}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      whileHover={{ 
        y: -6, 
        scale: 1.02,
        boxShadow: "0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)"
      }}
      transition={{ duration: 0.2, ease: "easeOut" }}
      className="bg-white rounded-sm shadow-lg overflow-hidden cursor-pointer group hover:shadow-2xl transition-all duration-300 relative max-w-sm mx-auto w-full"
      onClick={() => onProductClick(product)}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Favorite Button */}
      <button
        onClick={(e) => onToggleFavorite(e, product)}
        className={`absolute top-4 right-4 z-10 p-2 rounded-full backdrop-blur-md shadow-lg transition-all duration-300 transform ${
          isHovered ? 'scale-110' : 'scale-100'
        } ${
          isFavorite 
            ? 'bg-purple-500 hover:bg-purple-600/90' 
            : 'bg-white/90 hover:bg-white hover:shadow-xl'
        }`}
        aria-label={`${isFavorite ? 'Remove from' : 'Add to'} favorites`}
      >
        <Heart
          size={20}
          className={`${
            isFavorite 
              ? 'text-white fill-white' 
              : 'text-gray-400 hover:text-purple-500'
          } transition-all duration-200`}
        />
      </button>

      {/* Product Image */}
      <div className="relative w-full h-90 bg-gradient-to-br from-gray-50 to-gray-100 overflow-hidden">
        {hasValidImage && !imageError ? (
          <>
            {!imageLoaded && (
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="bg-gradient-to-r from-gray-200 via-gray-300 to-gray-200 bg-[length:200%_100%] animate-shimmer w-full h-full" />
              </div>
            )}
            <Image
              src={product.images[0].url}
              alt={product.images[0]?.alt || product?.name || 'Product image'}
              fill
              sizes="(max-width: 640px) 100vw, (max-width: 768px) 50vw, (max-width: 1024px) 33vw, 25vw"
              className={`object-cover transition-all duration-500 transform ${
                isHovered ? 'scale-110' : 'scale-100'
              } ${imageLoaded ? 'opacity-100' : 'opacity-0'}`}
              priority={index < 3}
              loading={index < 6 ? "eager" : "lazy"}
              placeholder="blur"
              blurDataURL={blurDataURL}
              quality={85}
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
      <div className="p-6 relative">
        <h3 className={`font-semibold text-gray-900 text-md mb-2 line-clamp-2 transition-all duration-200 ${
          isHovered ? 'text-purple-600' : ''
        }`}>
          {product?.name || 'Unnamed Product'}
        </h3>
        
        {product?.brand && (
          <p className={`text-gray-600 text-sm mb-3 transition-colors duration-300 ${
            isHovered ? 'text-purple-600' : ''
          }`}>
            {product.brand}
          </p>
        )}

        <div className="flex items-center gap-2">
  <div className="text-xl font-semibold text-purple-600">
    BDT {(product?.price || 0).toLocaleString()}
  </div>
  {product?.comparePrice && product.comparePrice > product.price && (
    <div className="text-sm text-gray-400 line-through">
      BDT {product.comparePrice.toLocaleString()}
    </div>
  )}
</div>

      </div>
    </motion.div>
  );
}, (prevProps, nextProps) => {
  return (
    prevProps.product?._id === nextProps.product?._id &&
    prevProps.isFavorite === nextProps.isFavorite &&
    prevProps.product?.price === nextProps.product?.price &&
    prevProps.product?.name === nextProps.product?.name
  );
});
ProductCard.displayName = 'ProductCard';

// Main component - using your working logic with enhancements
function ProductsPageContent() {
  const [products, setProducts] = useState([]);
  const [allProducts, setAllProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalProducts, setTotalProducts] = useState(0);
  const [searchQuery, setSearchQuery] = useState('');
  const [priceRange, setPriceRange] = useState([DEFAULT_MIN_PRICE, FALLBACK_MAX_PRICE]);
  const [showFilters, setShowFilters] = useState(false);
  const [dynamicMinPrice, setDynamicMinPrice] = useState(DEFAULT_MIN_PRICE);
  const [dynamicMaxPrice, setDynamicMaxPrice] = useState(FALLBACK_MAX_PRICE);
  const [priceRangeLoaded, setPriceRangeLoaded] = useState(false);
  const [initialized, setInitialized] = useState(false);

  // Enhanced state with deferred values
  const deferredSearchQuery = useDeferredValue(searchQuery);
  const deferredPriceRange = useDeferredValue(priceRange);

  const abortControllerRef = useRef(null);
  const searchTimeoutRef = useRef(null);
  const prefetchCache = useRef(new Map());
  const urlUpdateTimeoutRef = useRef(null);

  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const { addToCart } = useCart();
  const { toggleFavorite, isFavorite } = useFavorites();

  // Enhanced fetchWithCache
  const fetchWithCache = useCallback(async (url, options = {}) => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    
    abortControllerRef.current = new AbortController();
    
    const cacheKey = url + JSON.stringify(options);
    if (prefetchCache.current.has(cacheKey)) {
      const cached = prefetchCache.current.get(cacheKey);
      if (Date.now() - cached.timestamp < 60000) {
        return cached.data;
      }
    }

    try {
      const response = await fetch(url, {
        ...options,
        signal: abortControllerRef.current.signal,
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      
      prefetchCache.current.set(cacheKey, {
        data,
        timestamp: Date.now()
      });
      
      if (prefetchCache.current.size > 50) {
        const firstKey = prefetchCache.current.keys().next().value;
        prefetchCache.current.delete(firstKey);
      }
      
      return data;
    } catch (error) {
      if (error.name === 'AbortError') {
        return null;
      }
      throw error;
    }
  }, []);

  // ✅ FIXED: Enhanced calculatePriceRange to prevent unnecessary updates
  const calculatePriceRange = useCallback((products) => {
    if (products && products.length > 0) {
      const prices = products.map(product => product?.price || 0).filter(price => price > 0);
      
      if (prices.length > 0) {
        const minPrice = Math.min(...prices);
        const maxPrice = Math.max(...prices);
        
        // Only update if prices actually changed
        if (minPrice !== dynamicMinPrice || maxPrice !== dynamicMaxPrice) {
          setDynamicMinPrice(minPrice);
          setDynamicMaxPrice(maxPrice);
          
          // Only set price range if it's still at defaults AND no URL params exist
          if (priceRange[0] === DEFAULT_MIN_PRICE && 
              priceRange[1] === FALLBACK_MAX_PRICE && 
              !searchParams.has('minPrice') && 
              !searchParams.has('maxPrice')) {
            setPriceRange([minPrice, maxPrice]);
          }
        }
        
        setPriceRangeLoaded(true);
        return { minPrice, maxPrice };
      }
    }
    
    if (dynamicMinPrice !== DEFAULT_MIN_PRICE || dynamicMaxPrice !== FALLBACK_MAX_PRICE) {
      setDynamicMinPrice(DEFAULT_MIN_PRICE);
      setDynamicMaxPrice(FALLBACK_MAX_PRICE);
    }
    setPriceRangeLoaded(true);
    return { minPrice: DEFAULT_MIN_PRICE, maxPrice: FALLBACK_MAX_PRICE };
  }, [priceRange, dynamicMinPrice, dynamicMaxPrice, searchParams]);

  const fetchAllProductsForPriceRange = useCallback(async () => {
    try {
      const data = await fetchWithCache('/api/products?status=active&limit=1000&fields=price');
      
      if (data) {
        const allProductsData = data?.products || [];
        setAllProducts(allProductsData);
        calculatePriceRange(allProductsData);
      }
    } catch (error) {
      console.error('❌ Error fetching products for price range:', error);
      calculatePriceRange([]);
    }
  }, [fetchWithCache, calculatePriceRange]);

  // ✅ FIXED: Enhanced initialization to prevent double loading
  useEffect(() => {
    if (initialized) return;
    
    const page = parseInt(searchParams.get('page') || '1') || 1;
    const search = searchParams.get('search') || '';
    const minPrice = parseInt(searchParams.get('minPrice') || DEFAULT_MIN_PRICE.toString()) || DEFAULT_MIN_PRICE;
    const maxPrice = parseInt(searchParams.get('maxPrice') || FALLBACK_MAX_PRICE.toString()) || FALLBACK_MAX_PRICE;
    
    // Check if URL already has price params - if so, don't fetch price range
    const hasUrlPriceParams = searchParams.has('minPrice') || searchParams.has('maxPrice');
    
    setCurrentPage(page);
    setSearchQuery(search);
    setPriceRange([minPrice, maxPrice]);
    
    if (hasUrlPriceParams) {
      // If URL has price params, use them and mark as loaded
      setDynamicMinPrice(minPrice);
      setDynamicMaxPrice(maxPrice);
      setPriceRangeLoaded(true);
      setInitialized(true);
    } else {
      // Only fetch price range if URL doesn't have price params
      setInitialized(true);
      fetchAllProductsForPriceRange();
    }
  }, [searchParams, fetchAllProductsForPriceRange, initialized]);

  // Enhanced debounced search
  useEffect(() => {
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }
    
    searchTimeoutRef.current = setTimeout(() => {
      if (currentPage !== 1 && deferredSearchQuery?.trim()) {
        startTransition(() => {
          setCurrentPage(1);
        });
      }
    }, 300);

    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
    };
  }, [searchQuery, currentPage, deferredSearchQuery]);

  // ✅ FIXED: Optimized URL update to prevent double reloads
  useEffect(() => {
    if (!priceRangeLoaded || !initialized) return;
    
    // Clear any pending URL updates
    if (urlUpdateTimeoutRef.current) {
      clearTimeout(urlUpdateTimeoutRef.current);
    }
    
    urlUpdateTimeoutRef.current = setTimeout(() => {
      const params = new URLSearchParams();
      
      if (deferredSearchQuery?.trim()) {
        params.set('search', deferredSearchQuery);
      }
      
      // Only update URL if price range has actually changed from user interaction
      if (deferredPriceRange && deferredPriceRange[0] !== dynamicMinPrice) {
        params.set('minPrice', (deferredPriceRange[0] || DEFAULT_MIN_PRICE).toString());
      }
      
      if (deferredPriceRange && deferredPriceRange[1] !== dynamicMaxPrice) {
        params.set('maxPrice', (deferredPriceRange[1] || dynamicMaxPrice).toString());
      }
      
      if (currentPage > 1) {
        params.set('page', currentPage.toString());
      }
      
      const newUrl = `${pathname}${params.toString() ? `?${params.toString()}` : ''}`;
      const currentUrl = window.location.pathname + window.location.search;
      
      // Only update URL if there's actually a meaningful change
      if (currentUrl !== newUrl) {
        router.replace(newUrl, { scroll: false });
      }
    }, 100); // Batch URL updates

    return () => {
      if (urlUpdateTimeoutRef.current) {
        clearTimeout(urlUpdateTimeoutRef.current);
      }
    };
  }, [deferredSearchQuery, deferredPriceRange, currentPage, pathname, router, dynamicMinPrice, dynamicMaxPrice, priceRangeLoaded, initialized]);

  // Enhanced fetch products
  const fetchProducts = useCallback(async () => {
    if (!priceRangeLoaded) return;
    
    setLoading(true);
    try {
      const queryParams = new URLSearchParams({
        status: 'active',
        page: currentPage.toString(),
        limit: PRODUCTS_PER_PAGE.toString(),
        ...(deferredSearchQuery?.trim() && { search: deferredSearchQuery.trim() })
      });

      const data = await fetchWithCache(`/api/products?${queryParams}`);
      
      if (data) {
        let loadedProducts = data?.products || [];
        
        // Apply client-side price filtering
        if (deferredPriceRange && (deferredPriceRange[0] !== dynamicMinPrice || deferredPriceRange[1] !== dynamicMaxPrice)) {
          loadedProducts = loadedProducts.filter(product => {
            const productPrice = product?.price || 0;
            return productPrice >= deferredPriceRange[0] && productPrice <= deferredPriceRange[1];
          });
        }

        setProducts(loadedProducts);
        setTotalPages(data?.pagination?.totalPages || (loadedProducts.length > 0 ? 1 : 0));
        setTotalProducts(data?.pagination?.totalProducts || loadedProducts.length);
      }
    } catch (error) {
      if (error && error.name !== 'AbortError') {
        console.error('❌ Error fetching products:', error);
        if (products.length === 0) {
          setProducts([]);
          setTotalPages(0);
          setTotalProducts(0);
        }
      }
    } finally {
      setLoading(false);
    }
  }, [currentPage, deferredSearchQuery, deferredPriceRange, dynamicMinPrice, dynamicMaxPrice, priceRangeLoaded, fetchWithCache, products.length]);

  useEffect(() => {
    if (priceRangeLoaded && initialized) {
      fetchProducts();
    }
  }, [fetchProducts, priceRangeLoaded, initialized]);

  // Event handlers
  const handleProductClick = useCallback((product) => {
    if (product?._id) {
      router.push(`/products/${product._id}`);
    }
  }, [router]);

  const handleAddToCart = useCallback((e, product) => {
    e.stopPropagation();
    if (product) {
      addToCart(product, 1);
    }
  }, [addToCart]);

  const handleToggleFavorite = useCallback((e, product) => {
    e.stopPropagation();
    if (product?._id) {
      toggleFavorite(product);
    }
  }, [toggleFavorite]);

  const handlePageChange = useCallback((page) => {
    if (page !== currentPage && page >= 1 && page <= totalPages && !loading) {
      startTransition(() => {
        setCurrentPage(page);
      });
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }, [currentPage, totalPages, loading]);

  const handleSearchChange = useCallback((e) => {
    const value = e.target.value;
    setSearchQuery(value);
  }, []);

  const handleClearSearch = useCallback(() => {
    setSearchQuery('');
    if (currentPage !== 1) {
      startTransition(() => {
        setCurrentPage(1);
      });
    }
  }, [currentPage]);

  const handlePriceRangeChange = useCallback((newRange) => {
    if (newRange && Array.isArray(newRange) && newRange.length === 2) {
      startTransition(() => {
        setPriceRange(newRange);
        if (currentPage !== 1) {
          setCurrentPage(1);
        }
      });
    }
  }, [currentPage]);

  const handleClearFilters = useCallback(() => {
    startTransition(() => {
      setPriceRange([dynamicMinPrice, dynamicMaxPrice]);
      setSearchQuery('');
      setCurrentPage(1);
    });
  }, [dynamicMinPrice, dynamicMaxPrice]);

  const hasActiveFilters = useMemo(() => {
    return (deferredSearchQuery?.trim() || '') !== '' || 
           (deferredPriceRange && (deferredPriceRange[0] !== dynamicMinPrice || deferredPriceRange[1] !== dynamicMaxPrice));
  }, [deferredSearchQuery, deferredPriceRange, dynamicMinPrice, dynamicMaxPrice]);

  useEffect(() => {
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
      if (urlUpdateTimeoutRef.current) {
        clearTimeout(urlUpdateTimeoutRef.current);
      }
    };
  }, []);

  if (loading && currentPage === 1 && products.length === 0 && !searchQuery.trim()) {
    return <Loading />;
  }

  return (
    <div className="min-h-screen ">
      <div className="max-w-7xl mx-auto px-4 py-8">
        
        {/* Header Section */}
        <div className="mb-8">
          <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4 mb-6">
            
            <div className="flex flex-col sm:flex-row gap-4 lg:ml-auto">
              {/* Enhanced Search */}
              <div className="relative group">
                <Search size={20} className={`absolute left-3 top-1/2 transform -translate-y-1/2 transition-colors ${
                  searchQuery ? 'text-purple-500' : 'text-gray-400'
                }`} />
                <input
                  type="text"
                  placeholder="Search products..."
                  value={searchQuery}
                  onChange={handleSearchChange}
                  className="pl-10 pr-10 py-2 w-80 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 outline-none transition-all duration-200 group-hover:shadow-md"
                />
                {searchQuery && (
                  <button
                    onClick={handleClearSearch}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                    type="button"
                  >
                    <X size={16} />
                  </button>
                )}
                {/* Search status indicator */}
                {deferredSearchQuery && deferredSearchQuery !== searchQuery && (
                  <div className="absolute right-10 top-1/2 transform -translate-y-1/2">
                    <div className="w-2 h-2 bg-yellow-400 rounded-full animate-pulse"></div>
                  </div>
                )}
              </div>
              
              {/* Filter Toggle */}
              <button
                onClick={() => setShowFilters(!showFilters)}
                className={`flex items-center px-4 py-2 border rounded-lg transition-all duration-200 transform hover:scale-105 ${
                  showFilters || hasActiveFilters
                    ? 'bg-purple-600 text-white border-purple-600 shadow-lg'
                    : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50 hover:shadow-md'
                }`}
              >
                <Filter size={20} className="mr-2" />
                Filters
                {hasActiveFilters && (
                  <span className="ml-2 bg-white text-purple-600 px-2 py-0.5 rounded-full text-xs font-medium animate-pulse">
                    {[
                      (deferredSearchQuery?.trim() || '') !== '' && 'Search', 
                      deferredPriceRange && (deferredPriceRange[0] !== dynamicMinPrice || deferredPriceRange[1] !== dynamicMaxPrice) && 'Price'
                    ].filter(Boolean).length}
                  </span>
                )}
              </button>
            </div>
          </div>

          {/* Enhanced Filter Panel */}
          <AnimatePresence>
            {showFilters && (
              <motion.div
                initial={{ height: 0, opacity: 0, scale: 0.95 }}
                animate={{ height: 'auto', opacity: 1, scale: 1 }}
                exit={{ height: 0, opacity: 0, scale: 0.95 }}
                transition={{ duration: 0.3, ease: "easeOut" }}
                className="overflow-hidden bg-white rounded-xl border border-gray-200 shadow-xl mb-6 backdrop-blur-sm"
              >
                <div className="p-6">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-semibold text-gray-900 flex items-center">
                      <Filter size={20} className="mr-2 text-purple-500" />
                      Advanced Filters
                    </h3>
                    {hasActiveFilters && (
                      <button
                        onClick={handleClearFilters}
                        className="flex items-center px-3 py-1 text-sm text-purple-600 hover:text-purple-700 hover:bg-purple-50 rounded-md transition-all duration-200 transform hover:scale-105"
                      >
                        <X size={16} className="mr-1" />
                        Clear All
                      </button>
                    )}
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <PriceRangeSlider
                        minPrice={deferredPriceRange?.[0] || dynamicMinPrice}
                        maxPrice={deferredPriceRange?.[1] || dynamicMaxPrice}
                        onRangeChange={handlePriceRangeChange}
                        minValue={dynamicMinPrice}
                        maxValue={dynamicMaxPrice}
                      />
                    </div>
                    
                    <div className="flex items-end">
                      <div className="text-sm text-gray-500 space-y-2">
                        <div className="flex items-center space-x-2">
                          <div className="w-3 h-3 bg-purple-500 rounded-full"></div>
                          <span>Showing {totalProducts || 0} products</span>
                        </div>
                        {hasActiveFilters && (
                          <div className="flex items-center space-x-2">
                            <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
                            <span className="text-purple-600">Filters applied</span>
                          </div>
                        )}
                        {deferredSearchQuery?.trim() && (
                          <div className="flex items-center space-x-2">
                            <div className="w-3 h-3 bg-blue-500 rounded-full animate-pulse"></div>
                            <span className="text-blue-600">Searching: "{deferredSearchQuery.trim()}"</span>
                          </div>
                        )}
                        {priceRangeLoaded && (
                          <div className="text-gray-400">
                            Range: BDT {dynamicMinPrice.toLocaleString()} - BDT {dynamicMaxPrice.toLocaleString()}
                          </div>
                        )}
                        <div className="text-xs text-gray-400">
                          Page {currentPage} of {totalPages || 1}
                        </div>
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
            <div className="absolute top-0 left-0 right-0 bg-white/90 backdrop-blur-sm z-10 flex items-center justify-center py-4 rounded-lg shadow-lg">
              <Loader2 size={24} className="animate-spin text-purple-600" />
              <span className="ml-2 text-purple-600 font-medium">
                {deferredSearchQuery?.trim() ? `Searching for "${deferredSearchQuery.trim()}"...` : 'Loading products...'}
              </span>
            </div>
          )}
          
          <AnimatePresence mode="wait">
            <motion.div
              key={`${currentPage}-${deferredSearchQuery}-${deferredPriceRange?.[0]}-${deferredPriceRange?.[1]}`}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.2, ease: "easeOut" }}
              className="grid grid-cols-1 sm:grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3 gap-8"
            >
              {loading && products.length === 0 ? (
                Array.from({ length: PRODUCTS_PER_PAGE }).map((_, i) => (
                  <ProductSkeleton key={`skeleton-${i}`} />
                ))
              ) : products.length === 0 ? (
                <div className="col-span-full text-center py-20">
                  <Package size={64} className="mx-auto text-gray-400 mb-4" />
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">
                    {hasActiveFilters ? 'No products found' : 'No products available'}
                  </h3>
                  <p className="text-gray-600 mb-4">
                    {deferredSearchQuery?.trim() 
                      ? `No results found for "${deferredSearchQuery.trim()}". Try different keywords or adjust your filters.`
                      : hasActiveFilters 
                        ? 'Try adjusting your filters or search terms' 
                        : 'Please check back later'
                    }
                  </p>
                  {hasActiveFilters && (
                    <button
                      onClick={handleClearFilters}
                      className="px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-all duration-200 transform hover:scale-105 shadow-lg"
                    >
                      Clear All Filters
                    </button>
                  )}
                </div>
              ) : (
                products.map((product, index) => (
                  <ProductCard
                    key={product?._id || `product-${index}`}
                    product={product}
                    onProductClick={handleProductClick}
                    onAddToCart={handleAddToCart}
                    onToggleFavorite={handleToggleFavorite}
                    isFavorite={isFavorite(product?._id)}
                    index={index + (currentPage - 1) * PRODUCTS_PER_PAGE}
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

      {/* Enhanced Custom CSS */}
      <style jsx>{`
        .slider-thumb {
          -webkit-appearance: none;
          pointer-events: none;
        }
        
        .slider-thumb::-webkit-slider-thumb {
          -webkit-appearance: none;
          height: 24px;
          width: 24px;
          background: linear-gradient(135deg, #7c3aed, #a855f7);
          border-radius: 50%;
          border: 3px solid white;
          box-shadow: 0 4px 8px rgba(124, 58, 237, 0.3), 0 2px 4px rgba(0,0,0,0.1);
          cursor: pointer;
          pointer-events: auto;
          transition: all 0.2s ease;
          transform: scale(1);
        }
        
        .slider-thumb::-webkit-slider-thumb:hover {
          transform: scale(1.1);
          box-shadow: 0 6px 12px rgba(124, 58, 237, 0.4), 0 4px 8px rgba(0,0,0,0.15);
        }
        
        .slider-thumb::-moz-range-thumb {
          height: 24px;
          width: 24px;
          background: linear-gradient(135deg, #7c3aed, #a855f7);
          border-radius: 50%;
          border: 3px solid white;
          box-shadow: 0 4px 8px rgba(124, 58, 237, 0.3), 0 2px 4px rgba(0,0,0,0.1);
          cursor: pointer;
          pointer-events: auto;
          transition: all 0.2s ease;
        }

        @keyframes shimmer {
          0% {
            background-position: -200% 0;
          }
          100% {
            background-position: 200% 0;
          }
        }

        .animate-shimmer {
          animation: shimmer 2s infinite linear;
        }

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
