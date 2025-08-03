'use client';
import React, { useState, useRef, useEffect, useContext } from 'react';
import { Search, ShoppingCart, Menu, X, Hamburger, HamburgerIcon, AlignLeft } from 'lucide-react';
import Link from 'next/link';
import { AuthContext } from '../Provider/AuthProvider'; // Adjust path as needed
import { useRouter } from 'next/navigation';

const Navbar = () => {
  const { user, logOut } = useContext(AuthContext); // Access user and logout from AuthContext
  const router = useRouter();

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

  const productOnClick = () => {
    setSidebarOpen(true);
    setMobileMenuOpen(false);
  };

  // Handle logout
 const handleSignOut = () => {
    logOut().then().catch();
  };

  const handleSignIn = () => {
    setSidebarOpen(false); 
   
    router.push('/LoginPage');
  };

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
    <div className="shadow-sm sticky top-0 bg-white z-50">
      <div className="flex justify-between items-center p-4 mx-auto">
        {/* Sidebar Toggle Button Start */}
        {/* <button onClick={toggleSidebar} className="mr-2 hidden">
          {sidebarOpen ? <X /> : <Menu />}
        </button> */}
        {/* Sidebar Toggle Button End */}

        {/* Logo Start */}
        <h2 className="font-bold text-2xl italic tracking-widest">Trendzone</h2>
        {/* Logo End */}

        {/* Desktop Navigation start */}
        <div className="hidden md:flex gap-6 text-sm italic tracking-wide">
          <a
            href="/"
            className="relative hover:text-gray-600 transition-colors group"
          >
            Home
            <span className="absolute left-1/2 bottom-0 h-0.5 bg-gray-600 w-0 group-hover:w-full transform -translate-x-1/2 transition-all duration-300 ease-out"></span>
          </a>

          <div className="relative group">
            <a
              href="/dummy"
              className="relative hover:text-gray-600 transition-colors"
            >
              New Arrival
              <span className="absolute left-1/2 bottom-0 h-0.5 bg-gray-600 w-0 group-hover:w-full transform -translate-x-1/2 transition-all duration-300 ease-out"></span>
            </a>
            <div className="absolute left-0 mt-0 w-48 bg-white shadow-lg rounded-md py-2 z-10 opacity-0 group-hover:opacity-100 group-hover:visible transition-opacity duration-200 invisible">
              <a
                href="/new-arrivals/men"
                className="relative block px-4 py-2 hover:bg-gray-100 text-gray-800 group/sub"
              >
                Men
                <span className="absolute left-1/2 bottom-0 h-0.5 bg-gray-600 w-0 group-hover/sub:w-full transform -translate-x-1/2 transition-all duration-300 ease-out"></span>
              </a>
              <a
                href="/new-arrivals/women"
                className="relative block px-4 py-2 hover:bg-gray-100 text-gray-800 group/sub"
              >
                Women
                <span className="absolute left-1/2 bottom-0 h-0.5 bg-gray-600 w-0 group-hover/sub:w-full transform -translate-x-1/2 transition-all duration-300 ease-out"></span>
              </a>
            </div>
          </div>

          <div className="relative group">
            <a
              href="/shop"
              className="relative hover:text-gray-600 transition-colors"
            >
              Shop
              <span className="absolute left-1/2 bottom-0 h-0.5 bg-gray-600 w-0 group-hover:w-full transform -translate-x-1/2 transition-all duration-300 ease-out"></span>
            </a>
            <div className="absolute left-0 mt-0 w-48 bg-white shadow-lg rounded-md py-2 z-10 opacity-0 group-hover:opacity-100 group-hover:visible transition-opacity duration-200 invisible">
              <a
                href="/shop/clothing"
                className="relative block px-4 py-2 hover:bg-gray-100 text-gray-800 group/sub"
              >
                Clothing
                <span className="absolute left-1/2 bottom-0 h-0.5 bg-gray-600 w-0 group-hover/sub:w-full transform -translate-x-1/2 transition-all duration-300 ease-out"></span>
              </a>
              <a
                href="/shop/accessories"
                className="relative block px-4 py-2 hover:bg-gray-100 text-gray-800 group/sub"
              >
                Accessories
                <span className="absolute left-1/2 bottom-0 h-0.5 bg-gray-600 w-0 group-hover/sub:w-full transform -translate-x-1/2 transition-all duration-300 ease-out"></span>
              </a>
            </div>
          </div>

          <div className="relative group">
            <a
              href="/contact"
              className="relative hover:text-gray-600 transition-colors"
            >
              Contact
              <span className="absolute left-1/2 bottom-0 h-0.5 bg-gray-600 w-0 group-hover:w-full transform -translate-x-1/2 transition-all duration-300 ease-out"></span>
            </a>
            <div className="absolute left-0 mt-0 w-48 bg-white shadow-lg rounded-md py-2 z-10 opacity-0 group-hover:opacity-100 group-hover:visible transition-opacity duration-200 invisible">
              <a
                href="/contact/support"
                className="relative block px-4 py-2 hover:bg-gray-100 text-gray-800 group/sub"
              >
                Customer Support
                <span className="absolute left-1/2 bottom-0 h-0.5 bg-gray-600 w-0 group-hover/sub:w-full transform -translate-x-1/2 transition-all duration-300 ease-out"></span>
              </a>
              <a
                href="/contact/locations"
                className="relative block px-4 py-2 hover:bg-gray-100 text-gray-800 group/sub"
              >
                Store Locations
                <span className="absolute left-1/2 bottom-0 h-0.5 bg-gray-600 w-0 group-hover/sub:w-full transform -translate-x-1/2 transition-all duration-300 ease-out"></span>
              </a>
            </div>
          </div>

          <div className="relative group">
            <a
              href="/about"
              className="relative hover:text-gray-600 transition-colors"
            >
              About Us
              <span className="absolute left-1/2 bottom-0 h-0.5 bg-gray-600 w-0 group-hover:w-full transform -translate-x-1/2 transition-all duration-300 ease-out"></span>
            </a>
            <div className="absolute left-0 mt-0 w-48 bg-white shadow-lg rounded-md py-2 z-10 opacity-0 group-hover:opacity-100 group-hover:visible transition-opacity duration-200 invisible">
              <a
                href="/about/story"
                className="relative block px-4 py-2 hover:bg-gray-100 text-gray-800 group/sub"
              >
                Our Story
                <span className="absolute left-1/2 bottom-0 h-0.5 bg-gray-600 w-0 group-hover/sub:w-full transform -translate-x-1/2 transition-all duration-300 ease-out"></span>
              </a>
              <a
                href="/about/team"
                className="relative block px-4 py-2 hover:bg-gray-100 text-gray-800 group/sub"
              >
                Team
                <span className="absolute left-1/2 bottom-0 h-0.5 bg-gray-600 w-0 group-hover/sub:w-full transform -translate-x-1/2 transition-all duration-300 ease-out"></span>
              </a>
            </div>
          </div>

          <a
            onClick={productOnClick}
            href="#"
            className="relative hover:text-gray-600 transition-colors group"
          >
            Product
            <span className="absolute left-1/2 bottom-0 h-0.5 bg-gray-600 w-0 group-hover:w-full transform -translate-x-1/2 transition-all duration-300 ease-out"></span>
          </a>
        </div>
        {/* Desktop Navigation End */}

        {/* Search Icons start */}
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

          {/* Sign In/Sign Out Button */}
          {user ? (
            <button
              onClick={handleSignOut}
              className="hidden text-[15px] tracking-widest italic md:block bg-[#FEB130] rounded-3xl px-6 py-2 text-gray-800 hover:bg-[#FF9F01] transition-colors duration-200"
            >
              Sign Out
            </button>
          ) : (
            <button
              onClick={handleSignIn}
              className="hidden text-[15px] tracking-widest italic md:block bg-[#FEB130] rounded-3xl px-6 py-2 text-gray-800 hover:bg-[#FF9F01] transition-colors duration-200"
            >
              Sign In
            </button>
          )}

          {/* Mobile Menu Toggle */}
          <button className="md:hidden ml-2" onClick={toggleMobileMenu}>
            {mobileMenuOpen ? <X /> : <Menu />}
          </button>
        </div>
        {/* Search Icons start */}
      </div>

      {/* Mobile Menu start */}
      {mobileMenuOpen && (
        <div
          className="fixed top-0 right-0 w-64 h-full bg-white shadow-xl transform transition-transform duration-300 ease-in-out z-50"
          style={{
            animation: isClosing
              ? 'slideOutRight 0.3s ease-in'
              : 'slideInRight 0.3s ease-out',
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
          <div className="flex flex-col p-4 space-y-2 text-sm italic tracking-widest">
            <a
              href="/"
              className="relative block mb-2 text-start w-full py-2 px-4 text-gray-800 font-bold hover:text-gray-600 transition-colors group"
              style={{ animation: 'fadeIn 0.4s ease-out' }}
            >
              Home
              <span className="absolute left-1/2 bottom-0 h-0.5 bg-gray-600 w-0 group-hover:w-full transform -translate-x-1/2 transition-all duration-300 ease-out"></span>
            </a>
            <div className="group">
              <button
                onClick={() => toggleSubmenu('New Arrival')}
                className="relative block mb-2 text-start w-full py-2 px-4 text-gray-800 font-bold hover:text-gray-600 transition-colors"
                style={{ animation: 'fadeIn 0.4s ease-out 0.1s' }}
              >
                New Arrival
                <span className="absolute left-1/2 bottom-0 h-0.5 bg-gray-600 w-0 group-hover:w-full transform -translate-x-1/2 transition-all duration-300 ease-out"></span>
              </button>
              {openSubmenu === 'New Arrival' && (
                <div
                  className="ml-4 space-y-1 transform transition-transform duration-300 ease-in-out"
                  style={{
                    animation:
                      openSubmenu === 'New Arrival'
                        ? 'slideInRight 0.3s ease-out'
                        : 'slideOutRight 0.3s ease-in',
                  }}
                >
                  <a
                    href="/new-arrivals/men"
                    className="relative block py-1 px-4 text-sm text-black italic group/sub"
                    style={{ animation: 'fadeIn 0.4s ease-out 0.2s' }}
                  >
                    Men
                    <span className="absolute left-1/2 bottom-0 h-0.5 bg-gray-600 w-0 group-hover/sub:w-full transform -translate-x-1/2 transition-all duration-300 ease-out"></span>
                  </a>
                  <a
                    href="/new-arrivals/women"
                    className="relative block py-1 px-4 text-sm text-black italic group/sub"
                    style={{ animation: 'fadeIn 0.4s ease-out 0.3s' }}
                  >
                    Women
                    <span className="absolute left-1/2 bottom-0 h-0.5 bg-gray-600 w-0 group-hover/sub:w-full transform -translate-x-1/2 transition-all duration-300 ease-out"></span>
                  </a>
                </div>
              )}
            </div>
            <div className="group">
              <button
                onClick={() => toggleSubmenu('Shop')}
                className="relative block mb-2 text-start w-full py-2 px-4 text-gray-800 font-bold hover:text-gray-600 transition-colors"
                style={{ animation: 'fadeIn 0.4s ease-out 0.4s' }}
              >
                Shop
                <span className="absolute left-1/2 bottom-0 h-0.5 bg-gray-600 w-0 group-hover:w-full transform -translate-x-1/2 transition-all duration-300 ease-out"></span>
              </button>
              {openSubmenu === 'Shop' && (
                <div
                  className="ml-4 space-y-1 transform transition-transform duration-300 ease-in-out"
                  style={{
                    animation:
                      openSubmenu === 'Shop'
                        ? 'slideInRight 0.3s ease-out'
                        : 'slideOutRight 0.3s ease-in',
                  }}
                >
                  <a
                    href="/shop/clothing"
                    className="relative block py-1 px-4 text-sm text-black italic group/sub"
                    style={{ animation: 'fadeIn 0.4s ease-out 0.5s' }}
                  >
                    Clothing
                    <span className="absolute left-1/2 bottom-0 h-0.5 bg-gray-600 w-0 group-hover/sub:w-full transform -translate-x-1/2 transition-all duration-300 ease-out"></span>
                  </a>
                  <a
                    href="/shop/accessories"
                    className="relative block py-1 px-4 text-sm text-black italic group/sub"
                    style={{ animation: 'fadeIn 0.4s ease-out 0.6s' }}
                  >
                    Accessories
                    <span className="absolute left-1/2 bottom-0 h-0.5 bg-gray-600 w-0 group-hover/sub:w-full transform -translate-x-1/2 transition-all duration-300 ease-out"></span>
                  </a>
                </div>
              )}
            </div>
            <div className="group">
              <button
                onClick={() => toggleSubmenu('Contact')}
                className="relative block mb-2 text-start w-full py-2 px-4 text-gray-800 font-bold hover:text-gray-600 transition-colors"
                style={{ animation: 'fadeIn 0.4s ease-out 0.7s' }}
              >
                Contact
                <span className="absolute left-1/2 bottom-0 h-0.5 bg-gray-600 w-0 group-hover:w-full transform -translate-x-1/2 transition-all duration-300 ease-out"></span>
              </button>
              {openSubmenu === 'Contact' && (
                <div
                  className="ml-4 space-y-1 transform transition-transform duration-300 ease-in-out"
                  style={{
                    animation:
                      openSubmenu === 'Contact'
                        ? 'slideInRight 0.3s ease-out'
                        : 'slideOutRight 0.3s ease-in',
                  }}
                >
                  <a
                    href="/contact/support"
                    className="relative block py-1 px-4 text-sm text-black italic group/sub"
                    style={{ animation: 'fadeIn 0.4s ease-out 0.8s' }}
                  >
                    Customer Support
                    <span className="absolute left-1/2 bottom-0 h-0.5 bg-gray-600 w-0 group-hover/sub:w-full transform -translate-x-1/2 transition-all duration-300 ease-out"></span>
                  </a>
                  <a
                    href="/contact/locations"
                    className="relative block py-1 px-4 text-sm text-black italic group/sub"
                    style={{ animation: 'fadeIn 0.4s ease-out 0.9s' }}
                  >
                    Store Locations
                    <span className="absolute left-1/2 bottom-0 h-0.5 bg-gray-600 w-0 group-hover/sub:w-full transform -translate-x-1/2 transition-all duration-300 ease-out"></span>
                  </a>
                </div>
              )}
            </div>
            <div className="group">
              <button
                onClick={() => toggleSubmenu('About Us')}
                className="relative block mb-2 text-start w-full py-2 px-4 text-gray-800 font-bold hover:text-gray-600 transition-colors"
                style={{ animation: 'fadeIn 0.4s ease-out 1s' }}
              >
                About Us
                <span className="absolute left-1/2 bottom-0 h-0.5 bg-gray-600 w-0 group-hover:w-full transform -translate-x-1/2 transition-all duration-300 ease-out"></span>
              </button>
              {openSubmenu === 'About Us' && (
                <div
                  className="ml-4 space-y-1 transform transition-transform duration-300 ease-in-out"
                  style={{
                    animation:
                      openSubmenu === 'About Us'
                        ? 'slideInRight 0.3s ease-out'
                        : 'slideOutRight 0.3s ease-in',
                  }}
                >
                  <a
                    href="/about/story"
                    className="relative block py-1 px-4 text-sm text-black italic group/sub"
                    style={{ animation: 'fadeIn 0.4s ease-out 1.1s' }}
                  >
                    Our Story
                    <span className="absolute left-1/2 bottom-0 h-0.5 bg-gray-600 w-0 group-hover/sub:w-full transform -translate-x-1/2 transition-all duration-300 ease-out"></span>
                  </a>
                  <a
                    href="/about/team"
                    className="relative block py-1 px-4 text-sm text-black italic group/sub"
                    style={{ animation: 'fadeIn 0.4s ease-out 1.2s' }}
                  >
                    Team
                    <span className="absolute left-1/2 bottom-0 h-0.5 bg-gray-600 w-0 group-hover/sub:w-full transform -translate-x-1/2 transition-all duration-300 ease-out"></span>
                  </a>
                </div>
              )}
            </div>
            <a
              onClick={productOnClick}
              href="#"
              className="relative block mb-2 text-start w-full py-2 px-4 text-gray-800 font-bold hover:text-gray-600 transition-colors group"
              style={{ animation: 'fadeIn 0.4s ease-out 1.3s' }}
            >
              Product
              <span className="absolute left-1/2 bottom-0 h-0.5 bg-gray-600 w-0 group-hover:w-full transform -translate-x-1/2 transition-all duration-300 ease-out"></span>
            </a>
            {user ? (
              <button
                onClick={handleSignOut}
                className="mt-4 italic font-bold text-center bg-[#FEB130] rounded-3xl px-6 py-2 text-sm text-gray-800 hover:bg-[#FF9F01] hover:border-gray-600 transition-colors duration-300"
              >
                Sign Out
              </button>
            ) : (
              <Link
                href="/LoginPage"
                className="mt-4 italic font-bold text-center bg-[#FEB130] rounded-3xl px-6 py-2 text-sm text-gray-800 hover:bg-[#FF9F01] hover:border-gray-600 transition-colors duration-300"
              >
                Sign In
              </Link>
            )}
          </div>
        </div>
      )}
      {/* Mobile Menu End */}

      {/* Sidebar Start */}
      <div
        className={`fixed top-0 left-0 h-full w-72 bg-white shadow-xl transform transition-transform duration-300 ease-in-out z-50 overflow-y-auto ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
        style={{
          animation: isClosing
            ? 'slideOutLeft 0.3s ease-in'
            : 'slideInLeft 0.3s ease-out',
        }}
      >
        {/* Header */}
        <div className="bg-[#232F3E] text-white flex items-center gap-2 p-4">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            fill="white"
            className="w-6 h-6"
            viewBox="0 0 24 24"
          >
            <path d="M12 12c2.209 0 4-1.791 4-4s-1.791-4-4-4-4 1.791-4 4 1.791 4 4 4zm0 2c-2.671 0-8 1.337-8 4v2h16v-2c0-2.663-5.329-4-8-4z" />
          </svg>
          <span className="font-medium">Hello, sign in</span>
        </div>

        {/* Menu Sections */}
        <div className="flex flex-col p-4 space-y-2 text-sm italic tracking-widest">
          <a
            href="/"
            className="relative block mb-2 text-start w-full py-2 px-4 text-gray-800 font-bold hover:text-gray-600 transition-colors group"
            style={{ animation: 'fadeIn 0.4s ease-out' }}
          >
            Home
            <span className="absolute left-1/2 bottom-0 h-0.5 bg-gray-600 w-0 group-hover:w-full transform -translate-x-1/2 transition-all duration-300 ease-out"></span>
          </a>
          <div className="group">
            <button
              onClick={() => toggleSubmenu('New Arrival')}
              className="relative block mb-2 text-start w-full py-2 px-4 text-gray-800 font-bold hover:text-gray-600 transition-colors"
              style={{ animation: 'fadeIn 0.4s ease-out 0.1s' }}
            >
              New Arrival
              <span className="absolute left-1/2 bottom-0 h-0.5 bg-gray-600 w-0 group-hover:w-full transform -translate-x-1/2 transition-all duration-300 ease-out"></span>
            </button>
            {openSubmenu === 'New Arrival' && (
              <div
                className="ml-4 space-y-1 transform transition-transform duration-300 ease-in-out"
                style={{
                  animation:
                    openSubmenu === 'New Arrival'
                      ? 'slideInRight 0.3s ease-out'
                      : 'slideOutRight 0.3s ease-in',
                }}
              >
                <a
                  href="/new-arrivals/men"
                  className="relative block py-1 px-4 text-sm text-black italic group/sub"
                  style={{ animation: 'fadeIn 0.4s ease-out 0.2s' }}
                >
                  Men
                  <span className="absolute left-1/2 bottom-0 h-0.5 bg-gray-600 w-0 group-hover/sub:w-full transform -translate-x-1/2 transition-all duration-300 ease-out"></span>
                </a>
                <a
                  href="/new-arrivals/women"
                  className="relative block py-1 px-4 text-sm text-black italic group/sub"
                  style={{ animation: 'fadeIn 0.4s ease-out 0.3s' }}
                >
                  Women
                  <span className="absolute left-1/2 bottom-0 h-0.5 bg-gray-600 w-0 group-hover/sub:w-full transform -translate-x-1/2 transition-all duration-300 ease-out"></span>
                </a>
              </div>
            )}
          </div>
          <div className="group">
            <button
              onClick={() => toggleSubmenu('Shop')}
              className="relative block mb-2 text-start w-full py-2 px-4 text-gray-800 font-bold hover:text-gray-600 transition-colors"
              style={{ animation: 'fadeIn 0.4s ease-out 0.4s' }}
            >
              Shop
              <span className="absolute left-1/2 bottom-0 h-0.5 bg-gray-600 w-0 group-hover:w-full transform -translate-x-1/2 transition-all duration-300 ease-out"></span>
            </button>
            {openSubmenu === 'Shop' && (
              <div
                className="ml-4 space-y-1 transform transition-transform duration-300 ease-in-out"
                style={{
                  animation:
                    openSubmenu === 'Shop'
                      ? 'slideInRight 0.3s ease-out'
                      : 'slideOutRight 0.3s ease-in',
                }}
              >
                <a
                  href="/shop/clothing"
                  className="relative block py-1 px-4 text-sm text-black italic group/sub"
                  style={{ animation: 'fadeIn 0.4s ease-out 0.5s' }}
                >
                  Clothing
                  <span className="absolute left-1/2 bottom-0 h-0.5 bg-gray-600 w-0 group-hover/sub:w-full transform -translate-x-1/2 transition-all duration-300 ease-out"></span>
                </a>
                <a
                  href="/shop/accessories"
                  className="relative block py-1 px-4 text-sm text-black italic group/sub"
                  style={{ animation: 'fadeIn 0.4s ease-out 0.6s' }}
                >
                  Accessories
                  <span className="absolute left-1/2 bottom-0 h-0.5 bg-gray-600 w-0 group-hover/sub:w-full transform -translate-x-1/2 transition-all duration-300 ease-out"></span>
                </a>
              </div>
            )}
          </div>
          <div className="group">
            <button
              onClick={() => toggleSubmenu('Contact')}
              className="relative block mb-2 text-start w-full py-2 px-4 text-gray-800 font-bold hover:text-gray-600 transition-colors"
              style={{ animation: 'fadeIn 0.4s ease-out 0.7s' }}
            >
              Contact
              <span className="absolute left-1/2 bottom-0 h-0.5 bg-gray-600 w-0 group-hover:w-full transform -translate-x-1/2 transition-all duration-300 ease-out"></span>
            </button>
            {openSubmenu === 'Contact' && (
              <div
                className="ml-4 space-y-1 transform transition-transform duration-300 ease-in-out"
                style={{
                  animation:
                    openSubmenu === 'Contact'
                      ? 'slideInRight 0.3s ease-out'
                      : 'slideOutRight 0.3s ease-in',
                }}
              >
                <a
                  href="/contact/support"
                  className="relative block py-1 px-4 text-sm text-black italic group/sub"
                  style={{ animation: 'fadeIn 0.4s ease-out 0.8s' }}
                >
                  Customer Support
                  <span className="absolute left-1/2 bottom-0 h-0.5 bg-gray-600 w-0 group-hover/sub:w-full transform -translate-x-1/2 transition-all duration-300 ease-out"></span>
                </a>
                <a
                  href="/contact/locations"
                  className="relative block py-1 px-4 text-sm text-black italic group/sub"
                  style={{ animation: 'fadeIn 0.4s ease-out 0.9s' }}
                >
                  Store Locations
                  <span className="absolute left-1/2 bottom-0 h-0.5 bg-gray-600 w-0 group-hover/sub:w-full transform -translate-x-1/2 transition-all duration-300 ease-out"></span>
                </a>
              </div>
            )}
          </div>
          <div className="group">
            <button
              onClick={() => toggleSubmenu('About Us')}
              className="relative block mb-2 text-start w-full py-2 px-4 text-gray-800 font-bold hover:text-gray-600 transition-colors"
              style={{ animation: 'fadeIn 0.4s ease-out 1s' }}
            >
              About Us
              <span className="absolute left-1/2 bottom-0 h-0.5 bg-gray-600 w-0 group-hover:w-full transform -translate-x-1/2 transition-all duration-300 ease-out"></span>
            </button>
            {openSubmenu === 'About Us' && (
              <div
                className="ml-4 space-y-1 transform transition-transform duration-300 ease-in-out"
                style={{
                  animation:
                    openSubmenu === 'About Us'
                      ? 'slideInRight 0.3s ease-out'
                      : 'slideOutRight 0.3s ease-in',
                }}
              >
                <a
                  href="/about/story"
                  className="relative block py-1 px-4 text-sm text-black italic group/sub"
                  style={{ animation: 'fadeIn 0.4s ease-out 1.1s' }}
                >
                  Our Story
                  <span className="absolute left-1/2 bottom-0 h-0.5 bg-gray-600 w-0 group-hover/sub:w-full transform -translate-x-1/2 transition-all duration-300 ease-out"></span>
                </a>
                <a
                  href="/about/team"
                  className="relative block py-1 px-4 text-sm text-black italic group/sub"
                  style={{ animation: 'fadeIn 0.4s ease-out 1.2s' }}
                >
                  Team
                  <span className="absolute left-1/2 bottom-0 h-0.5 bg-gray-600 w-0 group-hover/sub:w-full transform -translate-x-1/2 transition-all duration-300 ease-out"></span>
                </a>
              </div>
            )}
          </div>
          <a
            onClick={productOnClick}
            href="#"
            className="relative block mb-2 text-start w-full py-2 px-4 text-gray-800 font-bold hover:text-gray-600 transition-colors group"
            style={{ animation: 'fadeIn 0.4s ease-out 1.3s' }}
          >
            Product
            <span className="absolute left-1/2 bottom-0 h-0.5 bg-gray-600 w-0 group-hover:w-full transform -translate-x-1/2 transition-all duration-300 ease-out"></span>
          </a>
          {user ? (
            <button 
              onClick={handleSignOut}
              className="mt-4 italic font-bold text-center bg-[#FEB130] rounded-3xl px-6 py-2 text-sm text-gray-800 hover:bg-[#FF9F01] hover:border-gray-600 transition-colors duration-300"
            >
              Sign Out
            </button>
          ) : (
            <button
              onClick={handleSignIn}
              className="mt-4 italic font-bold text-center bg-[#FEB130] rounded-3xl px-6 py-2 text-sm text-gray-800 hover:bg-[#FF9F01] hover:border-gray-600 transition-colors duration-300"
            >
              Sign In
            </button>
          )}
        </div>

        {/* Close Button */}
        <button
          onClick={() => {
            setIsClosing(true);
            setTimeout(() => {
              setSidebarOpen(false);
              setIsClosing(false);
              setOpenSubmenu(null);
            }, 300);
          }}
          className="absolute top-3 right-3 text-gray-500 hover:text-black text-2xl focus:outline-none"
          aria-label="Close sidebar"
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
      {/* Sidebar End */}
    </div>
  );
};

// const NavLink = ({ label, href }) => (
//   <Link href={href} className="hover:underline">
//     {label}
//   </Link>
// );

// const NavDropdown = ({ label, items, mainLink }) => (
//   <div className="group relative cursor-pointer">
//     <Link href={mainLink} className="hover:underline">
//       {label}
//     </Link>
//     {items.length > 0 && (
//       <div className="absolute left-0 top-full mt-2 w-40 bg-white shadow-md rounded-md opacity-0 group-hover:opacity-100 scale-y-0 group-hover:scale-y-100 transform origin-top transition-all duration-300 ease-in-out z-10">
//         {items.map((item, index) => (
//           <Link href={item.link} key={index} className="block px-4 py-2 hover:bg-gray-100">
//             {item.name}
//           </Link>
//         ))}
//       </div>
//     )}
//   </div>
// );

const MobileDropdown = ({ label, mainLink, items }) => {
  const [isOpen, setIsOpen] = useState(false);
  return (
    <div className="border-b">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full text-left p-2 hover:bg-gray-100 flex justify-between items-center"
      >
        {label} <span>{isOpen ? '▼' : '▶'}</span>
      </button>
      {isOpen && (
        <div className="pl-4">
          <a
            href={mainLink}
            className="block p-2 text-gray-600 hover:text-black"
          >
            {label}
          </a>
          {items.map((item) => (
            <a
              key={item.name}
              href={item.link}
              className="block pl-4 p-2 text-gray-600 hover:text-black"
            >
              {item.name}
            </a>
          ))}
        </div>
      )}
    </div>
  );
};

export default Navbar;