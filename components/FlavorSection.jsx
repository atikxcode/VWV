import React, { useRef } from "react";
import { Pagination } from "swiper/modules";
import "swiper/css";
import "swiper/css/pagination";
import { Swiper, SwiperSlide } from "swiper/react";

const FlavorSection = () => {
  const swiperRef = useRef(null);

  const updateDots = (swiper) => {
    const bullets = document.querySelectorAll(".custom-pagination .custom-bullet");
    bullets.forEach((bullet) => bullet.classList.remove("previous-dot"));

    // Calculate active bullet index relative to slidesPerGroup
    const activeIndex = Math.floor(swiper.activeIndex / swiper.params.slidesPerGroup);

    if (activeIndex > 0) {
      const prevBullet = bullets[activeIndex - 1];
      if (prevBullet) prevBullet.classList.add("previous-dot");
    }
  };

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
        className="absolute left-[16%] top-[60%] -translate-y-1/2 object-contain"
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
          Each café is also carefully designed to incorporate a welcoming and relaxed social setting to complete every customer visit.
        </div>

        {/* Slider */}
        <Swiper
          modules={[Pagination]}
          slidesPerView={3}
          slidesPerGroup={3}
          spaceBetween={20}
          loop={true}
          
          
          pagination={{
            el: ".custom-pagination",
            clickable: true,
            renderBullet: (index, className) =>
              `<span class="${className} custom-bullet" aria-label="Go to group ${index + 1}"></span>`,
          }}
          className="mySwiper"
        >

          {/* First Card */}
          <SwiperSlide>
            <div className="w-auto text-white flex items-center justify-center ">
            <div className="group flex gap-6 items-center border-[1px]  [border-image:linear-gradient(-137deg,rgba(247,197,55,.7),rgba(242,118,90,.7))_1] p-8 h-[130px] hover:bg-[linear-gradient(-137deg,rgba(247,197,55,.7),rgba(242,118,90,.7))]">
              <img
                className="transition duration-300 group-hover:brightness-0 group-hover:invert"
                src="/Home_Category/7.png"
                alt=""
              />
              <div className="flex flex-col">
                <h2>Fruits</h2>
                {/* <h2>Cream</h2> */}
              </div>
            </div>
          </div>

          </SwiperSlide>

          {/* Second Card */}
          <SwiperSlide>
            <div className="w-auto text-white flex items-center justify-center">
            <div className="group flex gap-6 items-center border-[1px]  [border-image:linear-gradient(-137deg,rgba(2,161,243,0.7),rgba(0,221,247,0.7))_1] p-8 hover:bg-[linear-gradient(-137deg,rgba(2,161,243,0.7),rgba(0,221,247,0.7))] h-[130px]">
              <img
                className="transition duration-300 group-hover:brightness-0 group-hover:invert "
                src="/Home_Category/7.png"
                alt=""
              />
              <div className="flex flex-col">
                <h2>Milk &</h2>
                <h2>Cream</h2>
              </div>
            </div>
          </div>

          </SwiperSlide>

          {/* Third Card */}
          <SwiperSlide>
            <div className="w-auto text-white flex items-center justify-center">
            <div className="group flex gap-6 items-center border-[1px]  [border-image:linear-gradient(-137deg,rgba(100,50,165,.7),rgba(59,134,224,.7))_1] p-8 h-[130px] hover:bg-[linear-gradient(-137deg,rgba(100,50,165,.7),rgba(59,134,224,.7))] h-[130px]">
              <img
                className="transition duration-300 group-hover:brightness-0 group-hover:invert "
                src="/Home_Category/6.png"
                alt=""
              />
              <div className="flex flex-col">
                <h2>Sour</h2>
                {/* <h2>Cream</h2> */}
              </div>
            </div>
          </div>

          </SwiperSlide>

          {/* Fourth Card */}
          <SwiperSlide>
            <div className="w-auto text-white flex items-center justify-center">
            <div className="group flex gap-6 items-center border-[1px]  [border-image:linear-gradient(-137deg,rgba(247,197,55,.7),rgba(242,118,90,.7))_1] p-8 h-[130px] hover:bg-[linear-gradient(-137deg,rgba(247,197,55,.7),rgba(242,118,90,.7))]">
              <img
                className="transition duration-300 group-hover:brightness-0 group-hover:invert"
                src="/Home_Category/7.png"
                alt=""
              />
              <div className="flex flex-col">
                <h2>Sweet</h2>
                <h2>Cream</h2>
              </div>
            </div>
          </div>

          </SwiperSlide>

          
        </Swiper>
        

        {/* Custom Pagination Container */}
        <div className="custom-pagination absolute"></div>
        <div className="absolute bottom-[-40%]">
          <button className="text-white  px-16 py-4 text-[15px] bg-[#d2a48f] hover:bg-[#b9876c] transition-all  font-bold">VIEW ALL </button>
        </div>
      </div>
    </div>
  );
};

export default FlavorSection;
