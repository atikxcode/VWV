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
  FaClipboardList
} from 'react-icons/fa'
import { AuthContext } from '../../../Provider/AuthProvider'

// Modern color palette for Moderator (different from Admin)
const colors = {
  primary: 'from-blue-600 to-cyan-600',
  secondary: 'from-cyan-600 to-teal-600',
  success: 'from-green-500 to-emerald-600',
  warning: 'from-yellow-500 to-orange-500',
  danger: 'from-pink-500 to-rose-600',
  info: 'from-sky-500 to-blue-600',
  purple: 'from-purple-500 to-indigo-600',
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

export default function ModeratorDashboard() {
  const { user } = useContext(AuthContext)
  
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [darkMode, setDarkMode] = useState(false)
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState({
    totalProducts: 0,
    totalSales: 0,
    pendingOrders: 0,
    completedToday: 0
  })

  // Moderator sidebar options
  const sidebarOptions = [
    { href: '/moderator/statsManage', icon: FaChartLine, label: 'Stats Management', color: colors.primary },
    { href: '/moderator/SellPage', icon: FaCubes, label: 'Sell Page', color: colors.success },
    { href: '/moderator/AddProduct', icon: FaPlus, label: 'Add Product', color: colors.warning },
    { href: '/moderator/ManageProduct', icon: FaPen, label: 'Manage Products', color: colors.secondary },
    { href: '/moderator/ManageOrders', icon: FaClipboardList, label: 'Manage Orders', color: colors.info },
    { href: '/moderator/ProfileUpdate', icon: FaUser, label: 'Profile Update', color: colors.danger },
    { href: '/', icon: FaHome, label: 'Home', color: 'from-gray-500 to-gray-600' },
  ]

  // Simulate data fetching
  useEffect(() => {
    setTimeout(() => {
      setStats({
        totalProducts: 856,
        totalSales: 324,
        pendingOrders: 47,
        completedToday: 28
      })
      setLoading(false)
    }, 1500)
  }, [])

  const recentActivities = [
    {
      icon: FaCheckCircle,
      text: 'Order #1247 processed',
      time: '5 minutes ago',
      color: 'text-emerald-500',
      bgColor: 'bg-emerald-50'
    },
    {
      icon: FaPlus,
      text: 'New product added to inventory',
      time: '30 minutes ago',
      color: 'text-blue-500',
      bgColor: 'bg-blue-50'
    },
    {
      icon: FaShoppingBag,
      text: 'Sale completed successfully',
      time: '1 hour ago',
      color: 'text-purple-500',
      bgColor: 'bg-purple-50'
    },
    {
      icon: FaPen,
      text: 'Product details updated',
      time: '2 hours ago',
      color: 'text-orange-500',
      bgColor: 'bg-orange-50'
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
            className="w-16 h-16 border-4 border-blue-200 border-t-blue-600 rounded-full mx-auto mb-4"
          />
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Loading Dashboard</h2>
          <p className="text-gray-600">Please wait while we prepare your moderator panel...</p>
        </motion.div>
      </div>
    )
  }

  return (
    <div className={`min-h-screen transition-colors duration-300 ${
      darkMode ? 'bg-gray-900 text-white' : 'bg-gradient-to-br from-gray-50 via-cyan-50 to-blue-50'
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
            } backdrop-blur-xl border border-gray-200 dark:border-gray-700 shadow-xl p-8 mb-8`}
          >
            <div className="flex items-center gap-3 mb-8">
              <div className="w-12 h-12 bg-gradient-to-r from-blue-600 to-cyan-600 rounded-xl flex items-center justify-center">
                <FaArrowRight className="text-white" />
              </div>
              <div>
                <h2 className="text-2xl font-bold">Quick Actions</h2>
                <p className="text-gray-600 dark:text-gray-400">Frequently used management tools</p>
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {sidebarOptions.filter(option => option.href !== '/').map((action, index) => {
                const Icon = action.icon
                return (
                  <motion.div
                    key={action.href}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1 }}
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
