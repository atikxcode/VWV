'use client'

import { useState, useEffect, useContext } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  DollarSign,
  TrendingUp,
  Store,
  Users,
  ShoppingCart,
  Calendar,
  Filter,
  Download,
  RefreshCw,
  BarChart3,
  PieChart,
  Package,
  Eye,
  Clock,
  CheckCircle,
  Activity,
  Target,
  Zap,
  Award,
  ArrowUpRight,
  ArrowDownRight,
  Sparkles,
  Crown,
  Star,
  Shield,
  ChevronRight,
  TrendingDown,
  Edit3,
  Search,
  FileText,
  X,
  Check,
  User,
  CreditCard,
  Phone,
  MapPin,
  Hash,
  ExternalLink,
  MoreVertical,
  Download as DownloadIcon,
  Receipt,
  UserCheck,
  MapPinIcon,
} from 'lucide-react'
import { AuthContext } from '../../../../Provider/AuthProvider'
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ResponsiveContainer, 
  PieChart as RechartsPieChart,
  Pie,
  Cell, 
  LineChart, 
  Line, 
  Area, 
  AreaChart,
  ComposedChart
} from 'recharts'
import Swal from 'sweetalert2'

// 🎨 Ultra-Modern Purple Color Palette
const COLORS = {
  primary: '#8B5CF6',
  secondary: '#A78BFA',
  accent: '#C4B5FD',
  light: '#EDE9FE',
  dark: '#6D28D9',
  gradient: ['#8B5CF6', '#06B6D4', '#10B981', '#F59E0B', '#EF4444', '#6366F1'],
  success: '#10B981',
  warning: '#F59E0B',
  danger: '#EF4444',
  info: '#06B6D4',
}

// 🎭 Advanced Animation Variants
const containerVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.6,
      staggerChildren: 0.1,
      ease: [0.25, 0.46, 0.45, 0.94]
    }
  }
}

const cardVariants = {
  hidden: { opacity: 0, scale: 0.95, y: 20 },
  visible: {
    opacity: 1,
    scale: 1,
    y: 0,
    transition: {
      duration: 0.5,
      ease: [0.25, 0.46, 0.45, 0.94]
    }
  },
  hover: {
    y: -5,
    scale: 1.02,
    boxShadow: "0 25px 50px -12px rgba(139, 92, 246, 0.25)",
    transition: { duration: 0.2 }
  }
}

