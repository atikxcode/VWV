import React from 'react';

const RotationCategory = () => {
  return (
     <div className="flex flex-wrap container mx-auto gap-8  justify-center">

      {/* BOX-1 */}
     <div className="py-6 px-6  bg-cover bg-center rounded-3xl"
     style={{ backgroundImage: "url('/Home_Category/CART_BG.jpg')" }}
     >

      <div className="group flex flex-col items-center border-[1px] rounded-2xl border-purple-400 py-8 ">

        {/* Fixed-size wrapper with overflow-hidden */}
        <div className=" overflow-hidden rounded-full">
          <img
            src="/Home_Category/16.jpg"
            alt=""
            className="image w-[240px] h-full object-cover "
          />
        </div>

        {/* Content */}
        <div className="flex flex-col items-center mt-4 gap-4">
          <h2 className="text-[26px] font-bold text-white/90">STARTER KITS</h2>
          <span className="border-[2px] w-[50px] border-white"></span>
          <p className="w-[380px] text-[15px] text-center text-white tracking-wider">
            Starter kits from incredible brands like SMOK, Suorin, Vaporesso, Voopoo and more
          </p>
          <div className="text-white  ">
            <button className="group font-bold text-[10px] text-white/90 hover:text-[#00f5ff] group-hover:drop-shadow-[0_0_7px_#00f5ff] transition-all duration-300">
          EXPLORE
          
        </button>
            <span className="text-lg ml-1 transition-all duration-300 group-hover:ml-2 group-hover:text-[#d2a48f]">›</span>
          </div>
        </div>

  </div>
    </div>


    {/* BOX-2 */}
     <div className="py-6 px-6  bg-cover bg-center rounded-3xl"
     style={{ backgroundImage: "url('/Home_Category/CART_BG.jpg')" }}
     >

      <div className="group flex flex-col items-center border-[1px] rounded-2xl border-purple-400 py-8 ">

        {/* Fixed-size wrapper with overflow-hidden */}
        <div className=" overflow-hidden rounded-full">
          <img
            src="/Home_Category/17.jpg"
            alt=""
            className="image w-[240px] h-full object-cover "
          />
        </div>

        {/* Content */}
        <div className="flex flex-col items-center mt-4 gap-4">
          <h2 className="text-[26px] font-bold text-white/90">E LIQUIDS</h2>
          <span className="border-[2px] w-[50px] border-white"></span>
          <p className="w-[380px] text-[15px] text-center text-white tracking-wider">
            Starter kits from incredible brands like SMOK, Suorin, Vaporesso, Voopoo and more
          </p>
          <div className="text-white  ">
            <button className="group font-bold text-[10px] text-white/90 hover:text-[#00f5ff] group-hover:drop-shadow-[0_0_7px_#00f5ff] transition-all duration-300">
          EXPLORE
          
        </button>
            <span className="text-lg ml-1 transition-all duration-300 group-hover:ml-2 group-hover:text-[#d2a48f]">›</span>
          </div>
        </div>

  </div>
    </div>


    {/* BOX-3 */}
     <div className="py-6 px-6  bg-cover bg-center rounded-3xl"
     style={{ backgroundImage: "url('/Home_Category/CART_BG.jpg')" }}
     >

      <div className="group flex flex-col items-center border-[1px] rounded-2xl border-purple-400 py-8 ">

        {/* Fixed-size wrapper with overflow-hidden */}
        <div className=" overflow-hidden rounded-full">
          <img
            src="/Home_Category/10.jpg"
            alt=""
            className="image w-[240px] h-full object-cover "
          />
        </div>

        {/* Content */}
        <div className="flex flex-col items-center mt-4 gap-4">
          <h2 className="text-[26px] font-bold text-white/90">TANKS AND RDA</h2>
          <span className="border-[2px] w-[50px] border-white"></span>
          <p className="w-[380px] text-[15px] text-center text-white tracking-wider">
            Starter kits from incredible brands like SMOK, Suorin, Vaporesso, Voopoo and more
          </p>
          <div className="text-white  ">
            <button className="group font-bold text-[10px] text-white/90 hover:text-[#00f5ff] group-hover:drop-shadow-[0_0_7px_#00f5ff] transition-all duration-300">
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