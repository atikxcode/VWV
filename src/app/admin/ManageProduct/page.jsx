'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import {
  Search,
  Filter,
  Package,
  Edit,
  Eye,
  Trash2,
  Plus,
  Grid,
  List,
  ChevronDown,
  Store,
  Tag,
  ChevronLeft,
  ChevronRight,
  MoreHorizontal,
} from 'lucide-react'
import EditProduct from '../../../../components/EditProduct'
import Swal from 'sweetalert2'

export default function ManageProductAdmin() {
  const [products, setProducts] = useState([])
  const [categories, setCategories] = useState({})
  const [branches, setBranches] = useState([]) // 👈 UPDATED: Start with empty array
  const [loading, setLoading] = useState(true)
  const [currentView, setCurrentView] = useState('list') // 'list' or 'edit'
  const [editingProductId, setEditingProductId] = useState(null)

  // Filters
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('')
  const [selectedSubcategory, setSelectedSubcategory] = useState('')
  const [selectedBranch, setSelectedBranch] = useState('')
  const [selectedStatus, setSelectedStatus] = useState('')

  // 🔥 ENHANCED Pagination
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [totalProducts, setTotalProducts] = useState(0)
  const itemsPerPage = 12

  // 👇 UPDATED: Load initial data with correct branch endpoint
  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true)

        // Fetch categories
        const categoriesRes = await fetch(
          '/api/products?getCategoriesOnly=true'
        )
        if (categoriesRes.ok) {
          const categoriesData = await categoriesRes.json()
          setCategories(categoriesData.categories)
        }

        // 👇 FIXED: Fetch branches from dedicated API instead of products endpoint
        const branchesRes = await fetch('/api/branches')
        if (branchesRes.ok) {
          const branchesData = await branchesRes.json()
          setBranches(branchesData.branches || [])
        } else {
          // Fallback to default branches if API fails
          setBranches(['mirpur', 'bashundhara']) // 👈 Updated to match your current branches
        }

        // Fetch products
        fetchProducts()
      } catch (error) {
        console.error('Error loading data:', error)
        // Fallback branches in case of error
        setBranches(['mirpur', 'bashundhara'])
      }
    }

    loadData()
  }, [])

  // Fetch products with filters
  const fetchProducts = async () => {
    try {
      const params = new URLSearchParams({
        limit: itemsPerPage.toString(),
        page: currentPage.toString(),
      })

      if (searchTerm) params.append('search', searchTerm)
      if (selectedCategory) params.append('category', selectedCategory)
      if (selectedSubcategory) params.append('subcategory', selectedSubcategory)
      if (selectedBranch) params.append('branch', selectedBranch)
      if (selectedStatus) params.append('status', selectedStatus)

      const response = await fetch(`/api/products?${params}`)
      if (response.ok) {
        const data = await response.json()
        setProducts(data.products || [])
        setTotalPages(data.pagination?.totalPages || 1)
        setTotalProducts(data.pagination?.total || 0)
      }
    } catch (error) {
      console.error('Error fetching products:', error)
    } finally {
      setLoading(false)
    }
  }

  // Apply filters
  useEffect(() => {
    setCurrentPage(1)
    fetchProducts()
  }, [
    searchTerm,
    selectedCategory,
    selectedSubcategory,
    selectedBranch,
    selectedStatus,
  ])

  useEffect(() => {
    fetchProducts()
  }, [currentPage])

  // 🔥 ENHANCED Pagination functions
  const goToFirstPage = () => setCurrentPage(1)
  const goToLastPage = () => setCurrentPage(totalPages)
  const goToNextPage = () => setCurrentPage((prev) => Math.min(prev + 1, totalPages))
  const goToPrevPage = () => setCurrentPage((prev) => Math.max(prev - 1, 1))
  const goToPage = (pageNumber) => setCurrentPage(pageNumber)

  // Generate page numbers for pagination
  const generatePageNumbers = () => {
    const pageNumbers = []
    const maxVisiblePages = 5
    
    if (totalPages <= maxVisiblePages) {
      // Show all pages if total pages are less than or equal to maxVisiblePages
      for (let i = 1; i <= totalPages; i++) {
        pageNumbers.push(i)
      }
    } else {
      // Show first page, current page neighbors, and last page with ellipsis
      if (currentPage <= 3) {
        for (let i = 1; i <= 4; i++) pageNumbers.push(i)
        if (totalPages > 5) pageNumbers.push('ellipsis')
        pageNumbers.push(totalPages)
      } else if (currentPage >= totalPages - 2) {
        pageNumbers.push(1)
        if (totalPages > 5) pageNumbers.push('ellipsis')
        for (let i = totalPages - 3; i <= totalPages; i++) pageNumbers.push(i)
      } else {
        pageNumbers.push(1)
        pageNumbers.push('ellipsis')
        for (let i = currentPage - 1; i <= currentPage + 1; i++) pageNumbers.push(i)
        pageNumbers.push('ellipsis')
        pageNumbers.push(totalPages)
      }
    }
    
    return pageNumbers
  }

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

  // Delete product
  const handleDeleteProduct = async (productId) => {
    const result = await Swal.fire({
      title: 'Delete Product?',
      text: 'This will permanently delete the product and all its images. This action cannot be undone!',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#d33',
      cancelButtonColor: '#3085d6',
      confirmButtonText: 'Yes, delete it!',
      cancelButtonText: 'Cancel',
    })

    if (result.isConfirmed) {
      try {
        const response = await fetch(`/api/products?productId=${productId}`, {
          method: 'DELETE',
        })

        if (!response.ok) {
          throw new Error('Failed to delete product')
        }

        Swal.fire({
          icon: 'success',
          title: 'Deleted!',
          text: 'Product has been deleted successfully.',
          timer: 2000,
          showConfirmButton: false,
          toast: true,
          position: 'top-end',
        }).then(() => {
          fetchProducts() // Refresh the list
        })
      } catch (error) {
        console.error('Error deleting product:', error)
        Swal.fire({
          icon: 'error',
          title: 'Error',
          text: 'Failed to delete product',
          confirmButtonColor: '#8B5CF6',
        })
      }
    }
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
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2 flex items-center gap-3">
            Product Management
            <span className="text-sm bg-blue-100 text-blue-800 px-3 py-1 rounded-full font-medium">
              Administrator
            </span>
          </h1>
          <p className="text-gray-600">
            Manage your vape shop inventory • {totalProducts} total products
          </p>
        </div>

        {/* Filters */}
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

            {/* Branch Filter */}
            <select
              value={selectedBranch}
              onChange={(e) => setSelectedBranch(e.target.value)}
              className="w-full p-3 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-purple-500"
            >
              <option value="">All Branches</option>
              {branches.map((branch) => (
                <option key={branch} value={branch}>
                  {branch.charAt(0).toUpperCase() + branch.slice(1)}
                </option>
              ))}
            </select>
          </div>

          <div className="flex justify-between items-center">
            <div className="flex gap-2">
              <select
                value={selectedStatus}
                onChange={(e) => setSelectedStatus(e.target.value)}
                className="p-3 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-purple-500"
              >
                <option value="">All Status</option>
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
              </select>
            </div>

            <button
              onClick={() => {
                setSearchTerm('')
                setSelectedCategory('')
                setSelectedSubcategory('')
                setSelectedBranch('')
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

                    {/* 👇 UPDATED: Stock Info - Only show current branches */}
                    <div className="flex flex-wrap gap-1 mb-3">
                      {branches.length > 0 ? (
                        branches.map((branch) => {
                          const stock = product.stock?.[`${branch}_stock`] || 0
                          return (
                            <div
                              key={branch}
                              className={`flex items-center gap-1 text-xs px-2 py-1 rounded ${
                                stock > 0
                                  ? 'bg-green-50 text-green-700'
                                  : 'bg-red-50 text-red-700'
                              }`}
                            >
                              <Store size={12} />
                              <span>
                                {branch}: {stock}
                              </span>
                            </div>
                          )
                        })
                      ) : (
                        <div className="text-xs text-gray-500 px-2 py-1">
                          No branches configured
                        </div>
                      )}
                    </div>

                    {/* Actions */}
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
                                <p><strong>Stock:</strong></p>
                                ${branches.map(branch => 
                                  `<p>&nbsp;&nbsp;• ${branch.charAt(0).toUpperCase() + branch.slice(1)}: ${product.stock?.[`${branch}_stock`] || 0}</p>`
                                ).join('')}
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
                      <button
                        onClick={() => handleDeleteProduct(product._id)}
                        className="px-3 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>

            {/* 🔥 ENHANCED Pagination */}
            {totalPages > 1 && (
              <div className="bg-white rounded-2xl shadow-lg p-6 mt-8">
                <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
                  {/* Page Info */}
                  <div className="text-sm text-gray-600">
                    Showing {(currentPage - 1) * itemsPerPage + 1} to{' '}
                    {Math.min(currentPage * itemsPerPage, totalProducts)} of{' '}
                    {totalProducts} products
                  </div>

                  {/* Pagination Controls */}
                  <div className="flex items-center gap-1">
                    {/* First Page */}
                    <button
                      onClick={goToFirstPage}
                      disabled={currentPage === 1}
                      className="px-3 py-2 text-sm font-medium text-gray-500 bg-white border border-gray-300 rounded-l-lg hover:bg-gray-50 hover:text-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                      title="First page"
                    >
                      First
                    </button>

                    {/* Previous Page */}
                    <button
                      onClick={goToPrevPage}
                      disabled={currentPage === 1}
                      className="px-3 py-2 text-sm font-medium text-gray-500 bg-white border-t border-b border-gray-300 hover:bg-gray-50 hover:text-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-1"
                      title="Previous page"
                    >
                      <ChevronLeft size={16} />
                      Prev
                    </button>

                    {/* Page Numbers */}
                    {generatePageNumbers().map((pageNum, index) => (
                      <button
                        key={index}
                        onClick={() => pageNum !== 'ellipsis' && goToPage(pageNum)}
                        disabled={pageNum === 'ellipsis' || pageNum === currentPage}
                        className={`px-3 py-2 text-sm font-medium border-t border-b border-gray-300 transition-colors ${
                          pageNum === currentPage
                            ? 'bg-purple-600 text-white border-purple-600'
                            : pageNum === 'ellipsis'
                            ? 'bg-white text-gray-400 cursor-not-allowed'
                            : 'bg-white text-gray-500 hover:bg-gray-50 hover:text-gray-700'
                        }`}
                      >
                        {pageNum === 'ellipsis' ? (
                          <MoreHorizontal size={16} />
                        ) : (
                          pageNum
                        )}
                      </button>
                    ))}

                    {/* Next Page */}
                    <button
                      onClick={goToNextPage}
                      disabled={currentPage === totalPages}
                      className="px-3 py-2 text-sm font-medium text-gray-500 bg-white border-t border-b border-gray-300 hover:bg-gray-50 hover:text-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-1"
                      title="Next page"
                    >
                      Next
                      <ChevronRight size={16} />
                    </button>

                    {/* Last Page */}
                    <button
                      onClick={goToLastPage}
                      disabled={currentPage === totalPages}
                      className="px-3 py-2 text-sm font-medium text-gray-500 bg-white border border-gray-300 rounded-r-lg hover:bg-gray-50 hover:text-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                      title="Last page"
                    >
                      Last
                    </button>
                  </div>

                  {/* Items per page (optional) */}
                  <div className="text-sm text-gray-600">
                    {itemsPerPage} per page
                  </div>
                </div>
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
                  Try adjusting your filters or add some products.
                </p>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}