export default function ModeratorSalesManagement() {
  // 🔥 GET USER FROM AUTH CONTEXT
  const { user } = useContext(AuthContext)

  // State Management
  const [salesData, setSalesData] = useState([])
  const [branchStats, setBranchStats] = useState({})
  const [dailyStats, setDailyStats] = useState([])
  const [monthlyStats, setMonthlyStats] = useState([])
  const [loading, setLoading] = useState(true)
  const [userLoading, setUserLoading] = useState(true)
  const [userRole, setUserRole] = useState(null)
  const [userBranch, setUserBranch] = useState(null)
  const [refreshing, setRefreshing] = useState(false)

  // Filter States
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [paymentTypeFilter, setPaymentTypeFilter] = useState('')
  const [searchTerm, setSearchTerm] = useState('')

  // Statistics
  const [totalSales, setTotalSales] = useState(0)
  const [totalTransactions, setTotalTransactions] = useState(0)
  const [averageOrderValue, setAverageOrderValue] = useState(0)
  const [salesGrowth, setSalesGrowth] = useState(0)
  const [topCustomers, setTopCustomers] = useState([])

  // UI States
  const [activeTab, setActiveTab] = useState('overview')
  const [selectedSale, setSelectedSale] = useState(null)
  const [showSaleDetails, setShowSaleDetails] = useState(false)

  // Pagination
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const itemsPerPage = 20

  // 🔧 SECURITY: Get auth headers
  const getAuthHeaders = () => {
    const token = localStorage.getItem('auth-token')
    return {
      'Authorization': `Bearer ${token}`,
      'Cache-Control': 'no-cache',
      'Content-Type': 'application/json'
    }
  }

  // 🔧 SECURITY: Check authentication
  const checkAuth = () => {
    const token = localStorage.getItem('auth-token')
    if (!token) {
      Swal.fire({
        icon: 'error',
        title: 'Authentication Required',
        text: 'Please login to continue.',
        confirmButtonColor: COLORS.primary,
      }).then(() => {
        window.location.href = '/moderator/login'
      })
      return false
    }
    return true
  }

  // 🔥 Date validation helper functions
  const validateDate = (dateString, fieldName) => {
    if (!dateString) return null
    
    try {
      const date = new Date(dateString)
      
      if (isNaN(date.getTime())) {
        console.warn(`Invalid ${fieldName}:`, dateString)
        return null
      }
      
      const year = date.getFullYear()
      if (year < 1900 || year > 2100) {
        console.warn(`Invalid ${fieldName} year:`, year)
        return null
      }
      
      return dateString
    } catch (error) {
      console.warn(`Date validation failed for ${fieldName}:`, error.message)
      return null
    }
  }

  // Date input handlers with validation
  const handleStartDateChange = (e) => {
    const date = e.target.value
    const validDate = validateDate(date, 'start date')
    
    if (validDate !== null) {
      setStartDate(date)
    } else if (date === '') {
      setStartDate('')
    } else {
      Swal.fire({
        icon: 'warning',
        title: 'Invalid Date',
        text: 'Please select a valid start date.',
        confirmButtonColor: COLORS.primary,
        timer: 2000
      })
    }
  }

  const handleEndDateChange = (e) => {
    const date = e.target.value
    const validDate = validateDate(date, 'end date')
    
    if (validDate !== null) {
      setEndDate(date)
    } else if (date === '') {
      setEndDate('')
    } else {
      Swal.fire({
        icon: 'warning',
        title: 'Invalid Date',
        text: 'Please select a valid end date.',
        confirmButtonColor: COLORS.primary,
        timer: 2000
      })
    }
  }

  // 🔥 Fetch user details with enhanced authentication
  useEffect(() => {
    const fetchUserDetails = async () => {
      if (!user?.email) {
        setUserLoading(false)
        return
      }

      if (!checkAuth()) return

      try {
        setUserLoading(true)
        const response = await fetch(
          `/api/user?email=${encodeURIComponent(user.email)}`,
          { headers: getAuthHeaders() }
        )

        if (response.status === 401) {
          localStorage.removeItem('auth-token')
          Swal.fire({
            icon: 'error',
            title: 'Session Expired',
            text: 'Your session has expired. Please login again.',
            confirmButtonColor: COLORS.primary,
          }).then(() => {
            window.location.href = '/moderator/login'
          })
          return
        }

        if (response.ok) {
          const data = await response.json()
          if (data.user) {
            setUserRole(data.user.role)
            setUserBranch(data.user.branch)
            console.log('✅ User authenticated:', data.user.role, 'Branch:', data.user.branch)
          }
        }
      } catch (error) {
        console.error('❌ Authentication error:', error)
      } finally {
        setUserLoading(false)
      }
    }

    fetchUserDetails()
  }, [user])

  // 🔥 Enhanced fetch sales data for moderator branch only
  const fetchSalesData = async (showRefresh = false) => {
    if (!checkAuth() || !userBranch) return

    try {
      if (showRefresh) {
        setRefreshing(true)
      } else {
        setLoading(true)
      }

      console.log('📊 Fetching sales data for branch:', userBranch, 'with filters:', {
        startDate, endDate, statusFilter, paymentTypeFilter, searchTerm
      })
      
      // Validate dates before sending to API
      let validStartDate = ''
      let validEndDate = ''

      if (startDate) {
        const validatedStart = validateDate(startDate, 'start date')
        if (validatedStart) {
          validStartDate = validatedStart
        }
      }

      if (endDate) {
        const validatedEnd = validateDate(endDate, 'end date')
        if (validatedEnd) {
          validEndDate = validatedEnd
        }
      }

      // Additional date range validation
      if (validStartDate && validEndDate) {
        const start = new Date(validStartDate)
        const end = new Date(validEndDate)
        if (start > end) {
          Swal.fire({
            icon: 'error',
            title: 'Invalid Date Range',
            text: 'Start date cannot be after end date.',
            confirmButtonColor: COLORS.primary,
          })
          return
        }
      }

      // Build query parameters with validated dates and branch filter
      let queryParams = new URLSearchParams()
      queryParams.append('limit', itemsPerPage.toString())
      queryParams.append('page', currentPage.toString())
      queryParams.append('branch', userBranch) // 🔥 CRITICAL: Always filter by moderator's branch
      
      if (validStartDate) queryParams.append('startDate', validStartDate)
      if (validEndDate) queryParams.append('endDate', validEndDate)
      if (statusFilter) queryParams.append('status', statusFilter)
      if (paymentTypeFilter) queryParams.append('paymentType', paymentTypeFilter)
      if (searchTerm) queryParams.append('search', searchTerm)
      
      console.log('📋 API Query String:', queryParams.toString())
      
      const response = await fetch(`/api/sales?${queryParams.toString()}`, {
        headers: getAuthHeaders()
      })

      if (response.status === 401) {
        localStorage.removeItem('auth-token')
        window.location.href = '/moderator/login'
        return
      }

      if (response.status === 403) {
        Swal.fire({
          icon: 'error',
          title: 'Access Denied',
          text: 'You can only access sales from your assigned branch.',
          confirmButtonColor: COLORS.primary,
        })
        return
      }

      if (!response.ok) {
        const errorText = await response.text()
        let errorMessage = `HTTP ${response.status}: ${response.statusText}`
        
        try {
          const errorData = JSON.parse(errorText)
          errorMessage = errorData.error || errorMessage
        } catch (e) {
          // Use default error message if response is not JSON
        }
        
        throw new Error(errorMessage)
      }

      const data = await response.json()
      
      if (data.success && data.sales) {
        console.log('✅ Sales data fetched for branch:', userBranch, '-', data.sales.length, 'sales')
        
        // Process the data
        processSalesData(data.sales)
        setSalesData(data.sales)
        setTotalPages(data.pagination?.totalPages || 1)
      }

    } catch (error) {
      console.error('❌ Error fetching sales data:', error)
      Swal.fire({
        icon: 'error',
        title: 'Data Fetch Error',
        text: `Failed to fetch sales data: ${error.message}`,
        confirmButtonColor: COLORS.primary,
      })
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }

  // 🔥 Process sales data for analytics (branch-specific)
  const processSalesData = (sales) => {
    const stats = {}
    const dailyData = {}
    const customerStats = {}
    let total = 0
    let totalTransactionCount = 0

    sales.forEach(sale => {
      const saleAmount = parseFloat(sale.totalAmount) || 0
      total += saleAmount
      totalTransactionCount++

      // Track customers
      const customerName = sale.customer?.name || 'Walk-in Customer'
      customerStats[customerName] = (customerStats[customerName] || 0) + saleAmount

      // Since we're filtering by branch, all sales should be from moderator's branch
      stats[userBranch] = total

      // Process daily statistics
      const saleDate = new Date(sale.createdAt || sale.timestamp)
      if (!isNaN(saleDate.getTime())) {
        const saleDate_str = saleDate.toISOString().split('T')[0]
        dailyData[saleDate_str] = (dailyData[saleDate_str] || 0) + saleAmount
      }
    })

    // Convert to arrays for charts
    const dailyArray = Object.entries(dailyData)
      .sort(([a], [b]) => a.localeCompare(b))
      .slice(-30)
      .map(([date, amount]) => ({
        date: new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        sales: amount,
        formatted: `$${amount.toLocaleString()}`
      }))

    // Top customers
    const topCustomersArray = Object.entries(customerStats)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 5)
      .map(([name, amount]) => ({ name, amount }))

    setBranchStats(stats)
    setDailyStats(dailyArray)
    setTotalSales(total)
    setTotalTransactions(totalTransactionCount)
    setAverageOrderValue(totalTransactionCount > 0 ? total / totalTransactionCount : 0)
    setSalesGrowth(5.2) // Mock growth
    setTopCustomers(topCustomersArray)
  }

  // Export sales data (for moderator's branch only)
  const exportSalesData = () => {
    const csvContent = [
      ['Sale ID', 'Date', 'Customer', 'Amount', 'Payment Type', 'Status'],
      ...salesData.map(sale => [
        sale.saleId,
        new Date(sale.createdAt).toLocaleDateString(),
        sale.customer?.name || 'N/A',
        sale.totalAmount,
        sale.paymentType,
        sale.status
      ])
    ].map(row => row.join(',')).join('\n')

    const blob = new Blob([csvContent], { type: 'text/csv' })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${userBranch}-sales-export-${new Date().toISOString().split('T')[0]}.csv`
    a.click()
    window.URL.revokeObjectURL(url)
  }

  // Trigger data fetch when filters change
  useEffect(() => {
    if (userRole === 'moderator' && userBranch) {
      const timeoutId = setTimeout(() => {
        fetchSalesData()
      }, 300)

      return () => clearTimeout(timeoutId)
    }
  }, [userRole, userBranch, currentPage, startDate, endDate, statusFilter, paymentTypeFilter, searchTerm])

  // Show loading screen
  if (userLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-900 via-purple-800 to-indigo-900 flex items-center justify-center">
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-center"
        >
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
            className="relative mx-auto mb-8"
          >
            <div className="w-20 h-20 border-4 border-purple-200 border-t-purple-500 rounded-full animate-spin"></div>
            <Sparkles className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 text-purple-300" size={24} />
          </motion.div>
          <motion.p 
            animate={{ opacity: [0.7, 1, 0.7] }}
            transition={{ duration: 2, repeat: Infinity }}
            className="text-purple-200 text-xl font-medium"
          >
            Loading your dashboard...
          </motion.p>
        </motion.div>
      </div>
    )
  }

  // Check moderator access
  if (userRole !== 'moderator') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-900 via-purple-800 to-indigo-900 flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center max-w-md mx-auto"
        >
          <motion.div
            animate={{ scale: [1, 1.05, 1] }}
            transition={{ duration: 2, repeat: Infinity }}
            className="w-24 h-24 mx-auto mb-6 bg-gradient-to-br from-orange-500 to-red-600 rounded-full flex items-center justify-center"
          >
            <UserCheck size={40} className="text-white" />
          </motion.div>
          <h1 className="text-3xl font-bold text-white mb-4">
            🛡️ Moderator Access Required
          </h1>
          <p className="text-purple-200 text-lg mb-8">
            You need moderator privileges to access this dashboard.
          </p>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => window.location.href = '/moderator/login'}
            className="bg-gradient-to-r from-purple-600 to-indigo-600 text-white px-8 py-3 rounded-xl font-semibold hover:from-purple-700 hover:to-indigo-700 transition-all shadow-lg"
          >
            Login as Moderator
          </motion.button>
        </motion.div>
      </div>
    )
  }

  // Prepare chart data (single branch)
  const branchChartData = Object.entries(branchStats).map(([branch, amount]) => ({
    branch: branch.charAt(0).toUpperCase() + branch.slice(1),
    sales: amount,
    formatted: `$${amount.toLocaleString()}`,
  }))

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-indigo-50">
      {/* Animated Background */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <motion.div
          animate={{
            scale: [1, 1.2, 1],
            rotate: [0, 180, 360],
          }}
          transition={{
            duration: 20,
            repeat: Infinity,
            ease: "linear"
          }}
          className="absolute -top-1/2 -right-1/2 w-96 h-96 bg-gradient-to-br from-purple-200/20 to-indigo-200/20 rounded-full blur-3xl"
        />
      </div>

      <div className="relative z-10 max-w-7xl mx-auto p-6">
        {/* Ultra-Modern Header with Branch Info */}
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="mb-10"
        >
          <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6">
            <motion.div variants={cardVariants} className="flex-1">
              <motion.div
                className="flex items-center gap-4 mb-2"
                whileHover={{ x: 5 }}
              >
                <div className="relative">
                  <motion.div
                    animate={{ scale: [1, 1.05, 1] }}
                    transition={{ duration: 2, repeat: Infinity }}
                    className="w-16 h-16 bg-gradient-to-br from-purple-600 to-indigo-600 rounded-2xl flex items-center justify-center"
                  >
                    <UserCheck size={28} className="text-white" />
                  </motion.div>
                  <motion.div
                    animate={{ rotate: [0, 360] }}
                    transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
                    className="absolute -top-1 -right-1 w-6 h-6 bg-gradient-to-br from-green-400 to-emerald-500 rounded-full flex items-center justify-center"
                  >
                    <Store size={12} className="text-white" />
                  </motion.div>
                </div>
                <div>
                  <motion.h1 
                    className="text-4xl lg:text-5xl font-bold bg-gradient-to-r from-purple-600 via-purple-700 to-indigo-600 bg-clip-text text-transparent"
                    whileHover={{ scale: 1.02 }}
                  >
                    Sales Dashboard
                  </motion.h1>
                  <div className="flex items-center gap-2 mt-1">
                    <UserCheck size={16} className="text-green-500" />
                    <span className="text-purple-600 font-semibold">Moderator Portal</span>
                    <motion.div
                      animate={{ opacity: [0.5, 1, 0.5] }}
                      transition={{ duration: 2, repeat: Infinity }}
                      className="px-3 py-1 bg-gradient-to-r from-green-100 to-emerald-100 rounded-full flex items-center gap-1"
                    >
                      <MapPinIcon size={12} className="text-green-700" />
                      <span className="text-xs font-bold text-green-700 capitalize">
                        {userBranch} Branch
                      </span>
                    </motion.div>
                  </div>
                </div>
              </motion.div>
              <motion.p 
                className="text-gray-600 text-lg leading-relaxed max-w-2xl"
                variants={cardVariants}
              >
                Monitor your branch performance, track sales transactions, and analyze customer data 
                for the <span className="font-semibold text-purple-600 capitalize">{userBranch}</span> branch.
              </motion.p>
            </motion.div>

            <motion.div 
              variants={cardVariants}
              className="flex flex-col sm:flex-row items-center gap-4"
            >
              <motion.button
                whileHover={{ scale: 1.05, y: -2 }}
                whileTap={{ scale: 0.95 }}
                onClick={exportSalesData}
                className="px-6 py-3 bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-xl font-semibold shadow-lg hover:shadow-xl transition-all hover:from-green-600 hover:to-emerald-700 flex items-center gap-2"
              >
                <DownloadIcon size={18} />
                Export Branch Data
              </motion.button>

              <motion.button
                whileHover={{ scale: 1.05, y: -2 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => fetchSalesData(true)}
                disabled={refreshing}
                className={`px-6 py-3 bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-xl font-semibold shadow-lg hover:shadow-xl transition-all ${
                  refreshing ? 'opacity-80 cursor-not-allowed' : 'hover:from-purple-700 hover:to-indigo-700'
                }`}
              >
                <motion.div
                  animate={refreshing ? { rotate: 360 } : { rotate: 0 }}
                  transition={{ duration: 1, repeat: refreshing ? Infinity : 0, ease: "linear" }}
                  className="flex items-center gap-2"
                >
                  <RefreshCw size={18} />
                  {refreshing ? 'Syncing...' : 'Refresh'}
                </motion.div>
              </motion.button>
            </motion.div>
          </div>
        </motion.div>

        {/* Filter Panel (no branch selector for moderator) */}
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="mb-8"
        >
          <motion.div 
            variants={cardVariants}
            whileHover="hover"
            className="bg-white/80 backdrop-blur-xl rounded-2xl border border-purple-100 shadow-xl p-8"
          >
            <div className="flex items-center gap-3 mb-6">
              <motion.div
                whileHover={{ rotate: 180 }}
                transition={{ duration: 0.3 }}
                className="w-12 h-12 bg-gradient-to-br from-purple-500 to-indigo-500 rounded-xl flex items-center justify-center"
              >
                <Filter size={20} className="text-white" />
              </motion.div>
              <div>
                <h3 className="text-xl font-bold text-gray-900">Smart Filters</h3>
                <p className="text-gray-600">Filter your branch data with precision controls</p>
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
              <motion.div whileHover={{ scale: 1.02 }} className="space-y-2">
                <label className="block text-sm font-semibold text-gray-700">
                  <Calendar size={16} className="inline mr-2" />
                  Start Date
                </label>
                <input
                  type="date"
                  value={startDate}
                  onChange={handleStartDateChange}
                  className="w-full p-3 rounded-xl border border-gray-200 focus:border-purple-500 focus:ring-2 focus:ring-purple-200 transition-all bg-white/50 backdrop-blur-sm"
                />
              </motion.div>

              <motion.div whileHover={{ scale: 1.02 }} className="space-y-2">
                <label className="block text-sm font-semibold text-gray-700">
                  <Calendar size={16} className="inline mr-2" />
                  End Date
                </label>
                <input
                  type="date"
                  value={endDate}
                  onChange={handleEndDateChange}
                  className="w-full p-3 rounded-xl border border-gray-200 focus:border-purple-500 focus:ring-2 focus:ring-purple-200 transition-all bg-white/50 backdrop-blur-sm"
                />
              </motion.div>

              <motion.div whileHover={{ scale: 1.02 }} className="space-y-2">
                <label className="block text-sm font-semibold text-gray-700">
                  <CheckCircle size={16} className="inline mr-2" />
                  Status
                </label>
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="w-full p-3 rounded-xl border border-gray-200 focus:border-purple-500 focus:ring-2 focus:ring-purple-200 transition-all bg-white/50 backdrop-blur-sm"
                >
                  <option value="">All Status</option>
                  <option value="completed">Completed</option>
                  <option value="pending">Pending</option>
                  <option value="cancelled">Cancelled</option>
                  <option value="refunded">Refunded</option>
                </select>
              </motion.div>

              <motion.div whileHover={{ scale: 1.02 }} className="space-y-2">
                <label className="block text-sm font-semibold text-gray-700">
                  <CreditCard size={16} className="inline mr-2" />
                  Payment Type
                </label>
                <select
                  value={paymentTypeFilter}
                  onChange={(e) => setPaymentTypeFilter(e.target.value)}
                  className="w-full p-3 rounded-xl border border-gray-200 focus:border-purple-500 focus:ring-2 focus:ring-purple-200 transition-all bg-white/50 backdrop-blur-sm"
                >
                  <option value="">All Payment Types</option>
                  <option value="cash">Cash</option>
                  <option value="mobile_banking">Mobile Banking</option>
                  <option value="card">Card</option>
                  <option value="mixed">Mixed</option>
                </select>
              </motion.div>
            </div>

            <div className="grid grid-cols-1 gap-6">
              <motion.div whileHover={{ scale: 1.02 }} className="space-y-2">
                <label className="block text-sm font-semibold text-gray-700">
                  <Search size={16} className="inline mr-2" />
                  Search
                </label>
                <input
                  type="text"
                  placeholder="Search sales, customers, sale IDs..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full p-3 rounded-xl border border-gray-200 focus:border-purple-500 focus:ring-2 focus:ring-purple-200 transition-all bg-white/50 backdrop-blur-sm"
                />
              </motion.div>
            </div>

            <div className="flex justify-between items-center mt-6">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => {
                  setStartDate('')
                  setEndDate('')
                  setStatusFilter('')
                  setPaymentTypeFilter('')
                  setSearchTerm('')
                  setCurrentPage(1)
                }}
                className="px-6 py-3 bg-gradient-to-r from-gray-100 to-gray-200 text-gray-700 rounded-xl font-semibold hover:from-gray-200 hover:to-gray-300 transition-all shadow-sm hover:shadow-md"
              >
                Clear All Filters
              </motion.button>

              <div className="text-sm text-gray-600">
                {totalTransactions} transactions • ${totalSales.toLocaleString()} total
              </div>
            </div>

            {/* Active Filters Display */}
            {(startDate || endDate || statusFilter || paymentTypeFilter || searchTerm) && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="mt-4 p-3 bg-purple-50 rounded-lg border border-purple-200"
              >
                <p className="text-sm text-purple-700 font-medium">
                  Active Filters: 
                  <span className="ml-2 px-2 py-1 bg-purple-200 rounded text-xs">Branch: {userBranch}</span>
                  {startDate && <span className="ml-2 px-2 py-1 bg-purple-200 rounded text-xs">From: {startDate}</span>}
                  {endDate && <span className="ml-2 px-2 py-1 bg-purple-200 rounded text-xs">To: {endDate}</span>}
                  {statusFilter && <span className="ml-2 px-2 py-1 bg-purple-200 rounded text-xs capitalize">Status: {statusFilter}</span>}
                  {paymentTypeFilter && <span className="ml-2 px-2 py-1 bg-purple-200 rounded text-xs capitalize">Payment: {paymentTypeFilter}</span>}
                  {searchTerm && <span className="ml-2 px-2 py-1 bg-purple-200 rounded text-xs">Search: {searchTerm}</span>}
                </p>
              </motion.div>
            )}
          </motion.div>
        </motion.div>

        {loading ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex justify-center items-center py-20"
          >
            <div className="text-center">
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                className="w-16 h-16 border-4 border-purple-200 border-t-purple-600 rounded-full mx-auto mb-4"
              />
              <motion.p
                animate={{ opacity: [0.5, 1, 0.5] }}
                transition={{ duration: 2, repeat: Infinity }}
                className="text-purple-600 text-lg font-semibold"
              >
                Loading branch data...
              </motion.p>
            </div>
          </motion.div>
        ) : (
          <>
            {/* Tab Navigation */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-8"
            >
              <div className="bg-white/80 backdrop-blur-xl rounded-2xl border border-purple-100 shadow-xl p-2">
                <div className="flex space-x-2">
                  {[
                    { id: 'overview', label: 'Overview', icon: BarChart3 },
                    { id: 'transactions', label: 'Transactions', icon: FileText },
                    { id: 'analytics', label: 'Analytics', icon: Activity },
                  ].map((tab) => {
                    const Icon = tab.icon
                    return (
                      <motion.button
                        key={tab.id}
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={() => setActiveTab(tab.id)}
                        className={`flex-1 flex items-center justify-center gap-2 px-6 py-3 rounded-xl font-semibold transition-all ${
                          activeTab === tab.id
                            ? 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow-lg'
                            : 'text-gray-600 hover:bg-purple-50 hover:text-purple-600'
                        }`}
                      >
                        <Icon size={18} />
                        {tab.label}
                      </motion.button>
                    )
                  })}
                </div>
              </div>
            </motion.div>

            {/* Tab Content */}
            <AnimatePresence mode="wait">
              {activeTab === 'overview' && (
                <motion.div
                  key="overview"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                >
                  {/* KPI Metrics Grid */}
                  <motion.div
                    variants={containerVariants}
                    initial="hidden"
                    animate="visible"
                    className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-10"
                  >
                    {/* Total Sales */}
                    <motion.div
                      variants={cardVariants}
                      whileHover="hover"
                      className="group relative overflow-hidden bg-gradient-to-br from-emerald-500 to-green-600 rounded-2xl p-6 text-white shadow-xl"
                    >
                      <div className="relative z-10">
                        <div className="flex items-center justify-between mb-4">
                          <motion.div
                            whileHover={{ scale: 1.1, rotate: 5 }}
                            className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center backdrop-blur-sm"
                          >
                            <DollarSign size={24} />
                          </motion.div>
                          <motion.div
                            animate={{ scale: [1, 1.1, 1] }}
                            transition={{ duration: 2, repeat: Infinity }}
                            className="flex items-center gap-1 text-sm font-semibold bg-white/20 px-2 py-1 rounded-full"
                          >
                            <ArrowUpRight size={14} />
                            +{salesGrowth.toFixed(1)}%
                          </motion.div>
                        </div>
                        <h3 className="text-3xl font-bold mb-2">
                          ${totalSales.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                        </h3>
                        <p className="text-emerald-100 font-medium">Branch Revenue</p>
                      </div>
                    </motion.div>

                    {/* Total Transactions */}
                    <motion.div
                      variants={cardVariants}
                      whileHover="hover"
                      className="group relative overflow-hidden bg-gradient-to-br from-blue-500 to-cyan-600 rounded-2xl p-6 text-white shadow-xl"
                    >
                      <div className="relative z-10">
                        <div className="flex items-center justify-between mb-4">
                          <motion.div
                            whileHover={{ scale: 1.1, rotate: -5 }}
                            className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center backdrop-blur-sm"
                          >
                            <ShoppingCart size={24} />
                          </motion.div>
                        </div>
                        <h3 className="text-3xl font-bold mb-2">
                          {totalTransactions.toLocaleString()}
                        </h3>
                        <p className="text-blue-100 font-medium">Transactions</p>
                      </div>
                    </motion.div>

                    {/* Average Order Value */}
                    <motion.div
                      variants={cardVariants}
                      whileHover="hover"
                      className="group relative overflow-hidden bg-gradient-to-br from-purple-500 to-violet-600 rounded-2xl p-6 text-white shadow-xl"
                    >
                      <div className="relative z-10">
                        <div className="flex items-center justify-between mb-4">
                          <motion.div
                            whileHover={{ scale: 1.1, rotate: 10 }}
                            className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center backdrop-blur-sm"
                          >
                            <Target size={24} />
                          </motion.div>
                        </div>
                        <h3 className="text-3xl font-bold mb-2">
                          ${averageOrderValue.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                        </h3>
                        <p className="text-purple-100 font-medium">Avg Order Value</p>
                      </div>
                    </motion.div>

                    {/* Branch Performance */}
                    <motion.div
                      variants={cardVariants}
                      whileHover="hover"
                      className="group relative overflow-hidden bg-gradient-to-br from-orange-500 to-red-500 rounded-2xl p-6 text-white shadow-xl"
                    >
                      <div className="relative z-10">
                        <div className="flex items-center justify-between mb-4">
                          <motion.div
                            whileHover={{ scale: 1.1, rotate: -10 }}
                            className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center backdrop-blur-sm"
                          >
                            <Store size={24} />
                          </motion.div>
                          <motion.div
                            animate={{ scale: [1, 1.2, 1] }}
                            transition={{ duration: 1.5, repeat: Infinity }}
                            className="text-orange-200"
                          >
                            <Star size={20} />
                          </motion.div>
                        </div>
                        <h3 className="text-2xl font-bold mb-2 capitalize">
                          {userBranch} Branch
                        </h3>
                        <p className="text-orange-100 font-medium">Your Location</p>
                      </div>
                    </motion.div>
                  </motion.div>

                  {/* Charts Section */}
                  <div className="grid grid-cols-1 xl:grid-cols-2 gap-8 mb-10">
                    {/* Branch Performance (Single Branch) */}
                    <motion.div
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      className="bg-white/80 backdrop-blur-xl rounded-2xl border border-purple-100 shadow-xl p-8"
                    >
                      <div className="flex items-center justify-between mb-8">
                        <div className="flex items-center gap-3">
                          <motion.div
                            whileHover={{ rotate: 180 }}
                            transition={{ duration: 0.3 }}
                            className="w-12 h-12 bg-gradient-to-br from-purple-500 to-indigo-500 rounded-xl flex items-center justify-center"
                          >
                            <BarChart3 size={20} className="text-white" />
                          </motion.div>
                          <div>
                            <h3 className="text-xl font-bold text-gray-900">Branch Performance</h3>
                            <p className="text-gray-600 capitalize">{userBranch} branch metrics</p>
                          </div>
                        </div>
                      </div>
                      {branchChartData.length > 0 ? (
                        <ResponsiveContainer width="100%" height={350}>
                          <BarChart data={branchChartData}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
                            <XAxis 
                              dataKey="branch" 
                              axisLine={false}
                              tickLine={false}
                              tick={{ fontSize: 12, fill: '#6b7280' }}
                            />
                            <YAxis 
                              tickFormatter={(value) => `$${(value / 1000).toFixed(0)}K`}
                              axisLine={false}
                              tickLine={false}
                              tick={{ fontSize: 12, fill: '#6b7280' }}
                            />
                            <Tooltip 
                              formatter={(value) => [`$${value.toLocaleString()}`, 'Revenue']}
                              contentStyle={{ 
                                backgroundColor: 'rgba(255, 255, 255, 0.95)', 
                                border: 'none',
                                borderRadius: '12px',
                                boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.1)'
                              }}
                            />
                            <Bar 
                              dataKey="sales" 
                              fill="#8B5CF6"
                              radius={[8, 8, 0, 0]}
                            />
                          </BarChart>
                        </ResponsiveContainer>
                      ) : (
                        <div className="flex items-center justify-center h-64 text-gray-500">
                          <div className="text-center">
                            <Package size={48} className="mx-auto mb-4 text-gray-400" />
                            <p className="text-lg font-medium">No data available</p>
                          </div>
                        </div>
                      )}
                    </motion.div>

                    {/* Sales Trend Chart */}
                    <motion.div
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      className="bg-white/80 backdrop-blur-xl rounded-2xl border border-purple-100 shadow-xl p-8"
                    >
                      <div className="flex items-center justify-between mb-8">
                        <div className="flex items-center gap-3">
                          <motion.div
                            whileHover={{ rotate: 360 }}
                            transition={{ duration: 0.5 }}
                            className="w-12 h-12 bg-gradient-to-br from-green-500 to-emerald-500 rounded-xl flex items-center justify-center"
                          >
                            <TrendingUp size={20} className="text-white" />
                          </motion.div>
                          <div>
                            <h3 className="text-xl font-bold text-gray-900">Sales Trend</h3>
                            <p className="text-gray-600">30-day overview</p>
                          </div>
                        </div>
                      </div>
                      {dailyStats.length > 0 ? (
                        <ResponsiveContainer width="100%" height={350}>
                          <AreaChart data={dailyStats}>
                            <defs>
                              <linearGradient id="salesGradient" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="0%" stopColor="#10B981" stopOpacity={0.3} />
                                <stop offset="100%" stopColor="#10B981" stopOpacity={0.05} />
                              </linearGradient>
                            </defs>
                            <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
                            <XAxis 
                              dataKey="date"
                              axisLine={false}
                              tickLine={false}
                              tick={{ fontSize: 12, fill: '#6b7280' }}
                            />
                            <YAxis 
                              tickFormatter={(value) => `$${(value / 1000).toFixed(0)}K`}
                              axisLine={false}
                              tickLine={false}
                              tick={{ fontSize: 12, fill: '#6b7280' }}
                            />
                            <Tooltip 
                              formatter={(value) => [`$${value.toLocaleString()}`, 'Sales']}
                              contentStyle={{ 
                                backgroundColor: 'rgba(255, 255, 255, 0.95)', 
                                border: 'none',
                                borderRadius: '12px',
                                boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.1)'
                              }}
                            />
                            <Area 
                              type="monotone" 
                              dataKey="sales" 
                              stroke="#10B981" 
                              strokeWidth={3}
                              fill="url(#salesGradient)"
                            />
                          </AreaChart>
                        </ResponsiveContainer>
                      ) : (
                        <div className="flex items-center justify-center h-64 text-gray-500">
                          <div className="text-center">
                            <TrendingUp size={48} className="mx-auto mb-4 text-gray-400" />
                            <p className="text-lg font-medium">No trend data</p>
                          </div>
                        </div>
                      )}
                    </motion.div>
                  </div>
                </motion.div>
              )}

              {activeTab === 'transactions' && (
                <motion.div
                  key="transactions"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                >
                  {/* Sales Data Table (No Delete Button for Moderator) */}
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-white/80 backdrop-blur-xl rounded-2xl border border-purple-100 shadow-xl overflow-hidden"
                  >
                    <div className="p-8 border-b border-gray-100">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <motion.div
                            whileHover={{ rotate: 180 }}
                            transition={{ duration: 0.3 }}
                            className="w-12 h-12 bg-gradient-to-br from-purple-500 to-indigo-500 rounded-xl flex items-center justify-center"
                          >
                            <FileText size={20} className="text-white" />
                          </motion.div>
                          <div>
                            <h3 className="text-xl font-bold text-gray-900">Branch Transactions</h3>
                            <p className="text-gray-600 capitalize">
                              Sales history for {userBranch} branch
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-sm text-gray-500">
                            Showing {salesData.length} of {totalTransactions} transactions
                          </span>
                        </div>
                      </div>
                    </div>

                    {salesData.length > 0 ? (
                      <div className="overflow-x-auto">
                        <table className="w-full">
                          <thead className="bg-gradient-to-r from-purple-50 to-indigo-50">
                            <tr>
                              <th className="px-6 py-4 text-left text-sm font-bold text-gray-700 uppercase tracking-wider">
                                Sale Details
                              </th>
                              <th className="px-6 py-4 text-left text-sm font-bold text-gray-700 uppercase tracking-wider">
                                Customer
                              </th>
                              <th className="px-6 py-4 text-left text-sm font-bold text-gray-700 uppercase tracking-wider">
                                Items
                              </th>
                              <th className="px-6 py-4 text-left text-sm font-bold text-gray-700 uppercase tracking-wider">
                                Payment
                              </th>
                              <th className="px-6 py-4 text-left text-sm font-bold text-gray-700 uppercase tracking-wider">
                                Status
                              </th>
                              <th className="px-6 py-4 text-left text-sm font-bold text-gray-700 uppercase tracking-wider">
                                Actions
                              </th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-gray-100">
                            {salesData.map((sale, index) => (
                              <motion.tr
                                key={sale._id}
                                initial={{ opacity: 0, x: -20 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: index * 0.05 }}
                                whileHover={{ backgroundColor: 'rgba(139, 92, 246, 0.02)' }}
                                className="hover:bg-purple-50/50 transition-colors"
                              >
                                <td className="px-6 py-4">
                                  <div className="flex items-start gap-3">
                                    <div className="w-10 h-10 bg-gradient-to-br from-purple-400 to-indigo-500 rounded-lg flex items-center justify-center flex-shrink-0">
                                      <Receipt size={16} className="text-white" />
                                    </div>
                                    <div>
                                      <p className="font-semibold text-gray-900 text-sm">
                                        {sale.saleId}
                                      </p>
                                      <p className="text-xs text-gray-500">
                                        {new Date(sale.createdAt).toLocaleDateString()} • {new Date(sale.createdAt).toLocaleTimeString()}
                                      </p>
                                      <p className="text-xs text-gray-500">
                                        By: {sale.cashier}
                                      </p>
                                    </div>
                                  </div>
                                </td>
                                <td className="px-6 py-4">
                                  <div className="flex items-center gap-2">
                                    <div className="w-8 h-8 bg-gradient-to-br from-blue-400 to-cyan-500 rounded-full flex items-center justify-center">
                                      <User size={14} className="text-white" />
                                    </div>
                                    <div>
                                      <p className="font-medium text-gray-900 text-sm">
                                        {sale.customer?.name || 'Walk-in Customer'}
                                      </p>
                                      {sale.customer?.phone && (
                                        <p className="text-xs text-gray-500 flex items-center gap-1">
                                          <Phone size={10} />
                                          {sale.customer.phone}
                                        </p>
                                      )}
                                    </div>
                                  </div>
                                </td>
                                <td className="px-6 py-4">
                                  <div className="space-y-1">
                                    {sale.items?.slice(0, 2).map((item, idx) => (
                                      <div key={idx} className="text-xs text-gray-600">
                                        {item.quantity}x {item.productName.substring(0, 25)}...
                                      </div>
                                    )) || []}
                                    {sale.items?.length > 2 && (
                                      <div className="text-xs text-purple-600 font-medium">
                                        +{sale.items.length - 2} more items
                                      </div>
                                    )}
                                  </div>
                                </td>
                                <td className="px-6 py-4">
                                  <div>
                                    <p className="font-bold text-lg text-gray-900">
                                      ${sale.totalAmount?.toLocaleString()}
                                    </p>
                                    <div className="flex items-center gap-1 mt-1">
                                      <CreditCard size={12} className="text-gray-400" />
                                      <span className="text-xs text-gray-500 capitalize">
                                        {sale.paymentType}
                                      </span>
                                    </div>
                                  </div>
                                </td>
                                <td className="px-6 py-4">
                                  <span
                                    className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-bold ${
                                      sale.status === 'completed'
                                        ? 'bg-green-100 text-green-800'
                                        : sale.status === 'pending'
                                        ? 'bg-yellow-100 text-yellow-800'
                                        : sale.status === 'cancelled'
                                        ? 'bg-red-100 text-red-800'
                                        : 'bg-gray-100 text-gray-800'
                                    }`}
                                  >
                                    <CheckCircle size={12} className="mr-1" />
                                    {sale.status?.charAt(0).toUpperCase() + sale.status?.slice(1)}
                                  </span>
                                </td>
                                <td className="px-6 py-4">
                                  <div className="flex items-center gap-2">
                                    <motion.button
                                      whileHover={{ scale: 1.1 }}
                                      whileTap={{ scale: 0.9 }}
                                      onClick={() => {
                                        setSelectedSale(sale)
                                        setShowSaleDetails(true)
                                      }}
                                      className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                                      title="View Details"
                                    >
                                      <Eye size={16} />
                                    </motion.button>
                                    {/* 🔒 No Delete Button for Moderators */}
                                  </div>
                                </td>
                              </motion.tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    ) : (
                      <div className="text-center py-20">
                        <motion.div
                          initial={{ opacity: 0, scale: 0.8 }}
                          animate={{ opacity: 1, scale: 1 }}
                          className="mb-6"
                        >
                          <FileText size={64} className="mx-auto text-gray-300 mb-4" />
                          <h3 className="text-xl font-bold text-gray-900 mb-2">No Sales Data</h3>
                          <p className="text-gray-600 max-w-md mx-auto">
                            No sales transactions found for your branch. Try adjusting your search criteria.
                          </p>
                        </motion.div>
                      </div>
                    )}

                    {/* Pagination */}
                    {totalPages > 1 && (
                      <div className="px-8 py-6 border-t border-gray-100 bg-gray-50">
                        <div className="flex items-center justify-between">
                          <div className="text-sm text-gray-600">
                            Page {currentPage} of {totalPages}
                          </div>
                          <div className="flex items-center gap-2">
                            <motion.button
                              whileHover={{ scale: 1.05 }}
                              whileTap={{ scale: 0.95 }}
                              onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                              disabled={currentPage === 1}
                              className="px-4 py-2 bg-white border border-gray-300 rounded-lg disabled:opacity-50 hover:bg-gray-50 transition-colors"
                            >
                              Previous
                            </motion.button>
                            <motion.button
                              whileHover={{ scale: 1.05 }}
                              whileTap={{ scale: 0.95 }}
                              onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                              disabled={currentPage === totalPages}
                              className="px-4 py-2 bg-white border border-gray-300 rounded-lg disabled:opacity-50 hover:bg-gray-50 transition-colors"
                            >
                              Next
                            </motion.button>
                          </div>
                        </div>
                      </div>
                    )}
                  </motion.div>
                </motion.div>
              )}

              {activeTab === 'analytics' && (
                <motion.div
                  key="analytics"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                >
                  {/* Analytics Section */}
                  <div className="grid grid-cols-1 xl:grid-cols-2 gap-8 mb-8">
                    {/* Branch Summary */}
                    <motion.div
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      className="bg-white/80 backdrop-blur-xl rounded-2xl border border-purple-100 shadow-xl p-8"
                    >
                      <div className="flex items-center justify-between mb-8">
                        <div className="flex items-center gap-3">
                          <motion.div
                            whileHover={{ rotate: -180 }}
                            transition={{ duration: 0.3 }}
                            className="w-12 h-12 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-xl flex items-center justify-center"
                          >
                            <Store size={20} className="text-white" />
                          </motion.div>
                          <div>
                            <h3 className="text-xl font-bold text-gray-900">Branch Summary</h3>
                            <p className="text-gray-600 capitalize">{userBranch} branch analytics</p>
                          </div>
                        </div>
                      </div>
                      <div className="space-y-6">
                        <div className="bg-gradient-to-r from-purple-50 to-indigo-50 rounded-xl p-6">
                          <div className="flex items-center justify-between">
                            <div>
                              <h4 className="text-lg font-bold text-gray-900 capitalize">{userBranch} Branch</h4>
                              <p className="text-gray-600">Total Performance</p>
                            </div>
                            <div className="text-right">
                              <p className="text-2xl font-bold text-purple-600">
                                ${totalSales.toLocaleString()}
                              </p>
                              <p className="text-sm text-gray-500">
                                {totalTransactions} transactions
                              </p>
                            </div>
                          </div>
                          <div className="mt-4 h-2 bg-gray-200 rounded-full overflow-hidden">
                            <motion.div
                              initial={{ width: 0 }}
                              animate={{ width: '100%' }}
                              transition={{ duration: 1.5, delay: 0.5 }}
                              className="h-full bg-gradient-to-r from-purple-500 to-indigo-500 rounded-full"
                            />
                          </div>
                        </div>
                      </div>
                    </motion.div>

                    {/* Top Customers for Branch */}
                    <motion.div
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      className="bg-white/80 backdrop-blur-xl rounded-2xl border border-purple-100 shadow-xl p-8"
                    >
                      <div className="flex items-center justify-between mb-8">
                        <div className="flex items-center gap-3">
                          <motion.div
                            whileHover={{ rotate: 360 }}
                            transition={{ duration: 0.5 }}
                            className="w-12 h-12 bg-gradient-to-br from-yellow-500 to-orange-500 rounded-xl flex items-center justify-center"
                          >
                            <Users size={20} className="text-white" />
                          </motion.div>
                          <div>
                            <h3 className="text-xl font-bold text-gray-900">Top Customers</h3>
                            <p className="text-gray-600">Highest value customers</p>
                          </div>
                        </div>
                      </div>
                      <div className="space-y-4">
                        {topCustomers.length > 0 ? (
                          topCustomers.map((customer, index) => (
                            <motion.div
                              key={customer.name}
                              initial={{ opacity: 0, x: -20 }}
                              animate={{ opacity: 1, x: 0 }}
                              transition={{ delay: index * 0.1 }}
                              className="flex items-center justify-between p-4 bg-gradient-to-r from-gray-50 to-purple-50 rounded-xl"
                            >
                              <div className="flex items-center gap-3">
                                <div className={`w-10 h-10 rounded-full flex items-center justify-center text-white font-bold ${
                                  index === 0 ? 'bg-gradient-to-r from-yellow-400 to-orange-500' :
                                  index === 1 ? 'bg-gradient-to-r from-gray-400 to-gray-500' :
                                  index === 2 ? 'bg-gradient-to-r from-yellow-600 to-yellow-700' :
                                  'bg-gradient-to-r from-purple-400 to-indigo-500'
                                }`}>
                                  {index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : index + 1}
                                </div>
                                <div>
                                  <p className="font-semibold text-gray-900">
                                    {customer.name}
                                  </p>
                                  <p className="text-sm text-gray-600">
                                    Customer #{index + 1}
                                  </p>
                                </div>
                              </div>
                              <div className="text-right">
                                <p className="font-bold text-lg text-gray-900">
                                  ${customer.amount.toLocaleString()}
                                </p>
                                <p className="text-sm text-gray-600">
                                  Total spent
                                </p>
                              </div>
                            </motion.div>
                          ))
                        ) : (
                          <div className="text-center py-8">
                            <Users size={48} className="mx-auto mb-4 text-gray-400" />
                            <p className="text-gray-600">No customer data available</p>
                          </div>
                        )}
                      </div>
                    </motion.div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </>
        )}
      </div>

      {/* Sale Details Modal (Same as Admin but without Edit/Delete) */}
      <AnimatePresence>
        {showSaleDetails && selectedSale && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden shadow-2xl"
            >
              <div className="flex justify-between items-center p-6 border-b border-gray-200 bg-gradient-to-r from-purple-50 to-blue-50">
                <h3 className="text-2xl font-bold text-gray-900 flex items-center gap-3">
                  <Receipt size={24} className="text-purple-600" />
                  Sale Details
                </h3>
                <button
                  onClick={() => setShowSaleDetails(false)}
                  className="text-gray-400 hover:text-gray-600 p-2 rounded-xl hover:bg-gray-100 transition-colors"
                >
                  <X size={24} />
                </button>
              </div>

              <div className="p-6 overflow-y-auto max-h-[calc(90vh-120px)]">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                  {/* Sale Information */}
                  <div className="bg-gradient-to-br from-purple-50 to-indigo-50 rounded-xl p-6 border border-purple-200">
                    <h4 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
                      <Hash size={18} className="text-purple-600" />
                      Sale Information
                    </h4>
                    <div className="space-y-3">
                      <div>
                        <span className="text-sm font-medium text-gray-600">Sale ID:</span>
                        <p className="font-semibold text-gray-900">{selectedSale.saleId}</p>
                      </div>
                      <div>
                        <span className="text-sm font-medium text-gray-600">Date & Time:</span>
                        <p className="font-semibold text-gray-900">
                          {new Date(selectedSale.createdAt).toLocaleString()}
                        </p>
                      </div>
                      <div>
                        <span className="text-sm font-medium text-gray-600">Cashier:</span>
                        <p className="font-semibold text-gray-900">{selectedSale.cashier}</p>
                      </div>
                      <div>
                        <span className="text-sm font-medium text-gray-600">Status:</span>
                        <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-bold ml-2 ${
                          selectedSale.status === 'completed' ? 'bg-green-100 text-green-800' :
                          selectedSale.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                          'bg-red-100 text-red-800'
                        }`}>
                          {selectedSale.status?.toUpperCase()}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Customer Information */}
                  <div className="bg-gradient-to-br from-blue-50 to-cyan-50 rounded-xl p-6 border border-blue-200">
                    <h4 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
                      <User size={18} className="text-blue-600" />
                      Customer Information
                    </h4>
                    <div className="space-y-3">
                      <div>
                        <span className="text-sm font-medium text-gray-600">Name:</span>
                        <p className="font-semibold text-gray-900">
                          {selectedSale.customer?.name || 'Walk-in Customer'}
                        </p>
                      </div>
                      <div>
                        <span className="text-sm font-medium text-gray-600">Phone:</span>
                        <p className="font-semibold text-gray-900">
                          {selectedSale.customer?.phone || 'Not provided'}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Items Table */}
                <div className="bg-white rounded-xl border border-gray-200 overflow-hidden mb-6">
                  <div className="px-6 py-4 bg-gray-50 border-b border-gray-200">
                    <h4 className="font-bold text-gray-900 flex items-center gap-2">
                      <Package size={18} className="text-purple-600" />
                      Items Purchased
                    </h4>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Product</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Branch</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Quantity</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Unit Price</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Total</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-200">
                        {selectedSale.items?.map((item, index) => (
                          <tr key={index} className="hover:bg-gray-50">
                            <td className="px-6 py-4">
                              <p className="font-medium text-gray-900">{item.productName}</p>
                            </td>
                            <td className="px-6 py-4">
                              <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-orange-100 text-orange-800 capitalize">
                                {item.branch}
                              </span>
                            </td>
                            <td className="px-6 py-4 font-semibold text-gray-900">{item.quantity}</td>
                            <td className="px-6 py-4 font-semibold text-gray-900">${item.unitPrice}</td>
                            <td className="px-6 py-4 font-bold text-green-600">${item.totalPrice}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Payment Summary */}
                <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-xl p-6 border border-green-200">
                  <h4 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
                    <CreditCard size={18} className="text-green-600" />
                    Payment Summary
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <span className="text-sm font-medium text-gray-600">Payment Type:</span>
                      <p className="font-semibold text-gray-900 capitalize">{selectedSale.paymentType}</p>
                    </div>
                    <div>
                      <span className="text-sm font-medium text-gray-600">Total Amount:</span>
                      <p className="font-bold text-2xl text-green-600">${selectedSale.totalAmount}</p>
                    </div>
                    <div>
                      <span className="text-sm font-medium text-gray-600">Change Given:</span>
                      <p className="font-semibold text-gray-900">
                        ${selectedSale.payment?.change || 0}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Floating Action Button */}
      <motion.button
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.9 }}
        className="fixed bottom-8 right-8 w-16 h-16 bg-gradient-to-r from-purple-600 to-indigo-600 rounded-full shadow-2xl flex items-center justify-center text-white z-40"
        onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
      >
        <motion.div
          animate={{ y: [-2, 2, -2] }}
          transition={{ duration: 2, repeat: Infinity }}
        >
          <ArrowUpRight size={24} />
        </motion.div>
      </motion.button>
    </div>
  )
}
