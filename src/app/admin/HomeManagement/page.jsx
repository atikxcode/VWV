'use client'

import { useEffect, useState, useRef } from 'react'
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
  Settings,
  Plus,
  Edit2,
  ArrowUp,
  ArrowDown,
  Layers,
  AlignLeft,
  AlignCenter,
  AlignRight,
  Type,
  FileText,
  Link as LinkIcon,
  Grid3x3,
} from 'lucide-react'

const MySwal = Swal

export default function HomeManagementPage() {
  const [activeTab, setActiveTab] = useState('slider') // 'slider' or 'recommendation'
  const [loading, setLoading] = useState(true)

  // Get JWT token from localStorage
  const getAuthToken = () => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('auth-token') || sessionStorage.getItem('auth-token')
    }
    return null
  }

  useEffect(() => {
    fetchAllData()
  }, [])

  const fetchAllData = async () => {
    setLoading(true)
    try {
      // Both components will handle their own fetching
      await new Promise((resolve) => setTimeout(resolve, 500))
    } catch (error) {
      console.error('Error fetching data:', error)
    } finally {
      setLoading(false)
    }
  }

  // Animation variants
  const containerVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.6, staggerChildren: 0.1 },
    },
  }

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 },
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 via-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-purple-600 mx-auto"></div>
          <p className="mt-4 text-gray-600 font-medium">Loading home page data...</p>
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
        className="max-w-7xl mx-auto"
      >
        {/* Header */}
        <motion.div variants={itemVariants} className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2 flex items-center justify-center gap-3">
            <Settings className="text-purple-600" size={40} />
            Home Page Management
          </h1>
          <p className="text-gray-600">Manage slider and recommendation sections</p>
        </motion.div>

        {/* Tabs */}
        <motion.div variants={itemVariants} className="mb-6">
          <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
            <div className="flex border-b border-gray-200">
              <button
                onClick={() => setActiveTab('slider')}
                className={`flex-1 px-6 py-4 font-semibold transition-all flex items-center justify-center gap-2 ${
                  activeTab === 'slider'
                    ? 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white'
                    : 'text-gray-600 hover:bg-gray-50'
                }`}
              >
                <Layers size={20} />
                Slider Management
              </button>
              <button
                onClick={() => setActiveTab('recommendation')}
                className={`flex-1 px-6 py-4 font-semibold transition-all flex items-center justify-center gap-2 ${
                  activeTab === 'recommendation'
                    ? 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white'
                    : 'text-gray-600 hover:bg-gray-50'
                }`}
              >
                <Grid3x3 size={20} />
                Recommendation Section
              </button>
            </div>
          </div>
        </motion.div>

        {/* Content */}
        <AnimatePresence mode="wait">
          {activeTab === 'slider' ? (
            <motion.div
              key="slider"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              transition={{ duration: 0.3 }}
            >
              <SliderManagement getAuthToken={getAuthToken} />
            </motion.div>
          ) : (
            <motion.div
              key="recommendation"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.3 }}
            >
              <RecommendationManagement getAuthToken={getAuthToken} />
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  )
}

