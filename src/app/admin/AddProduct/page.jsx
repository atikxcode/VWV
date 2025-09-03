'use client'

import { useState, useEffect, useRef } from 'react'
import { useForm, Controller } from 'react-hook-form'
import { motion, AnimatePresence } from 'framer-motion'
import Swal from 'sweetalert2'
import {
  PlusCircle,
  Upload,
  AlertCircle,
  Scan,
  Package,
  DollarSign,
  Hash,
  Store,
  Tag,
  Image as ImageIcon,
  Trash2,
  Save,
  RotateCcw,
  Plus,
  Zap,
  X,
  Edit,
} from 'lucide-react'

// For barcode scanning
import BarcodeReader from 'react-barcode-reader'

// Use SweetAlert2 directly without React content wrapper
const MySwal = Swal

// Vape shop categories
const VAPE_CATEGORIES = {
  'E-LIQUID': [
    'Fruits',
    'Bakery & Dessert',
    'Tobacco',
    'Custard & Cream',
    'Coffee',
    'Menthol/Mint',
  ],
  TANKS: ['Rda', 'Rta', 'Rdta', 'Subohm', 'Disposable'],
  'NIC SALTS': [
    'Fruits',
    'Bakery & Dessert',
    'Tobacco',
    'Custard & Cream',
    'Coffee',
    'Menthol/Mint',
  ],
  'POD SYSTEM': ['Disposable', 'Refillable Pod Kit', 'Pre-Filled Cartridge'],
  DEVICE: ['Kit', 'Only Mod'],
  BORO: [
    'Alo (Boro)',
    'Boro Bridge and Cartridge',
    'Boro Accessories And Tools',
  ],
  ACCESSORIES: [
    'SibOhm Coil',
    'Charger',
    'Cotton',
    'Premade Coil',
    'Battery',
    'Tank Glass',
    'Cartridge',
    'RBA/RBK',
    'WIRE SPOOL',
    'DRIP TIP',
  ],
}

// 👇 UPDATED: Custom Branch Modal Component with API integration
const BranchModal = ({ isOpen, onClose, branches, onBranchUpdate }) => {
  const [newBranchName, setNewBranchName] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!newBranchName.trim()) {
      setError('Branch name is required')
      return
    }

    const cleanBranchName = newBranchName.trim().toLowerCase()
    if (branches.includes(cleanBranchName)) {
      setError('Branch already exists')
      return
    }

    setLoading(true)
    try {
      // 👇 API call to add branch
      const response = await fetch('/api/branches', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'add',
          branchName: cleanBranchName,
        }),
      })

      if (!response.ok) throw new Error('Failed to add branch')

      // Update local state
      const updatedBranches = [...branches, cleanBranchName]
      onBranchUpdate(updatedBranches)

      setNewBranchName('')
      setError('')

      MySwal.fire({
        icon: 'success',
        title: 'Branch Added!',
        text: `${newBranchName} branch has been added successfully`,
        timer: 2000,
        showConfirmButton: false,
        toast: true,
        position: 'top-end',
      })
    } catch (error) {
      console.error('Error adding branch:', error)
      setError('Failed to add branch')
    } finally {
      setLoading(false)
    }
  }

  const handleDeleteBranch = async (branchName) => {
    const result = await MySwal.fire({
      title: 'Delete Branch?',
      text: `Are you sure you want to delete "${branchName}" branch? This will affect all products using this branch.`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#d33',
      cancelButtonColor: '#3085d6',
      confirmButtonText: 'Yes, delete it!',
      cancelButtonText: 'Cancel',
    })

    if (result.isConfirmed) {
      setLoading(true)
      try {
        // 👇 API call to delete branch
        const response = await fetch('/api/branches', {
          method: 'DELETE',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ branchName }),
        })

        if (!response.ok) throw new Error('Failed to delete branch')

        // Update local state
        const updatedBranches = branches.filter((b) => b !== branchName)
        onBranchUpdate(updatedBranches)

        MySwal.fire({
          icon: 'success',
          title: 'Deleted!',
          text: `${branchName} branch has been deleted.`,
          timer: 2000,
          showConfirmButton: false,
          toast: true,
          position: 'top-end',
        })
      } catch (error) {
        console.error('Error deleting branch:', error)
        MySwal.fire({
          icon: 'error',
          title: 'Error',
          text: 'Failed to delete branch',
        })
      } finally {
        setLoading(false)
      }
    }
  }

  const handleClose = () => {
    setNewBranchName('')
    setError('')
    onClose()
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        className="bg-white rounded-2xl p-6 max-w-md w-full mx-4 max-h-[80vh] overflow-y-auto"
      >
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
            <Store size={24} className="text-purple-600" />
            Manage Branches
          </h3>
          <button
            onClick={handleClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <X size={24} />
          </button>
        </div>

        {/* Add New Branch Form */}
        <form onSubmit={handleSubmit} className="mb-6">
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Add New Branch
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                value={newBranchName}
                onChange={(e) => {
                  setNewBranchName(e.target.value)
                  setError('')
                }}
                placeholder="Enter branch name"
                className="flex-1 p-3 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-purple-500"
                disabled={loading}
              />
              <button
                type="submit"
                disabled={loading}
                className="px-4 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors disabled:opacity-50"
              >
                {loading ? (
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                ) : (
                  <Plus size={16} />
                )}
              </button>
            </div>
            {error && (
              <p className="text-red-500 text-sm mt-1 flex items-center gap-1">
                <AlertCircle size={16} />
                {error}
              </p>
            )}
          </div>
        </form>

        {/* Current Branches List */}
        <div>
          <h4 className="text-lg font-semibold text-gray-800 mb-3">
            Current Branches ({branches.length})
          </h4>
          <div className="space-y-2 max-h-48 overflow-y-auto">
            {branches.map((branch) => (
              <div
                key={branch}
                className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
              >
                <span className="font-medium text-gray-800 capitalize">
                  {branch}
                </span>
                <button
                  onClick={() => handleDeleteBranch(branch)}
                  className="text-red-500 hover:text-red-700 transition-colors p-1"
                  disabled={branches.length <= 1 || loading}
                  title={
                    branches.length <= 1
                      ? 'Cannot delete the last branch'
                      : 'Delete branch'
                  }
                >
                  <Trash2 size={16} />
                </button>
              </div>
            ))}
          </div>
        </div>

        <div className="flex justify-end mt-6">
          <button
            onClick={handleClose}
            className="px-6 py-3 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400 transition-colors"
          >
            Close
          </button>
        </div>
      </motion.div>
    </div>
  )
}

