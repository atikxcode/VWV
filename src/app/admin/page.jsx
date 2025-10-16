'use client'

import { useState, useEffect, useContext } from 'react'
import Link from 'next/link'
import { motion, AnimatePresence } from 'framer-motion'
import {
  FaChartLine,
  FaUsers,
  FaCubes,
  FaPlus,
  FaPen,
  FaUser,
  FaHome,
  FaBars,
  FaTimes,
  FaBell,
  FaDollarSign,
  FaShoppingBag,
  FaBox,
  FaArrowUp,
  FaArrowDown,
  FaEye,
  FaCalendarAlt,
  FaClock,
  FaCheckCircle,
  FaExclamationTriangle,
  FaArrowRight,
  FaSun,
  FaMoon,
  FaSearch,
  FaFilter,
  FaDownload,
  FaSync,
  FaClipboardList,
  FaFile,
  FaGift,
  FaCog,
  FaFolder
} from 'react-icons/fa'
import { AuthContext } from '../../../Provider/AuthProvider'

// Modern color palette
const colors = {
  primary: 'from-indigo-600 to-purple-600',
  secondary: 'from-purple-600 to-pink-600',
  success: 'from-emerald-500 to-green-600',
  warning: 'from-amber-500 to-orange-600',
  danger: 'from-red-500 to-rose-600',
  info: 'from-cyan-500 to-blue-600',
  teal: 'from-teal-500 to-cyan-600',
  orange: 'from-orange-500 to-red-500',
  violet: 'from-violet-500 to-purple-600',
  lime: 'from-lime-500 to-green-500',
  rose: 'from-rose-500 to-pink-600',
}

const containerVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.6,
      staggerChildren: 0.1,
    }
  }
}

const cardVariants = {
  hidden: { opacity: 0, scale: 0.95, y: 20 },
  visible: {
    opacity: 1,
    scale: 1,
    y: 0,
    transition: { duration: 0.5 }
  },
  hover: {
    y: -8,
    scale: 1.03,
    transition: { duration: 0.2 }
  }
}

