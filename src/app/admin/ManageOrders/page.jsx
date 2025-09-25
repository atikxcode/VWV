'use client'

import React, { useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Search,
  Package,
  Eye,
  Trash2,
  ChevronLeft,
  ChevronRight,
  MoreHorizontal,
  RefreshCw,
  Calendar,
  User,
  MapPin,
  ChevronDown, 
  CreditCard,
  Truck,
  CheckCircle,
  XCircle,
  Clock,
  AlertCircle,
  Phone,
  Mail,
  Store,
  X,
  Settings,
  ExternalLink,
  Copy,
  Check,
} from 'lucide-react'
import Swal from 'sweetalert2'

const ORDER_STATUSES = [
  { value: 'pending', label: 'Pending', color: 'bg-amber-100 text-amber-800', icon: Clock },
  { value: 'confirmed', label: 'Confirmed', color: 'bg-blue-100 text-blue-800', icon: CheckCircle },
  { value: 'processing', label: 'Processing', color: 'bg-purple-100 text-purple-800', icon: Package },
  { value: 'shipped', label: 'Shipped', color: 'bg-indigo-100 text-indigo-800', icon: Truck },
  { value: 'delivered', label: 'Delivered', color: 'bg-green-100 text-green-800', icon: CheckCircle },
  { value: 'cancelled', label: 'Cancelled', color: 'bg-red-100 text-red-800', icon: XCircle },
  { value: 'refunded', label: 'Refunded', color: 'bg-gray-100 text-gray-800', icon: AlertCircle },
]

const ITEMS_PER_PAGE = 15

// Debounce hook for search
function useDebounce(value, delay) {
  const [debouncedValue, setDebouncedValue] = useState(value)
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value)
    }, delay)
    return () => {
      clearTimeout(handler)
    }
  }, [value, delay])
  return debouncedValue
}

