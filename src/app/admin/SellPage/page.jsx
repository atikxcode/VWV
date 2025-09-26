'use client'

import { useState, useEffect } from 'react'
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
  Droplets, Battery, Star 
} from 'lucide-react'

// 🔥 NEW: Import your cart hook
import { useCart } from '../../../../components/hooks/useCart'

// 🔥 FIX: Enhanced Payment Methods with proper structure
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

// Helper functions remain the same
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
    return localStorage.getItem('authToken') || sessionStorage.getItem('authToken') || 'Bearer temp-admin-token-for-development'
  }
  return 'Bearer temp-admin-token-for-development'
}

const makeAuthenticatedRequest = async (url, options = {}, bustCache = false) => {
  const token = getAuthToken()
  
  const headers = {
    'Content-Type': 'application/json',
    ...options.headers,
  }
  
  if (token) {
    headers.Authorization = token.startsWith('Bearer ') ? token : `Bearer ${token}`
  }

  if (bustCache) {
    headers['Cache-Control'] = 'no-cache, no-store, must-revalidate'
    headers['Pragma'] = 'no-cache'
    headers['Expires'] = '0'
    
    const separator = url.includes('?') ? '&' : '?'
    url = `${url}${separator}_t=${Date.now()}`
  }
  
  // 🔥 MAKE REQUEST
  const response = await fetch(url, {
    ...options,
    headers,
  })

  // 🔥 HANDLE EXPIRED TOKEN (401 Unauthorized)
  if (response.status === 401) {
    console.log('🔥 TOKEN EXPIRED: Clearing authentication and redirecting to login')
    
    // Clear stored tokens
    if (typeof window !== 'undefined') {
      localStorage.removeItem('authToken')
      sessionStorage.removeItem('authToken')
      localStorage.removeItem('userRole')
      localStorage.removeItem('userBranch')
    }
    
    // Show expiration message
    Swal.fire({
      icon: 'warning',
      title: 'Session Expired',
      text: 'Your session has expired. Please sign in again to continue.',
      confirmButtonText: 'Go to Login',
      allowOutsideClick: false,
      allowEscapeKey: false
    }).then(() => {
      // Redirect to login page - CHANGE THIS TO YOUR ACTUAL LOGIN PATH
      window.location.href = '/RegistrationPage' // 🔥 CHANGE THIS TO YOUR LOGIN PAGE PATH
    })
    
    // Return the response anyway for error handling
    return response
  }

  return response
}



