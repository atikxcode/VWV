import React from 'react';

const RotationCategory = () => {
  return (
     <div className="flex flex-wrap container mx-auto gap-8  justify-center">

      {/* BOX-1 */}
     <div className="py-6 px-6  bg-[#161616]">

      <div className="group flex flex-col items-center border-[1px] border-[#ffffff26] py-8 ">

        {/* Fixed-size wrapper with overflow-hidden */}
        <div className=" overflow-hidden rounded-full">
          <img
            src="/Home_Category/1.jpg"
            alt=""
            className="image w-full h-full object-cover"
          />
        </div>

        {/* Content */}
        <div className="flex flex-col items-center mt-4 gap-4">
          <h2 className="text-[30px] font-bold text-white">STARTER KITS</h2>
          <span className="border-[2px] w-[50px] border-[#d2a48f]"></span>
          <p className="w-[380px] text-[15px] text-center text-[#969696]">
            Starter kits from incredible brands like SMOK, Suorin, Vaporesso, Voopoo and more
          </p>
          <div className="text-white  ">
            <button className="group font-bold text-[10px] text-white transition-all duration-300 group-hover:text-[#d2a48f]">
          EXPLORE
          
        </button>
        <span className="text-lg ml-1 transition-all duration-300 group-hover:ml-2 group-hover:text-[#d2a48f]">›</span>
          </div>
        </div>

  </div>
    </div>


    {/* BOX-2 */}
     <div className="py-6 px-6  bg-[#161616]">

      <div className="group flex flex-col items-center border-[1px] border-[#ffffff26] py-8 ">

        {/* Fixed-size wrapper with overflow-hidden */}
        <div className=" overflow-hidden rounded-full">
          <img
            src="/Home_Category/2.jpg"
            alt=""
            className="image w-full h-full object-cover"
          />
        </div>

        {/* Content */}
        <div className="flex flex-col items-center mt-4 gap-4">
          <h2 className="text-[30px] font-bold text-white">E LIQUIDS</h2>
          <span className="border-[2px] w-[50px] border-[#d2a48f]"></span>
          <p className="w-[380px] text-[15px] text-center text-[#969696]">
            Starter kits from incredible brands like SMOK, Suorin, Vaporesso, Voopoo and more
          </p>
          <div className="text-white  ">
            <button className="group font-bold text-[10px] text-white transition-all duration-300 group-hover:text-[#d2a48f]">
          EXPLORE
          
        </button>
        <span className="text-lg ml-1 transition-all duration-300 group-hover:ml-2 group-hover:text-[#d2a48f]">›</span>
          </div>
        </div>

  </div>
    </div>


    {/* BOX-3 */}
     <div className="py-6 px-6  bg-[#161616]">

      <div className="group flex flex-col items-center border-[1px] border-[#ffffff26] py-8 ">

        {/* Fixed-size wrapper with overflow-hidden */}
        <div className=" overflow-hidden rounded-full">
          <img
            src="/Home_Category/3.jpg"
            alt=""
            className="image w-full h-full object-cover"
          />
        </div>

        {/* Content */}
        <div className="flex flex-col items-center mt-4 gap-4">
          <h2 className="text-[26px] font-bold text-white">TANKS AND RDA</h2>
          <span className="border-[2px] w-[50px] border-[#d2a48f]"></span>
          <p className="w-[380px] text-[15px] text-center text-[#969696]">
            Starter kits from incredible brands like SMOK, Suorin, Vaporesso, Voopoo and more
          </p>
          <div className="text-white  ">
            <button className="group font-bold text-[10px] text-white transition-all duration-300 group-hover:text-[#d2a48f]">
          EXPLORE
          
        </button>
        <span className="text-lg ml-1 transition-all duration-300 group-hover:ml-2 group-hover:text-[#d2a48f]">›</span>
          </div>
        </div>

  </div>
    </div>




    </div>
  );
};

export default RotationCategory;