export default function AdminManageOrdersPage() {
  const [orders, setOrders] = useState([])
  const [branches, setBranches] = useState([])
  const [loading, setLoading] = useState(true)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [error, setError] = useState(null)
  const [copiedOrderId, setCopiedOrderId] = useState(null)

  // Pagination and filters
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [totalOrders, setTotalOrders] = useState(0)
  const [filters, setFilters] = useState({
    status: '',
    branch: '',
    search: '',
    customerEmail: '',
  })

  const debouncedSearch = useDebounce(filters.search, 500)
  const debouncedEmail = useDebounce(filters.customerEmail, 500)

  // Enhanced Auth helpers with temp token support
  const getAuthHeaders = (bustCache = false) => {
    // First try to get the stored token
    let token = localStorage.getItem('auth-token')
    
    // For development only - if no token, use temp token
    if (!token && process.env.NODE_ENV === 'development') {
      token = 'temp-admin-token-for-development'
      console.warn('🔧 Using development temp token - ensure real auth is implemented for production')
    }
    
    if (!token) {
      throw new Error('No authentication token found')
    }

    const headers = {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    }
    
    if (bustCache) {
      headers['Cache-Control'] = 'no-cache, no-store, must-revalidate'
      headers['Pragma'] = 'no-cache'
      headers['Expires'] = '0'
    }
    
    return headers
  }

  const checkAuth = () => {
    const token = localStorage.getItem('auth-token')
    const userInfo = localStorage.getItem('user-info')
    
    // For development, allow temp token
    if (process.env.NODE_ENV === 'development' && !token) {
      console.warn('🔧 Development mode: using temp token')
      return true
    }
    
    if (!token) {
      console.error('❌ Authentication failed: Missing token')
      window.location.href = '/admin/login'
      return false
    }
    
    // If we have user info, check role
    if (userInfo) {
      try {
        const user = JSON.parse(userInfo)
        if (!['admin', 'moderator', 'manager'].includes(user.role)) {
          console.error('❌ Insufficient permissions:', user.role)
          window.location.href = '/admin/login'
          return false
        }
      } catch (error) {
        console.error('❌ Invalid user info stored')
        localStorage.removeItem('auth-token')
        localStorage.removeItem('user-info')
        window.location.href = '/admin/login'
        return false
      }
    }
    
    return true
  }

  // Load initial data
  useEffect(() => {
    if (!checkAuth()) return
    loadInitialData()
  }, [])

  const loadInitialData = async () => {
    try {
      setLoading(true)
      
      // Load branches with proper error handling
      try {
        const headers = getAuthHeaders()
        const branchesRes = await fetch('/api/branches', { headers })
        
        if (branchesRes.ok) {
          const branchesData = await branchesRes.json()
          setBranches(branchesData.branches || ['mirpur', 'bashundhara'])
        } else if (branchesRes.status === 401) {
          console.error('❌ Unauthorized access to branches API')
          if (process.env.NODE_ENV !== 'development') {
            window.location.href = '/admin/login'
            return
          }
          setBranches(['mirpur', 'bashundhara']) // Fallback for development
        } else {
          console.warn('⚠️ Branches API failed, using fallback')
          setBranches(['mirpur', 'bashundhara'])
        }
      } catch (authError) {
        console.error('❌ Error getting auth headers for branches:', authError.message)
        setBranches(['mirpur', 'bashundhara'])
      }

      // Load orders
      await fetchOrders()
    } catch (error) {
      console.error('Error loading initial data:', error)
      setBranches(['mirpur', 'bashundhara'])
      setError('Failed to load initial data. Please refresh the page.')
      setLoading(false)
    }
  }

  // Enhanced Fetch orders with better error handling
  const fetchOrders = useCallback(async (bustCache = false) => {
    if (!checkAuth()) return

    try {
      setLoading(true)
      setError(null)

      const params = new URLSearchParams({
        page: currentPage.toString(),
        limit: ITEMS_PER_PAGE.toString(),
      })

      if (filters.status) params.append('status', filters.status)
      if (filters.branch) params.append('branch', filters.branch.toLowerCase())
      if (debouncedSearch) params.append('orderId', debouncedSearch)
      if (debouncedEmail) params.append('customerEmail', debouncedEmail)
      
      if (bustCache) {
        params.append('_t', Date.now().toString())
      }

      console.log('🔍 Fetching orders with params:', Object.fromEntries(params))

      const headers = getAuthHeaders(bustCache)
      console.log('🔑 Request headers:', { 
        ...headers, 
        Authorization: headers.Authorization ? 'Bearer [TOKEN_PRESENT]' : 'MISSING' 
      })

      const response = await fetch(`/api/orders?${params}`, { headers })

      console.log('📡 Response status:', response.status)

      if (response.status === 401) {
        console.error('❌ Authentication failed - redirecting to login')
        localStorage.removeItem('auth-token')
        localStorage.removeItem('user-info')
        
        // For development, don't redirect immediately
        if (process.env.NODE_ENV === 'development') {
          setError('Authentication failed. Using development mode - check your backend token handling.')
          return
        } else {
          window.location.href = '/admin/login'
          return
        }
      }

      if (response.status === 403) {
        console.error('❌ Access forbidden - insufficient permissions')
        setError('Access denied. You do not have permission to view orders.')
        return
      }

      if (!response.ok) {
        const errorText = await response.text()
        console.error('❌ API Error:', response.status, errorText)
        
        try {
          const errorData = JSON.parse(errorText)
          throw new Error(errorData.error || `HTTP ${response.status}`)
        } catch {
          throw new Error(`HTTP ${response.status}: ${errorText}`)
        }
      }

      const data = await response.json()
      console.log('✅ Orders received:', {
        count: data.orders?.length || 0,
        pagination: data.pagination,
        permissions: data.userPermissions
      })
      
      setOrders(data.orders || [])
      setTotalPages(data.pagination?.totalPages || 1)
      setTotalOrders(data.pagination?.totalOrders || 0)

    } catch (error) {
      console.error('❌ Error fetching orders:', error)
      
      if (error.message.includes('No authentication token')) {
        if (process.env.NODE_ENV !== 'development') {
          window.location.href = '/admin/login'
          return
        }
      }
      
      setError(`Failed to load orders: ${error.message}`)
    } finally {
      setLoading(false)
      setIsRefreshing(false)
    }
  }, [currentPage, filters.status, filters.branch, debouncedSearch, debouncedEmail])

  // Effects for data fetching
  useEffect(() => {
    setCurrentPage(1)
    fetchOrders()
  }, [filters.status, filters.branch, debouncedSearch, debouncedEmail])

  useEffect(() => {
    fetchOrders()
  }, [currentPage])

  // Manual refresh
  const handleManualRefresh = async () => {
    setIsRefreshing(true)
    await fetchOrders(true)
    
    Swal.fire({
      icon: 'success',
      title: 'Refreshed!',
      text: 'Order data has been refreshed',
      timer: 1500,
      showConfirmButton: false,
      toast: true,
      position: 'top-end',
    })
  }

  // Copy order ID to clipboard
  const copyOrderId = async (orderId) => {
    try {
      await navigator.clipboard.writeText(orderId)
      setCopiedOrderId(orderId)
      setTimeout(() => setCopiedOrderId(null), 2000)
    } catch (err) {
      console.error('Failed to copy:', err)
    }
  }

  // Enhanced Update order status with better error handling
  const handleStatusUpdate = async (orderId, newStatus, currentStatus) => {
    if (newStatus === currentStatus) return

    // Show confirmation for critical status changes
    if (newStatus === 'cancelled' || newStatus === 'refunded') {
      const result = await Swal.fire({
        title: `${newStatus === 'cancelled' ? 'Cancel' : 'Refund'} Order?`,
        text: `Are you sure you want to ${newStatus} this order? This action will be logged.`,
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#ef4444',
        cancelButtonColor: '#6b7280',
        confirmButtonText: `Yes, ${newStatus} it!`,
        cancelButtonText: 'No, keep current status'
      })

      if (!result.isConfirmed) return
    }

    // Optimistic update
    const originalOrders = [...orders]
    setOrders(prev => prev.map(order => 
      order.orderId === orderId 
        ? { ...order, status: newStatus, updatedAt: new Date().toISOString() }
        : order
    ))

    try {
      const headers = getAuthHeaders()
      const response = await fetch('/api/orders', {
        method: 'PUT',
        headers,
        body: JSON.stringify({
          orderId,
          status: newStatus,
          notes: `Status changed from ${currentStatus} to ${newStatus} by admin`
        })
      })

      if (response.status === 401) {
        localStorage.removeItem('auth-token')
        localStorage.removeItem('user-info')
        if (process.env.NODE_ENV !== 'development') {
          window.location.href = '/admin/login'
          return
        }
        throw new Error('Authentication failed')
      }

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to update order status')
      }

      Swal.fire({
        icon: 'success',
        title: 'Status Updated!',
        text: `Order ${orderId} status changed to ${newStatus}`,
        timer: 2000,
        showConfirmButton: false,
        toast: true,
        position: 'top-end',
      })

    } catch (error) {
      // Revert optimistic update
      setOrders(originalOrders)
      
      Swal.fire({
        icon: 'error',
        title: 'Update Failed',
        text: error.message || 'Failed to update order status',
        confirmButtonColor: '#8B5CF6',
      })
    }
  }

  // Enhanced Delete/Cancel order
  const handleDeleteOrder = async (orderId) => {
    const result = await Swal.fire({
      title: 'Cancel Order?',
      text: 'This will cancel the order and notify the customer. This action cannot be undone!',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#d33',
      cancelButtonColor: '#3085d6',
      confirmButtonText: 'Yes, cancel it!',
      cancelButtonText: 'No, keep it'
    })

    if (result.isConfirmed) {
      try {
        const headers = getAuthHeaders()
        const response = await fetch(`/api/orders?orderId=${orderId}`, {
          method: 'DELETE',
          headers
        })

        if (response.status === 401) {
          localStorage.removeItem('auth-token')
          localStorage.removeItem('user-info')
          if (process.env.NODE_ENV !== 'development') {
            window.location.href = '/admin/login'
            return
          }
          throw new Error('Authentication failed')
        }

        if (!response.ok) {
          const errorData = await response.json()
          throw new Error(errorData.error || 'Failed to cancel order')
        }

        Swal.fire({
          icon: 'success',
          title: 'Order Cancelled!',
          text: 'The order has been cancelled successfully.',
          timer: 2000,
          showConfirmButton: false,
          toast: true,
          position: 'top-end',
        })

        // Refresh orders
        await fetchOrders(true)
      } catch (error) {
        Swal.fire({
          icon: 'error',
          title: 'Cancellation Failed',
          text: error.message || 'Failed to cancel order',
          confirmButtonColor: '#8B5CF6',
        })
      }
    }
  }

