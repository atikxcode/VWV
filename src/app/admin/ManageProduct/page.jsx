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
} from 'lucide-react'
import EditProduct from '../../../../components/EditProduct'

export default function ProductManager() {
  const [products, setProducts] = useState([])
  const [categories, setCategories] = useState({})
  const [branches, setBranches] = useState([])
  const [loading, setLoading] = useState(true)
  const [currentView, setCurrentView] = useState('list') // 'list' or 'edit'
  const [editingProductId, setEditingProductId] = useState(null)

  // Filters
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('')
  const [selectedSubcategory, setSelectedSubcategory] = useState('')
  const [selectedBranch, setSelectedBranch] = useState('')
  const [selectedStatus, setSelectedStatus] = useState('')

  // Pagination
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const itemsPerPage = 12

  // Load initial data
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

        // Fetch branches
        const branchesRes = await fetch('/api/products?getBranchesOnly=true')
        if (branchesRes.ok) {
          const branchesData = await branchesRes.json()
          setBranches(branchesData.branches)
        }

        // Fetch products
        fetchProducts()
      } catch (error) {
        console.error('Error loading data:', error)
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

  // Handle edit product
  const handleEditProduct = (productId) => {
    setEditingProductId(productId)
    setCurrentView('edit')
  }

  // Handle back from edit
  const handleBackFromEdit = () => {
    setCurrentView('list')
    setEditingProductId(null)
    fetchProducts() // Refresh the list
  }

  // Delete product
  const handleDeleteProduct = async (productId) => {
    if (confirm('Are you sure you want to delete this product?')) {
      try {
        const response = await fetch(`/api/products?productId=${productId}`, {
          method: 'DELETE',
        })

        if (response.ok) {
          fetchProducts() // Refresh the list
        }
      } catch (error) {
        console.error('Error deleting product:', error)
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
          <h1 className="text-4xl font-bold text-gray-900 mb-2">
            Product Management
          </h1>
          <p className="text-gray-600">Manage your vape shop inventory</p>
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
                    {product.images && product.images[0] ? (
                      <img
                        src={product.images[0].url}
                        alt={product.name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <Package size={48} className="text-gray-400" />
                      </div>
                    )}

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

                    {/* Stock Info */}
                    <div className="flex flex-wrap gap-1 mb-3">
                      {branches.map((branch) => {
                        const stock = product.stock?.[`${branch}_stock`] || 0
                        return (
                          <div
                            key={branch}
                            className="flex items-center gap-1 text-xs"
                          >
                            <Store size={12} className="text-gray-400" />
                            <span className="text-gray-600">
                              {branch}: {stock}
                            </span>
                          </div>
                        )
                      })}
                    </div>

                    {/* Actions */}
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleEditProduct(product._id)}
                        className="flex-1 px-3 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 flex items-center justify-center gap-1 text-sm"
                      >
                        <Edit size={14} />
                        Edit
                      </button>
                      <button
                        onClick={() => handleDeleteProduct(product._id)}
                        className="px-3 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600"
                      >
                        <Trash2 size={14} />
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
                  className="px-4 py-2 bg-white border border-gray-300 rounded-lg disabled:opacity-50"
                >
                  Previous
                </button>

                <span className="px-4 py-2">
                  Page {currentPage} of {totalPages}
                </span>

                <button
                  onClick={() =>
                    setCurrentPage((prev) => Math.min(prev + 1, totalPages))
                  }
                  disabled={currentPage === totalPages}
                  className="px-4 py-2 bg-white border border-gray-300 rounded-lg disabled:opacity-50"
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
