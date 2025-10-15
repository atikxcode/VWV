'use client'

import React, { useState, useEffect } from 'react'
import Link from 'next/link'

const RotationCategory = () => {
  const [categories, setCategories] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchFeaturedCategories = async () => {
      try {
        setLoading(true)
        const response = await fetch('/api/featured-categories')
        
        if (response.ok) {
          const data = await response.json()
          setCategories(data.categories || [])
        }
      } catch (error) {
        console.error('❌ Error fetching featured categories:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchFeaturedCategories()
  }, [])

  // Helper function to get background style
  const getBackgroundStyle = (category) => {
    if (category.backgroundType === 'color') {
      return { backgroundColor: category.backgroundColor || '#e5e7eb' }
    }
    return {
      backgroundImage: category.backgroundImage
        ? `url('${category.backgroundImage}')`
        : "url('/Home_Category/20.jpg')"
    }
  }

  if (loading) {
    return (
      <div className="container mx-auto flex flex-col items-center gap-8 my-20">
        <div className="flex justify-center items-center py-20">
          <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-purple-600"></div>
        </div>
      </div>
    )
  }

  if (categories.length === 0) {
    return null
  }

  return (
    <div className="container mx-auto flex flex-col items-center gap-8 my-20">
      <div className="flex flex-col items-center gap-6">
        <h2 className="uppercase text-[20px] md:text-[24px] tracking-wider font-semibold text-purple-400 text-center">
          Premium Vape Products & Accessories
        </h2>
        <p className="text-[14px] md:text-[16px] font-bold tracking-widest text-gray-500 text-center">
          Shop E-Liquids, RDAs, and Tanks for Every Vaper
        </p>
      </div>

      <div className="flex flex-wrap gap-8 justify-center">
        {categories.map((category, index) => (
          <div
            key={category.id || index}
            className="py-2 md:py-6 px-2 md:px-6 bg-cover bg-center rounded-3xl"
            style={getBackgroundStyle(category)}
          >
            <div className="group flex flex-col items-center border-[1px] rounded-2xl border-purple-400 py-8">
              {/* Image */}
              <div className="overflow-hidden rounded-full">
                <img
                  src={category.productImage || category.image || '/Home_Category/device.png'}
                  alt={category.title}
                  className="image md:w-[240px] h-full object-cover"
                />
              </div>

              {/* Content */}
              <div className="flex flex-col items-center mt-4 gap-4">
                <h2 
                  className="text-[20px] md:text-[26px] font-bold"
                  style={{ color: category.titleColor || '#000000' }}
                >
                  {category.title}
                </h2>
                <span 
                  className="border-[2px] w-[50px]"
                  style={{ borderColor: category.titleColor || '#000000' }}
                ></span>
                <p 
                  className="w-[350] md:w-[380px] text-[14px] md:text-[15px] font-bold text-center tracking-wider"
                  style={{ color: category.descriptionColor || '#000000' }}
                >
                  {category.description}
                </p>

                {/* ✅ EXPLORE LINK - Same pattern as your Navbar */}
                <Link 
                  href={`/products?category=${encodeURIComponent(category.categoryParam)}`}
                  className="group/explore"
                >
                  <button 
                    className="font-bold text-[10px] transition-all duration-300"
                    style={{ color: category.buttonColor || '#000000' }}
                  >
                    {category.buttonText || 'EXPLORE'}
                  </button>
                  <span 
                    className="text-lg ml-1 transition-all duration-300 group-hover/explore:ml-2"
                    style={{ color: category.buttonColor || '#000000' }}
                  >
                    ›
                  </span>
                </Link>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

export default RotationCategory