// 🔥 ENHANCED: Product Details Modal Component with Complete Product Information Display
const ProductDetailsModal = ({ isOpen, product, branches, onClose, onAddToCart }) => {
  const [selectedNicotineStrength, setSelectedNicotineStrength] = useState('')
  const [selectedVgPgRatio, setSelectedVgPgRatio] = useState('')
  const [selectedColor, setSelectedColor] = useState('')
  const [selectedBranch, setSelectedBranch] = useState('') // 🔥 NEW: Branch selection state

  // Reset selections when modal opens/closes or product changes
  useEffect(() => {
    if (isOpen && product) {
      setSelectedNicotineStrength('')
      setSelectedVgPgRatio('')
      setSelectedColor('')
      setSelectedBranch('') // 🔥 NEW: Reset branch selection
    }
  }, [isOpen, product])

  if (!product) return null

  // Get technical specifications
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

  // Get branches from stock data
  const getBranches = () => {
    if (!product?.stock) {
      return branches || []
    }
    
    const stockKeys = Object.keys(product.stock)
    const stockKeysFiltered = stockKeys.filter(key => key.endsWith('_stock'))
    const productBranches = stockKeysFiltered.map(key => key.replace('_stock', ''))
    
    return productBranches.length > 0 ? productBranches : (branches || [])
  }

  const productBranches = getBranches()

  // Get branch stock status
  const getBranchStockStatus = (branchName) => {
    const stockKey = `${branchName}_stock`
    const stockValue = product?.stock?.[stockKey] || 0
    return stockValue > 0
  }

  // Check if product has branch specifications
  const hasBranchSpecifications = () => {
    return product?.branchSpecifications && Object.keys(product.branchSpecifications).length > 0
  }

  // Check if product has any specifications
  const hasAnySpecifications = () => {
    const nicotineOptions = getUniqueSpecificationValues('nicotineStrength')
    const vgPgOptions = getUniqueSpecificationValues('vgPgRatio')
    const colorOptions = getUniqueSpecificationValues('colors')
    
    return nicotineOptions.length > 0 || vgPgOptions.length > 0 || colorOptions.length > 0
  }

  // Case-insensitive specification values extraction
  const getUniqueSpecificationValues = (specType) => {
    if (!product?.branchSpecifications) return []
    
    const allValues = new Set()
    
    Object.keys(product.branchSpecifications).forEach(branchName => {
      const branchSpec = product.branchSpecifications[branchName]
      if (branchSpec[specType]) {
        branchSpec[specType].forEach(value => allValues.add(value))
      }
    })
    
    return Array.from(allValues)
  }

  // Check if specification should show as text
  const shouldShowAsText = (specType) => {
    if (!product?.branchSpecifications) return false
    
    const branches = Object.values(product.branchSpecifications)
    if (branches.length === 0) return false

    let firstValue = null
    
    for (const branchSpec of branches) {
      if (!branchSpec[specType] || branchSpec[specType].length !== 1) {
        return false
      }
      
      if (firstValue === null) {
        firstValue = branchSpec[specType][0]
      } else if (branchSpec[specType][0] !== firstValue) {
        return false
      }
    }
    
    return firstValue !== null
  }

  // Get single specification value
  const getSingleSpecificationValue = (specType) => {
    if (!product?.branchSpecifications) return ''
    const firstBranch = Object.values(product.branchSpecifications)[0]
    return firstBranch?.[specType]?.[0] || ''
  }

  // Check if any selections are made
  const hasAnySelections = () => {
    return selectedNicotineStrength || selectedVgPgRatio || selectedColor
  }

  // Get available branches for current selection
  const getAvailableBranchesForSelection = () => {
    if (!product?.branchSpecifications) {
      const result = productBranches.filter(branch => getBranchStockStatus(branch))
      return result
    }
    
    const result = productBranches.filter(branch => {
      const hasStock = getBranchStockStatus(branch)
      if (!hasStock) {
        return false
      }

      if (!hasAnySelections()) {
        return true
      }

      const branchSpec = product.branchSpecifications[branch] || 
                         product.branchSpecifications[branch.toLowerCase()] ||
                         product.branchSpecifications[branch.toUpperCase()] ||
                         product.branchSpecifications[branch.charAt(0).toUpperCase() + branch.slice(1)]

      if (selectedNicotineStrength) {
        const branchNicotineSpecs = branchSpec?.nicotineStrength
        if (branchNicotineSpecs && !branchNicotineSpecs.includes(selectedNicotineStrength)) {
          return false
        }
      }
      
      if (selectedVgPgRatio) {
        const branchVgPgSpecs = branchSpec?.vgPgRatio
        if (branchVgPgSpecs && !branchVgPgSpecs.includes(selectedVgPgRatio)) {
          return false
        }
      }
      
      if (selectedColor) {
        const branchColorSpecs = branchSpec?.colors
        if (branchColorSpecs && !branchColorSpecs.includes(selectedColor)) {
          return false
        }
      }

      return true
    })

    return result
  }

  // Check if branch selection is required
  const requiresBranchSelection = () => {
    const availableBranches = getAvailableBranchesForSelection()
    return availableBranches.length > 1
  }

  // Check if user must select specifications
  const mustSelectSpecifications = () => {
    if (!hasBranchSpecifications() || !hasAnySpecifications()) return false
    
    const nicotineOptions = getUniqueSpecificationValues('nicotineStrength')
    const vgPgOptions = getUniqueSpecificationValues('vgPgRatio')
    const colorOptions = getUniqueSpecificationValues('colors')

    const needsNicotineSelection = nicotineOptions.length > 1 && !shouldShowAsText('nicotineStrength')
    const needsVgPgSelection = vgPgOptions.length > 1 && !shouldShowAsText('vgPgRatio')
    const needsColorSelection = colorOptions.length > 1 && !shouldShowAsText('colors')

    return needsNicotineSelection || needsVgPgSelection || needsColorSelection
  }

  // Validate required selections
  const validateSelections = () => {
    const nicotineOptions = getUniqueSpecificationValues('nicotineStrength')
    const vgPgOptions = getUniqueSpecificationValues('vgPgRatio')
    const colorOptions = getUniqueSpecificationValues('colors')

    const errors = []

    if (nicotineOptions.length > 1 && !shouldShowAsText('nicotineStrength') && !selectedNicotineStrength) {
      errors.push('Nicotine Strength')
    }
    if (vgPgOptions.length > 1 && !shouldShowAsText('vgPgRatio') && !selectedVgPgRatio) {
      errors.push('VG/PG Ratio')
    }
    if (colorOptions.length > 1 && !shouldShowAsText('colors') && !selectedColor) {
      errors.push('Color')
    }

    return errors
  }

  // Check if all required selections are made
  const areAllRequiredSelectionsMade = () => {
    if (mustSelectSpecifications()) {
      const missingSelections = validateSelections()
      if (missingSelections.length > 0) {
        return false
      }
    }
    
    if (requiresBranchSelection() && !selectedBranch) {
      return false
    }
    
    return true
  }

  // Check if add to cart is enabled
  const isAddToCartEnabled = () => {
    const hasStock = productBranches.length > 0 ? productBranches.some(branch => getBranchStockStatus(branch)) : product?.stock?.available
    const allSelectionsMade = areAllRequiredSelectionsMade()
    const hasAvailableBranches = getAvailableBranchesForSelection().length > 0
    
    return hasStock && allSelectionsMade && hasAvailableBranches
  }

  // Get button text
  const getButtonText = () => {
    const hasStock = productBranches.length > 0 ? productBranches.some(branch => getBranchStockStatus(branch)) : product?.stock?.available
    
    if (!hasStock) {
      return 'Out of Stock'
    }
    
    return 'Add to Cart'
  }

  // Get tooltip message for disabled button
  const getTooltipMessage = () => {
    const hasStock = productBranches.length > 0 ? productBranches.some(branch => getBranchStockStatus(branch)) : product?.stock?.available
    
    if (!hasStock) {
      return 'This product is currently out of stock'
    }
    
    const specMissing = validateSelections()
    if (specMissing.length > 0) {
      return 'Please select all the product specifications'
    }
    
    if (requiresBranchSelection() && !selectedBranch) {
      return 'Please select a branch to sell from'
    }
    
    if (getAvailableBranchesForSelection().length === 0) {
      return 'Not available with your selected options'
    }
    
    return ''
  }

  // 🔥 ENHANCED: Handle add to cart with selected branch
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

    // Use selected branch or first available branch
    const availableBranches = getAvailableBranchesForSelection()
    const branchToUse = selectedBranch || availableBranches[0] || productBranches[0]

    console.log('🔥 ADMIN SELECTED BRANCH:', branchToUse)
    console.log('🔥 Available branches:', availableBranches)
    console.log('🔥 Selected specifications:', selectedOptions)

    // Call the parent's add to cart function with specifications and SELECTED branch
    onAddToCart(product, branchToUse, selectedOptions, [branchToUse]) // Only the selected branch

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
            <div className="flex justify-between items-center p-6 border-b border-gray-200 bg-gradient-to-r from-purple-50 to-blue-50">
              <h3 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                <Info size={28} className="text-purple-600" />
                Product Details
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
                {/* Left Column - Basic Info & Features */}
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

                  {/* Technical Specifications Section */}
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

                  {/* Features Section */}
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

                  {/* Each Set Contains Section */}
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

                {/* Right Column - Specifications & Branch Selection */}
                <div className="space-y-6">
                  {/* Branch Specifications with Required Warning */}
                  {hasBranchSpecifications() && hasAnySpecifications() && (
                    <div className="bg-purple-50 rounded-xl p-6">
                      <div className="flex items-center justify-between mb-4">
                        <h4 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                          <Settings size={20} className="text-purple-600" />
                          Select Specifications
                        </h4>
                        {mustSelectSpecifications() && (
                          <div className="flex items-center gap-1 text-red-600 text-sm">
                            <AlertCircle size={16} />
                            <span>Required</span>
                          </div>
                        )}
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
                                  className={`w-full p-3 rounded-lg border focus:outline-none focus:ring-2 focus:ring-purple-500 ${
                                    mustSelectSpecifications() && !selectedNicotineStrength && nicotineOptions.length > 1
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
                                  className={`w-full p-3 rounded-lg border focus:outline-none focus:ring-2 focus:ring-purple-500 ${
                                    mustSelectSpecifications() && !selectedVgPgRatio && vgPgOptions.length > 1
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
                                  <Palette size={16} className="text-purple-600" />
                                  Color
                                  {colorOptions.length > 1 && (
                                    <span className="text-red-500 ml-1">*</span>
                                  )}
                                </label>
                                <select
                                  value={selectedColor}
                                  onChange={(e) => setSelectedColor(e.target.value)}
                                  className={`w-full p-3 rounded-lg border focus:outline-none focus:ring-2 focus:ring-purple-500 ${
                                    mustSelectSpecifications() && !selectedColor && colorOptions.length > 1
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

                  {/* Branch Selection with Admin Choice */}
                  <div className="bg-green-50 rounded-xl p-6">
                    <h4 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                      <Store size={20} className="text-green-600" />
                      {requiresBranchSelection() ? 'Select Branch to Sell From' : 'Available Branches'}
                      {requiresBranchSelection() && (
                        <span className="text-red-500 text-sm font-medium">*Required</span>
                      )}
                    </h4>

                    <div className="space-y-3">
                      {productBranches.map((branch) => {
                        const hasStock = getBranchStockStatus(branch)
                        const isAvailable = hasBranchSpecifications() 
                          ? (hasAnySelections() ? getAvailableBranchesForSelection().includes(branch) : hasStock)
                          : hasStock
                        const stockKey = `${branch}_stock`
                        const stock = product.stock?.[stockKey] || 0
                        const isSelected = selectedBranch === branch

                        return (
                          <div
                            key={branch}
                            className={`relative overflow-hidden ${
                              isAvailable && requiresBranchSelection() 
                                ? 'cursor-pointer hover:shadow-md transform hover:scale-[1.02] transition-all duration-200'
                                : ''
                            }`}
                            onClick={() => {
                              if (isAvailable && requiresBranchSelection()) {
                                setSelectedBranch(isSelected ? '' : branch) // Toggle selection
                              }
                            }}
                          >
                            <div
                              className={`flex items-center justify-between p-4 rounded-lg border-2 transition-all duration-200 ${
                                isSelected
                                  ? 'border-blue-500 bg-blue-50 shadow-md'
                                  : isAvailable
                                  ? requiresBranchSelection() 
                                    ? 'border-green-300 bg-green-50 hover:border-green-400'
                                    : 'border-green-200 bg-green-50'
                                  : 'border-gray-200 bg-gray-50 opacity-60'
                              }`}
                            >
                              <div className="flex items-center gap-3">
                                <div className="relative">
                                  <Store size={20} className={
                                    isSelected 
                                      ? "text-blue-600" 
                                      : isAvailable 
                                      ? "text-green-600" 
                                      : "text-gray-400"
                                  } />
                                  {isSelected && (
                                    <div className="absolute -top-1 -right-1 w-3 h-3 bg-blue-600 rounded-full flex items-center justify-center">
                                      <CheckCircle size={10} className="text-white" />
                                    </div>
                                  )}
                                </div>
                                <span className={`font-semibold capitalize ${
                                  isSelected ? 'text-blue-900' : 'text-gray-900'
                                }`}>
                                  {branch}
                                </span>
                                {isSelected && (
                                  <span className="px-2 py-1 bg-blue-600 text-white text-xs rounded-full font-medium">
                                    SELECTED
                                  </span>
                                )}
                              </div>
                              <div className="flex items-center gap-2">
                                {isAvailable ? (
                                  <span className={`font-medium ${
                                    isSelected ? 'text-blue-600' : 'text-green-600'
                                  }`}>
                                    Stock: {stock}
                                  </span>
                                ) : !hasStock ? (
                                  <span className="text-red-600 font-medium">
                                    Out of Stock
                                  </span>
                                ) : (
                                  <span className="text-orange-600 font-medium">
                                    Specs Not Available
                                  </span>
                                )}
                              </div>
                            </div>

                            {/* Selection indicator */}
                            {isAvailable && requiresBranchSelection() && (
                              <div className={`absolute left-0 top-0 bottom-0 w-1 ${
                                isSelected ? 'bg-blue-600' : 'bg-transparent hover:bg-green-400'
                              } transition-colors duration-200`} />
                            )}
                          </div>
                        )
                      })}
                    </div>

                    {/* Warning messages */}
                    {hasAnySelections() && getAvailableBranchesForSelection().length === 0 && (
                      <div className="mt-4 p-3 bg-red-100 border border-red-300 rounded-lg">
                        <p className="text-red-800 text-sm flex items-center gap-2">
                          <AlertCircle size={16} />
                          Selected specifications are not available in any branch
                        </p>
                      </div>
                    )}

                    {requiresBranchSelection() && !selectedBranch && (
                      <div className="mt-4 p-3 bg-yellow-100 border border-yellow-300 rounded-lg">
                        <p className="text-yellow-800 text-sm flex items-center gap-2">
                          <AlertCircle size={16} />
                          Please select which branch to sell this product from
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
                        ? 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white hover:from-purple-700 hover:to-indigo-700'
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

// 🔥 UPDATED: Enhanced Product Card with Details Button
const ProductCard = ({ product, onAddToCart, branches, onShowDetails }) => {
  const [selectedBranch, setSelectedBranch] = useState(branches[0] || 'bashundhara')
  
  const normalizedBranch = selectedBranch.toLowerCase()
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

        {/* Branch Selector */}
        <div className="mb-3">
          <label className="block text-xs font-medium text-gray-700 mb-1">
            Branch Stock
          </label>
          <select
            value={selectedBranch}
            onChange={(e) => setSelectedBranch(e.target.value)}
            className="w-full p-2 text-sm rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-purple-500"
          >
            {branches.map((branch) => {
              const normalizedDisplayBranch = branch.toLowerCase()
              const branchStock = product.stock?.[`${normalizedDisplayBranch}_stock`] ?? 0
              return (
                <option key={branch} value={branch}>
                  {branch.charAt(0).toUpperCase() + branch.slice(1)} ({branchStock})
                </option>
              )
            })}
          </select>
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
            onClick={() => onAddToCart(product, selectedBranch)}
            disabled={isOutOfStock}
            className={`flex-1 py-2 rounded-lg font-medium transition-colors text-sm ${
              isOutOfStock
                ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                : 'bg-purple-600 text-white hover:bg-purple-700'
            }`}
          >
            {isOutOfStock ? 'Out of Stock' : 'Quick Add'}
          </button>
        </div>
      </div>
    </motion.div>
  )
}

// 🔥 UPDATED: Enhanced Sortable Cart Item using your cart structure
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

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`bg-white rounded-xl shadow-sm border border-gray-100 p-4 mb-3 transition-all ${
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
        <div className="w-16 h-16 bg-gradient-to-br from-purple-100 to-blue-100 rounded-lg flex-shrink-0 overflow-hidden">
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
          <div className="w-full h-full flex items-center justify-center" style={{ display: item.product?.images?.length > 0 ? 'none' : 'flex' }}>
            <Package2 size={24} className="text-purple-400" />
          </div>
        </div>

        {/* Product Details */}
        <div className="flex-1 min-w-0">
          <h4 className="font-semibold text-gray-900 truncate text-sm">
            {item.product?.name || 'Unknown Product'}
          </h4>
          <div className="flex items-center gap-2 mt-1">
            <span className="text-xs bg-purple-100 text-purple-700 px-2 py-1 rounded-full">
              {item.selectedBranch?.charAt(0).toUpperCase() + item.selectedBranch?.slice(1) || 'N/A'}
            </span>
            <span className="text-sm font-medium text-purple-600">
              ${item.product?.price?.toFixed(2) || '0.00'}
            </span>
          </div>
          
          {/* Show specifications if available */}
          {item.selectedOptions && Object.keys(item.selectedOptions).length > 0 && (
            <div className="flex flex-wrap gap-1 mt-2">
              {item.selectedOptions.nicotineStrength && (
                <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded">
                  {item.selectedOptions.nicotineStrength}
                </span>
              )}
              {item.selectedOptions.vgPgRatio && (
                <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded">
                  {item.selectedOptions.vgPgRatio}
                </span>
              )}
              {item.selectedOptions.color && (
                <span className="text-xs bg-yellow-100 text-yellow-700 px-2 py-0.5 rounded">
                  {item.selectedOptions.color}
                </span>
              )}
            </div>
          )}
        </div>

        {/* Quantity Controls */}
        <div className="flex items-center gap-2 bg-gray-50 rounded-lg p-1">
          <button
            onClick={() => onUpdateQuantity(item.id, (item.quantity || 1) - 1)}
            className="w-8 h-8 rounded-lg bg-white shadow-sm flex items-center justify-center hover:bg-red-50 hover:text-red-600 transition-colors"
          >
            <Minus size={14} />
          </button>
          <span className="w-8 text-center font-semibold text-gray-900">
            {item.quantity || 1}
          </span>
          <button
            onClick={() => onUpdateQuantity(item.id, (item.quantity || 1) + 1)}
            className="w-8 h-8 rounded-lg bg-purple-600 text-white flex items-center justify-center hover:bg-purple-700 transition-colors"
          >
            <Plus size={14} />
          </button>
        </div>

        {/* Price & Remove */}
        <div className="text-right">
          <p className="font-bold text-gray-900 text-lg">
            ${totalPrice.toFixed(2)}
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

// Keep existing generateInvoice and PaymentMethodSelector functions exactly as they were...
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
            <p style="margin: 3px 0;"><strong>Cashier:</strong> ${saleData.cashier || 'Unknown'}</p>
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
                <td style="padding: 6px; font-weight: 500; color: rgb(55, 65, 81);">${
                  (item.productName || 'Unknown Product').length > 30
                    ? (item.productName || 'Unknown Product').substring(0, 30) + '...'
                    : (item.productName || 'Unknown Product')
                }</td>
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
                  <span style="font-size: 12px; font-weight: bold;">$${(saleData.payment.change || 0).toFixed(2)}</span>
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
          • All sales are subject to our terms and conditions • Thank you for choosing VWV Vape Shop •
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
                <span className="font-semibold">${(totalAmount || 0).toFixed(2)}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Paying:</span>
                <span className="font-semibold">${totalPaid.toFixed(2)}</span>
              </div>
              <div className="border-t pt-2">
                <div className="flex justify-between items-center text-lg font-bold text-purple-600">
                  <span>Balance:</span>
                  <span>${(totalAmount || 0).toFixed(2)}</span>
                </div>
              </div>
              {remainingAmount > 0 ? (
                <div className="bg-red-50 p-2 rounded text-red-700 font-semibold text-sm">
                  Remaining: ${remainingAmount.toFixed(2)}
                </div>
              ) : totalPaid > (totalAmount || 0) ? (
                <div className="bg-green-50 p-2 rounded text-green-700 font-semibold text-sm">
                  Change: ${(totalPaid - (totalAmount || 0)).toFixed(2)}
                </div>
              ) : null}
            </div>
          </div>
        </motion.div>
      )}
    </div>
  )
}

// 🔥 MAIN COMPONENT: Enhanced Sales Page with Cart Hook Integration
export default function SellPageAdmin() {
  // 🔥 NEW: Use your cart hook instead of local state
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

  // All existing states (except cart which is now handled by the hook)
  const [products, setProducts] = useState([])
  const [categories, setCategories] = useState({})
  const [branches, setBranches] = useState([])
  const [loading, setLoading] = useState(true)
  const [showBarcodeScanner, setShowBarcodeScanner] = useState(false)
  const [showCartModal, setShowCartModal] = useState(false)
  const [saleCompleted, setSaleCompleted] = useState(false)
  const [completedSaleData, setCompletedSaleData] = useState(null)

  // Filter states
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('')
  const [barcodeFilter, setBarcodeFilter] = useState('')
  const [inStockOnly, setInStockOnly] = useState(false)

  // Payment states
  const [selectedPaymentMethods, setSelectedPaymentMethods] = useState([])
  const [customerName, setCustomerName] = useState('')
  const [customerPhone, setCustomerPhone] = useState('')

  // Pagination
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const itemsPerPage = 12

  // Product details modal state
  const [showProductModal, setShowProductModal] = useState(false)
  const [selectedProduct, setSelectedProduct] = useState(null)

  // dnd-kit sensors
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  )

  // Load initial data (same as before)
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

        // Load branches with authentication
        try {
          const branchesRes = await makeAuthenticatedRequest('/api/branches')
          if (branchesRes.ok) {
            const branchesData = await branchesRes.json()
            setBranches(branchesData.branches || ['bashundhara', 'mirpur'])
            console.log('Branches loaded:', branchesData.branches)
          } else {
            console.warn('Failed to load branches, using defaults')
            setBranches(['bashundhara', 'mirpur'])
          }
        } catch (error) {
          console.error('Error loading branches:', error)
          setBranches(['bashundhara', 'mirpur'])
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

    loadData()
  }, [])

  // Fetch products (same as before)
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

      console.log('[FETCH] Requesting products with params:', params.toString(), 'Cache busted:', bustCache)

      const response = await makeAuthenticatedRequest(`/api/products?${params}`, {}, bustCache)
      
      if (response.ok) {
        const data = await response.json()
        console.log('[FETCH] Products received:', {
          count: data.products?.length || 0,
          pagination: data.pagination,
          sampleProduct: data.products?.[0]?.name,
          sampleStock: data.products?.[0]?.stock,
          cachebusted: bustCache
        })
        
        setProducts(data.products || [])
        setTotalPages(data.pagination?.totalPages || 1)
      } else {
        console.error('[FETCH] Products API error:', response.status, response.statusText)
        
        if (response.status === 401) {
          Swal.fire({
            icon: 'error',
            title: 'Authentication Error',
            text: 'Please log in to access products. Using demo mode.',
          })
        }
      }
    } catch (error) {
      console.error('[FETCH] Error fetching products:', error)
      Swal.fire({
        icon: 'error',
        title: 'Connection Error',
        text: 'Failed to load products. Please check your connection.',
      })
    }
  }

  // Apply filters
  useEffect(() => {
    setCurrentPage(1)
  }, [searchTerm, selectedCategory, barcodeFilter, inStockOnly])


  useEffect(() => {
    if (!loading) {
      fetchProducts()
    }
  }, [currentPage, searchTerm, selectedCategory, barcodeFilter, inStockOnly])


  // Handle showing product details
  const handleShowProductDetails = (product) => {
    setSelectedProduct(product)
    setShowProductModal(true)
  }

  // Enhanced barcode scanning (same as before)
  const handleBarcodeScan = async (data) => {
    try {
      if (data && data.trim()) {
        console.log('[BARCODE] Scanned:', data.trim())
        setBarcodeFilter(data.trim())
        setShowBarcodeScanner(false)

        // Search for product by barcode
        const response = await makeAuthenticatedRequest(
          `/api/products?barcode=${encodeURIComponent(data.trim())}&limit=1`
        )
        
        if (response.ok) {
          const result = await response.json()
          console.log('[BARCODE] Search result:', result)

          if (result.products && result.products.length > 0) {
            const product = result.products[0]
            const defaultBranch = branches[0] || 'bashundhara'
            
            // Automatically add to cart
            handleAddToCart(product, defaultBranch)

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
      console.error('[BARCODE] Error:', error)
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

  // 🔥 UPDATED: Handle add to cart using your cart hook
  const handleAddToCart = (product, selectedBranch, selectedOptions = {}, availableBranches = []) => {
    try {
      if (!product || !product._id) {
        throw new Error('Invalid product data')
      }

      if (!selectedBranch) {
        throw new Error('Branch is required')
      }

      const normalizedBranch = selectedBranch.toLowerCase()
      const stock = product.stock?.[`${normalizedBranch}_stock`] ?? 0

      console.log('[CART] Adding to cart:', {
        productName: product.name,
        originalBranch: selectedBranch,
        normalizedBranch,
        stockKey: `${normalizedBranch}_stock`,
        stock,
        stockData: product.stock,
        selectedOptions,
        availableBranches
      })

      if (stock <= 0) {
        Swal.fire({
          icon: 'error',
          title: 'Out of Stock',
          text: 'This product is out of stock in the selected branch',
        })
        return
      }

      // Use your cart hook's addToCart function
      addToCart(product, 1, selectedOptions, availableBranches || [selectedBranch])

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
      console.error('[CART] Error adding to cart:', error)
      Swal.fire({
        icon: 'error',
        title: 'Add to Cart Failed',
        text: error.message || 'Could not add item to cart',
      })
    }
  }

  // 🔥 UPDATED: Use cart hook functions
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

  // Handle drag end for cart reordering (you might need to implement this in your cart hook)
  const handleDragEnd = (event) => {
    const { active, over } = event

    if (active.id !== over?.id) {
      // For now, just log this - you may need to add reordering to
      // For now, just log this - you may need to add reordering to your cart hook
      console.log('Cart item reordered:', active.id, 'to', over?.id)
      
      // Note: If you want cart reordering, you'll need to add a reorderCart function to your cart hook
      // For now, we'll just keep the existing order
    }
  }

  // Handle checkout
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
          text: `Payment amount ($${totalPaid.toFixed(2)}) is less than total ($${totalAmount.toFixed(2)})`,
        })
        return
      }

      setLoading(true)

      // Prepare sale data
      const saleData = {
        saleId: `VWV-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        timestamp: new Date().toISOString(),
        cashier: 'Admin User', // You might want to get this from authentication
        customer: {
          name: customerName || 'Walk-in Customer',
          phone: customerPhone || null,
        },
        items: cartItems.map(item => ({
          productId: item.product._id,
          productName: item.product.name,
          quantity: item.quantity,
          unitPrice: item.product.price,
          totalPrice: item.product.price * item.quantity,
          branch: item.availableBranches?.[0] || 'bashundhara', // Use first available branch
          selectedOptions: item.selectedOptions || {}
        })),
        totalAmount,
        payment: {
          methods: selectedPaymentMethods,
          totalPaid,
          change: totalPaid - totalAmount,
        },
      }

      console.log('Processing sale:', saleData)

// 🔥 ACTUAL API CALL TO PROCESS SALE AND DECREMENT STOCK
try {
  const response = await makeAuthenticatedRequest('/api/sales', {
    method: 'POST',
    body: JSON.stringify(saleData)
  })

  // 🔥 CHECK FOR TOKEN EXPIRATION
  if (response.status === 401) {
    // Token expired - makeAuthenticatedRequest already handled the redirect
    return
  }

  if (response.ok) {
    const result = await response.json()
    console.log('SALE Sale processed successfully:', result)
    
    // 🔥 CRITICAL: Refresh products to show updated stock
    await fetchProducts(true) // Pass true to bust cache and get fresh stock data
    
  } else {
    const errorData = await response.json().catch(() => ({}))
    throw new Error(errorData.error || `API Error: ${response.status}`)
  }
} catch (apiError) {
  console.error('SALE Error processing sale:', apiError)
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
        text: `Sale processed successfully. Total: $${totalAmount.toFixed(2)}`,
        timer: 2000,
        showConfirmButton: false
      })


    } catch (error) {
      console.error('Checkout error:', error)
      Swal.fire({
        icon: 'error',
        title: 'Checkout Failed',
        text: 'Something went wrong during checkout. Please try again.',
      })
    } finally {
      setLoading(false)
    }
  }

  // Calculate totals using cart hook
  const cartTotal = getCartTotal()
  const cartItemsCount = getCartItemsCount()


  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 to-blue-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-purple-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <h2 className="text-xl font-semibold text-gray-700">Loading VWV Admin Panel...</h2>
          <p className="text-gray-500 mt-2">Preparing your sales dashboard</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-blue-50">
      {/* Header */}
      <div className="bg-white shadow-lg border-b border-purple-100">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-gradient-to-br from-purple-600 to-indigo-600 rounded-xl flex items-center justify-center">
                <Store size={24} className="text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">VWV Admin Sales</h1>
                <p className="text-gray-600 text-sm">Point of Sale System</p>
              </div>
            </div>

            <div className="flex items-center gap-4">
              {/* Cart Button */}
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setShowCartModal(true)}
                className="relative bg-gradient-to-r from-purple-600 to-indigo-600 text-white px-6 py-3 rounded-xl font-semibold shadow-lg hover:shadow-xl transition-all flex items-center gap-2"
              >
                <ShoppingCart size={20} />
                <span>Cart</span>
                {cartItemsCount > 0 && (
                  <motion.span
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    className="absolute -top-2 -right-2 bg-red-500 text-white text-xs font-bold px-2 py-1 rounded-full min-w-[20px] text-center"
                  >
                    {cartItemsCount}
                  </motion.span>
                )}
              </motion.button>

              {/* Barcode Scanner */}
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setShowBarcodeScanner(true)}
                className="bg-green-600 text-white p-3 rounded-xl shadow-lg hover:bg-green-700 transition-colors"
                title="Scan Barcode"
              >
                <Scan size={20} />
              </motion.button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 py-6">
        {/* Filters */}
        <div className="bg-white rounded-2xl shadow-lg p-6 mb-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
              <Filter size={20} className="text-purple-600" />
              Product Filters
            </h2>
            <button
              onClick={() => {
                setSearchTerm('')
                setSelectedCategory('')
                setSelectedSubcategory('')
                setBarcodeFilter('')
                setInStockOnly(false)
              }}
              className="text-sm text-purple-600 hover:text-purple-700 font-medium"
            >
              Clear All
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-4">
            {/* Search */}
            <div className="lg:col-span-2">
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
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
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

                className="w-full p-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
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
                className="w-full p-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
              />
            </div>

            {/* Stock Filter */}
            <div className="flex items-end">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={inStockOnly}
                  onChange={(e) => setInStockOnly(e.target.checked)}
                  className="w-4 h-4 text-purple-600 bg-gray-100 border-gray-300 rounded focus:ring-purple-500"
                />
                <span className="text-sm font-medium text-gray-700">In Stock Only</span>
              </label>
            </div>
          </div>
        </div>

        {/* Products Grid */}
        <div className="bg-white rounded-2xl shadow-lg p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
              <Package size={20} className="text-purple-600" />
              Products ({products.length})
            </h2>

            {/* Pagination Controls */}
            {totalPages > 1 && (
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                  disabled={currentPage <= 1}
                  className="p-2 rounded-lg bg-gray-100 text-gray-600 hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <ChevronLeft size={16} />
                </button>
                <span className="px-3 py-1 bg-purple-100 text-purple-800 rounded-lg font-medium text-sm">
                  {currentPage} / {totalPages}
                </span>
                <button
                  onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                  disabled={currentPage >= totalPages}
                  className="p-2 rounded-lg bg-gray-100 text-gray-600 hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <ChevronRight size={16} />
                </button>
              </div>
            )}
          </div>

          {products.length === 0 ? (
            <div className="text-center py-12">
              <Package2 size={64} className="text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">No Products Found</h3>
              <p className="text-gray-500">Try adjusting your filters or search terms</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {products.map((product) => (
                <ProductCard
                  key={product._id}
                  product={product}
                  onAddToCart={handleAddToCart}
                  onShowDetails={handleShowProductDetails}
                  branches={branches}
                />
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Product Details Modal */}
      <ProductDetailsModal
        isOpen={showProductModal}
        product={selectedProduct}
        branches={branches}
        onClose={() => {
          setShowProductModal(false)
          setSelectedProduct(null)
        }}
        onAddToCart={handleAddToCart}
      />

     {/* Fixed Simple Purple Cart Modal - Blurred Background, No Borders */}
      <AnimatePresence>
        {showCartModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0  bg-opacity-20 backdrop-blur-sm z-50 flex items-center justify-center p-4"
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-xl max-w-5xl w-full max-h-[90vh] overflow-hidden shadow-xl"

            >
              {/* Simple Purple Header */}
              <div className="bg-purple-600 text-white px-6 py-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <ShoppingCart size={20} />
                  <div>
                    <h2 className="text-lg font-semibold">Shopping Cart</h2>
                    <p className="text-purple-100 text-sm">{cartItemsCount} items</p>
                  </div>
                </div>
                <div className="flex gap-2">
                  {cartItems.length > 0 && (
                    <button
                      onClick={handleClearCart}
                      className="text-white hover:text-red-500 p-2 rounded hover:bg-purple-700 transition-colors"
                    >
                      <Trash2 size={18} />
                    </button>
                  )}
                  <button
                    onClick={() => setShowCartModal(false)}
                    className="text-white hover:text-red-500 p-2 rounded hover:bg-purple-700 transition-colors"
                  >
                    <X size={20} />
                  </button>
                </div>
              </div>

              <div className="flex h-[calc(90vh-80px)]">

                {/* Cart Items */}
                <div className="flex-1 flex flex-col">
                  {cartItems.length === 0 ? (
                    <div className="flex-1 flex flex-col items-center justify-center p-12">
                      <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mb-4">
                        <ShoppingCart size={24} className="text-purple-400" />
                      </div>
                      <h3 className="text-lg font-medium text-gray-900 mb-2">Cart is Empty</h3>
                      <p className="text-gray-500 mb-6">Add products to start a sale</p>
                      <button
                        onClick={() => setShowCartModal(false)}
                        className="bg-purple-600 text-white px-6 py-2 rounded-lg hover:bg-purple-700 transition-colors"
                      >
                        Browse Products
                      </button>
                    </div>
                  ) : (
                    <>
                      {/* Items List */}
                      <div className="flex-1 overflow-y-auto p-6">
                        <div className="space-y-4">
                          {cartItems.map((item, index) => (
                            <div key={item.id} className="flex items-center gap-4 p-4 bg-gray-50 rounded-xl">
                              {/* Product Image */}
                              <div className="w-12 h-12 bg-gray-200 rounded-lg flex-shrink-0 overflow-hidden">
                                {item.product?.images?.[0] ? (
                                  <img
                                    src={item.product.images[0].url}
                                    alt={item.product.name}
                                    className="w-full h-full object-cover"
                                  />
                                ) : (
                                  <div className="w-full h-full flex items-center justify-center">
                                    <Package2 size={16} className="text-gray-400" />
                                  </div>
                                )}
                              </div>

                              {/* Product Info - FIXED CODE (COMPLETE) */}
                        <div className="flex-1 min-w-0">
                          <h4 className="font-medium text-gray-900 text-sm line-clamp-1">
                            {item.product?.name || 'Unknown Product'}
                          </h4>
                          <div className="flex items-center gap-2 mt-1">
                            <span className="text-xs bg-purple-100 text-purple-700 px-2 py-1 rounded-full">
                              {item.availableBranches?.[0] || 'N/A'}
                            </span>
                            
                            {/* ✅ SHOW ALL SPECIFICATIONS */}
                            {item.selectedOptions?.nicotineStrength && (
                              <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded-full">
                                {item.selectedOptions.nicotineStrength}
                              </span>
                            )}
                            
                            {/* ✅ ADD VG/PG RATIO */}
                            {item.selectedOptions?.vgPgRatio && (
                              <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded-full">
                                {item.selectedOptions.vgPgRatio}
                              </span>
                            )}
                            
                            {/* ✅ ADD COLOR */}
                            {item.selectedOptions?.color && (
                              <span className="text-xs bg-yellow-100 text-yellow-700 px-2 py-1 rounded-full">
                                {item.selectedOptions.color}
                              </span>
                            )}
                          </div>
                        </div>


                              {/* Quantity */}
                              <div className="flex items-center gap-2">
                                <button
                                  onClick={() => handleUpdateQuantity(item.id, (item.quantity || 1) - 1)}
                                  className="w-8 h-8 flex items-center justify-center rounded-full bg-gray-200 hover:bg-gray-300 transition-colors"
                                >
                                  <Minus size={14} />
                                </button>
                                <span className="w-8 text-center font-medium">
                                  {item.quantity || 1}
                                </span>
                                <button
                                  onClick={() => handleUpdateQuantity(item.id, (item.quantity || 1) + 1)}
                                  className="w-8 h-8 flex items-center justify-center rounded-full bg-purple-100 hover:bg-purple-200 text-purple-600 transition-colors"
                                >
                                  <Plus size={14} />
                                </button>
                              </div>

                              {/* Price */}
                              <div className="text-right">
                                <div className="font-semibold text-gray-900">
                                  ৳{((item.product?.price || 0) * (item.quantity || 1)).toFixed(2)}
                                </div>
                                <div className="text-xs text-gray-500">
                                  ৳{(item.product?.price || 0).toFixed(2)} each
                                </div>
                              </div>

                              {/* Remove */}
                              <button
                                onClick={() => handleRemoveFromCart(item.id)}
                                className="text-gray-400 hover:text-red-500 p-1 rounded transition-colors"
                              >
                                <Trash2 size={16} />
                              </button>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Total */}
                      <div className="p-6 bg-gray-50">
                        <div className="flex justify-between items-center">
                          <span className="text-gray-600">{cartItemsCount} items</span>
                          <div className="text-right">
                            <div className="text-2xl font-bold text-gray-900">
                              ৳{cartTotal.toFixed(2)}
                            </div>
                            <div className="text-sm text-gray-500">Total</div>
                          </div>
                        </div>
                      </div>
                    </>
                  )}
                </div>

                {/* Checkout Panel */}
                {cartItems.length > 0 && (
                  <div className="w-80 bg-gray-50 flex flex-col">
                    {/* Customer Info */}
                    <div className="p-6">
                      <h3 className="font-semibold text-gray-900 mb-4">Customer Info</h3>
                      <div className="space-y-4">
                        <input
                          type="text"
                          value={customerName}
                          onChange={(e) => setCustomerName(e.target.value)}
                          placeholder="Customer Name"
                          className="w-full px-4 py-3 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-purple-500 transition-all"
                        />
                        <input
                          type="tel"
                          value={customerPhone}
                          onChange={(e) => setCustomerPhone(e.target.value)}
                          placeholder="Phone (Optional)"
                          className="w-full px-4 py-3 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-purple-500 transition-all"
                        />
                      </div>
                    </div>

                    {/* Payment Methods */}
                    <div className="flex-1 p-6">
                      <h3 className="font-semibold text-gray-900 mb-4">Payment Method</h3>
                      <div className="grid grid-cols-2 gap-3 mb-4">
                        {PAYMENT_METHODS.map((method) => {
                          const IconComponent = method.icon
                          const isSelected = selectedPaymentMethods.some((m) => m.id === method.id)
                          
                          return (
                            <button
                              key={method.id}
                              onClick={() => {
                                const newMethod = { ...method, amount: cartTotal || 0 }
                                setSelectedPaymentMethods([newMethod])
                              }}
                              className={`p-4 rounded-xl text-center transition-all ${
                                isSelected
                                  ? 'bg-purple-600 text-white shadow-lg transform scale-105'
                                  : 'bg-white hover:bg-gray-100'
                              }`}
                            >
                              <IconComponent size={20} className={`mx-auto mb-2 ${isSelected ? 'text-white' : 'text-gray-400'}`} />
                              <div className={`text-sm font-medium ${isSelected ? 'text-white' : 'text-gray-700'}`}>
                                {method.name}
                              </div>
                            </button>
                          )
                        })}
                      </div>

                      {/* Payment Amount */}
                      {selectedPaymentMethods.length > 0 && (
                        <div className="mb-4">
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Amount
                          </label>
                          <input
                            type="number"
                            step="0.01"
                            value={selectedPaymentMethods[0]?.amount || ''}
                            onChange={(e) => {
                              const amount = parseFloat(e.target.value) || 0
                              setSelectedPaymentMethods([{...selectedPaymentMethods[0], amount}])
                            }}
                            placeholder={cartTotal.toFixed(2)}
                            className="w-full px-4 py-3 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-purple-500 transition-all"
                          />
                        </div>
                      )}
                    </div>

                    {/* Checkout Button */}
                    <div className="p-6">
                      <button
                        onClick={handleCheckout}
                        disabled={loading || selectedPaymentMethods.length === 0}
                        className={`w-full py-4 rounded-xl font-semibold flex items-center justify-center gap-2 transition-all ${
                          loading || selectedPaymentMethods.length === 0
                            ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                            : 'bg-purple-600 text-white hover:bg-purple-700 shadow-lg hover:shadow-xl transform hover:scale-105'
                        }`}
                      >
                        {loading ? (
                          <>
                            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                            Processing...
                          </>
                        ) : (
                          <>
                            <Receipt size={16} />
                            Complete Sale ৳{cartTotal.toFixed(2)}
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>





      {/* Barcode Scanner Modal */}
      <AnimatePresence>
        {showBarcodeScanner && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black bg-opacity-75 z-50 flex items-center justify-center p-4"
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white rounded-2xl max-w-md w-full p-6"
            >
              <div className="text-center mb-6">
                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Camera size={32} className="text-green-600" />
                </div>
                <h2 className="text-2xl font-bold text-gray-900 mb-2">Scan Barcode</h2>
                <p className="text-gray-600">Point your camera at a product barcode</p>
              </div>

              <div className="mb-6">
                <BarcodeReader
                  onError={(error) => console.error('Barcode scanner error:', error)}
                  onScan={handleBarcodeScan}
                />
              </div>

              <div className="flex gap-4">
                <button
                  onClick={() => setShowBarcodeScanner(false)}
                  className="flex-1 py-3 bg-gray-200 text-gray-700 rounded-xl hover:bg-gray-300 transition-colors font-semibold"
                >
                  Cancel
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Sale Completion Modal */}
      <AnimatePresence>
        {saleCompleted && completedSaleData && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4"
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white rounded-2xl max-w-lg w-full p-8 text-center"
            >
              <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <CheckCircle size={40} className="text-green-600" />
              </div>

              <h2 className="text-3xl font-bold text-gray-900 mb-4">Sale Complete!</h2>
              <p className="text-gray-600 mb-6">
                Transaction processed successfully
              </p>

              <div className="bg-gray-50 rounded-xl p-4 mb-6 text-left">
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-gray-500">Sale ID:</span>
                    <p className="font-semibold">{completedSaleData.saleId}</p>
                  </div>
                  <div>
                    <span className="text-gray-500">Total:</span>
                    <p className="font-semibold text-green-600">৳{completedSaleData.totalAmount?.toFixed(2)}</p>
                  </div>
                  <div>
                    <span className="text-gray-500">Customer:</span>
                    <p className="font-semibold">{completedSaleData.customer?.name || 'Walk-in'}</p>
                  </div>
                  <div>
                    <span className="text-gray-500">Items:</span>
                    <p className="font-semibold">{completedSaleData.items?.length || 0}</p>
                  </div>
                </div>
              </div>

              <div className="flex gap-4">
                <button
                  onClick={() => {
                    setSaleCompleted(false)
                    setCompletedSaleData(null)
                  }}
                  className="flex-1 py-3 bg-gray-200 text-gray-700 rounded-xl hover:bg-gray-300 transition-colors font-semibold"
                >
                  Close
                </button>
                <button
                  onClick={() => {
                    generateInvoice(completedSaleData)
                    setSaleCompleted(false)
                    setCompletedSaleData(null)
                  }}
                  className="flex-1 py-3 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-xl hover:from-green-700 hover:to-emerald-700 transition-colors font-semibold flex items-center justify-center gap-2"
                >
                  <Download size={16} />
                  Download Receipt
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
