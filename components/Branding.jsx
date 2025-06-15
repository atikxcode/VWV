import React from 'react';

const Branding = ({brands}) => {
  return (

   <div className='mx-auto container my-10 p-8  w-full'>

    <div className='mb-10 items-center text-center text-5xl  italic tracking-wide'>
      <h2>We Supported By</h2>
    </div>
    <div className='grid grid-cols-2 md:grid-cols-2 lg:grid-cols-4 xl:grid-cols-4 gap-2 py-4 px-4 '>
      {/* Maping through the brands images and ids */}
      {
        brands.map((brand) => (
          <div key={brand.id} className='bg-gray-100 rounded-[20px] items-center flex justify-center hover:bg-[#FEB130] transition-all'>
          <img className='xl:w-[50%] h-[140px] p-8' src={brand.image} alt="" />   
          </div>
        ))
      }
      
    </div>
   </div>


    
  );
};

export default Branding;