'use client'

import { useState, useEffect, useRef, useContext, useCallback } from 'react'
import { useForm, Controller } from 'react-hook-form'
import { motion, AnimatePresence } from 'framer-motion'
import Swal from 'sweetalert2'
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd'
import Select from 'react-select'
import CreatableSelect from 'react-select/creatable'
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
  Plus,
  Zap,
  X,
  Edit,
  Eye,
  EyeOff,
  Move,
  ArrowLeft,
  Lock,
  Palette,
} from 'lucide-react'
import BarcodeReader from 'react-barcode-reader'
import { AuthContext } from '../Provider/AuthProvider'

// 🔧 NEW: Options for multi-select dropdowns
const NICOTINE_OPTIONS = [
  { value: '0mg', label: '0mg' },
  { value: '3mg', label: '3mg' },
  { value: '6mg', label: '6mg' },
  { value: '12mg', label: '12mg' },
  { value: '18mg', label: '18mg' },
  { value: '24mg', label: '24mg' },
  { value: '50mg', label: '50mg' },
]

const VG_PG_OPTIONS = [
  { value: '50/50', label: '50/50' },
  { value: '60/40', label: '60/40' },
  { value: '70/30', label: '70/30' },
  { value: '80/20', label: '80/20' },
  { value: 'Max VG', label: 'Max VG' },
]

// 🔧 NEW: Predefined color options with hex values for better color detection
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

// 🔧 NEW: Custom styles for react-select
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

