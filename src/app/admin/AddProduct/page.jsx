'use client'

import { useState, useEffect, useRef } from 'react'
import { useForm, Controller } from 'react-hook-form'
import { motion, AnimatePresence } from 'framer-motion'
import Swal from 'sweetalert2'
import Select from 'react-select'
import CreatableSelect from 'react-select/creatable'
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
  Settings,
  Palette,
  ToggleLeft,
  ToggleRight,
  List,
  Minus,
  PillBottle, // 🔧 FIXED: Changed Bottle to PillBottle
  Battery,
  Clock,
} from 'lucide-react'

// For barcode scanning
import BarcodeReader from 'react-barcode-reader'

// Use SweetAlert2 directly without React content wrapper
const MySwal = Swal

// 🔧 NEW: Options for multi-select dropdowns
const NICOTINE_OPTIONS = [
  { value: '0mg', label: '0mg' },
  { value: '1mg', label: '1mg' },
  { value: '2mg', label: '2mg' },
  { value: '3mg', label: '3mg' },
  { value: '4mg', label: '4mg' },
  { value: '5mg', label: '5mg' },
  { value: '6mg', label: '6mg' },
  { value: '7mg', label: '7mg' },
  { value: '8mg', label: '8mg' },
  { value: '9mg', label: '9mg' },
  { value: '10mg', label: '10mg' },
  { value: '11mg', label: '11mg' },
  { value: '12mg', label: '12mg' },
  { value: '13mg', label: '13mg' },
  { value: '14mg', label: '14mg' },
  { value: '15mg', label: '15mg' },
  { value: '16mg', label: '16mg' },
  { value: '17mg', label: '17mg' },
  { value: '18mg', label: '18mg' },
  { value: '19mg', label: '19mg' },
  { value: '20mg', label: '20mg' },
  { value: '21mg', label: '21mg' },
  { value: '22mg', label: '22mg' },
  { value: '23mg', label: '23mg' },
  { value: '24mg', label: '24mg' },
  { value: '25mg', label: '25mg' },
  { value: '26mg', label: '26mg' },
  { value: '27mg', label: '27mg' },
  { value: '28mg', label: '28mg' },
  { value: '29mg', label: '29mg' },
  { value: '30mg', label: '30mg' },
  { value: '31mg', label: '31mg' },
  { value: '32mg', label: '32mg' },
  { value: '33mg', label: '33mg' },
  { value: '34mg', label: '34mg' },
  { value: '35mg', label: '35mg' },
  { value: '36mg', label: '36mg' },
  { value: '37mg', label: '37mg' },
  { value: '38mg', label: '38mg' },
  { value: '39mg', label: '39mg' },
  { value: '40mg', label: '40mg' },
  { value: '41mg', label: '41mg' },
  { value: '42mg', label: '42mg' },
  { value: '43mg', label: '43mg' },
  { value: '44mg', label: '44mg' },
  { value: '45mg', label: '45mg' },
  { value: '46mg', label: '46mg' },
  { value: '47mg', label: '47mg' },
  { value: '48mg', label: '48mg' },
  { value: '49mg', label: '49mg' },
  { value: '50mg', label: '50mg' },
]

const VG_PG_OPTIONS = [
  { value: '50/50', label: '50/50' },
  { value: '60/40', label: '60/40' },
  { value: '70/30', label: '70/30' },
  { value: '80/20', label: '80/20' },
  { value: 'Max VG', label: 'Max VG' },
]

// 🔧 NEW: Predefined color options with hex values
const COLOR_OPTIONS = [
  { value: 'red', label: 'Red', color: '#FF0000' },
  { value: 'blue', label: 'Blue', color: '#0000FF' },
  { value: 'green', label: 'Green', color: '#008000' },
  { value: 'yellow', label: 'Yellow', color: '#FFFF00' },
  { value: 'orange', label: 'Orange', color: '#FFA500' },
  { value: 'purple', label: 'Purple', color: '#800080' },
  { value: 'pink', label: 'Pink', color: '#FFC0CB' },
  { value: 'black', label: 'Black', color: '#000000' },
  { value: 'white', label: 'White', color: '#FFFFFF' },
  { value: 'brown', label: 'Brown', color: '#A52A2A' },
  { value: 'gray', label: 'Gray', color: '#808080' },
  { value: 'grey', label: 'Grey', color: '#808080' },
  { value: 'silver', label: 'Silver', color: '#C0C0C0' },
  { value: 'gold', label: 'Gold', color: '#FFD700' },
  { value: 'navy', label: 'Navy', color: '#000080' },
  { value: 'teal', label: 'Teal', color: '#008080' },
  { value: 'lime', label: 'Lime', color: '#00FF00' },
  { value: 'cyan', label: 'Cyan', color: '#00FFFF' },
  { value: 'magenta', label: 'Magenta', color: '#FF00FF' },
  { value: 'maroon', label: 'Maroon', color: '#800000' },
  { value: 'olive', label: 'Olive', color: '#808000' },
  { value: 'aqua', label: 'Aqua', color: '#00FFFF' },
  { value: 'fuchsia', label: 'Fuchsia', color: '#FF00FF' },
  { value: 'transparent', label: 'Transparent', color: 'transparent' },
  { value: 'clear', label: 'Clear', color: 'transparent' },
]

