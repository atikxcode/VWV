'use client'

import { useState, useEffect } from 'react'
import { 
  CheckCircle, 
  XCircle, 
  Clock, 
  Truck, 
  Package, 
  Eye,
  Download,
  AlertCircle,
  ArrowUpRight,
  Search,
  BarChart3,
  Edit2,
  Check,
  X
} from 'lucide-react'
import Swal from 'sweetalert2'

export default function AdminRequisitionsPage() {
  const [requisitions, setRequisitions] = useState([])
  const [filteredRequisitions, setFilteredRequisitions] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [statusFilter, setStatusFilter] = useState('all')
  const [branchFilter, setBranchFilter] = useState('all')
  const [searchQuery, setSearchQuery] = useState('')
  const [dateRange, setDateRange] = useState('all')
  const [selectedRequisition, setSelectedRequisition] = useState(null)
  const [showDetailsModal, setShowDetailsModal] = useState(false)
  const [showApprovalModal, setShowApprovalModal] = useState(false)
  const [approvalQuantities, setApprovalQuantities] = useState({})
  const [deliveryDate, setDeliveryDate] = useState('')

  // Load requisitions on mount
  useEffect(() => {
    fetchRequisitions()
  }, [])

  // Filter requisitions
  useEffect(() => {
    let filtered = requisitions

    if (statusFilter !== 'all') {
      filtered = filtered.filter(req => req.status === statusFilter)
    }

    if (branchFilter !== 'all') {
      filtered = filtered.filter(req => 
        req.sourceBranch === branchFilter || req.destinationBranch === branchFilter
      )
    }

    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase()
      filtered = filtered.filter(req =>
        req.requisitionNumber.toLowerCase().includes(query) ||
        req.requestedBy.name.toLowerCase().includes(query) ||
        req.requestedBy.email.toLowerCase().includes(query) ||
        req.items.some(item => item.productName.toLowerCase().includes(query))
      )
    }

    if (dateRange !== 'all') {
      const now = new Date()
      filtered = filtered.filter(req => {
        const reqDate = new Date(req.createdAt)
        const diffDays = Math.floor((now - reqDate) / (1000 * 60 * 60 * 24))
        
        switch(dateRange) {
          case 'today':
            return diffDays === 0
          case 'week':
            return diffDays <= 7
          case 'month':
            return diffDays <= 30
          default:
            return true
        }
      })
    }

    setFilteredRequisitions(filtered)
  }, [requisitions, statusFilter, branchFilter, searchQuery, dateRange])

  // Fetch requisitions
  const fetchRequisitions = async () => {
    setIsLoading(true)
    try {
      const token = localStorage.getItem('auth-token')
      const response = await fetch('/api/requisitions?limit=500', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      })

      if (response.ok) {
        const data = await response.json()
        setRequisitions(data.requisitions || [])
        setFilteredRequisitions(data.requisitions || [])
      }
    } catch (error) {
      console.error('Error fetching requisitions:', error)
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: 'Failed to load requisitions.',
        confirmButtonColor: '#7c3aed',
      })
    } finally {
      setIsLoading(false)
    }
  }

  // View requisition details
  const handleViewDetails = (requisition) => {
    setSelectedRequisition(requisition)
    setShowDetailsModal(true)
  }

  // Open approval modal with product details
  const handleOpenApproval = (requisition) => {
    setSelectedRequisition(requisition)
    // Initialize approval quantities with requested quantities
    const quantities = {}
    requisition.items.forEach((item, idx) => {
      quantities[idx] = item.requestedQty
    })
    setApprovalQuantities(quantities)
    setShowApprovalModal(true)
  }

  // Update approval quantity for specific product
  const handleUpdateApprovalQty = (index, value) => {
    const numValue = parseInt(value) || 0
    setApprovalQuantities({
      ...approvalQuantities,
      [index]: numValue
    })
  }

  // Approve requisition with custom quantities
  const handleApprove = async () => {
    // Validate that at least one item has quantity > 0
    const hasValidQty = Object.values(approvalQuantities).some(qty => qty > 0)
    
    if (!hasValidQty) {
      Swal.fire({
        icon: 'warning',
        title: 'No Items to Transfer',
        text: 'Please approve at least one item with quantity greater than 0.',
        confirmButtonColor: '#7c3aed',
      })
      return
    }

    try {
      const token = localStorage.getItem('auth-token')
      const response = await fetch('/api/requisitions', {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          requisitionId: selectedRequisition._id,
          action: 'approve',
          approvedQuantities: Object.values(approvalQuantities),
          deliveryDate: deliveryDate || null
        })
      })

      if (response.ok) {
        Swal.fire({
          icon: 'success',
          title: 'Approved!',
          text: 'Requisition has been approved with custom quantities.',
          confirmButtonColor: '#7c3aed',
        })
        setShowApprovalModal(false)
        setSelectedRequisition(null)
        setApprovalQuantities({})
        setDeliveryDate('')
        await fetchRequisitions()
      } else {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to approve requisition')
      }
    } catch (error) {
      console.error('Error approving:', error)
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: error.message || 'Failed to approve requisition.',
        confirmButtonColor: '#7c3aed',
      })
    }
  }

  // Reject requisition
  const handleReject = async (requisitionId) => {
    const result = await Swal.fire({
      title: 'Reject Requisition',
      input: 'textarea',
      inputLabel: 'Rejection Reason',
      inputPlaceholder: 'Enter detailed reason for rejection...',
      showCancelButton: true,
      confirmButtonColor: '#dc2626',
      cancelButtonColor: '#6b7280',
      confirmButtonText: 'Reject',
      inputValidator: (value) => {
        if (!value) return 'Rejection reason is required'
      }
    })

    if (!result.isConfirmed) return

    try {
      const token = localStorage.getItem('auth-token')
      const response = await fetch('/api/requisitions', {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          requisitionId,
          action: 'reject',
          rejectionReason: result.value
        })
      })

      if (response.ok) {
        Swal.fire({
          icon: 'success',
          title: 'Rejected',
          text: 'Requisition has been rejected.',
          confirmButtonColor: '#7c3aed',
        })
        await fetchRequisitions()
      }
    } catch (error) {
      console.error('Error rejecting:', error)
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: 'Failed to reject requisition.',
        confirmButtonColor: '#7c3aed',
      })
    }
  }

  // Mark in transit
  const handleMarkInTransit = async (requisitionId) => {
    const result = await Swal.fire({
      title: 'Mark as In Transit',
      text: 'Has the stock been dispatched from the source branch?',
      icon: 'question',
      showCancelButton: true,
      confirmButtonColor: '#3b82f6',
      confirmButtonText: 'Yes, dispatched'
    })

    if (!result.isConfirmed) return

    try {
      const token = localStorage.getItem('auth-token')
      const response = await fetch('/api/requisitions', {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          requisitionId,
          action: 'mark-in-transit'
        })
      })

      if (response.ok) {
        Swal.fire({
          icon: 'success',
          title: 'Updated',
          text: 'Requisition marked as in-transit.',
          confirmButtonColor: '#7c3aed',
        })
        await fetchRequisitions()
      }
    } catch (error) {
      console.error('Error updating:', error)
    }
  }

  // Mark received
  const handleMarkReceived = async (requisitionId) => {
    const result = await Swal.fire({
      title: 'Confirm Receipt',
      html: `
        <p>Has the destination branch received and verified all items?</p>
        <p class="text-sm text-gray-600 mt-2">Note: This will update the stock quantities.</p>
      `,
      icon: 'question',
      showCancelButton: true,
      confirmButtonColor: '#7c3aed',
      confirmButtonText: 'Yes, received & verified'
    })

    if (!result.isConfirmed) return

    try {
      const token = localStorage.getItem('auth-token')
      const response = await fetch('/api/requisitions', {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          requisitionId,
          action: 'mark-received'
        })
      })

      if (response.ok) {
        Swal.fire({
          icon: 'success',
          title: 'Received',
          text: 'Requisition marked as received. Stock quantities will be updated.',
          confirmButtonColor: '#7c3aed',
        })
        await fetchRequisitions()
      }
    } catch (error) {
      console.error('Error updating:', error)
    }
  }

  // Export to CSV
  const handleExport = () => {
    if (filteredRequisitions.length === 0) {
      Swal.fire({
        icon: 'info',
        title: 'No Data',
        text: 'No requisitions to export.',
        confirmButtonColor: '#7c3aed',
      })
      return
    }

    const csvData = filteredRequisitions.map(req => ({
      'Req Number': req.requisitionNumber,
      'Date': new Date(req.createdAt).toLocaleDateString(),
      'Requested By': req.requestedBy.name,
      'Source': req.sourceBranch,
      'Destination': req.destinationBranch,
      'Items': req.items.length,
      'Status': req.status,
      'Priority': req.priority
    }))

    const csv = [
      Object.keys(csvData[0]).join(','),
      ...csvData.map(row => Object.values(row).join(','))
    ].join('\n')

    const blob = new Blob([csv], { type: 'text/csv' })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `vwv-requisitions-${new Date().toISOString().split('T')[0]}.csv`
    a.click()
    
    Swal.fire({
      icon: 'success',
      title: 'Exported',
      text: 'Requisitions exported successfully.',
      confirmButtonColor: '#7c3aed',
      timer: 2000
    })
  }

  // Get status badge
  const getStatusBadge = (status) => {
    const badges = {
      pending: { color: 'bg-yellow-100 text-yellow-800 border-yellow-300', icon: Clock, text: 'Pending' },
      approved: { color: 'bg-green-100 text-green-800 border-green-300', icon: CheckCircle, text: 'Approved' },
      rejected: { color: 'bg-red-100 text-red-800 border-red-300', icon: XCircle, text: 'Rejected' },
      'in-transit': { color: 'bg-blue-100 text-blue-800 border-blue-300', icon: Truck, text: 'In Transit' },
      received: { color: 'bg-purple-100 text-purple-800 border-purple-300', icon: Package, text: 'Received' }
    }

    const badge = badges[status] || badges.pending
    const Icon = badge.icon

    return (
      <span className={`px-3 py-1 rounded-full text-xs font-semibold ${badge.color} border flex items-center gap-1 w-fit`}>
        <Icon className="w-3 h-3" />
        {badge.text}
      </span>
    )
  }

  // Calculate statistics
  const stats = {
    total: requisitions.length,
    pending: requisitions.filter(r => r.status === 'pending').length,
    approved: requisitions.filter(r => r.status === 'approved').length,
    inTransit: requisitions.filter(r => r.status === 'in-transit').length,
    received: requisitions.filter(r => r.status === 'received').length,
    rejected: requisitions.filter(r => r.status === 'rejected').length,
  }

  // Get unique branches
  const uniqueBranches = [...new Set([
    ...requisitions.map(r => r.sourceBranch),
    ...requisitions.map(r => r.destinationBranch)
  ])].filter(Boolean)

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-purple-600 mx-auto mb-4"></div>
          <p className="text-gray-600 text-lg">Loading requisitions...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-6 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Requisition Management</h1>
              <p className="text-gray-500 mt-1">Monitor and approve stock transfer requests • VWV E-Commerce</p>
            </div>
            <button
              onClick={handleExport}
              className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors shadow-md"
            >
              <Download className="w-5 h-5" />
              Export CSV
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Statistics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-4 mb-8">
          <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-200 hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 font-medium">Total</p>
                <p className="text-3xl font-bold text-gray-900 mt-1">{stats.total}</p>
              </div>
              <BarChart3 className="w-8 h-8 text-purple-600" />
            </div>
          </div>

          <div className="bg-gradient-to-br from-yellow-50 to-yellow-100 p-5 rounded-xl shadow-sm border border-yellow-200 hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-yellow-800 font-medium">Pending</p>
                <p className="text-3xl font-bold text-yellow-900 mt-1">{stats.pending}</p>
              </div>
              <Clock className="w-8 h-8 text-yellow-600" />
            </div>
          </div>

          <div className="bg-gradient-to-br from-green-50 to-green-100 p-5 rounded-xl shadow-sm border border-green-200 hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-green-800 font-medium">Approved</p>
                <p className="text-3xl font-bold text-green-900 mt-1">{stats.approved}</p>
              </div>
              <CheckCircle className="w-8 h-8 text-green-600" />
            </div>
          </div>

          <div className="bg-gradient-to-br from-blue-50 to-blue-100 p-5 rounded-xl shadow-sm border border-blue-200 hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-blue-800 font-medium">In Transit</p>
                <p className="text-3xl font-bold text-blue-900 mt-1">{stats.inTransit}</p>
              </div>
              <Truck className="w-8 h-8 text-blue-600" />
            </div>
          </div>

          <div className="bg-gradient-to-br from-purple-50 to-purple-100 p-5 rounded-xl shadow-sm border border-purple-200 hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-purple-800 font-medium">Received</p>
                <p className="text-3xl font-bold text-purple-900 mt-1">{stats.received}</p>
              </div>
              <Package className="w-8 h-8 text-purple-600" />
            </div>
          </div>

          <div className="bg-gradient-to-br from-red-50 to-red-100 p-5 rounded-xl shadow-sm border border-red-200 hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-red-800 font-medium">Rejected</p>
                <p className="text-3xl font-bold text-red-900 mt-1">{stats.rejected}</p>
              </div>
              <XCircle className="w-8 h-8 text-red-600" />
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Status
              </label>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              >
                <option value="all">All Status</option>
                <option value="pending">Pending</option>
                <option value="approved">Approved</option>
                <option value="in-transit">In Transit</option>
                <option value="received">Received</option>
                <option value="rejected">Rejected</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Branch
              </label>
              <select
                value={branchFilter}
                onChange={(e) => setBranchFilter(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              >
                <option value="all">All Branches</option>
                {uniqueBranches.map(branch => (
                  <option key={branch} value={branch}>{branch.charAt(0).toUpperCase() + branch.slice(1)}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Date Range
              </label>
              <select
                value={dateRange}
                onChange={(e) => setDateRange(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              >
                <option value="all">All Time</option>
                <option value="today">Today</option>
                <option value="week">Last 7 Days</option>
                <option value="month">Last 30 Days</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Search
              </label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search..."
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Requisitions Table */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          {filteredRequisitions.length === 0 ? (
            <div className="p-12 text-center">
              <Package className="w-16 h-16 mx-auto text-gray-300 mb-4" />
              <p className="text-gray-500 text-lg">No requisitions found</p>
              <p className="text-gray-400 text-sm mt-2">Try adjusting your filters</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gradient-to-r from-purple-50 to-violet-50 border-b border-gray-200">
                  <tr>
                    <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                      Req. ID
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                      Date
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                      Requested By
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                      Transfer Route
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                      Items
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredRequisitions.map((req) => (
                    <tr key={req._id} className="hover:bg-purple-50/30 transition-colors">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div>
                          <div className="text-sm font-bold text-purple-600">{req.requisitionNumber}</div>
                          {req.priority === 'urgent' && (
                            <span className="inline-flex items-center gap-1 text-xs text-red-600 font-semibold mt-1">
                              <AlertCircle className="w-3 h-3" />
                              URGENT
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                        {new Date(req.createdAt).toLocaleDateString('en-US', { 
                          month: 'short', 
                          day: 'numeric',
                          year: 'numeric'
                        })}
                      </td>
                      <td className="px-6 py-4">
                        <div>
                          <div className="text-sm font-medium text-gray-900">{req.requestedBy.name}</div>
                          <div className="text-xs text-gray-500 capitalize">{req.requestedBy.branch} Branch</div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2 text-sm">
                          <span className="font-semibold text-gray-700 capitalize px-2 py-1 bg-blue-50 rounded">{req.sourceBranch}</span>
                          <ArrowUpRight className="w-4 h-4 text-purple-600" />
                          <span className="font-semibold text-gray-700 capitalize px-2 py-1 bg-green-50 rounded">{req.destinationBranch}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="px-3 py-1 bg-purple-100 text-purple-700 rounded-full text-xs font-bold">
                          {req.items.length} item{req.items.length !== 1 ? 's' : ''}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {getStatusBadge(req.status)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => handleViewDetails(req)}
                            className="p-2 text-purple-600 hover:bg-purple-50 rounded-lg transition-colors"
                            title="View Full Details"
                          >
                            <Eye className="w-5 h-5" />
                          </button>
                          
                          {req.status === 'pending' && (
                            <>
                              <button
                                onClick={() => handleOpenApproval(req)}
                                className="p-2 text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                                title="Review & Approve"
                              >
                                <Edit2 className="w-5 h-5" />
                              </button>
                              <button
                                onClick={() => handleReject(req._id)}
                                className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                title="Reject"
                              >
                                <XCircle className="w-5 h-5" />
                              </button>
                            </>
                          )}

                          {req.status === 'approved' && (
                            <button
                              onClick={() => handleMarkInTransit(req._id)}
                              className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                              title="Mark In Transit"
                            >
                              <Truck className="w-5 h-5" />
                            </button>
                          )}

                          {req.status === 'in-transit' && (
                            <button
                              onClick={() => handleMarkReceived(req._id)}
                              className="p-2 text-purple-600 hover:bg-purple-50 rounded-lg transition-colors"
                              title="Mark Received"
                            >
                              <Package className="w-5 h-5" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Details Modal */}
      {showDetailsModal && selectedRequisition && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col">
            <div className="flex items-center justify-between p-6 border-b border-gray-200 bg-gradient-to-r from-purple-50 to-violet-50">
              <div>
                <h2 className="text-2xl font-bold text-gray-900">{selectedRequisition.requisitionNumber}</h2>
                <p className="text-sm text-gray-600 mt-1">Complete Requisition Details</p>
              </div>
              <button
                onClick={() => setShowDetailsModal(false)}
                className="p-2 hover:bg-white rounded-lg transition-colors"
              >
                <X className="w-6 h-6 text-gray-500" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-6">
              {/* Status and Priority */}
              <div className="flex items-center gap-4 mb-6">
                {getStatusBadge(selectedRequisition.status)}
                {selectedRequisition.priority === 'urgent' && (
                  <span className="px-3 py-1 bg-red-100 text-red-800 rounded-full text-xs font-semibold border border-red-300 flex items-center gap-1">
                    <AlertCircle className="w-4 h-4" />
                    URGENT PRIORITY
                  </span>
                )}
              </div>

              {/* Request Info */}
              <div className="grid grid-cols-2 gap-6 mb-6">
                <div className="bg-gray-50 p-4 rounded-lg">
                  <p className="text-xs text-gray-600 mb-1 uppercase font-semibold">Requested By</p>
                  <p className="font-bold text-gray-900 text-lg">{selectedRequisition.requestedBy.name}</p>
                  <p className="text-sm text-gray-600">{selectedRequisition.requestedBy.email}</p>
                  <p className="text-xs text-purple-600 mt-1 capitalize font-medium">{selectedRequisition.requestedBy.branch} Branch</p>
                </div>
                <div className="bg-gray-50 p-4 rounded-lg">
                  <p className="text-xs text-gray-600 mb-1 uppercase font-semibold">Request Date</p>
                  <p className="font-bold text-gray-900 text-lg">
                    {new Date(selectedRequisition.createdAt).toLocaleDateString('en-US', {
                      weekday: 'short',
                      month: 'long',
                      day: 'numeric',
                      year: 'numeric'
                    })}
                  </p>
                  <p className="text-sm text-gray-600">
                    {new Date(selectedRequisition.createdAt).toLocaleTimeString('en-US', {
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </p>
                </div>
              </div>

              {/* Transfer Route */}
              <div className="bg-gradient-to-r from-purple-50 via-violet-50 to-purple-50 p-5 rounded-xl mb-6 border border-purple-200">
                <p className="text-sm text-gray-700 mb-3 font-semibold flex items-center gap-2">
                  <Truck className="w-4 h-4 text-purple-600" />
                  Transfer Route
                </p>
                <div className="flex items-center gap-3">
                  <div className="flex-1 bg-white p-4 rounded-lg border-2 border-blue-200 shadow-sm">
                    <p className="text-xs text-gray-600 mb-1">Source (From)</p>
                    <p className="font-bold text-gray-900 text-lg capitalize">{selectedRequisition.sourceBranch}</p>
                    <p className="text-xs text-blue-600 mt-1">Stock will be deducted</p>
                  </div>
                  <div className="flex flex-col items-center">
                    <ArrowUpRight className="w-8 h-8 text-purple-600" />
                    <span className="text-xs text-gray-500 mt-1">Transfer</span>
                  </div>
                  <div className="flex-1 bg-white p-4 rounded-lg border-2 border-green-200 shadow-sm">
                    <p className="text-xs text-gray-600 mb-1">Destination (To)</p>
                    <p className="font-bold text-gray-900 text-lg capitalize">{selectedRequisition.destinationBranch}</p>
                    <p className="text-xs text-green-600 mt-1">Stock will be added</p>
                  </div>
                </div>
              </div>

              {/* Requested Products */}
              <div className="mb-6">
                <h3 className="font-bold text-gray-900 mb-4 text-lg flex items-center gap-2">
                  <Package className="w-5 h-5 text-purple-600" />
                  Requested Products ({selectedRequisition.items.length})
                </h3>
                <div className="space-y-3">
                  {selectedRequisition.items.map((item, idx) => (
                    <div key={idx} className="flex items-center gap-4 p-4 bg-gradient-to-r from-gray-50 to-purple-50 rounded-lg border border-gray-200 hover:shadow-md transition-shadow">
                      {item.image ? (
                        <img 
                          src={item.image} 
                          alt={item.productName} 
                          className="w-20 h-20 rounded-lg object-cover border-2 border-purple-200" 
                        />
                      ) : (
                        <div className="w-20 h-20 rounded-lg bg-gray-200 flex items-center justify-center">
                          <Package className="w-10 h-10 text-gray-400" />
                        </div>
                      )}
                      <div className="flex-1">
                        <p className="font-bold text-gray-900 text-base">{item.productName}</p>
                        <p className="text-sm text-gray-600 mt-1">Product ID: {item.productId}</p>
                      </div>
                      <div className="text-right bg-white px-4 py-3 rounded-lg border border-purple-200">
                        <p className="text-xs text-gray-600 mb-1">Requested</p>
                        <p className="font-bold text-purple-600 text-2xl">{item.requestedQty}</p>
                      </div>
                      {item.approvedQty !== null && item.approvedQty !== undefined && (
                        <div className="text-right bg-green-50 px-4 py-3 rounded-lg border border-green-200">
                          <p className="text-xs text-gray-600 mb-1">Approved</p>
                          <p className="font-bold text-green-600 text-2xl">{item.approvedQty}</p>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* Notes */}
              {selectedRequisition.notes && (
                <div className="mb-6">
                  <h3 className="font-semibold text-gray-900 mb-2">Additional Notes</h3>
                  <p className="text-gray-700 bg-yellow-50 p-4 rounded-lg border border-yellow-200">{selectedRequisition.notes}</p>
                </div>
              )}

              {/* Rejection Reason */}
              {selectedRequisition.rejectionReason && (
                <div className="bg-red-50 border-2 border-red-200 p-4 rounded-lg">
                  <h3 className="font-semibold text-red-900 mb-2 flex items-center gap-2">
                    <XCircle className="w-5 h-5" />
                    Rejection Reason
                  </h3>
                  <p className="text-red-700">{selectedRequisition.rejectionReason}</p>
                  {selectedRequisition.rejectedBy && (
                    <p className="text-xs text-red-600 mt-2">Rejected by: {selectedRequisition.rejectedBy}</p>
                  )}
                </div>
              )}
            </div>

            <div className="p-6 border-t border-gray-200 bg-gray-50">
              <button
                onClick={() => setShowDetailsModal(false)}
                className="w-full px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors font-semibold shadow-md"
              >
                Close Details
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Enhanced Approval Modal with Product Management */}
      {showApprovalModal && selectedRequisition && (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col">
            <div className="flex items-center justify-between p-6 border-b border-gray-200 bg-gradient-to-r from-green-50 to-emerald-50">
              <div>
                <h2 className="text-2xl font-bold text-gray-900">Review & Approve Stock Transfer</h2>
                <p className="text-sm text-gray-600 mt-1">{selectedRequisition.requisitionNumber} • Adjust quantities as needed</p>
              </div>
              <button
                onClick={() => setShowApprovalModal(false)}
                className="p-2 hover:bg-white rounded-lg transition-colors"
              >
                <X className="w-6 h-6 text-gray-500" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-6">
              {/* Transfer Summary */}
              <div className="bg-blue-50 border border-blue-200 p-4 rounded-lg mb-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-700 font-medium">Transfer From:</p>
                    <p className="text-lg font-bold text-blue-900 capitalize">{selectedRequisition.sourceBranch} Branch</p>
                  </div>
                  <ArrowUpRight className="w-6 h-6 text-blue-600" />
                  <div className="text-right">
                    <p className="text-sm text-gray-700 font-medium">Transfer To:</p>
                    <p className="text-lg font-bold text-green-900 capitalize">{selectedRequisition.destinationBranch} Branch</p>
                  </div>
                </div>
              </div>

              <p className="text-sm text-gray-600 mb-4 bg-yellow-50 p-3 rounded-lg border border-yellow-200">
                ⚠️ <strong>Important:</strong> Adjust quantities for each product. Set to 0 to exclude from transfer. Stock will be deducted from {selectedRequisition.sourceBranch} and added to {selectedRequisition.destinationBranch}.
              </p>

              {/* Products with Quantity Controls */}
              <div className="space-y-4 mb-6">
                {selectedRequisition.items.map((item, idx) => (
                  <div key={idx} className="flex items-center gap-4 p-5 bg-gradient-to-r from-gray-50 to-green-50 rounded-xl border-2 border-gray-200 hover:border-green-300 transition-all">
                    {item.image ? (
                      <img 
                        src={item.image} 
                        alt={item.productName} 
                        className="w-24 h-24 rounded-lg object-cover border-2 border-purple-200 shadow-sm" 
                      />
                    ) : (
                      <div className="w-24 h-24 rounded-lg bg-gray-200 flex items-center justify-center">
                        <Package className="w-12 h-12 text-gray-400" />
                      </div>
                    )}
                    <div className="flex-1">
                      <p className="font-bold text-gray-900 text-lg">{item.productName}</p>
                      <p className="text-sm text-gray-600 mt-1">Product ID: <span className="font-mono text-purple-600">{item.productId}</span></p>
                      <div className="flex items-center gap-2 mt-2">
                        <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded text-xs font-semibold">
                          Requested: {item.requestedQty}
                        </span>
                      </div>
                    </div>
                    <div className="flex flex-col items-end gap-2">
                      <label className="text-xs text-gray-600 font-semibold uppercase">Approve Quantity</label>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleUpdateApprovalQty(idx, Math.max(0, (approvalQuantities[idx] || 0) - 1))}
                          className="p-2 bg-red-100 hover:bg-red-200 text-red-700 rounded-lg transition-colors"
                        >
                          <span className="text-xl font-bold">−</span>
                        </button>
                        <input
                          type="number"
                          value={approvalQuantities[idx] || 0}
                          onChange={(e) => handleUpdateApprovalQty(idx, e.target.value)}
                          className="w-24 px-4 py-3 border-2 border-gray-300 rounded-lg text-center font-bold text-xl focus:ring-2 focus:ring-green-500 focus:border-green-500"
                          min="0"
                          max="9999"
                        />
                        <button
                          onClick={() => handleUpdateApprovalQty(idx, (approvalQuantities[idx] || 0) + 1)}
                          className="p-2 bg-green-100 hover:bg-green-200 text-green-700 rounded-lg transition-colors"
                        >
                          <span className="text-xl font-bold">+</span>
                        </button>
                      </div>
                      {approvalQuantities[idx] === 0 && (
                        <span className="text-xs text-red-600 font-medium">⚠️ Will be excluded</span>
                      )}
                    </div>
                  </div>
                ))}
              </div>

              {/* Delivery Date */}
              <div className="mb-6 bg-purple-50 p-4 rounded-lg border border-purple-200">
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Expected Delivery Date (Optional)
                </label>
                <input
                  type="date"
                  value={deliveryDate}
                  onChange={(e) => setDeliveryDate(e.target.value)}
                  min={new Date().toISOString().split('T')[0]}
                  className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                />
              </div>
            </div>

            <div className="flex gap-3 p-6 border-t-2 border-gray-200 bg-gradient-to-r from-gray-50 to-green-50">
              <button
                onClick={() => {
                  setShowApprovalModal(false)
                  setApprovalQuantities({})
                  setDeliveryDate('')
                }}
                className="flex-1 px-6 py-3 border-2 border-gray-300 text-gray-700 rounded-lg hover:bg-gray-100 transition-colors font-semibold"
              >
                Cancel
              </button>
              <button
                onClick={handleApprove}
                className="flex-1 px-6 py-3 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-lg hover:from-green-700 hover:to-emerald-700 transition-colors font-semibold flex items-center justify-center gap-2 shadow-lg"
              >
                <Check className="w-5 h-5" />
                Approve & Transfer Stock
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
