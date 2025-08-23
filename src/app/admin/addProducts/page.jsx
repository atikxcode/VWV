'use client'

import { useState, useEffect } from 'react'
import { useForm, Controller } from 'react-hook-form'
import { motion, AnimatePresence } from 'framer-motion'
import { PlusCircle, Upload, AlertCircle } from 'lucide-react'

const categoryOptions = {
  kids: [
    'coat-pant',
    'denim',
    'hoodie',
    'jacket',
    'shorts',
    'swipe-shirt',
    't-shirt',
    'trouser',
    'sweaters',
  ],
  women: [
    'coat-long-pants',
    'coat-tops',
    'denim-long-pants',
    'ladies-skirts',
    'tops',
    'twill',
    'sweaters',
    'ladies-leggings',
    'ladies-jumpsuit',
    'swimming-shorts',
    'ladies-shorts',
    'blazer',
    'jacket',
    'overalls',
  ],
  men: [
    'coat-jacket',
    'hoodie',
    'mens-cargo-pant',
    'mens-long-pant',
    'polo-shirt',
    'sweaters',
    'swipe-shirt',
    't-shirt',
    'swimming-shorts',
    'blazer',
    'mens-shorts',
    'panjabi',
    'jacket',
    'shirt',
  ],
}

export default function AddProduct() {
  const {
    register,
    handleSubmit,
    watch,
    control,
    formState: { errors },
  } = useForm()
  const [subCategoryOptions, setSubCategoryOptions] = useState([])
  const category = watch('category')

  useEffect(() => {
    if (category) {
      setSubCategoryOptions(categoryOptions[category])
    } else {
      setSubCategoryOptions([])
    }
  }, [category])

  const onSubmit = async (data) => {
    console.log('Submitted Data:', data)
    // Simulate API call
    await new Promise((resolve) => setTimeout(resolve, 1000))
    alert('Product added successfully!')
  }

  const inputVariants = {
    focus: {
      scale: 1.02,
      borderColor: '#8B5CF6',
      transition: { duration: 0.2 },
    },
    error: {
      borderColor: '#EF4444',
      x: [-5, 5, -5, 0],
      transition: { duration: 0.3 },
    },
  }

  const fadeIn = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.5 } },
  }

  return (
    <div className="min-h-screen bg-gradient-to-br  flex items-center justify-center p-4">
      <motion.div
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.6, ease: 'easeOut' }}
        className="bg-white rounded-2xl shadow-xl p-8 w-full max-w-md"
      >
        <motion.h2
          variants={fadeIn}
          initial="hidden"
          animate="visible"
          className="text-3xl font-bold text-gray-800 mb-6 text-center"
        >
          Add New Product
        </motion.h2>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          {/* Category */}
          <motion.div variants={fadeIn} initial="hidden" animate="visible">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Category
            </label>
            <motion.select
              variants={inputVariants}
              animate={errors.category ? 'error' : 'focus'}
              className="w-full p-3 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-purple-500 bg-white"
              {...register('category', { required: 'Category is required' })}
            >
              <option value="">Select Category</option>
              {Object.keys(categoryOptions).map((cat) => (
                <option key={cat} value={cat}>
                  {cat.charAt(0).toUpperCase() + cat.slice(1)}
                </option>
              ))}
            </motion.select>
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
          </motion.div>

          {/* Subcategory */}
          <motion.div variants={fadeIn} initial="hidden" animate="visible">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Subcategory
            </label>
            <Controller
              name="subcategory"
              control={control}
              rules={{ required: 'Subcategory is required' }}
              render={({ field }) => (
                <motion.select
                  variants={inputVariants}
                  animate={errors.subcategory ? 'error' : 'focus'}
                  className="w-full p-3 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-purple-500 bg-white"
                  {...field}
                >
                  <option value="">Select Subcategory</option>
                  {subCategoryOptions.map((option) => (
                    <option key={option} value={option}>
                      {option
                        .replace(/-/g, ' ')
                        .replace(/\b\w/g, (c) => c.toUpperCase())}
                    </option>
                  ))}
                </motion.select>
              )}
            />
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
          </motion.div>

          {/* Image Upload */}
          <motion.div variants={fadeIn} initial="hidden" animate="visible">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Product Image
            </label>
            <div className="relative">
              <input
                type="file"
                {...register('image', { required: 'Image is required' })}
                className="w-full p-3 rounded-lg border border-gray-300 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:bg-purple-100 file:text-purple-700 hover:file:bg-purple-200"
              />
              <Upload
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400"
                size={20}
              />
            </div>
            <AnimatePresence>
              {errors.image && (
                <motion.span
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="text-red-500 text-sm flex items-center gap-1 mt-1"
                >
                  <AlertCircle size={16} /> {errors.image.message}
                </motion.span>
              )}
            </AnimatePresence>
          </motion.div>

          {/* Fabric / Material */}
          <motion.div variants={fadeIn} initial="hidden" animate="visible">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Fabric / Material
            </label>
            <motion.input
              type="text"
              variants={inputVariants}
              animate={errors.fabricOrMaterial ? 'error' : 'focus'}
              {...register('fabricOrMaterial', {
                required: 'Fabric is required',
              })}
              placeholder="Enter fabric details"
              className="w-full p-3 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-purple-500"
            />
            <AnimatePresence>
              {errors.fabricOrMaterial && (
                <motion.span
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="text-red-500 text-sm flex items-center gap-1 mt-1"
                >
                  <AlertCircle size={16} /> {errors.fabricOrMaterial.message}
                </motion.span>
              )}
            </AnimatePresence>
          </motion.div>

          {/* Submit Button */}
          <motion.button
            type="submit"
            whileHover={{ scale: 1.05, backgroundColor: '#7C3AED' }}
            whileTap={{ scale: 0.95 }}
            className="w-full py-3 bg-purple-600 text-white font-semibold rounded-lg flex items-center justify-center gap-2"
          >
            <PlusCircle size={20} /> Add Product
          </motion.button>
        </form>
      </motion.div>
    </div>
  )
}