export default function AdminDashboard() {
  const { user } = useContext(AuthContext)
  
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [darkMode, setDarkMode] = useState(false)
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalProducts: 0,
    totalSales: 0,
    totalRevenue: 0
  })

  // Updated sidebar options with new items
  const sidebarOptions = [
    { href: '/admin/statsManage', icon: FaChartLine, label: 'Stats Management', color: colors.primary },
    { href: '/admin/userManage', icon: FaUsers, label: 'User Management', color: colors.info },
    { href: '/admin/SellPage', icon: FaCubes, label: 'Sell Page', color: colors.success },
    { href: '/admin/AddProduct', icon: FaPlus, label: 'Add Product', color: colors.warning },
    { href: '/admin/ManageProduct', icon: FaPen, label: 'Manage Products', color: colors.secondary },
    { href: '/admin/ManageOrders', icon: FaClipboardList, label: 'Manage Orders', color: colors.teal },
    { href: '/admin/ProfileUpdate', icon: FaUser, label: 'Profile Update', color: colors.danger },
    { href: '/admin/Requisition', icon: FaFile, label: 'Requisition', color: colors.orange },
    { href: '/admin/Offers', icon: FaGift, label: 'Offers', color: colors.violet },
    { href: '/admin/HomeManagement', icon: FaCog, label: 'Home Management', color: colors.lime },
    { href: '/admin/FeaturedCategoriesManagement', icon: FaFolder, label: 'Featured Categories', color: colors.rose },
    { href: '/', icon: FaHome, label: 'Home', color: 'from-gray-500 to-gray-600' },
  ]

  // Simulate data fetching
  useEffect(() => {
    setTimeout(() => {
      setStats({
        totalUsers: 1247,
        totalProducts: 856,
        totalSales: 3924,
        totalRevenue: 125680
      })
      setLoading(false)
    }, 1500)
  }, [])

  const recentActivities = [
    {
      icon: FaCheckCircle,
      text: 'New product added successfully',
      time: '2 minutes ago',
      color: 'text-emerald-500',
      bgColor: 'bg-emerald-50'
    },
    {
      icon: FaUsers,
      text: '5 new users registered today',
      time: '1 hour ago',
      color: 'text-blue-500',
      bgColor: 'bg-blue-50'
    },
    {
      icon: FaShoppingBag,
      text: 'Large order completed',
      time: '3 hours ago',
      color: 'text-purple-500',
      bgColor: 'bg-purple-50'
    },
    {
      icon: FaArrowUp,
      text: 'Monthly target achieved',
      time: '1 day ago',
      color: 'text-green-500',
      bgColor: 'bg-green-50'
    },
  ]

  const StatCard = ({ title, value, icon: Icon, gradient, trend, subtitle }) => (
    <motion.div
      variants={cardVariants}
      whileHover="hover"
      className={`relative overflow-hidden rounded-2xl bg-gradient-to-br ${gradient} p-6 text-white shadow-xl`}
    >
      <div className="relative z-10">
        <div className="flex items-center justify-between mb-4">
          <div className={`rounded-xl bg-white/20 p-3 backdrop-blur-sm`}>
            <Icon className="h-6 w-6" />
          </div>
          {trend && (
            <div className="flex items-center gap-1 rounded-full bg-white/20 px-2 py-1 text-sm">
              <FaArrowUp className="h-3 w-3" />
              +{trend}%
            </div>
          )}
        </div>
        <div>
          <h3 className="text-3xl font-bold">
            {loading ? (
              <div className="h-8 w-20 animate-pulse rounded bg-white/20"></div>
            ) : (
              value.toLocaleString()
            )}
          </h3>
          <p className="text-sm opacity-90">{title}</p>
          {subtitle && (
            <p className="text-xs opacity-75 mt-1">{subtitle}</p>
          )}
        </div>
      </div>
      
      {/* Animated background */}
      <div className="absolute inset-0 opacity-10">
        <motion.div
          animate={{ scale: [1, 1.2, 1] }}
          transition={{ duration: 4, repeat: Infinity }}
          className="h-full w-full bg-white"
        />
      </div>
    </motion.div>
  )

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center">
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-center"
        >
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
            className="w-16 h-16 border-4 border-indigo-200 border-t-indigo-600 rounded-full mx-auto mb-4"
          />
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Loading Dashboard</h2>
          <p className="text-gray-600">Please wait while we prepare your admin panel...</p>
        </motion.div>
      </div>
    )
  }

  return (
    <div className={`min-h-screen transition-colors duration-300 ${
      darkMode ? 'bg-gray-900 text-white' : 'bg-gradient-to-br from-gray-50 via-blue-50 to-indigo-50'
    }`}>
      
      {/* Main Content */}
      <div className="relative z-10">
        {/* Dashboard Content */}
        <main className="p-6">
          {/* Quick Actions */}
          <motion.div
            variants={cardVariants}
            className={`rounded-2xl ${
              darkMode ? 'bg-gray-800/50' : 'bg-white/80'
            } backdrop-blur-xl border border-gray-200 dark:border-gray-700 shadow-xl p-8`}
          >
            <div className="flex items-center gap-3 mb-8">
              <div className="w-12 h-12 bg-gradient-to-r from-indigo-600 to-purple-600 rounded-xl flex items-center justify-center">
                <FaArrowRight className="text-white" />
              </div>
              <div>
                <h2 className="text-2xl font-bold">Quick Actions</h2>
                <p className="text-gray-600 dark:text-gray-400">Frequently used management tools</p>
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {sidebarOptions.filter(option => option.href !== '/').map((action, index) => {
                const Icon = action.icon
                return (
                  <motion.div
                    key={action.href}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05 }}
                    whileHover={{ scale: 1.05, y: -4 }}
                  >
                    <Link
                      href={action.href}
                      className={`block p-6 rounded-xl bg-gradient-to-r ${action.color} text-white shadow-lg hover:shadow-xl transition-all group`}
                    >
                      <div className="flex items-center justify-between mb-4">
                        <Icon className="w-8 h-8" />
                        <FaArrowRight className="w-4 h-4 opacity-0 group-hover:opacity-100 group-hover:translate-x-1 transition-all" />
                      </div>
                      <h3 className="text-lg font-semibold mb-2">{action.label}</h3>
                      <p className="text-sm opacity-90">Click to access {action.label.toLowerCase()}</p>
                    </Link>
                  </motion.div>
                )
              })}
            </div>
          </motion.div>
        </main>
      </div>
    </div>
  )
}
