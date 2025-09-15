'use client'

import React, { useState, useRef, useEffect, useContext } from 'react'
import {
  Search,
  ShoppingCart,
  Menu,
  X,
  Hamburger,
  HamburgerIcon,
  AlignLeft,
  User,
  Mail,
  Heart,
  Package,
  Shield,
  RefreshCcw,
  ServerIcon,
} from 'lucide-react'
import Link from 'next/link'
import Image from 'next/image'
import { AuthContext } from '../Provider/AuthProvider' // Adjust path as needed
import { useRouter } from 'next/navigation'
import { useCart } from './hooks/useCart.jsx'
import { useFavorites } from './hooks/useFavorites.jsx'

const Navbar = () => {
  const { user, logOut } = useContext(AuthContext) // Access user and logout from AuthContext
  const router = useRouter()

  // Add cart and favorites hooks
  const { getCartItemsCount, isHydrated: cartHydrated } = useCart()
  const { favorites, isHydrated: favoritesHydrated } = useFavorites()

  const [sidebarOpen, setSidebarOpen] = useState(false)
  const searchRef = useRef(null)

  // Search functionality states
  const [searchQuery, setSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState([])
  const [isSearching, setIsSearching] = useState(false)
  const [showSearchResults, setShowSearchResults] = useState(false)

  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [openSubmenu, setOpenSubmenu] = useState(null)
  const [isClosing, setIsClosing] = useState(false)
  const toggleSubmenu = (label) => {
    setOpenSubmenu(openSubmenu === label ? null : label)
  }

  const toggleMobileMenu = () => setMobileMenuOpen(!mobileMenuOpen)

  // Handle logout
  const handleSignOut = () => {
    logOut().then().catch()
  }

  const handleSignIn = () => {
    router.push('/RegistrationPage')
  }

  // Search functionality
  const handleSearch = async (query) => {
    if (!query.trim()) {
      setSearchResults([])
      setShowSearchResults(false)
      return
    }

    setIsSearching(true)
    setShowSearchResults(true)

    try {
      const response = await fetch(`/api/products?search=${encodeURIComponent(query)}&limit=5`)
      if (response.ok) {
        const data = await response.json()
        setSearchResults(data?.products || [])
      } else {
        setSearchResults([])
      }
    } catch (error) {
      console.error('Search error:', error)
      setSearchResults([])
    } finally {
      setIsSearching(false)
    }
  }

  // Debounced search
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      handleSearch(searchQuery)
    }, 300)

    return () => clearTimeout(timeoutId)
  }, [searchQuery])

  // Close search results when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (searchRef.current && !searchRef.current.contains(event.target)) {
        setShowSearchResults(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const handleProductClick = (productId) => {
    setShowSearchResults(false)
    setSearchQuery('')
    router.push(`/products/${productId}`)
  }

  return (
    <div>
      {/* Navbar First Part */}
      <div className="text-black">
        {/* First part */}
        <div className="mx-10 flex gap-6 md:gap-0 flex-col md:flex-row justify-between pt-4 mt-2 items-center">
          <div className=" flex items-center gap-2">
            <span>
              <Mail size={17}></Mail>
            </span>
            <span> vwv@gmail.com</span>
          </div>

          <div className=" items-center text-white  md:w-[1000px]">
            <p className="text-center uppercase text-sm md:text-[14px] tracking-[4px] text-[#83766E] md:leading-[30px]">
              {' '}
              <span className="text-purple-400 font-bold md:font-semibold md:text-[30px] tracking-[8px] uppercase">
                WARNING
              </span>{' '}
              <span className="text-purple-400 md:text-[24px] tracking-[8px] uppercase">
                [
              </span>{' '}
              Contains nicotine, a highly addictive substance. For adults of
              legal smoking age only.{' '}
              <span className="text-purple-400 md:text-[24px] tracking-[8px] uppercase">
                ]
              </span>
            </p>
          </div>

          <div className="flex flex-row gap-4">
            <a href="#">Contact</a>
            <a href="#">Support</a>
            <a href="#">About</a>
          </div>
        </div>

        {/* Search field */}
        <div className="relative flex justify-center items-center h-20 w-full">
          {/* Ultra-Thin Horizontal Line */}
          <div className="absolute top-1/2 left-0 w-full h-[0.5px] bg-gray-300"></div>

          {/* Search Box */}
          <div ref={searchRef} className="relative flex items-center bg-gray-200 rounded-full px-3 py-2 w-[800px] h-[30px] mt-1">
            <input
              className="bg-transparent outline-none text-gray-800 flex-1 placeholder-gray-500 px-2 text-sm"
              type="text"
              placeholder="Search products..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onFocus={() => searchQuery.trim() && setShowSearchResults(true)}
            />
            <button className="p-2 text-gray-600">
              {isSearching ? (
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-600"></div>
              ) : (
                <Search size={17} />
              )}
            </button>

            {/* Search Results Dropdown */}
            {showSearchResults && (
              <div className="absolute top-full left-0 right-0 bg-white shadow-lg rounded-lg mt-2 z-50 max-h-80 overflow-y-auto">
                {isSearching ? (
                  <div className="p-4 text-center text-gray-500">
                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-purple-600 mx-auto mb-2"></div>
                    Searching...
                  </div>
                ) : searchResults.length > 0 ? (
                  <div className="p-2">
                    <div className="text-xs text-gray-500 mb-2 px-2">
                      Found {searchResults.length} result{searchResults.length !== 1 ? 's' : ''}
                    </div>
                    <div className="flex flex-wrap gap-3">
                      {searchResults.map((product) => (
                        <div
                          key={product._id}
                          onClick={() => handleProductClick(product._id)}
                          className="flex items-center gap-3 p-2 hover:bg-gray-50 rounded-lg cursor-pointer transition-colors flex-shrink-0 w-48"
                        >
                          {/* Product Image */}
                          <div className="w-12 h-12 bg-gray-100 rounded-lg overflow-hidden flex-shrink-0">
                            {product.images && product.images.length > 0 && product.images[0]?.url ? (
                              <Image
                                src={product.images[0].url}
                                alt={product.name || 'Product'}
                                width={48}
                                height={48}
                                className="w-full h-full object-cover"
                                unoptimized={true}
                              />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center">
                                <Package size={20} className="text-gray-400" />
                              </div>
                            )}
                          </div>
                          
                          {/* Product Details */}
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-gray-900 truncate">
                              {product.name}
                            </p>
                            {product.brand && (
                              <p className="text-xs text-gray-500 truncate">
                                {product.brand}
                              </p>
                            )}
                            <p className="text-xs text-purple-600 font-medium">
                              BDT {product.price?.toLocaleString() || '0'}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : searchQuery.trim() ? (
                  <div className="p-4 text-center text-gray-500">
                    <Package size={32} className="mx-auto mb-2 text-gray-300" />
                    <p className="text-sm">No products found for "{searchQuery}"</p>
                    <p className="text-xs text-gray-400 mt-1">Try different keywords</p>
                  </div>
                ) : null}
              </div>
            )}
          </div>
        </div>

        {/* Navbar Start */}

        <div className=" mx-10 pb-4 flex justify-between">
          {/* WebSite Name */}
          <a
            href="/"
            className="md:text-2xl font-bold tracking-[10px] text-purple-400 text-center"
          >
            V<span className="text-[#83766E]">ibe</span> W
            <span className="text-[#83766E]">ith</span> V
            <span className="text-[#83766E]">ape</span>{' '}
          </a>

          {/* Desktop Navigation start */}
          <div className="hidden xl:flex gap-6 text-sm  tracking-wide">
            {/* E-LIQUID */}
            <div className="relative group">
              <a
                href="/dummy"
                className="relative hover:text-purple-400 transition-colors"
              >
                E-LIQUID
                <span className="absolute left-1/2 bottom-0 h-0.5 bg-purple-400 w-0 group-hover:w-full transform -translate-x-1/2 transition-all duration-300 ease-out"></span>
              </a>
              <div className="absolute left-0 mt-0 w-48 bg-white shadow-lg rounded-md py-2 z-10 opacity-0 group-hover:opacity-100 group-hover:visible transition-opacity duration-200 invisible">
                <a
                  href="/new-arrivals/men"
                  className="relative block px-4 py-2 hover:bg-gray-100 text-gray-800 hover:text-purple-400 group/sub"
                >
                  Fruits
                  <span className="absolute left-1/2 bottom-0 h-0.5 bg-purple-400 w-0 group-hover/sub:w-full transform -translate-x-1/2 transition-all duration-300 ease-out"></span>
                </a>
                <a
                  href="/new-arrivals/women"
                  className="relative block px-4 py-2 hover:bg-gray-100 text-gray-800 hover:text-purple-400 group/sub"
                >
                  Bakery & Dessert
                  <span className="absolute left-1/2 bottom-0 h-0.5 bg-purple-400 w-0 group-hover/sub:w-full transform -translate-x-1/2 transition-all duration-300 ease-out"></span>
                </a>
                <a
                  href="/new-arrivals/women"
                  className="relative block px-4 py-2 hover:bg-gray-100 text-gray-800 hover:text-purple-400 group/sub"
                >
                  Tobacco
                  <span className="absolute left-1/2 bottom-0 h-0.5 bg-purple-400 w-0 group-hover/sub:w-full transform -translate-x-1/2 transition-all duration-300 ease-out"></span>
                </a>
                <a
                  href="/new-arrivals/women"
                  className="relative block px-4 py-2 hover:bg-gray-100 text-gray-800 hover:text-purple-400 group/sub"
                >
                  Custard & Cream
                  <span className="absolute left-1/2 bottom-0 h-0.5 bg-purple-400 w-0 group-hover/sub:w-full transform -translate-x-1/2 transition-all duration-300 ease-out"></span>
                </a>
                <a
                  href="/new-arrivals/women"
                  className="relative block px-4 py-2 hover:bg-gray-100 text-gray-800 hover:text-purple-400 group/sub"
                >
                  Coffee
                  <span className="absolute left-1/2 bottom-0 h-0.5 bg-purple-400 w-0 group-hover/sub:w-full transform -translate-x-1/2 transition-all duration-300 ease-out"></span>
                </a>
                <a
                  href="/new-arrivals/women"
                  className="relative block px-4 py-2 hover:bg-gray-100 text-gray-800 hover:text-purple-400 group/sub"
                >
                  Menthol / Mint
                  <span className="absolute left-1/2 bottom-0 h-0.5 bg-purple-400 w-0 group-hover/sub:w-full transform -translate-x-1/2 transition-all duration-300 ease-out"></span>
                </a>
              </div>
            </div>
            {/* TANKS */}
            <div className="relative group">
              <a
                href="/shop"
                className="relative hover:text-purple-400 transition-colors"
              >
                TANKS
                <span className="absolute left-1/2 bottom-0 h-0.5 bg-purple-400 w-0 group-hover:w-full transform -translate-x-1/2 transition-all duration-300 ease-out"></span>
              </a>
              <div className="absolute left-0 mt-0 w-48 bg-white shadow-lg rounded-md py-2 z-10 opacity-0 group-hover:opacity-100 group-hover:visible transition-opacity duration-200 invisible">
                <a
                  href="/shop/clothing"
                  className="relative block px-4 py-2 hover:bg-gray-100 text-gray-800 hover:text-purple-400 group/sub"
                >
                  Rda
                  <span className="absolute left-1/2 bottom-0 h-0.5 bg-purple-400 w-0 group-hover/sub:w-full transform -translate-x-1/2 transition-all duration-300 ease-out"></span>
                </a>
                <a
                  href="/shop/accessories"
                  className="relative block px-4 py-2 hover:bg-gray-100 text-gray-800 hover:text-purple-400 group/sub"
                >
                  Rta
                  <span className="absolute left-1/2 bottom-0 h-0.5 bg-purple-400 w-0 group-hover/sub:w-full transform -translate-x-1/2 transition-all duration-300 ease-out"></span>
                </a>
                <a
                  href="/shop/accessories"
                  className="relative block px-4 py-2 hover:bg-gray-100 text-gray-800 hover:text-purple-400 group/sub"
                >
                  Rdta
                  <span className="absolute left-1/2 bottom-0 h-0.5 bg-purple-400 w-0 group-hover/sub:w-full transform -translate-x-1/2 transition-all duration-300 ease-out"></span>
                </a>
                <a
                  href="/shop/accessories"
                  className="relative block px-4 py-2 hover:bg-gray-100 text-gray-800 hover:text-purple-400 group/sub"
                >
                  Subohm
                  <span className="absolute left-1/2 bottom-0 h-0.5 bg-purple-400 w-0 group-hover/sub:w-full transform -translate-x-1/2 transition-all duration-300 ease-out"></span>
                </a>
                <a
                  href="/shop/accessories"
                  className="relative block px-4 py-2 hover:bg-gray-100 text-gray-800 hover:text-purple-400 group/sub"
                >
                  Disposable
                  <span className="absolute left-1/2 bottom-0 h-0.5 bg-purple-400 w-0 group-hover/sub:w-full transform -translate-x-1/2 transition-all duration-300 ease-out"></span>
                </a>
              </div>
            </div>
            {/* NIC SALTS */}
            <div className="relative group">
              <a
                href="/contact"
                className="relative hover:text-purple-400 transition-colors"
              >
                NIC SALTS
                <span className="absolute left-1/2 bottom-0 h-0.5 bg-purple-400 w-0 group-hover:w-full transform -translate-x-1/2 transition-all duration-300 ease-out"></span>
              </a>
              <div className="absolute left-0 mt-0 w-48 bg-white shadow-lg rounded-md py-2 z-10 opacity-0 group-hover:opacity-100 group-hover:visible transition-opacity duration-200 invisible">
                <a
                  href="/contact/support"
                  className="relative block px-4 py-2 hover:bg-gray-100 text-gray-800 hover:text-purple-400 group/sub"
                >
                  Fruits
                  <span className="absolute left-1/2 bottom-0 h-0.5 bg-purple-400 w-0 group-hover/sub:w-full transform -translate-x-1/2 transition-all duration-300 ease-out"></span>
                </a>
                <a
                  href="/contact/locations"
                  className="relative block px-4 py-2 hover:bg-gray-100 text-gray-800 hover:text-purple-400 group/sub"
                >
                  Bakery & Dessert
                  <span className="absolute left-1/2 bottom-0 h-0.5 bg-purple-400 w-0 group-hover/sub:w-full transform -translate-x-1/2 transition-all duration-300 ease-out"></span>
                </a>
                <a
                  href="/contact/locations"
                  className="relative block px-4 py-2 hover:bg-gray-100 text-gray-800 hover:text-purple-400 group/sub"
                >
                  Custard & Cream
                  <span className="absolute left-1/2 bottom-0 h-0.5 bg-purple-400 w-0 group-hover/sub:w-full transform -translate-x-1/2 transition-all duration-300 ease-out"></span>
                </a>
                <a
                  href="/contact/locations"
                  className="relative block px-4 py-2 hover:bg-gray-100 text-gray-800 hover:text-purple-400 group/sub"
                >
                  Coffee
                  <span className="absolute left-1/2 bottom-0 h-0.5 bg-purple-400 w-0 group-hover/sub:w-full transform -translate-x-1/2 transition-all duration-300 ease-out"></span>
                </a>
                <a
                  href="/contact/locations"
                  className="relative block py-1 px-4 text-sm text-black  group/sub"
                >
                  Menthol / Mint
                  <span className="absolute left-1/2 bottom-0 h-0.5 bg-purple-400 w-0 group-hover/sub:w-full transform -translate-x-1/2 transition-all duration-300 ease-out"></span>
                </a>
              </div>
            </div>
            {/* POD SYSTEM */}
            <div className="relative group">
              <a
                href="/about"
                className="relative hover:text-purple-400 transition-colors"
              >
                POD SYSTEM
                <span className="absolute left-1/2 bottom-0 h-0.5 bg-purple-400 w-0 group-hover:w-full transform -translate-x-1/2 transition-all duration-300 ease-out"></span>
              </a>
              <div className="absolute left-0 mt-0 w-48 bg-white shadow-lg rounded-md py-2 z-10 opacity-0 group-hover:opacity-100 group-hover:visible transition-opacity duration-200 invisible">
                <a
                  href="/about/story"
                  className="relative block px-4 py-2 hover:bg-gray-100 text-gray-800 hover:text-purple-400 group/sub"
                >
                  Disposable
                  <span className="absolute left-1/2 bottom-0 h-0.5 bg-purple-400 w-0 group-hover/sub:w-full transform -translate-x-1/2 transition-all duration-300 ease-out"></span>
                </a>
                <a
                  href="/about/team"
                  className="relative block px-4 py-2 hover:bg-gray-100 text-gray-800 hover:text-purple-400 group/sub"
                >
                  Refillable Pod Kit
                  <span className="absolute left-1/2 bottom-0 h-0.5 bg-purple-400 w-0 group-hover/sub:w-full transform -translate-x-1/2 transition-all duration-300 ease-out"></span>
                </a>
                <a
                  href="/about/team"
                  className="relative block px-4 py-2 hover:bg-gray-100 text-gray-800 hover:text-purple-400 group/sub"
                >
                  Pre-Filled Cartridge
                  <span className="absolute left-1/2 bottom-0 h-0.5 bg-purple-400 w-0 group-hover/sub:w-full transform -translate-x-1/2 transition-all duration-300 ease-out"></span>
                </a>
              </div>
            </div>
            {/* DEVICE */}
            <div className="relative group">
              <a
                href="/about"
                className="relative hover:text-purple-400 transition-colors"
              >
                DEVICE
                <span className="absolute left-1/2 bottom-0 h-0.5 bg-purple-400 w-0 group-hover:w-full transform -translate-x-1/2 transition-all duration-300 ease-out"></span>
              </a>
              <div className="absolute left-0 mt-0 w-48 bg-white shadow-lg rounded-md py-2 z-10 opacity-0 group-hover:opacity-100 group-hover:visible transition-opacity duration-200 invisible">
                <a
                  href="/about/story"
                  className="relative block px-4 py-2 hover:bg-gray-100 text-gray-800 hover:text-purple-400 group/sub"
                >
                  Kit
                  <span className="absolute left-1/2 bottom-0 h-0.5 bg-purple-400 w-0 group-hover/sub:w-full transform -translate-x-1/2 transition-all duration-300 ease-out"></span>
                </a>
                <a
                  href="/about/team"
                  className="relative block px-4 py-2 hover:bg-gray-100 text-gray-800 hover:text-purple-400 group/sub"
                >
                  Only Mod
                  <span className="absolute left-1/2 bottom-0 h-0.5 bg-purple-400 w-0 group-hover/sub:w-full transform -translate-x-1/2 transition-all duration-300 ease-out"></span>
                </a>
              </div>
            </div>
            {/* BORO */}
            <div className="relative group">
              <a
                href="/about"
                className="relative hover:text-purple-400 transition-colors"
              >
                BORO
                <span className="absolute left-1/2 bottom-0 h-0.5 bg-purple-400 w-0 group-hover:w-full transform -translate-x-1/2 transition-all duration-300 ease-out"></span>
              </a>
              <div className="absolute left-0 mt-0 w-48 bg-white shadow-lg rounded-md py-2 z-10 opacity-0 group-hover:opacity-100 group-hover:visible transition-opacity duration-200 invisible">
                <a
                  href="/about/story"
                  className="relative block px-4 py-2 hover:bg-gray-100 text-gray-800 hover:text-purple-400 group/sub"
                >
                  Alo (Boro)
                  <span className="absolute left-1/2 bottom-0 h-0.5 bg-purple-400 w-0 group-hover/sub:w-full transform -translate-x-1/2 transition-all duration-300 ease-out"></span>
                </a>
                <a
                  href="/about/team"
                  className="relative block px-4 py-2 hover:bg-gray-100 text-gray-800 hover:text-purple-400 group/sub"
                >
                  Boro Bridge and Cartridge
                  <span className="absolute left-1/2 bottom-0 h-0.5 bg-purple-400 w-0 group-hover/sub:w-full transform -translate-x-1/2 transition-all duration-300 ease-out"></span>
                </a>
                <a
                  href="/about/team"
                  className="relative block px-4 py-2 hover:bg-gray-100 text-gray-800 hover:text-purple-400 group/sub"
                >
                  Boro Accessories and Tools
                  <span className="absolute left-1/2 bottom-0 h-0.5 bg-purple-400 w-0 group-hover/sub:w-full transform -translate-x-1/2 transition-all duration-300 ease-out"></span>
                </a>
              </div>
            </div>
            {/* ACCESSORIES */}
            <div className="relative group">
              <a
                href="/about"
                className="relative hover:text-purple-400 transition-colors"
              >
                ACCESSORIES
                <span className="absolute left-1/2 bottom-0 h-0.5 bg-purple-400 w-0 group-hover:w-full transform -translate-x-1/2 transition-all duration-300 ease-out"></span>
              </a>
              <div className="absolute left-0 mt-0 w-48 bg-white shadow-lg rounded-md py-2 z-10 opacity-0 group-hover:opacity-100 group-hover:visible transition-opacity duration-200 invisible">
                <a
                  href="/about/story"
                  className="relative block px-4 py-2 hover:bg-gray-100 text-gray-800 hover:text-purple-400 group/sub"
                >
                  SubOhm Coil
                  <span className="absolute left-1/2 bottom-0 h-0.5 bg-purple-400 w-0 group-hover/sub:w-full transform -translate-x-1/2 transition-all duration-300 ease-out"></span>
                </a>
                <a
                  href="/about/team"
                  className="relative block px-4 py-2 hover:bg-gray-100 text-gray-800 hover:text-purple-400 group/sub"
                >
                  Charger
                  <span className="absolute left-1/2 bottom-0 h-0.5 bg-purple-400 w-0 group-hover/sub:w-full transform -translate-x-1/2 transition-all duration-300 ease-out"></span>
                </a>
                <a
                  href="/about/team"
                  className="relative block px-4 py-2 hover:bg-gray-100 text-gray-800 hover:text-purple-400 group/sub"
                >
                  Cotton
                  <span className="absolute left-1/2 bottom-0 h-0.5 bg-purple-400 w-0 group-hover/sub:w-full transform -translate-x-1/2 transition-all duration-300 ease-out"></span>
                </a>
                <a
                  href="/about/team"
                  className="relative block px-4 py-2 hover:bg-gray-100 text-gray-800 hover:text-purple-400 group/sub"
                >
                  Premade Coil
                  <span className="absolute left-1/2 bottom-0 h-0.5 bg-purple-400 w-0 group-hover/sub:w-full transform -translate-x-1/2 transition-all duration-300 ease-out"></span>
                </a>
                <a
                  href="/about/team"
                  className="relative block px-4 py-2 hover:bg-gray-100 text-gray-800 hover:text-purple-400 group/sub"
                >
                  Battery
                  <span className="absolute left-1/2 bottom-0 h-0.5 bg-purple-400 w-0 group-hover/sub:w-full transform -translate-x-1/2 transition-all duration-300 ease-out"></span>
                </a>
                <a
                  href="/about/team"
                  className="relative block px-4 py-2 hover:bg-gray-100 text-gray-800 hover:text-purple-400 group/sub"
                >
                  Tank Glass
                  <span className="absolute left-1/2 bottom-0 h-0.5 bg-purple-400 w-0 group-hover/sub:w-full transform -translate-x-1/2 transition-all duration-300 ease-out"></span>
                </a>
                <a
                  href="/about/team"
                  className="relative block px-4 py-2 hover:bg-gray-100 text-gray-800 hover:text-purple-400 group/sub"
                >
                  Cartridge
                  <span className="absolute left-1/2 bottom-0 h-0.5 bg-purple-400 w-0 group-hover/sub:w-full transform -translate-x-1/2 transition-all duration-300 ease-out"></span>
                </a>
                <a
                  href="/about/team"
                  className="relative block px-4 py-2 hover:bg-gray-100 text-gray-800 hover:text-purple-400 group/sub"
                >
                  RBA / RBK
                  <span className="absolute left-1/2 bottom-0 h-0.5 bg-purple-400 w-0 group-hover/sub:w-full transform -translate-x-1/2 transition-all duration-300 ease-out"></span>
                </a>
                <a
                  href="/about/team"
                  className="relative block px-4 py-2 hover:bg-gray-100 text-gray-800 hover:text-purple-400 group/sub"
                >
                  Wire Spool
                  <span className="absolute left-1/2 bottom-0 h-0.5 bg-purple-400 w-0 group-hover/sub:w-full transform -translate-x-1/2 transition-all duration-300 ease-out"></span>
                </a>
                <a
                  href="/about/team"
                  className="relative block px-4 py-2 hover:bg-gray-100 text-gray-800 hover:text-purple-400 group/sub"
                >
                  Drip Tip
                  <span className="absolute left-1/2 bottom-0 h-0.5 bg-purple-400 w-0 group-hover/sub:w-full transform -translate-x-1/2 transition-all duration-300 ease-out"></span>
                </a>
              </div>
            </div>
          </div>
          {/* Desktop Navigation End */}

          {/* Side Icons  start*/}

          <div className="flex items-center gap-4">
            {/* Updated Cart Link with Badge */}
            <Link href="/cart" className="relative">
              <ShoppingCart />
              {cartHydrated && getCartItemsCount() > 0 && (
                <span 
                  className="absolute -top-2 -right-2 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center"
                  suppressHydrationWarning
                >
                  {getCartItemsCount()}
                </span>
              )}
            </Link>

            {/* Updated Favorites Link with Badge */}
            <Link href="/favorites" className="relative">
              <Heart></Heart>
              {favoritesHydrated && favorites.length > 0 && (
                <span 
                  className="absolute -top-2 -right-2 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center"
                  suppressHydrationWarning
                >
                  {favorites.length}
                </span>
              )}
            </Link>

            {/* User */}
            <Link href="/cart">
              <User />
            </Link>

            {/* Sign In/Sign Out Button */}
            {user ? (
              <button
                onClick={handleSignOut}
                className="hidden text-[15px] tracking-widest  xl:block bg-purple-400  px-6 py-2 text-black hover:bg-purple-500 transition-colors duration-200"
              >
                Sign Out
              </button>
            ) : (
              <button
                onClick={handleSignIn}
                className="hidden text-[15px] tracking-widest  xl:block bg-purple-400  px-6 py-2  text-black hover:bg-purple-500 transition-colors duration-200"
              >
                Sign In
              </button>
            )}

            {/* Mobile Menu Toggle */}
            <button className=" xl:hidden ml-2" onClick={toggleMobileMenu}>
              {mobileMenuOpen ? <X /> : <Menu />}
            </button>
          </div>

          {/* Side Icons  start*/}
        </div>
      </div>

      {/* Mobile Menu start */}
      {mobileMenuOpen && (
        <div
          className="fixed top-0 right-0 w-72 h-full bg-white shadow-xl transform transition-transform duration-300 ease-in-out z-50 overflow-y-auto"
          style={{
            animation: isClosing
              ? 'slideOutRight 0.3s ease-in'
              : 'slideInRight 0.3s ease-out',
          }}
        >
          <div className="flex justify-end p-4">
            <button
              onClick={() => {
                setIsClosing(true)
                setTimeout(() => {
                  setMobileMenuOpen(false)
                  setIsClosing(false)
                  setOpenSubmenu(null)
                }, 300)
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

          <div className="flex flex-col p-4 space-y-2 text-sm  tracking-widest">
            {/* E-Liquid */}
            <div className="group">
              <button
                onClick={() => toggleSubmenu('E-LIQUID')}
                className="relative block mb-2 text-start w-full py-2 px-4 text-gray-800 font-bold hover:text-gray-600 transition-colors "
                // style={{ animation: 'fadeIn 0.4s ease-out 0.1s' }}
              >
                E-LIQUID
                <span className="absolute left-1/2 bottom-0 h-0.5 bg-gray-600 w-0 group-hover:w-full transform -translate-x-1/2 transition-all duration-300 ease-out"></span>
              </button>
              {openSubmenu === 'E-LIQUID' && (
                <div
                  className="ml-4 space-y-1 transform transition-transform duration-300 ease-in-out"
                  style={{
                    animation:
                      openSubmenu === 'E-LIQUID'
                        ? 'slideInRight 0.3s ease-out'
                        : 'slideOutRight 0.3s ease-in',
                  }}
                >
                  <a
                    href="/new-arrivals/men"
                    className="relative block py-1 px-4 text-sm text-black  group/sub"
                    // style={{ animation: 'fadeIn 0.4s ease-out 0.2s' }}
                  >
                    Fruits
                    <span className="absolute left-1/2 bottom-0 h-0.5 bg-gray-600 w-0 group-hover/sub:w-full transform -translate-x-1/2 transition-all duration-300 ease-out"></span>
                  </a>
                  <a
                    href="/new-arrivals/women"
                    className="relative block py-1 px-4 text-sm text-black  group/sub"
                    // style={{ animation: 'fadeIn 0.4s ease-out 0.3s' }}
                  >
                    Bakery & Dessert
                    <span className="absolute left-1/2 bottom-0 h-0.5 bg-gray-600 w-0 group-hover/sub:w-full transform -translate-x-1/2 transition-all duration-300 "></span>
                  </a>
                  <a
                    href="/new-arrivals/women"
                    className="relative block py-1 px-4 text-sm text-black  group/sub"
                    // style={{ animation: 'fadeIn 0.4s ease-out 0.3s' }}
                  >
                    Tobacco
                    <span className="absolute left-1/2 bottom-0 h-0.5 bg-gray-600 w-0 group-hover/sub:w-full transform -translate-x-1/2 transition-all duration-300 "></span>
                  </a>
                  <a
                    href="/new-arrivals/women"
                    className="relative block py-1 px-4 text-sm text-black  group/sub"
                    // style={{ animation: 'fadeIn 0.4s ease-out 0.3s' }}
                  >
                    Custard & Cream
                    <span className="absolute left-1/2 bottom-0 h-0.5 bg-gray-600 w-0 group-hover/sub:w-full transform -translate-x-1/2 transition-all duration-300 "></span>
                  </a>
                  <a
                    href="/new-arrivals/women"
                    className="relative block py-1 px-4 text-sm text-black  group/sub"
                    // style={{ animation: 'fadeIn 0.4s ease-out 0.3s' }}
                  >
                    Coffee
                    <span className="absolute left-1/2 bottom-0 h-0.5 bg-gray-600 w-0 group-hover/sub:w-full transform -translate-x-1/2 transition-all duration-300 "></span>
                  </a>
                  <a
                    href="/new-arrivals/women"
                    className="relative block py-1 px-4 text-sm text-black  group/sub"
                    // style={{ animation: 'fadeIn 0.4s ease-out 0.3s' }}
                  >
                    Menthol / Mint
                    <span className="absolute left-1/2 bottom-0 h-0.5 bg-gray-600 w-0 group-hover/sub:w-full transform -translate-x-1/2 transition-all duration-300 "></span>
                  </a>
                </div>
              )}
            </div>

            {/* TANKS */}
            <div className="group">
              <button
                onClick={() => toggleSubmenu('TANKS')}
                className="relative block mb-2 text-start w-full py-2 px-4 text-gray-800 font-bold hover:text-gray-600 transition-colors "
                // style={{ animation: 'fadeIn 0.4s ease-out 0.1s' }}
              >
                TANKS
                <span className="absolute left-1/2 bottom-0 h-0.5 bg-gray-600 w-0 group-hover:w-full transform -translate-x-1/2 transition-all duration-300 ease-out"></span>
              </button>
              {openSubmenu === 'TANKS' && (
                <div
                  className="ml-4 space-y-1 transform transition-transform duration-300 ease-in-out"
                  style={{
                    animation:
                      openSubmenu === 'TANKS'
                        ? 'slideInRight 0.3s ease-out'
                        : 'slideOutRight 0.3s ease-in',
                  }}
                >
                  <a
                    href="/new-arrivals/men"
                    className="relative block py-1 px-4 text-sm text-black  group/sub"
                    // style={{ animation: 'fadeIn 0.4s ease-out 0.2s' }}
                  >
                    Rda
                    <span className="absolute left-1/2 bottom-0 h-0.5 bg-gray-600 w-0 group-hover/sub:w-full transform -translate-x-1/2 transition-all duration-300 ease-out"></span>
                  </a>
                  <a
                    href="/new-arrivals/women"
                    className="relative block py-1 px-4 text-sm text-black  group/sub"
                    // style={{ animation: 'fadeIn 0.4s ease-out 0.3s' }}
                  >
                    Rta
                    <span className="absolute left-1/2 bottom-0 h-0.5 bg-gray-600 w-0 group-hover/sub:w-full transform -translate-x-1/2 transition-all duration-300 "></span>
                  </a>
                  <a
                    href="/new-arrivals/women"
                    className="relative block py-1 px-4 text-sm text-black  group/sub"
                    // style={{ animation: 'fadeIn 0.4s ease-out 0.3s' }}
                  >
                    Rdta
                    <span className="absolute left-1/2 bottom-0 h-0.5 bg-gray-600 w-0 group-hover/sub:w-full transform -translate-x-1/2 transition-all duration-300 "></span>
                  </a>
                  <a
                    href="/new-arrivals/women"
                    className="relative block py-1 px-4 text-sm text-black  group/sub"
                    // style={{ animation: 'fadeIn 0.4s ease-out 0.3s' }}
                  >
                    Subohm
                    <span className="absolute left-1/2 bottom-0 h-0.5 bg-gray-600 w-0 group-hover/sub:w-full transform -translate-x-1/2 transition-all duration-300 "></span>
                  </a>
                  <a
                    href="/new-arrivals/women"
                    className="relative block py-1 px-4 text-sm text-black  group/sub"
                    // style={{ animation: 'fadeIn 0.4s ease-out 0.3s' }}
                  >
                    Disposable
                    <span className="absolute left-1/2 bottom-0 h-0.5 bg-gray-600 w-0 group-hover/sub:w-full transform -translate-x-1/2 transition-all duration-300 "></span>
                  </a>
                </div>
              )}
            </div>

            {/* NIC SALTS */}
            <div className="group">
              <button
                onClick={() => toggleSubmenu('NIC SALTS')}
                className="relative block mb-2 text-start w-full py-2 px-4 text-gray-800 font-bold hover:text-gray-600 transition-colors "
                // style={{ animation: 'fadeIn 0.4s ease-out 0.1s' }}
              >
                NIC SALTS
                <span className="absolute left-1/2 bottom-0 h-0.5 bg-gray-600 w-0 group-hover:w-full transform -translate-x-1/2 transition-all duration-300 ease-out"></span>
              </button>
              {openSubmenu === 'NIC SALTS' && (
                <div
                  className="ml-4 space-y-1 transform transition-transform duration-300 ease-in-out"
                  style={{
                    animation:
                      openSubmenu === 'NIC SALTS'
                        ? 'slideInRight 0.3s ease-out'
                        : 'slideOutRight 0.3s ease-in',
                  }}
                >
                  <a
                    href="/new-arrivals/men"
                    className="relative block py-1 px-4 text-sm text-black  group/sub"
                    // style={{ animation: 'fadeIn 0.4s ease-out 0.2s' }}
                  >
                    Fruits
                    <span className="absolute left-1/2 bottom-0 h-0.5 bg-gray-600 w-0 group-hover/sub:w-full transform -translate-x-1/2 transition-all duration-300 ease-out"></span>
                  </a>
                  <a
                    href="/new-arrivals/women"
                    className="relative block py-1 px-4 text-sm text-black  group/sub"
                    // style={{ animation: 'fadeIn 0.4s ease-out 0.3s' }}
                  >
                    Bakery & Dessert
                    <span className="absolute left-1/2 bottom-0 h-0.5 bg-gray-600 w-0 group-hover/sub:w-full transform -translate-x-1/2 transition-all duration-300 "></span>
                  </a>
                  <a
                    href="/new-arrivals/women"
                    className="relative block py-1 px-4 text-sm text-black  group/sub"
                    // style={{ animation: 'fadeIn 0.4s ease-out 0.3s' }}
                  >
                    Tobacco
                    <span className="absolute left-1/2 bottom-0 h-0.5 bg-gray-600 w-0 group-hover/sub:w-full transform -translate-x-1/2 transition-all duration-300 "></span>
                  </a>
                  <a
                    href="/new-arrivals/women"
                    className="relative block py-1 px-4 text-sm text-black  group/sub"
                    // style={{ animation: 'fadeIn 0.4s ease-out 0.3s' }}
                  >
                    Custard & Cream
                    <span className="absolute left-1/2 bottom-0 h-0.5 bg-gray-600 w-0 group-hover/sub:w-full transform -translate-x-1/2 transition-all duration-300 "></span>
                  </a>
                  <a
                    href="/new-arrivals/women"
                    className="relative block py-1 px-4 text-sm text-black  group/sub"
                    // style={{ animation: 'fadeIn 0.4s ease-out 0.3s' }}
                  >
                    Coffee
                    <span className="absolute left-1/2 bottom-0 h-0.5 bg-gray-600 w-0 group-hover/sub:w-full transform -translate-x-1/2 transition-all duration-300 "></span>
                  </a>
                  <a
                    href="/new-arrivals/women"
                    className="relative block py-1 px-4 text-sm text-black  group/sub"
                    // style={{ animation: 'fadeIn 0.4s ease-out 0.3s' }}
                  >
                    Menthol / Mint
                    <span className="absolute left-1/2 bottom-0 h-0.5 bg-gray-600 w-0 group-hover/sub:w-full transform -translate-x-1/2 transition-all duration-300 "></span>
                  </a>
                </div>
              )}
            </div>

            {/* POD SYSTEM */}
            <div className="group">
              <button
                onClick={() => toggleSubmenu('POD SYSTEM')}
                className="relative block mb-2 text-start w-full py-2 px-4 text-gray-800 font-bold hover:text-gray-600 transition-colors "
                // style={{ animation: 'fadeIn 0.4s ease-out 0.1s' }}
              >
                POD SYSTEM
                <span className="absolute left-1/2 bottom-0 h-0.5 bg-gray-600 w-0 group-hover:w-full transform -translate-x-1/2 transition-all duration-300 ease-out"></span>
              </button>
              {openSubmenu === 'POD SYSTEM' && (
                <div
                  className="ml-4 space-y-1 transform transition-transform duration-300 ease-in-out"
                  style={{
                    animation:
                      openSubmenu === 'POD SYSTEM'
                        ? 'slideInRight 0.3s ease-out'
                        : 'slideOutRight 0.3s ease-in',
                  }}
                >
                  <a
                    href="/new-arrivals/men"
                    className="relative block py-1 px-4 text-sm text-black  group/sub"
                    // style={{ animation: 'fadeIn 0.4s ease-out 0.2s' }}
                  >
                    Disposable
                    <span className="absolute left-1/2 bottom-0 h-0.5 bg-gray-600 w-0 group-hover/sub:w-full transform -translate-x-1/2 transition-all duration-300 ease-out"></span>
                  </a>
                  <a
                    href="/new-arrivals/women"
                    className="relative block py-1 px-4 text-sm text-black  group/sub"
                    // style={{ animation: 'fadeIn 0.4s ease-out 0.3s' }}
                  >
                    Refillable Pod Kit
                    <span className="absolute left-1/2 bottom-0 h-0.5 bg-gray-600 w-0 group-hover/sub:w-full transform -translate-x-1/2 transition-all duration-300 "></span>
                  </a>
                  <a
                    href="/new-arrivals/women"
                    className="relative block py-1 px-4 text-sm text-black  group/sub"
                    // style={{ animation: 'fadeIn 0.4s ease-out 0.3s' }}
                  >
                    Pre-Filled Cartridge
                    <span className="absolute left-1/2 bottom-0 h-0.5 bg-gray-600 w-0 group-hover/sub:w-full transform -translate-x-1/2 transition-all duration-300 "></span>
                  </a>
                </div>
              )}
            </div>

            {/* DEVICE */}
            <div className="group">
              <button
                onClick={() => toggleSubmenu('DEVICE')}
                className="relative block mb-2 text-start w-full py-2 px-4 text-gray-800 font-bold hover:text-gray-600 transition-colors "
                // style={{ animation: 'fadeIn 0.4s ease-out 0.1s' }}
              >
                DEVICE
                <span className="absolute left-1/2 bottom-0 h-0.5 bg-gray-600 w-0 group-hover:w-full transform -translate-x-1/2 transition-all duration-300 ease-out"></span>
              </button>
              {openSubmenu === 'DEVICE' && (
                <div
                  className="ml-4 space-y-1 transform transition-transform duration-300 ease-in-out"
                  style={{
                    animation:
                      openSubmenu === 'DEVICE'
                        ? 'slideInRight 0.3s ease-out'
                        : 'slideOutRight 0.3s ease-in',
                  }}
                >
                  <a
                    href="/new-arrivals/men"
                    className="relative block py-1 px-4 text-sm text-black  group/sub"
                    // style={{ animation: 'fadeIn 0.4s ease-out 0.2s' }}
                  >
                    Kit
                    <span className="absolute left-1/2 bottom-0 h-0.5 bg-gray-600 w-0 group-hover/sub:w-full transform -translate-x-1/2 transition-all duration-300 ease-out"></span>
                  </a>
                  <a
                    href="/new-arrivals/women"
                    className="relative block py-1 px-4 text-sm text-black  group/sub"
                    // style={{ animation: 'fadeIn 0.4s ease-out 0.3s' }}
                  >
                    Only Mod
                    <span className="absolute left-1/2 bottom-0 h-0.5 bg-gray-600 w-0 group-hover/sub:w-full transform -translate-x-1/2 transition-all duration-300 "></span>
                  </a>
                </div>
              )}
            </div>

            {/* BORO */}
            <div className="group">
              <button
                onClick={() => toggleSubmenu('BORO')}
                className="relative block mb-2 text-start w-full py-2 px-4 text-gray-800 font-bold hover:text-gray-600 transition-colors "
                // style={{ animation: 'fadeIn 0.4s ease-out 0.1s' }}
              >
                BORO
                <span className="absolute left-1/2 bottom-0 h-0.5 bg-gray-600 w-0 group-hover:w-full transform -translate-x-1/2 transition-all duration-300 ease-out"></span>
              </button>
              {openSubmenu === 'BORO' && (
                <div
                  className="ml-4 space-y-1 transform transition-transform duration-300 ease-in-out"
                  style={{
                    animation:
                      openSubmenu === 'BORO'
                        ? 'slideInRight 0.3s ease-out'
                        : 'slideOutRight 0.3s ease-in',
                  }}
                >
                  <a
                    href="/new-arrivals/men"
                    className="relative block py-1 px-4 text-sm text-black  group/sub"
                    // style={{ animation: 'fadeIn 0.4s ease-out 0.2s' }}
                  >
                    Alo (Boro)
                    <span className="absolute left-1/2 bottom-0 h-0.5 bg-gray-600 w-0 group-hover/sub:w-full transform -translate-x-1/2 transition-all duration-300 ease-out"></span>
                  </a>
                  <a
                    href="/new-arrivals/women"
                    className="relative block py-1 px-4 text-sm text-black  group/sub"
                    // style={{ animation: 'fadeIn 0.4s ease-out 0.3s' }}
                  >
                    Boro Bridge and Cartridge
                    <span className="absolute left-1/2 bottom-0 h-0.5 bg-gray-600 w-0 group-hover/sub:w-full transform -translate-x-1/2 transition-all duration-300 "></span>
                  </a>
                  <a
                    href="/new-arrivals/women"
                    className="relative block py-1 px-4 text-sm text-black  group/sub"
                    // style={{ animation: 'fadeIn 0.4s ease-out 0.3s' }}
                  >
                    Boro Accessories and Tools
                    <span className="absolute left-1/2 bottom-0 h-0.5 bg-gray-600 w-0 group-hover/sub:w-full transform -translate-x-1/2 transition-all duration-300 "></span>
                  </a>
                </div>
              )}
            </div>

            {/* ACCESSORIES */}
            <div className="group">
              <button
                onClick={() => toggleSubmenu('ACCESSORIES')}
                className="relative block mb-2 text-start w-full py-2 px-4 text-gray-800 font-bold hover:text-gray-600 transition-colors "
                // style={{ animation: 'fadeIn 0.4s ease-out 0.1s' }}
              >
                ACCESSORIES
                <span className="absolute left-1/2 bottom-0 h-0.5 bg-gray-600 w-0 group-hover:w-full transform -translate-x-1/2 transition-all duration-300 ease-out"></span>
              </button>
              {openSubmenu === 'ACCESSORIES' && (
                <div
                  className="ml-4 space-y-1 transform transition-transform duration-300 ease-in-out"
                  style={{
                    animation:
                      openSubmenu === 'E-LIQUID'
                        ? 'slideInRight 0.3s ease-out'
                        : 'slideOutRight 0.3s ease-in',
                  }}
                >
                  <a
                    href="/new-arrivals/men"
                    className="relative block py-1 px-4 text-sm text-black  group/sub"
                    // style={{ animation: 'fadeIn 0.4s ease-out 0.2s' }}
                  >
                    SubOhm Coil
                    <span className="absolute left-1/2 bottom-0 h-0.5 bg-gray-600 w-0 group-hover/sub:w-full transform -translate-x-1/2 transition-all duration-300 ease-out"></span>
                  </a>
                  <a
                    href="/new-arrivals/women"
                    className="relative block py-1 px-4 text-sm text-black  group/sub"
                    // style={{ animation: 'fadeIn 0.4s ease-out 0.3s' }}
                  >
                    Charger
                    <span className="absolute left-1/2 bottom-0 h-0.5 bg-gray-600 w-0 group-hover/sub:w-full transform -translate-x-1/2 transition-all duration-300 "></span>
                  </a>
                  <a
                    href="/new-arrivals/women"
                    className="relative block py-1 px-4 text-sm text-black  group/sub"
                    // style={{ animation: 'fadeIn 0.4s ease-out 0.3s' }}
                  >
                    Cotton
                    <span className="absolute left-1/2 bottom-0 h-0.5 bg-gray-600 w-0 group-hover/sub:w-full transform -translate-x-1/2 transition-all duration-300 "></span>
                  </a>
                  <a
                    href="/new-arrivals/women"
                    className="relative block py-1 px-4 text-sm text-black  group/sub"
                    // style={{ animation: 'fadeIn 0.4s ease-out 0.3s' }}
                  >
                    Premade Coil
                    <span className="absolute left-1/2 bottom-0 h-0.5 bg-gray-600 w-0 group-hover/sub:w-full transform -translate-x-1/2 transition-all duration-300 "></span>
                  </a>
                  <a
                    href="/new-arrivals/women"
                    className="relative block py-1 px-4 text-sm text-black  group/sub"
                    // style={{ animation: 'fadeIn 0.4s ease-out 0.3s' }}
                  >
                    Battery
                    <span className="absolute left-1/2 bottom-0 h-0.5 bg-gray-600 w-0 group-hover/sub:w-full transform -translate-x-1/2 transition-all duration-300 "></span>
                  </a>
                  <a
                    href="/new-arrivals/women"
                    className="relative block py-1 px-4 text-sm text-black  group/sub"
                    // style={{ animation: 'fadeIn 0.4s ease-out 0.3s' }}
                  >
                    Tank Glass
                    <span className="absolute left-1/2 bottom-0 h-0.5 bg-gray-600 w-0 group-hover/sub:w-full transform -translate-x-1/2 transition-all duration-300 "></span>
                  </a>
                  <a
                    href="/new-arrivals/women"
                    className="relative block py-1 px-4 text-sm text-black  group/sub"
                    // style={{ animation: 'fadeIn 0.4s ease-out 0.3s' }}
                  >
                    Cartridge
                    <span className="absolute left-1/2 bottom-0 h-0.5 bg-gray-600 w-0 group-hover/sub:w-full transform -translate-x-1/2 transition-all duration-300 "></span>
                  </a>
                  <a
                    href="/new-arrivals/women"
                    className="relative block py-1 px-4 text-sm text-black  group/sub"
                    // style={{ animation: 'fadeIn 0.4s ease-out 0.3s' }}
                  >
                    RBA / RBK
                    <span className="absolute left-1/2 bottom-0 h-0.5 bg-gray-600 w-0 group-hover/sub:w-full transform -translate-x-1/2 transition-all duration-300 "></span>
                  </a>
                  <a
                    href="/new-arrivals/women"
                    className="relative block py-1 px-4 text-sm text-black  group/sub"
                    // style={{ animation: 'fadeIn 0.4s ease-out 0.3s' }}
                  >
                    Wire Spool
                    <span className="absolute left-1/2 bottom-0 h-0.5 bg-gray-600 w-0 group-hover/sub:w-full transform -translate-x-1/2 transition-all duration-300 "></span>
                  </a>
                  <a
                    href="/new-arrivals/women"
                    className="relative block py-1 px-4 text-sm text-black  group/sub"
                    // style={{ animation: 'fadeIn 0.4s ease-out 0.3s' }}
                  >
                    Drip Tip
                    <span className="absolute left-1/2 bottom-0 h-0.5 bg-gray-600 w-0 group-hover/sub:w-full transform -translate-x-1/2 transition-all duration-300 "></span>
                  </a>
                </div>
              )}
            </div>

            {user ? (
              <button
                onClick={handleSignOut}
                className="mt-4  font-bold text-center bg-purple-800 rounded-3xl px-6 py-2 text-sm text-white   transition-colors duration-300"
              >
                Sign Out
              </button>
            ) : (
              <Link
                href="/RegistrationPage"
                className="mt-4  font-bold text-center bg-purple-800 rounded-3xl px-6 py-2 text-sm text-white   transition-colors duration-300"
              >
                Sign In
              </Link>
            )}
          </div>
        </div>
      )}
      {/* Mobile Menu End */}
    </div>
  )
}

export default Navbar