// 🔧 NEW: Function to detect color from user input
const detectColorFromInput = (input) => {
  if (!input || typeof input !== 'string') return null
  
  const normalizedInput = input.toLowerCase().trim()
  
  // Check if input matches any predefined color
  const matchedColor = COLOR_OPTIONS.find(color => 
    color.value.toLowerCase() === normalizedInput ||
    color.label.toLowerCase() === normalizedInput
  )
  
  if (matchedColor) {
    return matchedColor
  }
  
  // If no match, create a new color option
  return {
    value: normalizedInput,
    label: input.charAt(0).toUpperCase() + input.slice(1).toLowerCase(),
    color: '#808080', // Default gray color for custom colors
    isCustom: true
  }
}

// 🔧 NEW: Custom color option component with color preview
const ColorOption = ({ innerRef, innerProps, data }) => (
  <div
    ref={innerRef}
    {...innerProps}
    className="flex items-center gap-2 p-2 hover:bg-gray-100 cursor-pointer"
  >
    <div
      className="w-4 h-4 rounded-full border border-gray-300"
      style={{ backgroundColor: data.color === 'transparent' ? 'transparent' : data.color }}
    />
    <span>{data.label}</span>
    {data.isCustom && <span className="text-xs text-gray-500">(Custom)</span>}
  </div>
)

// 🔧 NEW: Custom multi-value component with color preview
const ColorMultiValue = ({ data, removeProps, innerProps }) => (
  <div
    {...innerProps}
    className="flex items-center gap-1 bg-purple-100 text-purple-800 px-2 py-1 rounded-md text-sm mr-1 mb-1"
  >
    <div
      className="w-3 h-3 rounded-full border border-gray-300"
      style={{ backgroundColor: data.color === 'transparent' ? 'transparent' : data.color }}
    />
    <span>{data.label}</span>
    <button
      {...removeProps}
      className="ml-1 text-purple-600 hover:text-purple-800"
    >
      ×
    </button>
  </div>
)

// 🔧 NEW: Custom styles for react-select with color support
const selectStyles = {
  control: (provided) => ({
    ...provided,
    padding: '6px',
    borderRadius: '12px',
    border: '1px solid #d1d5db',
    boxShadow: 'none',
    minHeight: '45px',
    '&:hover': {
      border: '1px solid #8b5cf6',
    },
    '&:focus-within': {
      border: '1px solid #8b5cf6',
      boxShadow: '0 0 0 2px rgba(139, 92, 246, 0.1)',
    },
  }),
  multiValue: (provided) => ({
    ...provided,
    backgroundColor: '#8b5cf6',
    color: 'white',
    borderRadius: '8px',
  }),
  multiValueLabel: (provided) => ({
    ...provided,
    color: 'white',
    fontSize: '12px',
  }),
  multiValueRemove: (provided) => ({
    ...provided,
    color: 'white',
    '&:hover': {
      backgroundColor: '#7c3aed',
      color: 'white',
    },
  }),
  option: (provided, state) => ({
    ...provided,
    backgroundColor: state.isSelected ? '#8b5cf6' : state.isFocused ? '#f3f4f6' : 'white',
    color: state.isSelected ? 'white' : '#374151',
    '&:hover': {
      backgroundColor: '#f3f4f6',
      color: '#374151',
    },
  }),
}

// 🔧 NEW: Special styles for color select
const colorSelectStyles = {
  ...selectStyles,
  multiValue: (provided) => ({
    ...provided,
    backgroundColor: 'transparent',
    border: 'none',
    margin: 0,
    padding: 0,
  }),
  multiValueLabel: (provided) => ({
    ...provided,
    padding: 0,
    margin: 0,
  }),
  multiValueRemove: (provided) => ({
    ...provided,
    padding: '2px',
    margin: 0,
  }),
}

// 🔧 FIXED: Additional Product Fields Configuration - using PillBottle instead of Bottle
const ADDITIONAL_FIELDS_CONFIG = [
  { key: 'bottleSizes', label: 'Bottle Sizes', icon: PillBottle },
  { key: 'bottleType', label: 'Bottle Type', icon: Package },
  { key: 'unit', label: 'Unit', icon: Hash },
  { key: 'puffs', label: 'Puffs', icon: Zap },
  { key: 'coil', label: 'Coil', icon: Settings },
  { key: 'volume', label: 'Volume', icon: PillBottle }, // 🔧 FIXED: Changed Bottle to PillBottle
  { key: 'charging', label: 'Charging', icon: Battery },
  { key: 'chargingTime', label: 'Charging Time', icon: Clock },
]

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
    'SubOhm Coil',
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

