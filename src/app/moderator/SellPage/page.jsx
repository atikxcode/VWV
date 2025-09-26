'use client'

import { useState, useEffect, useContext } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core'
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  useSortable,
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import Swal from 'sweetalert2'
import BarcodeReader from 'react-barcode-reader'
import jsPDF from 'jspdf'
import html2canvas from 'html2canvas-pro'
import {
  Scan,
  Search,
  Filter,
  Package,
  ShoppingCart,
  Plus,
  Minus,
  X,
  CreditCard,
  Smartphone,
  Wallet,
  Banknote,
  Store,
  Tag,
  User,
  Receipt,
  AlertCircle,
  Clock,
  CheckCircle,
  Settings,
  Camera,
  DollarSign,
  Hash,
  Package2,
  Download,
  Eye,
  Calendar,
  Phone,
  Mail,
  MapPin,
  Trash2,
  GripVertical,
  FileText,
  Printer,
  Globe,
  Shield,
  Info,
  Palette,
  Zap,
  Droplets, 
  Battery, 
  Star,
  ChevronLeft,
  ChevronRight
} from 'lucide-react'

// 🔒 Import your cart hook
import { useCart } from '../../../../components/hooks/useCart'
// 🔒 Import AuthContext to get moderator info
import { AuthContext } from '../../../../Provider/AuthProvider'

// Payment Methods Configuration (same as admin)
const PAYMENT_METHODS = [
  {
    id: 'cash',
    name: 'Cash',
    icon: Banknote,
    color: 'from-emerald-500 to-green-600',
    textColor: 'text-emerald-700',
    borderColor: 'border-emerald-200',
    bgColor: 'bg-emerald-50',
    type: 'cash',
  },
  {
    id: 'bkash',
    name: 'bKash',
    icon: Smartphone,
    color: 'from-pink-500 to-rose-600',
    textColor: 'text-pink-700',
    borderColor: 'border-pink-200',
    bgColor: 'bg-pink-50',
    type: 'mobile_banking',
  },
  {
    id: 'nagad',
    name: 'Nagad',
    icon: Smartphone,
    color: 'from-orange-500 to-amber-600',
    textColor: 'text-orange-700',
    borderColor: 'border-orange-200',
    bgColor: 'bg-orange-50',
    type: 'mobile_banking',
  },
  {
    id: 'visa',
    name: 'Visa',
    icon: CreditCard,
    color: 'from-blue-500 to-indigo-600',
    textColor: 'text-blue-700',
    borderColor: 'border-blue-200',
    bgColor: 'bg-blue-50',
    type: 'card',
  },
  {
    id: 'mastercard',
    name: 'MasterCard',
    icon: CreditCard,
    color: 'from-red-500 to-rose-600',
    textColor: 'text-red-700',
    borderColor: 'border-red-200',
    bgColor: 'bg-red-50',
    type: 'card',
  },
  {
    id: 'debit_card',
    name: 'Debit Card',
    icon: CreditCard,
    color: 'from-purple-500 to-violet-600',
    textColor: 'text-purple-700',
    borderColor: 'border-purple-200',
    bgColor: 'bg-purple-50',
    type: 'card',
  },
]

// Authentication helper functions (same as admin)
const getAuthHeaders = (bustCache = false) => {
  const token = getAuthToken()
  const headers = {
    'Authorization': token,
    'Content-Type': 'application/json'
  }
  
  if (bustCache) {
    headers['Cache-Control'] = 'no-cache, no-store, must-revalidate'
    headers['Pragma'] = 'no-cache'
    headers['Expires'] = '0'
  }
  
  return headers
}

const getAuthToken = () => {
  if (typeof window !== 'undefined') {
    // 🔥 TRY MULTIPLE TOKEN STORAGE KEYS
    const possibleTokens = [
      localStorage.getItem('authToken'),
      sessionStorage.getItem('authToken'),
      localStorage.getItem('auth-token'),      // Your admin might use this
      sessionStorage.getItem('auth-token'),
      localStorage.getItem('moderatorToken'),  // Might be stored separately
      sessionStorage.getItem('moderatorToken'),
      localStorage.getItem('token'),
      sessionStorage.getItem('token')
    ]
    
    // Return the first non-null token
    for (const token of possibleTokens) {
      if (token && token.trim()) {
        console.log('🔥 MODERATOR TOKEN FOUND:', token.substring(0, 30) + '...')
        return token.startsWith('Bearer ') ? token : `Bearer ${token}`
      }
    }
    
    console.error('🔥 NO MODERATOR TOKEN FOUND - CHECK LOGIN PROCESS')
    return null
  }
  return null
}



const makeAuthenticatedRequest = async (url, options = {}, bustCache = false) => {
  const token = getAuthToken()
  
  // 🔥 CRITICAL: If no token, redirect to login immediately
  if (!token) {
    console.error('🔥 NO TOKEN AVAILABLE - REDIRECTING TO LOGIN')
    Swal.fire({
      icon: 'error',
      title: 'Authentication Required',
      text: 'Please login to continue.',
      confirmButtonText: 'Go to Login'
    }).then(() => {
      window.location.href = '/RegistrationPage' // 🔒 Moderator login page
    })
    throw new Error('No authentication token available')
  }
  
  const headers = {
    'Content-Type': 'application/json',
    'Authorization': token, // Token already includes "Bearer " prefix
    ...options.headers,
  }
  
  if (bustCache) {
    headers['Cache-Control'] = 'no-cache, no-store, must-revalidate'
    headers['Pragma'] = 'no-cache'
    headers['Expires'] = '0'
    
    const separator = url.includes('?') ? '&' : '?'
    url = `${url}${separator}_t=${Date.now()}`
  }
  
  console.log('🔥 MAKING AUTHENTICATED REQUEST:', {
    url: url.split('?')[0],
    method: options.method || 'GET',
    hasToken: !!token,
    tokenStart: token?.substring(0, 30) + '...'
  })
  
  const response = await fetch(url, {
    ...options,
    headers,
  })

  if (response.status === 401) {
    console.log('🔥 TOKEN EXPIRED OR INVALID: Clearing authentication and redirecting to login')
    
    if (typeof window !== 'undefined') {
      // Clear all possible token storage locations
      localStorage.removeItem('authToken')
      sessionStorage.removeItem('authToken')
      localStorage.removeItem('auth-token')
      sessionStorage.removeItem('auth-token')
      localStorage.removeItem('moderatorToken')
      sessionStorage.removeItem('moderatorToken')
      localStorage.removeItem('token')
      sessionStorage.removeItem('token')
      localStorage.removeItem('userRole')
      localStorage.removeItem('userBranch')
    }
    
    Swal.fire({
      icon: 'warning',
      title: 'Session Expired',
      text: 'Your session has expired. Please sign in again to continue.',
      confirmButtonText: 'Go to Login',
      allowOutsideClick: false,
      allowEscapeKey: false
    }).then(() => {
      window.location.href = '/RegistrationPage' // 🔒 Change to moderator login
    })
    
    return response
  }

  return response
}


