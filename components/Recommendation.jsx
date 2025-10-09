'use client'

import React, { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Loading from './Loading'

const Recommendation = () => {
  const router = useRouter()
  const [recommendation, setRecommendation] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    fetchRecommendation()
  }, [])

  const fetchRecommendation = async () => {
    try {
      setLoading(true)
      setError(null)
      
      const response = await fetch('/api/recommendation', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
        cache: 'no-store', // Ensure fresh data
      })

      const data = await response.json()

      if (data.success && data.recommendation) {
        setRecommendation(data.recommendation)
      } else {
        setRecommendation(null)
      }
    } catch (err) {
      console.error('Error fetching recommendation:', err)
      setError(err.message)
      setRecommendation(null)
    } finally {
      setLoading(false)
    }
  }

  const handleButtonClick = () => {
    router.push(recommendation?.buttonLink || '/products')
  }

  // Loading state
  if (loading) {
    return (
      <div className="flex flex-col my-20 items-center justify-center min-h-[400px]">
        <Loading />
      </div>
    )
  }

  // Error or no data state
  if (error || !recommendation || !recommendation.isActive) {
    return null // Don't show anything if there's an error or no active recommendation
  }

  // No images state
  if (!recommendation.mainImage && (!recommendation.subImages || recommendation.subImages.length === 0)) {
    return null // Don't show section if no images are configured
  }

  return (
    <div className="flex flex-col my-20">
      {/* Header Section */}
      {(recommendation.headerTitle || recommendation.headerSubtitle) && (
        <div className="flex flex-col items-center mb-10 p-4">
          {recommendation.headerTitle && (
            <h2 className="uppercase text-[20px] md:text-[24px] tracking-wider font-semibold text-purple-400 text-center">
              {recommendation.headerTitle}
            </h2>
          )}
          {recommendation.headerSubtitle && (
            <p className="text-[14px] md:text-[16px] font-bold tracking-widest text-gray-500 text-center">
              {recommendation.headerSubtitle}
            </p>
          )}
        </div>
      )}

      {/* Main Section */}
      <div className="flex flex-col md:flex-row">
        {/* Main Image */}
        {recommendation.mainImage && (
          <div className="overflow-hidden flex-1">
            <img
              src={recommendation.mainImage}
              alt={recommendation.mainTitle || 'Featured product'}
              className="transform transition-transform duration-700 ease-in-out hover:scale-105 h-full w-full object-cover"
            />
          </div>
        )}

        {/* Content Section with Background Image */}
        {(recommendation.mainTitle || recommendation.mainSubtitle || recommendation.buttonText) && (
          <div
            className="flex flex-col items-start p-8 md:p-16 justify-center gap-6 md:gap-10 flex-1 min-h-[400px]"
            style={{
              backgroundImage: recommendation.backgroundImage 
                ? `url('${recommendation.backgroundImage}')` 
                : 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              backgroundRepeat: 'no-repeat',
              backgroundSize: 'cover',
              backgroundPosition: 'center',
            }}
          >
            {recommendation.mainTitle && (
              <h2 className="uppercase text-[24px] md:text-[30px] text-gray-800 font-bold tracking-wider">
                {recommendation.mainTitle}
              </h2>
            )}
            
            {recommendation.mainSubtitle && (
              <p className="uppercase font-bold text-[14px] md:text-[16px] tracking-wide text-gray-700">
                {recommendation.mainSubtitle}
              </p>
            )}
            
            {recommendation.buttonText && (
              <button
                onClick={handleButtonClick}
                className="uppercase bg-purple-400 px-12 md:px-16 py-3 md:py-4 font-bold text-white text-[12px] 
                transition-all duration-300 ease-in-out
                hover:shadow-[0_0_15px_4px_rgba(128,0,255,0.7)]
                hover:bg-purple-500
                active:scale-95
                focus:outline-none focus:ring-2 focus:ring-purple-300"
                aria-label={recommendation.buttonText}
              >
                {recommendation.buttonText}
              </button>
            )}
          </div>
        )}
      </div>

      {/* Sub Images Gallery Section */}
      {recommendation.subImages && recommendation.subImages.length > 0 && (
        <div className="flex flex-col md:flex-row gap-0">
          {recommendation.subImages
            .sort((a, b) => (a.order || 0) - (b.order || 0))
            .slice(0, 10) // Maximum 10 sub-images
            .map((subImage, index) => (
              <div key={index} className="overflow-hidden flex-1">
                <img
                  className="w-full h-48 md:h-64 object-cover transform transition-transform duration-700 ease-in-out hover:scale-105"
                  src={subImage.url}
                  alt={subImage.alt || `Gallery image ${index + 1}`}
                  loading="lazy"
                />
              </div>
            ))}
        </div>
      )}
    </div>
  )
}

export default Recommendation
