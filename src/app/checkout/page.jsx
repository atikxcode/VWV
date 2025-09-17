'use client'

import React, { useState, useEffect, useMemo } from 'react';
import { useCart } from '../../../components/hooks/useCart';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ArrowLeft,
  CreditCard,
  Lock,
  Shield,
  MapPin,
  Phone,
  Mail,
  User,
  Package,
  ShoppingCart,
  CheckCircle,
  AlertCircle,
  Eye,
  EyeOff,
  Truck,
  DollarSign,
  Smartphone,
  Tag,
  Percent,
  Droplets,
  Wallet
} from 'lucide-react';
import Swal from 'sweetalert2';

export default function CheckoutPage() {
  const router = useRouter();
  const { cartItems, getCartTotal, clearCart } = useCart();
  
  // Form states
  const [customerInfo, setCustomerInfo] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    address: '',
    city: '',
    postalCode: '',
    country: 'Bangladesh'
  });

  const [paymentInfo, setPaymentInfo] = useState({
    method: 'cod', // Default to Cash on Delivery
    // Card payment
    cardNumber: '',
    expiryDate: '',
    cvv: '',
    cardName: '',
    // Mobile Banking
    bkashNumber: '',
    nagadNumber: '',
    rocketNumber: '',
    upayNumber: ''
  });

  const [orderNotes, setOrderNotes] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [showCvv, setShowCvv] = useState(false);
  const [errors, setErrors] = useState({});
  const [currentStep, setCurrentStep] = useState(1);

  // Payment methods configuration
  const paymentMethods = [
    {
      id: 'cod',
      name: 'Cash on Delivery',
      icon: DollarSign,
      description: 'Pay when you receive your order',
      color: 'text-green-600',
      bgColor: 'bg-green-100',
      popular: true
    },
    {
      id: 'bkash',
      name: 'bKash',
      icon: Smartphone,
      description: 'Pay with bKash mobile banking',
      color: 'text-pink-600',
      bgColor: 'bg-pink-100'
    },
    {
      id: 'nagad',
      name: 'Nagad',
      icon: Smartphone,
      description: 'Pay with Nagad mobile banking',
      color: 'text-orange-600',
      bgColor: 'bg-orange-100'
    },
    {
      id: 'rocket',
      name: 'Rocket',
      icon: Smartphone,
      description: 'Pay with Rocket mobile banking',
      color: 'text-purple-600',
      bgColor: 'bg-purple-100'
    },
    {
      id: 'upay',
      name: 'Upay',
      icon: Smartphone,
      description: 'Pay with Upay mobile banking',
      color: 'text-blue-600',
      bgColor: 'bg-blue-100'
    },
    {
      id: 'card',
      name: 'Credit/Debit Card',
      icon: CreditCard,
      description: 'Visa, Mastercard, and other cards',
      color: 'text-indigo-600',
      bgColor: 'bg-indigo-100'
    }
  ];

  // Redirect if cart is empty
  useEffect(() => {
    if (cartItems.length === 0) {
      router.push('/cart');
    }
  }, [cartItems, router]);

  // Calculate totals
  const orderSummary = useMemo(() => {
    const subtotal = getCartTotal();
    const total = subtotal;
    const itemCount = cartItems.reduce((sum, item) => sum + item.quantity, 0);
    
    return { subtotal, total, itemCount };
  }, [cartItems, getCartTotal]);

  // Form validation
  const validateForm = () => {
    const newErrors = {};
    
    // Customer Info Validation
    if (!customerInfo.firstName.trim()) newErrors.firstName = 'First name is required';
    if (!customerInfo.lastName.trim()) newErrors.lastName = 'Last name is required';
    if (!customerInfo.email.trim()) newErrors.email = 'Email is required';
    else if (!/\S+@\S+\.\S+/.test(customerInfo.email)) newErrors.email = 'Email is invalid';
    if (!customerInfo.phone.trim()) newErrors.phone = 'Phone number is required';
    else if (!/^(\+88)?01[3-9]\d{8}$/.test(customerInfo.phone)) newErrors.phone = 'Please enter a valid Bangladeshi phone number';
    if (!customerInfo.address.trim()) newErrors.address = 'Address is required';
    if (!customerInfo.city.trim()) newErrors.city = 'City is required';

    // Payment Validation based on method
    if (paymentInfo.method === 'card') {
      if (!paymentInfo.cardNumber.trim()) newErrors.cardNumber = 'Card number is required';
      else if (!/^\d{16}$/.test(paymentInfo.cardNumber.replace(/\s/g, ''))) newErrors.cardNumber = 'Card number must be 16 digits';
      if (!paymentInfo.expiryDate.trim()) newErrors.expiryDate = 'Expiry date is required';
      if (!paymentInfo.cvv.trim()) newErrors.cvv = 'CVV is required';
      else if (!/^\d{3,4}$/.test(paymentInfo.cvv)) newErrors.cvv = 'CVV must be 3-4 digits';
      if (!paymentInfo.cardName.trim()) newErrors.cardName = 'Cardholder name is required';
    } else if (paymentInfo.method === 'bkash') {
      if (!paymentInfo.bkashNumber.trim()) newErrors.bkashNumber = 'bKash number is required';
      else if (!/^(\+88)?01[3-9]\d{8}$/.test(paymentInfo.bkashNumber)) newErrors.bkashNumber = 'Please enter a valid bKash number';
    } else if (paymentInfo.method === 'nagad') {
      if (!paymentInfo.nagadNumber.trim()) newErrors.nagadNumber = 'Nagad number is required';
      else if (!/^(\+88)?01[3-9]\d{8}$/.test(paymentInfo.nagadNumber)) newErrors.nagadNumber = 'Please enter a valid Nagad number';
    } else if (paymentInfo.method === 'rocket') {
      if (!paymentInfo.rocketNumber.trim()) newErrors.rocketNumber = 'Rocket number is required';
      else if (!/^(\+88)?01[3-9]\d{8}$/.test(paymentInfo.rocketNumber)) newErrors.rocketNumber = 'Please enter a valid Rocket number';
    } else if (paymentInfo.method === 'upay') {
      if (!paymentInfo.upayNumber.trim()) newErrors.upayNumber = 'Upay number is required';
      else if (!/^(\+88)?01[3-9]\d{8}$/.test(paymentInfo.upayNumber)) newErrors.upayNumber = 'Please enter a valid Upay number';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      Swal.fire({
        title: 'Validation Error',
        text: 'Please fill in all required fields correctly.',
        icon: 'error',
        confirmButtonColor: '#8b5cf6'
      });
      return;
    }

    setIsProcessing(true);

    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 3000));

      // Clear cart after successful order
      clearCart();

      const selectedPaymentMethod = paymentMethods.find(method => method.id === paymentInfo.method);

      // Success message and redirect
      await Swal.fire({
        title: 'Order Placed Successfully!',
        html: `
          <div class="text-left">
            <p class="text-gray-700 mb-4">Thank you for your order!</p>
            <div class="bg-gray-100 p-4 rounded-lg">
              <p class="font-semibold text-gray-900">Order Details:</p>
              <p class="text-sm text-gray-600">Order ID: #VWV${Date.now()}</p>
              <p class="text-sm text-gray-600">Total: BDT ${orderSummary.total.toLocaleString()}</p>
              <p class="text-sm text-gray-600">Items: ${orderSummary.itemCount}</p>
              <p class="text-sm text-gray-600">Payment: ${selectedPaymentMethod.name}</p>
            </div>
            <p class="text-sm text-gray-600 mt-4">You will receive a confirmation email shortly.</p>
          </div>
        `,
        icon: 'success',
        confirmButtonText: 'Continue Shopping',
        confirmButtonColor: '#8b5cf6'
      });

      router.push('/products');
    } catch (error) {
      Swal.fire({
        title: 'Order Failed',
        text: 'There was an error processing your order. Please try again.',
        icon: 'error',
        confirmButtonColor: '#8b5cf6'
      });
    } finally {
      setIsProcessing(false);
    }
  };

  // Format card number with spaces
  const formatCardNumber = (value) => {
    const v = value.replace(/\s+/g, '').replace(/[^0-9]/gi, '');
    const matches = v.match(/\d{4,16}/g);
    const match = matches && matches[0] || '';
    const parts = [];
    for (let i = 0, len = match.length; i < len; i += 4) {
      parts.push(match.substring(i, i + 4));
    }
    if (parts.length) {
      return parts.join(' ');
    } else {
      return v;
    }
  };

  // Format expiry date
  const formatExpiryDate = (value) => {
    const v = value.replace(/\D/g, '');
    if (v.length >= 2) {
      return `${v.slice(0, 2)}/${v.slice(2, 4)}`;
    }
    return v;
  };

  if (cartItems.length === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Package size={64} className="mx-auto text-gray-400 mb-4" />
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      <div className="max-w-7xl mx-auto px-4 py-8">
        
        {/* Header */}
        <motion.div 
          className="flex items-center justify-between mb-8"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <div className="flex items-center gap-4">
            <button
              onClick={() => router.push('/cart')}
              className="p-2 rounded-lg bg-white shadow-md hover:shadow-lg transition-all duration-200 hover:scale-105"
            >
              <ArrowLeft size={20} className="text-gray-600" />
            </button>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Checkout</h1>
              <p className="text-gray-600">Complete your order securely</p>
            </div>
          </div>
          
          {/* Security Badge */}
          <div className="flex items-center gap-2 bg-green-100 text-green-700 px-4 py-2 rounded-lg">
            <Shield size={20} />
            <span className="font-medium">256-bit SSL Secure</span>
          </div>
        </motion.div>

        {/* Progress Steps */}
        <div className="mb-8">
          <div className="flex items-center justify-center space-x-4">
            {[1, 2, 3].map((step) => (
              <div key={step} className="flex items-center">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                  currentStep >= step ? 'bg-purple-600 text-white' : 'bg-gray-200 text-gray-600'
                }`}>
                  {step < currentStep ? <CheckCircle size={20} /> : step}
                </div>
                {step < 3 && <div className={`w-16 h-1 ${currentStep > step ? 'bg-purple-600' : 'bg-gray-200'}`} />}
              </div>
            ))}
          </div>
          <div className="flex justify-between mt-2 text-sm text-gray-600 max-w-md mx-auto">
            <span>Customer Info</span>
            <span>Payment</span>
            <span>Confirmation</span>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Main Checkout Form */}
          <div className="lg:col-span-2 space-y-6">
            
            {/* Customer Information */}
            <motion.div
              className="bg-white rounded-xl shadow-lg p-6"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5, delay: 0.1 }}
            >
              <h2 className="text-xl font-semibold text-gray-900 mb-6 flex items-center gap-2">
                <User size={20} className="text-purple-600" />
                Customer Information
              </h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">First Name *</label>
                  <input
                    type="text"
                    value={customerInfo.firstName}
                    onChange={(e) => setCustomerInfo({...customerInfo, firstName: e.target.value})}
                    className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 ${
                      errors.firstName ? 'border-red-500' : 'border-gray-300'
                    }`}
                    placeholder="Enter first name"
                  />
                  {errors.firstName && <p className="text-red-500 text-xs mt-1">{errors.firstName}</p>}
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Last Name *</label>
                  <input
                    type="text"
                    value={customerInfo.lastName}
                    onChange={(e) => setCustomerInfo({...customerInfo, lastName: e.target.value})}
                    className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 ${
                      errors.lastName ? 'border-red-500' : 'border-gray-300'
                    }`}
                    placeholder="Enter last name"
                  />
                  {errors.lastName && <p className="text-red-500 text-xs mt-1">{errors.lastName}</p>}
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Email *</label>
                  <input
                    type="email"
                    value={customerInfo.email}
                    onChange={(e) => setCustomerInfo({...customerInfo, email: e.target.value})}
                    className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 ${
                      errors.email ? 'border-red-500' : 'border-gray-300'
                    }`}
                    placeholder="Enter email address"
                  />
                  {errors.email && <p className="text-red-500 text-xs mt-1">{errors.email}</p>}
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Phone *</label>
                  <input
                    type="tel"
                    value={customerInfo.phone}
                    onChange={(e) => setCustomerInfo({...customerInfo, phone: e.target.value})}
                    className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 ${
                      errors.phone ? 'border-red-500' : 'border-gray-300'
                    }`}
                    placeholder="01XXXXXXXXX"
                  />
                  {errors.phone && <p className="text-red-500 text-xs mt-1">{errors.phone}</p>}
                </div>
                
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Address *</label>
                  <input
                    type="text"
                    value={customerInfo.address}
                    onChange={(e) => setCustomerInfo({...customerInfo, address: e.target.value})}
                    className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 ${
                      errors.address ? 'border-red-500' : 'border-gray-300'
                    }`}
                    placeholder="Enter full address"
                  />
                  {errors.address && <p className="text-red-500 text-xs mt-1">{errors.address}</p>}
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">City *</label>
                  <input
                    type="text"
                    value={customerInfo.city}
                    onChange={(e) => setCustomerInfo({...customerInfo, city: e.target.value})}
                    className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 ${
                      errors.city ? 'border-red-500' : 'border-gray-300'
                    }`}
                    placeholder="Enter city"
                  />
                  {errors.city && <p className="text-red-500 text-xs mt-1">{errors.city}</p>}
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Postal Code</label>
                  <input
                    type="text"
                    value={customerInfo.postalCode}
                    onChange={(e) => setCustomerInfo({...customerInfo, postalCode: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                    placeholder="Enter postal code"
                  />
                </div>
              </div>
            </motion.div>

            {/* Payment Methods */}
            <motion.div
              className="bg-white rounded-xl shadow-lg p-6"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
            >
              <h2 className="text-xl font-semibold text-gray-900 mb-6 flex items-center gap-2">
                <Wallet size={20} className="text-purple-600" />
                Payment Method
              </h2>
              
              {/* Payment Method Selection */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
                {paymentMethods.map((method) => {
                  const IconComponent = method.icon;
                  return (
                    <motion.div
                      key={method.id}
                      className={`relative p-4 border-2 rounded-lg cursor-pointer transition-all duration-200 ${
                        paymentInfo.method === method.id
                          ? 'border-purple-500 bg-purple-50'
                          : 'border-gray-200 hover:border-purple-300'
                      }`}
                      onClick={() => setPaymentInfo({...paymentInfo, method: method.id})}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                    >
                      {method.popular && (
                        <div className="absolute -top-2 -right-2 bg-green-500 text-white text-xs px-2 py-1 rounded-full">
                          Popular
                        </div>
                      )}
                      <div className={`w-12 h-12 ${method.bgColor} rounded-lg flex items-center justify-center mb-3`}>
                        <IconComponent size={24} className={method.color} />
                      </div>
                      <h3 className="font-semibold text-gray-900 mb-1">{method.name}</h3>
                      <p className="text-sm text-gray-600">{method.description}</p>
                      
                      {/* Selection indicator */}
                      {paymentInfo.method === method.id && (
                        <div className="absolute top-2 right-2">
                          <CheckCircle size={20} className="text-purple-600" />
                        </div>
                      )}
                    </motion.div>
                  );
                })}
              </div>

              {/* Payment Method Forms */}
              <AnimatePresence mode="wait">
                {/* Cash on Delivery */}
                {paymentInfo.method === 'cod' && (
                  <motion.div
                    key="cod"
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="p-4 bg-green-50 rounded-lg border border-green-200"
                  >
                    <div className="flex items-center gap-3 mb-2">
                      <DollarSign size={20} className="text-green-600" />
                      <h4 className="font-semibold text-green-800">Cash on Delivery</h4>
                    </div>
                    <p className="text-green-700 text-sm">
                      Pay with cash when your order is delivered to your doorstep. 
                      No advance payment required.
                    </p>
                  </motion.div>
                )}

                {/* Mobile Banking Forms */}
                {['bkash', 'nagad', 'rocket', 'upay'].includes(paymentInfo.method) && (
                  <motion.div
                    key={paymentInfo.method}
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="space-y-4"
                  >
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        {paymentInfo.method.charAt(0).toUpperCase() + paymentInfo.method.slice(1)} Number *
                      </label>
                      <input
                        type="tel"
                        value={paymentInfo[`${paymentInfo.method}Number`]}
                        onChange={(e) => setPaymentInfo({
                          ...paymentInfo, 
                          [`${paymentInfo.method}Number`]: e.target.value
                        })}
                        className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 ${
                          errors[`${paymentInfo.method}Number`] ? 'border-red-500' : 'border-gray-300'
                        }`}
                        placeholder="01XXXXXXXXX"
                      />
                      {errors[`${paymentInfo.method}Number`] && (
                        <p className="text-red-500 text-xs mt-1">{errors[`${paymentInfo.method}Number`]}</p>
                      )}
                    </div>
                    
                    <div className="p-3 bg-blue-50 rounded-lg border border-blue-200">
                      <p className="text-sm text-blue-800 font-medium mb-1">Payment Instructions:</p>
                      <ul className="text-xs text-blue-700 space-y-1">
                        <li>• You will receive a payment request on your mobile</li>
                        <li>• Enter your {paymentInfo.method.toUpperCase()} PIN to complete payment</li>
                        <li>• Keep your phone nearby for the payment request</li>
                      </ul>
                    </div>
                  </motion.div>
                )}

                {/* Credit/Debit Card Form */}
                {paymentInfo.method === 'card' && (
                  <motion.div
                    key="card"
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="space-y-4"
                  >
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Card Number *</label>
                      <input
                        type="text"
                        value={formatCardNumber(paymentInfo.cardNumber)}
                        onChange={(e) => setPaymentInfo({
                          ...paymentInfo, 
                          cardNumber: e.target.value.replace(/\s/g, '')
                        })}
                        className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 ${
                          errors.cardNumber ? 'border-red-500' : 'border-gray-300'
                        }`}
                        placeholder="1234 5678 9012 3456"
                        maxLength="19"
                      />
                      {errors.cardNumber && <p className="text-red-500 text-xs mt-1">{errors.cardNumber}</p>}
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Expiry Date *</label>
                        <input
                          type="text"
                          value={formatExpiryDate(paymentInfo.expiryDate)}
                          onChange={(e) => setPaymentInfo({
                            ...paymentInfo, 
                            expiryDate: e.target.value.replace(/\D/g, '')
                          })}
                          className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 ${
                            errors.expiryDate ? 'border-red-500' : 'border-gray-300'
                          }`}
                          placeholder="MM/YY"
                          maxLength="5"
                        />
                        {errors.expiryDate && <p className="text-red-500 text-xs mt-1">{errors.expiryDate}</p>}
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">CVV *</label>
                        <div className="relative">
                          <input
                            type={showCvv ? "text" : "password"}
                            value={paymentInfo.cvv}
                            onChange={(e) => setPaymentInfo({
                              ...paymentInfo, 
                              cvv: e.target.value.replace(/\D/g, '')
                            })}
                            className={`w-full px-3 py-2 pr-10 border rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 ${
                              errors.cvv ? 'border-red-500' : 'border-gray-300'
                            }`}
                            placeholder="123"
                            maxLength="4"
                          />
                          <button
                            type="button"
                            onClick={() => setShowCvv(!showCvv)}
                            className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                          >
                            {showCvv ? <EyeOff size={16} /> : <Eye size={16} />}
                          </button>
                        </div>
                        {errors.cvv && <p className="text-red-500 text-xs mt-1">{errors.cvv}</p>}
                      </div>
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Cardholder Name *</label>
                      <input
                        type="text"
                        value={paymentInfo.cardName}
                        onChange={(e) => setPaymentInfo({...paymentInfo, cardName: e.target.value})}
                        className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 ${
                          errors.cardName ? 'border-red-500' : 'border-gray-300'
                        }`}
                        placeholder="Name on card"
                      />
                      {errors.cardName && <p className="text-red-500 text-xs mt-1">{errors.cardName}</p>}
                    </div>
                    
                    {/* Supported Cards */}
                    <div className="flex items-center gap-4 text-sm text-gray-600">
                      <span>Accepted:</span>
                      <div className="flex gap-2">
                        <div className="px-2 py-1 bg-blue-100 text-blue-700 rounded text-xs font-medium">VISA</div>
                        <div className="px-2 py-1 bg-red-100 text-red-700 rounded text-xs font-medium">Mastercard</div>
                        <div className="px-2 py-1 bg-gray-100 text-gray-700 rounded text-xs font-medium">AMEX</div>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>

            {/* Order Notes */}
            <motion.div
              className="bg-white rounded-xl shadow-lg p-6"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5, delay: 0.3 }}
            >
              <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <Package size={20} className="text-purple-600" />
                Order Notes (Optional)
              </h2>
              
              <textarea
                value={orderNotes}
                onChange={(e) => setOrderNotes(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 resize-none"
                rows="3"
                placeholder="Any special instructions for your order..."
              />
            </motion.div>

            {/* Place Order Button */}
            <motion.button
              type="submit"
              onClick={handleSubmit}
              disabled={isProcessing}
              className={`w-full py-4 rounded-xl font-bold text-lg transition-all duration-200 flex items-center justify-center gap-2 ${
                isProcessing
                  ? 'bg-gray-400 cursor-not-allowed'
                  : 'bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800 transform hover:scale-105 shadow-lg'
              } text-white`}
              whileHover={!isProcessing ? { scale: 1.02 } : {}}
              whileTap={!isProcessing ? { scale: 0.98 } : {}}
            >
              {isProcessing ? (
                <>
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                  Processing Order...
                </>
              ) : (
                <>
                  <Lock size={20} />
                  Place Order - BDT {orderSummary.total.toLocaleString()}
                </>
              )}
            </motion.button>
          </div>

          {/* Order Summary Sidebar */}
          <div className="lg:col-span-1">
            <motion.div
              className="bg-white rounded-xl shadow-lg overflow-hidden sticky top-8"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5, delay: 0.4 }}
            >
              {/* Order Summary Header */}
              <div className="p-6 bg-gradient-to-r from-purple-600 to-purple-700 text-white">
                <h3 className="text-xl font-semibold flex items-center gap-2">
                  <ShoppingCart size={20} />
                  Order Summary
                </h3>
              </div>
              
              {/* Items List */}
              <div className="p-6 max-h-64 overflow-y-auto">
                <div className="space-y-4">
                  {cartItems.map((item) => (
                    <div key={item.id} className="flex items-start gap-3">
                      <div className="relative w-12 h-12 flex-shrink-0">
                        {item.product.images?.[0]?.url ? (
                          <Image
                            src={item.product.images[0].url}
                            alt={item.product.name}
                            fill
                            className="object-cover rounded"
                            sizes="48px"
                          />
                        ) : (
                          <div className="w-full h-full bg-gray-200 rounded flex items-center justify-center">
                            <Package size={16} className="text-gray-400" />
                          </div>
                        )}
                      </div>
                      
                      <div className="flex-1 min-w-0">
                        <h4 className="text-sm font-medium text-gray-900 line-clamp-2">
                          {item.product.name}
                        </h4>
                        
                        {/* Selected Options */}
                        {item.selectedOptions && Object.keys(item.selectedOptions).length > 0 && (
                          <div className="flex flex-wrap gap-1 mt-1">
                            {item.selectedOptions.nicotineStrength && (
                              <span className="inline-flex items-center gap-1 bg-blue-100 text-blue-800 text-xs px-1 py-0.5 rounded">
                                <Droplets size={8} />
                                {item.selectedOptions.nicotineStrength}
                              </span>
                            )}
                            {item.selectedOptions.vgPgRatio && (
                              <span className="inline-flex items-center gap-1 bg-green-100 text-green-800 text-xs px-1 py-0.5 rounded">
                                <Percent size={8} />
                                {item.selectedOptions.vgPgRatio}
                              </span>
                            )}
                            {item.selectedOptions.color && (
                              <span className="inline-flex items-center gap-1 bg-purple-100 text-purple-800 text-xs px-1 py-0.5 rounded">
                                <Tag size={8} />
                                {item.selectedOptions.color}
                              </span>
                            )}
                          </div>
                        )}
                        
                        <div className="flex justify-between items-center mt-1">
                          <span className="text-xs text-gray-500">Qty: {item.quantity}</span>
                          <span className="text-sm font-semibold text-purple-600">
                            BDT {(item.product.price * item.quantity).toLocaleString()}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              
              {/* Order Totals */}
              <div className="p-6 border-t border-gray-200">
                <div className="space-y-3">
                  <div className="flex justify-between text-gray-600">
                    <span>Subtotal ({orderSummary.itemCount} items)</span>
                    <span>BDT {orderSummary.subtotal.toLocaleString()}</span>
                  </div>
                </div>
                
                <div className="border-t pt-3 mt-3">
                  <div className="flex justify-between items-center text-xl font-bold text-gray-900">
                    <span>Total</span>
                    <span className="text-purple-600">BDT {orderSummary.total.toLocaleString()}</span>
                  </div>
                </div>
              </div>
              
              {/* Security & Trust Indicators */}
              <div className="p-6 bg-gray-50 border-t">
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <Shield size={16} className="text-green-600" />
                    <span>256-bit SSL encryption</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <Lock size={16} className="text-green-600" />
                    <span>Secure payment processing</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <CheckCircle size={16} className="text-green-600" />
                    <span>Order confirmation via email</span>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </div>
      
      {/* Custom Styles */}
      <style jsx global>{`
        .line-clamp-2 {
          display: -webkit-box;
          -webkit-line-clamp: 2;
          -webkit-box-orient: vertical;
          overflow: hidden;
        }
      `}</style>
    </div>
  );
}
