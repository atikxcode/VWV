'use client'

import { useState, useEffect, useContext } from 'react'
import { motion } from 'framer-motion'
import {
  Search,
  Filter,
  Package,
  Edit,
  Eye,
  Plus,
  Grid,
  List,
  ChevronDown,
  Store,
  Tag,
} from 'lucide-react'
import EditProduct from '../../../../components/EditProduct'
import Swal from 'sweetalert2'
import { AuthContext } from '../../../../Provider/AuthProvider'

export default function ManageProductModerator() {
  // 🔥 GET USER FROM AUTH CONTEXT
  const { user } = useContext(AuthContext)

  const [products, setProducts] = useState([])
  const [categories, setCategories] = useState({})
  const [loading, setLoading] = useState(true)
  const [userLoading, setUserLoading] = useState(true)
  const [currentView, setCurrentView] = useState('list') // 'list' or 'edit'
  const [editingProductId, setEditingProductId] = useState(null)

  // 🔒 MODERATOR INFO FROM DATABASE
  const [moderatorBranch, setModeratorBranch] = useState(null)
  const [moderatorRole, setModeratorRole] = useState(null)

  // Filters (no branch filter for moderator)
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('')
  const [selectedSubcategory, setSelectedSubcategory] = useState('')
  const [selectedStatus, setSelectedStatus] = useState('')

  // Pagination
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const itemsPerPage = 12

  // 🔥 Fetch user details from database to get role and branch
  useEffect(() => {
    const fetchUserDetails = async () => {
      if (!user?.email) {
        setUserLoading(false)
        return
      }

      try {
        setUserLoading(true)
        const response = await fetch(
          `/api/user?email=${encodeURIComponent(user.email)}`
        )
        if (response.ok) {
          const data = await response.json()
          if (data.user) {
            setModeratorRole(data.user.role)
            setModeratorBranch(data.user.branch)
            console.log('Moderator Details:', {
              email: data.user.email,
              role: data.user.role,
              branch: data.user.branch,
            })
          }
        } else {
          console.error('Failed to fetch user details')
          Swal.fire({
            icon: 'error',
            title: 'Error',
            text: 'Failed to load user details',
          })
        }
      } catch (error) {
        console.error('Error fetching user details:', error)
        Swal.fire({
          icon: 'error',
          title: 'Error',
          text: 'Error loading user information',
        })
      } finally {
        setUserLoading(false)
      }
    }

    fetchUserDetails()
  }, [user])

  // Load initial data (categories and products)
  useEffect(() => {
    if (!moderatorBranch) return // Wait for user details to load

    const loadData = async () => {
      try {
        setLoading(true)

        // Fetch categories
        const categoriesRes = await fetch(
          '/api/products?getCategoriesOnly=true'
        )
        if (categoriesRes.ok) {
          const categoriesData = await categoriesRes.json()
          setCategories(categoriesData.categories || {})
        }

        // Fetch products
        fetchProducts()
      } catch (error) {
        console.error('Error loading data:', error)
      }
    }

    loadData()
  }, [moderatorBranch]) // Depend on moderatorBranch

  // Fetch products with filters (no branch filtering for moderator)
  const fetchProducts = async () => {
    if (!moderatorBranch) return

    try {
      const params = new URLSearchParams({
        limit: itemsPerPage.toString(),
        page: currentPage.toString(),
      })

      if (searchTerm) params.append('search', searchTerm)
      if (selectedCategory) params.append('category', selectedCategory)
      if (selectedSubcategory) params.append('subcategory', selectedSubcategory)
      if (selectedStatus) params.append('status', selectedStatus)

      const response = await fetch(`/api/products?${params}`)
      if (response.ok) {
        const data = await response.json()
        setProducts(data.products || [])
        setTotalPages(data.pagination?.totalPages || 1)
      }
    } catch (error) {
      console.error('Error fetching products:', error)
    } finally {
      setLoading(false)
    }
  }

  // Apply filters
  useEffect(() => {
    if (moderatorBranch) {
      setCurrentPage(1)
      fetchProducts()
    }
  }, [
    searchTerm,
    selectedCategory,
    selectedSubcategory,
    selectedStatus,
    moderatorBranch,
  ])

  useEffect(() => {
    if (moderatorBranch) {
      fetchProducts()
    }
  }, [currentPage, moderatorBranch])

  // Handle edit product
  const handleEditProduct = (productId) => {
    setEditingProductId(productId)
    setCurrentView('edit')
  }

  // Handle back from edit with proper refresh
  const handleBackFromEdit = async () => {
    setCurrentView('list')
    setEditingProductId(null)

    setLoading(true)

    // Small delay to ensure backend has processed changes
    setTimeout(async () => {
      await fetchProducts() // Refresh the list to get updated images
      setLoading(false)
    }, 300)
  }

  // Show loading if user data is still loading
  if (userLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 via-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading user information...</p>
        </div>
      </div>
    )
  }

  // Check if user is moderator
  if (moderatorRole !== 'moderator') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 via-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center">
          <Package size={64} className="mx-auto text-red-500 mb-4" />
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            Access Denied
          </h1>
          <p className="text-gray-600">
            You need moderator privileges to access this page.
          </p>
        </div>
      </div>
    )
  }

  // Show edit view
  if (currentView === 'edit' && editingProductId) {
    return (
      <EditProduct productId={editingProductId} onBack={handleBackFromEdit} />
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-blue-50 to-indigo-100 p-4">
      <div className="max-w-7xl mx-auto">
        {/* Header with Moderator Badge */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2 flex items-center gap-3">
            Product Management
            <span className="text-sm bg-orange-100 text-orange-800 px-3 py-1 rounded-full font-medium">
              Moderator
            </span>
          </h1>
          <p className="text-gray-600">
            Managing products for{' '}
            <strong className="capitalize">{moderatorBranch}</strong> branch
          </p>
        </div>

        {/* Filters (No Branch Filter) */}
        <div className="bg-white rounded-2xl shadow-lg p-6 mb-8">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
            {/* Search */}
            <div className="relative">
              <Search
                size={20}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
              />
              <input
                type="text"
                placeholder="Search products..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-3 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-purple-500"
              />
            </div>

            {/* Category Filter */}
            <select
              value={selectedCategory}
              onChange={(e) => {
                setSelectedCategory(e.target.value)
                setSelectedSubcategory('')
              }}
              className="w-full p-3 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-purple-500"
            >
              <option value="">All Categories</option>
              {Object.keys(categories).map((category) => (
                <option key={category} value={category}>
                  {category}
                </option>
              ))}
            </select>

            {/* Subcategory Filter */}
            <select
              value={selectedSubcategory}
              onChange={(e) => setSelectedSubcategory(e.target.value)}
              disabled={!selectedCategory}
              className="w-full p-3 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-purple-500 disabled:opacity-50"
            >
              <option value="">All Subcategories</option>
              {selectedCategory &&
                categories[selectedCategory]?.map((subcategory) => (
                  <option key={subcategory} value={subcategory}>
                    {subcategory}
                  </option>
                ))}
            </select>

            {/* Status Filter */}
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="w-full p-3 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-purple-500"
            >
              <option value="">All Status</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </select>
          </div>

          <div className="flex justify-between items-center">
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 text-sm text-blue-800">
              <div className="flex items-center gap-2">
                <Store size={14} />
                <span className="font-medium">Branch Access:</span>
              </div>
              <p className="mt-1">
                You can view all products but only see stock for{' '}
                <strong className="capitalize">{moderatorBranch}</strong> branch
              </p>
            </div>

            <button
              onClick={() => {
                setSearchTerm('')
                setSelectedCategory('')
                setSelectedSubcategory('')
                setSelectedStatus('')
              }}
              className="px-4 py-2 text-purple-600 hover:text-purple-700"
            >
              Clear Filters
            </button>
          </div>
        </div>

        {/* Products Grid */}
        {loading ? (
          <div className="flex justify-center items-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {products.map((product) => (
                <motion.div
                  key={product._id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-white rounded-xl shadow-lg overflow-hidden hover:shadow-xl transition-all"
                >
                  {/* Product Image */}
                  <div className="aspect-square relative bg-gray-100">
                    {product.images && product.images.length > 0 ? (
                      <img
                        src={product.images[0].url}
                        alt={product.images[0].alt || product.name}
                        className="w-full h-full object-cover"
                        loading="lazy"
                        onError={(e) => {
                          e.target.style.display = 'none'
                          e.target.nextSibling.style.display = 'flex'
                        }}
                      />
                    ) : null}

                    <div
                      className="w-full h-full flex items-center justify-center"
                      style={{
                        display:
                          product.images && product.images.length > 0
                            ? 'none'
                            : 'flex',
                      }}
                    >
                      <Package size={48} className="text-gray-400" />
                    </div>

                    {/* Status Badge */}
                    <div
                      className={`absolute top-3 right-3 px-2 py-1 rounded-full text-xs font-medium ${
                        product.status === 'active'
                          ? 'bg-green-100 text-green-800'
                          : 'bg-gray-100 text-gray-800'
                      }`}
                    >
                      {product.status}
                    </div>

                    {/* Image count badge */}
                    {product.images && product.images.length > 1 && (
                      <div className="absolute top-3 left-3 bg-black bg-opacity-60 text-white px-2 py-1 rounded text-xs">
                        {product.images.length} photos
                      </div>
                    )}
                  </div>

                  {/* Product Info */}
                  <div className="p-4">
                    <div className="flex items-start justify-between mb-2">
                      <h3 className="font-semibold text-gray-900 line-clamp-2">
                        {product.name}
                      </h3>
                    </div>

                    <div className="flex items-center gap-2 mb-2">
                      <Tag size={14} className="text-purple-600" />
                      <span className="text-sm text-gray-600">
                        {product.category} • {product.subcategory}
                      </span>
                    </div>

                    <div className="flex items-center justify-between mb-3">
                      <div className="text-lg font-bold text-purple-600">
                        ${product.price}
                      </div>
                      {product.comparePrice && (
                        <div className="text-sm text-gray-400 line-through">
                          ${product.comparePrice}
                        </div>
                      )}
                    </div>

                    {/* 🔒 RESTRICTED: Only show moderator's branch stock */}
                    <div className="flex flex-wrap gap-1 mb-3">
                      {(() => {
                        const moderatorStock =
                          product.stock?.[`${moderatorBranch}_stock`] || 0
                        return (
                          <div
                            className={`flex items-center gap-1 text-xs px-2 py-1 rounded ${
                              moderatorStock > 0
                                ? 'bg-green-50 text-green-700'
                                : 'bg-red-50 text-red-700'
                            }`}
                          >
                            <Store size={12} />
                            <span className="capitalize">
                              {moderatorBranch}: {moderatorStock}
                            </span>
                          </div>
                        )
                      })()}
                    </div>

                    {/* Actions (No Delete Button) */}
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleEditProduct(product._id)}
                        className="flex-1 px-3 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 flex items-center justify-center gap-1 text-sm transition-colors"
                      >
                        <Edit size={14} />
                        Edit
                      </button>
                      <button
                        onClick={() => {
                          // View product details
                          Swal.fire({
                            title: product.name,
                            html: `
                              <div class="text-left">
                                <p><strong>Category:</strong> ${
                                  product.category
                                } • ${product.subcategory}</p>
                                <p><strong>Price:</strong> $${product.price}</p>
                                <p><strong>Status:</strong> ${
                                  product.status
                                }</p>
                                <p><strong>${
                                  moderatorBranch.charAt(0).toUpperCase() +
                                  moderatorBranch.slice(1)
                                } Stock:</strong> ${
                              product.stock?.[`${moderatorBranch}_stock`] || 0
                            }</p>
                                ${
                                  product.description
                                    ? `<p><strong>Description:</strong> ${product.description}</p>`
                                    : ''
                                }
                                ${
                                  product.tags && product.tags.length > 0
                                    ? `<p><strong>Tags:</strong> ${product.tags.join(
                                        ', '
                                      )}</p>`
                                    : ''
                                }
                              </div>
                            `,
                            showCloseButton: true,
                            showConfirmButton: false,
                            width: 500,
                          })
                        }}
                        className="px-3 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors flex items-center gap-1"
                        title="View Details"
                      >
                        <Eye size={14} />
                      </button>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex justify-center items-center mt-8 gap-2">
                <button
                  onClick={() =>
                    setCurrentPage((prev) => Math.max(prev - 1, 1))
                  }
                  disabled={currentPage === 1}
                  className="px-4 py-2 bg-white border border-gray-300 rounded-lg disabled:opacity-50 hover:bg-gray-50 transition-colors"
                >
                  Previous
                </button>

                <span className="px-4 py-2 bg-white rounded-lg border">
                  Page {currentPage} of {totalPages}
                </span>

                <button
                  onClick={() =>
                    setCurrentPage((prev) => Math.min(prev + 1, totalPages))
                  }
                  disabled={currentPage === totalPages}
                  className="px-4 py-2 bg-white border border-gray-300 rounded-lg disabled:opacity-50 hover:bg-gray-50 transition-colors"
                >
                  Next
                </button>
              </div>
            )}

            {/* No Products */}
            {products.length === 0 && !loading && (
              <div className="text-center py-12">
                <Package size={64} className="mx-auto text-gray-400 mb-4" />
                <h3 className="text-xl font-semibold text-gray-900 mb-2">
                  No products found
                </h3>
                <p className="text-gray-600">
                  Try adjusting your filters or contact admin to add products.
                </p>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}
