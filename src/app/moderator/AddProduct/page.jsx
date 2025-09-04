'use client'

import { useState, useEffect, useRef, useContext } from 'react'
import { useForm, Controller } from 'react-hook-form'
import { motion, AnimatePresence } from 'framer-motion'
import Swal from 'sweetalert2'
import {
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
  Zap,
  X,
  Lock,
} from 'lucide-react'

import BarcodeReader from 'react-barcode-reader'

import { AuthContext } from '../../../../Provider/AuthProvider'

const MySwal = Swal

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

export default function ModeratorAddProduct() {
  const { user } = useContext(AuthContext)

  const {
    register,
    handleSubmit,
    watch,
    control,
    setValue,
    formState: { errors },
    reset,
  } = useForm()

  const [moderatorBranch, setModeratorBranch] = useState(null)
  const [moderatorRole, setModeratorRole] = useState(null)
  const [userLoading, setUserLoading] = useState(true)

  const [subCategoryOptions, setSubCategoryOptions] = useState([])
  const [branches, setBranches] = useState([])
  const [stock, setStock] = useState({})
  const [images, setImages] = useState([])
  const [isLoading, setIsLoading] = useState(false)
  const [showBarcodeScanner, setShowBarcodeScanner] = useState(false)

  const [dynamicCategories, setDynamicCategories] = useState(VAPE_CATEGORIES)
  const fileInputRef = useRef(null)

  const category = watch('category')

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
          MySwal.fire({
            icon: 'error',
            title: 'Error',
            text: 'Failed to load user details',
          })
        }
      } catch (error) {
        console.error('Error fetching user details:', error)
        MySwal.fire({
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

  useEffect(() => {
    const loadCategories = async () => {
      try {
        const response = await fetch('/api/products?getCategoriesOnly=true')
        if (response.ok) {
          const data = await response.json()
          setDynamicCategories(data.categories || VAPE_CATEGORIES)
          console.log('Loaded categories:', data.categories)
        } else {
          console.error('Failed to load categories, using defaults')
          setDynamicCategories(VAPE_CATEGORIES)
        }
      } catch (error) {
        console.error('Error loading categories:', error)
        setDynamicCategories(VAPE_CATEGORIES)
      }
    }

    loadCategories()
  }, [])

  useEffect(() => {
    const loadBranches = async () => {
      try {
        const response = await fetch('/api/branches')
        if (response.ok) {
          const data = await response.json()
          setBranches(data.branches || ['ghatpar', 'mirpur', 'gazipur'])
        } else {
          setBranches(['ghatpar', 'mirpur', 'gazipur'])
        }
      } catch (error) {
        console.error('Error loading branches:', error)
        setBranches(['ghatpar', 'mirpur', 'gazipur'])
      }
    }

    loadBranches()
  }, [])

  useEffect(() => {
    if (branches.length > 0) {
      const initialStock = {}
      branches.forEach((branch) => {
        initialStock[`${branch}_stock`] = 0
      })
      setStock(initialStock)
    }
  }, [branches])

  useEffect(() => {
    if (category && dynamicCategories[category]) {
      setSubCategoryOptions(dynamicCategories[category])
    } else {
      setSubCategoryOptions([])
    }
  }, [category, dynamicCategories])

  const handleBarcodeScan = async (data) => {
    try {
      if (data) {
        console.log('Scanned barcode:', data)

        const response = await fetch(`/api/products?barcode=${data}`)
        if (response.ok) {
          const productData = await response.json()

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
      setValue('barcode', data)
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

  const handleBarcodeScanError = (err) => {
    console.error('Barcode scan error:', err)
  }

  const handleImageUpload = (e) => {
    const files = Array.from(e.target.files)
    const newImages = files.map((file) => ({
      file,
      preview: URL.createObjectURL(file),
      id: Math.random().toString(36).substr(2, 9),
    }))
    setImages((prev) => [...prev, ...newImages])
  }

  const removeImage = (imageId) => {
    setImages((prev) => prev.filter((img) => img.id !== imageId))
    const imageToRemove = images.find((img) => img.id === imageId)
    if (imageToRemove) {
      URL.revokeObjectURL(imageToRemove.preview)
    }
  }

  const updateStock = (branchKey, value) => {
    if (!moderatorBranch) {
      console.log('Moderator branch not loaded yet')
      return
    }

    const expectedBranchKey = `${moderatorBranch}_stock`

    if (branchKey === expectedBranchKey) {
      console.log(
        `Updating ${branchKey} for moderator branch ${moderatorBranch}`
      )
      setStock((prev) => ({ ...prev, [branchKey]: parseInt(value) || 0 }))
    } else {
      console.log(
        `Blocked update attempt: ${branchKey} by moderator assigned to ${moderatorBranch}`
      )
      MySwal.fire({
        icon: 'warning',
        title: 'Access Restricted',
        text: `You can only manage stock for ${moderatorBranch} branch. You cannot update ${branchKey.replace(
          '_stock',
          ''
        )} branch stock.`,
        timer: 3000,
        showConfirmButton: false,
        toast: true,
        position: 'top-end',
      })
    }
  }

  const onSubmit = async (data) => {
    setIsLoading(true)
    try {
      console.log('Submitting form data:', data)

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

      reset()
      setStock({})
      setImages([])

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

  if (!moderatorBranch) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 via-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading branch information...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-blue-50 to-indigo-100 p-4">
      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="max-w-6xl mx-auto"
      >
        {/* Header with Moderator Badge */}
        <motion.div variants={itemVariants} className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2 flex items-center justify-center gap-3">
            <Package className="text-purple-600" size={40} />
            Add New Vape Product
            <span className="text-sm bg-orange-100 text-orange-800 px-3 py-1 rounded-full font-medium">
              Moderator
            </span>
          </h1>
          <p className="text-gray-600">
            Managing inventory for{' '}
            <strong className="capitalize">{moderatorBranch}</strong> branch
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

                  {/* Brand */}
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

                {/* 🔒 RESTRICTED: Categories (No Add Buttons) */}
                <motion.div variants={itemVariants} className="space-y-4">
                  <div className="flex justify-between items-center">
                    <h3 className="text-xl font-semibold text-gray-800 flex items-center gap-2">
                      <Tag size={20} className="text-purple-600" />
                      Categories
                    </h3>
                    <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded-full font-medium">
                      Read Only
                    </span>
                  </div>

                  {/* Category - No Add Custom Button */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Category *
                    </label>
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

                  {/* Subcategory - No Add Custom Button */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Subcategory *
                    </label>
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

                  {/* Info box about category restrictions */}
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 text-sm text-blue-800">
                    <div className="flex items-center gap-2">
                      <AlertCircle size={14} />
                      <span className="font-medium">Note:</span>
                    </div>
                    <p className="mt-1">
                      Categories are managed by administrators. You can see all
                      available options including newly added ones.
                    </p>
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
                      Stock Management
                    </h3>
                    <span className="text-xs bg-orange-100 text-orange-800 px-2 py-1 rounded-full font-medium">
                      Limited Access
                    </span>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {branches.map((branch) => (
                      <div key={branch}>
                        <label className="block text-sm font-medium text-gray-700 mb-2 capitalize flex items-center gap-2">
                          {branch} Stock
                          {branch !== moderatorBranch && (
                            <Lock size={14} className="text-gray-400" />
                          )}
                        </label>
                        <input
                          type="number"
                          min="0"
                          value={stock[`${branch}_stock`] || 0}
                          onChange={(e) =>
                            updateStock(`${branch}_stock`, e.target.value)
                          }
                          disabled={branch !== moderatorBranch}
                          className={`w-full p-4 rounded-xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-purple-500 ${
                            branch !== moderatorBranch
                              ? 'bg-gray-100 cursor-not-allowed opacity-60'
                              : 'bg-white'
                          }`}
                          placeholder={
                            branch !== moderatorBranch ? 'Restricted' : '0'
                          }
                        />
                      </div>
                    ))}
                  </div>

                  {branches.length === 0 && (
                    <div className="text-center py-8 text-gray-500">
                      <Store size={48} className="mx-auto mb-2" />
                      <p>No branches configured.</p>
                    </div>
                  )}

                  <div className="bg-orange-50 border border-orange-200 rounded-lg p-4 text-sm text-orange-800">
                    <div className="flex items-center gap-2 mb-1">
                      <AlertCircle size={16} />
                      <span className="font-medium">Access Limitation</span>
                    </div>
                    <p>
                      You can only manage stock for your assigned branch:{' '}
                      <strong className="capitalize">{moderatorBranch}</strong>
                    </p>
                  </div>
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
