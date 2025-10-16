'use client'
import React from 'react'
import 'swiper/css'
import 'swiper/css/autoplay'

import Slider from '../../components/Slider'
import RotationCategory from '../../components/RotationCategory'
import OfferPopup from '../../components/OfferPopUp'
import Recommendation from '../../components/Recommendation'
import FeaturedProducts from '../../components/FeaturedProducts'

export default function Home() {
  return (
    <div>
      <OfferPopup />
      <Slider />
      <Recommendation />
      <RotationCategory />
      <FeaturedProducts />
    </div>
  )
}
