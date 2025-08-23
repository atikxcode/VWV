'use client'

import React, { useEffect, useState } from 'react'
import { Swiper, SwiperSlide } from 'swiper/react'
import { Autoplay } from 'swiper/modules'
import 'swiper/css'
import 'swiper/css/autoplay'

import BlurText from './TextAnimation'

const handleAnimationComplete = () => {
  // console.log('Animation completed!');
}

const Slider = () => {
  const [isMobile, setIsMobile] = useState(false)

  useEffect(() => {
    // check screen width
    const handleResize = () => {
      setIsMobile(window.innerWidth < 435)
    }

    handleResize() // run once on mount
    window.addEventListener('resize', handleResize)

    return () => window.removeEventListener('resize', handleResize)
  }, [])

  return (
    <div className=" w-full overflow-hidden ">
      <Swiper
        direction={isMobile ? 'horizontal' : 'vertical'}
        modules={[Autoplay]}
        autoplay={{ delay: 3800, disableOnInteraction: false }}
        loop={true}
        slidesPerView={1}
        spaceBetween={0}
        className="h-[450px] md:h-[800px] lg:h-[800px] xl:h-[800px] w-full"
      >
        {/* Slide 1 */}
        <SwiperSlide className="h-screen w-full relative">
          {/* Image */}
          <img
            src="/Slider_Images/Slide_1.jpg"
            alt="Slide 1"
            className="w-full h-full object-cover"
          />

          {/* Text Overlay */}
          <div className="absolute inset-0 flex flex-col items-start justify-center px-10 text-white">
            <BlurText
              text="Sale up to 70%"
              delay={300}
              stepDuration={0.6}
              animateBy="words"
              direction="top"
              onAnimationComplete={handleAnimationComplete}
              className="text-sm tracking-widest uppercase mb-4"
            />

            <BlurText
              text="For Gentleman Vape"
              delay={300}
              stepDuration={0.6}
              animateBy="words"
              direction="top"
              onAnimationComplete={handleAnimationComplete}
              className="text-2xl md:text-5xl font-extrabold tracking-[0.3em]"
            />

            <BlurText
              text="Each café is also carefully designed to incorporate a welcoming
                and relaxed social setting to complete every customer visit."
              delay={300}
              stepDuration={0.6}
              animateBy="words"
              direction="top"
              onAnimationComplete={handleAnimationComplete}
              className="w-auto md:max-w-xl mt-4 text-base leading-relaxed"
            />

            <button className="mt-8 bg-purple-400 hover:bg-purple-500 text-white px-8 py-3 text-sm uppercase tracking-widest">
              <BlurText
                text="Shop Now"
                delay={300}
                stepDuration={0.6}
                animateBy="words"
                direction="top"
                onAnimationComplete={handleAnimationComplete}
              />
            </button>
          </div>
        </SwiperSlide>

        {/* Slide 2 */}
        <SwiperSlide className="h-screen w-full relative">
          {/* Background Image */}
          <img
            src="/Slider_Images/Slide_3.png"
            alt="Slide 3"
            className="w-full h-full object-cover"
          />

          {/* Overlay Text */}
          <div className="absolute inset-0 flex flex-col items-center justify-center text-center text-white px-4">
            <BlurText
              text="Starter Kits Marlboro"
              delay={300}
              stepDuration={0.6}
              animateBy="words"
              direction="top"
              onAnimationComplete={handleAnimationComplete}
              className="text-sm tracking-widest uppercase mb-4"
            />

            <BlurText
              text="ANOTHER GREAT LOOK"
              delay={300}
              stepDuration={0.6}
              animateBy="words"
              direction="top"
              onAnimationComplete={handleAnimationComplete}
              className="text-2xl md:text-5xl font-extrabold tracking-[0.3em]"
            />

            <BlurText
              text="Each café is also carefully designed to incorporate a welcoming and
                  relaxed social setting to complete every customer visit."
              delay={300}
              stepDuration={0.6}
              animateBy="words"
              direction="top"
              onAnimationComplete={handleAnimationComplete}
              className="w-auto md:max-w-xl mt-4 text-base leading-relaxed"
            />

            <button className="mt-8 bg-purple-400 hover:bg-purple-500 text-white px-8 py-3 text-sm uppercase tracking-widest">
              Explore
            </button>
          </div>
        </SwiperSlide>

        {/* Slide 3 */}
        <SwiperSlide className="h-screen w-full relative">
          {/* Background Image */}
          <img
            src="/Slider_Images/Slide_2.jpg"
            alt="Slide 2"
            className="w-full h-full object-cover"
          />

          {/* Overlay Text */}
          <div className="absolute inset-0 flex flex-col items-center justify-center text-center text-white px-4">
            <BlurText
              text="New Arrival Offer 10%"
              delay={300}
              stepDuration={0.6}
              animateBy="words"
              direction="top"
              onAnimationComplete={handleAnimationComplete}
              className="text-sm tracking-widest uppercase mb-4"
            />

            <BlurText
              text="STYLE MARLBORO"
              delay={300}
              stepDuration={0.6}
              animateBy="words"
              direction="top"
              onAnimationComplete={handleAnimationComplete}
              className="text-2xl md:text-5xl font-extrabold tracking-[0.3em]"
            />

            <BlurText
              text="Each café is also carefully designed to incorporate a welcoming and relaxed social setting to complete every customer visit."
              delay={300}
              stepDuration={0.6}
              animateBy="words"
              direction="top"
              onAnimationComplete={handleAnimationComplete}
              className="w-auto md:max-w-xl mt-4 text-base leading-relaxed"
            />

            <button className="mt-8 bg-purple-400 hover:bg-purple-500 text-white px-8 py-3 text-sm uppercase tracking-widest">
              <BlurText
                text="Explore"
                delay={300}
                stepDuration={0.6}
                animateBy="words"
                direction="top"
                onAnimationComplete={handleAnimationComplete}
              />
            </button>
          </div>
        </SwiperSlide>

        {/* Slide 4 */}
        <SwiperSlide className="h-screen w-full relative">
          {/* Background Image */}
          <img
            src="/Slider_Images/Slide_4.png"
            alt="Slide 3"
            className="w-full h-full object-cover"
          />

          {/* Overlay Text */}
          <div className="absolute inset-0 flex flex-col items-center justify-center text-center text-white px-4">
            <BlurText
              text="Starter Kits Marlboro"
              delay={300}
              stepDuration={0.6}
              animateBy="words"
              direction="top"
              onAnimationComplete={handleAnimationComplete}
              className="text-sm tracking-widest uppercase mb-4"
            />

            <BlurText
              text="ANOTHER GREAT LOOK"
              delay={300}
              stepDuration={0.6}
              animateBy="words"
              direction="top"
              onAnimationComplete={handleAnimationComplete}
              className="text-2xl md:text-5xl font-extrabold tracking-[0.3em]"
            />

            <BlurText
              text="Each café is also carefully designed to incorporate a welcoming and
                  relaxed social setting to complete every customer visit."
              delay={300}
              stepDuration={0.6}
              animateBy="words"
              direction="top"
              onAnimationComplete={handleAnimationComplete}
              className="w-auto md:max-w-xl mt-4 text-base leading-relaxed"
            />

            <button className="mt-8 bg-purple-400 hover:bg-purple-500 text-white px-8 py-3 text-sm uppercase tracking-widest">
              Explore
            </button>
          </div>
        </SwiperSlide>
      </Swiper>
    </div>
  )
}

export default Slider
