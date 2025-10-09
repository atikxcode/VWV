'use client'

import React from 'react'
import Link from 'next/link'
import { 
  Mail, 
  Phone, 
  MapPin, 
  Facebook, 
  Instagram, 
  Twitter, 
  Youtube,
  Send,
  ShoppingBag,
  Heart,
  Shield,
  Truck,
  CreditCard,
  Clock
} from 'lucide-react'

export default function Footer() {
  const [email, setEmail] = React.useState('')
  const [subscribed, setSubscribed] = React.useState(false)

  const handleSubscribe = (e) => {
    e.preventDefault()
    if (email) {
      // TODO: Add newsletter subscription logic
      setSubscribed(true)
      setEmail('')
      setTimeout(() => setSubscribed(false), 3000)
    }
  }

  return (
    <footer className="bg-gradient-to-b from-gray-900 to-black text-gray-300">
      {/* Main Footer Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12">
          {/* Company Info */}
          <div className="space-y-6">
            <div>
              <h3 className="text-2xl font-bold tracking-[8px] text-purple-400 mb-4 text-center">
                V<span className="text-gray-400">ibe</span> W<span className="text-gray-400">ith</span> V<span className="text-gray-400">ape</span>
              </h3>
              <p className="text-sm text-gray-400 leading-relaxed">
                Your premium destination for quality vape products. We provide the best selection of devices, e-liquids, and accessories.
              </p>
            </div>

            {/* Social Links */}
            <div>
              <h4 className="text-white font-semibold mb-4">Follow Us</h4>
              <div className="flex gap-3">
                <a
                  href="#"
                  className="w-10 h-10 bg-gray-800 rounded-full flex items-center justify-center hover:bg-purple-600 transition-all duration-300 transform hover:scale-110"
                  aria-label="Facebook"
                >
                  <Facebook size={18} />
                </a>
                <a
                  href="#"
                  className="w-10 h-10 bg-gray-800 rounded-full flex items-center justify-center hover:bg-purple-600 transition-all duration-300 transform hover:scale-110"
                  aria-label="Instagram"
                >
                  <Instagram size={18} />
                </a>
                <a
                  href="#"
                  className="w-10 h-10 bg-gray-800 rounded-full flex items-center justify-center hover:bg-purple-600 transition-all duration-300 transform hover:scale-110"
                  aria-label="Twitter"
                >
                  <Twitter size={18} />
                </a>
                <a
                  href="#"
                  className="w-10 h-10 bg-gray-800 rounded-full flex items-center justify-center hover:bg-purple-600 transition-all duration-300 transform hover:scale-110"
                  aria-label="YouTube"
                >
                  <Youtube size={18} />
                </a>
              </div>
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="text-white font-semibold mb-6 text-lg">Quick Links</h4>
            <ul className="space-y-3">
              <li>
                <Link
                  href="/products"
                  className="text-sm hover:text-purple-400 transition-colors duration-200 flex items-center gap-2 group"
                >
                  <span className="w-0 h-0.5 bg-purple-400 group-hover:w-4 transition-all duration-300"></span>
                  Shop All Products
                </Link>
              </li>
              <li>
                <Link
                  href="/products?category=Devices"
                  className="text-sm hover:text-purple-400 transition-colors duration-200 flex items-center gap-2 group"
                >
                  <span className="w-0 h-0.5 bg-purple-400 group-hover:w-4 transition-all duration-300"></span>
                  Vape Devices
                </Link>
              </li>
              <li>
                <Link
                  href="/products?category=E-Liquids"
                  className="text-sm hover:text-purple-400 transition-colors duration-200 flex items-center gap-2 group"
                >
                  <span className="w-0 h-0.5 bg-purple-400 group-hover:w-4 transition-all duration-300"></span>
                  E-Liquids
                </Link>
              </li>
              <li>
                <Link
                  href="/products?category=Accessories"
                  className="text-sm hover:text-purple-400 transition-colors duration-200 flex items-center gap-2 group"
                >
                  <span className="w-0 h-0.5 bg-purple-400 group-hover:w-4 transition-all duration-300"></span>
                  Accessories
                </Link>
              </li>
              <li>
                <Link
                  href="/TrackOrder"
                  className="text-sm hover:text-purple-400 transition-colors duration-200 flex items-center gap-2 group"
                >
                  <span className="w-0 h-0.5 bg-purple-400 group-hover:w-4 transition-all duration-300"></span>
                  Track Order
                </Link>
              </li>
            </ul>
          </div>

          {/* Customer Service */}
          <div>
            <h4 className="text-white font-semibold mb-6 text-lg">Customer Service</h4>
            <ul className="space-y-3">
              <li>
                <Link
                  href="/Contact"
                  className="text-sm hover:text-purple-400 transition-colors duration-200 flex items-center gap-2 group"
                >
                  <span className="w-0 h-0.5 bg-purple-400 group-hover:w-4 transition-all duration-300"></span>
                  Contact Us
                </Link>
              </li>
              <li>
                <Link
                  href="#"
                  className="text-sm hover:text-purple-400 transition-colors duration-200 flex items-center gap-2 group"
                >
                  <span className="w-0 h-0.5 bg-purple-400 group-hover:w-4 transition-all duration-300"></span>
                  Shipping Information
                </Link>
              </li>
              <li>
                <Link
                  href="#"
                  className="text-sm hover:text-purple-400 transition-colors duration-200 flex items-center gap-2 group"
                >
                  <span className="w-0 h-0.5 bg-purple-400 group-hover:w-4 transition-all duration-300"></span>
                  Returns & Exchanges
                </Link>
              </li>
              <li>
                <Link
                  href="#"
                  className="text-sm hover:text-purple-400 transition-colors duration-200 flex items-center gap-2 group"
                >
                  <span className="w-0 h-0.5 bg-purple-400 group-hover:w-4 transition-all duration-300"></span>
                  Privacy Policy
                </Link>
              </li>
              <li>
                <Link
                  href="#"
                  className="text-sm hover:text-purple-400 transition-colors duration-200 flex items-center gap-2 group"
                >
                  <span className="w-0 h-0.5 bg-purple-400 group-hover:w-4 transition-all duration-300"></span>
                  Terms & Conditions
                </Link>
              </li>
            </ul>
          </div>

          {/* Newsletter */}
          <div>
            <h4 className="text-white font-semibold mb-6 text-lg">Newsletter</h4>
            <p className="text-sm text-gray-400 mb-4">
              Subscribe to get special offers, free giveaways, and updates.
            </p>
            
            <form onSubmit={handleSubscribe} className="space-y-3">
              <div className="relative">
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Enter your email"
                  className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 transition-all"
                  required
                />
              </div>
              <button
                type="submit"
                className="w-full bg-gradient-to-r from-purple-600 to-purple-500 text-white px-6 py-3 rounded-lg font-semibold hover:from-purple-700 hover:to-purple-600 transition-all duration-300 flex items-center justify-center gap-2 shadow-lg hover:shadow-purple-500/50"
              >
                {subscribed ? (
                  <>
                    <span>✓ Subscribed!</span>
                  </>
                ) : (
                  <>
                    <span>Subscribe</span>
                    <Send size={16} />
                  </>
                )}
              </button>
            </form>

            {/* Contact Info */}
            <div className="mt-6 space-y-3">
              <div className="flex items-center gap-3 text-sm">
                <Mail size={16} className="text-purple-400 flex-shrink-0" />
                <span>vwv@gmail.com</span>
              </div>
              <div className="flex items-center gap-3 text-sm">
                <Phone size={16} className="text-purple-400 flex-shrink-0" />
                <span>+880 123-456-7890</span>
              </div>
              <div className="flex items-start gap-3 text-sm">
                <MapPin size={16} className="text-purple-400 flex-shrink-0 mt-0.5" />
                <span>123 Vape Street, Dhaka, Bangladesh</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Features Bar */}
      <div className="border-t border-gray-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-gradient-to-br from-purple-600 to-purple-500 rounded-lg flex items-center justify-center flex-shrink-0">
                <Truck size={20} className="text-white" />
              </div>
              <div>
                <h5 className="text-white font-semibold text-sm">Free Shipping</h5>
                <p className="text-xs text-gray-500">On orders over BDT 5000</p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-gradient-to-br from-purple-600 to-purple-500 rounded-lg flex items-center justify-center flex-shrink-0">
                <Shield size={20} className="text-white" />
              </div>
              <div>
                <h5 className="text-white font-semibold text-sm">Secure Payment</h5>
                <p className="text-xs text-gray-500">100% secure transactions</p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-gradient-to-br from-purple-600 to-purple-500 rounded-lg flex items-center justify-center flex-shrink-0">
                <CreditCard size={20} className="text-white" />
              </div>
              <div>
                <h5 className="text-white font-semibold text-sm">Easy Returns</h5>
                <p className="text-xs text-gray-500">7-day return policy</p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-gradient-to-br from-purple-600 to-purple-500 rounded-lg flex items-center justify-center flex-shrink-0">
                <Clock size={20} className="text-white" />
              </div>
              <div>
                <h5 className="text-white font-semibold text-sm">24/7 Support</h5>
                <p className="text-xs text-gray-500">Always here to help</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Age Warning Banner */}
      <div className="bg-gradient-to-r from-purple-900 to-purple-800 border-t border-purple-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <p className="text-center text-xs md:text-sm text-purple-200">
            <span className="font-bold text-purple-100">⚠ WARNING:</span> This product contains nicotine. 
            Nicotine is an addictive chemical. For adults of legal smoking age only (18+).
          </p>
        </div>
      </div>

      {/* Bottom Bar */}
      <div className="bg-black border-t border-gray-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <p className="text-sm text-gray-500">
              © {new Date().getFullYear()} <span className="text-purple-400 font-semibold">VWV</span>. All rights reserved.
            </p>
            
            <div className="flex items-center gap-6">
              <Link href="#" className="text-sm text-gray-500 hover:text-purple-400 transition-colors">
                Privacy Policy
              </Link>
              <Link href="#" className="text-sm text-gray-500 hover:text-purple-400 transition-colors">
                Terms of Service
              </Link>
              <Link href="#" className="text-sm text-gray-500 hover:text-purple-400 transition-colors">
                Cookie Policy
              </Link>
            </div>
          </div>
        </div>
      </div>
    </footer>
  )
}
