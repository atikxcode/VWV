'use client'

import React, { useState, useEffect, useContext } from 'react'
import { Package, Calendar, MapPin, Mail, CreditCard, Clock, ChevronDown, ChevronUp, AlertCircle, CheckCircle, XCircle, Truck, DollarSign } from 'lucide-react'
import { AuthContext } from '../../../Provider/AuthProvider'
import PrivateRoute from '../../../components/PrivateRoutes'

function OrderHistoryContent() {
  const { user } = useContext(AuthContext)
  
  // Data state
  const [userPhone, setUserPhone] = useState('')
  const [orders, setOrders] = useState([])
  const [combinedHistory, setCombinedHistory] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')
  
  // UI state
  const [expandedItems, setExpandedItems] = useState({})
  const [sortBy, setSortBy] = useState('date-desc')

  // Auto-fetch on component mount
  useEffect(() => {
    if (user) {
      fetchOrderHistory()
    }
  }, [user])

  // Fetch order history function
  const fetchOrderHistory = async () => {
    if (!user) return

    setIsLoading(true)
    setError('')
    setOrders([])
    setCombinedHistory([])
    setUserPhone('')

    try {
      // Get auth token
      const token = localStorage.getItem('auth-token') || await user.getIdToken()

      console.log('🔍 Fetching order history for user:', {
        email: user.email
      })

      // 🔥 STEP 1: Fetch user data from /api/user to get phone number
      console.log('📱 Fetching user data to get phone number...')
      let phoneNumber = ''
      
      try {
        const userResponse = await fetch(`/api/user?email=${encodeURIComponent(user.email)}`, {
          headers: { 
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
        })
        
        console.log('User API response status:', userResponse.status)
        
        if (userResponse.ok) {
          const userData = await userResponse.json()
          console.log('User data received:', userData)
          
          if (userData.exists && userData.user?.phone) {
            phoneNumber = userData.user.phone
            setUserPhone(phoneNumber)
            console.log('✅ User phone number found:', phoneNumber)
          } else {
            console.log('⚠️ No phone number found in user profile')
          }
        } else {
          const errorText = await userResponse.text()
          console.error('❌ User API error:', userResponse.status, errorText)
        }
      } catch (err) {
        console.error('❌ Error fetching user data:', err)
      }

      // Clean user phone for matching (remove all non-numeric characters)
      const userCleanPhone = phoneNumber ? phoneNumber.replace(/\D/g, '') : ''
      console.log('🔧 User clean phone:', userCleanPhone)
      console.log('🔧 User email:', user.email.toLowerCase())

      // 🔥 STEP 2: Fetch ALL orders (backend filters by authenticated user)
      let allOrders = []
      try {
        console.log('📦 Fetching ALL orders...')
        const ordersResponse = await fetch(`/api/orders`, {
          headers: { 
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
        })
        
        console.log('Orders response status:', ordersResponse.status)
        
        if (ordersResponse.ok) {
          const ordersData = await ordersResponse.json()
          console.log('📊 Total orders received from backend:', ordersData.orders?.length || 0)
          
          if (ordersData.orders && Array.isArray(ordersData.orders)) {
            // 🔥 CLIENT-SIDE FILTER: Match by email OR phone
            allOrders = ordersData.orders.filter(order => {
              // Check email match (case-insensitive)
              const orderEmail = order.customerInfo?.email?.toLowerCase() || ''
              const userEmail = user.email.toLowerCase()
              const emailMatch = orderEmail === userEmail
              
              // Check phone match (numeric only comparison)
              let phoneMatch = false
              if (userCleanPhone && order.customerInfo?.phone) {
                // Clean order phone (remove all non-numeric characters)
                const orderCleanPhone = order.customerInfo.phone.replace(/\D/g, '')
                
                // Match if phones are exactly the same OR one contains the other
                phoneMatch = orderCleanPhone === userCleanPhone || 
                           orderCleanPhone.includes(userCleanPhone) ||
                           userCleanPhone.includes(orderCleanPhone)
                
                // Log phone comparison for debugging
                if (phoneMatch) {
                  console.log('📱 Phone match found:', {
                    userPhone: userCleanPhone,
                    orderPhone: orderCleanPhone,
                    orderId: order.orderId
                  })
                }
              }
              
              // Log matching result for each order
              if (emailMatch || phoneMatch) {
                console.log('✅ Order matched:', {
                  orderId: order.orderId,
                  emailMatch,
                  phoneMatch,
                  orderEmail,
                  orderPhone: order.customerInfo?.phone
                })
              }
              
              // Return true if EITHER email OR phone matches
              return emailMatch || phoneMatch
            })
            
            console.log('✅ Orders matched (email OR phone):', allOrders.length)
            console.log('📋 Matched order IDs:', allOrders.map(o => o.orderId))
          }
        } else {
          const errorText = await ordersResponse.text()
          console.error('❌ Orders API error:', ordersResponse.status, errorText)
        }
      } catch (err) {
        console.error('❌ Error fetching orders:', err)
      }

      console.log('📊 Final results:')
      console.log('  - Orders found:', allOrders.length)

      setOrders(allOrders)

      // Combine and prepare for display (only orders now)
      const combined = allOrders.map(order => ({
        ...order,
        type: 'order',
        date: new Date(order.createdAt),
        amount: order.totals?.total || 0,
        id: order.orderId,
      }))

      setCombinedHistory(combined)

      if (combined.length === 0) {
        setError('No order history found for your account')
        console.log('⚠️ No orders found')
      } else {
        console.log('✅ Total orders:', combined.length)
      }

    } catch (error) {
      console.error('❌ Fetch error:', error)
      setError('Failed to load order history. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  // Status badge styling
  const getStatusStyle = (status) => {
    const styles = {
      pending: 'bg-yellow-100 text-yellow-800 border-yellow-300',
      confirmed: 'bg-blue-100 text-blue-800 border-blue-300',
      processing: 'bg-purple-100 text-purple-800 border-purple-300',
      shipped: 'bg-indigo-100 text-indigo-800 border-indigo-300',
      delivered: 'bg-green-100 text-green-800 border-green-300',
      completed: 'bg-green-100 text-green-800 border-green-300',
      cancelled: 'bg-red-100 text-red-800 border-red-300',
      refunded: 'bg-gray-100 text-gray-800 border-gray-300',
    }
    return styles[status] || 'bg-gray-100 text-gray-800 border-gray-300'
  }

  // Status icon
  const getStatusIcon = (status) => {
    const icons = {
      pending: <Clock size={16} />,
      confirmed: <CheckCircle size={16} />,
      processing: <Package size={16} />,
      shipped: <Truck size={16} />,
      delivered: <CheckCircle size={16} />,
      completed: <CheckCircle size={16} />,
      cancelled: <XCircle size={16} />,
      refunded: <AlertCircle size={16} />,
    }
    return icons[status] || <Clock size={16} />
  }

  // Toggle item expansion
  const toggleExpand = (id) => {
    setExpandedItems(prev => ({
      ...prev,
      [id]: !prev[id]
    }))
  }

  // Sort combined history
  const getSortedHistory = () => {
    let sorted = [...combinedHistory]

    // Sort
    sorted.sort((a, b) => {
      if (sortBy === 'date-desc') return b.date - a.date
      if (sortBy === 'date-asc') return a.date - b.date
      if (sortBy === 'amount-desc') return b.amount - a.amount
      if (sortBy === 'amount-asc') return a.amount - b.amount
      return 0
    })

    return sorted
  }

  const sortedHistory = getSortedHistory()

  return (
    <div className="min-h-screen py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-3">My Order History</h1>
          <p className="text-gray-600 text-lg">
            Viewing orders for: <span className="font-semibold text-purple-600">{user?.email}</span>
          </p>
          {userPhone && (
            <p className="text-gray-500 text-sm">Phone: {userPhone}</p>
          )}
        </div>

        {/* Loading State */}
        {isLoading && (
          <div className="bg-white rounded-2xl shadow-xl p-12 text-center">
            <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-purple-600 mx-auto mb-4"></div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">Loading Your Order History</h3>
            <p className="text-gray-500">Please wait while we fetch your orders...</p>
          </div>
        )}

        {/* Error State */}
        {!isLoading && error && (
          <div className="bg-white rounded-2xl shadow-xl p-12 text-center">
            <AlertCircle size={64} className="mx-auto text-red-400 mb-4" />
            <h3 className="text-xl font-semibold text-gray-900 mb-2">No Orders Found</h3>
            <p className="text-gray-500 mb-6">{error}</p>
            <button
              onClick={fetchOrderHistory}
              className="bg-purple-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-purple-700 transition-all"
            >
              Try Again
            </button>
          </div>
        )}

        {/* Results Section */}
        {!isLoading && combinedHistory.length > 0 && (
          <div className="bg-white rounded-2xl shadow-xl p-8">
            {/* Sort Dropdown */}
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold text-gray-900">Your Orders ({sortedHistory.length})</h2>
              <div className="flex items-center gap-2">
                <span className="text-sm text-gray-600">Sort by:</span>
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                >
                  <option value="date-desc">Newest First</option>
                  <option value="date-asc">Oldest First</option>
                  <option value="amount-desc">Highest Amount</option>
                  <option value="amount-asc">Lowest Amount</option>
                </select>
              </div>
            </div>

            {/* Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
              <div className="bg-gradient-to-br from-purple-50 to-purple-100 p-4 rounded-xl border border-purple-200">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-purple-600 font-medium">Total Orders</p>
                    <p className="text-2xl font-bold text-purple-900">{sortedHistory.length}</p>
                  </div>
                  <div className="w-12 h-12 bg-purple-500 rounded-full flex items-center justify-center">
                    <Package size={24} className="text-white" />
                  </div>
                </div>
              </div>

              <div className="bg-gradient-to-br from-green-50 to-green-100 p-4 rounded-xl border border-green-200">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-green-600 font-medium">Total Spent</p>
                    <p className="text-2xl font-bold text-green-900">
                      BDT {sortedHistory.reduce((sum, item) => sum + item.amount, 0).toLocaleString()}
                    </p>
                  </div>
                  <div className="w-12 h-12 bg-green-500 rounded-full flex items-center justify-center">
                    <DollarSign size={24} className="text-white" />
                  </div>
                </div>
              </div>

              <div className="bg-gradient-to-br from-blue-50 to-blue-100 p-4 rounded-xl border border-blue-200">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-blue-600 font-medium">Average Order</p>
                    <p className="text-2xl font-bold text-blue-900">
                      BDT {sortedHistory.length > 0 
                        ? (sortedHistory.reduce((sum, item) => sum + item.amount, 0) / sortedHistory.length).toFixed(0)
                        : 0}
                    </p>
                  </div>
                  <div className="w-12 h-12 bg-blue-500 rounded-full flex items-center justify-center">
                    <Package size={24} className="text-white" />
                  </div>
                </div>
              </div>
            </div>

            {/* Orders List */}
            <div className="space-y-4">
              {sortedHistory.map((item) => (
                <div
                  key={item.id}
                  className="border-2 border-gray-200 rounded-xl hover:border-purple-300 transition-all duration-200 overflow-hidden"
                >
                  {/* Order Header */}
                  <div
                    onClick={() => toggleExpand(item.id)}
                    className="p-6 cursor-pointer hover:bg-gray-50 transition-colors"
                  >
                    <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                            <Package size={20} className="text-blue-600" />
                          </div>
                          <div>
                            <h3 className="font-bold text-lg text-gray-900">{item.id}</h3>
                            <p className="text-sm text-gray-500">Online Order</p>
                          </div>
                        </div>

                        <div className="flex flex-wrap gap-4 text-sm text-gray-600 ml-13">
                          <div className="flex items-center gap-1">
                            <Calendar size={16} />
                            <span>{item.date.toLocaleDateString('en-US', { 
                              year: 'numeric', 
                              month: 'short', 
                              day: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit'
                            })}</span>
                          </div>
                          {item.availableBranches && item.availableBranches.length > 0 && (
                            <div className="flex items-center gap-1">
                              <MapPin size={16} />
                              <span className="capitalize">{item.availableBranches[0]}</span>
                            </div>
                          )}
                        </div>
                      </div>

                      <div className="flex flex-col md:flex-row items-start md:items-center gap-3">
                        <div className={`px-4 py-2 rounded-full border-2 flex items-center gap-2 ${getStatusStyle(item.status)}`}>
                          {getStatusIcon(item.status)}
                          <span className="font-semibold capitalize">{item.status}</span>
                        </div>

                        <div className="text-right">
                          <p className="text-sm text-gray-500">Total Amount</p>
                          <p className="text-xl font-bold text-gray-900">BDT {item.amount.toLocaleString()}</p>
                        </div>

                        <button className="text-purple-600 hover:text-purple-700 transition-colors">
                          {expandedItems[item.id] ? <ChevronUp size={24} /> : <ChevronDown size={24} />}
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Expanded Details */}
                  {expandedItems[item.id] && (
                    <div className="border-t-2 border-gray-200 bg-gray-50 p-6">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {/* Customer Info */}
                        <div>
                          <h4 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                            <Mail size={18} className="text-purple-600" />
                            Customer Information
                          </h4>
                          <div className="space-y-2 text-sm">
                            <p><span className="font-medium">Name:</span> {item.customerInfo?.fullName}</p>
                            <p><span className="font-medium">Email:</span> {item.customerInfo?.email}</p>
                            <p><span className="font-medium">Phone:</span> {item.customerInfo?.phone}</p>
                            <p><span className="font-medium">Address:</span> {item.customerInfo?.address}, {item.customerInfo?.city}</p>
                          </div>
                        </div>

                        {/* Payment Info */}
                        <div>
                          <h4 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                            <CreditCard size={18} className="text-purple-600" />
                            Payment Information
                          </h4>
                          <div className="space-y-2 text-sm">
                            <p><span className="font-medium">Method:</span> <span className="capitalize">{item.paymentInfo?.method}</span></p>
                            {item.totals && (
                              <>
                                <p><span className="font-medium">Subtotal:</span> BDT {item.totals.subtotal.toLocaleString()}</p>
                                {item.totals.deliveryCharge > 0 && (
                                  <p><span className="font-medium">Delivery:</span> BDT {item.totals.deliveryCharge.toLocaleString()}</p>
                                )}
                                <p className="font-bold text-lg pt-2 border-t">
                                  <span className="font-medium">Total:</span> BDT {item.totals.total.toLocaleString()}
                                </p>
                              </>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Items List */}
                      <div className="mt-6">
                        <h4 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                          <Package size={18} className="text-purple-600" />
                          Items ({item.items?.length || 0})
                        </h4>
                        <div className="space-y-2">
                          {item.items?.map((product, idx) => (
                            <div key={idx} className="flex justify-between items-center p-3 bg-white rounded-lg border border-gray-200">
                              <div className="flex-1">
                                <p className="font-medium text-gray-900">
                                  {product.product?.name}
                                </p>
                                <p className="text-sm text-gray-500">
                                  Quantity: {product.quantity} × BDT {product.product?.price.toLocaleString()}
                                </p>
                              </div>
                              <p className="font-bold text-gray-900">
                                BDT {product.itemTotal.toLocaleString()}
                              </p>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

// Wrap with PrivateRoute
export default function OrderHistoryPage() {
  return (
    <PrivateRoute>
      <OrderHistoryContent />
    </PrivateRoute>
  )
}