// Category Management Modal Component
const CategoryManagementModal = ({
  isOpen,
  onClose,
  categories,
  onCategoryUpdate,
  refreshCategories,
}) => {
  const [loading, setLoading] = useState(false)

  const handleDeleteCategory = async (categoryName) => {
    const result = await MySwal.fire({
      title: 'Delete Category?',
      text: `Are you sure you want to delete "${categoryName}" category? This will delete all its subcategories and cannot be undone.`,
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
        const token = localStorage.getItem('auth-token')
        const response = await fetch('/api/products', {
          method: 'POST',
          headers: { 
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({
            action: 'delete_category',
            categoryName: categoryName,
          }),
        })

        const data = await response.json()

        if (response.ok) {
          await refreshCategories()

          MySwal.fire({
            icon: 'success',
            title: 'Deleted!',
            text: `${categoryName} category and all its subcategories have been deleted.`,
            timer: 2000,
            showConfirmButton: false,
            toast: true,
            position: 'top-end',
          })
        } else {
          MySwal.fire({
            icon: 'error',
            title: 'Cannot Delete',
            text: data.error || 'Failed to delete category',
          })
        }
      } catch (error) {
        console.error('Error deleting category:', error)
        MySwal.fire({
          icon: 'error',
          title: 'Error',
          text: 'Failed to delete category',
        })
      } finally {
        setLoading(false)
      }
    }
  }

  const handleDeleteSubcategory = async (categoryName, subcategoryName) => {
    const result = await MySwal.fire({
      title: 'Delete Subcategory?',
      text: `Are you sure you want to delete "${subcategoryName}" from "${categoryName}" category?`,
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
        const token = localStorage.getItem('auth-token')
        const response = await fetch('/api/products', {
          method: 'POST',
          headers: { 
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({
            action: 'delete_subcategory',
            categoryName: categoryName,
            subcategoryName: subcategoryName,
          }),
        })

        const data = await response.json()

        if (response.ok) {
          await refreshCategories()

          MySwal.fire({
            icon: 'success',
            title: 'Deleted!',
            text: `${subcategoryName} subcategory has been deleted.`,
            timer: 2000,
            showConfirmButton: false,
            toast: true,
            position: 'top-end',
          })
        } else {
          MySwal.fire({
            icon: 'error',
            title: 'Cannot Delete',
            text: data.error || 'Failed to delete subcategory',
          })
        }
      } catch (error) {
        console.error('Error deleting subcategory:', error)
        MySwal.fire({
          icon: 'error',
          title: 'Error',
          text: 'Failed to delete subcategory',
        })
      } finally {
        setLoading(false)
      }
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        className="bg-white rounded-2xl p-6 max-w-2xl w-full mx-4 max-h-[80vh] overflow-y-auto"
      >
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
            <Settings size={24} className="text-purple-600" />
            Manage Categories & Subcategories
          </h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <X size={24} />
          </button>
        </div>

        <div className="space-y-4">
          {Object.entries(categories).map(([categoryName, subcategories]) => (
            <div
              key={categoryName}
              className="border border-gray-200 rounded-lg p-4"
            >
              <div className="flex items-center justify-between mb-3">
                <h4 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
                  <Tag size={18} className="text-purple-600" />
                  {categoryName}
                </h4>
                <button
                  onClick={() => handleDeleteCategory(categoryName)}
                  disabled={loading}
                  className="text-red-500 hover:text-red-700 transition-colors p-2 rounded-lg hover:bg-red-50 disabled:opacity-50"
                  title="Delete entire category"
                >
                  <Trash2 size={16} />
                </button>
              </div>

              <div className="ml-6 space-y-2">
                {subcategories && subcategories.length > 0 ? (
                  subcategories.map((subcategory) => (
                    <div
                      key={subcategory}
                      className="flex items-center justify-between p-2 bg-gray-50 rounded-lg"
                    >
                      <span className="text-gray-700">{subcategory}</span>
                      <button
                        onClick={() =>
                          handleDeleteSubcategory(categoryName, subcategory)
                        }
                        disabled={loading}
                        className="text-red-400 hover:text-red-600 transition-colors p-1 rounded hover:bg-red-100 disabled:opacity-50"
                        title="Delete subcategory"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  ))
                ) : (
                  <p className="text-gray-500 italic">No subcategories</p>
                )}
              </div>
            </div>
          ))}
        </div>

        <div className="flex justify-end mt-6">
          <button
            onClick={onClose}
            className="px-6 py-3 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400 transition-colors"
          >
            Close
          </button>
        </div>
      </motion.div>
    </div>
  )
}

// Branch Modal Component
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
      const token = localStorage.getItem('auth-token')
      const response = await fetch('/api/branches', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          action: 'add',
          branchName: cleanBranchName,
        }),
      })

      if (!response.ok) throw new Error('Failed to add branch')

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
        const token = localStorage.getItem('auth-token')
        const response = await fetch('/api/branches', {
          method: 'DELETE',
          headers: { 
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({ branchName }),
        })

        if (!response.ok) throw new Error('Failed to delete branch')

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
  } = useForm({
    // 🔧 UPDATED: Dynamic default values based on branches
    defaultValues: {},
  })

  const [subCategoryOptions, setSubCategoryOptions] = useState([])
  const [branches, setBranches] = useState(['bashundhara', 'mirpur'])
  const [stock, setStock] = useState({})
  const [images, setImages] = useState([])
  const [isLoading, setIsLoading] = useState(false)
  const [showBarcodeScanner, setShowBarcodeScanner] = useState(false)
  const [showBranchModal, setShowBranchModal] = useState(false)
  const [, forceUpdate] = useState(0)

  // State for category management modal
  const [showCategoryModal, setShowCategoryModal] = useState(false)

  // Separate states for category and subcategory custom inputs
  const [isAddingCustomCategory, setIsAddingCustomCategory] = useState(false)
  const [isAddingCustomSubcategory, setIsAddingCustomSubcategory] = useState(false)
  const [customCategoryInput, setCustomCategoryInput] = useState('')
  const [customSubcategoryInput, setCustomSubcategoryInput] = useState('')

  const [dynamicCategories, setDynamicCategories] = useState(VAPE_CATEGORIES)
  const fileInputRef = useRef(null)

  // 🆕 NEW: States for additional fields and features
  const [additionalFields, setAdditionalFields] = useState({
    bottleSizes: false,
    bottleType: false,
    unit: false,
    puffs: false,
    coil: false,
    volume: false,
    charging: false,
    chargingTime: false,
  })
  
  const [productFeatures, setProductFeatures] = useState([{ id: 1, value: '' }])
  const [eachSetContains, setEachSetContains] = useState([{ id: 1, value: '' }])
  const [showFeatures, setShowFeatures] = useState(false)
  const [showEachSetContains, setShowEachSetContains] = useState(false)

  const category = watch('category')

  // 🔧 NEW: Function to create branch-specific default values
  const createBranchDefaultValues = (branchList) => {
    const defaultValues = {}
    branchList.forEach((branch) => {
      defaultValues[`nicotineStrength_${branch}`] = []
      defaultValues[`vgPgRatio_${branch}`] = []
      defaultValues[`colors_${branch}`] = []
    })
    return defaultValues
  }

  // 🆕 NEW: Functions for managing features
  const addFeature = () => {
    const newId = Math.max(...productFeatures.map(f => f.id)) + 1
    setProductFeatures([...productFeatures, { id: newId, value: '' }])
  }

  const removeFeature = (id) => {
    if (productFeatures.length > 1) {
      setProductFeatures(productFeatures.filter(f => f.id !== id))
    }
  }

  const updateFeature = (id, value) => {
    setProductFeatures(productFeatures.map(f => 
      f.id === id ? { ...f, value } : f
    ))
  }

  // 🆕 NEW: Functions for managing "Each Set Contains"
  const addEachSetItem = () => {
    const newId = Math.max(...eachSetContains.map(f => f.id)) + 1
    setEachSetContains([...eachSetContains, { id: newId, value: '' }])
  }

  const removeEachSetItem = (id) => {
    if (eachSetContains.length > 1) {
      setEachSetContains(eachSetContains.filter(f => f.id !== id))
    }
  }

  const updateEachSetItem = (id, value) => {
    setEachSetContains(eachSetContains.map(f => 
      f.id === id ? { ...f, value } : f
    ))
  }

  // 🆕 NEW: Toggle functions for additional fields
  const toggleAdditionalField = (fieldKey) => {
    setAdditionalFields(prev => ({
      ...prev,
      [fieldKey]: !prev[fieldKey]
    }))
  }

  const refreshCategories = async () => {
    try {
      const response = await fetch('/api/products?getCategoriesOnly=true', {
        headers: {
          'Cache-Control': 'no-cache',
        }
      })
      if (response.ok) {
        const data = await response.json()
        console.log('🔄 Raw API response:', data)
        
        setDynamicCategories({...data.categories})
        console.log('🔄 Categories refreshed:', data.categories)
      } else {
        console.error('❌ Failed to load categories, using defaults')
        setDynamicCategories({...VAPE_CATEGORIES})
      }
    } catch (error) {
      console.error('❌ Error loading categories:', error)
      setDynamicCategories({...VAPE_CATEGORIES})
    }
  }

  useEffect(() => {
    refreshCategories()
  }, [])

  useEffect(() => {
    const loadBranches = async () => {
      try {
        const token = localStorage.getItem('auth-token')
        const response = await fetch('/api/branches', {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Cache-Control': 'no-cache'
          }
        })
        if (response.ok) {
          const data = await response.json()
          console.log('🔄 Branches loaded from API:', data)
          
          if (data.branches && Array.isArray(data.branches)) {
            setBranches([...data.branches])
            
            const initialStock = {}
            data.branches.forEach((branch) => {
              initialStock[`${branch}_stock`] = 0
            })
            setStock(initialStock)
            
            // 🔧 NEW: Set branch-specific default values in form
            const branchDefaults = createBranchDefaultValues(data.branches)
            reset(branchDefaults)
            
            console.log('✅ Branches set successfully:', data.branches)
          } else {
            console.warn('⚠️ Invalid branches data, using defaults')
            setBranches(['bashundhara', 'mirpur'])
            const branchDefaults = createBranchDefaultValues(['bashundhara', 'mirpur'])
            reset(branchDefaults)
          }
        } else {
          console.error('❌ Failed to fetch branches, status:', response.status)
          setBranches(['bashundhara', 'mirpur'])
          const branchDefaults = createBranchDefaultValues(['bashundhara', 'mirpur'])
          reset(branchDefaults)
        }
      } catch (error) {
        console.error('❌ Error loading branches:', error)
        setBranches(['bashundhara', 'mirpur'])
        const branchDefaults = createBranchDefaultValues(['bashundhara', 'mirpur'])
        reset(branchDefaults)
      }
    }

    loadBranches()
  }, [reset])

  useEffect(() => {
    const initialStock = {}
    branches.forEach((branch) => {
      initialStock[`${branch}_stock`] = 0
    })
    setStock(initialStock)
  }, [branches])

  useEffect(() => {
    if (category && dynamicCategories[category]) {
      setSubCategoryOptions(dynamicCategories[category])
    } else {
      setSubCategoryOptions([])
    }
  }, [category, dynamicCategories])

  const handleBranchUpdate = async (updatedBranches) => {
    try {
      console.log('🔄 Branch update started:', updatedBranches)
      
      setBranches([...updatedBranches])
      
      const newStock = {}
      updatedBranches.forEach((branch) => {
        newStock[`${branch}_stock`] = stock[`${branch}_stock`] || 0
      })
      setStock(newStock)
      
      // 🔧 NEW: Update form default values for new branches
      const branchDefaults = createBranchDefaultValues(updatedBranches)
      const currentValues = watch()
      reset({
        ...currentValues,
        ...branchDefaults
      })
      
      forceUpdate(n => n + 1)
      
      console.log('✅ Branch update completed')
    } catch (error) {
      console.error('❌ Error in branch update:', error)
      forceUpdate(n => n + 1)
    }
  }

  const handleCategoryUpdate = (updatedCategories) => {
    setDynamicCategories(updatedCategories)
  }

  const handleBarcodeScan = async (data) => {
    try {
      if (data) {
        console.log('Scanned barcode:', data)

        const token = localStorage.getItem('auth-token')
        const response = await fetch(`/api/products?barcode=${data}`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        })
        if (response.ok) {
          const productData = await response.json()

          if (productData.products && productData.products.length > 0) {
            const product = productData.products[0]
            setValue('name', product.name || '')
            setValue('brand', product.brand || '')
            setValue('barcode', data)
            setValue('price', product.price || '')
            setValue('category', product.category || '')
            setValue('subcategory', product.subcategory || '')
            setValue('description', product.description || '')
            
            // 🔧 UPDATED: Handle multi-select values for scanned products per branch
            branches.forEach((branch) => {
              if (product.branchSpecifications && product.branchSpecifications[branch]) {
                const branchSpec = product.branchSpecifications[branch]
                
                if (branchSpec.nicotineStrength) {
                  const nicotineValues = Array.isArray(branchSpec.nicotineStrength) 
                    ? branchSpec.nicotineStrength.map(val => ({ value: val, label: val }))
                    : [{ value: branchSpec.nicotineStrength, label: branchSpec.nicotineStrength }]
                  setValue(`nicotineStrength_${branch}`, nicotineValues)
                }
                
                if (branchSpec.vgPgRatio) {
                  const vgPgValues = Array.isArray(branchSpec.vgPgRatio) 
                    ? branchSpec.vgPgRatio.map(val => ({ value: val, label: val }))
                    : [{ value: branchSpec.vgPgRatio, label: branchSpec.vgPgRatio }]
                  setValue(`vgPgRatio_${branch}`, vgPgValues)
                }

                if (branchSpec.colors) {
                  const colorValues = Array.isArray(branchSpec.colors) 
                    ? branchSpec.colors.map(colorValue => {
                        const detectedColor = detectColorFromInput(colorValue)
                        return detectedColor || { value: colorValue, label: colorValue, color: '#808080' }
                      })
                    : [detectColorFromInput(branchSpec.colors) || { value: branchSpec.colors, label: branchSpec.colors, color: '#808080' }]
                  setValue(`colors_${branch}`, colorValues)
                }
              }
            })
            
            setValue('flavor', product.flavor || '')
            setValue('resistance', product.resistance || '')
            setValue('wattageRange', product.wattageRange || '')

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
    setStock((prev) => ({ ...prev, [branchKey]: parseInt(value) || 0 }))
  }

  const handleAddCustomCategory = async () => {
    if (customCategoryInput.trim()) {
      try {
        const token = localStorage.getItem('auth-token')
        const response = await fetch('/api/products', {
          method: 'POST',
          headers: { 
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({
            action: 'add_category',
            categoryName: customCategoryInput.toUpperCase(),
            subcategories: [],
          }),
        })

        if (response.ok) {
          await refreshCategories()
          
          setValue('category', customCategoryInput.toUpperCase())
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
          const errorData = await response.json()
          MySwal.fire({
            icon: 'error',
            title: 'Error',
            text: errorData.error || 'Failed to add custom category',
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

  const handleAddCustomSubcategory = async () => {
    if (customSubcategoryInput.trim() && category) {
      try {
        const token = localStorage.getItem('auth-token')
        const response = await fetch('/api/products', {
          method: 'POST',
          headers: { 
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({
            action: 'add_subcategory',
            categoryName: category,
            subcategoryName: customSubcategoryInput,
          }),
        })

        if (response.ok) {
          await refreshCategories()
          
          setValue('subcategory', customSubcategoryInput)
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
          const errorData = await response.json()
          MySwal.fire({
            icon: 'error',
            title: 'Error',
            text: errorData.error || 'Failed to add custom subcategory',
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

  // 🔧 UPDATED: Form submission to handle branch-specific multi-select arrays + new fields
  const onSubmit = async (data) => {
    setIsLoading(true)
    try {
      console.log('Submitting form data:', data)

      // 🔧 NEW: Process branch-specific multi-select values
      const branchSpecificData = {}
      branches.forEach((branch) => {
        branchSpecificData[branch] = {
          nicotineStrength: data[`nicotineStrength_${branch}`]?.map(item => item.value) || [],
          vgPgRatio: data[`vgPgRatio_${branch}`]?.map(item => item.value) || [],
          colors: data[`colors_${branch}`]?.map(item => item.value) || [],
        }
      })

      // 🆕 NEW: Process additional fields
      const additionalFieldsData = {}
      ADDITIONAL_FIELDS_CONFIG.forEach(field => {
        if (additionalFields[field.key] && data[field.key]) {
          additionalFieldsData[field.key] = data[field.key]
        }
      })

      // 🆕 NEW: Process features and each set contains
      const featuresData = showFeatures ? productFeatures
        .filter(f => f.value.trim() !== '')
        .map((f, index) => `${index + 1}. ${f.value.trim()}`) : []

      const eachSetContainsData = showEachSetContains ? eachSetContains
        .filter(f => f.value.trim() !== '')
        .map((f, index) => `${index + 1}. ${f.value.trim()}`) : []

      const processedData = {
        ...data,
        stock,
        // Store branch-specific specifications
        branchSpecifications: branchSpecificData,
        // 🆕 NEW: Add new fields
        ...additionalFieldsData,
        features: featuresData,
        eachSetContains: eachSetContainsData,
        resistance: data.resistance || null,
        wattageRange: data.wattageRange || null,
        tags: data.tags ? data.tags.split(',').map((tag) => tag.trim()) : [],
      }

      console.log('Processed product data:', processedData)

      const token = localStorage.getItem('auth-token')
      const response = await fetch('/api/products', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(processedData),
      })

      console.log('Response status:', response.status)
      console.log('Response headers:', response.headers.get('content-type'))

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
          headers: {
            'Authorization': `Bearer ${token}`
          },
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

      // 🔧 UPDATED: Reset form with branch-specific defaults + new fields
      const branchDefaults = createBranchDefaultValues(branches)
      reset(branchDefaults)
      setStock({})
      setImages([])
      setIsAddingCustomCategory(false)
      setIsAddingCustomSubcategory(false)
      setCustomCategoryInput('')
      setCustomSubcategoryInput('')
      
      // 🆕 NEW: Reset new fields
      setProductFeatures([{ id: 1, value: '' }])
      setEachSetContains([{ id: 1, value: '' }])
      setShowFeatures(false)
      setShowEachSetContains(false)
      setAdditionalFields({
        bottleSizes: false,
        bottleType: false,
        unit: false,
        puffs: false,
        coil: false,
        volume: false,
        charging: false,
        chargingTime: false,
      })

      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }

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
            Manage your vape shop inventory with branch-specific specifications
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

                {/* Categories */}
                <motion.div variants={itemVariants} className="space-y-4">
                  <div className="flex justify-between items-center">
                    <h3 className="text-xl font-semibold text-gray-800 flex items-center gap-2">
                      <Tag size={20} className="text-purple-600" />
                      Categories
                    </h3>
                    <button
                      type="button"
                      onClick={() => setShowCategoryModal(true)}
                      className="text-purple-600 hover:text-purple-700 text-sm flex items-center gap-1"
                    >
                      <Settings size={14} /> Manage Categories
                    </button>
                  </div>

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
                        key={`category-${Object.keys(dynamicCategories).length}`}
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
                        key={`subcategory-${category}-${subCategoryOptions.length}`}
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

                {/* 🆕 NEW: Additional Product Fields with Toggles */}
                <motion.div variants={itemVariants} className="space-y-4">
                  <h3 className="text-xl font-semibold text-gray-800 flex items-center gap-2">
                    <Settings size={20} className="text-purple-600" />
                    Additional Product Fields
                  </h3>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {ADDITIONAL_FIELDS_CONFIG.map((field) => {
                      const IconComponent = field.icon
                      return (
                        <div key={field.key} className="bg-gray-50 rounded-lg p-4">
                          <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center gap-2">
                              <IconComponent size={16} className="text-purple-600" />
                              <label className="text-sm font-medium text-gray-700">
                                {field.label}
                              </label>
                            </div>
                            <button
                              type="button"
                              onClick={() => toggleAdditionalField(field.key)}
                              className={`p-1 rounded-lg transition-colors ${
                                additionalFields[field.key]
                                  ? 'text-purple-600 hover:bg-purple-100'
                                  : 'text-gray-400 hover:bg-gray-200'
                              }`}
                            >
                              {additionalFields[field.key] ? (
                                <ToggleRight size={20} />
                              ) : (
                                <ToggleLeft size={20} />
                              )}
                            </button>
                          </div>
                          
                          <AnimatePresence>
                            {additionalFields[field.key] && (
                              <motion.input
                                initial={{ opacity: 0, height: 0 }}
                                animate={{ opacity: 1, height: 'auto' }}
                                exit={{ opacity: 0, height: 0 }}
                                type="text"
                                {...register(field.key)}
                                placeholder={`Enter ${field.label.toLowerCase()}`}
                                className="w-full p-3 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-purple-500 bg-white"
                              />
                            )}
                          </AnimatePresence>
                        </div>
                      )
                    })}
                  </div>
                </motion.div>

                {/* 🆕 NEW: Features Section */}
                <motion.div variants={itemVariants} className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-xl font-semibold text-gray-800 flex items-center gap-2">
                      <List size={20} className="text-purple-600" />
                      Product Features
                    </h3>
                    <button
                      type="button"
                      onClick={() => setShowFeatures(!showFeatures)}
                      className={`p-2 rounded-lg transition-colors ${
                        showFeatures
                          ? 'text-purple-600 hover:bg-purple-100'
                          : 'text-gray-400 hover:bg-gray-200'
                      }`}
                    >
                      {showFeatures ? <ToggleRight size={20} /> : <ToggleLeft size={20} />}
                    </button>
                  </div>

                  <AnimatePresence>
                    {showFeatures && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        className="bg-gray-50 rounded-lg p-4 space-y-3"
                      >
                        {productFeatures.map((feature, index) => (
                          <div key={feature.id} className="flex items-center gap-2">
                            <span className="text-sm font-medium text-gray-600 w-8">
                              {index + 1}.
                            </span>
                            <input
                              type="text"
                              value={feature.value}
                              onChange={(e) => updateFeature(feature.id, e.target.value)}
                              placeholder={`Feature ${index + 1}`}
                              className="flex-1 p-3 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-purple-500 bg-white"
                            />
                            {productFeatures.length > 1 && (
                              <button
                                type="button"
                                onClick={() => removeFeature(feature.id)}
                                className="text-red-500 hover:text-red-700 p-2 rounded-lg hover:bg-red-50"
                              >
                                <Minus size={16} />
                              </button>
                            )}
                          </div>
                        ))}
                        
                        <button
                          type="button"
                          onClick={addFeature}
                          className="w-full p-3 border-2 border-dashed border-purple-300 rounded-lg text-purple-600 hover:border-purple-400 hover:text-purple-700 transition-colors flex items-center justify-center gap-2"
                        >
                          <Plus size={16} />
                          Add Feature
                        </button>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.div>

                {/* 🆕 NEW: Each Set Contains Section */}
                <motion.div variants={itemVariants} className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-xl font-semibold text-gray-800 flex items-center gap-2">
                      <Package size={20} className="text-purple-600" />
                      Each Set Contains
                    </h3>
                    <button
                      type="button"
                      onClick={() => setShowEachSetContains(!showEachSetContains)}
                      className={`p-2 rounded-lg transition-colors ${
                        showEachSetContains
                          ? 'text-purple-600 hover:bg-purple-100'
                          : 'text-gray-400 hover:bg-gray-200'
                      }`}
                    >
                      {showEachSetContains ? <ToggleRight size={20} /> : <ToggleLeft size={20} />}
                    </button>
                  </div>

                  <AnimatePresence>
                    {showEachSetContains && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        className="bg-gray-50 rounded-lg p-4 space-y-3"
                      >
                        {eachSetContains.map((item, index) => (
                          <div key={item.id} className="flex items-center gap-2">
                            <span className="text-sm font-medium text-gray-600 w-8">
                              {index + 1}.
                            </span>
                            <input
                              type="text"
                              value={item.value}
                              onChange={(e) => updateEachSetItem(item.id, e.target.value)}
                              placeholder={`Item ${index + 1}`}
                              className="flex-1 p-3 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-purple-500 bg-white"
                            />
                            {eachSetContains.length > 1 && (
                              <button
                                type="button"
                                onClick={() => removeEachSetItem(item.id)}
                                className="text-red-500 hover:text-red-700 p-2 rounded-lg hover:bg-red-50"
                              >
                                <Minus size={16} />
                              </button>
                            )}
                          </div>
                        ))}
                        
                        <button
                          type="button"
                          onClick={addEachSetItem}
                          className="w-full p-3 border-2 border-dashed border-purple-300 rounded-lg text-purple-600 hover:border-purple-400 hover:text-purple-700 transition-colors flex items-center justify-center gap-2"
                        >
                          <Plus size={16} />
                          Add Item
                        </button>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.div>
              </div>

              {/* Right Column */}
              <div className="space-y-6">
                {/* 🔧 NEW: Branch-Specific Vape Specifications */}
                <motion.div variants={itemVariants} className="space-y-6">
                  <div className="flex justify-between items-center">
                    <h3 className="text-xl font-semibold text-gray-800 flex items-center gap-2">
                      <Zap size={20} className="text-purple-600" />
                      Branch-Specific Vape Specifications
                    </h3>
                    <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded-full font-medium">
                      {branches.length} Branches
                    </span>
                  </div>

                  {/* Branch-Specific Multi-Select Fields */}
                  {branches.map((branch) => (
                    <div key={branch} className="border border-gray-200 rounded-xl p-4 bg-gray-50">
                      <h4 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2 capitalize">
                        <Store size={18} className="text-purple-600" />
                        {branch} Branch Specifications
                      </h4>

                      <div className="space-y-4">
                        {/* Nicotine Strength per Branch */}
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Nicotine Strength (Multiple)
                          </label>
                          <Controller
                            name={`nicotineStrength_${branch}`}
                            control={control}
                            render={({ field }) => (
                              <Select
                                {...field}
                                options={NICOTINE_OPTIONS}
                                isMulti
                                closeMenuOnSelect={false}
                                placeholder={`Select strengths for ${branch}...`}
                                styles={selectStyles}
                                className="react-select-container"
                                classNamePrefix="react-select"
                              />
                            )}
                          />
                        </div>

                        {/* VG/PG Ratio per Branch */}
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            VG/PG Ratio (Multiple)
                          </label>
                          <Controller
                            name={`vgPgRatio_${branch}`}
                            control={control}
                            render={({ field }) => (
                              <Select
                                {...field}
                                options={VG_PG_OPTIONS}
                                isMulti
                                closeMenuOnSelect={false}
                                placeholder={`Select ratios for ${branch}...`}
                                styles={selectStyles}
                                className="react-select-container"
                                classNamePrefix="react-select"
                              />
                            )}
                          />
                        </div>

                        {/* Colors per Branch */}
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
                            <Palette size={16} className="text-purple-600" />
                            Colors (Multiple - Auto-detect)
                          </label>
                          <Controller
                            name={`colors_${branch}`}
                            control={control}
                            render={({ field }) => (
                              <CreatableSelect
                                {...field}
                                options={COLOR_OPTIONS}
                                isMulti
                                closeMenuOnSelect={false}
                                placeholder={`Type or select colors for ${branch}...`}
                                styles={colorSelectStyles}
                                className="react-select-container"
                                classNamePrefix="react-select"
                                components={{
                                  Option: ColorOption,
                                  MultiValue: ColorMultiValue,
                                }}
                                formatCreateLabel={(inputValue) =>
                                  `Add "${inputValue}" color`
                                }
                                onCreateOption={(inputValue) => {
                                  const newColor = detectColorFromInput(inputValue)
                                  if (newColor) {
                                    const currentColors = field.value || []
                                    field.onChange([...currentColors, newColor])
                                  }
                                }}
                                filterOption={(option, inputValue) => {
                                  if (!inputValue) return true
                                  const searchValue = inputValue.toLowerCase()
                                  return (
                                    option.label.toLowerCase().includes(searchValue) ||
                                    option.value.toLowerCase().includes(searchValue)
                                  )
                                }}
                              />
                            )}
                          />
                        </div>
                      </div>
                    </div>
                  ))}

                  {/* General Specifications */}
                  <div className="bg-white border border-gray-200 rounded-xl p-4">
                    <h4 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
                      <Package size={18} className="text-purple-600" />
                      General Specifications
                    </h4>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Resistance
                        </label>
                        <input
                          type="text"
                          {...register('resistance')}
                          placeholder="e.g., 0.5Ω"
                          className="w-full p-3 rounded-xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-purple-500"
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
                          className="w-full p-3 rounded-xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-purple-500"
                        />
                      </div>
                    </div>

                    <div className="mt-4">
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Flavor
                      </label>
                      <input
                        type="text"
                        {...register('flavor')}
                        placeholder="Enter flavor profile"
                        className="w-full p-3 rounded-xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-purple-500"
                      />
                    </div>
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
                  Tags (Comma separated)
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
                  const branchDefaults = createBranchDefaultValues(branches)
                  reset(branchDefaults)
                  setStock({})
                  setImages([])
                  setIsAddingCustomCategory(false)
                  setIsAddingCustomSubcategory(false)
                  setCustomCategoryInput('')
                  setCustomSubcategoryInput('')
                  setProductFeatures([{ id: 1, value: '' }])
                  setEachSetContains([{ id: 1, value: '' }])
                  setShowFeatures(false)
                  setShowEachSetContains(false)
                  setAdditionalFields({
                    bottleSizes: false,
                    bottleType: false,
                    unit: false,
                    puffs: false,
                    coil: false,
                    volume: false,
                    charging: false,
                    chargingTime: false,
                  })
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

        {/* Branch Management Modal */}
        <BranchModal
          isOpen={showBranchModal}
          onClose={() => setShowBranchModal(false)}
          branches={branches}
          onBranchUpdate={handleBranchUpdate}
        />

        {/* Category Management Modal */}
        <CategoryManagementModal
          isOpen={showCategoryModal}
          onClose={() => setShowCategoryModal(false)}
          categories={dynamicCategories}
          onCategoryUpdate={handleCategoryUpdate}
          refreshCategories={refreshCategories}
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
