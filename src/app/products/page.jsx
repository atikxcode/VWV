'use client'

import React, { 
  useState, 
  useEffect, 
  useCallback, 
  useMemo, 
  useRef,
  startTransition,
  useDeferredValue,
  useTransition,
  Suspense
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
  X,
  Star,
  Filter,
  ChevronDown
} from 'lucide-react';
import { useCart } from '../../../components/hooks/useCart';
import { useFavorites } from '../../../components/hooks/useFavorites';
import Loading from '../../../components/Loading';

// Enterprise-level configuration
const PRODUCTS_PER_PAGE = 12;
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes
const PREFETCH_DELAY = 100; // milliseconds

// Enhanced Performance Hooks
const usePerformanceObserver = () => {
  useEffect(() => {
    if (typeof window !== 'undefined' && 'PerformanceObserver' in window) {
      const observer = new PerformanceObserver((list) => {
        list.getEntries().forEach((entry) => {
          if (entry.entryType === 'largest-contentful-paint') {
            console.log('LCP:', entry.startTime);
          }
        });
      });
      observer.observe({ entryTypes: ['largest-contentful-paint'] });
      return () => observer.disconnect();
    }
  }, []);
};

const useImagePreloader = (images) => {
  useEffect(() => {
    if (images && images.length > 0) {
      const preloadImages = images.slice(0, 6);
      preloadImages.forEach((image, index) => {
        setTimeout(() => {
          const link = document.createElement('link');
          link.rel = 'preload';
          link.as = 'image';
          link.href = image.url;
          document.head.appendChild(link);
        }, index * 50);
      });
    }
  }, [images]);
};

// Product Skeleton
const ProductSkeleton = React.memo(() => (
  <div className="bg-white rounded-sm shadow-lg overflow-hidden max-w-sm mx-auto w-full">
    <div className="relative w-full h-80 bg-gradient-to-r from-gray-200 via-gray-300 to-gray-200 bg-[length:200%_100%] animate-shimmer-fast" />
    <div className="p-6 space-y-3">
      <div className="h-4 bg-gradient-to-r from-gray-200 via-gray-300 to-gray-200 bg-[length:200%_100%] animate-shimmer-fast rounded" />
      <div className="h-4 bg-gradient-to-r from-gray-200 via-gray-300 to-gray-200 bg-[length:200%_100%] animate-shimmer-fast rounded w-2/3" />
      <div className="h-6 bg-gradient-to-r from-gray-200 via-gray-300 to-gray-200 bg-[length:200%_100%] animate-shimmer-fast rounded w-1/3" />
    </div>
  </div>
));
ProductSkeleton.displayName = 'ProductSkeleton';

