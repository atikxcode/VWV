import React from 'react'

const Recommendation = () => {
  return (
    <div className="flex flex-col mb-10">
      {/* 1st Section */}
      <div className="flex flex-col md:flex-row items-center justify-center ">
        {/* 1st part */}
        <div
          className="border-r-[1px] border-purple-300 w-full flex flex-col items-center py-32 px-4 gap-4 bg-cover bg-center overflow-hidden "
          style={{ backgroundImage: "url('/Home_Category/21.jpg')" }}
        >
          <h2 className="uppercase text-[14px] text-white font-bold tracking-wider">
            Premium Vape Accessories – Pods, Coils & Chargers
          </h2>
          <p className="uppercase font-bold text-[22px] tracking-wide text-white">
            Top vape gear for flavor & performance
          </p>
          <button
            className="uppercase bg-purple-400 px-16 py-4 font-bold text-white text-[12px] 
            transition-shadow duration-300 ease-in-out
            hover:shadow-[0_0_15px_4px_rgba(128,0,255,0.7)]"
          >
            Shop Now
          </button>
        </div>

        {/* 2nd part */}
        <div
          className="border-r-[1px] border-purple-300  w-full flex flex-col items-center py-32 px-4 gap-4"
          style={{ backgroundImage: "url('/Home_Category/24.jpg')" }}
        >
          <h2 className="uppercase text-[14px] text-white font-bold tracking-wider">
            Vape Toolkits – Essential Maintenance Gear
          </h2>
          <p className="uppercase font-bold text-[22px] tracking-wide text-white">
            Top brand tools for easy upkeep
          </p>
          <button
            className="uppercase bg-purple-400 px-16 py-4 font-bold text-white text-[12px] 
            transition-shadow duration-300 ease-in-out
            hover:shadow-[0_0_15px_4px_rgba(128,0,255,0.7)]"
          >
            Shop Now
          </button>
        </div>

        {/* 3rd part */}
        <div
          className=" w-full flex flex-col items-center py-32 px-4 gap-4"
          style={{ backgroundImage: "url('/Home_Category/25.jpg')" }}
        >
          <h2 className="uppercase text-[14px] text-white font-bold tracking-wider">
            Premium Vapes – Smooth Flavor & Long Battery
          </h2>
          <p className="uppercase font-bold text-[22px] tracking-wide text-white">
            Shop top-rated vapes trusted by pros
          </p>
          <button
            className="uppercase bg-purple-400 px-16 py-4 font-bold text-white text-[12px] 
            transition-shadow duration-300 ease-in-out
            hover:shadow-[0_0_15px_4px_rgba(128,0,255,0.7)]"
          >
            Shop Now
          </button>
        </div>
      </div>

      {/* 2nd Section */}
      <div className="flex">
        <div className="overflow-hidden">
          <img
            src="/Home_Category/18.jpg"
            alt=""
            className="transform transition-transform duration-700 ease-in-out hover:scale-105"
          />
        </div>

        <div
          className="flex flex-col items-start p-16 justify-center gap-10"
          style={{
            backgroundImage: "url('/Home_Category/20.jpg')",
            backgroundRepeat: 'no-repeat',
            backgroundSize: 'cover',
            backgroundPosition: 'center',
          }}
        >
          <h2 className="uppercase text-[30px] text-gray-800 font-bold tracking-wider">
            Premium Vape Kits & E-Liquids 2025 Collection
          </h2>
          <p className="uppercase font-bold text-[16px] tracking-wide">
            Explore the latest vape devices, flavors, and starter kits for a
            smooth vaping experience.
          </p>
          <button
            className="uppercase bg-purple-400 px-16 py-4 font-bold text-white text-[12px] 
            transition-shadow duration-300 ease-in-out
            hover:shadow-[0_0_15px_4px_rgba(128,0,255,0.7)]"
          >
            EXPLORE NOW
          </button>
        </div>
      </div>

      {/* 3rd Section */}
      <div className="flex ">
        <div className="overflow-hidden flex-1">
          <img
            className="w-full h-64 object-cover transform transition-transform duration-700 ease-in-out hover:scale-105"
            src="/Home_Category/21.jpg"
            alt=""
          />
        </div>
        <div className="overflow-hidden flex-1">
          <img
            className="w-full h-64 object-cover transform transition-transform duration-700 ease-in-out hover:scale-105"
            src="/Home_Category/24.jpg"
            alt=""
          />
        </div>
        <div className="overflow-hidden flex-1">
          <img
            className="w-full h-64 object-cover transform transition-transform duration-700 ease-in-out hover:scale-105"
            src="/Home_Category/25.jpg"
            alt=""
          />
        </div>
      </div>
    </div>
  )
}

export default Recommendation
