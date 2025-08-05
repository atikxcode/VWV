'use client'
import Image from "next/image";
import Link from "next/link";
import HeroSlider from "../../components/HeroSlider";
import Branding from "../../components/Branding";
import React from 'react';
import { Swiper, SwiperSlide } from 'swiper/react';
import { Autoplay } from 'swiper/modules';
import 'swiper/css';
import 'swiper/css/autoplay';







export default function Home() {
  return (
   <div>
    <div className="h-screen w-full overflow-hidden">
      <Swiper
        direction="vertical"
        modules={[Autoplay]}
        autoplay={{ delay: 5000, disableOnInteraction: false }}
        loop={true}
        slidesPerView={1}
        spaceBetween={0}
        className="h-[698px] w-full"
      >
        <SwiperSlide className="h-screen w-full relative">
      {/* Image */}
      <img
        src="/Slider_Images/Slider_1.jpg"
        alt="Slide 1"
        className="w-full h-full object-cover"
      />

      {/* Text Overlay */}
      <div className="absolute inset-0 flex flex-col items-start justify-center px-10 text-white">
        <p className="text-sm tracking-widest uppercase mb-4">Sale up to 70%</p>
        <h1 className="text-5xl font-extrabold tracking-[0.3em]">For Gentleman Vape</h1>
        <p className="max-w-xl mt-4 text-base leading-relaxed">
          Each café is also carefully designed to incorporate a welcoming
          and relaxed social setting to complete every customer visit.
        </p>
        <button className="mt-8 bg-[#d2a48f] hover:bg-[#b9876c] text-white px-8 py-3 text-sm uppercase tracking-widest">
          Shop Now
        </button>
      </div>
      </SwiperSlide>

        <SwiperSlide className="h-screen w-full relative">
        {/* Background Image */}
        <img
          src="/Slider_Images/Slider_2.jpg"
          alt="Slide 2"
          className="w-full h-full object-cover"
        />

        {/* Overlay Text */}
        <div className="absolute inset-0 flex flex-col items-center justify-center text-center text-white px-4">
          <p className="text-sm tracking-widest uppercase mb-4">
            New Arrival Offer 10%
          </p>
          <h1 className="text-5xl font-extrabold tracking-[0.3em]">
            SYLTE MARLBORO
          </h1>
          <p className="max-w-xl mt-4 text-base leading-relaxed">
            Each café is also carefully designed to incorporate a welcoming and
            relaxed social setting to complete every customer visit.
          </p>
          <button className="mt-8 bg-[#d2a48f] hover:bg-[#b9876c] text-white px-8 py-3 text-sm uppercase tracking-widest">
            Explore
          </button>
        </div>
      </SwiperSlide>

        <SwiperSlide className="h-screen w-full relative">
        {/* Background Image */}
        <img
        src="/Slider_Images/Slider_3.jpg"
        alt="Slide 3"
        className="w-full h-full object-cover"
        />

        {/* Overlay Text */}
        <div className="absolute inset-0 flex flex-col items-center justify-center text-center text-white px-4">
        <p className="text-sm tracking-widest uppercase mb-4">
          Starter Kits Marlboro
        </p>
        <h1 className="text-5xl font-extrabold tracking-[0.3em]">
          ANOTHER GREAT LOOK
        </h1>
        <p className="max-w-xl mt-4 text-base leading-relaxed">
          Each café is also carefully designed to incorporate a welcoming and
          relaxed social setting to complete every customer visit.
        </p>
        <button className="mt-8 bg-[#d2a48f] hover:bg-[#b9876c] text-white px-8 py-3 text-sm uppercase tracking-widest">
          Explore
        </button>
        </div>
        </SwiperSlide>

      </Swiper>
    </div>

    </div>
  );
}
