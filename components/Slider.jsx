'use client'

import React, { useEffect, useState, useCallback, useMemo, useRef } from 'react'
import { Swiper, SwiperSlide } from 'swiper/react'
import { Autoplay } from 'swiper/modules'
import 'swiper/css'
import 'swiper/css/autoplay'
import { useRouter } from 'next/navigation'

import BlurText from './TextAnimation'
import Loading from './Loading'

// Enterprise configuration constants
const MOBILE_BREAKPOINT = 435
const DEBOUNCE_DELAY = 150
const AUTOPLAY_DELAY = 3800
const ANIMATION_DURATION = 400

const handleAnimationComplete = () => {
  // Animation completion callback
}

// Optimized Slide Component
const OptimizedSlide = React.memo(({ slide, index, isActive, isMobile, router }) => {
  const [imageLoaded, setImageLoaded] = useState(false)
  const [imageError, setImageError] = useState(false)
  const slideRef = useRef(null)

  // Preload critical images
  useEffect(() => {
    if (index < 2 && slide?.image) {
      const img = new Image()
      img.src = slide.image
      img.onload = () => setImageLoaded(true)
      img.onerror = () => setImageError(true)
    }
  }, [slide?.image, index])

  const alignmentClasses = useMemo(() => {
    const baseClasses = 'absolute inset-0 flex flex-col text-white'
    return slide?.alignment === 'left' 
      ? `${baseClasses} items-start justify-center px-6 md:px-10`
      : slide?.alignment === 'right'
      ? `${baseClasses} items-end justify-center px-6 md:px-10`
      : `${baseClasses} items-center justify-center text-center px-4`
  }, [slide?.alignment])

  const handleButtonClick = useCallback(() => {
    router.push('/products')
  }, [router])

  if (!slide) {
    return null
  }

  return (
    <div 
      ref={slideRef}
      className="h-full w-full relative"
      style={{ willChange: 'transform' }}
    >
      {/* Optimized Image */}
      <img
        src={slide.image}
        alt={slide.alt || slide.title}
        className={`w-full h-full object-cover transition-opacity duration-300 ${
          imageLoaded ? 'opacity-100' : 'opacity-0'
        }`}
        style={{ 
          willChange: 'transform',
          transform: 'translateZ(0)'
        }}
        loading={index === 0 ? 'eager' : 'lazy'}
        decoding="async"
        onLoad={() => setImageLoaded(true)}
        onError={() => setImageError(true)}
      />

      {/* Fallback for failed images */}
      {imageError && (
        <div className="w-full h-full bg-gradient-to-br from-purple-600 to-purple-800 flex items-center justify-center">
          <div className="text-white text-center">
            <div className="text-4xl mb-2">🎯</div>
            <div>Image Loading...</div>
          </div>
        </div>
      )}

      {/* Text Overlay - Only render when slide is active for performance */}
      {isActive && (
        <div className={alignmentClasses}>
          {slide.subtitle && (
            <BlurText
              text={slide.subtitle}
              delay={300}
              stepDuration={0.3}
              animateBy="words"
              direction="top"
              onAnimationComplete={handleAnimationComplete}
              className="text-xs md:text-sm tracking-widest uppercase mb-2 md:mb-4"
            />
          )}

          {slide.title && (
            <BlurText
              text={slide.title}
              delay={400}
              stepDuration={0.3}
              animateBy="words"
              direction="top"
              onAnimationComplete={handleAnimationComplete}
              className="text-xl md:text-3xl lg:text-5xl font-extrabold tracking-[0.2em] md:tracking-[0.3em] mb-2"
            />
          )}

          {slide.description && (
            <BlurText
              text={slide.description}
              delay={500}
              stepDuration={0.3}
              animateBy="words"
              direction="top"
              onAnimationComplete={handleAnimationComplete}
              className="w-auto md:max-w-xl mt-2 md:mt-4 text-sm md:text-base leading-relaxed"
            />
          )}

          {slide.buttonText && (
            <button 
              onClick={handleButtonClick}
              className="mt-4 md:mt-8 bg-purple-400 hover:bg-purple-500 text-white px-6 md:px-8 py-2 md:py-3 text-xs md:text-sm uppercase tracking-widest transition-all duration-200 transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-purple-300"
              aria-label={`${slide.buttonText} - ${slide.title}`}
            >
              <BlurText
                text={slide.buttonText}
                delay={600}
                stepDuration={0.3}
                animateBy="words"
                direction="top"
                onAnimationComplete={handleAnimationComplete}
              />
            </button>
          )}
        </div>
      )}
    </div>
  )
})

OptimizedSlide.displayName = 'OptimizedSlide'

