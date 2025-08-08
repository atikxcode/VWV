'use client'
import React from 'react';
import 'swiper/css';
import 'swiper/css/autoplay';
import FlavorSection from "../../components/FlavorSection";
import Slider from "../../components/Slider";
import RotationCategory from '../../components/RotationCategory';


export default function Home() {
  
  return (
   <div>
    
    <Slider />
    <RotationCategory />
    <FlavorSection />

    </div>
  );
}
