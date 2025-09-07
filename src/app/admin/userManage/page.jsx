'use client'

import { useState, useEffect, useContext } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import Swal from 'sweetalert2'
import { useRouter } from 'next/navigation'
import { AuthContext } from '../../../../Provider/AuthProvider'
import {
  Users,
  Settings,
  Shield,
  Store,
  Edit,
  Save,
  X,
  Search,
  Filter,
  UserCheck,
  Crown,
  Building,
  Plus,
  Trash2,
} from 'lucide-react'

// Branch Management Modal Component with API integration
const BranchManagementModal = ({
  isOpen,
  onClose,
  branches,
  onBranchUpdate,
}) => {
  const [newBranchName, setNewBranchName] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleAddBranch = async (e) => {
    e.preventDefault()
    if (!newBranchName.trim()) {
      setError('Branch name is required')
      return
    }

    const cleanBranchName = newBranchName.trim().toLowerCase()
    if (branches.includes(cleanBranchName)) {
      setError('Branch already exists')
      return
    }

    setLoading(true)
    try {
      const token = localStorage.getItem('auth-token')
      
      const response = await fetch('/api/branches', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          action: 'add',
          branchName: cleanBranchName,
        }),
      })

      if (!response.ok) throw new Error('Failed to add branch')

      onBranchUpdate([...branches, cleanBranchName])
      setNewBranchName('')
      setError('')

      Swal.fire({
        icon: 'success',
        title: 'Branch Added!',
        text: `${newBranchName} branch has been added successfully`,
        timer: 2000,
        showConfirmButton: false,
        toast: true,
        position: 'top-end',
      })
    } catch (error) {
      console.error('Error adding branch:', error)
      setError('Failed to add branch')
    } finally {
      setLoading(false)
    }
  }

  const handleDeleteBranch = async (branchName) => {
    const result = await Swal.fire({
      title: 'Delete Branch?',
      text: `Are you sure you want to delete "${branchName}" branch? This will affect all users and products using this branch.`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#d33',
      cancelButtonColor: '#3085d6',
      confirmButtonText: 'Yes, delete it!',
    })

    if (result.isConfirmed) {
      setLoading(true)
      try {
        const token = localStorage.getItem('auth-token')
        
        const response = await fetch('/api/branches', {
          method: 'DELETE',
          headers: { 
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({ branchName }),
        })

        if (!response.ok) throw new Error('Failed to delete branch')

        onBranchUpdate(branches.filter((b) => b !== branchName))

        Swal.fire({
          icon: 'success',
          title: 'Deleted!',
          text: `${branchName} branch has been deleted.`,
          timer: 2000,
          showConfirmButton: false,
          toast: true,
          position: 'top-end',
        })
      } catch (error) {
        console.error('Error deleting branch:', error)
        Swal.fire({
          icon: 'error',
          title: 'Error',
          text: 'Failed to delete branch',
        })
      } finally {
        setLoading(false)
      }
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        className="bg-white rounded-2xl p-6 max-w-md w-full mx-4 max-h-[80vh] overflow-y-auto"
      >
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
            <Building size={24} className="text-purple-600" />
            Manage Branches
          </h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <X size={24} />
          </button>
        </div>

        {/* Add New Branch Form */}
        <form onSubmit={handleAddBranch} className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Add New Branch
          </label>
          <div className="flex gap-2">
            <input
              type="text"
              value={newBranchName}
              onChange={(e) => {
                setNewBranchName(e.target.value)
                setError('')
              }}
              placeholder="Enter branch name"
              className="flex-1 p-3 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-purple-500"
              disabled={loading}
            />
            <button
              type="submit"
              disabled={loading}
              className="px-4 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50"
            >
              {loading ? (
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
              ) : (
                <Plus size={16} />
              )}
            </button>
          </div>
          {error && (
            <p className="text-red-500 text-sm mt-1 flex items-center gap-1">
              <X size={16} />
              {error}
            </p>
          )}
        </form>

        {/* Current Branches List */}
        <div>
          <h4 className="text-lg font-semibold text-gray-800 mb-3">
            Current Branches ({branches.length})
          </h4>
          <div className="space-y-2 max-h-48 overflow-y-auto">
            {branches.map((branch) => (
              <div
                key={branch}
                className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
              >
                <span className="font-medium text-gray-800 capitalize flex items-center gap-2">
                  <Building size={16} className="text-purple-600" />
                  {branch}
                </span>
                <button
                  onClick={() => handleDeleteBranch(branch)}
                  className="text-red-500 hover:text-red-700 p-1"
                  disabled={branches.length <= 1 || loading}
                  title={
                    branches.length <= 1
                      ? 'Cannot delete the last branch'
                      : 'Delete branch'
                  }
                >
                  <Trash2 size={16} />
                </button>
              </div>
            ))}
          </div>
        </div>

        <div className="flex justify-end mt-6">
          <button
            onClick={onClose}
            className="px-6 py-3 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400"
          >
            Close
          </button>
        </div>
      </motion.div>
    </div>
  )
}

export default function AdminUserManagement() {
  const { user } = useContext(AuthContext)
  const router = useRouter()
  const [users, setUsers] = useState([])
  const [branches, setBranches] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [filterRole, setFilterRole] = useState('')
  const [editingUser, setEditingUser] = useState(null)
  const [tempRole, setTempRole] = useState('')
  const [tempBranch, setTempBranch] = useState('')
  const [showBranchModal, setShowBranchModal] = useState(false)
  const [error, setError] = useState('')

  // Fetch users and branches from API with authentication
  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true)
        setError('')

        // Get the authentication token
        let token = localStorage.getItem('auth-token')
        
        // If no stored token, try getting fresh one from Firebase user
        if (!token && user) {
          token = await user.getIdToken()
          localStorage.setItem('auth-token', token)
        }

        if (!token) {
          throw new Error('No authentication token available')
        }

        console.log('🔍 Making request with token:', token ? 'Yes' : 'No')

        // Fetch users with authentication header
        const usersRes = await fetch('/api/user?getAllUsers=true', {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        })

        console.log('🔍 Users response status:', usersRes.status)

        if (usersRes.status === 401) {
          // Token might be expired, redirect to login
          localStorage.removeItem('auth-token')
          localStorage.removeItem('user-info')
          router.push('/RegistrationPage')
          return
        }

        if (!usersRes.ok) {
          throw new Error(`Failed to fetch users: ${usersRes.status} ${usersRes.statusText}`)
        }

        const usersData = await usersRes.json()
        console.log('🔍 Users data:', usersData)
        
        // Handle different response structures
        if (usersData.users && Array.isArray(usersData.users)) {
          setUsers(usersData.users)
        } else if (Array.isArray(usersData)) {
          setUsers(usersData)
        } else {
          console.error('Unexpected users response structure:', usersData)
          setUsers([])
        }

        // Fetch branches with authentication header
        const branchesRes = await fetch('/api/branches', {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        })

        if (branchesRes.ok) {
          const branchesData = await branchesRes.json()
          setBranches(branchesData.branches || ['main', 'mirpur', 'bashundhara'])
        } else {
          // Fallback to default branches if API fails
          setBranches(['main', 'mirpur', 'bashundhara'])
        }

      } catch (error) {
        console.error('❌ Error loading data:', error)
        setError(error.message)
        setBranches(['main', 'mirpur', 'bashundhara']) // Fallback
        
        if (error.message.includes('No authentication token') || 
            error.message.includes('401') ||
            error.message.includes('Unauthorized')) {
          // Redirect to login if authentication fails
          router.push('/RegistrationPage')
        } else {
          Swal.fire({
            icon: 'error',
            title: 'Error',
            text: 'Failed to load user data',
          })
        }
      } finally {
        setLoading(false)
      }
    }

    loadData()
  }, [user, router])

  // Start editing a user
  const startEditing = (user) => {
    setEditingUser(user._id)
    setTempRole(user.role || 'user')
    setTempBranch(user.branch || '')
  }

  // Cancel editing
  const cancelEditing = () => {
    setEditingUser(null)
    setTempRole('')
    setTempBranch('')
  }

  // Save user changes
  const saveUserChanges = async (user) => {
    try {
      const token = localStorage.getItem('auth-token')
      
      const response = await fetch('/api/user', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          action: 'update',
          email: user.email,
          name: user.name,
          phone: user.phone,
          role: tempRole,
          branch: tempBranch || null,
        }),
      })

      if (!response.ok) {
        throw new Error('Failed to update user')
      }

      const result = await response.json()

      // Update local state
      setUsers((prev) =>
        prev.map((u) =>
          u._id === user._id
            ? { ...u, role: tempRole, branch: tempBranch || null }
            : u
        )
      )

      setEditingUser(null)

      Swal.fire({
        icon: 'success',
        title: 'Success!',
        text: `User ${user.name} has been updated successfully`,
        timer: 2000,
        showConfirmButton: false,
        toast: true,
        position: 'top-end',
      })
    } catch (error) {
      console.error('Error updating user:', error)
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: 'Failed to update user',
      })
    }
  }

  // Handle branch updates from modal
  const handleBranchUpdate = (newBranches) => {
    setBranches(newBranches)
  }

  // Filter users based on search and role
  const filteredUsers = users.filter((user) => {
    const matchesSearch =
      user.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.email?.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesRole = !filterRole || user.role === filterRole
    return matchesSearch && matchesRole
  })

  // Get role badge styling
  const getRoleBadge = (role) => {
    switch (role) {
      case 'admin':
        return 'bg-red-100 text-red-800 border-red-200'
      case 'moderator':
        return 'bg-blue-100 text-blue-800 border-blue-200'
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200'
    }
  }

  // Get role icon
  const getRoleIcon = (role) => {
    switch (role) {
      case 'admin':
        return <Crown size={16} />
      case 'moderator':
        return <Shield size={16} />
      default:
        return <UserCheck size={16} />
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 via-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading users...</p>
        </div>
      </div>
    )
  }

  // Show error state
  if (error && !loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 via-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center">
          <X size={64} className="mx-auto text-red-400 mb-4" />
          <h3 className="text-xl font-semibold text-gray-900 mb-2">
            Error Loading Data
          </h3>
          <p className="text-gray-600 mb-4">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700"
          >
            Retry
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-blue-50 to-indigo-100 p-4">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-4xl font-bold text-gray-900 mb-2 flex items-center gap-3">
                <Users className="text-purple-600" size={40} />
                User Management
              </h1>
              <p className="text-gray-600">
                Manage user roles and branch assignments ({users.length} total users)
              </p>
            </div>

            {/* Branch Management Button */}
            <button
              onClick={() => setShowBranchModal(true)}
              className="px-6 py-3 bg-purple-600 text-white rounded-xl hover:bg-purple-700 flex items-center gap-2 transition-colors"
            >
              <Building size={20} />
              Manage Branches ({branches.length})
            </button>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-2xl shadow-lg p-6 mb-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Search */}
            <div className="relative">
              <Search
                size={20}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
              />
              <input
                type="text"
                placeholder="Search users..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-3 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-purple-500"
              />
            </div>

            {/* Role Filter */}
            <select
              value={filterRole}
              onChange={(e) => setFilterRole(e.target.value)}
              className="w-full p-3 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-purple-500"
            >
              <option value="">All Roles</option>
              <option value="admin">Admin</option>
              <option value="moderator">Moderator</option>
              <option value="user">User</option>
            </select>

            {/* Stats */}
            <div className="flex items-center justify-end gap-4 text-sm text-gray-600">
              <span>Total: {filteredUsers.length}</span>
              <span>
                Admins: {filteredUsers.filter((u) => u.role === 'admin').length}
              </span>
              <span>
                Moderators:{' '}
                {filteredUsers.filter((u) => u.role === 'moderator').length}
              </span>
            </div>
          </div>
        </div>

        {/* Users Table */}
        <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gradient-to-r from-purple-600 to-indigo-600 text-white">
                <tr>
                  <th className="px-6 py-4 text-left text-sm font-semibold">
                    User
                  </th>
                  <th className="px-6 py-4 text-left text-sm font-semibold">
                    Contact
                  </th>
                  <th className="px-6 py-4 text-left text-sm font-semibold">
                    Role
                  </th>
                  <th className="px-6 py-4 text-left text-sm font-semibold">
                    Branch
                  </th>
                  <th className="px-6 py-4 text-left text-sm font-semibold">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                <AnimatePresence>
                  {filteredUsers.map((user) => (
                    <motion.tr
                      key={user._id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -20 }}
                      className="hover:bg-gray-50 transition-colors"
                    >
                      {/* User Info */}
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          {user.profilePicture ? (
                            <img
                              src={user.profilePicture}
                              alt={user.name}
                              className="w-10 h-10 rounded-full object-cover"
                            />
                          ) : (
                            <div className="w-10 h-10 rounded-full bg-purple-100 flex items-center justify-center">
                              <span className="text-purple-600 font-semibold text-sm">
                                {user.name?.charAt(0) || user.email.charAt(0)}
                              </span>
                            </div>
                          )}
                          <div>
                            <p className="font-semibold text-gray-900">
                              {user.name || 'No Name'}
                            </p>
                            <p className="text-sm text-gray-600">
                              {user.email}
                            </p>
                          </div>
                        </div>
                      </td>

                      {/* Contact */}
                      <td className="px-6 py-4">
                        <p className="text-sm text-gray-900">
                          {user.phone || 'No phone'}
                        </p>
                        <p className="text-xs text-gray-500">
                          Joined {new Date(user.createdAt).toLocaleDateString()}
                        </p>
                      </td>

                      {/* Role */}
                      <td className="px-6 py-4">
                        {editingUser === user._id ? (
                          <select
                            value={tempRole}
                            onChange={(e) => setTempRole(e.target.value)}
                            className="w-full p-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                          >
                            <option value="user">User</option>
                            <option value="moderator">Moderator</option>
                            <option value="admin">Admin</option>
                          </select>
                        ) : (
                          <span
                            className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-sm font-medium border ${getRoleBadge(
                              user.role
                            )}`}
                          >
                            {getRoleIcon(user.role)}
                            {user.role || 'user'}
                          </span>
                        )}
                      </td>

                      {/* Branch */}
                      <td className="px-6 py-4">
                        {editingUser === user._id ? (
                          <select
                            value={tempBranch}
                            onChange={(e) => setTempBranch(e.target.value)}
                            className="w-full p-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                          >
                            <option value="">No Branch</option>
                            {branches.map((branch) => (
                              <option key={branch} value={branch}>
                                {branch.charAt(0).toUpperCase() +
                                  branch.slice(1)}
                              </option>
                            ))}
                          </select>
                        ) : (
                          <div>
                            {user.branch ? (
                              <span className="inline-flex items-center gap-1 px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm font-medium">
                                <Building size={14} />
                                {user.branch.charAt(0).toUpperCase() +
                                  user.branch.slice(1)}
                              </span>
                            ) : (
                              <span className="text-gray-400 text-sm">
                                No branch assigned
                              </span>
                            )}
                          </div>
                        )}
                      </td>

                      {/* Actions */}
                      <td className="px-6 py-4">
                        {editingUser === user._id ? (
                          <div className="flex gap-2">
                            <button
                              onClick={() => saveUserChanges(user)}
                              className="p-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                              title="Save changes"
                            >
                              <Save size={16} />
                            </button>
                            <button
                              onClick={cancelEditing}
                              className="p-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
                              title="Cancel"
                            >
                              <X size={16} />
                            </button>
                          </div>
                        ) : (
                          <button
                            onClick={() => startEditing(user)}
                            className="p-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
                            title="Edit user"
                          >
                            <Edit size={16} />
                          </button>
                        )}
                      </td>
                    </motion.tr>
                  ))}
                </AnimatePresence>
              </tbody>
            </table>
          </div>
        </div>

        {/* No Users */}
        {filteredUsers.length === 0 && !loading && (
          <div className="text-center py-12">
            <Users size={64} className="mx-auto text-gray-400 mb-4" />
            <h3 className="text-xl font-semibold text-gray-900 mb-2">
              No users found
            </h3>
            <p className="text-gray-600">
              {searchTerm || filterRole
                ? 'Try adjusting your filters'
                : 'No users are registered yet'}
            </p>
          </div>
        )}

        {/* Branch Management Modal */}
        <BranchManagementModal
          isOpen={showBranchModal}
          onClose={() => setShowBranchModal(false)}
          branches={branches}
          onBranchUpdate={handleBranchUpdate}
        />
      </div>
    </div>
  )
}
