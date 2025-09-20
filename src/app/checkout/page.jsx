'use client'

import React, { useState, useEffect, useMemo, useContext } from 'react';
import { useCart } from '../../../components/hooks/useCart';
import { useRouter } from 'next/navigation';
import { AuthContext } from '../../../Provider/AuthProvider';
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
  Wallet,
  Save,
  RefreshCw,
  Store
} from 'lucide-react';
import Swal from 'sweetalert2';

export default function CheckoutPage() {
  const router = useRouter();
  const { cartItems, getCartTotal, clearCart, getAvailableBranchesText } = useCart();
  const { user, loading: authLoading } = useContext(AuthContext);
  
  // Form states - using single name field
  const [customerInfo, setCustomerInfo] = useState({
    fullName: '',
    email: '',
    phone: '',
    address: '',
    city: '',
    postalCode: '',
    country: 'Bangladesh'
  });

  const [paymentInfo, setPaymentInfo] = useState({
    method: 'cod',
    cardNumber: '',
    expiryDate: '',
    cvv: '',
    cardName: '',
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
  const [userDataLoaded, setUserDataLoaded] = useState(false);
  const [saveForFuture, setSaveForFuture] = useState(false);
  const [isLoadingUserData, setIsLoadingUserData] = useState(false);

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

  // Enhanced database fetching with proper authentication headers
  const loadUserData = async () => {
    if (isLoadingUserData) return;
    
    setIsLoadingUserData(true);
    let userDataFound = false;

    try {
      console.log('🔍 Starting user data fetch...');
      console.log('🔍 Firebase user:', user);
      console.log('🔍 Auth loading:', authLoading);

      // 1. Check if user is authenticated
      if (user && user.email) {
        console.log('✅ Authenticated user found:', user.email);
        
        try {
          // Enhanced: Get Firebase token for API authentication
          const token = await user.getIdToken();
          console.log('🔑 Got Firebase token');

          // 2. Make authenticated API call to fetch user data
          const response = await fetch(`/api/user?email=${encodeURIComponent(user.email)}`, {
            method: 'GET',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${token}`, // Add Firebase token
            },
          });

          console.log('📡 API Response status:', response.status);
          console.log('📡 API Response ok:', response.ok);

          if (response.ok) {
            const data = await response.json();
            console.log('📦 Raw API response:', data);

            // Fixed: Check for user data properly
            if (data.exists && data.user) {
              console.log('✅ User data found in database:', data.user);
              console.log('📝 User name:', data.user.name);
              console.log('📞 User phone:', data.user.phone);
              console.log('📧 User email:', data.user.email);
              
              // Set the form data with database values
              setCustomerInfo(prev => ({
                ...prev,
                fullName: data.user.name || '',
                email: data.user.email || user.email,
                phone: data.user.phone || '',
              }));
              
              userDataFound = true;
              console.log('✅ Form fields updated with database data');

            } else if (data.user && !data.exists) {
              // Handle case where API returns user data without exists flag
              console.log('✅ User data found (fallback):', data.user);
              setCustomerInfo(prev => ({
                ...prev,
                fullName: data.user.name || '',
                email: data.user.email || user.email,
                phone: data.user.phone || '',
              }));
              userDataFound = true;

            } else {
              console.log('⚠️ User not found in database');
            }
          } else {
            console.error('❌ API request failed:', response.status, response.statusText);
            const errorText = await response.text();
            console.error('❌ Error response:', errorText);
          }
        } catch (dbError) {
          console.error('❌ Database lookup error:', dbError);
          console.error('❌ Error stack:', dbError.stack);
        }
      } else {
        console.log('⚠️ No authenticated user found');
      }

      // 3. Fallback to localStorage if no database data
      if (!userDataFound) {
        console.log('🔍 Checking localStorage...');
        const savedData = localStorage.getItem('vwv-checkout-data');
        if (savedData) {
          try {
            const parsedData = JSON.parse(savedData);
            console.log('🔍 Found saved checkout data:', parsedData);
            
            setCustomerInfo(prev => ({
              ...prev,
              ...parsedData,
              email: user?.email || parsedData.email || ''
            }));
            
            userDataFound = true;
            console.log('✅ Used localStorage data');
          } catch (parseError) {
            console.error('❌ Error parsing localStorage data:', parseError);
            localStorage.removeItem('vwv-checkout-data');
          }
        } else {
          console.log('⚠️ No localStorage data found');
        }
      }

      // 4. Minimum fallback - set email if authenticated
      if (!userDataFound && user?.email) {
        console.log('🔧 Setting minimum data (email only)');
        setCustomerInfo(prev => ({
          ...prev,
          email: user.email
        }));
      }

    } catch (error) {
      console.error('❌ Critical error loading user data:', error);
      console.error('❌ Error stack:', error.stack);
    } finally {
      setIsLoadingUserData(false);
      setUserDataLoaded(true);
      console.log('✅ User data loading completed');
    }
  };

  // Save data to localStorage
  const saveToLocalStorage = () => {
    if (!customerInfo.fullName && !customerInfo.email && !customerInfo.phone) {
      return;
    }

    const dataToSave = {
      fullName: customerInfo.fullName,
      email: customerInfo.email,
      phone: customerInfo.phone,
      address: customerInfo.address,
      city: customerInfo.city,
      postalCode: customerInfo.postalCode,
      country: customerInfo.country
    };

    localStorage.setItem('vwv-checkout-data', JSON.stringify(dataToSave));
    console.log('💾 Checkout data saved to localStorage');
  };

  // Enhanced: Load user data with proper timing
  useEffect(() => {
    console.log('🔄 useEffect triggered - authLoading:', authLoading, 'user:', !!user);
    
    // Only load data when auth is complete and user is available
    if (!authLoading && !userDataLoaded) {
      console.log('🚀 Triggering user data load...');
      loadUserData();
    }
  }, [user, authLoading, userDataLoaded]);

  // Save to localStorage when enabled
  useEffect(() => {
    if (saveForFuture && customerInfo.email) {
      saveToLocalStorage();
    }
  }, [saveForFuture, customerInfo]);

  // Redirect if cart is empty
  useEffect(() => {
    if (cartItems.length === 0) {
      router.push('/cart');
    }
  }, [cartItems, router]);

  // 🆕 UPDATED: Calculate totals with delivery charges
  const orderSummary = useMemo(() => {
    const subtotal = getCartTotal();
    const itemCount = cartItems.reduce((sum, item) => sum + item.quantity, 0);
    
    // Calculate delivery charge based on city
    let deliveryCharge = 120; // Default for outside Dhaka
    if (customerInfo.city && customerInfo.city.toLowerCase() === 'dhaka') {
      deliveryCharge = 80;
    }
    
    const total = subtotal + deliveryCharge;
    
    return { subtotal, deliveryCharge, total, itemCount };
  }, [cartItems, getCartTotal, customerInfo.city]);

  // Form validation
  const validateForm = () => {
    const newErrors = {};
    
    if (!customerInfo.fullName.trim()) newErrors.fullName = 'Full name is required';
    if (!customerInfo.email.trim()) newErrors.email = 'Email is required';
    else if (!/\S+@\S+\.\S+/.test(customerInfo.email)) newErrors.email = 'Email is invalid';
    if (!customerInfo.phone.trim()) newErrors.phone = 'Phone number is required';
    else if (!/^(\+88)?01[3-9]\d{8}$/.test(customerInfo.phone)) newErrors.phone = 'Please enter a valid Bangladeshi phone number';
    if (!customerInfo.address.trim()) newErrors.address = 'Address is required';
    if (!customerInfo.city.trim()) newErrors.city = 'City is required';

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

  // 🔥 ENHANCED: Smart branch determination based on availability analysis
  const determineBestBranch = (cartItems) => {
    const branchAvailability = {};
    const allBranches = new Set();
    
    // Collect all branch data and count items per branch
    cartItems.forEach(item => {
      if (item.availableBranches && Array.isArray(item.availableBranches)) {
        item.availableBranches.forEach(branch => {
          allBranches.add(branch);
          if (!branchAvailability[branch]) {
            branchAvailability[branch] = { count: 0, items: [] };
          }
          branchAvailability[branch].count++;
          branchAvailability[branch].items.push({
            name: item.product.name,
            quantity: item.quantity,
            specifications: item.selectedOptions || {}
          });
        });
      }
    });

    console.log('🏪 Branch availability analysis:', {
      totalItems: cartItems.length,
      branchAvailability,
      allBranches: Array.from(allBranches)
    });

    // Find the branch that can fulfill the most items
    let bestBranch = null;
    let maxCoverage = 0;
    
    for (const [branch, data] of Object.entries(branchAvailability)) {
      const coveragePercentage = (data.count / cartItems.length) * 100;
      console.log(`🏪 ${branch.toUpperCase()}: ${data.count}/${cartItems.length} items (${coveragePercentage.toFixed(1)}%)`);
      
      if (data.count > maxCoverage) {
        maxCoverage = data.count;
        bestBranch = branch;
      }
    }

    // If no branch can fulfill all items, still choose the best one
    const selectedBranch = bestBranch || 'main';
    console.log(`🎯 Selected fulfillment branch: ${selectedBranch.toUpperCase()} (${maxCoverage}/${cartItems.length} items)`);
    
    return selectedBranch;
  };

  // 🆕 NEW: Get branch summary for order display
  const getBranchSummary = (cartItems) => {
    const branchItems = {};
    
    cartItems.forEach(item => {
      if (item.availableBranches && Array.isArray(item.availableBranches)) {
        item.availableBranches.forEach(branch => {
          if (!branchItems[branch]) {
            branchItems[branch] = [];
          }
          branchItems[branch].push(item.product.name);
        });
      }
    });

    return branchItems;
  };

  // Handle form submission with GUEST CHECKOUT support
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
      // Save data to localStorage if requested
      if (saveForFuture) {
        saveToLocalStorage();
      }

      console.log('🚀 Starting order submission...');
      console.log('👤 User status:', user ? `Logged in: ${user.email}` : 'Guest checkout');
      console.log('🛒 Cart items:', cartItems.length);
      console.log('💰 Total:', orderSummary.total);

      // Guest checkout: Authentication is optional
      let token = null;
      let isGuestOrder = !user;
      
      if (user) {
        try {
          token = await user.getIdToken();
          console.log('🔑 Firebase token obtained for authenticated user');
        } catch (tokenError) {
          console.warn('⚠️ Failed to get Firebase token, proceeding as guest:', tokenError);
          isGuestOrder = true;
        }
      } else {
        console.log('👤 Processing as guest checkout');
      }
      
      // 🔥 ENHANCED: Prepare order data with comprehensive branch information
      const primaryBranch = determineBestBranch(cartItems);
      const branchSummary = getBranchSummary(cartItems);
      
      const orderData = {
        items: cartItems.map(item => ({
          product: {
            _id: item.product._id,
            name: item.product.name,
            price: item.product.price,
            images: item.product.images || [],
            brand: item.product.brand || '',
            category: item.product.category || '',
            subcategory: item.product.subcategory || ''
          },
          quantity: item.quantity,
          selectedOptions: item.selectedOptions || {},
          availableBranches: item.availableBranches || [] // 🔥 Complete branch data for each item
        })),
        customerInfo: {
          fullName: customerInfo.fullName.trim(),
          email: customerInfo.email.toLowerCase().trim(),
          phone: customerInfo.phone.trim(),
          address: customerInfo.address.trim(),
          city: customerInfo.city.trim(),
          postalCode: customerInfo.postalCode.trim(),
          country: customerInfo.country || 'Bangladesh'
        },
        paymentInfo: {
          method: paymentInfo.method,
          // Include payment method specific data
          ...(paymentInfo.method === 'bkash' && { bkashNumber: paymentInfo.bkashNumber.trim() }),
          ...(paymentInfo.method === 'nagad' && { nagadNumber: paymentInfo.nagadNumber.trim() }),
          ...(paymentInfo.method === 'rocket' && { rocketNumber: paymentInfo.rocketNumber.trim() }),
          ...(paymentInfo.method === 'upay' && { upayNumber: paymentInfo.upayNumber.trim() }),
          ...(paymentInfo.method === 'card' && { 
            cardNumber: paymentInfo.cardNumber.replace(/\s/g, '').trim(),
            expiryDate: paymentInfo.expiryDate.trim(),
            cvv: paymentInfo.cvv.trim(),
            cardName: paymentInfo.cardName.trim()
          })
        },
        shippingAddress: customerInfo,
        orderNotes: orderNotes.trim(),
        // 🔥 ENHANCED: Complete branch information
        branch: primaryBranch, // Primary fulfillment branch
        branchData: {
          primaryBranch: primaryBranch,
          branchSummary: branchSummary, // Which items are available at which branches
          fulfillmentStrategy: 'single-branch' // Could be 'multi-branch' in future
        },
        // 🆕 NEW: Add delivery charge information
        deliveryCharge: orderSummary.deliveryCharge
      };

      console.log('📦 Order data prepared:', {
        itemCount: orderData.items.length,
        customerEmail: orderData.customerInfo.email,
        paymentMethod: orderData.paymentInfo.method,
        subtotal: orderSummary.subtotal,
        deliveryCharge: orderData.deliveryCharge,
        totalAmount: orderSummary.total,
        orderType: isGuestOrder ? 'guest' : 'registered',
        // 🔥 Enhanced branch logging
        primaryBranch: orderData.branch,
        branchSummary: orderData.branchData.branchSummary,
        itemsWithBranches: orderData.items.map(item => ({
          productName: item.product.name,
          availableBranches: item.availableBranches,
          selectedOptions: item.selectedOptions
        }))
      });

      // Submit order to backend API (with optional authentication)
      const headers = {
        'Content-Type': 'application/json',
        'X-Requested-With': 'XMLHttpRequest'
      };
      
      // Only add authorization header if we have a token
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }

      const response = await fetch('/api/orders', {
        method: 'POST',
        headers,
        body: JSON.stringify(orderData)
      });

      console.log('📡 API Response status:', response.status);

      // Handle API response
      if (!response.ok) {
        const errorData = await response.json();
        console.error('❌ Order API Error:', errorData);
        
        // Specific error handling
        if (response.status === 400) {
          throw new Error(errorData.error || 'Invalid order data. Please check your information.');
        } else if (response.status === 413) {
          throw new Error('Order data is too large. Please reduce the number of items.');
        } else {
          throw new Error(errorData.error || `Server error (${response.status}). Please try again.`);
        }
      }

      // Success: Parse successful response
      const result = await response.json();
      console.log('✅ Order created successfully:', result);

      if (!result.success || !result.order) {
        throw new Error('Invalid response from server. Please try again.');
      }

      // Clear cart after successful order
      clearCart();
      console.log('🧹 Cart cleared successfully');

      // Clear saved checkout data
      if (saveForFuture) {
        localStorage.removeItem('vwv-checkout-data');
      }

      // Show success message with order details
      const selectedPaymentMethod = paymentMethods.find(method => method.id === paymentInfo.method);
      
      await Swal.fire({
        title: isGuestOrder ? 'Guest Order Placed Successfully!' : 'Order Placed Successfully!',
        html: `
          <div class="text-left">
            <p class="text-gray-700 mb-4">Thank you for your order, ${customerInfo.fullName}!</p>
            
            ${isGuestOrder ? `
              <div class="bg-blue-50 p-3 rounded-lg mb-4 border border-blue-200">
                <p class="text-blue-800 font-medium text-sm mb-1">Guest Order:</p>
                <p class="text-blue-700 text-xs">
                  Your order has been placed as a guest. To track your order status in the future, 
                  please save your order ID or consider creating an account.
                </p>
              </div>
            ` : ''}
            
            <div class="bg-gray-100 p-4 rounded-lg mb-4">
              <p class="font-semibold text-gray-900 mb-2">Order Details:</p>
              <div class="text-sm text-gray-600 space-y-1">
                <p><span class="font-medium">Order ID:</span> <span class="font-mono bg-yellow-100 px-2 py-1 rounded">${result.order.orderId}</span></p>
                <p><span class="font-medium">Total Amount:</span> BDT ${result.order.totals.total.toLocaleString()}</p>
                <p><span class="font-medium">Items:</span> ${result.order.totals.itemCount} (${result.order.totals.totalQuantity} units)</p>
                <p><span class="font-medium">Payment Method:</span> ${selectedPaymentMethod?.name || paymentInfo.method}</p>
                <p><span class="font-medium">Status:</span> <span class="text-orange-600 font-medium">${result.order.status}</span></p>
                <p><span class="font-medium">Fulfillment Branch:</span> <span class="text-purple-600 font-medium">${primaryBranch.toUpperCase()}</span></p>
                <p><span class="font-medium">Order Type:</span> <span class="capitalize text-purple-600">${result.orderType}</span></p>
              </div>
            </div>
            
            ${paymentInfo.method !== 'cod' ? `
              <div class="bg-blue-50 p-3 rounded-lg mb-4 border border-blue-200">
                <p class="text-blue-800 font-medium text-sm mb-1">Next Steps:</p>
                <p class="text-blue-700 text-xs">
                  ${paymentInfo.method === 'card' 
                    ? 'Your card will be charged shortly. You will receive a payment confirmation.'
                    : `You will receive a payment request on your ${selectedPaymentMethod?.name || paymentInfo.method} account shortly.`
                  }
                </p>
              </div>
            ` : `
              <div class="bg-green-50 p-3 rounded-lg mb-4 border border-green-200">
                <p class="text-green-800 font-medium text-sm mb-1">Cash on Delivery:</p>
                <p class="text-green-700 text-xs">
                  Keep BDT ${result.order.totals.total.toLocaleString()} ready for payment upon delivery.
                </p>
              </div>
            `}
            
            <p class="text-sm text-gray-600">
              📧 A confirmation email has been sent to <strong>${customerInfo.email}</strong>
            </p>
            <p class="text-sm text-gray-500 mt-2">
              💬 You can contact us with your Order ID if you have any questions.
            </p>
          </div>
        `,
        icon: 'success',
        showCancelButton: !isGuestOrder,
        confirmButtonText: '🛍️ Continue Shopping',
        cancelButtonText: isGuestOrder ? undefined : '📋 View Orders',
        confirmButtonColor: '#8b5cf6',
        cancelButtonColor: '#6b7280',
        allowOutsideClick: false,
        width: '600px'
      }).then((result) => {
        if (result.isConfirmed) {
          router.push('/products');
        } else if (result.isDismissed && !isGuestOrder) {
          router.push('/orders');
        }
      });

    } catch (error) {
      console.error('❌ Order submission error:', error);
      
      await Swal.fire({
        title: 'Order Failed',
        html: `
          <div class="text-left">
            <p class="text-gray-700 mb-4">We encountered an issue processing your order:</p>
            
            <div class="bg-red-50 p-4 rounded-lg mb-4 border border-red-200">
              <p class="text-red-800 font-medium text-sm">${error.message}</p>
            </div>
            
            <div class="text-sm text-gray-600 space-y-2">
              <p><strong>What you can do:</strong></p>
              <ul class="list-disc list-inside space-y-1 text-xs ml-2">
                <li>Check your internet connection and try again</li>
                <li>Verify all your information is correct</li>
                <li>Try a different payment method</li>
                ${!user ? '<li>Consider creating an account for a smoother checkout experience</li>' : ''}
                <li>Contact us if the problem persists</li>
              </ul>
            </div>
            
            <p class="text-xs text-gray-500 mt-4">
              <strong>Error Code:</strong> ${error.name || 'CHECKOUT_ERROR'}<br>
              <strong>Time:</strong> ${new Date().toLocaleString()}
            </p>
          </div>
        `,
        icon: 'error',
        confirmButtonText: 'Try Again',
        confirmButtonColor: '#ef4444',
        width: '500px'
      });

    } finally {
      setIsProcessing(false);
      console.log('✅ Order submission process completed');
    }
  };

  // Format card number
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

  // Enhanced: Manual refresh with reset
  const handleRefreshUserData = () => {
    console.log('🔄 Manual refresh triggered');
    setUserDataLoaded(false);
    setIsLoadingUserData(false);
    loadUserData();
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
              <p className="text-gray-600">
                Complete your order securely
                {user && <span className="text-purple-600 ml-1">• Logged in as {user.email}</span>}
              </p>
            </div>
          </div>
          
          {/* Security Badge */}
          <div className="flex items-center gap-2 bg-green-100 text-green-700 px-4 py-2 rounded-lg">
            <Shield size={20} />
            <span className="font-medium">Secure Checkout</span>
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
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-semibold text-gray-900 flex items-center gap-2">
                  <User size={20} className="text-purple-600" />
                  Customer Information
                  {isLoadingUserData && (
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-purple-600 ml-2"></div>
                  )}
                </h2>
                
                {/* Refresh and Save Controls */}
                <div className="flex items-center gap-3">
                  {user && (
                    <button
                      onClick={handleRefreshUserData}
                      disabled={isLoadingUserData}
                      className="flex items-center gap-1 px-3 py-1 text-sm text-purple-600 hover:bg-purple-50 rounded-lg transition-colors"
                      title="Refresh user data"
                    >
                      <RefreshCw size={14} className={isLoadingUserData ? 'animate-spin' : ''} />
                      {isLoadingUserData ? 'Loading...' : 'Refresh'}
                    </button>
                  )}
                  
                  <label className="flex items-center gap-2 text-sm text-gray-600 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={saveForFuture}
                      onChange={(e) => setSaveForFuture(e.target.checked)}
                      className="rounded border-gray-300 text-purple-600 focus:ring-purple-500"
                    />
                    <Save size={14} />
                    Save for next time
                  </label>
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Full Name *</label>
                  <input
                    type="text"
                    value={customerInfo.fullName}
                    onChange={(e) => setCustomerInfo({...customerInfo, fullName: e.target.value})}
                    className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 ${
                      errors.fullName ? 'border-red-500' : 'border-gray-300'
                    }`}
                    placeholder="Enter your full name"
                  />
                  {errors.fullName && <p className="text-red-500 text-xs mt-1">{errors.fullName}</p>}
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Email *</label>
                  <input
                    type="email"
                    value={customerInfo.email}
                    onChange={(e) => setCustomerInfo({...customerInfo, email: e.target.value})}
                    className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 ${
                      errors.email ? 'border-red-500' : 'border-gray-300'
                    } ${user?.email === customerInfo.email ? 'bg-green-50' : ''}`}
                    placeholder="Enter email address"
                    readOnly={user?.email === customerInfo.email}
                  />
                  {errors.email && <p className="text-red-500 text-xs mt-1">{errors.email}</p>}
                  {user?.email === customerInfo.email && (
                    <p className="text-green-600 text-xs mt-1">✓ Using your account email</p>
                  )}
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
                  {/* 🆕 NEW: Delivery charge information */}
                  {customerInfo.city && (
                    <p className="text-xs text-gray-600 mt-1">
                      {customerInfo.city.toLowerCase() === 'dhaka' ? (
                        <span className="text-green-600">✓ Dhaka - Delivery charge: BDT 80</span>
                      ) : (
                        <span className="text-blue-600">• Outside Dhaka - Delivery charge: BDT 120</span>
                      )}
                    </p>
                  )}
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
              <div className="p-6 bg-gradient-to-r from-purple-600 to-purple-700 text-white">
                <h3 className="text-xl font-semibold flex items-center gap-2">
                  <ShoppingCart size={20} />
                  Order Summary
                </h3>
              </div>
              
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
                        
                        {/* 🔥 ENHANCED: Show product specifications */}
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

                        {/* 🔥 ENHANCED: Show available branches for each item */}
                        {item.availableBranches && item.availableBranches.length > 0 && (
                          <div className="mt-1">
                            <div className="flex items-center gap-1 text-xs text-gray-500">
                              <Store size={10} />
                              <span className="font-medium">
                                {getAvailableBranchesText(item.availableBranches)}
                              </span>
                            </div>
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
              
              <div className="p-6 border-t border-gray-200">
                {/* 🆕 UPDATED: Order summary with delivery charge */}
                <div className="space-y-3">
                  <div className="flex justify-between text-gray-600">
                    <span>Subtotal ({orderSummary.itemCount} items)</span>
                    <span>BDT {orderSummary.subtotal.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between text-gray-600">
                    <div className="flex items-center gap-1">
                      <Truck size={16} />
                      <span>Delivery Charge</span>
                    </div>
                    <span>BDT {orderSummary.deliveryCharge}</span>
                  </div>
                </div>
                
                <div className="border-t pt-3 mt-3">
                  <div className="flex justify-between items-center text-xl font-bold text-gray-900">
                    <span>Total</span>
                    <span className="text-purple-600">BDT {orderSummary.total.toLocaleString()}</span>
                  </div>
                </div>
              </div>
              
              <div className="p-6 bg-gray-50 border-t">
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <Shield size={16} className="text-green-600" />
                    <span>Secure checkout</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <Lock size={16} className="text-green-600" />
                    <span>Safe payment processing</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <CheckCircle size={16} className="text-green-600" />
                    <span>Order confirmation via email</span>
                  </div>
                  {/* 🆕 NEW: Delivery info */}
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <Truck size={16} className="text-green-600" />
                    <span>
                      {customerInfo.city?.toLowerCase() === 'dhaka' 
                        ? 'Dhaka delivery: BDT 80' 
                        : 'Outside Dhaka: BDT 120'
                      }
                    </span>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </div>
      
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
