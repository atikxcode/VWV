'use client'

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { motion } from 'framer-motion';
import { 
  Package, 
  Heart, 
  Star,
  Loader2,
  ArrowRight
} from 'lucide-react';
import { useFavorites } from './hooks/useFavorites';

// Configuration
const DEFAULT_PRODUCTS_COUNT = 16; // Products to display
const FETCH_POOL_SIZE = 100; // Fetch larger pool for true randomness

// Product Card Component (Optimized for Carousel)
const FeaturedProductCard = React.memo(({ 
  product, 
  onProductClick, 
  onToggleFavorite, 
  isFavorite,
  index = 0
}) => {
  const [imageLoaded, setImageLoaded] = useState(false);
  const [imageError, setImageError] = useState(false);
  const [isHovered, setIsHovered] = useState(false);

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
    <div
      className="flex-shrink-0 w-80 bg-white rounded-lg shadow-lg overflow-hidden cursor-pointer group hover:shadow-2xl transition-all duration-300 relative mx-3"
      onClick={() => onProductClick(product)}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Favorite Button */}
      <button
        onClick={(e) => onToggleFavorite(e, product)}
        className={`absolute top-3 right-3 z-10 p-2.5 rounded-full backdrop-blur-md shadow-lg transition-all duration-200 transform ${
          isHovered ? 'scale-110' : 'scale-100'
        } ${
          isFavorite 
            ? 'bg-purple-500 hover:bg-purple-600' 
            : 'bg-white/90 hover:bg-white'
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

      {/* Product Image */}
      <div className="relative w-full h-72 bg-gradient-to-br from-gray-50 to-gray-100 overflow-hidden">
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
              sizes="320px"
              className={`object-cover transition-all duration-500 transform ${
                isHovered ? 'scale-110' : 'scale-100'
              } ${imageLoaded ? 'opacity-100' : 'opacity-0'}`}
              priority={index < 4}
              loading={index < 4 ? "eager" : "lazy"}
              placeholder="blur"
              blurDataURL={optimizedBlurDataURL}
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
      <div className="p-5">
        <h3 className={`font-semibold text-gray-900 text-base mb-2 line-clamp-2 transition-colors duration-150 ${
          isHovered ? 'text-purple-600' : ''
        }`}>
          {product?.name || 'Unnamed Product'}
        </h3>
        
        {product?.brand && (
          <p className={`text-gray-500 text-sm mb-3 transition-colors duration-150 ${
            isHovered ? 'text-purple-500' : ''
          }`}>
            {product.brand}
          </p>
        )}

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="text-xl font-bold text-purple-600">
              BDT {(product?.price || 0).toLocaleString()}
            </div>
            {product?.comparePrice && product.comparePrice > product.price && (
              <div className="text-sm text-gray-400 line-through">
                BDT {product.comparePrice.toLocaleString()}
              </div>
            )}
          </div>
          
          {product?.rating && (
            <div className="flex items-center text-sm">
              <Star size={14} className="text-yellow-400 fill-current" />
              <span className="ml-1 text-gray-600 font-medium">{product.rating}</span>
            </div>
          )}
        </div>
      </div>

      {/* Hover Overlay */}
      <div className={`absolute inset-0 bg-purple-600/5 transition-opacity duration-300 pointer-events-none ${
        isHovered ? 'opacity-100' : 'opacity-0'
      }`} />
    </div>
  );
}, (prevProps, nextProps) => {
  return (
    prevProps.product?._id === nextProps.product?._id &&
    prevProps.isFavorite === nextProps.isFavorite &&
    prevProps.product?.price === nextProps.product?.price
  );
});
FeaturedProductCard.displayName = 'FeaturedProductCard';

// Skeleton Loader
const FeaturedProductSkeleton = React.memo(() => (
  <div className="flex-shrink-0 w-80 bg-white rounded-lg shadow-lg overflow-hidden mx-3">
    <div className="relative w-full h-72 bg-gradient-to-r from-gray-200 via-gray-300 to-gray-200 bg-[length:200%_100%] animate-shimmer" />
    <div className="p-5 space-y-3">
      <div className="h-5 bg-gradient-to-r from-gray-200 via-gray-300 to-gray-200 bg-[length:200%_100%] animate-shimmer rounded" />
      <div className="h-4 bg-gradient-to-r from-gray-200 via-gray-300 to-gray-200 bg-[length:200%_100%] animate-shimmer rounded w-2/3" />
      <div className="h-6 bg-gradient-to-r from-gray-200 via-gray-300 to-gray-200 bg-[length:200%_100%] animate-shimmer rounded w-1/2" />
    </div>
  </div>
));
FeaturedProductSkeleton.displayName = 'FeaturedProductSkeleton';

// Infinite Scrolling Row Component
const InfiniteScrollRow = React.memo(({ 
  products, 
  direction = 'left',
  onProductClick,
  onToggleFavorite,
  isFavorite 
}) => {
  const [isPaused, setIsPaused] = useState(false);

  // Duplicate products for seamless loop
  const duplicatedProducts = [...products, ...products];

  return (
    <div 
      className="relative w-full overflow-hidden"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
    >
      <div 
        className="flex"
        style={{
          animation: `${direction === 'left' ? 'scroll-left' : 'scroll-right'} 40s linear infinite`,
          animationPlayState: isPaused ? 'paused' : 'running'
        }}
      >
        {duplicatedProducts.map((product, index) => (
          <FeaturedProductCard
            key={`${product._id}-${index}`}
            product={product}
            onProductClick={onProductClick}
            onToggleFavorite={onToggleFavorite}
            isFavorite={isFavorite(product._id)}
            index={index}
          />
        ))}
      </div>
    </div>
  );
});
InfiniteScrollRow.displayName = 'InfiniteScrollRow';

// Main Featured Products Component
export default function FeaturedProducts({ 
  title = "Featured Products",
  subtitle = "Discover our handpicked selection",
  count = DEFAULT_PRODUCTS_COUNT,
  showViewAll = true,
  category = null,
  subcategory = null
}) {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const router = useRouter();
  const { toggleFavorite, isFavorite } = useFavorites();

  // Get auth headers
  const getAuthHeaders = useCallback(() => {
    const token = localStorage.getItem('auth-token');
    return {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    };
  }, []);

  // Fetch random products from a larger pool
  const fetchFeaturedProducts = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      // Fetch a larger pool of products for better randomness
      const queryParams = new URLSearchParams({
        status: 'active',
        limit: FETCH_POOL_SIZE.toString(), // Fetch 100 products
        ...(category && { category }),
        ...(subcategory && { subcategory })
      });

      const response = await fetch(`/api/products?${queryParams}`, {
        headers: getAuthHeaders()
      });

      if (!response.ok) {
        throw new Error('Failed to fetch products');
      }

      const data = await response.json();
      let fetchedProducts = data.products || [];

      // If we have fewer products than the pool size, work with what we have
      const availableProducts = fetchedProducts.length;
      
      // Shuffle the entire pool and select random products
      const shuffled = fetchedProducts
        .sort(() => Math.random() - 0.5) // Shuffle all fetched products
        .slice(0, Math.min(count, availableProducts)); // Take only what we need

      setProducts(shuffled);
    } catch (err) {
      console.error('Error fetching featured products:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [count, category, subcategory, getAuthHeaders]);

  useEffect(() => {
    fetchFeaturedProducts();
  }, [fetchFeaturedProducts]);

  // Handle product click
  const handleProductClick = useCallback((product) => {
    if (product?._id) {
      router.push(`/products/${product._id}`);
    }
  }, [router]);

  // Handle favorite toggle
  const handleToggleFavorite = useCallback((e, product) => {
    e.stopPropagation();
    if (product?._id) {
      toggleFavorite(product);
    }
  }, [toggleFavorite]);

  // Handle view all
  const handleViewAll = useCallback(() => {
    const params = new URLSearchParams();
    if (category) params.set('category', category);
    if (subcategory) params.set('subcategory', subcategory);
    
    router.push(`/products${params.toString() ? `?${params.toString()}` : ''}`);
  }, [router, category, subcategory]);

  // Split products into two rows
  const firstRowProducts = useMemo(() => {
    return products.slice(0, Math.ceil(products.length / 2));
  }, [products]);

  const secondRowProducts = useMemo(() => {
    return products.slice(Math.ceil(products.length / 2));
  }, [products]);

  // Error state
  if (error) {
    return (
      <section className="py-12 bg-gradient-to-b from-white to-gray-50">
        <div className="max-w-7xl mx-auto px-4">
          <div className="text-center py-12">
            <p className="text-red-500 mb-4">Failed to load featured products</p>
            <button 
              onClick={fetchFeaturedProducts}
              className="px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors duration-200"
            >
              Try Again
            </button>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="py-16 bg-gradient-to-b from-white to-gray-50 overflow-hidden">
      {/* Section Header - Center Aligned */}
      <div className="max-w-7xl mx-auto px-4 mb-10">
        <div className="text-center">
          <motion.h2 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-3xl md:text-4xl font-bold text-gray-900 mb-2"
          >
            {title}
          </motion.h2>
          {subtitle && (
            <motion.p 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="text-gray-600 text-lg"
            >
              {subtitle}
            </motion.p>
          )}
        </div>
      </div>

      {/* Carousel Container */}
      <div className="space-y-6">
        {loading ? (
          <div className="space-y-6">
            {/* Loading Skeleton Row 1 */}
            <div className="flex gap-0 overflow-hidden">
              {[...Array(5)].map((_, index) => (
                <FeaturedProductSkeleton key={`skeleton-1-${index}`} />
              ))}
            </div>
            {/* Loading Skeleton Row 2 */}
            <div className="flex gap-0 overflow-hidden">
              {[...Array(5)].map((_, index) => (
                <FeaturedProductSkeleton key={`skeleton-2-${index}`} />
              ))}
            </div>
          </div>
        ) : products.length === 0 ? (
          <div className="text-center py-16">
            <Package size={64} className="mx-auto text-gray-300 mb-4" />
            <h3 className="text-xl font-semibold text-gray-900 mb-2">
              No Products Available
            </h3>
            <p className="text-gray-600">
              Check back soon for featured products
            </p>
          </div>
        ) : (
          <>
            {/* First Row - Scrolling Left to Right */}
            {firstRowProducts.length > 0 && (
              <InfiniteScrollRow
                products={firstRowProducts}
                direction="right"
                onProductClick={handleProductClick}
                onToggleFavorite={handleToggleFavorite}
                isFavorite={isFavorite}
              />
            )}

            {/* Second Row - Scrolling Right to Left */}
            {secondRowProducts.length > 0 && (
              <InfiniteScrollRow
                products={secondRowProducts}
                direction="left"
                onProductClick={handleProductClick}
                onToggleFavorite={handleToggleFavorite}
                isFavorite={isFavorite}
              />
            )}
          </>
        )}
      </div>

      {/* View All Button - Bottom Center */}
      {showViewAll && !loading && products.length > 0 && (
        <div className="flex justify-center mt-12">
          <motion.button
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            onClick={handleViewAll}
            className="flex items-center gap-2 px-8 py-4 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:scale-105 group"
          >
            <span className="font-medium text-lg">View All Products</span>
            <ArrowRight size={20} className="group-hover:translate-x-1 transition-transform duration-200" />
          </motion.button>
        </div>
      )}

      <style jsx>{`
        @keyframes scroll-left {
          0% {
            transform: translateX(0);
          }
          100% {
            transform: translateX(-50%);
          }
        }

        @keyframes scroll-right {
          0% {
            transform: translateX(-50%);
          }
          100% {
            transform: translateX(0);
          }
        }

        @keyframes shimmer {
          0% { background-position: -200% 0; }
          100% { background-position: 200% 0; }
        }

        .animate-shimmer {
          animation: shimmer 2s infinite linear;
          will-change: background-position;
        }

        .line-clamp-2 {
          display: -webkit-box;
          -webkit-line-clamp: 2;
          -webkit-box-orient: vertical;
          overflow: hidden;
        }

        /* Smooth animation performance */
        @media (prefers-reduced-motion: no-preference) {
          .flex {
            will-change: transform;
          }
        }
      `}</style>
    </section>
  );
}
