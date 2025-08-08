import React from 'react';
import { Navigation, Pagination } from "swiper/modules";
import "swiper/css";
import "swiper/css/navigation";
import "swiper/css/pagination";
import { Swiper, SwiperSlide } from "swiper/react";

const FlavorSection = () => {
  return (
    <div className="relative my-20">
  {/* Background Image */}
  <img
    src="/Home_Category/4.png"
    alt="Background"
    className="w-full h-full object-cover"
  />

  {/* Vape Image Positioned on Left */}
  <img
    src="/Home_Category/5.png"
    alt="Vape Device"
    className="absolute left-[16%] top-[60%] -translate-y-1/2  object-contain"
  />

  <div className="absolute right-[10%] top-[20%] w-[800px]">
      {/* Heading */}
      <div className="flex items-center text-white mb-4">
        <h2 className="text-[#D39E80] text-[80px] tracking-[8px] uppercase">
          Flavor
        </h2>
        <div className="flex flex-col uppercase text-[30px] tracking-[5px] text-[#83766E] leading-[36px]">
          <p>Choose</p>
          <p>Your Version</p>
        </div>
      </div>

      {/* Description */}
      <div className="text-[#969696] w-[60%] mb-6">
        Each café is also carefully designed to incorporate a welcoming and
        relaxed social setting to complete every customer visit.
      </div>

      {/* Slider */}
      <Swiper
        modules={[Pagination]}
        slidesPerView={3}
        slidesPerGroup={3} // Changes all 3 at once
        spaceBetween={20}
        pagination={{ clickable: true }}
        className="mySwiper"
      >
        <SwiperSlide>
          <img src="/Home_Category/6.png" alt="" className="" />
        </SwiperSlide>
        <SwiperSlide>
          <img src="/Home_Category/7.png" alt="" className="" />
        </SwiperSlide>
        <SwiperSlide>
          <img src="/Home_Category/8.png" alt="" className="" />
        </SwiperSlide>
        <SwiperSlide>
          <img src="/Home_Category/9.png" alt="" className="" />
        </SwiperSlide>
        <SwiperSlide>
          <img src="/Home_Category/10.png" alt="" className="" />
        </SwiperSlide>
        <SwiperSlide>
          <img src="/Home_Category/11.png" alt="" className="" />
        </SwiperSlide>
      </Swiper>
    </div>
</div>

  );
};

export default FlavorSection;