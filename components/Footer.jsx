import React from 'react'
import {
  FaFacebookF,
  FaInstagram,
  FaPinterestP,
  FaLinkedinIn,
  FaTiktok,
} from 'react-icons/fa'
import { FaXTwitter } from 'react-icons/fa6'

const Footer = () => {
  return (
    <footer className="bg-gray-100 text-gray-700 py-12 px-6">
      <div className="max-w-7xl mx-auto grid grid-cols-2 md:grid-cols-5 gap-8 text-sm">
        <div>
          <h3 className="font-bold mb-4">Categories</h3>
          <ul className="space-y-2">
            <li>Electronics</li>
            <li>Fashion</li>
            <li>Home & Garden</li>
            <li>Health & Beauty</li>
            <li>Sports & Outdoors</li>
            <li>Automotive</li>
            <li>Books & Media</li>
          </ul>
        </div>

        <div>
          <h3 className="font-bold mb-4">For Buyers</h3>
          <ul className="space-y-2">
            <li>How Shopping Works</li>
            <li>Buyer Stories</li>
            <li>Trust & Safety</li>
            <li>Quality Guarantee</li>
            <li>Shopping Guide</li>
            <li>Help Center</li>
          </ul>
        </div>

        <div>
          <h3 className="font-bold mb-4">For Sellers</h3>
          <ul className="space-y-2">
            <li>Sell on Our Platform</li>
            <li>Seller Academy</li>
            <li>Community Hub</li>
            <li>Events</li>
            <li>Partner Program</li>
          </ul>
        </div>

        <div>
          <h3 className="font-bold mb-4">Business Solutions</h3>
          <ul className="space-y-2">
            <li>B2B Services</li>
            <li>Bulk Orders</li>
            <li>Corporate Gifting</li>
            <li>Custom Products</li>
            <li>Contact Sales</li>
          </ul>
        </div>

        <div>
          <h3 className="font-bold mb-4">Company</h3>
          <ul className="space-y-2">
            <li>About Us</li>
            <li>Careers</li>
            <li>Press & News</li>
            <li>Affiliate Program</li>
            <li>Terms of Service</li>
            <li>Privacy Policy</li>
          </ul>
        </div>
      </div>

      <div className="border-t mt-12 pt-6 flex flex-col md:flex-row items-center justify-between max-w-7xl mx-auto text-xs text-gray-500">
        <div className="flex items-center gap-1">
          <span className="font-semibold text-lg text-gray-900">eShop</span>
          <span>© {new Date().getFullYear()} All rights reserved.</span>
        </div>
        <div className="flex space-x-4 mt-4 md:mt-0">
          <FaTiktok />
          <FaInstagram />
          <FaLinkedinIn />
          <FaFacebookF />
          <FaPinterestP />
          <FaXTwitter />
        </div>
      </div>
    </footer>
  )
}

export default Footer