export default function AddProduct() {
  const {
    register,
    handleSubmit,
    watch,
    control,
    setValue,
    formState: { errors },
    reset,
  } = useForm()

  const [subCategoryOptions, setSubCategoryOptions] = useState([])
  const [branches, setBranches] = useState([]) // 👈 UPDATED: Start with empty array
  const [stock, setStock] = useState({})
  const [images, setImages] = useState([])
  const [isLoading, setIsLoading] = useState(false)
  const [showBarcodeScanner, setShowBarcodeScanner] = useState(false)
  const [showBranchModal, setShowBranchModal] = useState(false)

  // Fixed: Separate states for category and subcategory custom inputs
  const [isAddingCustomCategory, setIsAddingCustomCategory] = useState(false)
  const [isAddingCustomSubcategory, setIsAddingCustomSubcategory] =
    useState(false)
  const [customCategoryInput, setCustomCategoryInput] = useState('')
  const [customSubcategoryInput, setCustomSubcategoryInput] = useState('')

  const [dynamicCategories, setDynamicCategories] = useState(VAPE_CATEGORIES)
  const fileInputRef = useRef(null)

  const category = watch('category')

  // 👇 UPDATED: Load branches on component mount
  useEffect(() => {
    const loadBranches = async () => {
      try {
        const response = await fetch('/api/branches')
        if (response.ok) {
          const data = await response.json()
          setBranches(data.branches || ['ghatpar', 'mirpur', 'gazipur'])
        } else {
          // Fallback to default branches if API fails
          setBranches(['ghatpar', 'mirpur', 'gazipur'])
        }
      } catch (error) {
        console.error('Error loading branches:', error)
        setBranches(['ghatpar', 'mirpur', 'gazipur'])
      }
    }

    loadBranches()
  }, [])

  // Initialize stock for branches
  useEffect(() => {
    const initialStock = {}
    branches.forEach((branch) => {
      initialStock[`${branch}_stock`] = 0
    })
    setStock(initialStock)
  }, [branches])

  // Update subcategories when category changes
  useEffect(() => {
    if (category && dynamicCategories[category]) {
      setSubCategoryOptions(dynamicCategories[category])
    } else {
      setSubCategoryOptions([])
    }
  }, [category, dynamicCategories])

  // 👇 UPDATED: Handle branch updates from modal
  const handleBranchUpdate = (updatedBranches) => {
    setBranches(updatedBranches)

    // Update stock object to include new branches
    const newStock = {}
    updatedBranches.forEach((branch) => {
      newStock[`${branch}_stock`] = stock[`${branch}_stock`] || 0
    })
    setStock(newStock)
  }

  // Fixed: Real barcode scanning handler
  const handleBarcodeScan = async (data) => {
    try {
      if (data) {
        console.log('Scanned barcode:', data)

        // Fetch product data from barcode
        const response = await fetch(`/api/products?barcode=${data}`)
        if (response.ok) {
          const productData = await response.json()

          // Auto-fill form with existing product data
          setValue('name', productData.name || '')
          setValue('brand', productData.brand || '')
          setValue('barcode', data)
          setValue('price', productData.price || '')
          setValue('category', productData.category || '')
          setValue('subcategory', productData.subcategory || '')
          setValue('description', productData.description || '')
          setValue('nicotineStrength', productData.nicotineStrength || '')
          setValue('vgPgRatio', productData.vgPgRatio || '')
          setValue('flavor', productData.flavor || '')
          setValue('resistance', productData.resistance || '')
          setValue('wattageRange', productData.wattageRange || '')

          // Show success message using SweetAlert2
          MySwal.fire({
            icon: 'success',
            title: 'Product Found!',
            text: 'Product data has been loaded from barcode',
            timer: 2000,
            showConfirmButton: false,
            toast: true,
            position: 'top-end',
          })
        } else {
          // If product not found, just fill the barcode field
          setValue('barcode', data)
          MySwal.fire({
            icon: 'info',
            title: 'Product Not Found',
            text: 'Barcode filled - please enter other details manually.',
            timer: 3000,
            showConfirmButton: false,
            toast: true,
            position: 'top-end',
          })
        }
        setShowBarcodeScanner(false)
      }
    } catch (error) {
      console.error('Barcode scanning error:', error)
      setValue('barcode', data) // At least fill the barcode
      setShowBarcodeScanner(false)
      MySwal.fire({
        icon: 'error',
        title: 'Error',
        text: 'Error scanning barcode',
        timer: 2000,
        showConfirmButton: false,
        toast: true,
        position: 'top-end',
      })
    }
  }

  // Handle barcode scan error
  const handleBarcodeScanError = (err) => {
    console.error('Barcode scan error:', err)
  }

  // Handle image upload
  const handleImageUpload = (e) => {
    const files = Array.from(e.target.files)
    const newImages = files.map((file) => ({
      file,
      preview: URL.createObjectURL(file),
      id: Math.random().toString(36).substr(2, 9),
    }))
    setImages((prev) => [...prev, ...newImages])
  }

  // Remove image
  const removeImage = (imageId) => {
    setImages((prev) => prev.filter((img) => img.id !== imageId))
    // Clean up the preview URL
    const imageToRemove = images.find((img) => img.id === imageId)
    if (imageToRemove) {
      URL.revokeObjectURL(imageToRemove.preview)
    }
  }

  // Update stock for specific branch
  const updateStock = (branchKey, value) => {
    setStock((prev) => ({ ...prev, [branchKey]: parseInt(value) || 0 }))
  }

  // Fixed: Add custom category
  const handleAddCustomCategory = async () => {
    if (customCategoryInput.trim()) {
      try {
        const response = await fetch('/api/products', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            action: 'add_category',
            categoryName: customCategoryInput.toUpperCase(),
            subcategories: [],
          }),
        })

        if (response.ok) {
          setDynamicCategories((prev) => ({
            ...prev,
            [customCategoryInput.toUpperCase()]: [],
          }))
          // Set the new category as selected
          setValue('category', customCategoryInput.toUpperCase())
          // Reset states
          setCustomCategoryInput('')
          setIsAddingCustomCategory(false)

          MySwal.fire({
            icon: 'success',
            title: 'Category Added!',
            text: 'Custom category has been added successfully',
            timer: 2000,
            showConfirmButton: false,
            toast: true,
            position: 'top-end',
          })
        } else {
          MySwal.fire({
            icon: 'error',
            title: 'Error',
            text: 'Failed to add custom category',
            timer: 2000,
            showConfirmButton: false,
            toast: true,
            position: 'top-end',
          })
        }
      } catch (error) {
        console.error('Error adding category:', error)
        MySwal.fire({
          icon: 'error',
          title: 'Error',
          text: 'Error adding custom category',
          timer: 2000,
          showConfirmButton: false,
          toast: true,
          position: 'top-end',
        })
      }
    }
  }

  // Fixed: Add custom subcategory
  const handleAddCustomSubcategory = async () => {
    if (customSubcategoryInput.trim() && category) {
      try {
        const response = await fetch('/api/products', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            action: 'add_subcategory',
            categoryName: category,
            subcategoryName: customSubcategoryInput,
          }),
        })

        if (response.ok) {
          setDynamicCategories((prev) => ({
            ...prev,
            [category]: [...(prev[category] || []), customSubcategoryInput],
          }))
          setSubCategoryOptions((prev) => [...prev, customSubcategoryInput])
          // Set the new subcategory as selected
          setValue('subcategory', customSubcategoryInput)
          // Reset states
          setCustomSubcategoryInput('')
          setIsAddingCustomSubcategory(false)

          MySwal.fire({
            icon: 'success',
            title: 'Subcategory Added!',
            text: 'Custom subcategory has been added successfully',
            timer: 2000,
            showConfirmButton: false,
            toast: true,
            position: 'top-end',
          })
        } else {
          MySwal.fire({
            icon: 'error',
            title: 'Error',
            text: 'Failed to add custom subcategory',
            timer: 2000,
            showConfirmButton: false,
            toast: true,
            position: 'top-end',
          })
        }
      } catch (error) {
        console.error('Error adding subcategory:', error)
        MySwal.fire({
          icon: 'error',
          title: 'Error',
          text: 'Error adding custom subcategory',
          timer: 2000,
          showConfirmButton: false,
          toast: true,
          position: 'top-end',
        })
      }
    }
  }

  // Form submission with enhanced error handling
  const onSubmit = async (data) => {
    setIsLoading(true)
    try {
      console.log('Submitting form data:', data)

      // Create product (removed SKU from data)
      const productData = {
        ...data,
        stock,
        nicotineStrength: data.nicotineStrength || null,
        vgPgRatio: data.vgPgRatio || null,
        resistance: data.resistance || null,
        wattageRange: data.wattageRange || null,
        tags: data.tags ? data.tags.split(',').map((tag) => tag.trim()) : [],
      }

      console.log('Sending product data:', productData)

      const response = await fetch('/api/products', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(productData),
      })

      console.log('Response status:', response.status)
      console.log('Response headers:', response.headers.get('content-type'))

      // Check if response is actually JSON
      const contentType = response.headers.get('content-type')
      if (!contentType || !contentType.includes('application/json')) {
        const textResponse = await response.text()
        console.error('Non-JSON response received:', textResponse)
        throw new Error(
          `Server returned non-JSON response. Status: ${response.status}`
        )
      }

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to create product')
      }

      const result = await response.json()
      console.log('Product created:', result)
      const productId = result.product._id

      // Upload images if any
      if (images.length > 0) {
        console.log('Uploading images...')
        const formData = new FormData()
        formData.append('productId', productId)
        images.forEach((image) => {
          formData.append('images', image.file)
        })

        const imageResponse = await fetch('/api/products', {
          method: 'PUT',
          body: formData,
        })

        console.log('Image upload status:', imageResponse.status)

        // Check image upload response
        const imageContentType = imageResponse.headers.get('content-type')
        if (
          !imageContentType ||
          !imageContentType.includes('application/json')
        ) {
          const imageTextResponse = await imageResponse.text()
          console.error('Non-JSON image response:', imageTextResponse)
          console.warn('Image upload failed, but product was created')
        } else if (!imageResponse.ok) {
          const imageErrorData = await imageResponse.json()
          console.error('Image upload error:', imageErrorData)
          console.warn('Image upload failed, but product was created')
        } else {
          const imageResult = await imageResponse.json()
          console.log('Images uploaded:', imageResult)
        }
      }

      // Reset form and states
      reset()
      setStock({})
      setImages([])
      setIsAddingCustomCategory(false)
      setIsAddingCustomSubcategory(false)
      setCustomCategoryInput('')
      setCustomSubcategoryInput('')

      // Show success message using SweetAlert2
      MySwal.fire({
        icon: 'success',
        title: 'Success!',
        text: 'Product has been added successfully!',
        confirmButtonColor: '#8B5CF6',
        confirmButtonText: 'Great!',
      })
    } catch (error) {
      console.error('Full error details:', error)
      console.error('Error stack:', error.stack)

      // Show error message using SweetAlert2
      MySwal.fire({
        icon: 'error',
        title: 'Oops...',
        text: 'Error adding product: ' + error.message,
        confirmButtonColor: '#8B5CF6',
        confirmButtonText: 'Try Again',
      })
    } finally {
      setIsLoading(false)
    }
  }

  // Animation variants
  const containerVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.6,
        staggerChildren: 0.1,
      },
    },
  }

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 },
  }

  const inputVariants = {
    focus: {
      scale: 1.02,
      borderColor: '#8B5CF6',
      transition: { duration: 0.2 },
    },
    error: {
      borderColor: '#EF4444',
      x: [-3, 3, -3, 0],
      transition: { duration: 0.3 },
    },
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-blue-50 to-indigo-100 p-4">
      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="max-w-6xl mx-auto"
      >
        {/* Header */}
        <motion.div variants={itemVariants} className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2 flex items-center justify-center gap-3">
            <Package className="text-purple-600" size={40} />
            Add New Vape Product
          </h1>
          <p className="text-gray-600">
            Manage your vape shop inventory with style
          </p>
        </motion.div>

        {/* Main Form */}
        <motion.div
          variants={itemVariants}
          className="bg-white rounded-3xl shadow-2xl overflow-hidden"
        >
          {/* Header with Barcode Scanner */}
          <div className="bg-gradient-to-r from-purple-600 to-indigo-600 p-6">
            <div className="flex justify-between items-center">
              <div className="text-white">
                <h2 className="text-2xl font-bold">Product Information</h2>
                <p className="opacity-90">Fill in the details below</p>
              </div>
              <motion.button
                type="button"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setShowBarcodeScanner(true)}
                className="bg-white bg-opacity-20 text-purple-500 px-6 py-3 rounded-xl flex items-center gap-2 hover:bg-opacity-30 transition-all"
              >
                <Scan size={20} />
                Scan Barcode
              </motion.button>
            </div>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="p-8">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Left Column */}
              <div className="space-y-6">
                {/* Basic Information */}
                <motion.div variants={itemVariants} className="space-y-4">
                  <h3 className="text-xl font-semibold text-gray-800 flex items-center gap-2">
                    <Package size={20} className="text-purple-600" />
                    Basic Information
                  </h3>

                  {/* Product Name */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Product Name *
                    </label>
                    <motion.input
                      variants={inputVariants}
                      animate={errors.name ? 'error' : 'focus'}
                      type="text"
                      {...register('name', {
                        required: 'Product name is required',
                      })}
                      placeholder="Enter product name"
                      className="w-full p-4 rounded-xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
                    />
                    <AnimatePresence>
                      {errors.name && (
                        <motion.span
                          initial={{ opacity: 0, y: -10 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: -10 }}
                          className="text-red-500 text-sm flex items-center gap-1 mt-1"
                        >
                          <AlertCircle size={16} /> {errors.name.message}
                        </motion.span>
                      )}
                    </AnimatePresence>
                  </div>

                  {/* Brand - Now Full Width */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Brand
                    </label>
                    <input
                      type="text"
                      {...register('brand')}
                      placeholder="Enter brand name"
                      className="w-full p-4 rounded-xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
                    />
                  </div>

                  {/* Barcode */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Barcode
                    </label>
                    <div className="relative">
                      <input
                        type="text"
                        {...register('barcode')}
                        placeholder="Enter or scan barcode"
                        className="w-full p-4 pr-12 rounded-xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
                      />
                      <Hash
                        className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400"
                        size={20}
                      />
                    </div>
                  </div>
                </motion.div>

                {/* Categories */}
                <motion.div variants={itemVariants} className="space-y-4">
                  <h3 className="text-xl font-semibold text-gray-800 flex items-center gap-2">
                    <Tag size={20} className="text-purple-600" />
                    Categories
                  </h3>

                  {/* Category */}
                  <div>
                    <div className="flex justify-between items-center mb-2">
                      <label className="block text-sm font-medium text-gray-700">
                        Category *
                      </label>
                      <button
                        type="button"
                        onClick={() =>
                          setIsAddingCustomCategory(!isAddingCustomCategory)
                        }
                        className="text-purple-600 hover:text-purple-700 text-sm flex items-center gap-1"
                      >
                        <Plus size={14} /> Add Custom
                      </button>
                    </div>

                    {isAddingCustomCategory ? (
                      <div className="flex gap-2">
                        <input
                          type="text"
                          value={customCategoryInput}
                          onChange={(e) =>
                            setCustomCategoryInput(e.target.value)
                          }
                          placeholder="Enter custom category"
                          className="flex-1 p-4 rounded-xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-purple-500"
                        />
                        <button
                          type="button"
                          onClick={handleAddCustomCategory}
                          className="px-4 py-2 bg-purple-600 text-white rounded-xl hover:bg-purple-700"
                        >
                          Add
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setIsAddingCustomCategory(false)
                            setCustomCategoryInput('')
                          }}
                          className="px-4 py-2 bg-gray-300 text-gray-700 rounded-xl hover:bg-gray-400"
                        >
                          <X size={16} />
                        </button>
                      </div>
                    ) : (
                      <select
                        {...register('category', {
                          required: 'Category is required',
                        })}
                        className="w-full p-4 rounded-xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-purple-500 bg-white"
                      >
                        <option value="">Select Category</option>
                        {Object.keys(dynamicCategories).map((cat) => (
                          <option key={cat} value={cat}>
                            {cat}
                          </option>
                        ))}
                      </select>
                    )}
                    <AnimatePresence>
                      {errors.category && (
                        <motion.span
                          initial={{ opacity: 0, y: -10 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: -10 }}
                          className="text-red-500 text-sm flex items-center gap-1 mt-1"
                        >
                          <AlertCircle size={16} /> {errors.category.message}
                        </motion.span>
                      )}
                    </AnimatePresence>
                  </div>

                  {/* Subcategory */}
                  <div>
                    <div className="flex justify-between items-center mb-2">
                      <label className="block text-sm font-medium text-gray-700">
                        Subcategory *
                      </label>
                      {category && (
                        <button
                          type="button"
                          onClick={() =>
                            setIsAddingCustomSubcategory(
                              !isAddingCustomSubcategory
                            )
                          }
                          className="text-purple-600 hover:text-purple-700 text-sm flex items-center gap-1"
                        >
                          <Plus size={14} /> Add Custom
                        </button>
                      )}
                    </div>

                    {isAddingCustomSubcategory ? (
                      <div className="flex gap-2">
                        <input
                          type="text"
                          value={customSubcategoryInput}
                          onChange={(e) =>
                            setCustomSubcategoryInput(e.target.value)
                          }
                          placeholder="Enter custom subcategory"
                          className="flex-1 p-4 rounded-xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-purple-500"
                        />
                        <button
                          type="button"
                          onClick={handleAddCustomSubcategory}
                          className="px-4 py-2 bg-purple-600 text-white rounded-xl hover:bg-purple-700"
                        >
                          Add
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setIsAddingCustomSubcategory(false)
                            setCustomSubcategoryInput('')
                          }}
                          className="px-4 py-2 bg-gray-300 text-gray-700 rounded-xl hover:bg-gray-400"
                        >
                          <X size={16} />
                        </button>
                      </div>
                    ) : (
                      <select
                        {...register('subcategory', {
                          required: 'Subcategory is required',
                        })}
                        className="w-full p-4 rounded-xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-purple-500 bg-white"
                      >
                        <option value="">Select Subcategory</option>
                        {subCategoryOptions.map((option) => (
                          <option key={option} value={option}>
                            {option}
                          </option>
                        ))}
                      </select>
                    )}
                    <AnimatePresence>
                      {errors.subcategory && (
                        <motion.span
                          initial={{ opacity: 0, y: -10 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: -10 }}
                          className="text-red-500 text-sm flex items-center gap-1 mt-1"
                        >
                          <AlertCircle size={16} /> {errors.subcategory.message}
                        </motion.span>
                      )}
                    </AnimatePresence>
                  </div>
                </motion.div>

                {/* Pricing */}
                <motion.div variants={itemVariants} className="space-y-4">
                  <h3 className="text-xl font-semibold text-gray-800 flex items-center gap-2">
                    <DollarSign size={20} className="text-purple-600" />
                    Pricing
                  </h3>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Price *
                      </label>
                      <div className="relative">
                        <input
                          type="number"
                          step="0.01"
                          {...register('price', {
                            required: 'Price is required',
                            min: 0,
                          })}
                          placeholder="0.00"
                          className="w-full p-4 pl-12 rounded-xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-purple-500"
                        />
                        <DollarSign
                          className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400"
                          size={20}
                        />
                      </div>
                      <AnimatePresence>
                        {errors.price && (
                          <motion.span
                            initial={{ opacity: 0, y: -10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -10 }}
                            className="text-red-500 text-sm flex items-center gap-1 mt-1"
                          >
                            <AlertCircle size={16} /> {errors.price.message}
                          </motion.span>
                        )}
                      </AnimatePresence>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Compare Price
                      </label>
                      <div className="relative">
                        <input
                          type="number"
                          step="0.01"
                          {...register('comparePrice', { min: 0 })}
                          placeholder="0.00"
                          className="w-full p-4 pl-12 rounded-xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-purple-500"
                        />
                        <DollarSign
                          className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400"
                          size={20}
                        />
                      </div>
                    </div>
                  </div>
                </motion.div>
              </div>

              {/* Right Column */}
              <div className="space-y-6">
                {/* Vape-Specific Fields */}
                <motion.div variants={itemVariants} className="space-y-4">
                  <h3 className="text-xl font-semibold text-gray-800 flex items-center gap-2">
                    <Zap size={20} className="text-purple-600" />
                    Vape Specifications
                  </h3>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Nicotine Strength
                      </label>
                      <select
                        {...register('nicotineStrength')}
                        className="w-full p-4 rounded-xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-purple-500 bg-white"
                      >
                        <option value="">Select Strength</option>
                        <option value="0mg">0mg</option>
                        <option value="3mg">3mg</option>
                        <option value="6mg">6mg</option>
                        <option value="12mg">12mg</option>
                        <option value="18mg">18mg</option>
                        <option value="24mg">24mg</option>
                        <option value="50mg">50mg</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        VG/PG Ratio
                      </label>
                      <select
                        {...register('vgPgRatio')}
                        className="w-full p-4 rounded-xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-purple-500 bg-white"
                      >
                        <option value="">Select Ratio</option>
                        <option value="50/50">50/50</option>
                        <option value="60/40">60/40</option>
                        <option value="70/30">70/30</option>
                        <option value="80/20">80/20</option>
                        <option value="Max VG">Max VG</option>
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Resistance
                      </label>
                      <input
                        type="text"
                        {...register('resistance')}
                        placeholder="e.g., 0.5Ω"
                        className="w-full p-4 rounded-xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-purple-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Wattage Range
                      </label>
                      <input
                        type="text"
                        {...register('wattageRange')}
                        placeholder="e.g., 5-80W"
                        className="w-full p-4 rounded-xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-purple-500"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Flavor
                    </label>
                    <input
                      type="text"
                      {...register('flavor')}
                      placeholder="Enter flavor profile"
                      className="w-full p-4 rounded-xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-purple-500"
                    />
                  </div>
                </motion.div>

                {/* Stock Management */}
                <motion.div variants={itemVariants} className="space-y-4">
                  <div className="flex justify-between items-center">
                    <h3 className="text-xl font-semibold text-gray-800 flex items-center gap-2">
                      <Store size={20} className="text-purple-600" />
                      Stock Management ({branches.length} branches)
                    </h3>
                    <button
                      type="button"
                      onClick={() => setShowBranchModal(true)}
                      className="text-purple-600 hover:text-purple-700 text-sm flex items-center gap-1"
                    >
                      <Edit size={14} /> Manage Branches
                    </button>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {branches.map((branch) => (
                      <div key={branch}>
                        <label className="block text-sm font-medium text-gray-700 mb-2 capitalize">
                          {branch} Stock
                        </label>
                        <input
                          type="number"
                          min="0"
                          value={stock[`${branch}_stock`] || 0}
                          onChange={(e) =>
                            updateStock(`${branch}_stock`, e.target.value)
                          }
                          className="w-full p-4 rounded-xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-purple-500"
                        />
                      </div>
                    ))}
                  </div>

                  {branches.length === 0 && (
                    <div className="text-center py-8 text-gray-500">
                      <Store size={48} className="mx-auto mb-2" />
                      <p>
                        No branches configured. Please add branches to manage
                        stock.
                      </p>
                    </div>
                  )}
                </motion.div>

                {/* Image Upload */}
                <motion.div variants={itemVariants} className="space-y-4">
                  <h3 className="text-xl font-semibold text-gray-800 flex items-center gap-2">
                    <ImageIcon size={20} className="text-purple-600" />
                    Product Images
                  </h3>

                  <div className="border-2 border-dashed border-purple-300 rounded-xl p-6 text-center">
                    <input
                      ref={fileInputRef}
                      type="file"
                      multiple
                      accept="image/*"
                      onChange={handleImageUpload}
                      className="hidden"
                    />
                    <Upload
                      className="mx-auto text-purple-400 mb-4"
                      size={48}
                    />
                    <p className="text-gray-600 mb-4">
                      Drag & drop images or click to browse
                    </p>
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="px-6 py-3 bg-purple-600 text-white rounded-xl hover:bg-purple-700 transition-colors"
                    >
                      Choose Files
                    </button>
                  </div>

                  {/* Image Preview */}
                  {images.length > 0 && (
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                      {images.map((image) => (
                        <div key={image.id} className="relative group">
                          <img
                            src={image.preview}
                            alt="Preview"
                            className="w-full h-32 object-cover rounded-xl"
                          />
                          <button
                            type="button"
                            onClick={() => removeImage(image.id)}
                            className="absolute top-2 right-2 p-2 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </motion.div>
              </div>
            </div>

            {/* Description & Tags */}
            <motion.div variants={itemVariants} className="mt-8 space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Description
                </label>
                <textarea
                  {...register('description')}
                  rows={4}
                  placeholder="Enter product description"
                  className="w-full p-4 rounded-xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-purple-500 resize-none"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Tags (comma separated)
                </label>
                <input
                  type="text"
                  {...register('tags')}
                  placeholder="e.g., sweet, fruity, popular"
                  className="w-full p-4 rounded-xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
              </div>
            </motion.div>

            {/* Action Buttons */}
            <motion.div
              variants={itemVariants}
              className="flex flex-col sm:flex-row gap-4 mt-8 pt-6 border-t border-gray-200"
            >
              <motion.button
                type="button"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => {
                  reset()
                  setStock({})
                  setImages([])
                  setIsAddingCustomCategory(false)
                  setIsAddingCustomSubcategory(false)
                  setCustomCategoryInput('')
                  setCustomSubcategoryInput('')
                }}
                className="flex-1 py-4 px-6 bg-gray-100 text-gray-700 rounded-xl font-semibold flex items-center justify-center gap-2 hover:bg-gray-200 transition-colors"
              >
                <RotateCcw size={20} />
                Reset Form
              </motion.button>

              <motion.button
                type="submit"
                disabled={isLoading}
                whileHover={!isLoading ? { scale: 1.02 } : {}}
                whileTap={!isLoading ? { scale: 0.98 } : {}}
                className="flex-1 py-4 px-6 bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-xl font-semibold flex items-center justify-center gap-2 hover:from-purple-700 hover:to-indigo-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoading ? (
                  <>
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                    Adding Product...
                  </>
                ) : (
                  <>
                    <Save size={20} />
                    Add Product
                  </>
                )}
              </motion.button>
            </motion.div>
          </form>
        </motion.div>

        {/* 👇 UPDATED: Branch Management Modal with API integration */}
        <BranchModal
          isOpen={showBranchModal}
          onClose={() => setShowBranchModal(false)}
          branches={branches}
          onBranchUpdate={handleBranchUpdate}
        />

        {/* Barcode Scanner Modal */}
        <AnimatePresence>
          {showBarcodeScanner && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
            >
              <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.9, opacity: 0 }}
                className="bg-white rounded-2xl p-8 max-w-md w-full mx-4"
              >
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
                    <Scan size={24} className="text-purple-600" />
                    Barcode Scanner
                  </h3>
                  <button
                    onClick={() => setShowBarcodeScanner(false)}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    <X size={24} />
                  </button>
                </div>

                <div className="bg-gray-100 rounded-xl p-4 mb-4">
                  <BarcodeReader
                    onError={handleBarcodeScanError}
                    onScan={handleBarcodeScan}
                    style={{ width: '100%' }}
                  />
                  <p className="text-gray-600 text-center mt-2">
                    Position barcode in the frame
                  </p>
                </div>

                <button
                  onClick={() => setShowBarcodeScanner(false)}
                  className="w-full py-3 bg-gray-300 text-gray-700 rounded-xl hover:bg-gray-400 transition-colors"
                >
                  Cancel
                </button>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  )
}
