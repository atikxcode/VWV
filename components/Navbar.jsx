'use client';
import React, { useState, useRef, useEffect } from 'react';
import { Search, ShoppingCart, Menu, X, Hamburger, HamburgerIcon, AlignLeft } from 'lucide-react';
import Link from 'next/link';

const Navbar = () => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const searchRef = useRef(null);

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
    <div className="border-b shadow-sm sticky top-0 bg-white z-50">
      <div className="flex justify-between items-center p-4 mx-auto">
        {/* Sidebar Toggle Button */}
        <button onClick={toggleSidebar} className="mr-2">
          {sidebarOpen ? <X /> : <Menu />}
        </button>

        {/* Logo */}
        <h2 className="font-bold text-2xl">Trendzone</h2>

        {/* Desktop Navigation */}
        <div className="hidden md:flex gap-6 text-sm">
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
          <NavLink label="Blog" href="/blog" />
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

          <Link href="/cart">
            <ShoppingCart />
          </Link>
          <button className="bg-white border border-black rounded-3xl px-6 py-2 text-sm">Sign In</button>

          {/* Mobile Menu Toggle */}
          <button className="md:hidden ml-2" onClick={toggleMobileMenu}>
            {mobileMenuOpen ? <X /> : <Menu />}
          </button>
        </div>
      </div>

      {/* Mobile Menu */}
      {mobileMenuOpen && (
        <div className="md:hidden flex flex-col gap-3 p-4 bg-white border-t">
          <MobileDropdown label="Home" mainLink="/" items={[]} />
          <MobileDropdown label="New Arrival" mainLink="/new-arrivals" items={[
            { name: 'Men', link: '/new-arrivals/men' },
            { name: 'Women', link: '/new-arrivals/women' },
          ]} />
          <MobileDropdown label="Shop" mainLink="/shop" items={[
            { name: 'Clothing', link: '/shop/clothing' },
            { name: 'Accessories', link: '/shop/accessories' },
          ]} />
          <MobileDropdown label="Contact" mainLink="/contact" items={[
            { name: 'Customer Support', link: '/contact/support' },
            { name: 'Store Locations', link: '/contact/locations' },
          ]} />
          <MobileDropdown label="About Us" mainLink="/about" items={[
            { name: 'Our Story', link: '/about/story' },
            { name: 'Team', link: '/about/team' },
          ]} />
          <MobileDropdown label="Blog" mainLink="/blog" items={[]} />
        </div>
      )}

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