const Slider = () => {
  const router = useRouter()
  const [isMobile, setIsMobile] = useState(false)
  const [activeIndex, setActiveIndex] = useState(0)
  const [isClient, setIsClient] = useState(false)
  const [slides, setSlides] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const swiperRef = useRef(null)
  const debounceTimeoutRef = useRef(null)

  // Fetch slides from API
  useEffect(() => {
    const fetchSlides = async () => {
      try {
        setLoading(true)
        setError(null)
        
        const response = await fetch('/api/slider', {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
          cache: 'no-store', // Ensure fresh data
        })

        if (!response.ok) {
          throw new Error('Failed to fetch slides')
        }

        const data = await response.json()

        if (data.success && Array.isArray(data.slides)) {
          // Filter only active slides and sort by order
          const activeSlides = data.slides
            .filter(slide => slide.isActive)
            .sort((a, b) => (a.order || 0) - (b.order || 0))
          
          setSlides(activeSlides)
        } else {
          setSlides([])
        }
      } catch (err) {
        console.error('Error fetching slides:', err)
        setError(err.message)
        setSlides([])
      } finally {
        setLoading(false)
      }
    }

    fetchSlides()
  }, [])

  // Optimized resize handler with debouncing
  const handleResize = useCallback(() => {
    setIsMobile(window.innerWidth < MOBILE_BREAKPOINT)
  }, [])

  // Enhanced initialization with client-side detection
  useEffect(() => {
    setIsClient(true)
    handleResize()
    
    const debouncedResize = () => {
      if (debounceTimeoutRef.current) {
        clearTimeout(debounceTimeoutRef.current)
      }
      debounceTimeoutRef.current = setTimeout(handleResize, DEBOUNCE_DELAY)
    }
    
    window.addEventListener('resize', debouncedResize, { passive: true })
    
    return () => {
      window.removeEventListener('resize', debouncedResize)
      if (debounceTimeoutRef.current) {
        clearTimeout(debounceTimeoutRef.current)
      }
    }
  }, [handleResize])

  // Slide change handler
  const handleSlideChange = useCallback((swiper) => {
    setActiveIndex(swiper.realIndex)
  }, [])

  // Memoized swiper configuration for enterprise performance
  const swiperConfig = useMemo(() => ({
    direction: isMobile ? 'horizontal' : 'vertical',
    modules: [Autoplay],
    autoplay: slides.length > 1 ? { 
      delay: AUTOPLAY_DELAY, 
      disableOnInteraction: false,
      pauseOnMouseEnter: true,
      reverseDirection: false
    } : false,
    loop: slides.length > 1,
    slidesPerView: 1,
    spaceBetween: 0,
    speed: 500,
    allowTouchMove: true,
    touchRatio: 1,
    followFinger: true,
    simulateTouch: true,
    grabCursor: slides.length > 1,
    watchSlidesProgress: true,
    preventInteractionOnTransition: false,
    onSlideChange: handleSlideChange,
    onSwiper: (swiper) => {
      swiperRef.current = swiper
    }
  }), [isMobile, handleSlideChange, slides.length])

  // Loading state
  if (!isClient || loading) {
    return (
      <div className="w-full h-[450px] md:h-[800px] bg-gradient-to-br from-purple-50 to-purple-100 flex items-center justify-center">
        <Loading />
      </div>
    )
  }

  // Error state
  if (error) {
    return (
      <div className="w-full h-[450px] md:h-[800px] bg-gradient-to-br from-red-50 to-red-100 flex items-center justify-center">
        <div className="text-center text-red-600">
          <div className="text-4xl mb-4">⚠️</div>
          <p className="text-lg font-semibold">Failed to load slides</p>
          <p className="text-sm mt-2">{error}</p>
        </div>
      </div>
    )
  }

  // No slides state
  if (!slides || slides.length === 0) {
    return (
      <div className="w-full h-[450px] md:h-[800px] bg-gradient-to-br from-purple-50 to-purple-100 flex items-center justify-center">
        <div className="text-center text-gray-600">
          <div className="text-6xl mb-4">🎨</div>
          <p className="text-lg font-semibold">No slides available</p>
          <p className="text-sm mt-2">Check back later for updates</p>
        </div>
      </div>
    )
  }

  return (
    <div className="w-full overflow-hidden">
      <Swiper
        {...swiperConfig}
        className="h-[450px] md:h-[800px] lg:h-[800px] xl:h-[800px] w-full"
        style={{ willChange: 'transform' }}
      >
        {slides.map((slide, index) => (
          <SwiperSlide 
            key={slide.id || slide._id || index}
            className="h-full w-full relative"
            style={{ willChange: 'transform' }}
          >
            <OptimizedSlide 
              slide={slide} 
              index={index} 
              isActive={activeIndex === index}
              isMobile={isMobile}
              router={router}
            />
          </SwiperSlide>
        ))}
      </Swiper>

      {/* Enterprise-grade Performance CSS */}
      <style jsx global>{`
        /* Core Swiper Optimizations */
        .swiper {
          will-change: transform;
          -webkit-backface-visibility: hidden;
          backface-visibility: hidden;
          -webkit-transform-style: preserve-3d;
          transform-style: preserve-3d;
          contain: layout style paint;
        }
        
        .swiper-slide {
          will-change: transform;
          -webkit-backface-visibility: hidden;
          backface-visibility: hidden;
          -webkit-transform: translate3d(0, 0, 0);
          transform: translate3d(0, 0, 0);
          contain: layout style paint;
        }
        
        .swiper-wrapper {
          will-change: transform;
          -webkit-transform-style: preserve-3d;
          transform-style: preserve-3d;
        }

        /* Mobile-specific optimizations */
        @media (max-width: 435px) {
          .swiper {
            -webkit-overflow-scrolling: touch;
            overflow-scrolling: touch;
          }
          
          .swiper-slide img {
            -webkit-transform: translateZ(0);
            transform: translateZ(0);
            image-rendering: optimizeQuality;
          }
        }

        /* Hardware acceleration for all images */
        img {
          -webkit-transform: translateZ(0);
          transform: translateZ(0);
          image-rendering: optimizeQuality;
        }

        /* Performance optimizations for text animations */
        .swiper-slide div[class*="absolute"] {
          -webkit-transform: translateZ(0);
          transform: translateZ(0);
        }

        /* Reduce motion for accessibility */
        @media (prefers-reduced-motion: reduce) {
          .swiper {
            --swiper-transition-duration: 0.1s;
          }
          
          .swiper-slide {
            transition-duration: 0.1s;
          }
        }
      `}</style>
    </div>
  )
}

export default Slider
