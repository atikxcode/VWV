"use client";
import React from 'react';
import Slider from 'react-slick';
import "slick-carousel/slick/slick.css";
import "slick-carousel/slick/slick-theme.css";

const HeroSlider = ({ slides }) => {
  const settings = {
    dots: true,
    infinite: true,
    autoplay: true,
    speed: 1000,
    slidesToShow: 1,
    slidesToScroll: 1,
    arrows: false,
    autoplaySpeed: 5000,
  };

  return (
    <section className="relative w-full h-[70vh] overflow-hidden">
      <Slider {...settings}>
        {slides.map((slide, index) => (
          <div key={index} className="relative h-screen w-full">
            <img
              src={slide.image}
              alt={slide.title}
              className="w-full h-screen object-cover"
            />
            <div className="absolute inset-0 bg-black/50 flex items-center p-4">
              <div className=" px-4  text-white">
                <h1 className="text-4xl md:text-6xl font-bold mb-4">{slide.title}</h1>
                <p className="text-lg md:text-xl">{slide.subtitle}</p>
              </div>
            </div>
          </div>
        ))}
      </Slider>
    </section>






  );
};

export default HeroSlider;
