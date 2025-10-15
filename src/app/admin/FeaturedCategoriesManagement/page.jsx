'use client'

import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import Swal from 'sweetalert2'
import {
  Upload,
  Save,
  Trash2,
  Eye,
  X,
  Image as ImageIcon,
  ToggleLeft,
  ToggleRight,
  Plus,
  Edit2,
  ArrowUp,
  ArrowDown,
  Layers,
  Type,
  FileText,
  Link as LinkIcon,
  Grid3x3,
  Monitor,
  Palette,
  MousePointer,
} from 'lucide-react'

const MySwal = Swal

export default function FeaturedCategoriesManagement() {
  const [categories, setCategories] = useState([])
  const [availableCategories, setAvailableCategories] = useState([])
  const [loading, setLoading] = useState(true)
  const [editingCategory, setEditingCategory] = useState(null)
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [uploadingProductImage, setUploadingProductImage] = useState(false)
  const [uploadingBackgroundImage, setUploadingBackgroundImage] = useState(false)
  const [showPreview, setShowPreview] = useState(false)

  // Form state - 🆕 ADDED COLOR AND BUTTON TEXT FIELDS
  const [formData, setFormData] = useState({
    title: '',
    categoryParam: '',
    description: '',
    buttonText: 'EXPLORE', // 🆕 Customizable button text
    isActive: true,
    // 🆕 Color customization
    titleColor: '#000000',
    descriptionColor: '#000000',
    buttonColor: '#000000',
    // 🆕 Background type selection
    backgroundType: 'image', // 'image' or 'color'
    backgroundColor: '#e5e7eb', // Default gray
  })
  
  // TWO SEPARATE IMAGE STATES
  const [selectedProductImage, setSelectedProductImage] = useState(null)
  const [productImagePreview, setProductImagePreview] = useState(null)
  const [selectedBackgroundImage, setSelectedBackgroundImage] = useState(null)
  const [backgroundImagePreview, setBackgroundImagePreview] = useState(null)

  // Get JWT token from localStorage
  const getAuthToken = () => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('auth-token') || sessionStorage.getItem('auth-token')
    }
    return null
  }

  // Fetch available product categories for dropdown
  const fetchAvailableCategories = async () => {
    try {
      const token = getAuthToken()
      const response = await fetch('/api/featured-categories?getProductCategories=true', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      })

      if (response.ok) {
        const data = await response.json()
        setAvailableCategories(data.categories || [])
        console.log('✅ Available categories loaded:', data.categories)
      }
    } catch (error) {
      console.error('❌ Error fetching available categories:', error)
    }
  }

  // Fetch all featured categories
  const fetchCategories = async () => {
    setLoading(true)
    try {
      const token = getAuthToken()
      const response = await fetch('/api/featured-categories?includeInactive=true', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      })

      if (response.ok) {
        const data = await response.json()
        setCategories(data.categories || [])
        console.log('✅ Categories loaded:', data.categories)
      } else {
        console.error('❌ Failed to fetch categories')
        MySwal.fire('Error', 'Failed to load categories', 'error')
      }
    } catch (error) {
      console.error('❌ Error:', error)
      MySwal.fire('Error', 'Something went wrong', 'error')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchCategories()
    fetchAvailableCategories()
  }, [])

  // Handle PRODUCT image selection
  const handleProductImageSelect = (e) => {
    const file = e.target.files[0]
    if (file) {
      if (file.size > 100 * 1024 * 1024) {
        MySwal.fire('Error', 'Image must be less than 100MB', 'error')
        return
      }

      const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp']
      if (!allowedTypes.includes(file.type)) {
        MySwal.fire('Error', 'Only JPG, PNG, and WebP images are allowed', 'error')
        return
      }

      setSelectedProductImage(file)
      setProductImagePreview(URL.createObjectURL(file))
    }
  }

  // Handle BACKGROUND image selection
  const handleBackgroundImageSelect = (e) => {
    const file = e.target.files[0]
    if (file) {
      if (file.size > 100 * 1024 * 1024) {
        MySwal.fire('Error', 'Image must be less than 100MB', 'error')
        return
      }

      const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp']
      if (!allowedTypes.includes(file.type)) {
        MySwal.fire('Error', 'Only JPG, PNG, and WebP images are allowed', 'error')
        return
      }

      setSelectedBackgroundImage(file)
      setBackgroundImagePreview(URL.createObjectURL(file))
    }
  }

  // Create new category
  const handleCreateCategory = async () => {
    const token = getAuthToken()

    if (!token) {
      MySwal.fire('Error', 'Please login first', 'error')
      return
    }

    if (!formData.title || !formData.categoryParam) {
      MySwal.fire('Error', 'Title and Category Parameter are required', 'warning')
      return
    }

    try {
      setLoading(true)

      // Step 1: Create category data
      const response = await fetch('/api/featured-categories', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'create',
          categoryData: {
            id: `category-${Date.now()}`,
            ...formData,
          },
        }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to create category')
      }

      const data = await response.json()
      const newCategoryId = data.category.id

      // Step 2: Upload PRODUCT image if selected
      if (selectedProductImage) {
        setUploadingProductImage(true)
        const formDataObj = new FormData()
        formDataObj.append('image', selectedProductImage)
        formDataObj.append('categoryId', newCategoryId)
        formDataObj.append('imageType', 'product')

        const uploadResponse = await fetch('/api/featured-categories', {
          method: 'PUT',
          headers: {
            'Authorization': `Bearer ${token}`,
          },
          body: formDataObj,
        })

        if (!uploadResponse.ok) {
          console.warn('Product image upload failed')
        }
        setUploadingProductImage(false)
      }

      // Step 3: Upload BACKGROUND image if selected and backgroundType is 'image'
      if (selectedBackgroundImage && formData.backgroundType === 'image') {
        setUploadingBackgroundImage(true)
        const formDataObj = new FormData()
        formDataObj.append('image', selectedBackgroundImage)
        formDataObj.append('categoryId', newCategoryId)
        formDataObj.append('imageType', 'background')

        const uploadResponse = await fetch('/api/featured-categories', {
          method: 'PUT',
          headers: {
            'Authorization': `Bearer ${token}`,
          },
          body: formDataObj,
        })

        if (!uploadResponse.ok) {
          console.warn('Background image upload failed')
        }
        setUploadingBackgroundImage(false)
      }

      MySwal.fire('Success!', 'Category created successfully', 'success')
      setShowCreateModal(false)
      resetForm()
      await fetchCategories()
    } catch (error) {
      console.error('❌ Error:', error)
      MySwal.fire('Error', error.message, 'error')
    } finally {
      setLoading(false)
      setUploadingProductImage(false)
      setUploadingBackgroundImage(false)
    }
  }

  // Update existing category
  const handleUpdateCategory = async () => {
    const token = getAuthToken()

    if (!token) {
      MySwal.fire('Error', 'Please login first', 'error')
      return
    }

    if (!formData.title || !formData.categoryParam) {
      MySwal.fire('Error', 'Title and Category Parameter are required', 'warning')
      return
    }

    try {
      setLoading(true)

      // Step 1: Update category data
      const response = await fetch('/api/featured-categories', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'update',
          id: editingCategory.id,
          categoryData: formData,
        }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to update category')
      }

      // Step 2: Upload new PRODUCT image if selected
      if (selectedProductImage) {
        setUploadingProductImage(true)
        const formDataObj = new FormData()
        formDataObj.append('image', selectedProductImage)
        formDataObj.append('categoryId', editingCategory.id)
        formDataObj.append('imageType', 'product')

        const uploadResponse = await fetch('/api/featured-categories', {
          method: 'PUT',
          headers: {
            'Authorization': `Bearer ${token}`,
          },
          body: formDataObj,
        })

        if (!uploadResponse.ok) {
          console.warn('Product image upload failed')
        }
        setUploadingProductImage(false)
      }

      // Step 3: Upload new BACKGROUND image if selected and backgroundType is 'image'
      if (selectedBackgroundImage && formData.backgroundType === 'image') {
        setUploadingBackgroundImage(true)
        const formDataObj = new FormData()
        formDataObj.append('image', selectedBackgroundImage)
        formDataObj.append('categoryId', editingCategory.id)
        formDataObj.append('imageType', 'background')

        const uploadResponse = await fetch('/api/featured-categories', {
          method: 'PUT',
          headers: {
            'Authorization': `Bearer ${token}`,
          },
          body: formDataObj,
        })

        if (!uploadResponse.ok) {
          console.warn('Background image upload failed')
        }
        setUploadingBackgroundImage(false)
      }

      MySwal.fire('Success!', 'Category updated successfully', 'success')
      setEditingCategory(null)
      resetForm()
      await fetchCategories()
    } catch (error) {
      console.error('❌ Error:', error)
      MySwal.fire('Error', error.message, 'error')
    } finally {
      setLoading(false)
      setUploadingProductImage(false)
      setUploadingBackgroundImage(false)
    }
  }

  // Toggle category active status
  const handleToggleActive = async (categoryId, currentStatus) => {
    const token = getAuthToken()

    try {
      const response = await fetch(`/api/featured-categories?id=${categoryId}&action=toggle`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      })

      if (response.ok) {
        MySwal.fire(
          'Success!',
          `Category ${currentStatus ? 'deactivated' : 'activated'}`,
          'success'
        )
        await fetchCategories()
      } else {
        MySwal.fire('Error', 'Failed to toggle category', 'error')
      }
    } catch (error) {
      console.error('❌ Error:', error)
      MySwal.fire('Error', 'Something went wrong', 'error')
    }
  }

  // Delete category
  const handleDeleteCategory = async (categoryId, categoryTitle) => {
    const result = await MySwal.fire({
      title: 'Are you sure?',
      text: `Delete "${categoryTitle}"? This cannot be undone!`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#d33',
      cancelButtonColor: '#3085d6',
      confirmButtonText: 'Yes, delete it!',
    })

    if (result.isConfirmed) {
      const token = getAuthToken()

      try {
        const response = await fetch(`/api/featured-categories?id=${categoryId}&action=delete`, {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        })

        if (response.ok) {
          MySwal.fire('Deleted!', 'Category has been deleted', 'success')
          await fetchCategories()
        } else {
          MySwal.fire('Error', 'Failed to delete category', 'error')
        }
      } catch (error) {
        console.error('❌ Error:', error)
        MySwal.fire('Error', 'Something went wrong', 'error')
      }
    }
  }

  // Reorder categories
  const handleReorder = async (categoryId, direction) => {
    const token = getAuthToken()
    const currentIndex = categories.findIndex((cat) => cat.id === categoryId)

    if (
      (direction === 'up' && currentIndex === 0) ||
      (direction === 'down' && currentIndex === categories.length - 1)
    ) {
      return
    }

    const newCategories = [...categories]
    const targetIndex = direction === 'up' ? currentIndex - 1 : currentIndex + 1

    // Swap
    ;[newCategories[currentIndex], newCategories[targetIndex]] = [
      newCategories[targetIndex],
      newCategories[currentIndex],
    ]

    // Update order property
    const reorderedCategories = newCategories.map((cat, index) => ({
      id: cat.id,
      order: index,
    }))

    try {
      const response = await fetch('/api/featured-categories', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'reorder',
          categories: reorderedCategories,
        }),
      })

      if (response.ok) {
        setCategories(newCategories)
        MySwal.fire('Success!', 'Categories reordered', 'success')
      } else {
        MySwal.fire('Error', 'Failed to reorder categories', 'error')
      }
    } catch (error) {
      console.error('❌ Error:', error)
      MySwal.fire('Error', 'Something went wrong', 'error')
    }
  }

  // Open edit modal
  const openEditModal = (category) => {
    setEditingCategory(category)
    setFormData({
      title: category.title,
      categoryParam: category.categoryParam,
      description: category.description,
      buttonText: category.buttonText || 'EXPLORE',
      isActive: category.isActive,
      titleColor: category.titleColor || '#000000',
      descriptionColor: category.descriptionColor || '#000000',
      buttonColor: category.buttonColor || '#000000',
      backgroundType: category.backgroundType || 'image',
      backgroundColor: category.backgroundColor || '#e5e7eb',
    })
    setProductImagePreview(category.productImage || null)
    setBackgroundImagePreview(category.backgroundImage || null)
    setSelectedProductImage(null)
    setSelectedBackgroundImage(null)
  }

  // Reset form
  const resetForm = () => {
    setFormData({
      title: '',
      categoryParam: '',
      description: '',
      buttonText: 'EXPLORE',
      isActive: true,
      titleColor: '#000000',
      descriptionColor: '#000000',
      buttonColor: '#000000',
      backgroundType: 'image',
      backgroundColor: '#e5e7eb',
    })
    setSelectedProductImage(null)
    setProductImagePreview(null)
    setSelectedBackgroundImage(null)
    setBackgroundImagePreview(null)
    setEditingCategory(null)
  }

  // 🆕 Get preview background style
  const getPreviewBackgroundStyle = () => {
    if (formData.backgroundType === 'color') {
      return { backgroundColor: formData.backgroundColor }
    } else if (backgroundImagePreview) {
      return { backgroundImage: `url(${backgroundImagePreview})` }
    } else {
      return { backgroundImage: "url('/Home_Category/20.jpg')" }
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-800 flex items-center gap-3">
              <Layers className="text-purple-600" size={32} />
              Featured Categories Management
            </h1>
            <p className="text-gray-600 mt-2">
              Manage homepage featured categories ({categories.length} total)
            </p>
          </div>

          <button
            onClick={() => {
              resetForm()
              setShowCreateModal(true)
            }}
            className="bg-purple-600 hover:bg-purple-700 text-white px-6 py-3 rounded-lg flex items-center gap-2 transition-all shadow-lg hover:shadow-xl"
          >
            <Plus size={20} />
            Create Category
          </button>
        </div>

        {/* Loading State */}
        {loading && (
          <div className="flex justify-center items-center py-20">
            <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-purple-600"></div>
          </div>
        )}

        {/* Categories Grid */}
        {!loading && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <AnimatePresence>
              {categories.map((category, index) => (
                <motion.div
                  key={category.id}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  className={`bg-white rounded-xl shadow-lg overflow-hidden border-2 ${
                    category.isActive ? 'border-green-500' : 'border-gray-300'
                  }`}
                >
                  {/* Product Image with Background */}
                  <div 
                    className="relative h-48 bg-gray-200 bg-cover bg-center"
                    style={
                      category.backgroundType === 'color'
                        ? { backgroundColor: category.backgroundColor }
                        : {
                            backgroundImage: category.backgroundImage
                              ? `url(${category.backgroundImage})`
                              : "url('/Home_Category/20.jpg')",
                          }
                    }
                  >
                    {category.productImage ? (
                      <div className="absolute inset-0 flex items-center justify-center">
                        <img
                          src={category.productImage}
                          alt={category.title}
                          className="w-32 h-32 object-contain rounded-full"
                        />
                      </div>
                    ) : (
                      <div className="absolute inset-0 flex items-center justify-center">
                        <ImageIcon size={64} className="text-gray-400" />
                      </div>
                    )}

                    {/* Active Badge */}
                    <div className="absolute top-3 right-3">
                      {category.isActive ? (
                        <span className="bg-green-500 text-white px-3 py-1 rounded-full text-xs font-semibold">
                          Active
                        </span>
                      ) : (
                        <span className="bg-gray-500 text-white px-3 py-1 rounded-full text-xs font-semibold">
                          Inactive
                        </span>
                      )}
                    </div>

                    {/* Order Badge */}
                    <div className="absolute top-3 left-3 bg-purple-600 text-white px-3 py-1 rounded-full text-xs font-semibold">
                      #{index + 1}
                    </div>
                  </div>

                  {/* Content */}
                  <div className="p-5">
                    <h3 className="text-xl font-bold text-gray-800 mb-2">{category.title}</h3>
                    <div className="flex items-center gap-2 text-sm text-gray-600 mb-3">
                      <LinkIcon size={14} />
                      <span className="font-mono bg-gray-100 px-2 py-1 rounded">
                        {category.categoryParam}
                      </span>
                    </div>
                    <p className="text-sm text-gray-600 mb-4 line-clamp-2">
                      {category.description}
                    </p>

                    {/* Action Buttons */}
                    <div className="flex flex-wrap gap-2">
                      {/* Edit */}
                      <button
                        onClick={() => openEditModal(category)}
                        className="flex-1 bg-blue-500 hover:bg-blue-600 text-white px-3 py-2 rounded-lg flex items-center justify-center gap-2 transition-all text-sm"
                      >
                        <Edit2 size={16} />
                        Edit
                      </button>

                      {/* Toggle Active */}
                      <button
                        onClick={() => handleToggleActive(category.id, category.isActive)}
                        className={`flex-1 ${
                          category.isActive
                            ? 'bg-orange-500 hover:bg-orange-600'
                            : 'bg-green-500 hover:bg-green-600'
                        } text-white px-3 py-2 rounded-lg flex items-center justify-center gap-2 transition-all text-sm`}
                      >
                        {category.isActive ? (
                          <>
                            <ToggleRight size={16} />
                            Hide
                          </>
                        ) : (
                          <>
                            <ToggleLeft size={16} />
                            Show
                          </>
                        )}
                      </button>

                      {/* Delete */}
                      <button
                        onClick={() => handleDeleteCategory(category.id, category.title)}
                        className="bg-red-500 hover:bg-red-600 text-white px-3 py-2 rounded-lg flex items-center justify-center transition-all text-sm"
                      >
                        <Trash2 size={16} />
                      </button>

                      {/* Reorder Up */}
                      <button
                        onClick={() => handleReorder(category.id, 'up')}
                        disabled={index === 0}
                        className="bg-gray-500 hover:bg-gray-600 text-white px-3 py-2 rounded-lg flex items-center justify-center transition-all text-sm disabled:opacity-30"
                      >
                        <ArrowUp size={16} />
                      </button>

                      {/* Reorder Down */}
                      <button
                        onClick={() => handleReorder(category.id, 'down')}
                        disabled={index === categories.length - 1}
                        className="bg-gray-500 hover:bg-gray-600 text-white px-3 py-2 rounded-lg flex items-center justify-center transition-all text-sm disabled:opacity-30"
                      >
                        <ArrowDown size={16} />
                      </button>
                    </div>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        )}

        {/* Empty State */}
        {!loading && categories.length === 0 && (
          <div className="text-center py-20">
            <Grid3x3 size={64} className="mx-auto text-gray-400 mb-4" />
            <p className="text-xl text-gray-600">No featured categories yet</p>
            <p className="text-gray-500 mt-2">Click "Create Category" to add your first one</p>
          </div>
        )}

        {/* Create/Edit Modal */}
        {(showCreateModal || editingCategory) && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 overflow-y-auto">
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="bg-white rounded-2xl shadow-2xl max-w-6xl w-full my-8"
            >
              {/* Modal Header */}
              <div className="sticky top-0 bg-gradient-to-r from-purple-600 to-purple-700 text-white p-6 flex justify-between items-center rounded-t-2xl z-10">
                <h2 className="text-2xl font-bold">
                  {editingCategory ? 'Edit Category' : 'Create New Category'}
                </h2>
                <div className="flex gap-2">
                  {/* Live Preview Button */}
                  <button
                    onClick={() => setShowPreview(!showPreview)}
                    className="hover:bg-white hover:bg-opacity-20 p-2 rounded-lg transition-all flex items-center gap-2"
                  >
                    <Monitor size={20} />
                    {showPreview ? 'Hide Preview' : 'Show Preview'}
                  </button>
                  <button
                    onClick={() => {
                      setShowCreateModal(false)
                      setEditingCategory(null)
                      resetForm()
                    }}
                    className="hover:bg-white hover:bg-opacity-20 p-2 rounded-lg transition-all"
                  >
                    <X size={24} />
                  </button>
                </div>
              </div>

              <div className="flex flex-col lg:flex-row max-h-[80vh] overflow-hidden">
                {/* Modal Body - Form */}
                <div className={`${showPreview ? 'lg:w-1/2' : 'w-full'} p-6 space-y-6 overflow-y-auto`}>
                  {/* PRODUCT IMAGE Upload */}
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Product Image *
                    </label>
                    <div className="border-2 border-dashed border-gray-300 rounded-xl p-4 hover:border-purple-500 transition-all">
                      {productImagePreview ? (
                        <div className="relative">
                          <img
                            src={productImagePreview}
                            alt="Product Preview"
                            className="w-full h-32 object-contain rounded-lg"
                          />
                          <button
                            onClick={() => {
                              setProductImagePreview(null)
                              setSelectedProductImage(null)
                            }}
                            className="absolute top-2 right-2 bg-red-500 text-white p-2 rounded-full hover:bg-red-600"
                          >
                            <X size={16} />
                          </button>
                        </div>
                      ) : (
                        <label className="cursor-pointer flex flex-col items-center">
                          <Upload size={36} className="text-gray-400 mb-2" />
                          <span className="text-gray-600 font-medium text-sm">
                            Upload Product Image
                          </span>
                          <span className="text-xs text-gray-500 mt-1">
                            JPG, PNG, WebP (Max 100MB)
                          </span>
                          <input
                            type="file"
                            accept="image/*"
                            onChange={handleProductImageSelect}
                            className="hidden"
                          />
                        </label>
                      )}
                    </div>
                  </div>

                  {/* 🆕 BACKGROUND TYPE SELECTOR */}
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Background Type *
                    </label>
                    <div className="flex gap-4">
                      <button
                        onClick={() => setFormData({ ...formData, backgroundType: 'image' })}
                        className={`flex-1 p-4 border-2 rounded-lg transition-all ${
                          formData.backgroundType === 'image'
                            ? 'border-purple-500 bg-purple-50'
                            : 'border-gray-300 hover:border-gray-400'
                        }`}
                      >
                        <ImageIcon size={24} className="mx-auto mb-2" />
                        <p className="text-sm font-semibold">Background Image</p>
                      </button>
                      <button
                        onClick={() => setFormData({ ...formData, backgroundType: 'color' })}
                        className={`flex-1 p-4 border-2 rounded-lg transition-all ${
                          formData.backgroundType === 'color'
                            ? 'border-purple-500 bg-purple-50'
                            : 'border-gray-300 hover:border-gray-400'
                        }`}
                      >
                        <Palette size={24} className="mx-auto mb-2" />
                        <p className="text-sm font-semibold">Solid Color</p>
                      </button>
                    </div>
                  </div>

                  {/* BACKGROUND IMAGE Upload - Only show if backgroundType is 'image' */}
                  {formData.backgroundType === 'image' && (
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">
                        Background Image
                      </label>
                      <div className="border-2 border-dashed border-gray-300 rounded-xl p-4 hover:border-purple-500 transition-all">
                        {backgroundImagePreview ? (
                          <div className="relative">
                            <img
                              src={backgroundImagePreview}
                              alt="Background Preview"
                              className="w-full h-32 object-cover rounded-lg"
                            />
                            <button
                              onClick={() => {
                                setBackgroundImagePreview(null)
                                setSelectedBackgroundImage(null)
                              }}
                              className="absolute top-2 right-2 bg-red-500 text-white p-2 rounded-full hover:bg-red-600"
                            >
                              <X size={16} />
                            </button>
                          </div>
                        ) : (
                          <label className="cursor-pointer flex flex-col items-center">
                            <Upload size={36} className="text-gray-400 mb-2" />
                            <span className="text-gray-600 font-medium text-sm">
                              Upload Background Image
                            </span>
                            <span className="text-xs text-gray-500 mt-1">
                              JPG, PNG, WebP (Max 100MB)
                            </span>
                            <input
                              type="file"
                              accept="image/*"
                              onChange={handleBackgroundImageSelect}
                              className="hidden"
                            />
                          </label>
                        )}
                      </div>
                    </div>
                  )}

                  {/* 🆕 BACKGROUND COLOR PICKER - Only show if backgroundType is 'color' */}
                  {formData.backgroundType === 'color' && (
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">
                        <Palette size={16} className="inline mr-2" />
                        Background Color
                      </label>
                      <div className="flex items-center gap-3">
                        <input
                          type="color"
                          value={formData.backgroundColor}
                          onChange={(e) =>
                            setFormData({ ...formData, backgroundColor: e.target.value })
                          }
                          className="w-16 h-12 rounded-lg border-2 border-gray-300 cursor-pointer"
                        />
                        <input
                          type="text"
                          value={formData.backgroundColor}
                          onChange={(e) =>
                            setFormData({ ...formData, backgroundColor: e.target.value })
                          }
                          placeholder="#e5e7eb"
                          className="flex-1 px-4 py-3 border-2 border-gray-300 rounded-lg focus:border-purple-500 focus:outline-none font-mono"
                        />
                      </div>
                    </div>
                  )}

                  {/* Title */}
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      <Type size={16} className="inline mr-2" />
                      Title *
                    </label>
                    <input
                      type="text"
                      value={formData.title}
                      onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                      placeholder="e.g., DEVICE"
                      className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:border-purple-500 focus:outline-none"
                      maxLength={200}
                    />
                  </div>

                  {/* 🆕 TITLE COLOR PICKER */}
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      <Palette size={16} className="inline mr-2" />
                      Title Color
                    </label>
                    <div className="flex items-center gap-3">
                      <input
                        type="color"
                        value={formData.titleColor}
                        onChange={(e) =>
                          setFormData({ ...formData, titleColor: e.target.value })
                        }
                        className="w-16 h-12 rounded-lg border-2 border-gray-300 cursor-pointer"
                      />
                      <input
                        type="text"
                        value={formData.titleColor}
                        onChange={(e) =>
                          setFormData({ ...formData, titleColor: e.target.value })
                        }
                        placeholder="#000000"
                        className="flex-1 px-4 py-3 border-2 border-gray-300 rounded-lg focus:border-purple-500 focus:outline-none font-mono"
                      />
                    </div>
                  </div>

                  {/* Category Parameter DROPDOWN */}
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      <LinkIcon size={16} className="inline mr-2" />
                      Category Parameter *
                    </label>
                    <select
                      value={formData.categoryParam}
                      onChange={(e) =>
                        setFormData({ ...formData, categoryParam: e.target.value })
                      }
                      className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:border-purple-500 focus:outline-none font-mono"
                    >
                      <option value="">Select a category...</option>
                      {availableCategories.map((cat) => (
                        <option key={cat} value={cat}>
                          {cat}
                        </option>
                      ))}
                    </select>
                    <p className="text-xs text-gray-500 mt-1">
                      Select from available product categories
                    </p>
                  </div>

                  {/* Description */}
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      <FileText size={16} className="inline mr-2" />
                      Description
                    </label>
                    <textarea
                      value={formData.description}
                      onChange={(e) =>
                        setFormData({ ...formData, description: e.target.value })
                      }
                      placeholder="Brief description of this category..."
                      className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:border-purple-500 focus:outline-none resize-none"
                      rows={4}
                      maxLength={500}
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      {formData.description.length}/500 characters
                    </p>
                  </div>

                  {/* 🆕 DESCRIPTION COLOR PICKER */}
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      <Palette size={16} className="inline mr-2" />
                      Description Color
                    </label>
                    <div className="flex items-center gap-3">
                      <input
                        type="color"
                        value={formData.descriptionColor}
                        onChange={(e) =>
                          setFormData({ ...formData, descriptionColor: e.target.value })
                        }
                        className="w-16 h-12 rounded-lg border-2 border-gray-300 cursor-pointer"
                      />
                      <input
                        type="text"
                        value={formData.descriptionColor}
                        onChange={(e) =>
                          setFormData({ ...formData, descriptionColor: e.target.value })
                        }
                        placeholder="#000000"
                        className="flex-1 px-4 py-3 border-2 border-gray-300 rounded-lg focus:border-purple-500 focus:outline-none font-mono"
                      />
                    </div>
                  </div>

                  {/* 🆕 BUTTON TEXT INPUT */}
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      <MousePointer size={16} className="inline mr-2" />
                      Button Text
                    </label>
                    <input
                      type="text"
                      value={formData.buttonText}
                      onChange={(e) =>
                        setFormData({ ...formData, buttonText: e.target.value })
                      }
                      placeholder="e.g., EXPLORE, SEE ALL, SHOP NOW"
                      className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:border-purple-500 focus:outline-none"
                      maxLength={50}
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      Customize the button text (e.g., "EXPLORE", "SEE ALL")
                    </p>
                  </div>

                  {/* 🆕 BUTTON COLOR PICKER */}
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      <Palette size={16} className="inline mr-2" />
                      Button Color
                    </label>
                    <div className="flex items-center gap-3">
                      <input
                        type="color"
                        value={formData.buttonColor}
                        onChange={(e) =>
                          setFormData({ ...formData, buttonColor: e.target.value })
                        }
                        className="w-16 h-12 rounded-lg border-2 border-gray-300 cursor-pointer"
                      />
                      <input
                        type="text"
                        value={formData.buttonColor}
                        onChange={(e) =>
                          setFormData({ ...formData, buttonColor: e.target.value })
                        }
                        placeholder="#000000"
                        className="flex-1 px-4 py-3 border-2 border-gray-300 rounded-lg focus:border-purple-500 focus:outline-none font-mono"
                      />
                    </div>
                  </div>

                  {/* Active Status */}
                  <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                    <div>
                      <p className="font-semibold text-gray-700">Active Status</p>
                      <p className="text-sm text-gray-500">
                        Show this category on homepage
                      </p>
                    </div>
                    <button
                      onClick={() =>
                        setFormData({ ...formData, isActive: !formData.isActive })
                      }
                      className={`relative inline-flex h-8 w-16 items-center rounded-full transition-colors ${
                        formData.isActive ? 'bg-green-500' : 'bg-gray-300'
                      }`}
                    >
                      <span
                        className={`inline-block h-6 w-6 transform rounded-full bg-white transition-transform ${
                          formData.isActive ? 'translate-x-9' : 'translate-x-1'
                        }`}
                      />
                    </button>
                  </div>
                </div>

                {/* Live Preview Panel */}
                {showPreview && (
                  <div className="lg:w-1/2 bg-gray-100 p-6 overflow-y-auto border-l border-gray-200">
                    <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
                      <Eye size={20} />
                      Live Preview
                    </h3>
                    
                    {/* Preview Card - 🆕 EXACT MATCH TO WEBSITE */}
                    <div
                      className="py-6 px-6 bg-cover bg-center rounded-3xl"
                      style={getPreviewBackgroundStyle()}
                    >
                      <div className="group flex flex-col items-center border-[1px] rounded-2xl border-purple-400 py-8">
                        {/* Product Image Preview */}
                        <div className="overflow-hidden rounded-full">
                          {productImagePreview ? (
                            <img
                              src={productImagePreview}
                              alt={formData.title || 'Preview'}
                              className="w-[240px] h-[240px] object-contain"
                            />
                          ) : (
                            <div className="w-[240px] h-[240px] flex items-center justify-center bg-gray-200 rounded-full">
                              <ImageIcon size={64} className="text-gray-400" />
                            </div>
                          )}
                        </div>

                        {/* Content Preview */}
                        <div className="flex flex-col items-center mt-4 gap-4 px-4">
                          <h2 
                            className="text-[26px] font-bold text-center"
                            style={{ color: formData.titleColor }}
                          >
                            {formData.title || 'Category Title'}
                          </h2>
                          <span className="border-[2px] w-[50px] border-black"></span>
                          <p 
                            className="text-[15px] font-bold text-center tracking-wider"
                            style={{ color: formData.descriptionColor }}
                          >
                            {formData.description || 'Category description will appear here...'}
                          </p>

                          <div className="text-black">
                            <button 
                              className="font-bold text-[10px] transition-all duration-300"
                              style={{ color: formData.buttonColor }}
                            >
                              {formData.buttonText || 'EXPLORE'}
                            </button>
                            <span 
                              className="text-lg ml-1"
                              style={{ color: formData.buttonColor }}
                            >
                              ›
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Preview Info */}
                    <div className="mt-4 p-4 bg-white rounded-lg space-y-2">
                      <p className="text-sm text-gray-600">
                        <strong>Category Link:</strong>{' '}
                        <span className="font-mono text-purple-600">
                          /products?category={formData.categoryParam || 'CATEGORY'}
                        </span>
                      </p>
                      <p className="text-sm text-gray-600">
                        <strong>Background:</strong>{' '}
                        <span className="text-gray-800">
                          {formData.backgroundType === 'color' ? `Solid Color (${formData.backgroundColor})` : 'Image'}
                        </span>
                      </p>
                      <p className="text-sm text-gray-600">
                        <strong>Status:</strong>{' '}
                        <span className={formData.isActive ? 'text-green-600' : 'text-red-600'}>
                          {formData.isActive ? 'Active (Visible on homepage)' : 'Inactive (Hidden)'}
                        </span>
                      </p>
                    </div>
                  </div>
                )}
              </div>

              {/* Modal Footer */}
              <div className="sticky bottom-0 bg-gray-50 p-6 flex gap-3 border-t border-gray-200 rounded-b-2xl">
                <button
                  onClick={() => {
                    setShowCreateModal(false)
                    setEditingCategory(null)
                    resetForm()
                  }}
                  className="flex-1 bg-gray-500 hover:bg-gray-600 text-white px-6 py-3 rounded-lg transition-all"
                >
                  Cancel
                </button>
                <button
                  onClick={editingCategory ? handleUpdateCategory : handleCreateCategory}
                  disabled={loading || uploadingProductImage || uploadingBackgroundImage}
                  className="flex-1 bg-purple-600 hover:bg-purple-700 text-white px-6 py-3 rounded-lg flex items-center justify-center gap-2 transition-all disabled:opacity-50"
                >
                  {uploadingProductImage || uploadingBackgroundImage ? (
                    <>
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                      Uploading Images...
                    </>
                  ) : (
                    <>
                      <Save size={20} />
                      {editingCategory ? 'Update Category' : 'Create Category'}
                    </>
                  )}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </div>
    </div>
  )
}