// Enhanced branch assignment with actual API call
const handleBranchAssignment = async (orderId, currentBranches) => {
  const { value: selectedBranches } = await Swal.fire({
    title: 'Assign Order to Branches',
    html: `
      <div style="text-align: left;">
        <p style="margin-bottom: 15px;">Select branches for order ${orderId}:</p>
        <div id="branch-checkboxes">
          ${branches.map(branch => `
            <label style="display: block; margin-bottom: 8px; cursor: pointer;">
              <input 
                type="checkbox" 
                value="${branch}" 
                ${currentBranches.includes(branch) ? 'checked' : ''}
                style="margin-right: 8px;"
              />
              <span style="text-transform: capitalize;">${branch}</span>
            </label>
          `).join('')}
        </div>
      </div>
    `,
    showCancelButton: true,
    confirmButtonText: 'Update Branches',
    cancelButtonText: 'Cancel',
    preConfirm: () => {
      const checkboxes = Swal.getPopup().querySelectorAll('input[type="checkbox"]:checked')
      const selected = Array.from(checkboxes).map(cb => cb.value)
      if (selected.length === 0) {
        Swal.showValidationMessage('Please select at least one branch')
        return false
      }
      return selected
    }
  })

  if (selectedBranches) {
    try {
      // Show loading
      Swal.fire({
        title: 'Updating Branches...',
        text: 'Please wait while we update the order branches.',
        allowOutsideClick: false,
        showConfirmButton: false,
        willOpen: () => {
          Swal.showLoading()
        }
      })

      // 🔥 ACTUAL API CALL to your backend
      const headers = getAuthHeaders()
      const response = await fetch('/api/orders', {
        method: 'PUT',
        headers,
        body: JSON.stringify({
          orderId,
          availableBranches: selectedBranches,
          notes: `Branches reassigned to: ${selectedBranches.join(', ')} by admin`
        })
      })

      console.log('Branch assignment response status:', response.status)

      if (response.status === 401) {
        localStorage.removeItem('auth-token')
        localStorage.removeItem('user-info')
        if (process.env.NODE_ENV !== 'development') {
          window.location.href = '/admin/login'
          return
        }
        throw new Error('Authentication failed')
      }

      if (!response.ok) {
        const errorData = await response.json()
        console.error('Branch assignment error:', errorData)
        throw new Error(errorData.error || 'Failed to update branch assignment')
      }

      const responseData = await response.json()
      console.log('Branch assignment success:', responseData)

      // Update local state with the response
      setOrders(prev => prev.map(order => 
        order.orderId === orderId 
          ? { 
              ...order, 
              availableBranches: selectedBranches, 
              updatedAt: new Date().toISOString(),
              // Also update items if your backend returns updated items
              items: order.items.map(item => ({
                ...item,
                availableBranches: selectedBranches
              }))
            }
          : order
      ))

      Swal.fire({
        icon: 'success',
        title: 'Branches Updated!',
        text: `Order ${orderId} assigned to: ${selectedBranches.join(', ')}`,
        timer: 2000,
        showConfirmButton: false,
        toast: true,
        position: 'top-end',
      })

    } catch (error) {
      console.error('Branch assignment error:', error)
      Swal.fire({
        icon: 'error',
        title: 'Update Failed',
        text: error.message || 'Failed to update branch assignment',
        confirmButtonColor: '#8B5CF6',
      })
    }
  }
}


  // Enhanced view order details with product images
  const viewOrderDetails = (order) => {
    const orderItems = order.items?.map(item => `
      <div style="display: flex; gap: 15px; border-bottom: 1px solid #e5e7eb; padding: 15px 0; align-items: center;">
        <div style="width: 80px; height: 80px; border-radius: 8px; overflow: hidden; flex-shrink: 0; background: #f3f4f6;">
          ${item.product?.images && item.product.images.length > 0 ? `
            <img 
              src="${item.product.images[0].url}" 
              alt="${item.product.name || 'Product'}"
              style="width: 100%; height: 100%; object-fit: cover;"
            />
          ` : `
            <div style="width: 100%; height: 100%; display: flex; align-items: center; justify-content: center; color: #9ca3af;">
              <svg width="24" height="24" fill="currentColor" viewBox="0 0 24 24">
                <path d="M20 6h-2.18l-1.64-2.46A1 1 0 0 0 15.36 3H8.64a1 1 0 0 0-.82.54L6.18 6H4c-1.1 0-2 .9-2 2v10c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V8c0-1.1-.9-2-2-2zM12 17c-2.76 0-5-2.24-5-5s2.24-5 5-5 5 2.24 5 5-2.24 5-5 5z"/>
              </svg>
            </div>
          `}
        </div>
        <div style="flex-grow: 1;">
          <div style="font-weight: 600; margin-bottom: 4px;">${item.product?.name || 'Unknown Product'}</div>
          <div style="color: #6b7280; font-size: 14px; margin-bottom: 8px;">
            ${item.product?.category || ''} ${item.product?.subcategory ? `• ${item.product.subcategory}` : ''}
          </div>
          <div style="display: flex; justify-content: space-between; align-items: center;">
            <span style="color: #6b7280; font-size: 14px;">
              Quantity: ${item.quantity} × ৳${item.product?.price || 0}
            </span>
            <span style="font-weight: 600; color: #8b5cf6;">৳${item.itemTotal || 0}</span>
          </div>
          ${item.availableBranches?.length ? `
            <div style="margin-top: 8px;">
              ${item.availableBranches.map(branch => `
                <span style="background: #ddd6fe; color: #7c3aed; padding: 2px 8px; border-radius: 12px; font-size: 12px; margin-right: 4px;">
                  ${branch}
                </span>
              `).join('')}
            </div>
          ` : ''}
        </div>
      </div>
    `).join('') || '<p>No items found</p>'

    const orderHistory = order.orderHistory?.map(history => `
      <div style="border-left: 3px solid #8B5CF6; padding-left: 12px; margin: 8px 0; background: #faf9ff; padding: 12px; border-radius: 6px;">
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 4px;">
          <strong style="color: #8b5cf6; text-transform: capitalize;">${history.status}</strong>
          <small style="color: #6b7280;">${new Date(history.timestamp).toLocaleString()}</small>
        </div>
        <div style="color: #4b5563; font-size: 14px;">${history.note}</div>
      </div>
    `).join('') || '<p>No history available</p>'

    Swal.fire({
      title: `<div style="display: flex; align-items: center; gap: 10px;">
        <span>Order Details: ${order.orderId}</span>
        <button onclick="navigator.clipboard.writeText('${order.orderId}')" style="background: #e5e7eb; border: none; padding: 4px 8px; border-radius: 4px; cursor: pointer;" title="Copy Order ID">
          📋
        </button>
      </div>`,
      html: `
        <div style="text-align: left; max-height: 600px; overflow-y: auto;">
          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 25px; margin-bottom: 25px;">
            <div style="background: #f8fafc; padding: 20px; border-radius: 12px;">
              <h4 style="color: #8B5CF6; margin: 0 0 15px 0; display: flex; align-items: center; gap: 8px;">
                <svg width="18" height="18" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 2C13.1 2 14 2.9 14 4C14 5.1 13.1 6 12 6C10.9 6 10 5.1 10 4C10 2.9 10.9 2 12 2ZM21 9V7L15 1H5C3.89 1 3 1.89 3 3V7H9V9H3V19C3 20.1 3.9 21 5 21H19C20.1 21 21 20.1 21 19V9H21ZM7 15V17H9V15H7ZM15 15V17H17V15H15Z"/>
                </svg>
                Customer Information
              </h4>
              <div style="space-y: 8px;">
                <p style="margin: 8px 0;"><strong>Name:</strong> ${order.customerInfo?.fullName || 'N/A'}</p>
                <p style="margin: 8px 0;"><strong>Email:</strong> ${order.customerInfo?.email || 'N/A'}</p>
                <p style="margin: 8px 0;"><strong>Phone:</strong> ${order.customerInfo?.phone || 'N/A'}</p>
                <p style="margin: 8px 0;"><strong>Address:</strong> ${order.customerInfo?.address || 'N/A'}</p>
                <p style="margin: 8px 0;"><strong>City:</strong> ${order.customerInfo?.city || 'N/A'}, ${order.customerInfo?.country || 'Bangladesh'}</p>
              </div>
            </div>
            <div style="background: #f0f9ff; padding: 20px; border-radius: 12px;">
              <h4 style="color: #0369a1; margin: 0 0 15px 0; display: flex; align-items: center; gap: 8px;">
                <svg width="18" height="18" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M19 3H5C3.9 3 3 3.9 3 5V19C3 20.1 3.9 21 5 21H19C20.1 21 21 20.1 21 19V5C21 3.9 20.1 3 19 3ZM19 19H5V8H19V19ZM7 10V12H17V10H7Z"/>
                </svg>
                Order Information
              </h4>
              <div style="space-y: 8px;">
                <p style="margin: 8px 0;"><strong>Order ID:</strong> ${order.orderId}</p>
                <p style="margin: 8px 0;"><strong>Status:</strong> <span style="background: #e5e7eb; padding: 4px 8px; border-radius: 6px; font-size: 12px; text-transform: capitalize;">${order.status}</span></p>
                <p style="margin: 8px 0;"><strong>Created:</strong> ${new Date(order.createdAt).toLocaleString()}</p>
                <p style="margin: 8px 0;"><strong>Updated:</strong> ${new Date(order.updatedAt).toLocaleString()}</p>
                <p style="margin: 8px 0;"><strong>Type:</strong> <span style="text-transform: capitalize;">${order.orderType || 'Unknown'}</span></p>
                <p style="margin: 8px 0;"><strong>Branches:</strong> ${order.availableBranches?.map(branch => `<span style="background: #ddd6fe; color: #7c3aed; padding: 2px 6px; border-radius: 8px; font-size: 11px; margin-right: 4px;">${branch}</span>`).join('') || 'None'}</p>
              </div>
            </div>
          </div>
          
          <div style="background: #f0fdf4; padding: 20px; border-radius: 12px; margin-bottom: 25px;">
            <h4 style="color: #166534; margin: 0 0 15px 0; display: flex; align-items: center; gap: 8px;">
              <svg width="18" height="18" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 2C6.48 2 2 6.48 2 12S6.48 22 12 22 22 17.52 22 12 17.52 2 12 2ZM13.5 6L10 10.5 9.5 10 8 11.5 10 13.5 15 8.5 13.5 6Z"/>
              </svg>
              Payment Information
            </h4>
            <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(150px, 1fr)); gap: 15px;">
              <div><strong>Method:</strong> <span style="text-transform: capitalize;">${order.paymentInfo?.method || 'N/A'}</span></div>
              <div><strong>Subtotal:</strong> <span style="color: #059669;">৳${order.totals?.subtotal?.toFixed(2) || '0.00'}</span></div>
              <div><strong>Delivery:</strong> <span style="color: #dc2626;">৳${order.totals?.deliveryCharge?.toFixed(2) || '0.00'}</span></div>
              <div><strong>Total:</strong> <strong style="color: #8B5CF6; font-size: 16px;">৳${order.totals?.total?.toFixed(2) || '0.00'}</strong></div>
            </div>
          </div>

          <div style="margin-bottom: 25px;">
            <h4 style="color: #8B5CF6; margin: 0 0 15px 0; display: flex; align-items: center; gap: 8px;">
              <svg width="18" height="18" fill="currentColor" viewBox="0 0 24 24">
                <path d="M7 4V2C7 1.45 7.45 1 8 1S9 1.45 9 2V4H15V2C15 1.45 15.45 1 16 1S17 1.45 17 2V4H20C21.1 4 22 4.9 22 6V20C22 21.1 21.1 22 20 22H4C2.9 22 2 21.1 2 20V6C2 4.9 2.9 4 4 4H7ZM20 8H4V20H20V8Z"/>
              </svg>
              Order Items (${order.items?.length || 0})
            </h4>
            <div style="max-height: 300px; overflow-y: auto;">
              ${orderItems}
            </div>
          </div>

          ${order.orderNotes ? `
            <div style="background: #fffbeb; padding: 20px; border-radius: 12px; margin-bottom: 25px; border-left: 4px solid #f59e0b;">
              <h4 style="color: #92400e; margin: 0 0 10px 0; display: flex; align-items: center; gap: 8px;">
                <svg width="18" height="18" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M14,2H6A2,2 0 0,0 4,4V20A2,2 0 0,0 6,22H18A2,2 0 0,0 20,20V8L14,2M18,20H6V4H13V9H18V20Z"/>
                </svg>
                Order Notes
              </h4>
              <p style="margin: 0; color: #78350f; background: white; padding: 12px; border-radius: 6px;">${order.orderNotes}</p>
            </div>
          ` : ''}

          <div>
            <h4 style="color: #8B5CF6; margin: 0 0 15px 0; display: flex; align-items: center; gap: 8px;">
              <svg width="18" height="18" fill="currentColor" viewBox="0 0 24 24">
                <path d="M13.5,8H12V13L16.28,15.54L17,14.33L13.5,12.25V8M13,3A9,9 0 0,0 4,12H1L4.96,16.03L9,12H6A7,7 0 0,1 13,5A7,7 0 0,1 20,12A7,7 0 0,1 13,19C11.07,19 9.32,18.21 8.06,16.94L6.64,18.36C8.27,20 10.5,21 13,21A9,9 0 0,0 22,12A9,9 0 0,0 13,3Z"/>
              </svg>
              Order History
            </h4>
            <div style="max-height: 250px; overflow-y: auto;">
              ${orderHistory}
            </div>
          </div>
        </div>
      `,
      width: 900,
      showCloseButton: true,
      showConfirmButton: false,
      customClass: {
        popup: 'swal-wide'
      }
    })
  }

  // Filter handling
  const handleFilterChange = (e) => {
    const { name, value } = e.target
    setFilters(prev => ({ ...prev, [name]: value }))
  }

  const clearFilters = () => {
    setFilters({
      status: '',
      branch: '',
      search: '',
      customerEmail: '',
    })
  }

  // Get status configuration
  const getStatusConfig = (status) => {
    return ORDER_STATUSES.find(s => s.value === status) || ORDER_STATUSES[0]
  }

  // Generate page numbers
  const generatePageNumbers = () => {
    const pageNumbers = []
    const maxVisiblePages = 5
    
    if (totalPages <= maxVisiblePages) {
      for (let i = 1; i <= totalPages; i++) {
        pageNumbers.push(i)
      }
    } else {
      if (currentPage <= 3) {
        for (let i = 1; i <= 4; i++) pageNumbers.push(i)
        if (totalPages > 5) pageNumbers.push('ellipsis')
        pageNumbers.push(totalPages)
      } else if (currentPage >= totalPages - 2) {
        pageNumbers.push(1)
        if (totalPages > 5) pageNumbers.push('ellipsis')
        for (let i = totalPages - 3; i <= totalPages; i++) pageNumbers.push(i)
      } else {
        pageNumbers.push(1)
        pageNumbers.push('ellipsis')
        for (let i = currentPage - 1; i <= currentPage + 1; i++) pageNumbers.push(i)
        pageNumbers.push('ellipsis')
        pageNumbers.push(totalPages)
      }
    }
    
    return pageNumbers
  }

  const goToPage = (pageNumber) => {
    if (pageNumber >= 1 && pageNumber <= totalPages) {
      setCurrentPage(pageNumber)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-blue-50 to-indigo-100 p-4">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <div className="flex justify-between items-start">
            <div>
              <h1 className="text-4xl font-bold text-gray-900 mb-2 flex items-center gap-3">
                <div className="p-2 bg-purple-100 rounded-xl">
                  <Package className="text-purple-600" size={40} />
                </div>
                Order Management
                <span className="text-sm bg-purple-100 text-purple-800 px-3 py-1 rounded-full font-medium">
                  Administrator
                </span>
              </h1>
              <p className="text-gray-600 flex items-center gap-2">
                <span>Manage all customer orders</span>
                <span className="w-1 h-1 bg-gray-400 rounded-full"></span>
                <span className="font-semibold text-purple-600">{totalOrders} total orders</span>
              </p>
            </div>
            
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={handleManualRefresh}
              disabled={isRefreshing || loading}
              className="flex items-center gap-2 px-6 py-3 bg-white text-purple-600 rounded-xl shadow-lg hover:bg-purple-50 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed border border-purple-100"
            >
              <RefreshCw size={20} className={isRefreshing ? 'animate-spin' : ''} />
              {isRefreshing ? 'Refreshing...' : 'Refresh'}
            </motion.button>
          </div>
        </motion.div>

        {/* Enhanced Filters */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl border border-white/50 p-6 mb-8"
        >
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
            {/* Search by Order ID */}
            <div className="relative group">
              <Search size={20} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 group-hover:text-purple-500 transition-colors" />
              <input
                type="text"
                name="search"
                placeholder="Search by Order ID..."
                value={filters.search}
                onChange={handleFilterChange}
                className="w-full pl-10 pr-4 py-3 rounded-xl border-2 border-gray-200 focus:border-purple-500 focus:ring-4 focus:ring-purple-500/10 outline-none transition-all duration-200 bg-white/70"
              />
            </div>

            {/* Search by Customer Email */}
            <div className="relative group">
              <Mail size={20} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 group-hover:text-purple-500 transition-colors" />
              <input
                type="text"
                name="customerEmail"
                placeholder="Search by Customer Email..."
                value={filters.customerEmail}
                onChange={handleFilterChange}
                className="w-full pl-10 pr-4 py-3 rounded-xl border-2 border-gray-200 focus:border-purple-500 focus:ring-4 focus:ring-purple-500/10 outline-none transition-all duration-200 bg-white/70"
              />
            </div>

            {/* Enhanced Status Filter */}
            <div className="relative">
              <select
                name="status"
                value={filters.status}
                onChange={handleFilterChange}
                className="w-full p-3 rounded-xl border-2 border-gray-200 focus:border-purple-500 focus:ring-4 focus:ring-purple-500/10 outline-none transition-all duration-200 bg-white/70 appearance-none cursor-pointer"
              >
                <option value="">All Statuses</option>
                {ORDER_STATUSES.map((status) => (
                  <option key={status.value} value={status.value}>
                    {status.label}
                  </option>
                ))}
              </select>
              <ChevronDown size={20} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
            </div>

            {/* Enhanced Branch Filter */}
            <div className="relative">
              <select
                name="branch"
                value={filters.branch}
                onChange={handleFilterChange}
                className="w-full p-3 rounded-xl border-2 border-gray-200 focus:border-purple-500 focus:ring-4 focus:ring-purple-500/10 outline-none transition-all duration-200 bg-white/70 appearance-none cursor-pointer"
              >
                <option value="">All Branches</option>
                {branches.map((branch) => (
                  <option key={branch} value={branch}>
                    {branch.charAt(0).toUpperCase() + branch.slice(1)}
                  </option>
                ))}
              </select>
              <ChevronDown size={20} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
            </div>
          </div>

          <div className="flex justify-between items-center pt-4 border-t border-gray-100">
            <div className="text-sm text-gray-600 flex items-center gap-2">
              <div className="w-2 h-2 bg-purple-400 rounded-full animate-pulse"></div>
              Showing {orders.length} of {totalOrders} orders
            </div>

            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={clearFilters}
              className="flex items-center gap-2 px-4 py-2 text-purple-600 hover:text-purple-700 hover:bg-purple-50 rounded-lg font-medium transition-all duration-200"
            >
              <X size={16} />
              Clear All Filters
            </motion.button>
          </div>
        </motion.div>

        {/* Enhanced Orders Display */}
        <AnimatePresence mode="wait">
          {loading ? (
            <motion.div
              key="loading"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex flex-col items-center justify-center py-20 bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl"
            >
              <div className="relative">
                <div className="animate-spin rounded-full h-16 w-16 border-4 border-purple-200"></div>
                <div className="animate-spin rounded-full h-16 w-16 border-4 border-purple-600 border-t-transparent absolute top-0 left-0"></div>
              </div>
              <p className="mt-4 text-gray-600 font-medium">Loading orders...</p>
            </motion.div>
          ) : error ? (
            <motion.div
              key="error"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="text-center py-16 bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl border-2 border-red-100"
            >
              <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <AlertCircle size={40} className="text-red-500" />
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-3">Error Loading Orders</h3>
              <p className="text-gray-600 mb-6 max-w-md mx-auto">{error}</p>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => fetchOrders(true)}
                className="px-6 py-3 bg-red-600 text-white rounded-xl hover:bg-red-700 transition-colors font-medium"
              >
                Try Again
              </motion.button>
            </motion.div>
          ) : orders.length === 0 ? (
            <motion.div
              key="empty"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="text-center py-16 bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl"
            >
              <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <Package size={40} className="text-gray-400" />
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-3">No Orders Found</h3>
              <p className="text-gray-600 max-w-md mx-auto">
                {Object.values(filters).some(f => f) 
                  ? 'Try adjusting your filters to see more orders.'
                  : 'No orders have been placed yet.'}
              </p>
            </motion.div>
          ) : (
            <motion.div
              key="orders"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl border border-white/50 overflow-hidden"
            >
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-gradient-to-r from-gray-50 to-gray-100 border-b border-gray-200">
                    <tr>
                      <th className="px-6 py-4 text-left font-bold text-gray-800">Order Details</th>
                      <th className="px-6 py-4 text-left font-bold text-gray-800">Customer</th>
                      <th className="px-6 py-4 text-left font-bold text-gray-800">Branches</th>
                      <th className="px-6 py-4 text-left font-bold text-gray-800">Total</th>
                      <th className="px-6 py-4 text-left font-bold text-gray-800">Status</th>
                      <th className="px-6 py-4 text-left font-bold text-gray-800">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {orders.map((order, index) => {
                      const statusConfig = getStatusConfig(order.status)
                      const IconComponent = statusConfig.icon
                      
                      return (
                        <motion.tr
                          key={order._id}
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: index * 0.05 }}
                          className="hover:bg-gradient-to-r hover:from-purple-50/50 hover:to-blue-50/50 transition-all duration-200 group"
                        >
                          <td className="px-6 py-5">
                            <div className="space-y-2">
                              <div className="flex items-center gap-2">
                                <span className="font-mono text-gray-800 font-bold text-base">
                                  {order.orderId}
                                </span>
                                <motion.button
                                  whileHover={{ scale: 1.1 }}
                                  whileTap={{ scale: 0.9 }}
                                  onClick={() => copyOrderId(order.orderId)}
                                  className="p-1 hover:bg-purple-100 rounded transition-colors"
                                  title="Copy Order ID"
                                >
                                  {copiedOrderId === order.orderId ? (
                                    <Check size={14} className="text-green-500" />
                                  ) : (
                                    <Copy size={14} className="text-gray-400" />
                                  )}
                                </motion.button>
                              </div>
                              <div className="flex items-center gap-2 text-xs text-gray-500">
                                <Calendar size={12} />
                                <span>{new Date(order.createdAt).toLocaleDateString()}</span>
                                <span>•</span>
                                <span>{new Date(order.createdAt).toLocaleTimeString()}</span>
                              </div>
                              <div className="flex items-center gap-2 text-xs text-gray-500">
                                <Package size={12} />
                                <span>{order.items?.length || 0} items</span>
                                <span>•</span>
                                <span className="capitalize px-2 py-1 bg-gray-100 rounded-md font-medium">
                                  {order.orderType || 'unknown'}
                                </span>
                              </div>
                            </div>
                          </td>

                          <td className="px-6 py-5">
                            <div className="space-y-2">
                              <div className="font-semibold text-gray-800 flex items-center gap-2">
                                <User size={14} className="text-gray-400" />
                                {order.customerInfo?.fullName || 'N/A'}
                              </div>
                              <div className="flex items-center gap-2 text-xs text-gray-500">
                                <Mail size={12} />
                                <span className="truncate max-w-[200px]">
                                  {order.customerInfo?.email || 'N/A'}
                                </span>
                              </div>
                              {order.customerInfo?.phone && (
                                <div className="flex items-center gap-2 text-xs text-gray-500">
                                  <Phone size={12} />
                                  <span>{order.customerInfo.phone}</span>
                                </div>
                              )}
                            </div>
                          </td>

                          <td className="px-6 py-5">
                            <div className="flex flex-wrap gap-1">
                              {order.availableBranches?.map((branch) => (
                                <motion.span
                                  key={branch}
                                  whileHover={{ scale: 1.05 }}
                                  className="inline-flex items-center gap-1 px-3 py-1 bg-gradient-to-r from-blue-100 to-indigo-100 text-blue-800 rounded-lg text-xs font-semibold cursor-pointer"
                                >
                                  <Store size={10} />
                                  {branch.charAt(0).toUpperCase() + branch.slice(1)}
                                </motion.span>
                              )) || (
                                <span className="text-xs text-gray-400 italic">No branches</span>
                              )}
                            </div>
                            <motion.button
                              whileHover={{ scale: 1.02 }}
                              onClick={() => handleBranchAssignment(order.orderId, order.availableBranches || [])}
                              className="mt-2 text-xs text-purple-600 hover:text-purple-700 font-medium flex items-center gap-1"
                            >
                              <Settings size={10} />
                              Reassign
                            </motion.button>
                          </td>

                          <td className="px-6 py-5">
                            <div className="space-y-1">
                              <div className="text-2xl font-bold text-purple-600">
                                ৳{order.totals?.total?.toFixed(2) || '0.00'}
                              </div>
                              {order.totals?.deliveryCharge > 0 && (
                                <div className="text-xs text-orange-600 font-medium">
                                  + ৳{order.totals.deliveryCharge.toFixed(2)} delivery
                                </div>
                              )}
                              <div className="flex items-center gap-1 text-xs text-gray-500">
                                <CreditCard size={10} />
                                <span className="capitalize">
                                  {order.paymentInfo?.method || 'Unknown'}
                                </span>
                              </div>
                            </div>
                          </td>

                          <td className="px-6 py-5">
                            <div className="space-y-3">
                              <motion.div
                                whileHover={{ scale: 1.02 }}
                                className={`inline-flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-bold ${statusConfig.color} shadow-sm`}
                              >
                                <IconComponent size={14} />
                                {statusConfig.label}
                              </motion.div>
                              
                              <div className="relative">
                                <select
                                  value={order.status}
                                  onChange={(e) => handleStatusUpdate(order.orderId, e.target.value, order.status)}
                                  className="w-full text-xs border-2 border-gray-200 rounded-lg shadow-sm focus:ring-2 focus:ring-purple-500 focus:border-purple-500 px-3 py-2 font-medium bg-white/90 hover:bg-white transition-all duration-200 appearance-none cursor-pointer"
                                >
                                  {ORDER_STATUSES.map((status) => (
                                    <option key={status.value} value={status.value}>
                                      {status.label}
                                    </option>
                                  ))}
                                </select>
                                <ChevronDown size={14} className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                              </div>
                            </div>
                          </td>

                          <td className="px-6 py-5">
                            <div className="flex gap-2">
                              <motion.button
                                whileHover={{ scale: 1.05, y: -1 }}
                                whileTap={{ scale: 0.95 }}
                                onClick={() => viewOrderDetails(order)}
                                className="px-4 py-2 bg-gradient-to-r from-blue-500 to-indigo-600 text-white rounded-lg hover:shadow-lg flex items-center gap-2 text-sm font-medium transition-all duration-200"
                                title="View Full Details"
                              >
                                <Eye size={14} />
                                View
                              </motion.button>
                              
                              <motion.button
                                whileHover={{ scale: 1.05, y: -1 }}
                                whileTap={{ scale: 0.95 }}
                                onClick={() => handleDeleteOrder(order.orderId)}
                                className="px-4 py-2 bg-gradient-to-r from-red-500 to-red-600 text-white rounded-lg hover:shadow-lg transition-all duration-200"
                                title="Cancel Order"
                              >
                                <Trash2 size={14} />
                              </motion.button>
                            </div>
                          </td>
                        </motion.tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Enhanced Pagination */}
        {totalPages > 1 && !loading && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl border border-white/50 p-6 mt-8"
          >
            <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
              <div className="text-sm text-gray-600 flex items-center gap-2">
                <div className="w-2 h-2 bg-purple-400 rounded-full"></div>
                Showing {((currentPage - 1) * ITEMS_PER_PAGE) + 1} to{' '}
                {Math.min(currentPage * ITEMS_PER_PAGE, totalOrders)} of{' '}
                <span className="font-bold text-purple-600">{totalOrders}</span> orders
              </div>

              <div className="flex items-center gap-1">
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => goToPage(1)}
                  disabled={currentPage === 1}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border-2 border-gray-200 rounded-l-xl hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
                >
                  First
                </motion.button>

                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => goToPage(currentPage - 1)}
                  disabled={currentPage === 1}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border-t-2 border-b-2 border-gray-200 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 flex items-center gap-1"
                >
                  <ChevronLeft size={16} />
                  Prev
                </motion.button>

                {generatePageNumbers().map((pageNum, index) => (
                  <motion.button
                    key={index}
                    whileHover={pageNum !== 'ellipsis' && pageNum !== currentPage ? { scale: 1.05 } : {}}
                    whileTap={pageNum !== 'ellipsis' && pageNum !== currentPage ? { scale: 0.95 } : {}}
                    onClick={() => pageNum !== 'ellipsis' && goToPage(pageNum)}
                    disabled={pageNum === 'ellipsis' || pageNum === currentPage}
                    className={`px-4 py-2 text-sm font-medium border-t-2 border-b-2 border-gray-200 transition-all duration-200 ${
                      pageNum === currentPage
                        ? 'bg-gradient-to-r from-purple-500 to-indigo-600 text-white border-purple-500 shadow-lg'
                        : pageNum === 'ellipsis'
                        ? 'bg-white text-gray-400 cursor-not-allowed'
                        : 'bg-white text-gray-700 hover:bg-gray-50'
                    }`}
                  >
                    {pageNum === 'ellipsis' ? <MoreHorizontal size={16} /> : pageNum}
                  </motion.button>
                ))}

                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => goToPage(currentPage + 1)}
                  disabled={currentPage === totalPages}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border-t-2 border-b-2 border-gray-200 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 flex items-center gap-1"
                >
                  Next
                  <ChevronRight size={16} />
                </motion.button>

                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => goToPage(totalPages)}
                  disabled={currentPage === totalPages}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border-2 border-gray-200 rounded-r-xl hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
                >
                  Last
                </motion.button>
              </div>

              <div className="text-sm text-gray-600 font-medium">
                {ITEMS_PER_PAGE} per page
              </div>
            </div>
          </motion.div>
        )}
      </div>
    </div>
  )
}
