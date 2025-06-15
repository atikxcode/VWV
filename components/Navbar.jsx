'use client';
import React, { useState, useRef, useEffect } from 'react';
import { Search, ShoppingCart, Menu, X, Hamburger, HamburgerIcon, AlignLeft } from 'lucide-react';
import Link from 'next/link';


const Navbar = () => {

  const [searchOpen, setSearchOpen] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const searchRef = useRef(null);

  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [openSubmenu, setOpenSubmenu] = useState(null);
  const [isClosing, setIsClosing] = useState(false);
  const toggleSubmenu = (label) => {
    setOpenSubmenu(openSubmenu === label ? null : label);
  };
  

  const toggleMobileMenu = () => setMobileMenuOpen(!mobileMenuOpen);
  const toggleSearch = () => setSearchOpen(true);
  const toggleSidebar = () => setSidebarOpen(!sidebarOpen);

  // Close search if clicked outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (searchRef.current && !searchRef.current.contains(event.target)) {
        setSearchOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className=" shadow-sm sticky top-0 bg-white z-50">
      <div className="flex justify-between items-center p-4 mx-auto">
        {/* Sidebar Toggle Button */}
        <button onClick={toggleSidebar} className="mr-2">
          {sidebarOpen ? <X /> : <Menu />}
        </button>

        {/* Logo */}
        <h2 className="font-bold text-2xl italic tracking-widest">Trendzone</h2>

        {/* Desktop Navigation */}
        <div className="hidden md:flex gap-6 text-sm italic tracking-wide">
          <NavLink label="Home" href="/" />
          <NavDropdown label="New Arrival" mainLink="/dummy" items={[
            { name: 'Men', link: '/new-arrivals/men' },
            { name: 'Women', link: '/new-arrivals/women' },
          ]} />
          <NavDropdown label="Shop" mainLink="/shop" items={[
            { name: 'Clothing', link: '/shop/clothing' },
            { name: 'Accessories', link: '/shop/accessories' },
          ]} />
          <NavDropdown label="Contact" mainLink="/contact" items={[
            { name: 'Customer Support', link: '/contact/support' },
            { name: 'Store Locations', link: '/contact/locations' },
          ]} />
          <NavDropdown label="About Us" mainLink="/about" items={[
            { name: 'Our Story', link: '/about/story' },
            { name: 'Team', link: '/about/team' },
          ]} />
          <NavLink  label="Blog" href="/blog" />
        </div>

        {/* Icons */}
        <div className="flex items-center gap-4 relative">
          <div ref={searchRef} className="relative">
            <button onClick={toggleSearch} className="p-2">
              <Search />
            </button>
            <input
              type="text"
              placeholder="Search products..."
              className={`absolute right-0 top-1/2 -translate-y-1/2 rounded-full px-4 py-2 border border-gray-300 shadow-md bg-white transition-all duration-500 ease-in-out ${
                searchOpen ? 'opacity-100 w-64' : 'opacity-0 w-0'
              }`}
              style={{ zIndex: searchOpen ? 20 : -1 }}
            />
          </div>

        {/* Shopping Cart */}
          <Link href="/cart">
            <ShoppingCart />
          </Link>

          {/* Sign In Button  */}
          <Link
            href="/AdminPanel"
            className="hidden text-[15px] tracking-widest italic md:block bg-[#FEB130]  rounded-3xl px-6 py-2  text-gray-800 hover:bg-[#FF9F01]  transition-colors duration-200"
          >
            Sign In
          </Link>

          {/* Mobile Menu Toggle */}
          <button className="md:hidden ml-2" onClick={toggleMobileMenu}>
            {mobileMenuOpen ? <X /> : <Menu />}
          </button>
        </div>
      </div>

      {/* Mobile Menu */}


 {mobileMenuOpen && (
    <div
      className="fixed top-0 right-0 w-64 h-full bg-white shadow-xl transform transition-transform duration-300 ease-in-out z-50"
      style={{
        animation: isClosing ? 'slideOutRight 0.3s ease-in' : 'slideInRight 0.3s ease-out',
      }}
    >
      <div className="flex justify-end p-4">
        <button
          onClick={() => {
            setIsClosing(true);
            setTimeout(() => {
              setMobileMenuOpen(false);
              setIsClosing(false);
              setOpenSubmenu(null);
            }, 300);
          }}
          className="text-gray-700 focus:outline-none"
          aria-label="Close mobile menu"
        >
          <svg
            className="w-6 h-6"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              d="M6 18L18 6M6 6l12 12"
            />
          </svg>
        </button>
      </div>
      <div className="flex flex-col p-4 space-y-2">
        <a
          href="/"
          className="block mb-2 text-start w-full bg-[#FEB130] py-2 px-4 text-gray-800 hover:bg-[#FF9F01] italic transition-colors duration-200 rounded-md tracking-widest font-bold"
          style={{ animation: 'fadeIn 0.4s ease-out' }}
        >
          Home
        </a>
        <div className="group">
          <button
            onClick={() => toggleSubmenu('New Arrival')}
            className="block mb-2 text-start w-full bg-[#FEB130] py-2 px-4 text-gray-800 hover:bg-[#FF9F01] italic transition-colors duration-200 rounded-md tracking-widest font-bold"
            style={{ animation: 'fadeIn 0.4s ease-out 0.1s' }}
          >
            New Arrival
          </button>
          {openSubmenu === 'New Arrival' && (
            <div
              className="ml-4 space-y-1 transform transition-transform duration-300 ease-in-out"
              style={{
                animation: openSubmenu === 'New Arrival' ? 'slideInRight 0.3s ease-out' : 'slideOutRight 0.3s ease-in',
              }}
            >
              <a
                href="/new-arrivals/men"
                className="block border-[#FEB130] border-b-[2px] mb-3  py-1 px-4 text-sm text-black italic rounded-md transition-colors duration-200 hover:border-[#FF9F01]"
                style={{ animation: 'fadeIn 0.4s ease-out 0.2s' }}
              >
                Men
              </a>
              <a
                href="/new-arrivals/women"
                className="block border-[#FEB130] border-b-[2px] mb-3  py-1 px-4 text-sm text-black italic rounded-md transition-colors duration-200 hover:border-[#FF9F01]"
                style={{ animation: 'fadeIn 0.4s ease-out 0.3s' }}
              >
                Women
              </a>
            </div>
          )}
        </div>
        <div className="group">
          <button
            onClick={() => toggleSubmenu('Shop')}
            className="block mb-2 text-start w-full bg-[#FEB130] py-2 px-4 text-gray-800 hover:bg-[#FF9F01] italic transition-colors duration-200 rounded-md tracking-widest font-bold"
            style={{ animation: 'fadeIn 0.4s ease-out 0.4s' }}
          >
            Shop
          </button>
          {openSubmenu === 'Shop' && (
            <div
              className="ml-4 space-y-1 transform transition-transform duration-300 ease-in-out"
              style={{
                animation: openSubmenu === 'Shop' ? 'slideInRight 0.3s ease-out' : 'slideOutRight 0.3s ease-in',
              }}
            >
              <a
                href="/shop/clothing"
                className="block border-[#FEB130] border-b-[2px] mb-3  py-1 px-4 text-sm text-black italic rounded-md transition-colors duration-200 hover:border-[#FF9F01]"
                style={{ animation: 'fadeIn 0.4s ease-out 0.5s' }}
              >
                Clothing
              </a>
              <a
                href="/shop/accessories"
                className="block border-[#FEB130] border-b-[2px] mb-3  py-1 px-4 text-sm text-black italic rounded-md transition-colors duration-200 hover:border-[#FF9F01]"
                style={{ animation: 'fadeIn 0.4s ease-out 0.6s' }}
              >
                Accessories
              </a>
            </div>
          )}
        </div>
        <div className="group">
          <button
            onClick={() => toggleSubmenu('Contact')}
            className="block mb-2 text-start w-full bg-[#FEB130] py-2 px-4 text-gray-800 hover:bg-[#FF9F01] italic transition-colors duration-200 rounded-md tracking-widest font-bold"
            style={{ animation: 'fadeIn 0.4s ease-out 0.7s' }}
          >
            Contact
          </button>
          {openSubmenu === 'Contact' && (
            <div
              className="ml-4 space-y-1 transform transition-transform duration-300 ease-in-out"
              style={{
                animation: openSubmenu === 'Contact' ? 'slideInRight 0.3s ease-out' : 'slideOutRight 0.3s ease-in',
              }}
            >
              <a
                href="/contact/support"
                className="block border-[#FEB130] border-b-[2px] mb-3  py-1 px-4 text-sm text-black italic rounded-md transition-colors duration-200 hover:border-[#FF9F01]"
                style={{ animation: 'fadeIn 0.4s ease-out 0.8s' }}
              >
                Customer Support
              </a>
              <a
                href="/contact/locations"
                className="block border-[#FEB130] border-b-[2px] mb-3  py-1 px-4 text-sm text-black italic rounded-md transition-colors duration-200 hover:border-[#FF9F01]"
                style={{ animation: 'fadeIn 0.4s ease-out 0.9s' }}
              >
                Store Locations
              </a>
            </div>
          )}
        </div>
        <div className="group">
          <button
            onClick={() => toggleSubmenu('About Us')}
            className="block mb-2 text-start w-full bg-[#FEB130] py-2 px-4 text-gray-800 hover:bg-[#FF9F01] italic transition-colors duration-200 rounded-md tracking-widest font-bold"
            style={{ animation: 'fadeIn 0.4s ease-out 1s' }}
          >
            About Us
          </button>
          {openSubmenu === 'About Us' && (
            <div
              className="ml-4 space-y-1 transform transition-transform duration-300 ease-in-out"
              style={{
                animation: openSubmenu === 'About Us' ? 'slideInRight 0.3s ease-out' : 'slideOutRight 0.3s ease-in',
              }}
            >
              <a
                href="/about/story"
                className="block border-[#FEB130] border-b-[2px] mb-3  py-1 px-4 text-sm text-black italic rounded-md transition-colors duration-200 hover:border-[#FF9F01]"
                style={{ animation: 'fadeIn 0.4s ease-out 1.1s' }}
              >
                Our Story
              </a>
              <a
                href="/about/team"
                className="block border-[#FEB130] border-b-[2px] mb-3  py-1 px-4 text-sm text-black italic rounded-md transition-colors duration-200 hover:border-[#FF9F01]"
                style={{ animation: 'fadeIn 0.4s ease-out 1.2s' }}
              >
                Team
              </a>
            </div>
          )}
        </div>
        <a
          href="/blog"
          className="block mb-2 text-start w-full bg-[#FEB130] py-2 px-4 text-gray-800 hover:bg-[#FF9F01] italic transition-colors duration-200 rounded-md tracking-widest font-bold"
          style={{ animation: 'fadeIn 0.4s ease-out 1.3s' }}
        >
          Blog
        </a>
        <Link
            href="/signin"
            className="mt-4 italic font-bold text-center bg-[#FEB130]  rounded-3xl px-6 py-2 text-sm text-gray-800 hover:bg-[#FF9F01] hover:border-gray-600 transition-colors duration-300"
          >
            Sign In
          </Link>
      </div>
    </div>
  )}


{/* Mobile Menu Off */}

      {/* Overlay Background */}
      {/* {sidebarOpen && (
        <div
          className="fixed inset-0 bg-gray-900 bg-opacity-10 z-40 transition-opacity duration-500 ease-in-out"
          onClick={toggleSidebar}
        />
      )} */}

      {/* Sidebar */}
      <div
        className={`fixed top-0 left-0 h-full w-64 bg-white shadow-lg transform transition-transform duration-500 ease-in-out z-50 ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <button onClick={toggleSidebar} className="p-4">
          <X />
        </button>
        <div className="flex flex-col gap-4 p-4">
          <MobileDropdown label="Cloths" mainLink="/cloths" items={[
            { name: 'T-Shirts', link: '/cloths/t-shirts' },
            { name: 'Jeans', link: '/cloths/jeans' },
          ]} />
          <MobileDropdown label="Jewelry" mainLink="/jewelry" items={[
            { name: 'Necklaces', link: '/jewelry/necklaces' },
            { name: 'Rings', link: '/jewelry/rings' },
          ]} />
          <MobileDropdown label="Sunglasses" mainLink="/sunglasses" items={[
            { name: 'Aviators', link: '/sunglasses/aviators' },
            { name: 'Wayfarers', link: '/sunglasses/wayfarers' },
          ]} />
        </div>
      </div>
    </div>
  );
};

const NavLink = ({ label, href }) => (
  <Link href={href} className="hover:underline">
    {label}
  </Link>
);

const NavDropdown = ({ label, items, mainLink }) => (
  <div className="group relative cursor-pointer">
    <Link href={mainLink} className="hover:underline">
      {label}
    </Link>
    {items.length > 0 && (
      <div className="absolute left-0 top-full mt-2 w-40 bg-white shadow-md rounded-md opacity-0 group-hover:opacity-100 scale-y-0 group-hover:scale-y-100 transform origin-top transition-all duration-300 ease-in-out z-10">
        {items.map((item, index) => (
          <Link href={item.link} key={index} className="block px-4 py-2 hover:bg-gray-100">
            {item.name}
          </Link>
        ))}
      </div>
    )}
  </div>
);

const MobileDropdown = ({ label, items, mainLink }) => {
  const [open, setOpen] = useState(false);
  return (
    <div className="border-b pb-2">
      <div className="flex justify-between items-center w-full">
        <Link href={mainLink} className="text-base font-medium">
          {label}
        </Link>
        {items.length > 0 && (
          <button
            onClick={() => setOpen(!open)}
            className="transition-transform duration-300 ease-in-out"
          >
            <span className={`inline-block transform transition-transform duration-300 ${open ? 'rotate-45' : 'rotate-0'}`}>
              +
            </span>
          </button>
        )}
      </div>
      {items.length > 0 && (
        <div className={`transition-all duration-300 ease-in-out overflow-hidden ${open ? 'max-h-40 mt-2' : 'max-h-0'}`}>
          <div className="ml-4 mt-2 flex flex-col gap-2">
            {items.map((item, index) => (
              <Link href={item.link} key={index} className="text-sm text-gray-700 hover:underline">
                {item.name}
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default Navbar;