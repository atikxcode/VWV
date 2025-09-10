'use client'
import React, { useState, useEffect } from 'react'
import { Heart, ShoppingCart, Package, Eye, BarChart3 } from 'lucide-react'

export default function ProductsPage() {
  const [products, setProducts] = useState([])
  const [loading, setLoading] = useState(true)
  const [wishlist, setWishlist] = useState(new Set())

  useEffect(() => {
    fetchProducts()
  }, [])

  const fetchProducts = async () => {
    try {
      const response = await fetch('/api/products')
      if (response.ok) {
        const data = await response.json()
        setProducts(data.products || [])
      }
    } catch (error) {
      console.error('Error fetching products:', error)
    } finally {
      setLoading(false)
    }
  }

  const toggleWishlist = (productId) => {
    const newWishlist = new Set(wishlist)
    if (newWishlist.has(productId)) {
      newWishlist.delete(productId)
    } else {
      newWishlist.add(productId)
    }
    setWishlist(newWishlist)
  }

  const handleAddToCart = (productId) => {
    console.log('Added to cart:', productId)
    // Add actual cart logic here
  }

  const handleViewDetails = (productId) => {
    console.log('View details:', productId)
    // Add navigation logic here
  }

  const handleCompare = (productId) => {
    console.log('Compare product:', productId)
    // Add compare logic here
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-900 to-indigo-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto mb-4"></div>
          <p className="text-white">Loading premium vape collection...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen ">
      {/* Header */}
      <div className="shadow-lg text-black">
        <div className="max-w-7xl mx-auto px-4 py-8">
          <h1 className="text-4xl font-bold text-black text-center tracking-wide">
            OUR <span className="text-black">PRODUCTS</span>
          </h1>
          <p className="text-black text-center mt-2">
            Explore our elite vaping essentials
          </p>
        </div>
      </div>

      {/* Products Grid */}
      <div className="max-w-7xl mx-auto px-4 py-8">
        {products.length === 0 ? (
          <div className="text-center py-12">
            <Package size={64} className="mx-auto text-gray-400 mb-4" />
            <h3 className="text-xl font-semibold text-white mb-2">No products found</h3>
            <p className="text-gray-300">New arrivals coming soon!</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
            {products.map((product) => {
              const isOnSale = product.comparePrice && product.comparePrice > product.price
              const discountPercentage = isOnSale 
                ? Math.round(((product.comparePrice - product.price) / product.comparePrice) * 100)
                : 0

              const stockEntries = Object.entries(product.stock || {})
                .filter(([key, value]) => key.endsWith('_stock'))

              return (
                <div
                  key={product._id}
                  className="relative bg-purple-50 rounded-xl shadow-2xl hover:shadow-neon transition-all duration-500 overflow-hidden group cursor-pointer"
                  style={{ minHeight: '480px' }}
                  aria-label={`Product card for ${product.name}`}
                >
                  {/* Sale Badge with Neon Effect */}
                  {isOnSale && (
                    <div className="absolute top-4 right-4 z-10">
                      <span className="bg-neon-orange text-black text-xs font-bold px-3 py-1 rounded-full shadow-glow">
                        {discountPercentage}% OFF
                      </span>
                    </div>
                  )}

                  {/* Product Image Container with Tilt and Vapor Effect */}
                  <div className="relative h-72  p-6 overflow-hidden">
                    {product.images && product.images[0] ? (
                      <img
                        src={product.images[0].url}
                        alt={product.name}
                        className="w-full h-full object-contain transform group-hover:scale-105 transition-transform duration-300"
                        loading="lazy"
                      />
                    ) : (
                      <div className="w-[100%] h-full flex items-center justify-center">
                        <Package size={48} className="text-gray-500" />
                      </div>
                    )}

                    {/* Vapor Particle Effect on Hover */}
                    <div className="absolute inset-0 opacity-0 group-hover:opacity-30 transition-opacity duration-300 bg-gradient-to-t from-neon-purple to-transparent animate-vapor"></div>

                    {/* Action Icons with Slide-Up Animation */}
                    <div className="absolute bottom-0 left-0 right-0 bg-black bg-opacity-80 py-3 flex justify-center space-x-8 opacity-0 group-hover:opacity-100 group-hover:translate-y-0 transform translate-y-full transition-all duration-300">
                      <button
                        onClick={() => toggleWishlist(product._id)}
                        className={`p-2 rounded-full transition-colors ${wishlist.has(product._id) ? 'text-neon-red' : 'text-gray-300 hover:text-neon-red'}`}
                        title="Add to Wishlist"
                        aria-pressed={wishlist.has(product._id)}
                      >
                        <Heart size={20} fill={wishlist.has(product._id) ? 'currentColor' : 'none'} />
                      </button>
                      <button
                        onClick={() => handleCompare(product._id)}
                        className="p-2 text-gray-300 hover:text-neon-orange transition-colors rounded-full"
                        title="Compare"
                      >
                        <BarChart3 size={20} />
                      </button>
                      <button
                        onClick={() => handleViewDetails(product._id)}
                        className="p-2 text-gray-300 hover:text-neon-purple transition-colors rounded-full"
                        title="Quick View"
                      >
                        <Eye size={20} />
                      </button>
                    </div>
                  </div>

                  {/* Product Details */}
                  <div className="p-5 text-center">
                    {/* Brand */}
                    {product.brand && (
                      <div className="mb-1">
                        <span className="text-sm text-black uppercase tracking-widest">
                          {product.brand}
                        </span>
                      </div>
                    )}
                    
                    {/* Product Name */}
                    <h3 className="text-xl font-semibold text-black mb-2 hover:text-neon-purple transition-colors cursor-pointer">
                      {product.name}
                    </h3>

                    {/* Description */}
                    {product.description && (
                      <p className="text-sm text-black mb-4 line-clamp-2">
                        {product.description.length > 80 
                          ? product.description.slice(0, 80) + '...' 
                          : product.description
                        }
                      </p>
                    )}

                    {/* Stock Info as Progress Bars */}
                    <div className="mb-4 text-xs text-black">
                      {stockEntries.map(([branch, quantity]) => (
                        <div key={branch} className="mb-2">
                          <span className="capitalize block text-left">
                            {branch.replace('_stock', '')}:
                          </span>
                          <div className="w-full bg-gray-700 rounded-full h-1.5">
                            <div 
                              className={`bg-${quantity > 0 ? 'neon-green' : 'red-600'} h-1.5 rounded-full`}
                              style={{ width: `${Math.min(quantity / 10 * 100, 100)}%` }} // Assuming max stock 10 for demo
                            ></div>
                          </div>
                          <span className={quantity > 0 ? 'text-neon-green' : 'text-red-500'}>
                            {quantity > 0 ? `${quantity} in stock` : 'Out of stock'}
                          </span>
                        </div>
                      ))}
                    </div>

                    {/* Price */}
                    <div className="mb-4">
                      <div className="flex items-center justify-center gap-2">
                        <span className="text-2xl font-bold text-black">
                          ৳{product.price.toLocaleString()}
                        </span>
                        {isOnSale && (
                          <span className="text-sm text-gray-500 line-through">
                            ৳{product.comparePrice.toLocaleString()}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Quick Add to Cart Button */}
                    <button 
                      onClick={() => handleAddToCart(product._id)}
                      className="w-full py-3 text-sm font-medium text-black bg-neon-purple hover:bg-neon-purple-dark transition-colors tracking-wider rounded-b-xl"
                    >
                      ADD TO CART
                    </button>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