// Product Card
const ProductCard = React.memo(({ 
  product, 
  onProductClick, 
  onToggleFavorite, 
  isFavorite, 
  index = 0
}) => {
  const [imageLoaded, setImageLoaded] = useState(false);
  const [imageError, setImageError] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const cardRef = useRef(null);
  const [isInView, setIsInView] = useState(false);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsInView(true);
          observer.disconnect();
        }
      },
      { threshold: 0.1, rootMargin: '50px' }
    );
    if (cardRef.current) observer.observe(cardRef.current);
    return () => observer.disconnect();
  }, []);

  const hasValidImage = useMemo(() => {
    return product?.images && 
           product.images.length > 0 && 
           product.images[0]?.url && 
           product.images[0].url.trim() !== '';
  }, [product?.images]);

  const optimizedBlurDataURL = useMemo(() => 
    "data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSIjZjNmNGY2Ii8+PHRleHQgeD0iNTAlIiB5PSI1MCUiIGZvbnQtZmFtaWx5PSJBcmlhbCIgZm9udC1zaXplPSIxNCIgZmlsbD0iI2FhYSIgdGV4dC1hbmNob3I9Im1pZGRsZSIgZHk9Ii4zZW0iPkxvYWRpbmc8L3RleHQ+PC9zdmc+", 
    []
  );

  return (
    <motion.div
      ref={cardRef}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ 
        y: -4, 
        scale: 1.015,
        transition: { duration: 0.15 }
      }}
      className="bg-white rounded-sm shadow-lg overflow-hidden cursor-pointer group hover:shadow-xl transition-all duration-200 relative max-w-sm mx-auto w-full"
      onClick={() => onProductClick(product)}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <button
        onClick={(e) => onToggleFavorite(e, product)}
        className={`absolute top-3 right-3 z-10 p-2 rounded-full backdrop-blur-sm shadow-md transition-all duration-200 transform ${
          isHovered ? 'scale-110' : 'scale-100'
        } ${
          isFavorite 
            ? 'bg-purple-500 hover:bg-purple-600' 
            : 'bg-white/80 hover:bg-white'
        }`}
        aria-label={`${isFavorite ? 'Remove from' : 'Add to'} favorites`}
      >
        <Heart
          size={18}
          className={`${
            isFavorite 
              ? 'text-white fill-white' 
              : 'text-gray-400 hover:text-purple-500'
          } transition-colors duration-150`}
        />
      </button>

      <div className="relative w-full h-96 bg-gradient-to-br from-gray-50 to-gray-100 overflow-hidden">
        {hasValidImage && !imageError && isInView ? (
          <>
            {!imageLoaded && (
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="bg-gradient-to-r from-gray-200 via-gray-300 to-gray-200 bg-[length:200%_100%] animate-shimmer-fast w-full h-full" />
              </div>
            )}
            <Image
              src={product.images[0].url}
              alt={product.images[0]?.alt || product?.name || 'Product image'}
              fill
              sizes="(max-width: 640px) 100vw, (max-width: 768px) 50vw, (max-width: 1024px) 33vw, 25vw"
              className={`object-cover transition-all duration-300 transform ${
                isHovered ? 'scale-105' : 'scale-100'
              } ${imageLoaded ? 'opacity-100' : 'opacity-0'}`}
              priority={index < 4}
              loading={index < 8 ? "eager" : "lazy"}
              placeholder="blur"
              blurDataURL={optimizedBlurDataURL}
              quality={index < 3 ? 90 : 80}
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

      <div className="p-5 relative">
        <h3 className={`font-semibold text-gray-900 text-sm mb-2 line-clamp-2 transition-colors duration-150 ${
          isHovered ? 'text-purple-600' : ''
        }`}>
          {product?.name || 'Unnamed Product'}
        </h3>
        
        {product?.brand && (
          <p className={`text-gray-600 text-xs mb-3 transition-colors duration-150 ${
            isHovered ? 'text-purple-500' : ''
          }`}>
            {product.brand}
          </p>
        )}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="text-lg font-bold text-purple-600">
              BDT {(product?.price || 0).toLocaleString()}
            </div>
            {product?.comparePrice && product.comparePrice > product.price && (
              <div className="text-xs text-gray-400 line-through">
                BDT {product.comparePrice.toLocaleString()}
              </div>
            )}
          </div>
          
          {product?.rating && (
            <div className="flex items-center text-xs">
              <Star size={12} className="text-yellow-400 fill-current" />
              <span className="ml-1 text-gray-500">{product.rating}</span>
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

// Product Grid
const ProductGrid = React.memo(({ 
  products, 
  loading, 
  onProductClick, 
  onToggleFavorite, 
  isFavorite,
  hasActiveFilters,
  handleClearFilters,
  deferredSearchQuery
}) => {
  return (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    exit={{ opacity: 0, y: -20 }}
    transition={{ duration: 0.15, ease: "easeOut" }}
    className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3 gap-6"
  >
    {loading && products.length === 0 ? (
      <Loading />
    ) : products.length === 0 ? (
      <div className="col-span-full text-center py-16">
        <h3 className="text-xl font-semibold text-gray-900 mb-2">
          {hasActiveFilters ? 'No products found' : 'Loading...'}
        </h3>
        <p className="text-gray-600 mb-4 max-w-md mx-auto">
          {deferredSearchQuery?.trim()
            ? `No results for "${deferredSearchQuery.trim()}". Try different keywords.`
            : hasActiveFilters
            ? 'Try adjusting your filters or search terms'
            : 'Please Wait'
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
          onProductClick={onProductClick}
          onToggleFavorite={onToggleFavorite}
          isFavorite={isFavorite(product?._id)}
          index={index}
        />
      ))
    )}
  </motion.div>
  );
});
ProductGrid.displayName = 'ProductGrid';

// Pagination Controls
const PaginationControls = React.memo(({ 
  currentPage, 
  totalPages, 
  onPageChange, 
  loading 
}) => {
  const [isPending, startTransition] = useTransition();

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

  const handlePageChange = useCallback((page) => {
    startTransition(() => {
      onPageChange(page);
    });
  }, [onPageChange]);

  return (
    <div className="flex items-center justify-center space-x-2 mt-10">
      <button
        onClick={() => handlePageChange(currentPage - 1)}
        disabled={currentPage === 1 || loading || isPending}
        className="flex items-center px-4 py-2 text-sm font-medium text-gray-500 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 hover:text-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-150"
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
                onClick={() => handlePageChange(page)}
                disabled={loading || isPending}
                className={`px-3 py-2 text-sm font-medium rounded-lg transition-all duration-150 ${
                  currentPage === page
                    ? 'bg-purple-600 text-white shadow-md'
                    : 'text-gray-700 bg-white border border-gray-300 hover:bg-purple-50 hover:text-purple-700'
                } disabled:opacity-50`}
              >
                {page}
              </button>
            )}
          </React.Fragment>
        ))}
      </div>
      <button
        onClick={() => handlePageChange(currentPage + 1)}
        disabled={currentPage === totalPages || loading || isPending}
        className="flex items-center px-4 py-2 text-sm font-medium text-gray-500 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 hover:text-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-150"
      >
        Next
        <ChevronRight size={16} className="ml-1" />
      </button>
    </div>
  );
});
PaginationControls.displayName = 'PaginationControls';