// ==================== SLIDER MANAGEMENT COMPONENT ====================
const SliderManagement = ({ getAuthToken }) => {
  const [slides, setSlides] = useState([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [editingSlide, setEditingSlide] = useState(null)
  const [showPreview, setShowPreview] = useState(false)
  const [previewSlide, setPreviewSlide] = useState(null)
  const [saving, setSaving] = useState(false)
  const [uploading, setUploading] = useState(false)

  const [formData, setFormData] = useState({
    id: '',
    title: '',
    subtitle: '',
    description: '',
    buttonText: 'Explore',
    alignment: 'center',
    alt: '',
    isActive: true,
  })

  const [imageFile, setImageFile] = useState(null)
  const [imagePreview, setImagePreview] = useState('')
  const fileInputRef = useRef(null)

  useEffect(() => {
    fetchSlides()
  }, [])

  const fetchSlides = async () => {
    try {
      setLoading(true)
      const token = getAuthToken()
      const headers = token ? { Authorization: `Bearer ${token}` } : {}

      const response = await fetch('/api/slider?includeInactive=true', { headers })
      const result = await response.json()

      if (result.success) {
        setSlides(result.slides || [])
      }
    } catch (error) {
      console.error('Error fetching slides:', error)
      MySwal.fire({
        icon: 'error',
        title: 'Error',
        text: 'Failed to load slides',
        confirmButtonColor: '#8B5CF6',
      })
    } finally {
      setLoading(false)
    }
  }

  const openCreateModal = () => {
    setEditingSlide(null)
    setFormData({
      id: `slide-${Date.now()}`,
      title: '',
      subtitle: '',
      description: '',
      buttonText: 'Explore',
      alignment: 'center',
      alt: '',
      isActive: true,
    })
    setImageFile(null)
    setImagePreview('')
    setShowModal(true)
  }

  const openEditModal = (slide) => {
    setEditingSlide(slide)
    setFormData({
      id: slide.id,
      title: slide.title,
      subtitle: slide.subtitle,
      description: slide.description,
      buttonText: slide.buttonText,
      alignment: slide.alignment,
      alt: slide.alt,
      isActive: slide.isActive,
    })
    setImagePreview(slide.image)
    setImageFile(null)
    setShowModal(true)
  }

  const handleImageSelect = (e) => {
    const file = e.target.files?.[0]
    if (!file) return

    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp']
    if (!allowedTypes.includes(file.type)) {
      MySwal.fire({
        icon: 'error',
        title: 'Invalid File Type',
        text: 'Only JPEG, PNG, and WebP are allowed',
        confirmButtonColor: '#8B5CF6',
      })
      return
    }

    if (file.size > 100 * 1024 * 1024) {
      MySwal.fire({
        icon: 'error',
        title: 'File Too Large',
        text: 'Maximum file size is 100MB',
        confirmButtonColor: '#8B5CF6',
      })
      return
    }

    setImageFile(file)
    setImagePreview(URL.createObjectURL(file))
  }

  const handleSaveSlide = async (e) => {
    e.preventDefault()

    if (!formData.title || !formData.subtitle) {
      MySwal.fire({
        icon: 'error',
        title: 'Validation Error',
        text: 'Please fill in all required fields',
        confirmButtonColor: '#8B5CF6',
      })
      return
    }

    setSaving(true)
    try {
      const token = getAuthToken()
      if (!token) {
        throw new Error('Authentication required')
      }

      // Step 1: Save slide data
      const slideData = {
        action: editingSlide ? 'update' : 'create',
        slideData: formData,
      }

      if (editingSlide) {
        slideData.id = editingSlide.id
      }

      const response = await fetch('/api/slider', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(slideData),
      })

      const data = await response.json()

      if (!data.success) {
        throw new Error(data.error || 'Failed to save slide')
      }

      // Step 2: Upload image if new image selected
      if (imageFile) {
        setUploading(true)
        const formDataImg = new FormData()
        formDataImg.append('image', imageFile)
        formDataImg.append('slideId', formData.id)

        const uploadResponse = await fetch('/api/slider', {
          method: 'PUT',
          headers: {
            Authorization: `Bearer ${token}`,
          },
          body: formDataImg,
        })

        const uploadData = await uploadResponse.json()
        if (!uploadData.success) {
          throw new Error('Failed to upload image')
        }
        setUploading(false)
      }

      MySwal.fire({
        icon: 'success',
        title: 'Success!',
        text: editingSlide ? 'Slide updated successfully' : 'Slide created successfully',
        timer: 2000,
        showConfirmButton: false,
        toast: true,
        position: 'top-end',
      })

      setShowModal(false)
      setTimeout(() => {
        fetchSlides()
      }, 500)
    } catch (error) {
      console.error('Error saving slide:', error)
      MySwal.fire({
        icon: 'error',
        title: 'Error',
        text: error.message,
        confirmButtonColor: '#8B5CF6',
      })
    } finally {
      setSaving(false)
      setUploading(false)
    }
  }

  const handleToggleActive = async (slideId, currentStatus) => {
    try {
      const token = getAuthToken()
      if (!token) {
        throw new Error('Authentication required')
      }

      const response = await fetch(`/api/slider?id=${slideId}&action=toggle`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })

      const data = await response.json()
      if (data.success) {
        MySwal.fire({
          icon: 'success',
          title: 'Success!',
          text: `Slide ${currentStatus ? 'deactivated' : 'activated'}`,
          timer: 2000,
          showConfirmButton: false,
          toast: true,
          position: 'top-end',
        })
        fetchSlides()
      }
    } catch (error) {
      console.error('Error toggling slide:', error)
      MySwal.fire({
        icon: 'error',
        title: 'Error',
        text: 'Failed to update slide status',
        confirmButtonColor: '#8B5CF6',
      })
    }
  }

  const handleDeleteSlide = async (slideId) => {
    const result = await MySwal.fire({
      title: 'Delete Slide?',
      text: 'Are you sure you want to delete this slide? This action cannot be undone.',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#d33',
      cancelButtonColor: '#3085d6',
      confirmButtonText: 'Yes, delete it!',
      cancelButtonText: 'Cancel',
    })

    if (!result.isConfirmed) return

    try {
      const token = getAuthToken()
      if (!token) {
        throw new Error('Authentication required')
      }

      const response = await fetch(`/api/slider?id=${slideId}&action=delete`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })

      const data = await response.json()
      if (data.success) {
        MySwal.fire({
          icon: 'success',
          title: 'Deleted!',
          text: 'Slide deleted successfully',
          timer: 2000,
          showConfirmButton: false,
          toast: true,
          position: 'top-end',
        })
        fetchSlides()
      }
    } catch (error) {
      console.error('Error deleting slide:', error)
      MySwal.fire({
        icon: 'error',
        title: 'Error',
        text: 'Failed to delete slide',
        confirmButtonColor: '#8B5CF6',
      })
    }
  }

  const handleReorder = async (index, direction) => {
    const newSlides = [...slides]
    const targetIndex = direction === 'up' ? index - 1 : index + 1

    if (targetIndex < 0 || targetIndex >= newSlides.length) return

    ;[newSlides[index], newSlides[targetIndex]] = [newSlides[targetIndex], newSlides[index]]

    const updatedSlides = newSlides.map((slide, idx) => ({
      id: slide.id,
      order: idx,
    }))

    try {
      const token = getAuthToken()
      if (!token) {
        throw new Error('Authentication required')
      }

      const response = await fetch('/api/slider', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          action: 'reorder',
          slides: updatedSlides,
        }),
      })

      const data = await response.json()
      if (data.success) {
        MySwal.fire({
          icon: 'success',
          title: 'Success!',
          text: 'Slides reordered',
          timer: 1500,
          showConfirmButton: false,
          toast: true,
          position: 'top-end',
        })
        fetchSlides()
      }
    } catch (error) {
      console.error('Error reordering slides:', error)
      MySwal.fire({
        icon: 'error',
        title: 'Error',
        text: 'Failed to reorder slides',
        confirmButtonColor: '#8B5CF6',
      })
    }
  }

  const openPreview = (slide) => {
    setPreviewSlide(slide)
    setShowPreview(true)
  }

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 },
  }

  if (loading) {
    return (
      <div className="bg-white rounded-2xl shadow-xl p-12 text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-4 border-purple-600 mx-auto mb-4"></div>
        <p className="text-gray-600">Loading slides...</p>
      </div>
    )
  }

  return (
    <div>
      <motion.div variants={itemVariants} className="bg-white rounded-2xl shadow-xl">
        {/* Header */}
        <div className="bg-gradient-to-r from-purple-600 to-indigo-600 p-6 rounded-t-2xl">
          <div className="flex justify-between items-center">
            <div>
              <h2 className="text-2xl font-bold text-white mb-1">Slider Management</h2>
              <p className="text-purple-100">
                {slides.length} slide{slides.length !== 1 ? 's' : ''} configured
              </p>
            </div>
            <motion.button
              onClick={openCreateModal}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="flex items-center gap-2 bg-white text-purple-600 px-6 py-3 rounded-lg font-semibold hover:bg-purple-50 transition-colors shadow-lg"
            >
              <Plus size={20} />
              Add New Slide
            </motion.button>
          </div>
        </div>

        {/* Slides List */}
        <div className="p-6">
          {slides.length === 0 ? (
            <div className="text-center py-16 text-gray-500">
              <ImageIcon className="mx-auto text-6xl mb-4 opacity-30" size={80} />
              <h3 className="text-xl font-semibold mb-2">No Slides Yet</h3>
              <p className="mb-4">Create your first slide to get started</p>
              <button
                onClick={openCreateModal}
                className="inline-flex items-center gap-2 bg-purple-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-purple-700 transition-colors"
              >
                <Plus size={20} />
                Create First Slide
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              {slides.map((slide, index) => (
                <motion.div
                  key={slide.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className={`border-2 rounded-xl overflow-hidden transition-all hover:shadow-lg ${
                    slide.isActive ? 'border-purple-200 bg-white' : 'border-gray-200 bg-gray-50'
                  }`}
                >
                  <div className="flex gap-4 p-4">
                    {/* Image Preview */}
                    <div className="w-40 h-24 flex-shrink-0 bg-gray-100 rounded-lg overflow-hidden group cursor-pointer relative">
                      {slide.image ? (
                        <>
                          <img
                            src={slide.image}
                            alt={slide.alt}
                            className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                          />
                          <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-colors flex items-center justify-center">
                            <Eye
                              className="text-white opacity-0 group-hover:opacity-100 transition-opacity"
                              size={24}
                              onClick={() => openPreview(slide)}
                            />
                          </div>
                        </>
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-gray-400">
                          <ImageIcon size={32} />
                        </div>
                      )}
                    </div>

                    {/* Slide Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1 min-w-0">
                          <h3 className="font-bold text-lg text-gray-900 truncate">{slide.title}</h3>
                          <p className="text-sm text-gray-600 truncate">{slide.subtitle}</p>
                          <p className="text-xs text-gray-500 mt-1 line-clamp-2">{slide.description}</p>
                          <div className="flex items-center gap-2 mt-2 flex-wrap">
                            <span className="text-xs bg-purple-100 text-purple-700 px-3 py-1 rounded-full font-medium flex items-center gap-1">
                              {slide.alignment === 'left' && <AlignLeft size={12} />}
                              {slide.alignment === 'center' && <AlignCenter size={12} />}
                              {slide.alignment === 'right' && <AlignRight size={12} />}
                              {slide.alignment}
                            </span>
                            <span
                              className={`text-xs px-3 py-1 rounded-full font-medium ${
                                slide.isActive
                                  ? 'bg-green-100 text-green-700'
                                  : 'bg-gray-200 text-gray-600'
                              }`}
                            >
                              {slide.isActive ? 'Active' : 'Inactive'}
                            </span>
                            {slide.buttonText && (
                              <span className="text-xs bg-blue-100 text-blue-700 px-3 py-1 rounded-full font-medium">
                                Button: {slide.buttonText}
                              </span>
                            )}
                          </div>
                        </div>

                        {/* Actions */}
                        <div className="flex gap-2">
                          {/* Reorder */}
                          <div className="flex flex-col gap-1">
                            <motion.button
                              onClick={() => handleReorder(index, 'up')}
                              disabled={index === 0}
                              whileHover={{ scale: 1.1 }}
                              whileTap={{ scale: 0.9 }}
                              className="p-2 text-gray-600 hover:text-purple-600 hover:bg-purple-50 rounded transition-colors disabled:opacity-30 disabled:cursor-not-allowed disabled:hover:bg-transparent"
                              title="Move up"
                            >
                              <ArrowUp size={16} />
                            </motion.button>
                            <motion.button
                              onClick={() => handleReorder(index, 'down')}
                              disabled={index === slides.length - 1}
                              whileHover={{ scale: 1.1 }}
                              whileTap={{ scale: 0.9 }}
                              className="p-2 text-gray-600 hover:text-purple-600 hover:bg-purple-50 rounded transition-colors disabled:opacity-30 disabled:cursor-not-allowed disabled:hover:bg-transparent"
                              title="Move down"
                            >
                              <ArrowDown size={16} />
                            </motion.button>
                          </div>

                          {/* Edit */}
                          <motion.button
                            onClick={() => openEditModal(slide)}
                            whileHover={{ scale: 1.1 }}
                            whileTap={{ scale: 0.9 }}
                            className="p-2 text-blue-600 hover:bg-blue-50 rounded transition-colors"
                            title="Edit"
                          >
                            <Edit2 size={18} />
                          </motion.button>

                          {/* Toggle */}
                          <motion.button
                            onClick={() => handleToggleActive(slide.id, slide.isActive)}
                            whileHover={{ scale: 1.1 }}
                            whileTap={{ scale: 0.9 }}
                            className="p-2 text-gray-600 hover:bg-gray-100 rounded transition-colors"
                            title={slide.isActive ? 'Deactivate' : 'Activate'}
                          >
                            {slide.isActive ? <ToggleRight size={18} /> : <ToggleLeft size={18} />}
                          </motion.button>

                          {/* Delete */}
                          <motion.button
                            onClick={() => handleDeleteSlide(slide.id)}
                            whileHover={{ scale: 1.1 }}
                            whileTap={{ scale: 0.9 }}
                            className="p-2 text-red-600 hover:bg-red-50 rounded transition-colors"
                            title="Delete"
                          >
                            <Trash2 size={18} />
                          </motion.button>
                        </div>
                      </div>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </div>
      </motion.div>

      {/* Slide Modal */}
      <AnimatePresence>
        {showModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/40 backdrop-blur-sm p-4"
            onClick={() => setShowModal(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white rounded-2xl max-w-3xl w-full max-h-[90vh] overflow-y-auto shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="sticky top-0 bg-gradient-to-r from-purple-600 to-indigo-600 p-6 rounded-t-2xl z-10">
                <div className="flex justify-between items-center">
                  <div>
                    <h3 className="text-2xl font-bold text-white">
                      {editingSlide ? 'Edit Slide' : 'Create New Slide'}
                    </h3>
                    <p className="text-purple-100 text-sm">
                      {editingSlide ? 'Update slide information' : 'Add a new slide to your homepage'}
                    </p>
                  </div>
                  <button
                    onClick={() => setShowModal(false)}
                    className="text-white hover:bg-white/20 p-2 rounded-full transition-colors"
                  >
                    <X size={24} />
                  </button>
                </div>
              </div>

              <form onSubmit={handleSaveSlide} className="p-6 space-y-6">
                {/* Image Upload */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
                    <ImageIcon size={16} className="text-purple-600" />
                    Slide Image *
                  </label>
                  <div className="border-2 border-dashed border-purple-300 rounded-xl p-4 hover:border-purple-400 transition-colors">
                    {imagePreview ? (
                      <div className="relative group">
                        <img
                          src={imagePreview}
                          alt="Preview"
                          className="w-full h-64 object-cover rounded-lg"
                        />
                        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-colors rounded-lg flex items-center justify-center">
                          <button
                            type="button"
                            onClick={() => {
                              setImagePreview('')
                              setImageFile(null)
                              if (fileInputRef.current) {
                                fileInputRef.current.value = ''
                              }
                            }}
                            className="opacity-0 group-hover:opacity-100 transition-opacity bg-red-500 text-white p-3 rounded-full hover:bg-red-600"
                          >
                            <Trash2 size={20} />
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="text-center py-8">
                        <Upload className="mx-auto h-16 w-16 text-purple-400 mb-3" />
                        <p className="text-gray-600 mb-2 font-medium">Upload slide image</p>
                        <p className="text-xs text-gray-500 mb-4">PNG, JPG, WEBP up to 100MB</p>
                        <input
                          ref={fileInputRef}
                          type="file"
                          accept="image/*"
                          onChange={handleImageSelect}
                          className="hidden"
                          id="slide-image-upload"
                        />
                        <label
                          htmlFor="slide-image-upload"
                          className="inline-block px-6 py-3 bg-purple-600 text-white rounded-lg cursor-pointer hover:bg-purple-700 transition-colors font-semibold"
                        >
                          Choose Image
                        </label>
                      </div>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Title */}
                  <div className="md:col-span-2">
                    <label className="block text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
                      <Type size={16} className="text-purple-600" />
                      Title *
                    </label>
                    <input
                      type="text"
                      value={formData.title}
                      onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all"
                      placeholder="e.g., Sale up to 70%"
                      required
                      maxLength={100}
                    />
                    <p className="mt-1 text-xs text-gray-500">{formData.title.length}/100 characters</p>
                  </div>

                  {/* Subtitle */}
                  <div className="md:col-span-2">
                    <label className="block text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
                      <Type size={16} className="text-purple-600" />
                      Subtitle *
                    </label>
                    <input
                      type="text"
                      value={formData.subtitle}
                      onChange={(e) => setFormData({ ...formData, subtitle: e.target.value })}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all"
                      placeholder="e.g., For Gentleman Vape"
                      required
                      maxLength={100}
                    />
                    <p className="mt-1 text-xs text-gray-500">
                      {formData.subtitle.length}/100 characters
                    </p>
                  </div>

                  {/* Description */}
                  <div className="md:col-span-2">
                    <label className="block text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
                      <FileText size={16} className="text-purple-600" />
                      Description
                    </label>
                    <textarea
                      value={formData.description}
                      onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all resize-none"
                      rows="3"
                      placeholder="Slide description..."
                      maxLength={500}
                    />
                    <p className="mt-1 text-xs text-gray-500">
                      {formData.description.length}/500 characters
                    </p>
                  </div>

                  {/* Button Text */}
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Button Text</label>
                    <input
                      type="text"
                      value={formData.buttonText}
                      onChange={(e) => setFormData({ ...formData, buttonText: e.target.value })}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all"
                      placeholder="e.g., Shop Now"
                      maxLength={50}
                    />
                  </div>

                  {/* Alignment */}
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Text Alignment
                    </label>
                    <select
                      value={formData.alignment}
                      onChange={(e) => setFormData({ ...formData, alignment: e.target.value })}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 bg-white transition-all"
                    >
                      <option value="left">Left</option>
                      <option value="center">Center</option>
                      <option value="right">Right</option>
                    </select>
                  </div>

                  {/* Alt Text */}
                  <div className="md:col-span-2">
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Alt Text (for accessibility)
                    </label>
                    <input
                      type="text"
                      value={formData.alt}
                      onChange={(e) => setFormData({ ...formData, alt: e.target.value })}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all"
                      placeholder="Image description for screen readers"
                      maxLength={100}
                    />
                  </div>

                  {/* Active Status */}
                  <div className="md:col-span-2">
                    <div className="flex items-center gap-3 bg-gray-50 p-4 rounded-lg">
                      <input
                        type="checkbox"
                        id="isActive"
                        checked={formData.isActive}
                        onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                        className="w-5 h-5 text-purple-600 rounded focus:ring-purple-500 border-gray-300"
                      />
                      <label htmlFor="isActive" className="text-sm font-medium text-gray-700">
                        Active (show on website)
                      </label>
                    </div>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex gap-3 pt-4 border-t">
                  <button
                    type="button"
                    onClick={() => setShowModal(false)}
                    className="flex-1 px-6 py-3 border-2 border-gray-300 text-gray-700 rounded-lg font-semibold hover:bg-gray-50 transition-colors"
                  >
                    Cancel
                  </button>
                  <motion.button
                    type="submit"
                    disabled={saving || uploading}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    className="flex-1 bg-gradient-to-r from-purple-600 to-indigo-600 text-white px-6 py-3 rounded-lg font-semibold hover:from-purple-700 hover:to-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2"
                  >
                    {saving || uploading ? (
                      <>
                        <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                        {uploading ? 'Uploading...' : 'Saving...'}
                      </>
                    ) : (
                      <>
                        <Save size={20} />
                        {editingSlide ? 'Update Slide' : 'Create Slide'}
                      </>
                    )}
                  </motion.button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Preview Modal */}
      <AnimatePresence>
        {showPreview && previewSlide && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
            onClick={() => setShowPreview(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="relative w-full max-w-5xl bg-white p-4 rounded-2xl shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            >
              <button
                onClick={() => setShowPreview(false)}
                className="absolute -top-4 -right-4 z-10 bg-black text-white rounded-full w-10 h-10 flex items-center justify-center hover:bg-gray-800 transition-colors shadow-lg"
              >
                <X size={20} />
              </button>

              <div
                className="relative w-full h-[500px] bg-cover bg-center flex items-center justify-center rounded-xl overflow-hidden"
                style={{
                  backgroundImage: `url(${previewSlide.image})`,
                }}
              >
                <div className="absolute inset-0 bg-black/40"></div>

                <div
                  className={`relative text-center px-8 ${
                    previewSlide.alignment === 'left'
                      ? 'text-left self-center mr-auto ml-8'
                      : previewSlide.alignment === 'right'
                      ? 'text-right self-center ml-auto mr-8'
                      : 'text-center'
                  }`}
                >
                  <p className="text-sm tracking-widest text-white mb-2 uppercase">
                    {previewSlide.subtitle}
                  </p>
                  <h2 className="text-5xl font-extrabold text-white tracking-wide mb-4">
                    {previewSlide.title}
                  </h2>
                  <p className="text-white font-medium max-w-2xl mb-6">
                    {previewSlide.description}
                  </p>
                  {previewSlide.buttonText && (
                    <button className="bg-purple-600 hover:bg-purple-700 text-white px-8 py-3 text-sm uppercase tracking-widest transition-all font-semibold rounded">
                      {previewSlide.buttonText}
                    </button>
                  )}
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

// ==================== RECOMMENDATION MANAGEMENT COMPONENT ====================
const RecommendationManagement = ({ getAuthToken }) => {
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [recommendation, setRecommendation] = useState(null)
  const [showPreview, setShowPreview] = useState(false)

  const [formData, setFormData] = useState({
    headerTitle: '',
    headerSubtitle: '',
    mainTitle: '',
    mainSubtitle: '',
    buttonText: 'Explore Now',
    buttonLink: '/products',
    isActive: true,
  })

  const [mainImageFile, setMainImageFile] = useState(null)
  const [mainImagePreview, setMainImagePreview] = useState('')
  const [backgroundImageFile, setBackgroundImageFile] = useState(null)
  const [backgroundImagePreview, setBackgroundImagePreview] = useState('')
  const [subImages, setSubImages] = useState([])

  const mainImageInputRef = useRef(null)
  const backgroundImageInputRef = useRef(null)

  useEffect(() => {
    fetchRecommendation()
  }, [])

  const fetchRecommendation = async () => {
    try {
      setLoading(true)
      const token = getAuthToken()
      const headers = token ? { Authorization: `Bearer ${token}` } : {}

      const response = await fetch('/api/recommendation?includeInactive=true', { headers })
      
      if (response.status === 404) {
        setLoading(false)
        return
      }
      
      const result = await response.json()

      if (result.success && result.recommendation) {
        const rec = result.recommendation
        setRecommendation(rec)
        setFormData({
          headerTitle: rec.headerTitle || '',
          headerSubtitle: rec.headerSubtitle || '',
          mainTitle: rec.mainTitle || '',
          mainSubtitle: rec.mainSubtitle || '',
          buttonText: rec.buttonText || 'Explore Now',
          buttonLink: rec.buttonLink || '/products',
          isActive: rec.isActive !== false,
        })
        setMainImagePreview(rec.mainImage || '')
        setBackgroundImagePreview(rec.backgroundImage || '')
        setSubImages(rec.subImages || [])
      }
    } catch (error) {
      console.error('Error fetching recommendation:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleMainImageSelect = (e) => {
    const file = e.target.files?.[0]
    if (!file) return

    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp']
    if (!allowedTypes.includes(file.type)) {
      MySwal.fire({
        icon: 'error',
        title: 'Invalid File Type',
        text: 'Only JPEG, PNG, and WebP are allowed',
        confirmButtonColor: '#8B5CF6',
      })
      return
    }

    if (file.size > 100 * 1024 * 1024) {
      MySwal.fire({
        icon: 'error',
        title: 'File Too Large',
        text: 'Maximum file size is 100MB',
        confirmButtonColor: '#8B5CF6',
      })
      return
    }

    setMainImageFile(file)
    setMainImagePreview(URL.createObjectURL(file))
  }

  const handleBackgroundImageSelect = (e) => {
    const file = e.target.files?.[0]
    if (!file) return

    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp']
    if (!allowedTypes.includes(file.type)) {
      MySwal.fire({
        icon: 'error',
        title: 'Invalid File Type',
        text: 'Only JPEG, PNG, and WebP are allowed',
        confirmButtonColor: '#8B5CF6',
      })
      return
    }

    if (file.size > 100 * 1024 * 1024) {
      MySwal.fire({
        icon: 'error',
        title: 'File Too Large',
        text: 'Maximum file size is 100MB',
        confirmButtonColor: '#8B5CF6',
      })
      return
    }

    setBackgroundImageFile(file)
    setBackgroundImagePreview(URL.createObjectURL(file))
  }

  const handleSubImageSelect = async (e, index) => {
  const file = e.target.files?.[0]
  if (!file) return

  const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp']
  if (!allowedTypes.includes(file.type)) {
    MySwal.fire({
      icon: 'error',
      title: 'Invalid File Type',
      text: 'Only JPEG, PNG, and WebP are allowed',
      confirmButtonColor: '#8B5CF6',
    })
    return
  }

  if (file.size > 100 * 1024 * 1024) {
    MySwal.fire({
      icon: 'error',
      title: 'File Too Large',
      text: 'Maximum file size is 100MB',
      confirmButtonColor: '#8B5CF6',
    })
    return
  }

  setUploading(true)
  try {
    const token = getAuthToken()
    if (!token) {
      throw new Error('Authentication required')
    }

    const formDataImg = new FormData()
    formDataImg.append('image', file)
    formDataImg.append('imageType', 'sub')
    formDataImg.append('subImageIndex', index.toString())

    const response = await fetch('/api/recommendation', {
      method: 'PUT',
      headers: {
        Authorization: `Bearer ${token}`,
      },
      body: formDataImg,
    })

    const data = await response.json()
    
    if (data.success) {
      MySwal.fire({
        icon: 'success',
        title: 'Success!',
        text: 'Sub-image uploaded',
        timer: 2000,
        showConfirmButton: false,
        toast: true,
        position: 'top-end',
      })
      
      // ✅ THIS IS THE FIX - Re-fetch recommendation data to update preview
      await fetchRecommendation()
    } else {
      throw new Error(data.error || 'Upload failed')
    }
  } catch (error) {
    console.error('Error uploading sub-image:', error)
    MySwal.fire({
      icon: 'error',
      title: 'Error',
      text: error.message || 'Failed to upload sub-image',
      confirmButtonColor: '#8B5CF6',
    })
  } finally {
    setUploading(false)
  }
}


  const handleSave = async (e) => {
    e.preventDefault()

    if (!formData.headerTitle || !formData.mainTitle) {
      MySwal.fire({
        icon: 'error',
        title: 'Validation Error',
        text: 'Please fill in all required fields',
        confirmButtonColor: '#8B5CF6',
      })
      return
    }

    setSaving(true)
    try {
      const token = getAuthToken()
      if (!token) {
        throw new Error('Authentication required')
      }

      // Step 1: Save text data
      const response = await fetch('/api/recommendation', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(formData),
      })

      const data = await response.json()
      if (!data.success) {
        throw new Error(data.error || 'Failed to save')
      }

      // Step 2: Upload main image if selected
      if (mainImageFile) {
        setUploading(true)
        const formDataImg = new FormData()
        formDataImg.append('image', mainImageFile)
        formDataImg.append('imageType', 'main')

        const uploadResponse = await fetch('/api/recommendation', {
          method: 'PUT',
          headers: {
            Authorization: `Bearer ${token}`,
          },
          body: formDataImg,
        })

        const uploadData = await uploadResponse.json()
        if (!uploadData.success) {
          throw new Error('Failed to upload main image')
        }
        setMainImageFile(null)
        setUploading(false)
      }

      // Step 3: Upload background image if selected
      if (backgroundImageFile) {
        setUploading(true)
        const formDataImg = new FormData()
        formDataImg.append('image', backgroundImageFile)
        formDataImg.append('imageType', 'background')

        const uploadResponse = await fetch('/api/recommendation', {
          method: 'PUT',
          headers: {
            Authorization: `Bearer ${token}`,
          },
          body: formDataImg,
        })

        const uploadData = await uploadResponse.json()
        if (!uploadData.success) {
          throw new Error('Failed to upload background image')
        }
        setBackgroundImageFile(null)
        setUploading(false)
      }

      MySwal.fire({
        icon: 'success',
        title: 'Success!',
        text: 'Recommendation section updated successfully',
        timer: 2000,
        showConfirmButton: false,
        toast: true,
        position: 'top-end',
      })

      setTimeout(() => {
        fetchRecommendation()
      }, 500)
    } catch (error) {
      console.error('Error saving recommendation:', error)
      MySwal.fire({
        icon: 'error',
        title: 'Error',
        text: error.message,
        confirmButtonColor: '#8B5CF6',
      })
    } finally {
      setSaving(false)
      setUploading(false)
    }
  }

  const handleToggleActive = async () => {
    try {
      const token = getAuthToken()
      if (!token) {
        throw new Error('Authentication required')
      }

      const response = await fetch('/api/recommendation?action=toggle', {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })

      const data = await response.json()
      if (data.success) {
        MySwal.fire({
          icon: 'success',
          title: 'Success!',
          text: `Section ${formData.isActive ? 'deactivated' : 'activated'}`,
          timer: 2000,
          showConfirmButton: false,
          toast: true,
          position: 'top-end',
        })
        fetchRecommendation()
      }
    } catch (error) {
      console.error('Error toggling status:', error)
      MySwal.fire({
        icon: 'error',
        title: 'Error',
        text: 'Failed to update status',
        confirmButtonColor: '#8B5CF6',
      })
    }
  }

  const handleDeleteSubImage = async (index) => {
    const result = await MySwal.fire({
      title: 'Delete Sub-Image?',
      text: 'Are you sure you want to delete this sub-image?',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#d33',
      cancelButtonColor: '#3085d6',
      confirmButtonText: 'Yes, delete it!',
      cancelButtonText: 'Cancel',
    })

    if (!result.isConfirmed) return

    try {
      const token = getAuthToken()
      if (!token) {
        throw new Error('Authentication required')
      }

      const response = await fetch(
        `/api/recommendation?action=deleteImage&imageType=sub&subImageIndex=${index}`,
        {
          method: 'DELETE',
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      )

      const data = await response.json()
      if (data.success) {
        MySwal.fire({
          icon: 'success',
          title: 'Deleted!',
          text: 'Sub-image deleted',
          timer: 2000,
          showConfirmButton: false,
          toast: true,
          position: 'top-end',
        })
        fetchRecommendation()
      }
    } catch (error) {
      console.error('Error deleting sub-image:', error)
      MySwal.fire({
        icon: 'error',
        title: 'Error',
        text: 'Failed to delete image',
        confirmButtonColor: '#8B5CF6',
      })
    }
  }

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 },
  }

  if (loading) {
    return (
      <div className="bg-white rounded-2xl shadow-xl p-12 text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-4 border-purple-600 mx-auto mb-4"></div>
        <p className="text-gray-600">Loading recommendation section...</p>
      </div>
    )
  }

  return (
    <div>
      <motion.div variants={itemVariants} className="bg-white rounded-2xl shadow-xl">
        {/* Header */}
        <div className="bg-gradient-to-r from-purple-600 to-indigo-600 p-6 rounded-t-2xl">
          <div className="flex justify-between items-center">
            <div>
              <h2 className="text-2xl font-bold text-white mb-1">Recommendation Section</h2>
              <p className="text-purple-100">Configure the recommendation display section</p>
            </div>
            <div className="flex gap-3">
              <button
                onClick={handleToggleActive}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg font-semibold transition-all ${
                  formData.isActive
                    ? 'bg-white text-green-700 hover:bg-green-50'
                    : 'bg-white/20 text-white hover:bg-white/30'
                }`}
              >
                {formData.isActive ? <ToggleRight size={20} /> : <ToggleLeft size={20} />}
                {formData.isActive ? 'Active' : 'Inactive'}
              </button>
              <button
                onClick={() => setShowPreview(true)}
                className="flex items-center gap-2 bg-white text-purple-600 px-4 py-2 rounded-lg font-semibold hover:bg-purple-50 transition-colors"
              >
                <Eye size={20} />
                Preview
              </button>
            </div>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSave} className="p-6 space-y-8">
          {/* Header Section */}
          <div className="border-2 border-purple-100 rounded-xl p-6 bg-purple-50/30">
            <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
              <Type size={20} className="text-purple-600" />
              Header Section
            </h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Header Title *
                </label>
                <input
                  type="text"
                  value={formData.headerTitle}
                  onChange={(e) => setFormData({ ...formData, headerTitle: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all"
                  placeholder="e.g., Explore Premium Vape Kits & E-Liquids"
                  required
                  maxLength={200}
                />
                <p className="mt-1 text-xs text-gray-500">
                  {formData.headerTitle.length}/200 characters
                </p>
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Header Subtitle
                </label>
                <input
                  type="text"
                  value={formData.headerSubtitle}
                  onChange={(e) => setFormData({ ...formData, headerSubtitle: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all"
                  placeholder="e.g., Bangladesh's #1 Vape Shop"
                  maxLength={200}
                />
                <p className="mt-1 text-xs text-gray-500">
                  {formData.headerSubtitle.length}/200 characters
                </p>
              </div>
            </div>
          </div>

          {/* Main Section */}
          <div className="border-2 border-indigo-100 rounded-xl p-6 bg-indigo-50/30">
            <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
              <ImageIcon size={20} className="text-indigo-600" />
              Main Content Section
            </h3>

            {/* Images */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
              {/* Main Image */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Main Image (Left Side)
                </label>
                <div className="border-2 border-dashed border-indigo-300 rounded-lg p-4 hover:border-indigo-400 transition-colors">
                  {mainImagePreview ? (
                    <div className="relative group">
                      <img
                        src={mainImagePreview}
                        alt="Main"
                        className="w-full h-48 object-cover rounded-lg"
                      />
                      <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-colors rounded-lg flex items-center justify-center">
                        <button
                          type="button"
                          onClick={() => {
                            setMainImageFile(null)
                            setMainImagePreview('')
                            if (mainImageInputRef.current) {
                              mainImageInputRef.current.value = ''
                            }
                          }}
                          className="opacity-0 group-hover:opacity-100 transition-opacity bg-red-500 text-white p-3 rounded-full hover:bg-red-600"
                        >
                          <Trash2 size={20} />
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <Upload className="mx-auto h-12 w-12 text-indigo-400 mb-2" />
                      <p className="text-gray-600 text-sm mb-2">Upload main image</p>
                      <input
                        ref={mainImageInputRef}
                        type="file"
                        accept="image/*"
                        onChange={handleMainImageSelect}
                        className="hidden"
                        id="main-image-upload"
                      />
                      <label
                        htmlFor="main-image-upload"
                        className="inline-block bg-indigo-600 text-white px-4 py-2 rounded-lg cursor-pointer hover:bg-indigo-700 transition-colors text-sm font-semibold"
                      >
                        Choose Image
                      </label>
                    </div>
                  )}
                </div>
              </div>

              {/* Background Image */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Background Image (Right Side)
                </label>
                <div className="border-2 border-dashed border-indigo-300 rounded-lg p-4 hover:border-indigo-400 transition-colors">
                  {backgroundImagePreview ? (
                    <div className="relative group">
                      <img
                        src={backgroundImagePreview}
                        alt="Background"
                        className="w-full h-48 object-cover rounded-lg"
                      />
                      <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-colors rounded-lg flex items-center justify-center">
                        <button
                          type="button"
                          onClick={() => {
                            setBackgroundImageFile(null)
                            setBackgroundImagePreview('')
                            if (backgroundImageInputRef.current) {
                              backgroundImageInputRef.current.value = ''
                            }
                          }}
                          className="opacity-0 group-hover:opacity-100 transition-opacity bg-red-500 text-white p-3 rounded-full hover:bg-red-600"
                        >
                          <Trash2 size={20} />
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <Upload className="mx-auto h-12 w-12 text-indigo-400 mb-2" />
                      <p className="text-gray-600 text-sm mb-2">Upload background image</p>
                      <input
                        ref={backgroundImageInputRef}
                        type="file"
                        accept="image/*"
                        onChange={handleBackgroundImageSelect}
                        className="hidden"
                        id="background-image-upload"
                      />
                      <label
                        htmlFor="background-image-upload"
                        className="inline-block bg-indigo-600 text-white px-4 py-2 rounded-lg cursor-pointer hover:bg-indigo-700 transition-colors text-sm font-semibold"
                      >
                        Choose Image
                      </label>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Text Content */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="md:col-span-2">
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Main Title *
                </label>
                <input
                  type="text"
                  value={formData.mainTitle}
                  onChange={(e) => setFormData({ ...formData, mainTitle: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all"
                  placeholder="e.g., Premium Vape Kits & E-Liquids 2025 Collection"
                  required
                  maxLength={200}
                />
                <p className="mt-1 text-xs text-gray-500">{formData.mainTitle.length}/200 characters</p>
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-semibold text-gray-700 mb-2">Main Subtitle</label>
                <input
                  type="text"
                  value={formData.mainSubtitle}
                  onChange={(e) => setFormData({ ...formData, mainSubtitle: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all"
                  placeholder="e.g., Explore the latest vape devices..."
                  maxLength={200}
                />
                <p className="mt-1 text-xs text-gray-500">
                  {formData.mainSubtitle.length}/200 characters
                </p>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
                  <Type size={16} className="text-purple-600" />
                  Button Text
                </label>
                <input
                  type="text"
                  value={formData.buttonText}
                  onChange={(e) => setFormData({ ...formData, buttonText: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all"
                  placeholder="e.g., Explore Now"
                  maxLength={50}
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
                  <LinkIcon size={16} className="text-purple-600" />
                  Button Link
                </label>
                <input
                  type="text"
                  value={formData.buttonLink}
                  onChange={(e) => setFormData({ ...formData, buttonLink: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all"
                  placeholder="/products"
                  maxLength={200}
                />
              </div>
            </div>
          </div>

          {/* Sub Images Section */}
          <div className="border-2 border-blue-100 rounded-xl p-6 bg-blue-50/30">
            <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
              <Grid3x3 size={20} className="text-blue-600" />
              Bottom Gallery Images
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {[0, 1, 2].map((index) => {
                const subImage = subImages[index]
                return (
                  <div
                    key={index}
                    className="border-2 border-dashed border-blue-300 rounded-lg p-4 hover:border-blue-400 transition-colors"
                  >
                    {subImage?.url ? (
                      <div className="relative group">
                        <img
                          src={subImage.url}
                          alt={subImage.alt || `Sub image ${index + 1}`}
                          className="w-full h-32 object-cover rounded-lg"
                        />
                        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-colors rounded-lg flex items-center justify-center">
                          <button
                            type="button"
                            onClick={() => handleDeleteSubImage(index)}
                            className="opacity-0 group-hover:opacity-100 transition-opacity bg-red-500 text-white p-2 rounded-full hover:bg-red-600"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="text-center py-6">
                        <ImageIcon className="mx-auto text-blue-400 mb-2" size={32} />
                        <p className="text-xs text-gray-600 mb-2">Sub-image {index + 1}</p>
                        <input
                          type="file"
                          accept="image/*"
                          onChange={(e) => handleSubImageSelect(e, index)}
                          className="hidden"
                          id={`sub-image-${index}`}
                          disabled={uploading}
                        />
                        <label
                          htmlFor={`sub-image-${index}`}
                          className="inline-block bg-blue-600 text-white text-xs px-3 py-2 rounded-lg cursor-pointer hover:bg-blue-700 transition-colors font-semibold"
                        >
                          Upload
                        </label>
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          </div>

          {/* Action Button */}
          <div className="pt-4 border-t">
            <motion.button
              type="submit"
              disabled={saving || uploading}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="w-full bg-gradient-to-r from-purple-600 to-indigo-600 text-white px-6 py-4 rounded-xl font-bold text-lg hover:from-purple-700 hover:to-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-3 shadow-lg"
            >
              {saving || uploading ? (
                <>
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-white"></div>
                  {uploading ? 'Uploading Images...' : 'Saving Changes...'}
                </>
              ) : (
                <>
                  <Save size={24} />
                  Save Recommendation Section
                </>
              )}
            </motion.button>
          </div>
        </form>
      </motion.div>

      {/* Preview Modal */}
      <AnimatePresence>
        {showPreview && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 overflow-y-auto"
            onClick={() => setShowPreview(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="relative bg-white rounded-2xl max-w-6xl w-full shadow-2xl my-8"
              onClick={(e) => e.stopPropagation()}
            >
              <button
                onClick={() => setShowPreview(false)}
                className="absolute -top-4 -right-4 z-10 bg-black text-white rounded-full w-10 h-10 flex items-center justify-center hover:bg-gray-800 transition-colors shadow-lg"
              >
                <X size={20} />
              </button>

              <div className="p-8">
                <h3 className="text-2xl font-bold text-center mb-8 text-gray-900">
                  Recommendation Section Preview
                </h3>

                {/* Header */}
                <div className="text-center mb-8">
                  <h2 className="text-2xl font-semibold text-purple-600 mb-2">
                    {formData.headerTitle || 'Header Title'}
                  </h2>
                  <p className="text-gray-600">{formData.headerSubtitle || 'Header Subtitle'}</p>
                </div>

                {/* Main Section */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                  {/* Main Image */}
                  <div className="rounded-xl overflow-hidden shadow-lg">
                    {mainImagePreview ? (
                      <img
                        src={mainImagePreview}
                        alt="Main"
                        className="w-full h-80 object-cover"
                      />
                    ) : (
                      <div className="w-full h-80 bg-gray-200 flex items-center justify-center">
                        <ImageIcon className="text-gray-400" size={64} />
                      </div>
                    )}
                  </div>

                  {/* Content Section */}
                  <div
                    className="rounded-xl overflow-hidden shadow-lg flex items-center justify-center p-8 relative"
                    style={{
                      backgroundImage: backgroundImagePreview
                        ? `url(${backgroundImagePreview})`
                        : 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                      backgroundSize: 'cover',
                      backgroundPosition: 'center',
                    }}
                  >
                    {backgroundImagePreview && (
                      <div className="absolute inset-0 bg-black/40"></div>
                    )}
                    <div className="relative text-white text-center">
                      <h2 className="text-3xl font-extrabold mb-4">
                        {formData.mainTitle || 'Main Title'}
                      </h2>
                      <p className="font-medium mb-6">
                        {formData.mainSubtitle || 'Main Subtitle'}
                      </p>
                      <button className="bg-purple-600 hover:bg-purple-700 text-white px-8 py-3 rounded-lg font-bold uppercase tracking-wide transition-colors">
                        {formData.buttonText || 'Button Text'}
                      </button>
                    </div>
                  </div>
                </div>

                {/* Sub Images */}
                <div className="grid grid-cols-3 gap-4">
                  {[0, 1, 2].map((index) => {
                    const subImage = subImages[index]
                    return (
                      <div key={index} className="rounded-lg overflow-hidden shadow-md">
                        {subImage?.url ? (
                          <img
                            src={subImage.url}
                            alt={subImage.alt || `Sub image ${index + 1}`}
                            className="w-full h-32 object-cover"
                          />
                        ) : (
                          <div className="w-full h-32 bg-gray-200 flex items-center justify-center">
                            <ImageIcon className="text-gray-400" size={32} />
                          </div>
                        )}
                      </div>
                    )
                  })}
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
