'use client'

import React, { useState, useContext } from 'react';
import { useRouter } from 'next/navigation';
import { AuthContext } from '../../../Provider/AuthProvider';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Search,
  Package,
  Truck,
  CheckCircle,
  Clock,
  AlertCircle,
  MapPin,
  Phone,
  Mail,
  User,
  CreditCard,
  Calendar,
  ArrowLeft,
  Eye,
  Loader2,
  ShoppingCart,
  Star,
  Tag,
  Percent,
  Droplets,
  RefreshCw
} from 'lucide-react';
import Swal from 'sweetalert2';

export default function TrackOrderPage() {
  const router = useRouter();
  const { user } = useContext(AuthContext);

  // Form states
  const [orderId, setOrderId] = useState('');
  const [email, setEmail] = useState(user?.email || '');
  const [isLoading, setIsLoading] = useState(false);
  const [orderData, setOrderData] = useState(null);
  const [error, setError] = useState('');

  // Auto-fill email for authenticated users
  React.useEffect(() => {
    if (user?.email) {
      setEmail(user.email);
    }
  }, [user]);

  // Handle form submission
  const handleTrackOrder = async (e) => {
    e.preventDefault();
    
    if (!orderId.trim()) {
      setError('Please enter your Order ID');
      return;
    }
    
    if (!email.trim()) {
      setError('Please enter your email address');
      return;
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setError('Please enter a valid email address');
      return;
    }

    setIsLoading(true);
    setError('');
    setOrderData(null);

    try {
      console.log('🔍 Tracking order:', { orderId: orderId.trim(), email: email.trim() });

      // Prepare headers (include auth token if available)
      const headers = {
        'Content-Type': 'application/json',
      };

      if (user) {
        try {
          const token = await user.getIdToken();
          headers['Authorization'] = `Bearer ${token}`;
        } catch (tokenError) {
          console.warn('⚠️ Failed to get auth token, proceeding as guest');
        }
      }

      // Make API request
      const response = await fetch(
        `/api/orders/track?orderId=${encodeURIComponent(orderId.trim())}&email=${encodeURIComponent(email.trim())}`,
        { 
          method: 'GET',
          headers 
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to track order');
      }

      const result = await response.json();
      
      if (!result.success || !result.order) {
        throw new Error('Invalid response from server');
      }

      console.log('✅ Order tracked successfully:', result.order.orderId);
      setOrderData(result.order);

    } catch (error) {
      console.error('❌ Order tracking error:', error);
      setError(error.message || 'Failed to track order. Please check your Order ID and email.');
    } finally {
      setIsLoading(false);
    }
  };

  // Get status information
  const getStatusInfo = (status) => {
    const statusMap = {
      pending: { 
        icon: Clock, 
        color: 'text-orange-600 bg-orange-100', 
        label: 'Pending', 
        description: 'Your order is being processed' 
      },
      confirmed: { 
        icon: CheckCircle, 
        color: 'text-blue-600 bg-blue-100', 
        label: 'Confirmed', 
        description: 'Your order has been confirmed' 
      },
      processing: { 
        icon: Package, 
        color: 'text-purple-600 bg-purple-100', 
        label: 'Processing', 
        description: 'Your order is being prepared' 
      },
      shipped: { 
        icon: Truck, 
        color: 'text-indigo-600 bg-indigo-100', 
        label: 'Shipped', 
        description: 'Your order is on the way' 
      },
      delivered: { 
        icon: CheckCircle, 
        color: 'text-green-600 bg-green-100', 
        label: 'Delivered', 
        description: 'Your order has been delivered' 
      },
      cancelled: { 
        icon: AlertCircle, 
        color: 'text-red-600 bg-red-100', 
        label: 'Cancelled', 
        description: 'Your order has been cancelled' 
      },
      refunded: { 
        icon: RefreshCw, 
        color: 'text-gray-600 bg-gray-100', 
        label: 'Refunded', 
        description: 'Your order has been refunded' 
      }
    };
    
    return statusMap[status] || statusMap.pending;
  };

  // Format date
  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-blue-50 to-indigo-100">
      <div className="max-w-4xl mx-auto px-4 py-8">
        
        {/* Header */}
        <motion.div 
          className="flex items-center justify-between mb-8"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <div className="flex items-center gap-4">
            <button
              onClick={() => router.push('/')}
              className="p-2 rounded-lg bg-white shadow-md hover:shadow-lg transition-all duration-200 hover:scale-105"
            >
              <ArrowLeft size={20} className="text-gray-600" />
            </button>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Track Your Order</h1>
              <p className="text-gray-600">Enter your order details to check the status</p>
            </div>
          </div>
        </motion.div>

        {/* Tracking Form */}
        {!orderData && (
          <motion.div
            className="bg-white rounded-xl shadow-lg p-8 mb-8"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
          >
            <div className="flex items-center gap-3 mb-6">
              <Search size={24} className="text-purple-600" />
              <h2 className="text-xl font-semibold text-gray-900">Track Order</h2>
            </div>

            <form onSubmit={handleTrackOrder} className="space-y-6">
              {/* Order ID Input */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Order ID <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={orderId}
                  onChange={(e) => setOrderId(e.target.value.toUpperCase())}
                  placeholder="Enter your Order ID (e.g., VWV1K2M3N4P5Q6R7)"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  disabled={isLoading}
                />
                <p className="text-xs text-gray-500 mt-1">
                  Your Order ID was provided in the order confirmation email
                </p>
              </div>

              {/* Email Input */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Email Address <span className="text-red-500">*</span>
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value.toLowerCase())}
                  placeholder="Enter your email address"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  disabled={isLoading}
                />
                <p className="text-xs text-gray-500 mt-1">
                  Use the same email address you provided when placing the order
                </p>
              </div>

              {/* Error Message */}
              {error && (
                <motion.div
                  className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-start gap-3"
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.3 }}
                >
                  <AlertCircle size={20} className="text-red-600 flex-shrink-0 mt-0.5" />
                  <p className="text-red-800 text-sm">{error}</p>
                </motion.div>
              )}

              {/* Submit Button */}
              <button
                type="submit"
                disabled={isLoading}
                className="w-full bg-gradient-to-r from-purple-600 to-purple-700 text-white py-4 rounded-lg font-semibold text-lg hover:from-purple-700 hover:to-purple-800 transition-all duration-200 transform hover:scale-105 shadow-lg disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none flex items-center justify-center gap-2"
              >
                {isLoading ? (
                  <>
                    <Loader2 size={20} className="animate-spin" />
                    Tracking Order...
                  </>
                ) : (
                  <>
                    <Search size={20} />
                    Track Order
                  </>
                )}
              </button>
            </form>
          </motion.div>
        )}

        {/* Order Results */}
        <AnimatePresence>
          {orderData && (
            <motion.div
              className="space-y-6"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.5 }}
            >
              {/* Track Another Order Button */}
              <div className="flex justify-center">
                <button
                  onClick={() => {
                    setOrderData(null);
                    setOrderId('');
                    setError('');
                  }}
                  className="flex items-center gap-2 px-4 py-2 text-purple-600 hover:text-purple-700 transition-colors"
                >
                  <Search size={16} />
                  Track Another Order
                </button>
              </div>

              {/* Order Status Card */}
              <div className="bg-white rounded-xl shadow-lg p-8">
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <h2 className="text-2xl font-bold text-gray-900 mb-1">Order Status</h2>
                    <p className="text-gray-600">Order ID: <span className="font-mono font-semibold">{orderData.orderId}</span></p>
                  </div>
                  <div className="text-right">
                    <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-full ${getStatusInfo(orderData.status).color}`}>
                      {React.createElement(getStatusInfo(orderData.status).icon, { size: 20 })}
                      <span className="font-semibold">{getStatusInfo(orderData.status).label}</span>
                    </div>
                    <p className="text-sm text-gray-600 mt-1">{getStatusInfo(orderData.status).description}</p>
                  </div>
                </div>

                {/* Order Timeline */}
                <div className="border-l-2 border-gray-200 ml-4 space-y-4">
                  {orderData.orderHistory.map((history, index) => {
                    const statusInfo = getStatusInfo(history.status);
                    return (
                      <div key={index} className="relative flex items-start gap-4">
                        <div className={`absolute -left-3 w-6 h-6 rounded-full flex items-center justify-center ${statusInfo.color}`}>
                          {React.createElement(statusInfo.icon, { size: 14 })}
                        </div>
                        <div className="ml-6 pb-4">
                          <div className="flex items-center gap-3 mb-1">
                            <h4 className="font-semibold text-gray-900">{statusInfo.label}</h4>
                            <span className="text-sm text-gray-500">{formatDate(history.timestamp)}</span>
                          </div>
                          <p className="text-gray-600 text-sm">{history.note}</p>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Tracking Info */}
                {orderData.trackingInfo && (
                  <div className="mt-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
                    <div className="flex items-center gap-2 mb-2">
                      <Truck size={20} className="text-blue-600" />
                      <h4 className="font-semibold text-blue-900">Tracking Information</h4>
                    </div>
                    <p className="text-blue-800">{orderData.trackingInfo}</p>
                  </div>
                )}

                {/* Delivery Date */}
                {orderData.deliveryDate && (
                  <div className="mt-4 p-4 bg-green-50 rounded-lg border border-green-200">
                    <div className="flex items-center gap-2 mb-2">
                      <CheckCircle size={20} className="text-green-600" />
                      <h4 className="font-semibold text-green-900">Delivered</h4>
                    </div>
                    <p className="text-green-800">Delivered on {formatDate(orderData.deliveryDate)}</p>
                  </div>
                )}
              </div>

              {/* Order Details */}
              <div className="bg-white rounded-xl shadow-lg p-8">
                <h3 className="text-xl font-semibold text-gray-900 mb-6">Order Details</h3>
                
                {/* Customer Info */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                  <div>
                    <h4 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                      <User size={18} className="text-purple-600" />
                      Customer Information
                    </h4>
                    <div className="space-y-2 text-sm">
                      <p><span className="text-gray-600">Name:</span> <span className="font-medium">{orderData.customerInfo.fullName}</span></p>
                      <p><span className="text-gray-600">Email:</span> <span className="font-medium">{orderData.customerInfo.email}</span></p>
                      <p><span className="text-gray-600">Phone:</span> <span className="font-medium">{orderData.customerInfo.phone}</span></p>
                    </div>
                  </div>

                  <div>
                    <h4 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                      <MapPin size={18} className="text-purple-600" />
                      Shipping Address
                    </h4>
                    <div className="space-y-1 text-sm">
                      <p className="font-medium">{orderData.shippingAddress.address}</p>
                      <p>{orderData.shippingAddress.city}, {orderData.shippingAddress.postalCode}</p>
                      <p>{orderData.shippingAddress.country}</p>
                    </div>
                  </div>
                </div>

               {/* Order Items - FULLY FIXED with proper image display logic */}
<div className="mb-8">
  <h4 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
    <Package size={18} className="text-purple-600" />
    Order Items ({orderData.totals.itemCount})
  </h4>
  <div className="space-y-4">
    {orderData.items.map((item, index) => {
      // Debug logging - remove this after testing
      console.log(`🖼️ Item ${index + 1}:`, {
        name: item.productName,
        hasProduct: !!item.product,
        hasImages: !!(item.product?.images),
        imageCount: item.product?.images?.length || 0,
        firstImageUrl: item.product?.images?.[0]?.url
      });

      return (
        <div key={index} className="flex items-center gap-4 p-4 bg-gray-50 rounded-lg">
          
          {/* ✅ COMPLETELY FIXED: Product Image Display */}
          <div className="w-16 h-16 bg-gray-200 rounded-lg overflow-hidden flex-shrink-0 relative">
            {item.product?.images && 
             item.product.images.length > 0 && 
             item.product.images[0]?.url ? (
              <img
                src={item.product.images[0].url}
                alt={item.product.images[0]?.alt || item.productName || 'Product image'}
                className="w-full h-full object-cover"
                onLoad={() => {
                  console.log('✅ Image loaded successfully:', item.product.images[0].url);
                }}
                onError={(e) => {
                  console.warn('❌ Image failed to load:', item.product.images[0].url);
                  // Hide the broken image and show fallback
                  e.target.style.display = 'none';
                  const fallback = e.target.parentNode.querySelector('.image-fallback');
                  if (fallback) {
                    fallback.style.display = 'flex';
                  }
                }}
              />
            ) : null}
            
            {/* ✅ FIXED: Fallback placeholder - always render but conditionally show */}
            <div 
              className="image-fallback absolute inset-0 w-full h-full flex items-center justify-center bg-gray-200"
              style={{
                display: (item.product?.images && 
                         item.product.images.length > 0 && 
                         item.product.images[0]?.url) ? 'none' : 'flex'
              }}
            >
              <Package size={24} className="text-gray-400" />
            </div>
          </div>
          
          <div className="flex-1">
            <h5 className="font-semibold text-gray-900">{item.productName}</h5>
            {item.brand && <p className="text-sm text-gray-600">{item.brand}</p>}
            
            {/* Product Options */}
            {item.selectedOptions && Object.keys(item.selectedOptions).length > 0 && (
              <div className="flex flex-wrap gap-2 mt-2">
                {item.selectedOptions.nicotineStrength && (
                  <span className="inline-flex items-center gap-1 bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded-full">
                    <Droplets size={10} />
                    {item.selectedOptions.nicotineStrength}
                  </span>
                )}
                {item.selectedOptions.vgPgRatio && (
                  <span className="inline-flex items-center gap-1 bg-green-100 text-green-800 text-xs px-2 py-1 rounded-full">
                    <Percent size={10} />
                    {item.selectedOptions.vgPgRatio}
                  </span>
                )}
                {item.selectedOptions.color && (
                  <span className="inline-flex items-center gap-1 bg-purple-100 text-purple-800 text-xs px-2 py-1 rounded-full">
                    <Tag size={10} />
                    {item.selectedOptions.color}
                  </span>
                )}
              </div>
            )}
            
            <div className="flex items-center gap-4 mt-2">
              <span className="text-sm text-gray-600">Qty: {item.quantity}</span>
              <span className="text-sm font-medium">BDT {item.price.toLocaleString()}</span>
            </div>
          </div>
          <div className="text-right">
            <p className="font-semibold text-gray-900">BDT {item.itemTotal.toLocaleString()}</p>
          </div>
        </div>
      );
    })}
  </div>
</div>















                {/* Order Summary */}
                <div className="border-t pt-6">
                  <h4 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
                    <CreditCard size={18} className="text-purple-600" />
                    Order Summary
                  </h4>
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Subtotal ({orderData.totals.totalQuantity} items)</span>
                      <span className="font-medium">BDT {orderData.totals.subtotal.toLocaleString()}</span>
                    </div>
                    {orderData.totals.tax > 0 && (
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600">Tax</span>
                        <span className="font-medium">BDT {orderData.totals.tax.toLocaleString()}</span>
                      </div>
                    )}
                    {orderData.totals.shipping > 0 && (
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600">Shipping</span>
                        <span className="font-medium">BDT {orderData.totals.shipping.toLocaleString()}</span>
                      </div>
                    )}
                    <div className="border-t pt-2">
                      <div className="flex justify-between text-lg font-bold">
                        <span>Total</span>
                        <span className="text-purple-600">BDT {orderData.totals.total.toLocaleString()}</span>
                      </div>
                    </div>
                  </div>

                  {/* Payment Method */}
                  <div className="mt-4 p-3 bg-gray-50 rounded-lg">
                    <span className="text-sm text-gray-600">Payment Method: </span>
                    <span className="text-sm font-medium capitalize">{orderData.paymentInfo.method}</span>
                    {orderData.paymentInfo.cardLast4 && (
                      <span className="text-sm text-gray-600"> ending in {orderData.paymentInfo.cardLast4}</span>
                    )}
                  </div>
                </div>

                {/* Order Notes */}
                {orderData.orderNotes && (
                  <div className="mt-6 p-4 bg-yellow-50 rounded-lg border border-yellow-200">
                    <h4 className="font-semibold text-yellow-900 mb-2">Order Notes</h4>
                    <p className="text-yellow-800 text-sm">{orderData.orderNotes}</p>
                  </div>
                )}
              </div>

              {/* Actions */}
              <div className="bg-white rounded-xl shadow-lg p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Need Help?</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <button className="flex items-center gap-3 p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors text-left">
                    <Phone size={20} className="text-purple-600" />
                    <div>
                      <p className="font-medium text-gray-900">Call Us</p>
                      <p className="text-sm text-gray-600">Get instant support</p>
                    </div>
                  </button>
                  
                  <button className="flex items-center gap-3 p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors text-left">
                    <Mail size={20} className="text-purple-600" />
                    <div>
                      <p className="font-medium text-gray-900">Email Us</p>
                      <p className="text-sm text-gray-600">Send us a message</p>
                    </div>
                  </button>
                  
                  <button 
                    onClick={() => router.push('/products')}
                    className="flex items-center gap-3 p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors text-left"
                  >
                    <ShoppingCart size={20} className="text-purple-600" />
                    <div>
                      <p className="font-medium text-gray-900">Shop Again</p>
                      <p className="text-sm text-gray-600">Browse products</p>
                    </div>
                  </button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
