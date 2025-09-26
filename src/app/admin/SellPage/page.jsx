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
} from 'lucide-react'

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

// 🔥 FIX: Get auth headers with cache-busting
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

// 🔥 FIX: Helper function to get auth token
const getAuthToken = () => {
  if (typeof window !== 'undefined') {
    return localStorage.getItem('authToken') || sessionStorage.getItem('authToken') || 'Bearer temp-admin-token-for-development'
  }
  return 'Bearer temp-admin-token-for-development'
}

// 🔥 FIX: Helper function to make authenticated API requests
const makeAuthenticatedRequest = async (url, options = {}, bustCache = false) => {
  const token = getAuthToken()
  
  const headers = {
    'Content-Type': 'application/json',
    ...options.headers,
  }
  
  if (token) {
    headers.Authorization = token
  }

  if (bustCache) {
    headers['Cache-Control'] = 'no-cache, no-store, must-revalidate'
    headers['Pragma'] = 'no-cache'
    headers['Expires'] = '0'
    
    const separator = url.includes('?') ? '&' : '?'
    url = `${url}${separator}_t=${Date.now()}`
  }
  
  return fetch(url, {
    ...options,
    headers,
  })
}

// 🔥 ENHANCED: Product Details Modal Component with Branch Selection
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

  // 🔥 ENHANCED: Get branches from stock data (same logic as product details page)
  const getBranches = () => {
    if (!product?.stock) {
      return branches || [] // fallback to passed branches
    }
    
    const stockKeys = Object.keys(product.stock)
    const stockKeysFiltered = stockKeys.filter(key => key.endsWith('_stock'))
    const productBranches = stockKeysFiltered.map(key => key.replace('_stock', ''))
    
    return productBranches.length > 0 ? productBranches : (branches || [])
  }

  const productBranches = getBranches()

  // 🔥 ENHANCED: Get branch stock status (same logic as product details page)
  const getBranchStockStatus = (branchName) => {
    const stockKey = `${branchName}_stock`
    const stockValue = product?.stock?.[stockKey] || 0
    return stockValue > 0
  }

  // 🔥 ENHANCED: Check if product has branch specifications
  const hasBranchSpecifications = () => {
    return product?.branchSpecifications && Object.keys(product.branchSpecifications).length > 0
  }

  // 🔥 ENHANCED: Check if product has any specifications
  const hasAnySpecifications = () => {
    const nicotineOptions = getUniqueSpecificationValues('nicotineStrength')
    const vgPgOptions = getUniqueSpecificationValues('vgPgRatio')
    const colorOptions = getUniqueSpecificationValues('colors')
    
    return nicotineOptions.length > 0 || vgPgOptions.length > 0 || colorOptions.length > 0
  }

  // 🔥 ENHANCED: Case-insensitive specification values extraction
  const getUniqueSpecificationValues = (specType) => {
    if (!product?.branchSpecifications) return []
    
    const allValues = new Set()
    
    // Check all possible case variations of branch names
    Object.keys(product.branchSpecifications).forEach(branchName => {
      const branchSpec = product.branchSpecifications[branchName]
      if (branchSpec[specType]) {
        branchSpec[specType].forEach(value => allValues.add(value))
      }
    })
    
    return Array.from(allValues)
  }

  // 🔥 ENHANCED: Check if specification should show as text (same logic)
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

  // 🔥 ENHANCED: Get single specification value (same logic)
  const getSingleSpecificationValue = (specType) => {
    if (!product?.branchSpecifications) return ''
    const firstBranch = Object.values(product.branchSpecifications)[0]
    return firstBranch?.[specType]?.[0] || ''
  }

  // 🔥 ENHANCED: Check if any selections are made
  const hasAnySelections = () => {
    return selectedNicotineStrength || selectedVgPgRatio || selectedColor
  }

  // 🔥 ENHANCED: Branch has specification check with case sensitivity
  const branchHasSpecification = (branchName, specType, specValue) => {
    // Try different case variations to find branch specifications
    const branchSpec = product?.branchSpecifications?.[branchName] ||
                      product?.branchSpecifications?.[branchName.toLowerCase()] ||
                      product?.branchSpecifications?.[branchName.toUpperCase()] ||
                      product?.branchSpecifications?.[branchName.charAt(0).toUpperCase() + branchName.slice(1)]

    if (!branchSpec?.[specType]) {
      // If branch doesn't have this spec type defined, it supports all values
      return true
    }
    return branchSpec[specType].includes(specValue)
  }

  // 🔥 ENHANCED: Get available branches for current selection (same logic as product details)
  const getAvailableBranchesForSelection = () => {
    if (!product?.branchSpecifications) {
      const result = productBranches.filter(branch => getBranchStockStatus(branch))
      return result
    }
    
    const result = productBranches.filter(branch => {
      // First check if branch has stock
      const hasStock = getBranchStockStatus(branch)
      if (!hasStock) {
        return false
      }

      // If no selections are made, return all branches with stock
      if (!hasAnySelections()) {
        return true
      }

      // Case-insensitive branch specification lookup
      const branchSpec = product.branchSpecifications[branch] || 
                         product.branchSpecifications[branch.toLowerCase()] ||
                         product.branchSpecifications[branch.toUpperCase()] ||
                         product.branchSpecifications[branch.charAt(0).toUpperCase() + branch.slice(1)]

      // Check nicotine
      if (selectedNicotineStrength) {
        const branchNicotineSpecs = branchSpec?.nicotineStrength
        if (branchNicotineSpecs && !branchNicotineSpecs.includes(selectedNicotineStrength)) {
          return false
        }
      }
      
      // Check VG/PG
      if (selectedVgPgRatio) {
        const branchVgPgSpecs = branchSpec?.vgPgRatio
        if (branchVgPgSpecs && !branchVgPgSpecs.includes(selectedVgPgRatio)) {
          return false
        }
      }
      
      // Check color
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

  // 🔥 NEW: Check if branch selection is required
  const requiresBranchSelection = () => {
    const availableBranches = getAvailableBranchesForSelection()
    return availableBranches.length > 1 // Multiple branches available, admin must choose
  }

  // 🔥 ENHANCED: Check if user must select specifications
  const mustSelectSpecifications = () => {
    if (!hasBranchSpecifications() || !hasAnySpecifications()) return false
    
    const nicotineOptions = getUniqueSpecificationValues('nicotineStrength')
    const vgPgOptions = getUniqueSpecificationValues('vgPgRatio')
    const colorOptions = getUniqueSpecificationValues('colors')

    // If any specification has multiple options, user must select
    const needsNicotineSelection = nicotineOptions.length > 1 && !shouldShowAsText('nicotineStrength')
    const needsVgPgSelection = vgPgOptions.length > 1 && !shouldShowAsText('vgPgRatio')
    const needsColorSelection = colorOptions.length > 1 && !shouldShowAsText('colors')

    return needsNicotineSelection || needsVgPgSelection || needsColorSelection
  }

  // 🔥 ENHANCED: Validate required selections
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

  // 🔥 ENHANCED: Check if all required selections are made (including branch selection)
  const areAllRequiredSelectionsMade = () => {
    // Check if specification selections are required and made
    if (mustSelectSpecifications()) {
      const missingSelections = validateSelections()
      if (missingSelections.length > 0) {
        return false
      }
    }
    
    // Check if branch selection is required and made
    if (requiresBranchSelection() && !selectedBranch) {
      return false
    }
    
    return true
  }

  // 🔥 ENHANCED: Check if add to cart is enabled
  const isAddToCartEnabled = () => {
    // Check if there's stock available
    const hasStock = productBranches.length > 0 ? productBranches.some(branch => getBranchStockStatus(branch)) : product?.stock?.available
    
    // Check if all required selections are made
    const allSelectionsMade = areAllRequiredSelectionsMade()
    
    // Check if there are available branches for current selection
    const hasAvailableBranches = getAvailableBranchesForSelection().length > 0
    
    return hasStock && allSelectionsMade && hasAvailableBranches
  }

  // 🔥 ENHANCED: Get button text
  const getButtonText = () => {
    const hasStock = productBranches.length > 0 ? productBranches.some(branch => getBranchStockStatus(branch)) : product?.stock?.available
    
    if (!hasStock) {
      return 'Out of Stock'
    }
    
    return 'Add to Cart'
  }

  // 🔥 ENHANCED: Get tooltip message for disabled button (including branch selection)
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

    // 🔥 ENHANCED: Use selected branch or first available branch
    const availableBranches = getAvailableBranchesForSelection()
    const branchToUse = selectedBranch || availableBranches[0] || productBranches[0]

    console.log('🔥 ADMIN SELECTED BRANCH:', branchToUse)
    console.log('🔥 Available branches:', availableBranches)
    console.log('🔥 Selected specifications:', selectedOptions)

    // Call the parent's add to cart function with specifications and SELECTED branch
    onAddToCart(product, branchToUse, selectedOptions, [branchToUse]) // Only the selected branch

    onClose()
  }

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
            className="bg-white rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col shadow-2xl"
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
                {/* Left Column - Product Info */}
                <div className="space-y-6">
                  {/* Basic Info */}
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
                        <p className="text-2xl font-bold text-purple-600">{product.price?.toFixed(2) || '0.00'} ৳</p>
                      </div>

                      {product.comparePrice && (
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Compare Price</label>
                          <p className="text-lg text-gray-500 line-through">{product.comparePrice.toFixed(2)} ৳</p>
                        </div>
                      )}

                      {product.barcode && (
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Barcode</label>
                          <p className="font-mono text-gray-900">{product.barcode}</p>
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

                  {/* General Specifications */}
                  {(product.flavor || product.resistance || product.wattageRange) && (
                    <div className="bg-blue-50 rounded-xl p-6">
                      <h4 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                        <Zap size={20} className="text-blue-600" />
                        General Specifications
                      </h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {product.flavor && (
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Flavor</label>
                            <p className="font-semibold text-gray-900">{product.flavor}</p>
                          </div>
                        )}
                        {product.resistance && (
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Resistance</label>
                            <p className="font-semibold text-gray-900">{product.resistance}</p>
                          </div>
                        )}
                        {product.wattageRange && (
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Wattage Range</label>
                            <p className="font-semibold text-gray-900">{product.wattageRange}</p>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>

                {/* Right Column - Specifications & Selection */}
                <div className="space-y-6">
                  {/* 🔥 ENHANCED: Branch Specifications with Required Warning */}
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

                  {/* 🔥 ENHANCED: Branch Selection with Admin Choice */}
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
          ${product.price?.toFixed(2) || '0.00'}
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

// 🔥 UPDATED: Enhanced Sortable Cart Item with specifications support
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
              {item.branch?.charAt(0).toUpperCase() + item.branch?.slice(1) || 'N/A'}
            </span>
            <span className="text-sm font-medium text-purple-600">
              ${item.product?.price?.toFixed(2) || '0.00'}
            </span>
          </div>
          
          {/* Show specifications if available */}
          {item.specifications && (
            <div className="flex flex-wrap gap-1 mt-2">
              {item.specifications.nicotineStrength && (
                <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded">
                  {item.specifications.nicotineStrength}
                </span>
              )}
              {item.specifications.vgPgRatio && (
                <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded">
                  {item.specifications.vgPgRatio}
                </span>
              )}
              {item.specifications.color && (
                <span className="text-xs bg-yellow-100 text-yellow-700 px-2 py-0.5 rounded">
                  {item.specifications.color}
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

// Keep the existing generateInvoice function exactly as is
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
                <td style="padding: 6px; text-align: right; font-weight: 500; color: rgb(55, 65, 81);">$${(item.unitPrice || 0).toFixed(2)}</td>
                <td style="padding: 6px; text-align: right; font-weight: 700; color: rgb(5, 150, 105);">$${(item.totalPrice || 0).toFixed(2)}</td>
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
                <span style="font-size: 11px; font-weight: 700; color: rgb(5, 150, 105);">$${(method.amount || saleData.totalAmount || 0).toFixed(2)}</span>
              </div>
            `
              )
              .join('')}
          </div>
          
          <div style="flex: 1; background: rgb(254, 254, 254); padding: 12px; border-radius: 8px; border: 1px solid rgb(139, 92, 246);">
            <h4 style="margin: 0 0 8px 0; color: rgb(139, 92, 246); font-size: 12px; font-weight: bold;">TOTAL SUMMARY</h4>
            <div style="display: flex; justify-content: space-between; margin-bottom: 4px; font-size: 11px;">
              <span style="color: rgb(55, 65, 81);">Subtotal:</span>
              <span style="font-weight: 600;">$${(saleData.totalAmount || 0).toFixed(2)}</span>
            </div>
            <div style="border-top: 1px solid rgb(226, 232, 240); padding-top: 6px;">
              <div style="display: flex; justify-content: space-between; align-items: center; background: rgb(139, 92, 246); color: white; padding: 8px; border-radius: 4px;">
                <span style="font-size: 12px; font-weight: bold;">TOTAL:</span>
                <span style="font-size: 14px; font-weight: bold;">$${(saleData.payment?.totalPaid || saleData.totalAmount || 0).toFixed(2)}</span>
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

// Keep the existing PaymentMethodSelector component exactly as is
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

// 🔥 MAIN COMPONENT: Enhanced Sales Page with Product Details Modal
export default function SellPageAdmin() {
  // All existing states
  const [products, setProducts] = useState([])
  const [categories, setCategories] = useState({})
  const [branches, setBranches] = useState([])
  const [cart, setCart] = useState([])
  const [loading, setLoading] = useState(true)
  const [showBarcodeScanner, setShowBarcodeScanner] = useState(false)
  const [showCartModal, setShowCartModal] = useState(false)
  const [saleCompleted, setSaleCompleted] = useState(false)
  const [completedSaleData, setCompletedSaleData] = useState(null)

  // Filter states
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('')
  const [selectedSubcategory, setSelectedSubcategory] = useState('')
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

  // 🔥 NEW: Product details modal state
  const [showProductModal, setShowProductModal] = useState(false)
  const [selectedProduct, setSelectedProduct] = useState(null)

  // dnd-kit sensors
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  )

  // Load initial data
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

  // Fetch products with cache-busting and proper refresh
  const fetchProducts = async (bustCache = false) => {
    try {
      const params = new URLSearchParams({
        limit: itemsPerPage.toString(),
        page: currentPage.toString(),
        status: 'active',
      })

      if (searchTerm.trim()) params.append('search', searchTerm.trim())
      if (selectedCategory) params.append('category', selectedCategory)
      if (selectedSubcategory) params.append('subcategory', selectedSubcategory)
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
  }, [searchTerm, selectedCategory, selectedSubcategory, barcodeFilter, inStockOnly])

  useEffect(() => {
    if (!loading) {
      fetchProducts()
    }
  }, [currentPage, searchTerm, selectedCategory, selectedSubcategory, barcodeFilter, inStockOnly])

  // 🔥 NEW: Handle showing product details
  const handleShowProductDetails = (product) => {
    setSelectedProduct(product)
    setShowProductModal(true)
  }

  // Enhanced barcode scanning with better error handling
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

  // 🔥 UPDATED: Enhanced handleAddToCart with specifications support
  const handleAddToCart = (product, branch, specifications = null) => {
    try {
      if (!product || !product._id) {
        throw new Error('Invalid product data')
      }

      if (!branch) {
        throw new Error('Branch is required')
      }

      const normalizedBranch = branch.toLowerCase()
      const stock = product.stock?.[`${normalizedBranch}_stock`] ?? 0

      console.log('[CART] Adding to cart:', {
        productName: product.name,
        originalBranch: branch,
        normalizedBranch,
        stockKey: `${normalizedBranch}_stock`,
        stock,
        stockData: product.stock,
        specifications
      })

      if (stock <= 0) {
        Swal.fire({
          icon: 'error',
          title: 'Out of Stock',
          text: 'This product is out of stock in the selected branch',
        })
        return
      }

      // If specifications are provided, validate them
      if (specifications && product.branchSpecifications) {
        const branchSpec = product.branchSpecifications[normalizedBranch]
        if (!branchSpec) {
          Swal.fire({
            icon: 'error',
            title: 'Branch Not Available',
            text: 'This product is not available for the selected branch',
          })
          return
        }

        // Validate each specification
        const { nicotineStrength, vgPgRatio, color } = specifications
        if (nicotineStrength && !branchSpec.nicotineStrength?.includes(nicotineStrength)) {
          Swal.fire({
            icon: 'error',
            title: 'Specification Not Available',
            text: 'Selected nicotine strength is not available for this branch',
          })
          return
        }

        if (vgPgRatio && !branchSpec.vgPgRatio?.includes(vgPgRatio)) {
          Swal.fire({
            icon: 'error',
            title: 'Specification Not Available',
            text: 'Selected VG/PG ratio is not available for this branch',
          })
          return
        }

        if (color && !branchSpec.colors?.includes(color)) {
          Swal.fire({
            icon: 'error',
            title: 'Specification Not Available',
            text: 'Selected color is not available for this branch',
          })
          return
        }
      }

      const existingItem = cart.find(
        (item) => item.product._id === product._id && 
                  item.branch === normalizedBranch &&
                  JSON.stringify(item.specifications || {}) === JSON.stringify(specifications || {})
      )

      if (existingItem) {
        if (existingItem.quantity >= stock) {
          Swal.fire({
            icon: 'warning',
            title: 'Stock Limit Reached',
            text: 'Cannot add more items than available stock',
          })
          return
        }
        handleUpdateQuantity(existingItem.id, existingItem.quantity + 1)
      } else {
        const newItem = {
          id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          product,
          branch: normalizedBranch,
          quantity: 1,
          specifications: specifications || null
        }
        setCart((prev) => [...prev, newItem])

        const specText = specifications ? 
          ` (${specifications.nicotineStrength}, ${specifications.vgPgRatio}, ${specifications.color})` : ''
        
        Swal.fire({
          icon: 'success',
          title: 'Added to Cart!',
          text: `${product.name}${specText} added to cart`,
          timer: 1500,
          showConfirmButton: false,
          toast: true,
          position: 'top-end',
        })
      }
    } catch (error) {
      console.error('[CART] Error adding to cart:', error)
      Swal.fire({
        icon: 'error',
        title: 'Add to Cart Failed',
        text: error.message || 'Could not add item to cart',
      })
    }
  }

  const handleUpdateQuantity = (itemId, newQuantity) => {
    if (newQuantity <= 0) {
      handleRemoveFromCart(itemId)
      return
    }

    setCart((prev) =>
      prev.map((item) => {
        if (item.id === itemId) {
          const normalizedBranch = item.branch.toLowerCase()
          const stock = item.product?.stock?.[`${normalizedBranch}_stock`] ?? 0
          
          if (newQuantity > stock) {
            Swal.fire({
              icon: 'warning',
              title: 'Stock Limit',
              text: `Only ${stock} items available in stock`,
            })
            return item
          }
          return { ...item, quantity: newQuantity }
        }
        return item
      })
    )
  }

  const handleRemoveFromCart = (itemId) => {
    setCart((prev) => prev.filter((item) => item.id !== itemId))
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
        setCart([])
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

  // Handle drag end for cart reordering
  const handleDragEnd = (event) => {
    const { active, over } = event

    if (active.id !== over?.id) {
      setCart((items) => {
        const oldIndex = items.findIndex((item) => item.id === active.id)
        const newIndex = items.findIndex((item) => item.id === over.id)

        return arrayMove(items, oldIndex, newIndex)
      })
    }
  }

  // Calculate totals
  const cartTotal = cart.reduce(
    (sum, item) => sum + ((item.product?.price ?? 0) * (item.quantity ?? 1)),
    0
  )
  const cartItemsCount = cart.reduce((sum, item) => sum + (item.quantity ?? 1), 0)

  // Complete sales processing with proper error handling and authentication
  const handleProcessSale = async () => {
    try {
      // Validation
      if (cart.length === 0) {
        Swal.fire({
          icon: 'warning',
          title: 'Empty Cart',
          text: 'Please add items to cart before processing sale',
        })
        return
      }

      if (selectedPaymentMethods.length === 0) {
        Swal.fire({
          icon: 'warning',
          title: 'Select Payment Method',
          text: 'Please select a payment method to continue',
        })
        return
      }

      const paymentMethod = selectedPaymentMethods[0]
      const totalPaid = paymentMethod.amount || 0

      if (totalPaid < cartTotal) {
        Swal.fire({
          icon: 'error',
          title: 'Insufficient Payment',
          text: `Please ensure payment covers the full amount of $${cartTotal.toFixed(2)}`,
        })
        return
      }

      // Show loading
      Swal.fire({
        title: 'Processing Sale...',
        text: 'Please wait while we process your payment',
        allowOutsideClick: false,
        allowEscapeKey: false,
        showConfirmButton: false,
        didOpen: () => {
          Swal.showLoading()
        },
      })

      // Prepare sale data with properly normalized branch names
      const saleData = {
        customer: {
          name: customerName.trim() || 'Walk-in Customer',
          phone: customerPhone.trim() || '',
        },
        items: cart.map((item) => ({
          productId: item.product._id,
          productName: item.product.name || 'Unknown Product',
          branch: item.branch.toLowerCase(),
          quantity: item.quantity || 1,
          unitPrice: item.product.price || 0,
          totalPrice: (item.product.price || 0) * (item.quantity || 1),
          specifications: item.specifications || null
        })),
        payment: {
          methods: selectedPaymentMethods.map(method => ({
            id: method.id,
            name: method.name,
            type: method.type,
            amount: method.amount || 0,
          })),
          totalAmount: cartTotal,
          totalPaid: totalPaid,
          change: Math.max(0, totalPaid - cartTotal),
        },
        totalAmount: cartTotal,
        timestamp: new Date(),
        cashier: 'Admin',
        paymentType: paymentMethod.type || 'cash',
        status: 'completed',
      }

      console.log('[SALE] Processing sale data:', saleData)

      // Process sale through API
      const response = await makeAuthenticatedRequest('/api/sales', {
        method: 'POST',
        body: JSON.stringify(saleData),
      })

      if (response.ok) {
        const result = await response.json()
        console.log('[SALE] Sale processed successfully:', result)
        
        Swal.close()

        // Complete sale
        const completedSale = {
          ...saleData,
          saleId: result.saleId || `SALE-${Date.now()}`,
        }

        setCompletedSaleData(completedSale)
        setSaleCompleted(true)

        // Clear form
        setCart([])
        setSelectedPaymentMethods([])
        setCustomerName('')
        setCustomerPhone('')

        // Force immediate refresh with cache busting to get updated stock
        console.log('🔄 Sale completed, forcing immediate stock refresh...')
        await fetchProducts(true)
        console.log('✅ Stock data refreshed after sale')

      } else {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.error || `API Error: ${response.status}`)
      }

    } catch (error) {
      console.error('[SALE] Error processing sale:', error)
      Swal.fire({
        icon: 'error',
        title: 'Payment Failed',
        text: error.message || 'There was an error processing the payment. Please try again.',
      })
    }
  }

  const handlePrintInvoice = async () => {
    if (completedSaleData) {
      await generateInvoice(completedSaleData)
    }
  }

  const handleNewSale = () => {
    setSaleCompleted(false)
    setCompletedSaleData(null)
    setShowCartModal(false)
  }

  const subcategoryOptions =
    selectedCategory && categories[selectedCategory]
      ? categories[selectedCategory]
      : []

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-blue-50 to-indigo-100 p-4">
      <div className="max-w-7xl mx-auto">
        {/* Header with Cart Icon */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
          <div>
            <h1 className="text-4xl font-bold text-gray-900 mb-2">
              💰 Admin Sales Point
            </h1>
            <p className="text-gray-600">
              Process sales and manage transactions
            </p>
          </div>

          {/* Enhanced Cart Button */}
          <motion.button
            whileHover={{ scale: 1.02, y: -2 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => setShowCartModal(true)}
            className="relative bg-gradient-to-r from-purple-600 via-purple-700 to-indigo-600 text-white rounded-2xl shadow-xl p-6 flex items-center gap-4 hover:shadow-2xl transition-all min-w-[200px]"
          >
            <div className="relative">
              <ShoppingCart size={32} />
              {cartItemsCount > 0 && (
                <motion.span
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  className="absolute -top-2 -right-2 bg-red-500 text-white text-sm rounded-full w-7 h-7 flex items-center justify-center font-bold shadow-lg"
                >
                  {cartItemsCount}
                </motion.span>
              )}
            </div>
            <div className="text-left">
              <p className="text-sm opacity-90 font-medium">Shopping Cart</p>
              <p className="text-2xl font-bold">${cartTotal.toFixed(2)}</p>
            </div>
          </motion.button>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
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

            <div className="relative">
              <Hash
                size={20}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
              />
              <input
                type="text"
                placeholder="Filter by barcode..."
                value={barcodeFilter}
                onChange={(e) => setBarcodeFilter(e.target.value)}
                className="w-full pl-10 pr-12 py-3 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-purple-500"
              />
              <button
                onClick={() => setShowBarcodeScanner(true)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-purple-600 hover:text-purple-700"
                title="Scan Barcode"
              >
                <Camera size={20} />
              </button>
            </div>

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

            <select
              value={selectedSubcategory}
              onChange={(e) => setSelectedSubcategory(e.target.value)}
              disabled={!selectedCategory}
              className="w-full p-3 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-purple-500 disabled:opacity-50"
            >
              <option value="">All Subcategories</option>
              {subcategoryOptions.map((subcategory) => (
                <option key={subcategory} value={subcategory}>
                  {subcategory}
                </option>
              ))}
            </select>
          </div>

          <div className="flex justify-between items-center">
            <div className="flex items-center gap-4">
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={inStockOnly}
                  onChange={(e) => setInStockOnly(e.target.checked)}
                  className="rounded text-purple-600"
                />
                <span className="text-sm text-gray-700">In Stock Only</span>
              </label>
            </div>

            <button
              onClick={() => {
                setSearchTerm('')
                setBarcodeFilter('')
                setSelectedCategory('')
                setSelectedSubcategory('')
                setInStockOnly(false)
                setCurrentPage(1)
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
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
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

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex justify-center items-center mt-8 gap-2">
                <button
                  onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
                  disabled={currentPage === 1}
                  className="px-4 py-2 bg-white border border-gray-300 rounded-lg disabled:opacity-50 hover:bg-gray-50 transition-colors"
                >
                  Previous
                </button>

                <span className="px-4 py-2 bg-white rounded-lg border">
                  Page {currentPage} of {totalPages}
                </span>

                <button
                  onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages))}
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
                  Try adjusting your filters or check your inventory.
                </p>
              </div>
            )}
          </>
        )}
      </div>

      {/* 🔥 NEW: Product Details Modal */}
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
                  onError={(err) => console.error('Barcode scan error:', err)}
                  onScan={handleBarcodeScan}
                  style={{ width: '100%' }}
                />
                <p className="text-gray-600 text-center mt-2">
                  Position barcode in the camera view
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

      {/* Enhanced Cart Modal */}
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
              className="bg-white rounded-2xl max-w-6xl w-full max-h-[90vh] overflow-hidden flex flex-col shadow-2xl"
            >
              {/* Modal Header */}
              <div className="flex justify-between items-center p-8 border-b border-gray-200 bg-gradient-to-r from-purple-50 to-blue-50">
                <h3 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
                  <ShoppingCart size={32} className="text-purple-600" />
                  {saleCompleted ? '✅ Sale Completed' : '🛒 Shopping Cart'}
                </h3>
                <button
                  onClick={() => setShowCartModal(false)}
                  className="text-gray-400 hover:text-gray-600 p-3 rounded-xl hover:bg-gray-100 transition-colors"
                >
                  <X size={28} />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto">
                {saleCompleted ? (
                  /* Sale Completed View */
                  <div className="p-8">
                    <div className="text-center mb-8">
                      <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        className="w-24 h-24 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6"
                      >
                        <CheckCircle size={48} className="text-green-600" />
                      </motion.div>
                      <h2 className="text-4xl font-bold text-gray-900 mb-4">
                        Payment Successful!
                      </h2>
                      <p className="text-xl text-gray-600">
                        Transaction completed successfully
                      </p>
                    </div>

                    {completedSaleData && (
                      <div className="max-w-3xl mx-auto">
                        <div className="bg-gradient-to-r from-purple-50 to-blue-50 rounded-2xl p-8 mb-8 border border-purple-200">
                          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
                            <div>
                              <p className="text-sm font-medium text-gray-600 mb-1">
                                Sale ID
                              </p>
                              <p className="text-lg font-bold text-purple-600">
                                {completedSaleData.saleId}
                              </p>
                            </div>
                            <div>
                              <p className="text-sm font-medium text-gray-600 mb-1">
                                Customer
                              </p>
                              <p className="text-lg font-bold text-gray-900">
                                {completedSaleData.customer?.name || 'Walk-in Customer'}
                              </p>
                            </div>
                            <div>
                              <p className="text-sm font-medium text-gray-600 mb-1">
                                Total Amount
                              </p>
                              <p className="text-lg font-bold text-green-600">
                                ${(completedSaleData.totalAmount || 0).toFixed(2)}
                              </p>
                            </div>
                            <div>
                              <p className="text-sm font-medium text-gray-600 mb-1">
                                Items
                              </p>
                              <p className="text-lg font-bold text-gray-900">
                                {(completedSaleData.items || []).length} items
                              </p>
                            </div>
                          </div>
                        </div>

                        <div className="flex gap-6">
                          <motion.button
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                            onClick={handlePrintInvoice}
                            className="flex-1 py-4 bg-purple-600 text-white rounded-xl hover:bg-purple-700 font-bold text-lg flex items-center justify-center gap-3 shadow-lg"
                          >
                            <Printer size={24} />
                            Download Invoice PDF
                          </motion.button>
                          <motion.button
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                            onClick={handleNewSale}
                            className="flex-1 py-4 bg-green-600 text-white rounded-xl hover:bg-green-700 font-bold text-lg flex items-center justify-center gap-3 shadow-lg"
                          >
                            <Plus size={24} />
                            Start New Sale
                          </motion.button>
                        </div>
                      </div>
                    )}
                  </div>
                ) : cart.length === 0 ? (
                  /* Empty Cart */
                  <div className="flex flex-col items-center justify-center py-20">
                    <div className="w-32 h-32 bg-gradient-to-br from-purple-100 to-blue-100 rounded-full flex items-center justify-center mb-6">
                      <ShoppingCart size={48} className="text-purple-400" />
                    </div>
                    <h3 className="text-2xl font-bold text-gray-900 mb-4">
                      Your cart is empty
                    </h3>
                    <p className="text-gray-600 text-lg">
                      Add some products to get started with your sale
                    </p>
                  </div>
                ) : (
                  /* Cart Content */
                  <div className="grid grid-cols-1 lg:grid-cols-5 gap-8 p-8">
                    {/* Cart Items */}
                    <div className="lg:col-span-3">
                      <h4 className="text-2xl font-bold text-gray-900 mb-6 flex items-center justify-between">
                        <span>Items in Cart ({cartItemsCount})</span>
                        <button
                          onClick={handleClearCart}
                          className="text-red-500 hover:text-red-700 text-base font-medium px-4 py-2 rounded-lg hover:bg-red-50 transition-colors"
                        >
                          Clear All
                        </button>
                      </h4>

                      <DndContext
                        sensors={sensors}
                        collisionDetection={closestCenter}
                        onDragEnd={handleDragEnd}
                      >
                        <SortableContext
                          items={cart.map((item) => item.id)}
                          strategy={verticalListSortingStrategy}
                        >
                          <div className="max-h-96 overflow-y-auto space-y-3">
                            {cart.map((item) => (
                              <SortableCartItem
                                key={item.id}
                                item={item}
                                onUpdateQuantity={handleUpdateQuantity}
                                onRemove={handleRemoveFromCart}
                              />
                            ))}
                          </div>
                        </SortableContext>
                      </DndContext>
                    </div>

                    {/* Order Summary & Payment */}
                    <div className="lg:col-span-2 space-y-8">
                      {/* Customer Info */}
                      <div className="bg-gradient-to-br from-purple-50 to-blue-50 rounded-2xl p-6 border border-purple-200">
                        <h4 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                          <User size={20} className="text-purple-600" />
                          Customer Information
                        </h4>
                        <div className="space-y-4">
                          <input
                            type="text"
                            placeholder="Customer Name (Optional)"
                            value={customerName}
                            onChange={(e) => setCustomerName(e.target.value)}
                            className="w-full p-4 rounded-xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-purple-500 bg-white"
                          />
                          <input
                            type="tel"
                            placeholder="Customer Phone (Optional)"
                            value={customerPhone}
                            onChange={(e) => setCustomerPhone(e.target.value)}
                            className="w-full p-4 rounded-xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-purple-500 bg-white"
                          />
                        </div>
                      </div>

                      {/* Order Summary */}
                      <div className="bg-white rounded-2xl p-6 border-2 border-gray-200 shadow-lg">
                        <h4 className="text-xl font-bold text-gray-900 mb-4">
                          Order Summary
                        </h4>
                        <div className="space-y-4 text-lg">
                          <div className="flex justify-between items-center">
                            <span className="text-gray-600">
                              Subtotal ({cartItemsCount} items):
                            </span>
                            <span className="font-semibold">
                              ${cartTotal.toFixed(2)}
                            </span>
                          </div>
                          <div className="border-t-2 pt-4 flex justify-between items-center text-2xl font-bold">
                            <span>Total:</span>
                            <span className="text-purple-600">
                              ${cartTotal.toFixed(2)}
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Payment Methods */}
                      <PaymentMethodSelector
                        selectedMethods={selectedPaymentMethods}
                        onMethodChange={setSelectedPaymentMethods}
                        totalAmount={cartTotal}
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* Modal Footer */}
              {!saleCompleted && cart.length > 0 && (
                <div className="p-8 border-t border-gray-200 bg-gradient-to-r from-gray-50 to-purple-50">
                  <div className="flex gap-6">
                    <button
                      onClick={() => setShowCartModal(false)}
                      className="flex-1 py-4 bg-gray-200 text-gray-700 rounded-xl hover:bg-gray-300 transition-colors font-bold text-lg"
                    >
                      Continue Shopping
                    </button>
                    <button
                      onClick={handleProcessSale}
                      disabled={selectedPaymentMethods.length === 0}
                      className="flex-2 py-4 px-8 bg-gradient-to-r from-green-500 via-green-600 to-emerald-600 text-white rounded-xl font-bold text-lg hover:from-green-600 hover:to-emerald-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-3 shadow-lg"
                    >
                      <CheckCircle size={24} />
                      Complete Sale
                    </button>
                  </div>
                </div>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