// Image Gallery Component
const ImageGallery = ({
  images,
  onImageDelete,
  onImageReorder,
  onImageAdd,
  isLoading,
}) => {
  const fileInputRef = useRef(null)

  // 🔧 FIXED: Proper drag end handler
  const handleDragEnd = (result) => {
    if (!result.destination) return

    const items = Array.from(images)
    const [reorderedItem] = items.splice(result.source.index, 1)
    items.splice(result.destination.index, 0, reorderedItem)

    // 🔧 CRITICAL: Call the parent's onImageReorder immediately
    onImageReorder(items)
  }

  const handleFileUpload = async (files) => {
    for (let i = 0; i < files.length; i++) {
      const file = files[i]
      const fileId = Math.random().toString(36).substr(2, 9)

      const newImage = {
        id: fileId,
        file,
        preview: URL.createObjectURL(file),
        url: URL.createObjectURL(file),
        publicId: null,
        alt: `Product image ${images.length + i + 1}`,
        isNew: true,
      }

      onImageAdd(newImage)
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-xl font-semibold text-gray-800 flex items-center gap-2">
          <ImageIcon size={20} className="text-purple-600" />
          Product Images ({images.length})
        </h3>
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 flex items-center gap-2"
          disabled={isLoading}
        >
          <Plus size={16} />
          Add Images
        </button>
      </div>

      <input
        ref={fileInputRef}
        type="file"
        multiple
        accept="image/*"
        onChange={(e) => handleFileUpload(Array.from(e.target.files))}
        className="hidden"
      />

      {images.length > 0 ? (
        <DragDropContext onDragEnd={handleDragEnd}>
          <Droppable droppableId="images" direction="horizontal">
            {(provided) => (
              <div
                {...provided.droppableProps}
                ref={provided.innerRef}
                className="grid grid-cols-2 md:grid-cols-4 gap-4"
              >
                {images.map((image, index) => (
                  <Draggable
                    key={image.id || image.publicId}
                    draggableId={image.id || image.publicId}
                    index={index}
                  >
                    {(provided, snapshot) => (
                      <div
                        ref={provided.innerRef}
                        {...provided.draggableProps}
                        className={`relative group rounded-xl overflow-hidden ${
                          snapshot.isDragging ? 'opacity-50' : ''
                        }`}
                      >
                        <div className="aspect-square relative">
                          <img
                            src={image.url || image.preview}
                            alt={image.alt}
                            className="w-full h-full object-cover"
                          />
                          <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-40 transition-all">
                            <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity flex gap-1">
                              <button
                                type="button"
                                {...provided.dragHandleProps}
                                className="p-1 bg-gray-800 text-white rounded hover:bg-gray-700"
                              >
                                <Move size={14} />
                              </button>
                              <button
                                type="button"
                                onClick={() =>
                                  onImageDelete(
                                    image.id || image.publicId,
                                    image.publicId
                                  )
                                }
                                className="p-1 bg-red-500 text-white rounded hover:bg-red-600"
                              >
                                <Trash2 size={14} />
                              </button>
                            </div>
                          </div>
                        </div>
                        {index === 0 && (
                          <div className="absolute bottom-2 left-2 bg-purple-600 text-white px-2 py-1 rounded text-xs">
                            Main
                          </div>
                        )}
                        {image.isNew && (
                          <div className="absolute bottom-2 right-2 bg-green-600 text-white px-2 py-1 rounded text-xs">
                            New
                          </div>
                        )}
                      </div>
                    )}
                  </Draggable>
                ))}
                {provided.placeholder}
              </div>
            )}
          </Droppable>
        </DragDropContext>
      ) : (
        <div className="border-2 border-dashed border-gray-300 rounded-xl p-8 text-center">
          <ImageIcon className="mx-auto text-gray-400 mb-4" size={48} />
          <p className="text-gray-600 mb-4">No images yet</p>
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="px-6 py-3 bg-purple-600 text-white rounded-xl hover:bg-purple-700"
          >
            Add First Image
          </button>
        </div>
      )}
    </div>
  )
}

// Branch Management Modal (Admin Only)
const BranchModal = ({ isOpen, onClose, branches, onBranchUpdate, isAdmin }) => {
  const [newBranchName, setNewBranchName] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const getAuthHeaders = () => {
    const token = localStorage.getItem('auth-token')
    return {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    }
  }

  // Don't show modal for moderators
  if (!isOpen || !isAdmin) return null

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
      const response = await fetch('/api/branches', {
        method: 'POST',
        headers: getAuthHeaders(),
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

      Swal.fire({
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
    const result = await Swal.fire({
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
        const response = await fetch('/api/branches', {
          method: 'DELETE',
          headers: getAuthHeaders(),
          body: JSON.stringify({ branchName }),
        })

        if (!response.ok) throw new Error('Failed to delete branch')

        const updatedBranches = branches.filter((b) => b !== branchName)
        onBranchUpdate(updatedBranches)

        Swal.fire({
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
        Swal.fire({
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
                className="px-4 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50"
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
                <span className="font-medium text-gray-800 capitalize flex items-center gap-2">
                  <Store size={16} className="text-purple-600" />
                  {branch}
                </span>
                <button
                  onClick={() => handleDeleteBranch(branch)}
                  className="text-red-500 hover:text-red-700 p-1"
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
            className="px-6 py-3 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400"
          >
            Close
          </button>
        </div>
      </motion.div>
    </div>
  )
}

// Main Edit Product Component
export default function EditProduct({ productId, onBack }) {
  const { user } = useContext(AuthContext)
  const {
    register,
    handleSubmit,
    watch,
    setValue,
    control,
    formState: { errors, isDirty },
    reset,
  } = useForm({
    defaultValues: {},
  })

  // User role and branch states
  const [userLoading, setUserLoading] = useState(true)
  const [userRole, setUserRole] = useState(null)
  const [userBranch, setUserBranch] = useState(null)

  // Product states
  const [product, setProduct] = useState(null)
  const [originalProduct, setOriginalProduct] = useState(null)
  const [images, setImages] = useState([])
  const [branches, setBranches] = useState([])
  const [stock, setStock] = useState({})
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [showBarcodeScanner, setShowBarcodeScanner] = useState(false)
  const [showBranchModal, setShowBranchModal] = useState(false)
  const [autoSaveEnabled, setAutoSaveEnabled] = useState(false)

  // 🔧 NEW: Branch-specific specifications state
  const [branchSpecifications, setBranchSpecifications] = useState({})

  // Category states
  const [categories, setCategories] = useState({})
  const [subCategoryOptions, setSubCategoryOptions] = useState([])
  const [isAddingCustomCategory, setIsAddingCustomCategory] = useState(false)
  const [isAddingCustomSubcategory, setIsAddingCustomSubcategory] = useState(false)
  const [customCategoryInput, setCustomCategoryInput] = useState('')
  const [customSubcategoryInput, setCustomSubcategoryInput] = useState('')

  const category = watch('category')

  // Get auth headers for API calls
  const getAuthHeaders = () => {
    const token = localStorage.getItem('auth-token')
    return {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    }
  }

  // Check if user is authenticated
  const checkAuth = () => {
    const token = localStorage.getItem('auth-token')
    if (!token) {
      window.location.href = '/admin/login'
      return false
    }
    return true
  }

  // 🔧 NEW: Helper function to update branch specifications
  const updateBranchSpecification = useCallback((branch, field, selectedOptions) => {
    setBranchSpecifications(prev => {
      const prevBranchSpec = prev[branch] || { nicotineStrength: [], vgPgRatio: [], colors: [] }
      return {
        ...prev,
        [branch]: {
          ...prevBranchSpec,
          [field]: selectedOptions ? selectedOptions.map(opt => opt.value) : []
        }
      }
    })
  }, [])

  // 🔧 NEW: Helper function to get branch specification value for display
  const getBranchSpecificationValue = useCallback((branch, field) => {
    const branchSpec = branchSpecifications[branch]
    if (!branchSpec || !branchSpec[field]) return []

    if (field === 'colors') {
      return branchSpec[field].map(colorValue => {
        const detectedColor = detectColorFromInput(colorValue)
        return detectedColor || { value: colorValue, label: colorValue, color: '#808080' }
      })
    } else {
      return branchSpec[field].map(val => ({ value: val, label: val }))
    }
  }, [branchSpecifications])

  // Fetch user details from database to get role and branch
  useEffect(() => {
    const fetchUserDetails = async () => {
      if (!user?.email) {
        setUserLoading(false)
        return
      }

      if (!checkAuth()) return

      try {
        setUserLoading(true)
        const response = await fetch(
          `/api/user?email=${encodeURIComponent(user.email)}`,
          {
            headers: getAuthHeaders()
          }
        )
        if (response.ok) {
          const data = await response.json()
          if (data.user) {
            setUserRole(data.user.role)
            setUserBranch(data.user.branch)
            console.log('User Details:', {
              email: data.user.email,
              role: data.user.role,
              branch: data.user.branch,
            })
          }
        } else if (response.status === 401) {
          window.location.href = '/admin/login'
          return
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

  // Load initial data
  useEffect(() => {
    const loadInitialData = async () => {
      if (!checkAuth()) return

      try {
        setIsLoading(true)

        // Load categories
        const categoriesResponse = await fetch(
          '/api/products?getCategoriesOnly=true',
          {
            headers: getAuthHeaders()
          }
        )
        if (categoriesResponse.ok) {
          const categoriesData = await categoriesResponse.json()
          setCategories(categoriesData.categories || {})
        } else if (categoriesResponse.status === 401) {
          window.location.href = '/admin/login'
          return
        }

        // Load branches
        const branchesResponse = await fetch('/api/branches', {
          headers: getAuthHeaders()
        })
        if (branchesResponse.ok) {
          const branchesData = await branchesResponse.json()
          setBranches(branchesData.branches || ['mirpur', 'bashundhara'])
        } else if (branchesResponse.status === 401) {
          window.location.href = '/admin/login'
          return
        } else {
          setBranches(['mirpur', 'bashundhara'])
        }

        // Load product data
        if (productId) {
          const productResponse = await fetch(`/api/products?id=${productId}`, {
            headers: getAuthHeaders()
          })
          if (!productResponse.ok) {
            if (productResponse.status === 401) {
              window.location.href = '/admin/login'
              return
            }
            throw new Error('Product not found')
          }

          const productData = await productResponse.json()
          setProduct(productData)
          setOriginalProduct(productData)

          // 🔧 NEW: Load branch specifications from product data
          if (productData.branchSpecifications) {
            setBranchSpecifications(productData.branchSpecifications)
          }

          reset({
            name: productData.name || '',
            brand: productData.brand || '',
            barcode: productData.barcode || '',
            price: productData.price || '',
            comparePrice: productData.comparePrice || '',
            category: productData.category || '',
            subcategory: productData.subcategory || '',
            description: productData.description || '',
            flavor: productData.flavor || '',
            resistance: productData.resistance || '',
            wattageRange: productData.wattageRange || '',
            tags: productData.tags ? productData.tags.join(', ') : '',
            status: productData.status || 'active',
          })

          // Set images
          if (productData.images) {
            setImages(
              productData.images.map((img) => ({
                ...img,
                id: img.publicId || Math.random().toString(),
              }))
            )
          }

          // Set stock
          setStock(productData.stock || {})
        }
      } catch (error) {
        console.error('Error loading data:', error)
        Swal.fire({
          icon: 'error',
          title: 'Error',
          text: 'Failed to load product data',
        })
      } finally {
        setIsLoading(false)
      }
    }

    loadInitialData()
  }, [productId, reset])

  // Initialize stock for branches when branches change
  useEffect(() => {
    if (branches.length > 0 && product) {
      const newStock = {}
      branches.forEach((branch) => {
        newStock[`${branch}_stock`] = stock[`${branch}_stock`] || 0
      })
      setStock(newStock)
    }
  }, [branches, product])

  // Update subcategories when category changes
useEffect(() => {
  if (category) {
    const categoryKey = category.toUpperCase()
    if (categories[categoryKey]) {
      setSubCategoryOptions(categories[categoryKey])
    } else {
      setSubCategoryOptions([])
    }
  } else {
    setSubCategoryOptions([])
  }
}, [category, categories])

  // 🔧 UPDATED: Save product function with branch specifications
  const handleSave = useCallback(async (data, isSilent = false) => {
  console.log('🔄 handleSave called', { isSaving, isSilent })
  
  if (isSaving) {
    console.log('⚠️ Save already in progress, skipping')
    return
  }

  if (!checkAuth()) return
  
  setIsSaving(true)
  try {
    console.log('💾 Starting save process...', { isSilent, hasData: !!data })
    
    // 🔧 NEW: Filter branch data based on user role
    let filteredBranchSpecs = branchSpecifications
    let filteredStock = stock

    if (userRole === 'moderator' && userBranch) {
      // Moderator: only send their branch specifications
      filteredBranchSpecs = {}
      if (branchSpecifications[userBranch]) {
        filteredBranchSpecs[userBranch] = branchSpecifications[userBranch]
      }

      // Moderator: only send their branch stock
      filteredStock = {}
      if (stock[`${userBranch}_stock`] !== undefined) {
        filteredStock[`${userBranch}_stock`] = stock[`${userBranch}_stock`]
      }

      console.log('🔧 Moderator data filtered:', {
        branch: userBranch,
        branchSpecs: filteredBranchSpecs,
        stock: filteredStock
      })
    } else {
      console.log('🔧 Admin sending all branch data:', {
        branchSpecs: Object.keys(branchSpecifications),
        stock: Object.keys(stock)
      })
    }
    
    // 🔧 UPDATED: Use filtered data in the payload
    const processedData = {
      action: 'update',
      id: productId,
      ...data,
      stock: filteredStock,
      // 🔧 FIXED: Use filtered branch specifications
      branchSpecifications: filteredBranchSpecs,
      resistance: data.resistance || null,
      wattageRange: data.wattageRange || null,
      tags: data.tags ? data.tags.split(',').map((tag) => tag.trim()) : [],
      imageOrder: images.map((img, index) => ({
        publicId: img.publicId,
        url: img.url,
        alt: img.alt,
        order: index,
      })),
    }

    console.log('📤 Sending to API:', {
      userRole,
      userBranch,
      branchSpecKeys: Object.keys(processedData.branchSpecifications),
      stockKeys: Object.keys(processedData.stock)
    })

    const response = await fetch('/api/products', {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(processedData),
    })

    if (!response.ok) {
      if (response.status === 401) {
        window.location.href = '/admin/login'
        return
      }
      const errorData = await response.json()
      throw new Error(errorData.error || 'Failed to update product')
    }

    const result = await response.json()

    // 🔧 CRITICAL FIX: Upload new images and immediately update state
    const newImages = images.filter((img) => img.isNew && img.file)
    if (newImages.length > 0) {
      console.log('📤 Uploading', newImages.length, 'new images...')
      
      const formData = new FormData()
      formData.append('productId', productId)
      newImages.forEach((image) => {
        formData.append('images', image.file)
      })

      const imageResponse = await fetch('/api/products', {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('auth-token')}`
        },
        body: formData,
      })

      if (imageResponse.ok) {
        const imageResult = await imageResponse.json()
        console.log('✅ Images uploaded successfully:', imageResult.uploadedImages)
        
        // 🔧 CRITICAL FIX: Immediately update images state with uploaded info
        setImages((prevImages) => {
          const updatedImages = prevImages.map((img, index) => {
            if (img.isNew) {
              const uploadedImg = imageResult.uploadedImages.find(
                (uploaded) => uploaded.alt.includes(img.alt.split(' ').pop())
              )
              if (uploadedImg) {
                return {
                  ...img,
                  url: uploadedImg.url,
                  publicId: uploadedImg.publicId,
                  isNew: false,
                }
              }
            }
            return img
          })
          
          console.log('📷 Updated images after upload:', updatedImages.length)
          return updatedImages
        })
      } else {
        console.warn('⚠️ Image upload failed but product updated successfully')
      }
    }

    setOriginalProduct(result.product)

    if (!isSilent) {
      Swal.fire({
        icon: 'success',
        title: 'Success!',
        text: 'Product has been updated successfully!',
        confirmButtonColor: '#8B5CF6',
      })
    } else {
      console.log('✅ Auto-save completed successfully')
      Swal.fire({
        icon: 'success',
        title: 'Auto-saved',
        timer: 1500,
        showConfirmButton: false,
        toast: true,
        position: 'top-end',
      })
    }
  } catch (error) {
    console.error('❌ Save error:', error)
    if (!isSilent) {
      Swal.fire({
        icon: 'error',
        title: 'Oops...',
        text: 'Error updating product: ' + error.message,
        confirmButtonColor: '#8B5CF6',
      })
    }
  } finally {
    setIsSaving(false)
    console.log('🏁 Save process completed')
  }
}, [productId, stock, images, isSaving, branchSpecifications, userRole, userBranch])

  // Auto-save functionality with stable dependencies
  const watchedValues = watch()
  
  useEffect(() => {
    // Only setup auto-save if all conditions are met
    if (autoSaveEnabled && originalProduct && isDirty && !isSaving) {
      console.log('🔄 Setting up auto-save timer...', { 
        autoSaveEnabled, 
        hasOriginalProduct: !!originalProduct, 
        isDirty, 
        isSaving 
      })
      
      const timer = setTimeout(() => {
        console.log('⏰ Auto-save timer triggered, calling handleSave')
        handleSave(watchedValues, true) // Silent save
      }, 3000)

      // Cleanup function to clear timer
      return () => {
        console.log('🧹 Clearing auto-save timer')
        clearTimeout(timer)
      }
    } else {
      console.log('⏸️ Auto-save conditions not met:', {
        autoSaveEnabled,
        hasOriginalProduct: !!originalProduct,
        isDirty,
        isSaving
      })
    }
  }, [autoSaveEnabled, originalProduct, isDirty, isSaving, watchedValues, handleSave])

  // Handle branch updates from modal
  const handleBranchUpdate = (updatedBranches) => {
    setBranches(updatedBranches)

    // Update stock object to include new branches and preserve existing stock
    const newStock = {}
    updatedBranches.forEach((branch) => {
      newStock[`${branch}_stock`] = stock[`${branch}_stock`] || 0
    })
    setStock(newStock)
  }

  // 🔧 FIXED: Image handlers with immediate state updates
  const handleImageAdd = (newImage) => {
    console.log('➕ Adding new image:', newImage.alt)
    setImages((prevImages) => {
      const updatedImages = [...prevImages, newImage]
      console.log('📷 Updated images array:', updatedImages.length)
      return updatedImages
    })
  }

  const handleImageDelete = async (imageId, publicId) => {
    const result = await Swal.fire({
      title: 'Delete Image?',
      text: 'This action cannot be undone.',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#d33',
      cancelButtonColor: '#3085d6',
      confirmButtonText: 'Yes, delete it!',
    })

    if (result.isConfirmed) {
      try {
        // If it's an existing image (has publicId), delete from Cloudinary
        if (publicId && productId) {
          const response = await fetch(
            `/api/products?productId=${productId}&imagePublicId=${publicId}`,
            {
              method: 'DELETE',
              headers: getAuthHeaders()
            }
          )

          if (!response.ok) {
            if (response.status === 401) {
              window.location.href = '/admin/login'
              return
            }
            throw new Error('Failed to delete image')
          }
        }

        // Remove from local state
        setImages((prev) =>
          prev.filter((img) => (img.id || img.publicId) !== imageId)
        )

        Swal.fire({
          icon: 'success',
          title: 'Deleted!',
          text: 'Image has been deleted.',
          timer: 2000,
          showConfirmButton: false,
          toast: true,
          position: 'top-end',
        })
      } catch (error) {
        console.error('Error deleting image:', error)
        Swal.fire({
          icon: 'error',
          title: 'Error',
          text: 'Failed to delete image',
          timer: 2000,
          showConfirmButton: false,
          toast: true,
          position: 'top-end',
        })
      }
    }
  }

  // 🔧 FIXED: Image reorder handler with immediate state update and force refresh
  const handleImageReorder = (reorderedImages) => {
    console.log('🔄 Reordering images:', reorderedImages.length)
    
    // Immediately update state
    setImages(reorderedImages)
    
    // Force a re-render by updating each image with isMain flag
    const updatedImages = reorderedImages.map((img, index) => ({
      ...img,
      isMain: index === 0 // Explicitly mark the first image as main
    }))
    
    // Update again to ensure the "Main" badge updates immediately
    setTimeout(() => {
      setImages(updatedImages)
    }, 0)
  }

  // Stock management with restrictions for moderators
  const updateStock = (branchKey, value) => {
    if (userRole === 'moderator') {
      if (!userBranch) {
        console.log('User branch not loaded yet')
        return
      }

      const expectedBranchKey = `${userBranch}_stock`
      
      if (branchKey === expectedBranchKey) {
        // ✅ ALLOWED: Update moderator's branch stock
        console.log(`Updating ${branchKey} for moderator branch ${userBranch}`)
        setStock((prev) => ({ ...prev, [branchKey]: parseInt(value) || 0 }))
      } else {
        // ❌ RESTRICTED: Show restriction message
        console.log(`Blocked update attempt: ${branchKey} by moderator assigned to ${userBranch}`)
        Swal.fire({
          icon: 'warning',
          title: 'Access Restricted',
          text: `You can only manage stock for ${userBranch} branch.`,
          timer: 3000,
          showConfirmButton: false,
          toast: true,
          position: 'top-end',
        })
      }
    } else {
      // Admin can update any branch
      setStock((prev) => ({ ...prev, [branchKey]: parseInt(value) || 0 }))
    }
  }

  // Category handlers (admin only)
  const handleAddCustomCategory = async () => {
    if (userRole === 'moderator') {
      Swal.fire({
        icon: 'warning',
        title: 'Access Restricted',
        text: 'Only administrators can add custom categories.',
        timer: 2000,
        showConfirmButton: false,
        toast: true,
        position: 'top-end',
      })
      return
    }

    if (customCategoryInput.trim()) {
      try {
        const response = await fetch('/api/products', {
          method: 'POST',
          headers: getAuthHeaders(),
          body: JSON.stringify({
            action: 'add_category',
            categoryName: customCategoryInput.toUpperCase(),
            subcategories: [],
          }),
        })

        if (response.ok) {
          setCategories((prev) => ({
            ...prev,
            [customCategoryInput.toUpperCase()]: [],
          }))
          setValue('category', customCategoryInput.toUpperCase())
          setCustomCategoryInput('')
          setIsAddingCustomCategory(false)

          Swal.fire({
            icon: 'success',
            title: 'Category Added!',
            text: 'Custom category has been added successfully',
            timer: 2000,
            showConfirmButton: false,
            toast: true,
            position: 'top-end',
          })
        } else {
          if (response.status === 401) {
            window.location.href = '/admin/login'
            return
          }
          throw new Error('Failed to add category')
        }
      } catch (error) {
        console.error('Error adding category:', error)
        Swal.fire({
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
    if (userRole === 'moderator') {
      Swal.fire({
        icon: 'warning',
        title: 'Access Restricted',
        text: 'Only administrators can add custom subcategories.',
        timer: 2000,
        showConfirmButton: false,
        toast: true,
        position: 'top-end',
      })
      return
    }

    if (customSubcategoryInput.trim() && category) {
      try {
        const response = await fetch('/api/products', {
          method: 'POST',
          headers: getAuthHeaders(),
          body: JSON.stringify({
            action: 'add_subcategory',
            categoryName: category,
            subcategoryName: customSubcategoryInput,
          }),
        })

        if (response.ok) {
          setCategories((prev) => ({
            ...prev,
            [category]: [...(prev[category] || []), customSubcategoryInput],
          }))
          setSubCategoryOptions((prev) => [...prev, customSubcategoryInput])
          setValue('subcategory', customSubcategoryInput)
          setCustomSubcategoryInput('')
          setIsAddingCustomSubcategory(false)

          Swal.fire({
            icon: 'success',
            title: 'Subcategory Added!',
            text: 'Custom subcategory has been added successfully',
            timer: 2000,
            showConfirmButton: false,
            toast: true,
            position: 'top-end',
          })
        } else {
          if (response.status === 401) {
            window.location.href = '/admin/login'
            return
          }
          throw new Error('Failed to add subcategory')
        }
      } catch (error) {
        console.error('Error adding subcategory:', error)
        Swal.fire({
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

  // Barcode scanner
  const handleBarcodeScan = async (data) => {
    try {
      if (data) {
        console.log('Scanned barcode:', data)

        const response = await fetch(`/api/products?barcode=${data}`, {
          headers: getAuthHeaders()
        })
        if (response.ok) {
          const productData = await response.json()

          const result = await Swal.fire({
            title: 'Product Found!',
            text: 'Do you want to update this product with the scanned barcode data?',
            icon: 'question',
            showCancelButton: true,
            confirmButtonText: 'Yes, update it!',
            cancelButtonText: 'No, just set barcode',
          })

          if (result.isConfirmed) {
            setValue('name', productData.name || '')
            setValue('brand', productData.brand || '')
            setValue('price', productData.price || '')
            setValue('category', productData.category || '')
            setValue('subcategory', productData.subcategory || '')
            setValue('description', productData.description || '')
          }

          setValue('barcode', data)
        } else if (response.status === 401) {
          window.location.href = '/admin/login'
          return
        } else {
          setValue('barcode', data)
          Swal.fire({
            icon: 'info',
            title: 'Barcode Updated',
            text: 'Barcode has been updated successfully',
            timer: 2000,
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
    }
  }

  // Delete product (admin only)
  const handleDelete = async () => {
    if (userRole === 'moderator') {
      Swal.fire({
        icon: 'warning',
        title: 'Access Restricted',
        text: 'Only administrators can delete products.',
        confirmButtonColor: '#8B5CF6',
      })
      return
    }

    if (!checkAuth()) return

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
          headers: getAuthHeaders()
        })

        if (!response.ok) {
          if (response.status === 401) {
            window.location.href = '/admin/login'
            return
          }
          throw new Error('Failed to delete product')
        }

        Swal.fire({
          icon: 'success',
          title: 'Deleted!',
          text: 'Product has been deleted successfully.',
          timer: 2000,
          showConfirmButton: false,
        }).then(() => {
          onBack()
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

  // Undo changes
  const handleUndo = () => {
    Swal.fire({
      title: 'Undo Changes?',
      text: 'This will revert all unsaved changes.',
      icon: 'question',
      showCancelButton: true,
      confirmButtonText: 'Yes, undo changes',
      cancelButtonText: 'Cancel',
    }).then((result) => {
      if (result.isConfirmed) {
        reset({
          name: originalProduct.name || '',
          brand: originalProduct.brand || '',
          barcode: originalProduct.barcode || '',
          price: originalProduct.price || '',
          comparePrice: originalProduct.comparePrice || '',
          category: originalProduct.category || '',
          subcategory: originalProduct.subcategory || '',
          description: originalProduct.description || '',
          flavor: originalProduct.flavor || '',
          resistance: originalProduct.resistance || '',
          wattageRange: originalProduct.wattageRange || '',
          tags: originalProduct.tags ? originalProduct.tags.join(', ') : '',
          status: originalProduct.status || 'active',
        })

        // 🔧 NEW: Reset branch specifications
        setBranchSpecifications(originalProduct.branchSpecifications || {})

        setStock(originalProduct.stock || {})
        setImages(
          originalProduct.images
            ? originalProduct.images.map((img) => ({
                ...img,
                id: img.publicId || Math.random().toString(),
              }))
            : []
        )

        Swal.fire({
          icon: 'success',
          title: 'Changes Reverted',
          text: 'All changes have been undone',
          timer: 2000,
          showConfirmButton: false,
          toast: true,
          position: 'top-end',
        })
      }
    })
  }

  // Filter branches for stock display based on user role
  const getVisibleBranches = () => {
    if (userRole === 'moderator' && userBranch) {
      // Moderator can only see their assigned branch
      return [userBranch]
    }
    // Admin can see all branches
    return branches
  }

  if (userLoading || isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 via-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    )
  }

  if (!product) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 via-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center">
          <AlertCircle size={48} className="text-red-500 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            Product Not Found
          </h1>
          <p className="text-gray-600 mb-6">
            The product you're looking for doesn't exist.
          </p>
          <button
            onClick={onBack}
            className="px-6 py-3 bg-purple-600 text-white rounded-xl hover:bg-purple-700"
          >
            Go Back
          </button>
        </div>
      </div>
    )
  }

  const visibleBranches = getVisibleBranches()

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-blue-50 to-indigo-100 p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="max-w-6xl mx-auto"
      >
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
          <div className="flex items-center gap-4">
            <button
              onClick={onBack}
              className="p-2 bg-white rounded-xl shadow-lg hover:bg-gray-50"
            >
              <ArrowLeft size={20} />
            </button>
            <div>
              <h1 className="text-4xl font-bold text-gray-900 flex items-center gap-3">
                <Edit className="text-purple-600" size={40} />
                Edit Product
                {userRole === 'moderator' && (
                  <span className="text-sm bg-orange-100 text-orange-800 px-3 py-1 rounded-full font-medium">
                    Moderator
                  </span>
                )}
              </h1>
              <p className="text-gray-600">
                Update product information and settings
                {userRole === 'moderator' && userBranch && (
                  <span> • Managing <strong className="capitalize">{userBranch}</strong> branch</span>
                )}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 bg-white px-3 py-2 rounded-xl shadow-sm">
              <input
                type="checkbox"
                id="autosave"
                checked={autoSaveEnabled}
                onChange={(e) => {
                  setAutoSaveEnabled(e.target.checked)
                  console.log('🔄 Auto-save toggled:', e.target.checked)
                }}
                className="rounded text-purple-600"
              />
              <label htmlFor="autosave" className="text-sm text-gray-700">
                Auto-save
              </label>
            </div>

            <div className="flex items-center gap-2">
              <span
                className={`px-3 py-1 rounded-full text-sm ${
                  watch('status') === 'active'
                    ? 'bg-green-100 text-green-800'
                    : 'bg-gray-100 text-gray-800'
                }`}
              >
                {watch('status') === 'active' ? 'Active' : 'Inactive'}
              </span>
              <button
                onClick={() => {
                  const newStatus =
                    watch('status') === 'active' ? 'inactive' : 'active'
                  setValue('status', newStatus)
                }}
                className="p-2 bg-white rounded-xl shadow-sm hover:bg-gray-50"
                title="Toggle Status"
              >
                {watch('status') === 'active' ? (
                  <Eye size={20} />
                ) : (
                  <EyeOff size={20} />
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Main Form */}
        <div className="bg-white rounded-3xl shadow-2xl overflow-hidden">
          {/* Header with Actions */}
          <div className="bg-gradient-to-r from-purple-600 to-indigo-600 p-6">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
              <div className="text-white">
                <h2 className="text-2xl font-bold">Product Details</h2>
                <p className="opacity-90">Update your product information</p>
                {isDirty && (
                  <p className="text-yellow-200 text-sm mt-1 flex items-center gap-1">
                    <AlertCircle size={16} />
                    You have unsaved changes
                    {autoSaveEnabled && <span> • Auto-save enabled</span>}
                  </p>
                )}
              </div>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setShowBarcodeScanner(true)}
                  className="bg-white bg-opacity-20 text-purple-500 px-4 py-2 rounded-xl flex items-center gap-2 hover:bg-opacity-30"
                >
                  <Scan size={16} />
                  Scan Barcode
                </button>
                <button
                  type="button"
                  onClick={handleUndo}
                  disabled={!isDirty}
                  className="bg-white bg-opacity-20 text-purple-500 px-4 py-2 rounded-xl flex items-center gap-2 hover:bg-opacity-30 disabled:opacity-50"
                >
                  <RotateCcw size={16} />
                  Undo
                </button>
              </div>
            </div>
          </div>

          <form onSubmit={handleSubmit((data) => handleSave(data, false))} className="p-8">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Left Column */}
              <div className="space-y-6">
                {/* Basic Information */}
                <div className="space-y-4">
                  <h3 className="text-xl font-semibold text-gray-800 flex items-center gap-2">
                    <Package size={20} className="text-purple-600" />
                    Basic Information
                  </h3>

                  {/* Product Name */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Product Name *
                    </label>
                    <input
                      type="text"
                      {...register('name', {
                        required: 'Product name is required',
                      })}
                      placeholder="Enter product name"
                      className="w-full p-4 rounded-xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
                    />
                    {errors.name && (
                      <p className="text-red-500 text-sm mt-1 flex items-center gap-1">
                        <AlertCircle size={16} />
                        {errors.name.message}
                      </p>
                    )}
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
                </div>

                {/* Categories */}
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <h3 className="text-xl font-semibold text-gray-800 flex items-center gap-2">
                      <Tag size={20} className="text-purple-600" />
                      Categories
                    </h3>
                    {userRole === 'moderator' && (
                      <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded-full font-medium">
                        Editable
                      </span>
                    )}
                  </div>

                  {/* Category */}
                  <div>
                    <div className="flex justify-between items-center mb-2">
                      <label className="block text-sm font-medium text-gray-700">
                        Category *
                      </label>
                      {userRole === 'admin' && (
                        <button
                          type="button"
                          onClick={() =>
                            setIsAddingCustomCategory(!isAddingCustomCategory)
                          }
                          className="text-purple-600 hover:text-purple-700 text-sm flex items-center gap-1"
                        >
                          <Plus size={14} /> Add Custom
                        </button>
                      )}
                    </div>

                    {isAddingCustomCategory && userRole === 'admin' ? (
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
                        {Object.keys(categories).map((cat) => (
                          <option key={cat} value={cat}>
                            {cat}
                          </option>
                        ))}
                      </select>
                    )}
                    {errors.category && (
                      <p className="text-red-500 text-sm mt-1 flex items-center gap-1">
                        <AlertCircle size={16} />
                        {errors.category.message}
                      </p>
                    )}
                  </div>

                  {/* Subcategory */}
                  <div>
                    <div className="flex justify-between items-center mb-2">
                      <label className="block text-sm font-medium text-gray-700">
                        Subcategory *
                      </label>
                      {userRole === 'admin' && category && (
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

                    {isAddingCustomSubcategory && userRole === 'admin' ? (
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
                    {errors.subcategory && (
                      <p className="text-red-500 text-sm mt-1 flex items-center gap-1">
                        <AlertCircle size={16} />
                        {errors.subcategory.message}
                      </p>
                    )}
                  </div>

                  {userRole === 'moderator' && (
                    <div className="bg-green-50 border border-green-200 rounded-lg p-3 text-sm text-green-800">
                      <div className="flex items-center gap-2">
                        <Tag size={14} />
                        <span className="font-medium">Category Access:</span>
                      </div>
                      <p className="mt-1">
                        You can change product categories and subcategories, but cannot add new ones.
                      </p>
                    </div>
                  )}
                </div>

                {/* Pricing */}
                <div className="space-y-4">
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
                      {errors.price && (
                        <p className="text-red-500 text-sm mt-1 flex items-center gap-1">
                          <AlertCircle size={16} />
                          {errors.price.message}
                        </p>
                      )}
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
                </div>
              </div>

              {/* Right Column */}
              <div className="space-y-6">
                {/* 🔧 NEW: Branch-Specific Vape Specifications */}
                <div className="space-y-6">
                  <div className="flex justify-between items-center">
                    <h3 className="text-xl font-semibold text-gray-800 flex items-center gap-2">
                      <Zap size={20} className="text-purple-600" />
                      Branch-Specific Vape Specifications
                    </h3>
                    <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded-full font-medium">
                      {visibleBranches.length} Branches
                    </span>
                  </div>

                  {/* Branch-Specific Multi-Select Fields */}
                  {visibleBranches.map((branch) => (
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
                                options={NICOTINE_OPTIONS}
                                isMulti
                                closeMenuOnSelect={false}
                                placeholder={`Select strengths for ${branch}...`}
                                styles={selectStyles}
                                className="react-select-container"
                                classNamePrefix="react-select"
                                value={getBranchSpecificationValue(branch, 'nicotineStrength')}
                                onChange={(selected) => {
                                  updateBranchSpecification(branch, 'nicotineStrength', selected)
                                  field.onChange(selected)
                                }}
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
                                options={VG_PG_OPTIONS}
                                isMulti
                                closeMenuOnSelect={false}
                                placeholder={`Select ratios for ${branch}...`}
                                styles={selectStyles}
                                className="react-select-container"
                                classNamePrefix="react-select"
                                value={getBranchSpecificationValue(branch, 'vgPgRatio')}
                                onChange={(selected) => {
                                  updateBranchSpecification(branch, 'vgPgRatio', selected)
                                  field.onChange(selected)
                                }}
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
                                value={getBranchSpecificationValue(branch, 'colors')}
                                onChange={(selected) => {
                                  updateBranchSpecification(branch, 'colors', selected)
                                  field.onChange(selected)
                                }}
                                formatCreateLabel={(inputValue) =>
                                  `Add "${inputValue}" color`
                                }
                                onCreateOption={(inputValue) => {
                                  const newColor = detectColorFromInput(inputValue)
                                  if (newColor) {
                                    const currentColors = getBranchSpecificationValue(branch, 'colors')
                                    const updatedColors = [...currentColors, newColor]
                                    updateBranchSpecification(branch, 'colors', updatedColors)
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
                </div>

                {/* Stock Management */}
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <h3 className="text-xl font-semibold text-gray-800 flex items-center gap-2">
                      <Store size={20} className="text-purple-600" />
                      Stock Management ({visibleBranches.length} {visibleBranches.length === 1 ? 'branch' : 'branches'})
                    </h3>
                    {userRole !== 'moderator' ? (
                      <button
                        type="button"
                        onClick={() => setShowBranchModal(true)}
                        className="text-purple-600 hover:text-purple-700 text-sm flex items-center gap-1"
                      >
                        <Edit size={14} /> Manage Branches
                      </button>
                    ) : (
                      <span className="text-xs bg-orange-100 text-orange-800 px-2 py-1 rounded-full font-medium">
                        Your Branch Only
                      </span>
                    )}
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {visibleBranches.map((branch) => (
                      <div key={branch}>
                        <label className="block text-sm font-medium text-gray-700 mb-2 capitalize flex items-center gap-2">
                          {branch} Stock
                          {userRole === 'moderator' && (
                            <span className="text-green-600">
                              <Store size={14} />
                            </span>
                          )}
                        </label>
                        <input
                          type="number"
                          min="0"
                          value={stock[`${branch}_stock`] || 0}
                          onChange={(e) =>
                            updateStock(`${branch}_stock`, e.target.value)
                          }
                          className="w-full p-4 rounded-xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-purple-500 bg-white"
                          placeholder="0"
                        />
                      </div>
                    ))}
                  </div>

                  {visibleBranches.length === 0 && (
                    <div className="text-center py-8 text-gray-500">
                      <Store size={48} className="mx-auto mb-2" />
                      <p>
                        No branches configured. Please add branches to manage
                        stock.
                      </p>
                    </div>
                  )}

                  {userRole === 'moderator' && userBranch && (
                    <div className="bg-orange-50 border border-orange-200 rounded-lg p-4 text-sm text-orange-800">
                      <div className="flex items-center gap-2 mb-1">
                        <AlertCircle size={16} />
                        <span className="font-medium">Branch Access</span>
                      </div>
                      <p>
                        You can manage stock for your assigned branch:{' '}
                        <strong className="capitalize">{userBranch}</strong>
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Image Gallery */}
            <div className="mt-8">
              <ImageGallery
                images={images}
                onImageDelete={handleImageDelete}
                onImageReorder={handleImageReorder}
                onImageAdd={handleImageAdd}
                isLoading={isSaving}
              />
            </div>

            {/* Description & Tags */}
            <div className="mt-8 space-y-6">
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
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row gap-4 mt-8 pt-6 border-t border-gray-200">
              {userRole !== 'moderator' && (
                <button
                  type="button"
                  onClick={handleDelete}
                  className="px-6 py-4 bg-red-500 text-white rounded-xl font-semibold flex items-center justify-center gap-2 hover:bg-red-600 transition-colors"
                >
                  <Trash2 size={20} />
                  Delete Product
                </button>
              )}

              <div className="flex flex-1 gap-4">
                <button
                  type="button"
                  onClick={handleUndo}
                  disabled={!isDirty}
                  className="flex-1 py-4 px-6 bg-gray-100 text-gray-700 rounded-xl font-semibold flex items-center justify-center gap-2 hover:bg-gray-200 transition-colors disabled:opacity-50"
                >
                  <RotateCcw size={20} />
                  Undo Changes
                </button>

                <button
                  type="submit"
                  disabled={isSaving}
                  className="flex-1 py-4 px-6 bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-xl font-semibold flex items-center justify-center gap-2 hover:from-purple-700 hover:to-indigo-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isSaving ? (
                    <>
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                      Saving Changes...
                    </>
                  ) : (
                    <>
                      <Save size={20} />
                      Save Changes
                    </>
                  )}
                </button>
              </div>
            </div>
          </form>
        </div>

        {/* Branch Management Modal (Admin Only) */}
        <BranchModal
          isOpen={showBranchModal}
          onClose={() => setShowBranchModal(false)}
          branches={branches}
          onBranchUpdate={handleBranchUpdate}
          isAdmin={userRole === 'admin'}
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
                    Update Barcode
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
                    Position barcode in the frame to update
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