// Main Component
function ProductsPageContent() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalProducts, setTotalProducts] = useState(0);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [selectedSubcategory, setSelectedSubcategory] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [initialized, setInitialized] = useState(false);

  // Category and subcategory states
  const [categories, setCategories] = useState({});
  const [subCategoryOptions, setSubCategoryOptions] = useState([]);
  const [categoriesLoading, setCategoriesLoading] = useState(false);

  // Add memoized categories to prevent dependency array instability
  const memoizedCategories = useMemo(() => categories, [JSON.stringify(categories)]);

  const [isPending, startTransition] = useTransition();
  const deferredSearchQuery = useDeferredValue(searchQuery);
  const deferredCategory = useDeferredValue(selectedCategory);
  const deferredSubcategory = useDeferredValue(selectedSubcategory);
  const deferredProducts = useDeferredValue(products);

  const abortControllerRef = useRef(null);
  const searchTimeoutRef = useRef(null);
  const prefetchCache = useRef(new Map());
  const urlUpdateTimeoutRef = useRef(null);

  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const { addToCart } = useCart();
  const { toggleFavorite, isFavorite } = useFavorites();

  usePerformanceObserver();
  useImagePreloader(deferredProducts?.slice(0, 6)?.map(p => p.images?.[0]).filter(Boolean));

  // Get auth headers for API calls
  const getAuthHeaders = () => {
    const token = localStorage.getItem('auth-token');
    return {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    };
  };

  const fetchWithCache = useCallback(async (url, options = {}) => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    abortControllerRef.current = new AbortController();
    const cacheKey = url + JSON.stringify(options);
    const cached = prefetchCache.current.get(cacheKey);
    if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
      return cached.data;
    }
    try {
      const response = await fetch(url, {
        ...options,
        signal: abortControllerRef.current.signal,
        headers: {
          'Accept-Encoding': 'gzip, deflate, br',
          ...options.headers
        }
      });
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data = await response.json();
      prefetchCache.current.set(cacheKey, {
        data,
        timestamp: Date.now()
      });
      if (prefetchCache.current.size > 100) {
        const oldestKey = [...prefetchCache.current.keys()][0];
        prefetchCache.current.delete(oldestKey);
      }
      return data;
    } catch (error) {
      if (error.name === 'AbortError') {
        return null;
      }
      throw error;
    }
  }, []);

  // Load categories on component mount
  useEffect(() => {
    const loadCategories = async () => {
      try {
        setCategoriesLoading(true);
        const categoriesResponse = await fetch('/api/products?getCategoriesOnly=true', {
          headers: getAuthHeaders()
        });
        
        if (categoriesResponse.ok) {
          const categoriesData = await categoriesResponse.json();
          setCategories(categoriesData.categories || {});
        } else {
          console.error('Failed to fetch categories');
        }
      } catch (error) {
        console.error('Error loading categories:', error);
      } finally {
        setCategoriesLoading(false);
      }
    };

    loadCategories();
  }, []);

  // Update subcategories when category changes - PROPERLY FIXED
  useEffect(() => {
    if (selectedCategory && memoizedCategories && Object.keys(memoizedCategories).length > 0) {
      const categoryKey = selectedCategory.toUpperCase();
      if (memoizedCategories[categoryKey]) {
        setSubCategoryOptions(memoizedCategories[categoryKey]);
      } else {
        setSubCategoryOptions([]);
      }
    } else {
      setSubCategoryOptions([]);
    }
  }, [selectedCategory, memoizedCategories]);

  const prefetchNextPage = useCallback(() => {
    if (currentPage < totalPages) {
      setTimeout(() => {
        const nextPageUrl = `/api/products?page=${currentPage + 1}&limit=${PRODUCTS_PER_PAGE}&status=active`;
        fetchWithCache(nextPageUrl).catch(() => {});
      }, PREFETCH_DELAY);
    }
  }, [currentPage, totalPages, fetchWithCache]);

  // Updated filtering logic for combined search
  const filterProducts = useCallback((products, filters) => {
    return products.filter(product => {
      // Category filter
      if (filters.category && product.category !== filters.category) {
        return false;
      }
      // Subcategory filter  
      if (filters.subcategory && product.subcategory !== filters.subcategory) {
        return false;
      }
      // Search filter - works within the selected category/subcategory context
      if (filters.search) {
        const searchLower = filters.search.toLowerCase();
        if (!product.name?.toLowerCase().includes(searchLower) &&
            !product.brand?.toLowerCase().includes(searchLower)) {
          return false;
        }
      }
      return true;
    });
  }, []);

  const fetchProducts = useCallback(async () => {
    setLoading(true);
    try {
      const queryParams = new URLSearchParams({
        status: 'active',
        page: currentPage.toString(),
        limit: PRODUCTS_PER_PAGE.toString(),
        ...(deferredSearchQuery?.trim() && { search: deferredSearchQuery.trim() }),
        ...(deferredCategory && { category: deferredCategory }),
        ...(deferredSubcategory && { subcategory: deferredSubcategory })
      });
      const data = await fetchWithCache(`/api/products?${queryParams}`);
      if (data) {
        let loadedProducts = data.products || [];
        // Apply client-side filtering for combined search functionality
        loadedProducts = filterProducts(loadedProducts, {
          search: deferredSearchQuery,
          category: deferredCategory,
          subcategory: deferredSubcategory
        });
        setProducts(loadedProducts);
        setTotalPages(data.pagination?.totalPages || (loadedProducts.length > 0 ? 1 : 0));
        setTotalProducts(data.pagination?.totalProducts || loadedProducts.length);
        prefetchNextPage();
      }
    } catch (error) {
      if (error?.name !== 'AbortError') {
        console.error('❌ Error fetching products:', error);
        setProducts([]);
        setTotalPages(0);
        setTotalProducts(0);
      }
    } finally {
      setLoading(false);
    }
  }, [currentPage, deferredSearchQuery, deferredCategory, deferredSubcategory, fetchWithCache, prefetchNextPage, filterProducts]);

  useEffect(() => {
    if (initialized) return;
    const page = parseInt(searchParams.get('page') || '1') || 1;
    const search = searchParams.get('search') || '';
    const category = searchParams.get('category') || '';
    const subcategory = searchParams.get('subcategory') || '';
    setCurrentPage(page);
    setSearchQuery(search);
    setSelectedCategory(category);
    setSelectedSubcategory(subcategory);
    setInitialized(true);
  }, [searchParams, initialized]);

  useEffect(() => {
    if (initialized) {
      fetchProducts();
    }
  }, [fetchProducts, initialized]);

  useEffect(() => {
    if (!initialized) return;
    if (urlUpdateTimeoutRef.current) {
      clearTimeout(urlUpdateTimeoutRef.current);
    }
    urlUpdateTimeoutRef.current = setTimeout(() => {
      const params = new URLSearchParams();
      if (deferredSearchQuery?.trim()) {
        params.set('search', deferredSearchQuery);
      }
      if (deferredCategory) {
        params.set('category', deferredCategory);
      }
      if (deferredSubcategory) {
        params.set('subcategory', deferredSubcategory);
      }
      if (currentPage > 1) {
        params.set('page', currentPage.toString());
      }
      const newUrl = `${pathname}${params.toString() ? `?${params.toString()}` : ''}`;
      const currentUrl = window.location.pathname + window.location.search;
      if (currentUrl !== newUrl) {
        router.replace(newUrl, { scroll: false });
      }
    }, 50);
    return () => {
      if (urlUpdateTimeoutRef.current) {
        clearTimeout(urlUpdateTimeoutRef.current);
      }
    };
  }, [deferredSearchQuery, deferredCategory, deferredSubcategory, currentPage, pathname, router, initialized]);

  const handleProductClick = useCallback((product) => {
    if (product?._id) {
      router.prefetch(`/products/${product._id}`);
      router.push(`/products/${product._id}`);
    }
  }, [router]);

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
    startTransition(() => {
      setSearchQuery(value);
      if (currentPage !== 1) {
        setCurrentPage(1);
      }
    });
  }, [currentPage]);

  const handleClearSearch = useCallback(() => {
    startTransition(() => {
      setSearchQuery('');
      if (currentPage !== 1) {
        setCurrentPage(1);
      }
    });
  }, [currentPage]);

  const handleCategoryChange = useCallback((e) => {
    const value = e.target.value;
    startTransition(() => {
      setSelectedCategory(value);
      setSelectedSubcategory(''); // Reset subcategory when category changes
      if (currentPage !== 1) {
        setCurrentPage(1);
      }
    });
  }, [currentPage]);

  const handleSubcategoryChange = useCallback((e) => {
    const value = e.target.value;
    startTransition(() => {
      setSelectedSubcategory(value);
      if (currentPage !== 1) {
        setCurrentPage(1);
      }
    });
  }, [currentPage]);

  const handleClearFilters = useCallback(() => {
    startTransition(() => {
      setSearchQuery('');
      setSelectedCategory('');
      setSelectedSubcategory('');
      setCurrentPage(1);
    });
  }, []);

  // Memo Fallback for filters
  const hasActiveFilters = useMemo(() => {
    return (deferredSearchQuery?.trim() || '') !== '' || 
           deferredCategory !== '' || 
           deferredSubcategory !== '';
  }, [deferredSearchQuery, deferredCategory, deferredSubcategory]);

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
    <div className="min-h-screen">
      <div className="max-w-7xl mx-auto px-4 py-6">
        {/* Header Section */}
        <div className="mb-6">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 mb-6">
            <div className="flex flex-col sm:flex-row gap-4 lg:ml-auto">
              {/* Combined Category + Search Field - Matching Your Image Design */}
              <div className="flex border border-gray-300 rounded-lg overflow-hidden bg-white shadow-sm max-w-2xl w-full">
                {/* Category Dropdown */}
                <div className="relative">
                  <select
                    value={selectedCategory}
                    onChange={handleCategoryChange}
                    className="appearance-none pl-4 pr-8 py-3 bg-gray-50 border-r border-gray-300 text-gray-700 font-medium focus:outline-none focus:bg-white transition-all duration-150 cursor-pointer min-w-[160px]"
                    disabled={categoriesLoading}
                  >
                    <option value="">All Categories</option>
                    {Object.keys(memoizedCategories).map(cat => (
                      <option key={cat} value={cat}>
                        {cat}
                      </option>
                    ))}
                  </select>
                  <ChevronDown size={16} className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-500 pointer-events-none" />
                </div>

                {/* Subcategory Dropdown - Only show when category is selected */}
                {selectedCategory && subCategoryOptions.length > 0 && (
                  <div className="relative">
                    <select
                      value={selectedSubcategory}
                      onChange={handleSubcategoryChange}
                      className="appearance-none pl-4 pr-8 py-3 bg-gray-50 border-r border-gray-300 text-gray-700 font-medium focus:outline-none focus:bg-white transition-all duration-150 cursor-pointer min-w-[160px]"
                    >
                      <option value="">All Subcategories</option>
                      {subCategoryOptions.map(option => (
                        <option key={option} value={option}>
                          {option}
                        </option>
                      ))}
                    </select>
                    <ChevronDown size={16} className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-500 pointer-events-none" />
                  </div>
                )}

                {/* Search Input */}
                <div className="flex-1 relative">
                  <input
                    type="text"
                    placeholder={
                      selectedCategory && selectedSubcategory 
                        ? `Search in ${selectedCategory} > ${selectedSubcategory}...`
                        : selectedCategory 
                        ? `Search in ${selectedCategory}...`
                        : "Search here"
                    }
                    value={searchQuery}
                    onChange={handleSearchChange}
                    className="w-full px-4 py-3 focus:outline-none text-gray-700 placeholder-gray-400"
                  />
                  
                  {/* Search Icon or Clear Button */}
                  <div className="absolute right-3 top-1/2 transform -translate-y-1/2 flex items-center">
                    {isPending && (
                      <Loader2 size={18} className="animate-spin text-purple-500 mr-2" />
                    )}
                    {searchQuery ? (
                      <button
                        onClick={handleClearSearch}
                        className="text-gray-400 hover:text-gray-600 transition-colors p-1"
                        type="button"
                      >
                        <X size={18} />
                      </button>
                    ) : (
                      <Search size={18} className="text-gray-400" />
                    )}
                  </div>
                </div>
              </div>

              {/* Clear Filters Button */}
              {hasActiveFilters && (
                <button
                  onClick={handleClearFilters}
                  className="flex items-center px-4 py-3 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-all duration-150 whitespace-nowrap"
                >
                  <X size={16} className="mr-1" />
                  Clear All
                </button>
              )}
            </div>
          </div>
        </div>
        
        {/* Products Grid */}
        <div className="relative">
          {loading && (
            <div className="absolute top-0 left-0 right-0 bg-white/80 backdrop-blur-sm z-10 flex items-center justify-center py-4 rounded-lg">
              <Loader2 size={24} className="animate-spin text-purple-600" />
              <span className="ml-2 text-purple-600 font-medium">
                {deferredSearchQuery?.trim() ? `Searching for "${deferredSearchQuery.trim()}"...` : 'Loading products...'}
              </span>
            </div>
          )}

          <AnimatePresence mode="wait">
            <ProductGrid
              key="product-grid"
              products={deferredProducts}
              loading={loading}
              onProductClick={handleProductClick}
              onToggleFavorite={handleToggleFavorite}
              isFavorite={isFavorite}
              hasActiveFilters={hasActiveFilters}
              handleClearFilters={handleClearFilters}
              deferredSearchQuery={deferredSearchQuery}
            />
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
      
      <style jsx>{`
        .slider-thumb {
          -webkit-appearance: none;
          pointer-events: none;
        }
        .slider-thumb::-webkit-slider-thumb {
          -webkit-appearance: none;
          height: 22px;
          width: 22px;
          background: linear-gradient(135deg, #7c3aed, #a855f7);
          border-radius: 50%;
          border: 2px solid white;
          box-shadow: 0 2px 8px rgba(124, 58, 237, 0.3);
          cursor: pointer;
          pointer-events: auto;
          transition: all 0.15s ease;
          will-change: transform, box-shadow;
        }
        .slider-thumb::-webkit-slider-thumb:hover {
          transform: scale(1.1);
          box-shadow: 0 4px 12px rgba(124, 58, 237, 0.4);
        }
        @keyframes shimmer-fast {
          0% { background-position: -200% 0; }
          100% { background-position: 200% 0; }
        }
        .animate-shimmer-fast {
          animation: shimmer-fast 1.5s infinite linear;
          will-change: background-position;
        }
        .line-clamp-2 {
          display: -webkit-box;
          -webkit-line-clamp: 2;
          -webkit-box-orient: vertical;
          overflow: hidden;
        }
        * {
          -webkit-font-smoothing: antialiased;
          -moz-osx-font-smoothing: grayscale;
        }
        .transition-all {
          will-change: transform, opacity, box-shadow;
        }
      `}</style>
    </div>
  );
}

export default function ProductsPage() {
  return (
    <Suspense fallback={<Loading />}>
      <ProductsPageContent />
    </Suspense>
  );
}