// 🔒 MODERATOR-SPECIFIC: Product Details Modal with branch restrictions
const ProductDetailsModal = ({ isOpen, product, moderatorBranch, onClose, onAddToCart }) => {
  const [selectedNicotineStrength, setSelectedNicotineStrength] = useState('')
  const [selectedVgPgRatio, setSelectedVgPgRatio] = useState('')
  const [selectedColor, setSelectedColor] = useState('')

  // Reset selections when modal opens/closes or product changes
  useEffect(() => {
    if (isOpen && product) {
      setSelectedNicotineStrength('')
      setSelectedVgPgRatio('')
      setSelectedColor('')
    }
  }, [isOpen, product])

  if (!product) return null

  // Get technical specifications (same as admin)
  const getAvailableSpecifications = () => {
    if (!product) return []
    
    const specifications = []
    
    const specificationMap = {
      flavor: { label: 'Flavor', icon: Droplets, color: 'text-blue-500' },
      resistance: { label: 'Resistance', icon: Zap, color: 'text-yellow-500', unit: 'Ω' },
      wattageRange: { label: 'Wattage Range', icon: Battery, color: 'text-green-500', unit: 'W' },
      bottleSizes: { label: 'Bottle Size', icon: Package, color: 'text-purple-500' },
      bottleType: { label: 'Bottle Type', icon: Package, color: 'text-indigo-500' },
      unit: { label: 'Unit', icon: Settings, color: 'text-gray-500' },
      puffs: { label: 'Puffs', icon: Droplets, color: 'text-pink-500' },
      coil: { label: 'Coil Type', icon: Settings, color: 'text-orange-500' },
      volume: { label: 'Volume', icon: Droplets, color: 'text-cyan-500' },
      charging: { label: 'Charging', icon: Battery, color: 'text-green-600' },
      chargingTime: { label: 'Charging Time', icon: Clock, color: 'text-red-500' },
    }
    
    Object.entries(specificationMap).forEach(([key, config]) => {
      if (product[key] && product[key].toString().trim() !== '') {
        specifications.push({
          key,
          label: config.label,
          value: product[key],
          icon: config.icon,
          color: config.color,
          unit: config.unit || ''
        })
      }
    })
    
    return specifications
  }

  // 🔒 MODERATOR RESTRICTION: Only show moderator's branch
  const getBranches = () => {
    return [moderatorBranch]
  }

  const productBranches = getBranches()

  // Get branch stock status for moderator's branch only
  const getBranchStockStatus = (branchName) => {
    const stockKey = `${branchName}_stock`
    const stockValue = product?.stock?.[stockKey] || 0
    return stockValue > 0
  }

  // Check if product has branch specifications for moderator's branch
  const hasBranchSpecifications = () => {
    return product?.branchSpecifications && 
           Object.keys(product.branchSpecifications).includes(moderatorBranch.toLowerCase())
  }

  // Check if product has any specifications
  const hasAnySpecifications = () => {
    if (!product?.branchSpecifications || !moderatorBranch) return false
    
    const branchSpec = product.branchSpecifications[moderatorBranch.toLowerCase()]
    if (!branchSpec) return false

    const nicotineOptions = branchSpec.nicotineStrength || []
    const vgPgOptions = branchSpec.vgPgRatio || []
    const colorOptions = branchSpec.colors || []
    
    return nicotineOptions.length > 0 || vgPgOptions.length > 0 || colorOptions.length > 0
  }

  // 🔒 MODERATOR RESTRICTION: Get specification values only from moderator's branch
  const getUniqueSpecificationValues = (specType) => {
    if (!product?.branchSpecifications || !moderatorBranch) return []
    
    const branchSpec = product.branchSpecifications[moderatorBranch.toLowerCase()]
    if (!branchSpec || !branchSpec[specType]) return []
    
    return branchSpec[specType] || []
  }

  // Check if specification should show as text
  const shouldShowAsText = (specType) => {
    const options = getUniqueSpecificationValues(specType)
    return options.length === 1
  }

  // Get single specification value
  const getSingleSpecificationValue = (specType) => {
    const options = getUniqueSpecificationValues(specType)
    return options[0] || ''
  }

  // Check if any selections are made
  const hasAnySelections = () => {
    return selectedNicotineStrength || selectedVgPgRatio || selectedColor
  }

  // 🔒 MODERATOR RESTRICTION: Always return moderator's branch if has stock
  const getAvailableBranchesForSelection = () => {
    const hasStock = getBranchStockStatus(moderatorBranch)
    if (!hasStock) return []

    if (!hasAnySelections()) {
      return [moderatorBranch]
    }

    // Check if selections are available in moderator's branch
    const branchSpec = product.branchSpecifications?.[moderatorBranch.toLowerCase()]
    if (!branchSpec) return hasStock ? [moderatorBranch] : []

    if (selectedNicotineStrength && branchSpec.nicotineStrength && 
        !branchSpec.nicotineStrength.includes(selectedNicotineStrength)) {
      return []
    }
    
    if (selectedVgPgRatio && branchSpec.vgPgRatio && 
        !branchSpec.vgPgRatio.includes(selectedVgPgRatio)) {
      return []
    }
    
    if (selectedColor && branchSpec.colors && 
        !branchSpec.colors.includes(selectedColor)) {
      return []
    }

    return [moderatorBranch]
  }

  // Validate required selections
  const validateSelections = () => {
    const nicotineOptions = getUniqueSpecificationValues('nicotineStrength')
    const vgPgOptions = getUniqueSpecificationValues('vgPgRatio')
    const colorOptions = getUniqueSpecificationValues('colors')

    const errors = []

    if (nicotineOptions.length > 1 && !selectedNicotineStrength) {
      errors.push('Nicotine Strength')
    }
    if (vgPgOptions.length > 1 && !selectedVgPgRatio) {
      errors.push('VG/PG Ratio')
    }
    if (colorOptions.length > 1 && !selectedColor) {
      errors.push('Color')
    }

    return errors
  }

  // Check if all required selections are made
  const areAllRequiredSelectionsMade = () => {
    if (hasAnySpecifications()) {
      const missingSelections = validateSelections()
      if (missingSelections.length > 0) {
        return false
      }
    }
    
    return true
  }

  // Check if add to cart is enabled
  const isAddToCartEnabled = () => {
    const hasStock = getBranchStockStatus(moderatorBranch)
    const allSelectionsMade = areAllRequiredSelectionsMade()
    const hasAvailableBranches = getAvailableBranchesForSelection().length > 0
    
    return hasStock && allSelectionsMade && hasAvailableBranches
  }

  // Get button text
  const getButtonText = () => {
    const hasStock = getBranchStockStatus(moderatorBranch)
    
    if (!hasStock) {
      return 'Out of Stock'
    }
    
    return 'Add to Cart'
  }

  // Get tooltip message for disabled button
  const getTooltipMessage = () => {
    const hasStock = getBranchStockStatus(moderatorBranch)
    
    if (!hasStock) {
      return 'This product is currently out of stock in your branch'
    }
    
    const specMissing = validateSelections()
    if (specMissing.length > 0) {
      return 'Please select all the product specifications'
    }
    
    if (getAvailableBranchesForSelection().length === 0) {
      return 'Selected specifications are not available in your branch'
    }
    
    return ''
  }

  // 🔒 MODERATOR RESTRICTION: Handle add to cart with only moderator's branch
  const handleAddToCart = () => {
    if (!isAddToCartEnabled()) {
      Swal.fire({
        icon: 'error',
        title: 'Invalid Selection',
        text: getTooltipMessage(),
      })
      return
    }

    const selectedOptions = {}
    
    if (selectedNicotineStrength) {
      selectedOptions.nicotineStrength = selectedNicotineStrength
    }
    if (selectedVgPgRatio) {
      selectedOptions.vgPgRatio = selectedVgPgRatio
    }
    if (selectedColor) {
      selectedOptions.color = selectedColor
    }

    console.log('🔒 MODERATOR SELECTED BRANCH:', moderatorBranch)
    console.log('🔒 Selected specifications:', selectedOptions)

    // Call the parent's add to cart function with specifications and ONLY moderator's branch
    onAddToCart(product, moderatorBranch, selectedOptions, [moderatorBranch])

    onClose()
  }

  const availableSpecs = getAvailableSpecifications()
  const nicotineOptions = getUniqueSpecificationValues('nicotineStrength')
  const vgPgOptions = getUniqueSpecificationValues('vgPgRatio')
  const colorOptions = getUniqueSpecificationValues('colors')
  const buttonEnabled = isAddToCartEnabled()
  const buttonText = getButtonText()

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            className="bg-white rounded-2xl max-w-6xl w-full max-h-[90vh] overflow-hidden flex flex-col shadow-2xl"
          >
            {/* Header */}
            <div className="flex justify-between items-center p-6 border-b border-gray-200 bg-gradient-to-r from-orange-50 to-amber-50">
              <h3 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                <Info size={28} className="text-orange-600" />
                Product Details
                <span className="text-sm bg-orange-100 text-orange-800 px-3 py-1 rounded-full font-medium">
                  {moderatorBranch?.charAt(0).toUpperCase() + moderatorBranch?.slice(1)} Branch Only
                </span>
              </h3>
              <button
                onClick={onClose}
                className="text-gray-400 hover:text-gray-600 p-2 rounded-xl hover:bg-gray-100 transition-colors"
              >
                <X size={24} />
              </button>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Left Column - Basic Info & Features (same as admin) */}
                <div className="space-y-6">
                  {/* Basic Product Info */}
                  <div className="bg-gray-50 rounded-xl p-6">
                    <h4 className="text-xl font-bold text-gray-900 mb-4">{product.name}</h4>
                    
                    {product.description && (
                      <div className="mb-4">
                        <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                        <p className="text-gray-600">{product.description}</p>
                      </div>
                    )}

                    <div className="grid grid-cols-2 gap-4">
                      {product.brand && (
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Brand</label>
                          <p className="font-semibold text-gray-900">{product.brand}</p>
                        </div>
                      )}

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Price</label>
                        <p className="text-2xl font-bold text-purple-600">৳{product.price?.toFixed(2) || '0.00'}</p>
                      </div>

                      {product.comparePrice && (
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Regular Price</label>
                          <p className="text-lg text-gray-500 line-through">৳{product.comparePrice.toFixed(2)}</p>
                        </div>
                      )}

                      {product.barcode && (
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Barcode</label>
                          <p className="font-mono text-gray-900">{product.barcode}</p>
                        </div>
                      )}

                      {product.category && (
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
                          <p className="font-semibold text-gray-900">{product.category}</p>
                        </div>
                      )}

                      {product.subcategory && (
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Type</label>
                          <p className="font-semibold text-gray-900">{product.subcategory}</p>
                        </div>
                      )}
                    </div>

                    {product.tags && product.tags.length > 0 && (
                      <div className="mt-4">
                        <label className="block text-sm font-medium text-gray-700 mb-2">Tags</label>
                        <div className="flex flex-wrap gap-2">
                          {product.tags.map((tag, index) => (
                            <span
                              key={index}
                              className="px-3 py-1 bg-purple-100 text-purple-800 rounded-full text-sm font-medium"
                            >
                              {tag}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Technical Specifications Section (same as admin) */}
                  {availableSpecs.length > 0 && (
                    <div className="bg-blue-50 rounded-xl p-6">
                      <h4 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                        <Settings size={20} className="text-blue-600" />
                        Technical Specifications
                      </h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {availableSpecs.map((spec) => {
                          const IconComponent = spec.icon
                          return (
                            <div key={spec.key} className="flex items-start gap-3 p-3 bg-white rounded-lg shadow-sm">
                              <IconComponent size={18} className={`${spec.color} mt-0.5 flex-shrink-0`} />
                              <div className="flex-1 min-w-0">
                                <span className="text-sm font-medium text-gray-500 block">{spec.label}</span>
                                <p className="text-gray-900 font-semibold break-words">
                                  {spec.value}{spec.unit && ` ${spec.unit}`}
                                </p>
                              </div>
                            </div>
                          )
                        })}
                      </div>
                    </div>
                  )}

                  {/* Features Section (same as admin) */}
                  {product.features && Array.isArray(product.features) && product.features.length > 0 && (
                    <div className="bg-amber-50 rounded-xl p-6">
                      <h4 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                        <Star size={20} className="text-amber-600" />
                        Product Features
                      </h4>
                      <div className="space-y-3">
                        {product.features.map((feature, index) => (
                          <div key={index} className="flex items-start gap-3 p-3 bg-white rounded-lg shadow-sm">
                            <div className="w-6 h-6 bg-amber-500 text-white rounded-full flex items-center justify-center flex-shrink-0 text-xs font-bold">
                              {index + 1}
                            </div>
                            <span className="text-gray-800 font-medium">{feature}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Each Set Contains Section (same as admin) */}
                  {product.eachSetContains && Array.isArray(product.eachSetContains) && product.eachSetContains.length > 0 && (
                    <div className="bg-emerald-50 rounded-xl p-6">
                      <h4 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                        <Package size={20} className="text-emerald-600" />
                        Each Set Contains
                      </h4>
                      <div className="space-y-3">
                        {product.eachSetContains.map((item, index) => (
                          <div key={index} className="flex items-start gap-3 p-3 bg-white rounded-lg shadow-sm">
                            <span className="text-emerald-600 font-bold text-sm mt-0.5 flex-shrink-0">
                              {index + 1}.
                            </span>
                            <span className="text-gray-800 font-medium">{item}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                {/* Right Column - Specifications & Branch Display (MODERATOR RESTRICTED) */}
                <div className="space-y-6">
                  {/* Branch Specifications */}
                  {hasBranchSpecifications() && hasAnySpecifications() && (
                    <div className="bg-orange-50 rounded-xl p-6">
                      <div className="flex items-center justify-between mb-4">
                        <h4 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                          <Settings size={20} className="text-orange-600" />
                          Select Specifications
                        </h4>
                        <div className="flex items-center gap-1 text-orange-600 text-sm">
                          <AlertCircle size={16} />
                          <span>Required</span>
                        </div>
                      </div>

                      <div className="space-y-4">
                        {/* Nicotine Strength */}
                        {nicotineOptions.length > 0 && (
                          <div>
                            {shouldShowAsText('nicotineStrength') ? (
                              <div>
                                <span className="text-sm font-medium text-gray-500">Nicotine Strength</span>
                                <p className="text-gray-900 font-semibold">{getSingleSpecificationValue('nicotineStrength')}</p>
                              </div>
                            ) : (
                              <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                  Nicotine Strength
                                  {nicotineOptions.length > 1 && (
                                    <span className="text-red-500 ml-1">*</span>
                                  )}
                                </label>
                                <select
                                  value={selectedNicotineStrength}
                                  onChange={(e) => setSelectedNicotineStrength(e.target.value)}
                                  className={`w-full p-3 rounded-lg border focus:outline-none focus:ring-2 focus:ring-orange-500 ${
                                    nicotineOptions.length > 1 && !selectedNicotineStrength
                                      ? 'border-red-300' 
                                      : 'border-gray-300'
                                  }`}
                                >
                                  <option value="">Select Nicotine Strength</option>
                                  {nicotineOptions.map((option) => (
                                    <option key={option} value={option}>
                                      {option}
                                    </option>
                                  ))}
                                </select>
                              </div>
                            )}
                          </div>
                        )}

                        {/* VG/PG Ratio */}
                        {vgPgOptions.length > 0 && (
                          <div>
                            {shouldShowAsText('vgPgRatio') ? (
                              <div>
                                <span className="text-sm font-medium text-gray-500">VG/PG Ratio</span>
                                <p className="text-gray-900 font-semibold">{getSingleSpecificationValue('vgPgRatio')}</p>
                              </div>
                            ) : (
                              <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                  VG/PG Ratio
                                  {vgPgOptions.length > 1 && (
                                    <span className="text-red-500 ml-1">*</span>
                                  )}
                                </label>
                                <select
                                  value={selectedVgPgRatio}
                                  onChange={(e) => setSelectedVgPgRatio(e.target.value)}
                                  className={`w-full p-3 rounded-lg border focus:outline-none focus:ring-2 focus:ring-orange-500 ${
                                    vgPgOptions.length > 1 && !selectedVgPgRatio
                                      ? 'border-red-300' 
                                      : 'border-gray-300'
                                  }`}
                                >
                                  <option value="">Select VG/PG Ratio</option>
                                  {vgPgOptions.map((option) => (
                                    <option key={option} value={option}>
                                      {option}
                                    </option>
                                  ))}
                                </select>
                              </div>
                            )}
                          </div>
                        )}

                        {/* Color */}
                        {colorOptions.length > 0 && (
                          <div>
                            {shouldShowAsText('colors') ? (
                              <div>
                                <span className="text-sm font-medium text-gray-500">Color</span>
                                <p className="text-gray-900 font-semibold capitalize">{getSingleSpecificationValue('colors')}</p>
                              </div>
                            ) : (
                              <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
                                  <Palette size={16} className="text-orange-600" />
                                  Color
                                  {colorOptions.length > 1 && (
                                    <span className="text-red-500 ml-1">*</span>
                                  )}
                                </label>
                                <select
                                  value={selectedColor}
                                  onChange={(e) => setSelectedColor(e.target.value)}
                                  className={`w-full p-3 rounded-lg border focus:outline-none focus:ring-2 focus:ring-orange-500 ${
                                    colorOptions.length > 1 && !selectedColor
                                      ? 'border-red-300' 
                                      : 'border-gray-300'
                                  }`}
                                >
                                  <option value="">Select Color</option>
                                  {colorOptions.map((option) => (
                                    <option key={option} value={option}>
                                      {option.charAt(0).toUpperCase() + option.slice(1)}
                                    </option>
                                  ))}
                                </select>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* 🔒 MODERATOR BRANCH DISPLAY (RESTRICTED TO MODERATOR'S BRANCH ONLY) */}
                  <div className="bg-orange-50 rounded-xl p-6 border border-orange-200">
                    <h4 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                      <Store size={20} className="text-orange-600" />
                      Your Branch Stock
                    </h4>

                    <div className="space-y-3">
                      {/* Only show moderator's branch */}
                      <div className="flex items-center justify-between p-4 rounded-lg border-2 border-orange-300 bg-orange-100">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-orange-600 text-white rounded-lg flex items-center justify-center">
                            <Store size={20} />
                          </div>
                          <div>
                            <span className="font-semibold capitalize text-gray-900">
                              {moderatorBranch} Branch
                            </span>
                            <p className="text-sm text-orange-700 font-medium">Your assigned branch</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          {getBranchStockStatus(moderatorBranch) ? (
                            <span className="font-medium text-green-600">
                              Stock: {product.stock?.[`${moderatorBranch}_stock`] || 0}
                            </span>
                          ) : (
                            <span className="text-red-600 font-medium">
                              Out of Stock
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Warning messages */}
                    {hasAnySelections() && getAvailableBranchesForSelection().length === 0 && (
                      <div className="mt-4 p-3 bg-red-100 border border-red-300 rounded-lg">
                        <p className="text-red-800 text-sm flex items-center gap-2">
                          <AlertCircle size={16} />
                          Selected specifications are not available in your branch
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="p-6 border-t border-gray-200 bg-gray-50">
              <div className="flex gap-4">
                <button
                  onClick={onClose}
                  className="flex-1 py-3 bg-gray-200 text-gray-700 rounded-xl hover:bg-gray-300 transition-colors font-semibold"
                >
                  Cancel
                </button>
                <div className="flex-2 relative group">
                  <button
                    onClick={handleAddToCart}
                    disabled={!buttonEnabled}
                    className={`w-full py-3 px-6 rounded-xl font-semibold text-lg transition-all flex items-center justify-center gap-2 ${
                      buttonEnabled
                        ? 'bg-gradient-to-r from-orange-600 to-red-600 text-white hover:from-orange-700 hover:to-red-700'
                        : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                    }`}
                  >
                    <ShoppingCart size={20} />
                    {buttonEnabled ? 'Add to Cart' : buttonText}
                  </button>

                  {/* Tooltip for disabled button */}
                  {!buttonEnabled && getTooltipMessage() && (
                    <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-2 bg-gray-800 text-white text-sm rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200 whitespace-nowrap z-50 pointer-events-none">
                      {getTooltipMessage()}
                      <div className="absolute top-full left-1/2 transform -translate-x-1/2 border-4 border-transparent border-t-gray-800"></div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}

// 🔒 MODERATOR-SPECIFIC: Product Card with NO branch selector (fixed to moderator's branch)
const ProductCard = ({ product, onAddToCart, moderatorBranch, onShowDetails }) => {
  // Only show stock for moderator's branch
  const normalizedBranch = moderatorBranch.toLowerCase()
  const stock = product.stock?.[`${normalizedBranch}_stock`] ?? 0
  const isOutOfStock = stock <= 0

  return (
    <motion.div
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
            onError={(e) => {
              e.target.style.display = 'none'
              e.target.nextSibling.style.display = 'flex'
            }}
          />
        ) : null}
        
        <div className="w-full h-full flex items-center justify-center" style={{ display: product.images?.length > 0 ? 'none' : 'flex' }}>
          <Package2 size={48} className="text-gray-400" />
        </div>

        {/* Stock Status Badge */}
        <div
          className={`absolute top-3 right-3 px-2 py-1 rounded-full text-xs font-medium ${
            isOutOfStock
              ? 'bg-red-100 text-red-800'
              : 'bg-green-100 text-green-800'
          }`}
        >
          {isOutOfStock ? 'Out of Stock' : `${stock} in stock`}
        </div>

        {/* Price Badge */}
        <div className="absolute bottom-3 left-3 bg-purple-600 text-white px-3 py-1 rounded-full text-sm font-bold">
          ৳{product.price?.toFixed(2) || '0.00'}
        </div>

        {/* Details Button */}
        <button
          onClick={() => onShowDetails(product)}
          className="absolute top-3 left-3 bg-white bg-opacity-90 text-purple-600 p-2 rounded-full hover:bg-opacity-100 transition-all"
          title="View Details"
        >
          <Info size={16} />
        </button>
      </div>

      {/* Product Info */}
      <div className="p-4">
        <h3 className="font-semibold text-gray-900 line-clamp-2 mb-2">
          {product.name || 'Unnamed Product'}
        </h3>

        <div className="flex items-center gap-2 mb-3">
          <Tag size={14} className="text-purple-600" />
          <span className="text-sm text-gray-600">
            {product.category || 'N/A'} • {product.subcategory || 'N/A'}
          </span>
        </div>

        {/* 🔒 FIXED BRANCH DISPLAY (NO SELECTOR) */}
        <div className="mb-3">
          <div className="flex items-center gap-2 p-2 bg-orange-50 border border-orange-200 rounded-lg">
            <Store size={14} className="text-orange-600" />
            <span className="text-xs font-medium text-orange-800 capitalize">
              {moderatorBranch} Branch - {stock} in stock
            </span>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-2">
          <button
            onClick={() => onShowDetails(product)}
            className="flex-1 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium text-sm"
          >
            View Details
          </button>
          <button
            onClick={() => onAddToCart(product, moderatorBranch)}
            disabled={isOutOfStock}
            className={`flex-1 py-2 rounded-lg font-medium transition-colors text-sm ${
              isOutOfStock
                ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                : 'bg-orange-600 text-white hover:bg-orange-700'
            }`}
          >
            {isOutOfStock ? 'Out of Stock' : 'Quick Add'}
          </button>
        </div>
      </div>
    </motion.div>
  )
}

// Keep all other components exactly the same as admin (SortableCartItem, generateInvoice, PaymentMethodSelector)...

// 🔒 MAIN MODERATOR COMPONENT
export default function SellPageModerator() {
  // Get user context for moderator info
  const { user } = useContext(AuthContext)
  
  // Use cart hook (same as admin)
  const { 
    cartItems, 
    addToCart, 
    removeFromCart, 
    updateQuantity, 
    clearCart, 
    getCartTotal, 
    getCartItemsCount,
    getProductOptionsText,
    getAvailableBranchesText,
    hasProductSpecifications
  } = useCart()

  // States (same as admin except branch handling)
  const [products, setProducts] = useState([])
  const [categories, setCategories] = useState({})
  const [moderatorBranch, setModeratorBranch] = useState(null) // 🔒 Single branch for moderator
  const [loading, setLoading] = useState(true)
  const [showBarcodeScanner, setShowBarcodeScanner] = useState(false)
  const [showCartModal, setShowCartModal] = useState(false)
  const [saleCompleted, setSaleCompleted] = useState(false)
  const [completedSaleData, setCompletedSaleData] = useState(null)

  // Filter states (same as admin)
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('')
  const [barcodeFilter, setBarcodeFilter] = useState('')
  const [inStockOnly, setInStockOnly] = useState(false)

  // Payment states (same as admin)
  const [selectedPaymentMethods, setSelectedPaymentMethods] = useState([])
  const [customerName, setCustomerName] = useState('')
  const [customerPhone, setCustomerPhone] = useState('')

  // Pagination (same as admin)
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const itemsPerPage = 12

  // Product details modal state (same as admin)
  const [showProductModal, setShowProductModal] = useState(false)
  const [selectedProduct, setSelectedProduct] = useState(null)

  // dnd-kit sensors (same as admin)
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  )

  // 🔒 GET MODERATOR'S BRANCH FROM JWT TOKEN OR USER CONTEXT
  useEffect(() => {
    const getModeratorsAssignedBranch = () => {
      // Try to get from user context first
      if (user?.branch) {
        setModeratorBranch(user.branch.toLowerCase())
        return
      }

      // Try to get from localStorage as fallback
      const storedBranch = localStorage.getItem('userBranch')
      if (storedBranch) {
        setModeratorBranch(storedBranch.toLowerCase())
        return
      }

      // Default fallback - you might want to redirect to login instead
      setModeratorBranch('bashundhara')
    }

    getModeratorsAssignedBranch()
  }, [user])

  // Load initial data (same as admin but with moderator's branch)
  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true)

        // Load categories with authentication
        try {
          const categoriesRes = await makeAuthenticatedRequest('/api/products?getCategoriesOnly=true')
          if (categoriesRes.ok) {
            const categoriesData = await categoriesRes.json()
            setCategories(categoriesData.categories || {})
            console.log('Categories loaded:', categoriesData.categories)
          } else {
            console.warn('Failed to load categories:', categoriesRes.status)
          }
        } catch (error) {
          console.error('Error loading categories:', error)
        }

        // Load initial products
        await fetchProducts()
      } catch (error) {
        console.error('Error in initial data loading:', error)
        Swal.fire({
          icon: 'error',
          title: 'Loading Error',
          text: 'Failed to load initial data. Please refresh the page.',
        })
      } finally {
        setLoading(false)
      }
    }

    if (moderatorBranch) {
      loadData()
    }
  }, [moderatorBranch])

  // Fetch products (same as admin)
  const fetchProducts = async (bustCache = false) => {
    try {
      const params = new URLSearchParams({
        limit: itemsPerPage.toString(),
        page: currentPage.toString(),
        status: 'active',
      })

      if (searchTerm.trim()) params.append('search', searchTerm.trim())
      if (selectedCategory) params.append('category', selectedCategory)
      if (barcodeFilter.trim()) params.append('barcode', barcodeFilter.trim())
      if (inStockOnly) params.append('inStock', 'true')
      
      if (bustCache) {
        params.append('_t', Date.now().toString())
      }

      console.log('[MODERATOR FETCH] Requesting products with params:', params.toString(), 'Cache busted:', bustCache)

      const response = await makeAuthenticatedRequest(`/api/products?${params}`, {}, bustCache)
      
      if (response.ok) {
        const data = await response.json()
        console.log('[MODERATOR FETCH] Products received:', {
          count: data.products?.length || 0,
          pagination: data.pagination,
          sampleProduct: data.products?.[0]?.name,
          sampleStock: data.products?.[0]?.stock,
          moderatorBranch,
          cachebusted: bustCache
        })
        
        setProducts(data.products || [])
        setTotalPages(data.pagination?.totalPages || 1)
      } else {
        console.error('[MODERATOR FETCH] Products API error:', response.status, response.statusText)
        
        if (response.status === 401) {
          Swal.fire({
            icon: 'error',
            title: 'Authentication Error',
            text: 'Please log in to access products. Using demo mode.',
          })
        }
      }
    } catch (error) {
      console.error('[MODERATOR FETCH] Error fetching products:', error)
      Swal.fire({
        icon: 'error',
        title: 'Connection Error',
        text: 'Failed to load products. Please check your connection.',
      })
    }
  }

  // Apply filters (same as admin)
  useEffect(() => {
    setCurrentPage(1)
  }, [searchTerm, selectedCategory, barcodeFilter, inStockOnly])

  useEffect(() => {
    if (!loading && moderatorBranch) {
      fetchProducts()
    }
  }, [currentPage, searchTerm, selectedCategory, barcodeFilter, inStockOnly, moderatorBranch])

  // Handle showing product details (same as admin)
  const handleShowProductDetails = (product) => {
    setSelectedProduct(product)
    setShowProductModal(true)
  }

  // Enhanced barcode scanning (same as admin)
  const handleBarcodeScan = async (data) => {
    try {
      if (data && data.trim()) {
        console.log('[MODERATOR BARCODE] Scanned:', data.trim())
        setBarcodeFilter(data.trim())
        setShowBarcodeScanner(false)

        // Search for product by barcode
        const response = await makeAuthenticatedRequest(
          `/api/products?barcode=${encodeURIComponent(data.trim())}&limit=1`
        )
        
        if (response.ok) {
          const result = await response.json()
          console.log('[MODERATOR BARCODE] Search result:', result)

          if (result.products && result.products.length > 0) {
            const product = result.products[0]
            
            // Automatically add to cart with moderator's branch
            handleAddToCart(product, moderatorBranch)

            Swal.fire({
              icon: 'success',
              title: 'Product Found!',
              text: `${product.name} added to cart`,
              timer: 2000,
              showConfirmButton: false,
              toast: true,
              position: 'top-end',
            })
          } else {
            Swal.fire({
              icon: 'warning',
              title: 'Product Not Found',
              text: `No product found with barcode: ${data.trim()}`,
              timer: 3000,
              showConfirmButton: false,
              toast: true,
              position: 'top-end',
            })
          }
        } else {
          throw new Error(`API Error: ${response.status}`)
        }
      }
    } catch (error) {
      console.error('[MODERATOR BARCODE] Error:', error)
      setBarcodeFilter(data?.trim() || '')
      setShowBarcodeScanner(false)
      
      Swal.fire({
        icon: 'error',
        title: 'Barcode Scan Failed',
        text: 'Could not process barcode. Please try again.',
        toast: true,
        position: 'top-end',
        timer: 3000,
        showConfirmButton: false,
      })
    }
  }

  // 🔒 MODERATOR-SPECIFIC: Handle add to cart with branch restrictions
  const handleAddToCart = (product, selectedBranch, selectedOptions = {}, availableBranches = []) => {
    try {
      if (!product || !product._id) {
        throw new Error('Invalid product data')
      }

      // 🔒 FORCE moderator's branch (ignore selectedBranch parameter)
      const finalBranch = moderatorBranch.toLowerCase()
      const stock = product.stock?.[`${finalBranch}_stock`] ?? 0

      console.log('[MODERATOR CART] Adding to cart:', {
        productName: product.name,
        moderatorBranch,
        finalBranch,
        stockKey: `${finalBranch}_stock`,
        stock,
        stockData: product.stock,
        selectedOptions,
        forcedBranches: [moderatorBranch]
      })

      if (stock <= 0) {
        Swal.fire({
          icon: 'error',
          title: 'Out of Stock',
          text: 'This product is out of stock in your branch',
        })
        return
      }

      // Use cart hook's addToCart function with ONLY moderator's branch
      addToCart(product, 1, selectedOptions, [moderatorBranch])

      const specText = selectedOptions && Object.keys(selectedOptions).length > 0 ? 
        ` (${Object.values(selectedOptions).join(', ')})` : ''
      
      Swal.fire({
        icon: 'success',
        title: 'Added to Cart!',
        text: `${product.name}${specText} added to cart`,
        timer: 1500,
        showConfirmButton: false,
        toast: true,
        position: 'top-end',
      })

    } catch (error) {
      console.error('[MODERATOR CART] Error adding to cart:', error)
      Swal.fire({
        icon: 'error',
        title: 'Add to Cart Failed',
        text: error.message || 'Could not add item to cart',
      })
    }
  }

  // Cart management functions (same as admin)
  const handleUpdateQuantity = (itemId, newQuantity) => {
    updateQuantity(itemId, newQuantity)
  }

  const handleRemoveFromCart = (itemId) => {
    removeFromCart(itemId)
  }

  const handleClearCart = () => {
    Swal.fire({
      title: 'Clear Cart?',
      text: 'This will remove all items from the cart',
      icon: 'question',
      showCancelButton: true,
      confirmButtonText: 'Yes, clear it!',
      cancelButtonText: 'Cancel',
    }).then((result) => {
      if (result.isConfirmed) {
        clearCart()
        Swal.fire({
          icon: 'success',
          title: 'Cart Cleared',
          timer: 1500,
          showConfirmButton: false,
          toast: true,
          position: 'top-end',
        })
      }
    })
  }

  // Handle drag end for cart reordering (same as admin)
  const handleDragEnd = (event) => {
    const { active, over } = event

    if (active.id !== over?.id) {
      console.log('Cart item reordered:', active.id, 'to', over?.id)
    }
  }

  // Handle checkout (FIXED - Complete implementation for moderator)
const handleCheckout = async () => {
  try {
    if (cartItems.length === 0) {
      Swal.fire({
        icon: 'warning',
        title: 'Empty Cart',
        text: 'Please add items to cart before checkout',
      })
      return
    }

    if (selectedPaymentMethods.length === 0) {
      Swal.fire({
        icon: 'warning',
        title: 'Payment Method Required',
        text: 'Please select a payment method',
      })
      return
    }

    const totalAmount = getCartTotal()
    const totalPaid = selectedPaymentMethods.reduce(
      (sum, method) => sum + (method.amount || 0),
      0
    )

    if (totalPaid < totalAmount) {
      Swal.fire({
        icon: 'warning',
        title: 'Insufficient Payment',
        text: `Payment amount (৳${totalPaid.toFixed(2)}) is less than total (৳${totalAmount.toFixed(2)})`,
      })
      return
    }

    setLoading(true)

    // 🔥 DEBUG: Log cart items structure
    console.log('🔥 CART ITEMS STRUCTURE:', cartItems)
    console.log('🔥 SAMPLE CART ITEM:', cartItems[0])

    // 🔥 PREPARE SALE DATA - EXACTLY LIKE ADMIN BUT WITH MODERATOR INFO
    const saleData = {
      saleId: `VWV-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      timestamp: new Date().toISOString(),
      cashier: `Moderator (${moderatorBranch?.charAt(0).toUpperCase() + moderatorBranch?.slice(1)})`, // 🔒 Moderator cashier
      customer: {
        name: customerName || 'Walk-in Customer',
        phone: customerPhone || null,
      },
      // 🔥 CRITICAL: Properly map cart items to sale format
      items: cartItems.map(item => {
        console.log('🔥 MAPPING CART ITEM:', item)
        return {
          productId: item.product?._id || item.productId || item.id, // Try multiple possible fields
          productName: item.product?.name || item.name || 'Unknown Product',
          quantity: item.quantity || 1,
          unitPrice: item.product?.price || item.price || 0,
          totalPrice: (item.product?.price || item.price || 0) * (item.quantity || 1),
          branch: moderatorBranch.toLowerCase(), // 🔒 ALWAYS moderator's branch
          selectedOptions: item.selectedOptions || item.options || {} // Include specifications
        }
      }),
      totalAmount,
      payment: {
        methods: selectedPaymentMethods,
        totalPaid,
        change: totalPaid - totalAmount,
      },
      paymentType: selectedPaymentMethods.length === 1 ? selectedPaymentMethods[0].type : 'mixed', // Add payment type
      status: 'completed', // Add status
    }

    console.log('🔥 MODERATOR SALE: Final sale data being sent:', JSON.stringify(saleData, null, 2))

    // 🔥 ACTUAL API CALL TO SAVE SALE AND DECREMENT STOCK
    try {
      const response = await makeAuthenticatedRequest('/api/sales', {
        method: 'POST',
        body: JSON.stringify(saleData)
      })

      console.log('🔥 MODERATOR SALE: API Response Status:', response.status)

      // CHECK FOR TOKEN EXPIRATION
      if (response.status === 401) {
        console.log('🔥 MODERATOR SALE: Token expired')
        return
      }

      if (response.ok) {
        const result = await response.json()
        console.log('🔥 MODERATOR SALE: Sale saved successfully:', result)
        
        // 🔥 CRITICAL: Refresh products to show updated stock
        await fetchProducts(true) // Pass true to bust cache and get fresh stock data
        
      } else {
        const errorText = await response.text()
        console.error('🔥 MODERATOR SALE: API Error Response:', errorText)
        
        let errorData
        try {
          errorData = JSON.parse(errorText)
        } catch (e) {
          errorData = { error: errorText || `API Error: ${response.status}` }
        }
        
        throw new Error(errorData.error || `API Error: ${response.status}`)
      }
    } catch (apiError) {
      console.error('🔥 MODERATOR SALE: Error processing sale:', apiError)
      throw new Error(apiError.message || 'Failed to process sale on server')
    }

    // Clear cart and payment data
    clearCart()
    setSelectedPaymentMethods([])
    setCustomerName('')
    setCustomerPhone('')
    setShowCartModal(false)

    // Set sale completion data
    setCompletedSaleData(saleData)
    setSaleCompleted(true)

    Swal.fire({
      icon: 'success',
      title: 'Sale Complete!',
      text: `Sale processed successfully. Total: ৳${totalAmount.toFixed(2)}`,
      timer: 2000,
      showConfirmButton: false
    })

  } catch (error) {
    console.error('🔥 MODERATOR CHECKOUT ERROR:', error)
    Swal.fire({
      icon: 'error',
      title: 'Checkout Failed',
      text: error.message || 'Something went wrong during checkout. Please try again.',
    })
  } finally {
    setLoading(false)
  }
}


  // Calculate totals using cart hook (same as admin)
  const cartTotal = getCartTotal()
  const cartItemsCount = getCartItemsCount()

  // Don't render until we have moderator branch info
  if (!moderatorBranch) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-orange-50 via-yellow-50 to-amber-100 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-orange-200 border-t-orange-600 rounded-full animate-spin mx-auto mb-4"></div>
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Loading Moderator Profile</h2>
          <p className="text-gray-600">Getting your branch information...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-yellow-50 to-amber-100 p-4">
      <div className="max-w-7xl mx-auto">
        {/* 🔒 MODERATOR HEADER with branch restriction indicator */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
          <div>
            <h1 className="text-4xl font-bold text-gray-900 mb-2 flex items-center gap-3">
              🏪 Moderator Sales Point
              <span className="text-sm bg-orange-100 text-orange-800 px-3 py-1 rounded-full font-medium">
                {moderatorBranch?.charAt(0).toUpperCase() + moderatorBranch?.slice(1)} Branch Only
              </span>
            </h1>
            <p className="text-gray-600">
              Process sales for your assigned branch • Stock limited to your branch inventory
            </p>
          </div>

          {/* Cart Button (same as admin) */}
          <div className="flex items-center gap-4">
            <button
              onClick={() => setShowBarcodeScanner(true)}
              className="flex items-center gap-2 bg-gradient-to-r from-green-600 to-emerald-600 text-white px-6 py-3 rounded-xl hover:from-green-700 hover:to-emerald-700 transition-all shadow-lg hover:shadow-xl"
            >
              <Scan size={20} />
              Scan Barcode
            </button>

            <button
              onClick={() => setShowCartModal(true)}
              className="relative flex items-center gap-2 bg-gradient-to-r from-orange-600 to-red-600 text-white px-6 py-3 rounded-xl hover:from-orange-700 hover:to-red-700 transition-all shadow-lg hover:shadow-xl"
            >
              <ShoppingCart size={20} />
              View Cart
              {cartItemsCount > 0 && (
                <span className="absolute -top-2 -right-2 bg-yellow-400 text-yellow-900 text-xs font-bold px-2 py-1 rounded-full">
                  {cartItemsCount}
                </span>
              )}
            </button>
          </div>
        </div>

        {/* Loading State */}
        {loading && (
          <div className="text-center py-12">
            <div className="w-16 h-16 border-4 border-orange-200 border-t-orange-600 rounded-full animate-spin mx-auto mb-4"></div>
            <h2 className="text-xl font-semibold text-gray-900 mb-2">Loading Products</h2>
            <p className="text-gray-600">Getting products for {moderatorBranch} branch...</p>
          </div>
        )}

        {/* Main Content (same as admin) */}
        {!loading && (
          <div className="space-y-6">
            {/* Filters Section (same as admin except no branch filter) */}
            <div className="bg-white rounded-2xl shadow-lg p-6">
              <div className="flex items-center gap-3 mb-4">
                <Filter size={20} className="text-orange-600" />
                <h2 className="text-lg font-bold text-gray-900">Filters</h2>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                {/* Search */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Search Products
                  </label>
                  <div className="relative">
                    <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                    <input
                      type="text"
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      placeholder="Search by name, brand..."
                      className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                    />
                  </div>
                </div>

                {/* Category */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Category
                  </label>
                  <select
                    value={selectedCategory}
                    onChange={(e) => setSelectedCategory(e.target.value)}
                    className="w-full p-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                  >
                    <option value="">All Categories</option>
                    {Object.keys(categories).map((category) => (
                      <option key={category} value={category}>
                        {category}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Barcode */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Barcode
                  </label>
                  <input
                                        type="text"
                    value={barcodeFilter}
                    onChange={(e) => setBarcodeFilter(e.target.value)}
                    placeholder="Enter barcode..."
                    className="w-full p-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                  />
                </div>

                {/* In Stock Only */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Stock Filter
                  </label>
                  <label className="flex items-center gap-2 p-2 border border-gray-300 rounded-lg cursor-pointer hover:bg-gray-50">
                    <input
                      type="checkbox"
                      checked={inStockOnly}
                      onChange={(e) => setInStockOnly(e.target.checked)}
                      className="w-4 h-4 text-orange-600 bg-gray-100 border-gray-300 rounded focus:ring-orange-500"
                    />
                    <span className="text-sm text-gray-700">In Stock Only</span>
                  </label>
                </div>
              </div>
            </div>

            {/* Products Grid */}
            <div className="bg-white rounded-2xl shadow-lg p-6">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                  <Package size={20} className="text-orange-600" />
                  <h2 className="text-lg font-bold text-gray-900">
                    Products Available in {moderatorBranch?.charAt(0).toUpperCase() + moderatorBranch?.slice(1)} Branch
                  </h2>
                  <span className="bg-orange-100 text-orange-800 text-sm font-medium px-2 py-1 rounded-full">
                    {products.length} products
                  </span>
                </div>

                <div className="text-sm text-gray-500">
                  Page {currentPage} of {totalPages}
                </div>
              </div>

              {products.length > 0 ? (
                <>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                    {products.map((product) => (
                      <ProductCard
                        key={product._id}
                        product={product}
                        moderatorBranch={moderatorBranch}
                        onAddToCart={handleAddToCart}
                        onShowDetails={handleShowProductDetails}
                      />
                    ))}
                  </div>

                  {/* Pagination */}
                  {totalPages > 1 && (
                    <div className="flex justify-center items-center mt-8 gap-2">
                      <button
                        onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                        disabled={currentPage === 1}
                        className="flex items-center gap-1 px-3 py-2 rounded-lg bg-gray-100 text-gray-700 hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        <ChevronLeft size={16} />
                        Previous
                      </button>

                      <div className="flex gap-1">
                        {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                          const page = i + Math.max(1, currentPage - 2)
                          if (page > totalPages) return null
                          
                          return (
                            <button
                              key={page}
                              onClick={() => setCurrentPage(page)}
                              className={`px-3 py-2 rounded-lg font-medium ${
                                page === currentPage
                                  ? 'bg-orange-600 text-white'
                                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                              }`}
                            >
                              {page}
                            </button>
                          )
                        })}
                      </div>

                      <button
                        onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                        disabled={currentPage === totalPages}
                        className="flex items-center gap-1 px-3 py-2 rounded-lg bg-gray-100 text-gray-700 hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        Next
                        <ChevronRight size={16} />
                      </button>
                    </div>
                  )}
                </>
              ) : (
                <div className="text-center py-12">
                  <Package2 size={64} className="mx-auto text-gray-400 mb-4" />
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">No Products Found</h3>
                  <p className="text-gray-600">
                    {searchTerm || selectedCategory || barcodeFilter
                      ? 'Try adjusting your filters to see more products.'
                      : `No products available in ${moderatorBranch} branch.`}
                  </p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Barcode Scanner Modal */}
        <AnimatePresence>
          {showBarcodeScanner && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
            >
              <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.9, opacity: 0 }}
                className="bg-white rounded-2xl p-6 max-w-md w-full"
              >
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                    <Camera size={24} className="text-green-600" />
                    Barcode Scanner
                  </h3>
                  <button
                    onClick={() => setShowBarcodeScanner(false)}
                    className="text-gray-400 hover:text-gray-600 p-2 rounded-lg hover:bg-gray-100"
                  >
                    <X size={20} />
                  </button>
                </div>

                <div className="mb-4">
                  <BarcodeReader
                    onError={(err) => console.log('Barcode scanner error:', err)}
                    onScan={handleBarcodeScan}
                    delay={300}
                    style={{ width: '100%' }}
                  />
                </div>

                <p className="text-sm text-gray-600 text-center">
                  Point your camera at the barcode to scan
                </p>

                <button
                  onClick={() => setShowBarcodeScanner(false)}
                  className="w-full mt-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
                >
                  Cancel
                </button>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Cart Modal */}
        <AnimatePresence>
          {showCartModal && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
            >
              <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.9, opacity: 0 }}
                className="bg-white rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col"
              >
                {/* Cart Header */}
                <div className="flex justify-between items-center p-6 border-b border-gray-200 bg-gradient-to-r from-orange-50 to-amber-50">
                  <h3 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                    <ShoppingCart size={28} className="text-orange-600" />
                    Shopping Cart
                    <span className="text-sm bg-orange-100 text-orange-800 px-3 py-1 rounded-full font-medium">
                      {moderatorBranch?.charAt(0).toUpperCase() + moderatorBranch?.slice(1)} Branch
                    </span>
                    {cartItemsCount > 0 && (
                      <span className="bg-orange-600 text-white text-sm font-bold px-2 py-1 rounded-full">
                        {cartItemsCount}
                      </span>
                    )}
                  </h3>
                  <button
                    onClick={() => setShowCartModal(false)}
                    className="text-gray-400 hover:text-gray-600 p-2 rounded-xl hover:bg-gray-100 transition-colors"
                  >
                    <X size={24} />
                  </button>
                </div>

                <div className="flex-1 overflow-y-auto p-6">
                  {cartItems.length > 0 ? (
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                      {/* Cart Items */}
                      <div className="lg:col-span-2 space-y-4">
                        <div className="flex justify-between items-center">
                          <h4 className="text-lg font-bold text-gray-900">Items ({cartItemsCount})</h4>
                          <button
                            onClick={handleClearCart}
                            className="text-red-600 hover:text-red-800 text-sm font-medium flex items-center gap-1"
                          >
                            <Trash2 size={16} />
                            Clear All
                          </button>
                        </div>

                        <DndContext
                          sensors={sensors}
                          collisionDetection={closestCenter}
                          onDragEnd={handleDragEnd}
                        >
                          <SortableContext
                            items={cartItems.map(item => item.id)}
                            strategy={verticalListSortingStrategy}
                          >
                            {cartItems.map((item) => (
                              <SortableCartItem
                                key={item.id}
                                item={item}
                                onUpdateQuantity={handleUpdateQuantity}
                                onRemove={handleRemoveFromCart}
                              />
                            ))}
                          </SortableContext>
                        </DndContext>
                      </div>

                      {/* Checkout Section */}
                      <div className="space-y-6">
                        {/* Customer Info */}
                        <div className="bg-gray-50 rounded-xl p-4">
                          <h4 className="font-bold text-gray-900 mb-3 flex items-center gap-2">
                            <User size={18} className="text-orange-600" />
                            Customer Information
                          </h4>
                          <div className="space-y-3">
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-1">
                                Name
                              </label>
                              <input
                                type="text"
                                value={customerName}
                                onChange={(e) => setCustomerName(e.target.value)}
                                placeholder="Customer name (optional)"
                                className="w-full p-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                              />
                            </div>
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-1">
                                Phone
                              </label>
                              <input
                                type="tel"
                                value={customerPhone}
                                onChange={(e) => setCustomerPhone(e.target.value)}
                                placeholder="Phone number (optional)"
                                className="w-full p-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                              />
                            </div>
                          </div>
                        </div>

                        {/* Payment Methods */}
                        <PaymentMethodSelector
                          selectedMethods={selectedPaymentMethods}
                          onMethodChange={setSelectedPaymentMethods}
                          totalAmount={cartTotal}
                        />

                        {/* Total Summary */}
                        <div className="bg-white p-4 rounded-xl border-2 border-orange-200 shadow-lg">
                          <h4 className="font-bold text-gray-900 text-lg mb-3">Order Summary</h4>
                          <div className="space-y-2">
                            <div className="flex justify-between items-center">
                              <span className="text-gray-600">Subtotal:</span>
                              <span className="font-semibold">৳{cartTotal.toFixed(2)}</span>
                            </div>
                            <div className="flex justify-between items-center">
                              <span className="text-gray-600">Tax:</span>
                              <span className="font-semibold">৳0.00</span>
                            </div>
                            <div className="border-t pt-2">
                              <div className="flex justify-between items-center text-xl font-bold text-orange-600">
                                <span>Total:</span>
                                <span>৳{cartTotal.toFixed(2)}</span>
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* Checkout Button */}
                        <button
                          onClick={handleCheckout}
                          disabled={loading || cartItems.length === 0 || selectedPaymentMethods.length === 0}
                          className={`w-full py-4 rounded-xl font-bold text-lg transition-all flex items-center justify-center gap-2 ${
                            loading || cartItems.length === 0 || selectedPaymentMethods.length === 0
                              ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                              : 'bg-gradient-to-r from-orange-600 to-red-600 text-white hover:from-orange-700 hover:to-red-700 shadow-lg hover:shadow-xl'
                          }`}
                        >
                          {loading ? (
                            <>
                              <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                              Processing...
                            </>
                          ) : (
                            <>
                              <Receipt size={20} />
                              Complete Sale
                            </>
                          )}
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="text-center py-12">
                      <ShoppingCart size={64} className="mx-auto text-gray-400 mb-4" />
                      <h3 className="text-xl font-semibold text-gray-900 mb-2">Your cart is empty</h3>
                      <p className="text-gray-600 mb-4">Add some products to get started</p>
                      <button
                        onClick={() => setShowCartModal(false)}
                        className="bg-orange-600 text-white px-6 py-2 rounded-lg hover:bg-orange-700 transition-colors"
                      >
                        Continue Shopping
                      </button>
                    </div>
                  )}
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Product Details Modal */}
        <ProductDetailsModal
          isOpen={showProductModal}
          product={selectedProduct}
          moderatorBranch={moderatorBranch}
          onClose={() => {
            setShowProductModal(false)
            setSelectedProduct(null)
          }}
          onAddToCart={handleAddToCart}
        />

        {/* Sale Completion Modal */}
        <AnimatePresence>
          {saleCompleted && completedSaleData && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
            >
              <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.9, opacity: 0 }}
                className="bg-white rounded-2xl max-w-md w-full p-8 text-center"
              >
                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <CheckCircle size={32} className="text-green-600" />
                </div>
                
                <h3 className="text-2xl font-bold text-gray-900 mb-2">Sale Complete!</h3>
                <p className="text-gray-600 mb-4">
                  Transaction processed successfully
                </p>
                
                <div className="bg-gray-50 rounded-lg p-4 mb-6">
                  <div className="text-sm text-gray-600 mb-1">Sale ID</div>
                  <div className="font-mono font-bold text-gray-900">{completedSaleData.saleId}</div>
                  <div className="text-sm text-gray-600 mt-2 mb-1">Total Amount</div>
                  <div className="text-2xl font-bold text-green-600">৳{completedSaleData.totalAmount.toFixed(2)}</div>
                </div>

                <div className="flex gap-3">
                  <button
                    onClick={() => generateInvoice(completedSaleData)}
                    className="flex-1 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center justify-center gap-2"
                  >
                    <Download size={16} />
                    Download Invoice
                  </button>
                  <button
                    onClick={() => {
                      setSaleCompleted(false)
                      setCompletedSaleData(null)
                    }}
                    className="flex-1 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
                  >
                    Close
                  </button>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  )
}

// 🔥 ENHANCED: Sortable Cart Item Component
const SortableCartItem = ({ item, onUpdateQuantity, onRemove }) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: item.id })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  }

  const totalPrice = (item.product?.price ?? 0) * (item.quantity ?? 1)
  const availableBranches = item.availableBranches || []
  const maxStock = availableBranches.length > 0 ? 
    Math.max(...availableBranches.map(branch => 
      item.product?.stock?.[`${branch}_stock`] || 0
    )) : 0

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`bg-white rounded-xl shadow-sm border border-gray-100 p-4 transition-all ${
        isDragging ? 'shadow-lg rotate-1 z-50' : 'hover:shadow-md'
      }`}
    >
      <div className="flex items-center gap-4">
        {/* Drag Handle */}
        <div
          {...attributes}
          {...listeners}
          className="text-gray-400 hover:text-gray-600 cursor-grab active:cursor-grabbing p-1 rounded hover:bg-gray-100"
        >
          <GripVertical size={16} />
        </div>

        {/* Product Image */}
        <div className="w-16 h-16 bg-gradient-to-br from-orange-100 to-yellow-100 rounded-lg flex-shrink-0 overflow-hidden">
          {item.product?.images && item.product.images.length > 0 ? (
            <img
              src={item.product.images[0].url}
              alt={item.product.name}
              className="w-full h-full object-cover"
              onError={(e) => {
                e.target.style.display = 'none'
                e.target.nextSibling.style.display = 'flex'
              }}
            />
          ) : null}
          <div 
            className="w-full h-full flex items-center justify-center" 
            style={{ display: item.product?.images?.length > 0 ? 'none' : 'flex' }}
          >
            <Package2 size={24} className="text-orange-400" />
          </div>
        </div>

        {/* Product Details */}
        <div className="flex-1 min-w-0">
          <h4 className="font-semibold text-gray-900 truncate text-sm">
            {item.product?.name || 'Unknown Product'}
          </h4>
          <div className="flex items-center gap-2 mt-1">
            {availableBranches.map(branch => (
              <span key={branch} className="text-xs bg-orange-100 text-orange-700 px-2 py-1 rounded-full capitalize">
                {branch}
              </span>
            ))}
            <span className="text-sm font-medium text-purple-600">
              ৳{item.product?.price?.toFixed(2) || '0.00'}
            </span>
          </div>
          
          {/* Selected Options Display */}
          {item.selectedOptions && Object.keys(item.selectedOptions).length > 0 && (
            <div className="flex flex-wrap gap-1 mt-2">
              {Object.entries(item.selectedOptions).map(([key, value]) => (
                <span key={key} className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded">
                  {key}: {value}
                </span>
              ))}
            </div>
          )}
        </div>

        {/* Quantity Controls */}
        <div className="flex items-center gap-2 bg-gray-50 rounded-lg p-1">
          <button
            onClick={() => onUpdateQuantity(item.id, Math.max(1, (item.quantity || 1) - 1))}
            disabled={item.quantity <= 1}
            className="w-8 h-8 rounded-lg bg-white shadow-sm flex items-center justify-center hover:bg-red-50 hover:text-red-600 transition-colors disabled:opacity-50"
          >
            <Minus size={14} />
          </button>
          <span className="w-8 text-center font-semibold text-gray-900">
            {item.quantity || 1}
          </span>
          <button
            onClick={() => onUpdateQuantity(item.id, (item.quantity || 1) + 1)}
            disabled={item.quantity >= maxStock}
            className="w-8 h-8 rounded-lg bg-orange-600 text-white flex items-center justify-center hover:bg-orange-700 transition-colors disabled:opacity-50 disabled:bg-gray-300"
          >
            <Plus size={14} />
          </button>
        </div>

        {/* Price & Remove */}
        <div className="text-right">
          <p className="font-bold text-gray-900 text-lg">
            ৳{totalPrice.toFixed(2)}
          </p>
          <button
            onClick={() => onRemove(item.id)}
            className="text-red-400 hover:text-red-600 mt-1 p-1 rounded-lg hover:bg-red-50 transition-colors"
          >
            <Trash2 size={16} />
          </button>
        </div>
      </div>
    </div>
  )
}

// Enhanced invoice generation (same as admin)
const generateInvoice = async (saleData) => {
  const invoiceElement = document.createElement('div')
  invoiceElement.innerHTML = `
    <div style="font-family: 'Arial', sans-serif; max-width: 550px; margin: 0 auto; padding: 20px; background: rgb(255, 255, 255); color: rgb(51, 51, 51); line-height: 1.4;">
      
      <!-- Header -->
      <div style="text-align: center; margin-bottom: 20px; padding-bottom: 15px; border-bottom: 2px solid rgb(139, 92, 246);">
        <h1 style="color: rgb(139, 92, 246); margin: 0 0 8px 0; font-size: 24px; font-weight: bold;">VWV VAPE SHOP</h1>
        <p style="margin: 0; color: rgb(107, 114, 128); font-size: 12px;">📍 123 Vape Street, Dhaka-1000 | 📞 +880-123-456-789 | 📧 sales@vwvvape.com</p>
      </div>

      <!-- Invoice Info & Customer -->
      <div style="display: flex; justify-content: space-between; margin-bottom: 20px; background: rgb(248, 250, 252); padding: 15px; border-radius: 8px;">
        <div style="flex: 1;">
          <h2 style="margin: 0 0 10px 0; color: rgb(139, 92, 246); font-size: 18px; font-weight: bold;">INVOICE</h2>
          <div style="font-size: 12px; color: rgb(55, 65, 81);">
            <p style="margin: 3px 0;"><strong>ID:</strong> ${saleData.saleId || 'N/A'}</p>
            <p style="margin: 3px 0;"><strong>Date:</strong> ${new Date(saleData.timestamp || Date.now()).toLocaleDateString()}</p>
            <p style="margin: 3px 0;"><strong>Time:</strong> ${new Date(saleData.timestamp || Date.now()).toLocaleTimeString()}</p>
            <p style="margin: 3px 0;"><strong>Cashier:</strong> ${saleData.cashier || 'Moderator'}</p>
          </div>
        </div>
        
        <div style="flex: 1; text-align: right;">
          <h3 style="margin: 0 0 10px 0; color: rgb(139, 92, 246); font-size: 14px; font-weight: bold;">CUSTOMER</h3>
          <div style="font-size: 12px; color: rgb(55, 65, 81);">
            <p style="margin: 3px 0;"><strong>Name:</strong> ${saleData.customer?.name || 'Walk-in Customer'}</p>
            ${saleData.customer?.phone ? `<p style="margin: 3px 0;"><strong>Phone:</strong> ${saleData.customer.phone}</p>` : ''}
            <span style="background: rgb(16, 185, 129); color: white; padding: 2px 8px; border-radius: 12px; font-size: 10px; font-weight: 600;">PAID</span>
          </div>
        </div>
      </div>

      <!-- Items Table -->
      <div style="margin-bottom: 20px;">
        <h3 style="margin: 0 0 10px 0; color: rgb(55, 65, 81); font-size: 14px; font-weight: bold;">ITEMS PURCHASED</h3>
        <table style="width: 100%; border-collapse: collapse; font-size: 11px;">
          <thead>
            <tr style="background: rgb(139, 92, 246); color: white;">
              <th style="padding: 8px 6px; text-align: left; font-weight: 600;">#</th>
              <th style="padding: 8px 6px; text-align: left; font-weight: 600;">Product</th>
              <th style="padding: 8px 6px; text-align: center; font-weight: 600;">Branch</th>
              <th style="padding: 8px 6px; text-align: center; font-weight: 600;">Qty</th>
              <th style="padding: 8px 6px; text-align: right; font-weight: 600;">Price</th>
              <th style="padding: 8px 6px; text-align: right; font-weight: 600;">Total</th>
            </tr>
          </thead>
          <tbody>
            ${(saleData.items || [])
              .map(
                (item, index) => `
              <tr style="border-bottom: 1px solid rgb(229, 231, 235); ${
                index % 2 === 0
                  ? 'background: rgb(249, 250, 251);'
                  : 'background: white;'
              }">
                <td style="padding: 6px; font-weight: 600; color: rgb(107, 114, 128);">${index + 1}</td>
                <td style="padding: 6px; font-weight: 500; color: rgb(55, 65, 81);">
                  ${(item.productName || 'Unknown Product').length > 25
                    ? (item.productName || 'Unknown Product').substring(0, 25) + '...'
                    : (item.productName || 'Unknown Product')
                  }
                  ${item.selectedOptions && Object.keys(item.selectedOptions).length > 0 ? `<br><small style="color: rgb(107, 114, 128);">
                    ${Object.values(item.selectedOptions).join(' • ')}
                  </small>` : ''}
                </td>
                <td style="padding: 6px; text-align: center;">
                  <span style="background: rgb(139, 92, 246); color: white; padding: 1px 6px; border-radius: 10px; font-size: 9px; font-weight: 600;">
                    ${(item.branch || 'N/A').toUpperCase()}
                  </span>
                </td>
                <td style="padding: 6px; text-align: center; font-weight: 600; color: rgb(55, 65, 81);">${item.quantity || 0}</td>
                <td style="padding: 6px; text-align: right; font-weight: 500; color: rgb(55, 65, 81);">৳${(item.unitPrice || 0).toFixed(2)}</td>
                <td style="padding: 6px; text-align: right; font-weight: 700; color: rgb(5, 150, 105);">৳${(item.totalPrice || 0).toFixed(2)}</td>
              </tr>
            `
              )
              .join('')}
          </tbody>
        </table>
      </div>

      <!-- Payment & Totals -->
      <div style="margin-bottom: 20px;">
        <div style="display: flex; justify-content: space-between; gap: 15px;">
          <div style="flex: 1; background: rgb(240, 253, 244); padding: 12px; border-radius: 8px; border-left: 3px solid rgb(16, 185, 129);">
            <h4 style="margin: 0 0 8px 0; color: rgb(5, 150, 105); font-size: 12px; font-weight: bold;">PAYMENT METHOD</h4>
            ${(saleData.payment?.methods || [])
              .map(
                (method) => `
              <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 4px;">
                <span style="font-size: 11px; font-weight: 600; color: rgb(55, 65, 81);">
                  <span style="width: 6px; height: 6px; background: rgb(16, 185, 129); border-radius: 50%; display: inline-block; margin-right: 5px;"></span>
                  ${method.name || 'Unknown'}
                </span>
                <span style="font-size: 11px; font-weight: 700; color: rgb(5, 150, 105);">৳${(method.amount || saleData.totalAmount || 0).toFixed(2)}</span>
              </div>
            `
              )
              .join('')}
          </div>
          
          <div style="flex: 1; background: rgb(254, 254, 254); padding: 12px; border-radius: 8px; border: 1px solid rgb(139, 92, 246);">
            <h4 style="margin: 0 0 8px 0; color: rgb(139, 92, 246); font-size: 12px; font-weight: bold;">TOTAL SUMMARY</h4>
            <div style="display: flex; justify-content: space-between; margin-bottom: 4px; font-size: 11px;">
              <span style="color: rgb(55, 65, 81);">Subtotal:</span>
              <span style="font-weight: 600;">৳${(saleData.totalAmount || 0).toFixed(2)}</span>
            </div>
            <div style="border-top: 1px solid rgb(226, 232, 240); padding-top: 6px;">
              <div style="display: flex; justify-content: space-between; align-items: center; background: rgb(139, 92, 246); color: white; padding: 8px; border-radius: 4px;">
                <span style="font-size: 12px; font-weight: bold;">TOTAL:</span>
                <span style="font-size: 14px; font-weight: bold;">৳${(saleData.payment?.totalPaid || saleData.totalAmount || 0).toFixed(2)}</span>
              </div>
              ${(saleData.payment?.change || 0) > 0 ? `
                <div style="display: flex; justify-content: space-between; align-items: center; background: rgb(16, 185, 129); color: white; padding: 6px; border-radius: 4px; margin-top: 4px;">
                  <span style="font-size: 11px; font-weight: 600;">Change:</span>
                  <span style="font-size: 12px; font-weight: bold;">৳${(saleData.payment.change || 0).toFixed(2)}</span>
                </div>
              ` : ''}
            </div>
          </div>
        </div>
      </div>

      <!-- Footer -->
      <div style="text-align: center; padding-top: 15px; border-top: 1px solid rgb(229, 231, 235); background: rgb(248, 250, 252); border-radius: 8px; padding: 15px;">
        <h3 style="margin: 0 0 8px 0; color: rgb(5, 150, 105); font-size: 14px; font-weight: bold;">Thank You for Your Business!</h3>
        <p style="margin: 0 0 10px 0; color: rgb(107, 114, 128); font-size: 11px;">We appreciate your trust in VWV Vape Shop</p>
        
        <div style="display: flex; justify-content: space-around; margin-bottom: 10px; font-size: 10px; color: rgb(107, 114, 128);">
          <div>
            <strong>Follow Us:</strong><br>
            📱 @vwvvapeshop<br>
            🌐 www.vwvvape.com
          </div>
          <div>
            <strong>Support:</strong><br>
            📧 support@vwvvape.com<br>
            📞 +880-123-456-789
          </div>
        </div>
        
        <div style="font-size: 9px; color: rgb(156, 163, 175); font-style: italic; line-height: 1.3; border-top: 1px solid rgb(229, 231, 235); padding-top: 8px;">
          • Please retain this invoice for warranty and return purposes •<br>
          • All sales are subject to our terms and conditions • Thank you for choosing VWV Vape Shop •<br>
          • Processed by Moderator at ${saleData.items?.[0]?.branch?.toUpperCase() || 'BRANCH'} Branch •
        </div>
      </div>
    </div>
  `

  invoiceElement.style.position = 'absolute'
  invoiceElement.style.left = '-9999px'
  invoiceElement.style.width = '550px'
  document.body.appendChild(invoiceElement)

  try {
    const canvas = await html2canvas(invoiceElement, {
      scale: 2,
      backgroundColor: '#ffffff',
      useCORS: true,
      allowTaint: true,
      height: invoiceElement.scrollHeight,
      width: 550,
    })

    const imgData = canvas.toDataURL('image/png', 1.0)
    const pdf = new jsPDF('p', 'mm', 'a4')

    const imgWidth = 210
    const pageHeight = 297
    const imgHeight = (canvas.height * imgWidth) / canvas.width
    let heightLeft = imgHeight
    let position = 0

    pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight)
    heightLeft -= pageHeight

    while (heightLeft >= 0) {
      position = heightLeft - imgHeight
      pdf.addPage()
      pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight)
      heightLeft -= pageHeight
    }

    pdf.save(`VWV-Invoice-${saleData.saleId || 'unknown'}.pdf`)

    Swal.fire({
      icon: 'success',
      title: 'Invoice Generated!',
      text: 'Invoice PDF has been downloaded successfully',
      timer: 2000,
      showConfirmButton: false,
      toast: true,
      position: 'top-end',
    })
  } catch (error) {
    console.error('Error generating PDF:', error)
    Swal.fire({
      icon: 'error',
      title: 'Invoice Generation Failed',
      text: 'Could not generate invoice PDF. Please try again.',
    })
  } finally {
    document.body.removeChild(invoiceElement)
  }
}

// Payment Method Selector (same as admin)
const PaymentMethodSelector = ({
  selectedMethods,
  onMethodChange,
  totalAmount,
}) => {
  const [amounts, setAmounts] = useState({})

  const handleMethodToggle = (method) => {
    const isSelected = selectedMethods.some((m) => m.id === method.id)

    if (isSelected) {
      onMethodChange(selectedMethods.filter((m) => m.id !== method.id))
      const newAmounts = { ...amounts }
      delete newAmounts[method.id]
      setAmounts(newAmounts)
    } else {
      const newMethod = { ...method, amount: totalAmount || 0 }
      onMethodChange([newMethod])
      setAmounts({ [method.id]: totalAmount || 0 })
    }
  }

  const handleAmountChange = (methodId, amount) => {
    const parsedAmount = parseFloat(amount) || 0
    const newAmounts = { ...amounts, [methodId]: parsedAmount }
    setAmounts(newAmounts)

    const updatedMethods = selectedMethods.map((method) =>
      method.id === methodId
        ? { ...method, amount: parsedAmount }
        : method
    )
    onMethodChange(updatedMethods)
  }

  const totalPaid = selectedMethods.reduce(
    (sum, method) => sum + (method.amount || 0),
    0
  )
  const remainingAmount = Math.max(0, (totalAmount || 0) - totalPaid)
  const isPaymentComplete = totalPaid >= (totalAmount || 0)

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h3 className="text-xl font-bold text-gray-900 mb-2 flex items-center justify-center gap-2">
          <CreditCard className="text-purple-600" size={24} />
          Payment Method
        </h3>
        <p className="text-gray-600">Choose payment option</p>
      </div>

      {/* Payment Method Grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
        {PAYMENT_METHODS.map((method) => {
          const IconComponent = method.icon
          const isSelected = selectedMethods.some((m) => m.id === method.id)

          return (
            <motion.button
              key={method.id}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => handleMethodToggle(method)}
              className={`relative p-4 rounded-xl border-2 transition-all duration-300 text-center ${
                isSelected
                  ? `${method.borderColor} ${method.bgColor} shadow-lg`
                  : 'border-gray-200 bg-white hover:border-gray-300 hover:shadow-md'
              }`}
            >
              {/* Selection Indicator */}
              {isSelected && (
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  className="absolute -top-1 -right-1 w-5 h-5 bg-green-500 text-white rounded-full flex items-center justify-center"
                >
                  <CheckCircle size={12} />
                </motion.div>
              )}

              {/* Icon */}
              <div
                className={`w-10 h-10 rounded-lg bg-gradient-to-br ${method.color} flex items-center justify-center mx-auto mb-2`}
              >
                <IconComponent size={20} className="text-white" />
              </div>

              {/* Method Name */}
              <h4
                className={`text-sm font-bold ${
                  isSelected ? method.textColor : 'text-gray-900'
                }`}
              >
                {method.name}
              </h4>

              {/* Badge */}
              {method.id === 'cash' && (
                <span className="inline-block mt-1 px-2 py-0.5 rounded-full text-xs font-semibold bg-green-100 text-green-800">
                  Instant
                </span>
              )}
              {method.type !== 'cash' && (
                <span className="inline-block mt-1 px-2 py-0.5 rounded-full text-xs font-semibold bg-blue-100 text-blue-800">
                  Online
                </span>
              )}
            </motion.button>
          )
        })}
      </div>

      {/* Amount Input for Selected Method */}
      {selectedMethods.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-4"
        >
          <div className="bg-gradient-to-r from-purple-50 to-blue-50 rounded-xl p-4 border border-purple-100">
            <h4 className="font-bold text-gray-900 text-lg mb-3 flex items-center gap-2">
              <DollarSign className="text-purple-600" size={20} />
              Payment Amount
            </h4>

            {selectedMethods.map((method) => {
              const IconComponent = method.icon
              return (
                <div
                  key={method.id}
                  className="bg-white rounded-lg p-3 shadow-sm mb-3"
                >
                  <div className="flex items-center gap-3 mb-3">
                    <div
                      className={`w-8 h-8 rounded-lg bg-gradient-to-br ${method.color} flex items-center justify-center`}
                    >
                      <IconComponent size={16} className="text-white" />
                    </div>
                    <span className="font-semibold text-gray-900">
                      {method.name}
                    </span>
                  </div>

                  <div className="relative">
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      max={totalAmount || 999999}
                      value={amounts[method.id] || ''}
                      onChange={(e) =>
                        handleAmountChange(method.id, e.target.value)
                      }
                      placeholder={`${(totalAmount || 0).toFixed(2)}`}
                      className="w-full p-3 pl-10 pr-4 text-lg font-semibold rounded-lg border-2 border-gray-200 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    />
                    <DollarSign
                      size={18}
                      className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                    />
                  </div>
                </div>
              )
            })}
          </div>

          {/* Payment Summary */}
          <div className="bg-white p-4 rounded-xl border-2 border-purple-200 shadow-lg">
            <h4 className="font-bold text-gray-900 text-lg mb-3">Summary</h4>
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Total:</span>
                <span className="font-semibold">৳{(totalAmount || 0).toFixed(2)}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Paying:</span>
                <span className="font-semibold">৳{totalPaid.toFixed(2)}</span>
              </div>
              <div className="border-t pt-2">
                <div className="flex justify-between items-center text-lg font-bold text-purple-600">
                  <span>Balance:</span>
                  <span>৳{(totalAmount || 0).toFixed(2)}</span>
                </div>
              </div>
              {remainingAmount > 0 ? (
                <div className="bg-red-50 p-2 rounded text-red-700 font-semibold text-sm">
                  ⚠️ Remaining: ৳{remainingAmount.toFixed(2)}
                </div>
              ) : totalPaid > (totalAmount || 0) ? (
                <div className="bg-green-50 p-2 rounded text-green-700 font-semibold text-sm">
                  💰 Change: ৳{(totalPaid - (totalAmount || 0)).toFixed(2)}
                </div>
              ) : isPaymentComplete ? (
                <div className="bg-green-50 p-2 rounded text-green-700 font-semibold text-sm">
                  ✅ Payment Complete
                </div>
              ) : null}
            </div>
          </div>
        </motion.div>
      )}
    </div>
  )
}


