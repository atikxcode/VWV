'use client'

import React, { useState, useRef, useEffect, useContext } from 'react'
import {
  Search,
  ShoppingCart,
  Menu,
  X,
  User,
  Mail,
  Heart,
  Package,
  ChevronDown,
  ChevronRight,
  Home,
  Phone,
  Info,
  Settings,
} from 'lucide-react'
import Link from 'next/link'
import Image from 'next/image'
import { AuthContext } from '../Provider/AuthProvider'
import { useRouter } from 'next/navigation'
import { useCart } from './hooks/useCart.jsx'
import { useFavorites } from './hooks/useFavorites.jsx'

const Navbar = () => {
  const { user, logOut } = useContext(AuthContext)
  const router = useRouter()

  const { getCartItemsCount, isHydrated: cartHydrated } = useCart()
  const { favorites, isHydrated: favoritesHydrated } = useFavorites()

  const [sidebarOpen, setSidebarOpen] = useState(false)
  const searchRef = useRef(null)

  const [searchQuery, setSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState([])
  const [isSearching, setIsSearching] = useState(false)
  const [showSearchResults, setShowSearchResults] = useState(false)

  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [openSubmenu, setOpenSubmenu] = useState(null)
  const [closingSubmenu, setClosingSubmenu] = useState(null)
  const [isClosing, setIsClosing] = useState(false)
  const [isOpening, setIsOpening] = useState(false)

  // Add client-side only rendering state
  const [isClient, setIsClient] = useState(false)

  // State for dynamic categories
  const [categories, setCategories] = useState({})
  const [categoriesLoading, setCategoriesLoading] = useState(true)

  // 🔥 NEW: State for user profile data from backend
  const [userProfile, setUserProfile] = useState(null)
  const [profileLoading, setProfileLoading] = useState(false)

  // 🔥 NEW: State for profile dropdown
  const [showProfileDropdown, setShowProfileDropdown] = useState(false)
  const profileDropdownRef = useRef(null)

  // Set isClient to true after component mounts
  useEffect(() => {
    setIsClient(true)
  }, [])

  // Add CSS animations to document head only on client
  useEffect(() => {
    if (typeof document !== 'undefined' && !document.getElementById('navbar-animations')) {
      const style = document.createElement('style')
      style.id = 'navbar-animations'
      style.textContent = `
        @keyframes slideDown {
          from {
            opacity: 0;
            max-height: 0;
            transform: translateY(-10px);
          }
          to {
            opacity: 1;
            max-height: 500px;
            transform: translateY(0);
          }
        }
        
        @keyframes slideUp {
          from {
            opacity: 1;
            max-height: 500px;
            transform: translateY(0);
          }
          to {
            opacity: 0;
            max-height: 0;
            transform: translateY(-10px);
          }
        }

        @keyframes fadeIn {
          from {
            opacity: 0;
            transform: translateY(-10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
      `
      document.head.appendChild(style)
    }
  }, [])

  // 🔥 NEW: Fetch user profile data from backend when user is logged in
  useEffect(() => {
    const fetchUserProfile = async () => {
      if (!user || !user.email) return

      try {
        setProfileLoading(true)
        
        // Get auth token
        const token = localStorage.getItem('auth-token') || (await user.getIdToken())
        
        const response = await fetch(`/api/user?email=${encodeURIComponent(user.email)}`, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        })

        if (response.ok) {
          const data = await response.json()
          if (data.user) {
            setUserProfile(data.user)
            console.log('✅ User profile loaded:', data.user)
          }
        } else {
          console.error('❌ Failed to fetch user profile')
        }
      } catch (error) {
        console.error('❌ Error fetching user profile:', error)
      } finally {
        setProfileLoading(false)
      }
    }

    fetchUserProfile()
  }, [user])

  // Fetch categories on component mount
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        setCategoriesLoading(true)
        const response = await fetch('/api/products?getCategoriesOnly=true')
        
        if (response.ok) {
          const data = await response.json()
          setCategories(data.categories || {})
          console.log('✅ Categories loaded:', data.categories)
        } else {
          console.error('❌ Failed to fetch categories')
        }
      } catch (error) {
        console.error('❌ Error fetching categories:', error)
      } finally {
        setCategoriesLoading(false)
      }
    }

    fetchCategories()
  }, [])

  // 🔥 NEW: Close profile dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (profileDropdownRef.current && !profileDropdownRef.current.contains(event.target)) {
        setShowProfileDropdown(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const toggleSubmenu = (label) => {
    if (openSubmenu === label) {
      setClosingSubmenu(label)
      setTimeout(() => {
        setOpenSubmenu(null)
        setClosingSubmenu(null)
      }, 200)
    } else {
      setOpenSubmenu(label)
      setClosingSubmenu(null)
    }
  }

  const toggleMobileMenu = () => {
    if (mobileMenuOpen) {
      setIsClosing(true)
      setTimeout(() => {
        setMobileMenuOpen(false)
        setIsClosing(false)
        setOpenSubmenu(null)
        setClosingSubmenu(null)
        setIsOpening(false)
      }, 300)
    } else {
      setMobileMenuOpen(true)
      setIsOpening(true)
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          setIsOpening(false)
        })
      })
    }
  }

  const handleSignOut = () => {
    logOut().then().catch()
    if (mobileMenuOpen) {
      toggleMobileMenu()
    }
    setShowProfileDropdown(false)
    setUserProfile(null)
  }

  const handleSignIn = () => {
    router.push('/RegistrationPage')
    if (mobileMenuOpen) {
      toggleMobileMenu()
    }
  }

  // 🔥 NEW: Handle profile navigation
  const handleProfileClick = () => {
    router.push('/UserUpdateProfile')
    setShowProfileDropdown(false)
  }

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

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      handleSearch(searchQuery)
    }, 300)

    return () => clearTimeout(timeoutId)
  }, [searchQuery])

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
            <a href="/TrackOrder">Track</a>
            <a href="/Contact">Contact</a>
            <a href="#">Support</a>
            <a href="#">About</a>
          </div>
        </div>

        {/* Search field */}
        <div className="relative flex justify-center items-center h-20 w-full">
          <div className="absolute top-1/2 left-0 w-full h-[0.5px] bg-gray-300"></div>

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

          {/* Desktop Navigation start - DYNAMIC CATEGORIES */}
          <div className="hidden xl:flex gap-6 text-sm tracking-wide">
            {categoriesLoading ? (
              <div className="flex items-center gap-2">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-purple-600"></div>
                <span className="text-gray-500 text-xs">Loading menu...</span>
              </div>
            ) : (
              Object.keys(categories).map((categoryName) => (
                <div key={categoryName} className="relative group">
                  <a
                    href={`/products?category=${encodeURIComponent(categoryName)}`}
                    className="relative hover:text-purple-400 transition-colors"
                  >
                    {categoryName}
                    <span className="absolute left-1/2 bottom-0 h-0.5 bg-purple-400 w-0 group-hover:w-full transform -translate-x-1/2 transition-all duration-300 ease-out"></span>
                  </a>
                  
                  {/* Subcategory Dropdown */}
                  {categories[categoryName] && categories[categoryName].length > 0 && (
                    <div className="absolute left-0 mt-0 w-48 bg-white shadow-lg rounded-md py-2 z-10 opacity-0 group-hover:opacity-100 group-hover:visible transition-opacity duration-200 invisible">
                      {categories[categoryName].map((subcategory) => (
                        <a
                          key={subcategory}
                          href={`/products?category=${encodeURIComponent(categoryName)}&subcategory=${encodeURIComponent(subcategory)}`}
                          className="relative block px-4 py-2 hover:bg-gray-100 text-gray-800 hover:text-purple-400 group/sub"
                        >
                          {subcategory}
                          <span className="absolute left-1/2 bottom-0 h-0.5 bg-purple-400 w-0 group-hover/sub:w-full transform -translate-x-1/2 transition-all duration-300 ease-out"></span>
                        </a>
                      ))}
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
          {/* Desktop Navigation End */}

          {/* Side Icons start - HIDDEN ON MOBILE */}
          <div className="hidden xl:flex items-center gap-4">
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

            {/* 🔥 NEW: Profile Picture with Dropdown */}
            {isClient && user ? (
              <div 
                ref={profileDropdownRef}
                className="relative"
                onMouseEnter={() => setShowProfileDropdown(true)}
                onMouseLeave={() => setShowProfileDropdown(false)}
              >
                <button className="relative rounded-full overflow-hidden w-10 h-10 border-2 border-purple-400 hover:border-purple-600 transition-all duration-200 flex items-center justify-center">
                  {userProfile?.profilePicture ? (
                    <Image
                      src={userProfile.profilePicture}
                      alt={userProfile.name || 'User'}
                      width={40}
                      height={40}
                      className="w-full h-full object-cover"
                      unoptimized
                    />
                  ) : (
                    <div className="w-full h-full bg-purple-100 flex items-center justify-center">
                      <User size={20} className="text-purple-600" />
                    </div>
                  )}
                </button>

                {/* Dropdown Menu */}
                {showProfileDropdown && (
                  <div 
                    className="absolute right-0 mt-0 w-56 bg-white rounded-lg shadow-xl border border-gray-100 py-2 z-50"
                    style={{
                      animation: 'fadeIn 0.2s ease-out',
                    }}
                  >
                    {/* User Info */}
                    <div className="px-4 py-3 border-b border-gray-100">
                      <p className="text-sm font-semibold text-gray-900 truncate">
                        {userProfile?.name || user.name || 'User'}
                      </p>
                      <p className="text-xs text-gray-500 truncate">
                        {user.email}
                      </p>
                    </div>

                    {/* Menu Items */}
                    <button
                      onClick={handleProfileClick}
                      className="w-full flex items-center gap-3 px-4 py-2.5 text-left text-gray-700 hover:bg-purple-50 hover:text-purple-600 transition-colors"
                    >
                      <Settings size={18} />
                      <span className="text-sm font-medium">Update Profile</span>
                    </button>

                    {/* <button
                      onClick={handleSignOut}
                      className="w-full flex items-center gap-3 px-4 py-2.5 text-left text-red-600 hover:bg-red-50 transition-colors"
                    >
                      <X size={18} />
                      <span className="text-sm font-medium">Sign Out</span>
                    </button> */}
                  </div>
                )}
              </div>
            ) : (
              <Link href="/RegistrationPage">
                <User />
              </Link>
            )}

            {/* Sign In/Out Button */}
            {isClient && (
              <>
                {user ? (
                  <button
                    onClick={handleSignOut}
                    className="text-[15px] tracking-widest bg-purple-400 px-6 py-2 text-black hover:bg-purple-500 transition-colors duration-200"
                  >
                    Sign Out
                  </button>
                ) : (
                  <button
                    onClick={handleSignIn}
                    className="text-[15px] tracking-widest bg-purple-400 px-6 py-2 text-black hover:bg-purple-500 transition-colors duration-200"
                  >
                    Sign In
                  </button>
                )}
              </>
            )}
          </div>

          {/* Mobile Menu Button - ONLY VISIBLE ON MOBILE */}
          <button className="xl:hidden ml-2" onClick={toggleMobileMenu}>
            {mobileMenuOpen ? <X /> : <Menu />}
          </button>
        </div>
      </div>

      {/* Overlay for mobile menu */}
      {mobileMenuOpen && (
        <div
          className="fixed inset-0 bg-black z-40 xl:hidden"
          onClick={toggleMobileMenu}
          style={{
            opacity: isClosing ? 0 : isOpening ? 0 : 0.5,
            transition: 'opacity 0.3s ease-in-out',
          }}
        />
      )}

      {/* Modern Mobile Sidebar - WITH PROPER OPENING ANIMATION */}
      {mobileMenuOpen && (
        <div
          className="fixed top-0 right-0 w-80 h-full bg-white shadow-2xl z-50 xl:hidden overflow-hidden flex flex-col"
          style={{
            transform: isClosing ? 'translateX(100%)' : isOpening ? 'translateX(100%)' : 'translateX(0)',
            transition: 'transform 0.3s ease-in-out',
          }}
        >
          {/* Sidebar Header - 🔥 UPDATED with profile picture */}
          <div className="bg-gradient-to-r from-purple-400 to-purple-500 px-6 py-5 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-white rounded-full overflow-hidden flex items-center justify-center">
                {user && userProfile?.profilePicture ? (
                  <Image
                    src={userProfile.profilePicture}
                    alt={userProfile.name || 'User'}
                    width={40}
                    height={40}
                    className="w-full h-full object-cover"
                    unoptimized
                  />
                ) : (
                  <User size={20} className="text-purple-500" />
                )}
              </div>
              <div suppressHydrationWarning>
                <p className="text-white font-semibold text-sm">
                  {user ? 'Welcome Back!' : 'Guest User'}
                </p>
                <p className="text-purple-100 text-xs">
                  {user ? user.email : 'Sign in for more features'}
                </p>
              </div>
            </div>
            <button
              onClick={toggleMobileMenu}
              className="text-white hover:bg-white hover:text-purple-500 hover:bg-opacity-20 p-2 rounded-full transition-all"
              aria-label="Close mobile menu"
            >
              <X size={24} />
            </button>
          </div>

          {/* Sidebar Content - Scrollable */}
          <div className="flex-1 overflow-y-auto">
            {/* Quick Action Icons Section */}
            <div className="border-b border-gray-200 py-4 px-6">
              <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">
                Quick Access
              </h3>
              <div className="grid grid-cols-3 gap-3">
                <Link
                  href="/cart"
                  onClick={toggleMobileMenu}
                  className="flex flex-col items-center justify-center p-4 bg-purple-50 rounded-lg hover:bg-purple-100 transition-colors relative"
                >
                  <ShoppingCart size={24} className="text-purple-600 mb-2" />
                  {cartHydrated && getCartItemsCount() > 0 && (
                    <span 
                      className="absolute top-2 right-2 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center"
                      suppressHydrationWarning
                    >
                      {getCartItemsCount()}
                    </span>
                  )}
                  <span className="text-xs font-medium text-gray-700">Cart</span>
                </Link>

                <Link
                  href="/favorites"
                  onClick={toggleMobileMenu}
                  className="flex flex-col items-center justify-center p-4 bg-purple-50 rounded-lg hover:bg-purple-100 transition-colors relative"
                >
                  <Heart size={24} className="text-purple-600 mb-2" />
                  {favoritesHydrated && favorites.length > 0 && (
                    <span 
                      className="absolute top-2 right-2 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center"
                      suppressHydrationWarning
                    >
                      {favorites.length}
                    </span>
                  )}
                  <span className="text-xs font-medium text-gray-700">Favorites</span>
                </Link>

                <Link
                  href="/UserUpdateProfile"
                  onClick={toggleMobileMenu}
                  className="flex flex-col items-center justify-center p-4 bg-purple-50 rounded-lg hover:bg-purple-100 transition-colors"
                >
                  {/* 🔥 UPDATED: Show profile picture or User icon */}
                  {user && userProfile?.profilePicture ? (
                    <div className="w-6 h-6 rounded-full overflow-hidden mb-2">
                      <Image
                        src={userProfile.profilePicture}
                        alt="Profile"
                        width={24}
                        height={24}
                        className="w-full h-full object-cover"
                        unoptimized
                      />
                    </div>
                  ) : (
                    <User size={24} className="text-purple-600 mb-2" />
                  )}
                  <span className="text-xs font-medium text-gray-700">Profile</span>
                </Link>
              </div>
            </div>

            {/* Quick Links Section */}
            <div className="border-b border-gray-200 py-4 px-6">
              <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">
                Quick Links
              </h3>
              <div className="space-y-1">
                <a
                  href="/"
                  onClick={toggleMobileMenu}
                  className="flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-purple-50 text-gray-700 hover:text-purple-600 transition-colors"
                >
                  <Home size={18} />
                  <span className="text-sm font-medium">Home</span>
                </a>
                <a
                  href="/TrackOrder"
                  onClick={toggleMobileMenu}
                  className="flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-purple-50 text-gray-700 hover:text-purple-600 transition-colors"
                >
                  <Package size={18} />
                  <span className="text-sm font-medium">Track Order</span>
                </a>
                <a
                  href="/Contact"
                  onClick={toggleMobileMenu}
                  className="flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-purple-50 text-gray-700 hover:text-purple-600 transition-colors"
                >
                  <Phone size={18} />
                  <span className="text-sm font-medium">Contact</span>
                </a>
                <a
                  href="#"
                  onClick={toggleMobileMenu}
                  className="flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-purple-50 text-gray-700 hover:text-purple-600 transition-colors"
                >
                  <Info size={18} />
                  <span className="text-sm font-medium">About</span>
                </a>
              </div>
            </div>

            {/* Categories Section */}
            <div className="py-4 px-6">
              <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">
                Shop by Category
              </h3>
              
              {categoriesLoading ? (
                <div className="flex flex-col items-center justify-center py-12">
                  <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-purple-600 mb-3"></div>
                  <span className="text-gray-500 text-sm">Loading categories...</span>
                </div>
              ) : (
                <div className="space-y-1">
                  {Object.keys(categories).map((categoryName) => (
                    <div key={categoryName}>
                      <button
                        onClick={() => toggleSubmenu(categoryName)}
                        className="w-full flex items-center justify-between px-3 py-2.5 rounded-lg hover:bg-purple-50 text-gray-700 hover:text-purple-600 transition-colors group"
                      >
                        <span className="text-sm font-medium">{categoryName}</span>
                        {categories[categoryName] && categories[categoryName].length > 0 && (
                          <ChevronDown
                            size={18}
                            className={`text-gray-400 group-hover:text-purple-600 transition-transform duration-200 ${
                              openSubmenu === categoryName ? 'rotate-180' : ''
                            }`}
                          />
                        )}
                      </button>
                      
                      {/* Subcategory List */}
                      {(openSubmenu === categoryName || closingSubmenu === categoryName) && 
                       categories[categoryName] && 
                       categories[categoryName].length > 0 && (
                        <div
                          className="ml-4 mt-1 space-y-1 overflow-hidden"
                          style={{
                            animation: closingSubmenu === categoryName 
                              ? 'slideUp 0.2s ease-in forwards' 
                              : 'slideDown 0.2s ease-out',
                          }}
                        >
                          {categories[categoryName].map((subcategory) => (
                            <a
                              key={subcategory}
                              href={`/products?category=${encodeURIComponent(categoryName)}&subcategory=${encodeURIComponent(subcategory)}`}
                              onClick={toggleMobileMenu}
                              className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-gray-100 text-gray-600 hover:text-purple-600 transition-colors group"
                            >
                              <ChevronRight size={14} className="text-gray-400 group-hover:text-purple-600" />
                              <span className="text-sm">{subcategory}</span>
                            </a>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Sidebar Footer */}
          {isClient && (
            <div className="border-t border-gray-200 p-6 bg-gray-50">
              {user ? (
                <button
                  onClick={handleSignOut}
                  className="w-full bg-purple-400 hover:bg-purple-500 text-white font-semibold py-3 px-4 rounded-lg transition-colors duration-200 shadow-sm"
                >
                  Sign Out
                </button>
              ) : (
                <button
                  onClick={handleSignIn}
                  className="w-full bg-purple-400 hover:bg-purple-500 text-white font-semibold py-3 px-4 rounded-lg transition-colors duration-200 shadow-sm"
                >
                  Sign In / Register
                </button>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  )
}

export default Navbar
