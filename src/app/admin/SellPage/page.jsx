'use client'

import { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core'
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  useSortable,
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import Swal from 'sweetalert2'
import BarcodeReader from 'react-barcode-reader'
import jsPDF from 'jspdf'
import html2canvas from 'html2canvas-pro'
import {
  Scan,
  Search,
  Filter,
  Package,
  ShoppingCart,
  Plus,
  Minus,
  X,
  CreditCard,
  Smartphone,
  Wallet,
  Banknote,
  Store,
  Tag,
  User,
  Receipt,
  AlertCircle,
  Clock,
  CheckCircle,
  Settings,
  Camera,
  DollarSign,
  Hash,
  Package2,
  Download,
  Eye,
  Calendar,
  Phone,
  Mail,
  MapPin,
  Trash2,
  GripVertical,
  FileText,
  Printer,
  Globe,
  Shield,
} from 'lucide-react'

// 💳 Compact Payment Methods Configuration
const PAYMENT_METHODS = [
  {
    id: 'cash',
    name: 'Cash',
    icon: Banknote,
    color: 'from-emerald-500 to-green-600',
    textColor: 'text-emerald-700',
    borderColor: 'border-emerald-200',
    bgColor: 'bg-emerald-50',
    type: 'cash',
  },
  {
    id: 'bkash',
    name: 'bKash',
    icon: Smartphone,
    color: 'from-pink-500 to-rose-600',
    textColor: 'text-pink-700',
    borderColor: 'border-pink-200',
    bgColor: 'bg-pink-50',
    type: 'mobile_banking',
  },
  {
    id: 'nagad',
    name: 'Nagad',
    icon: Smartphone,
    color: 'from-orange-500 to-amber-600',
    textColor: 'text-orange-700',
    borderColor: 'border-orange-200',
    bgColor: 'bg-orange-50',
    type: 'mobile_banking',
  },
  {
    id: 'visa',
    name: 'Visa',
    icon: CreditCard,
    color: 'from-blue-500 to-indigo-600',
    textColor: 'text-blue-700',
    borderColor: 'border-blue-200',
    bgColor: 'bg-blue-50',
    type: 'card',
  },
  {
    id: 'mastercard',
    name: 'MasterCard',
    icon: CreditCard,
    color: 'from-red-500 to-rose-600',
    textColor: 'text-red-700',
    borderColor: 'border-red-200',
    bgColor: 'bg-red-50',
    type: 'card',
  },
  {
    id: 'debit_card',
    name: 'Debit Card',
    icon: CreditCard,
    color: 'from-purple-500 to-violet-600',
    textColor: 'text-purple-700',
    borderColor: 'border-purple-200',
    bgColor: 'bg-purple-50',
    type: 'card',
  },
]

// Product Card Component (same as before)
const ProductCard = ({ product, onAddToCart, branches }) => {
  const [selectedBranch, setSelectedBranch] = useState(branches[0] || 'mirpur')
  const stock = product.stock?.[`${selectedBranch}_stock`] || 0
  const isOutOfStock = stock <= 0

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white rounded-xl shadow-lg overflow-hidden hover:shadow-xl transition-all"
    >
      {/* Product Image */}
      <div className="aspect-square relative bg-gray-100">
        {product.images && product.images.length > 0 ? (
          <img
            src={product.images[0].url}
            alt={product.images[0].alt || product.name}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <Package2 size={48} className="text-gray-400" />
          </div>
        )}

        {/* Stock Status Badge */}
        <div
          className={`absolute top-3 right-3 px-2 py-1 rounded-full text-xs font-medium ${
            isOutOfStock
              ? 'bg-red-100 text-red-800'
              : 'bg-green-100 text-green-800'
          }`}
        >
          {isOutOfStock ? 'Out of Stock' : `${stock} in stock`}
        </div>

        {/* Price Badge */}
        <div className="absolute bottom-3 left-3 bg-purple-600 text-white px-3 py-1 rounded-full text-sm font-bold">
          ${product.price}
        </div>
      </div>

      {/* Product Info */}
      <div className="p-4">
        <h3 className="font-semibold text-gray-900 line-clamp-2 mb-2">
          {product.name}
        </h3>

        <div className="flex items-center gap-2 mb-3">
          <Tag size={14} className="text-purple-600" />
          <span className="text-sm text-gray-600">
            {product.category} • {product.subcategory}
          </span>
        </div>

        {/* Branch Selector */}
        <div className="mb-3">
          <label className="block text-xs font-medium text-gray-700 mb-1">
            Branch Stock
          </label>
          <select
            value={selectedBranch}
            onChange={(e) => setSelectedBranch(e.target.value)}
            className="w-full p-2 text-sm rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-purple-500"
          >
            {branches.map((branch) => (
              <option key={branch} value={branch}>
                {branch.charAt(0).toUpperCase() + branch.slice(1)} (
                {product.stock?.[`${branch}_stock`] || 0})
              </option>
            ))}
          </select>
        </div>

        {/* Add to Cart Button */}
        <button
          onClick={() => onAddToCart(product, selectedBranch)}
          disabled={isOutOfStock}
          className={`w-full py-2 rounded-lg font-medium transition-colors ${
            isOutOfStock
              ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
              : 'bg-purple-600 text-white hover:bg-purple-700'
          }`}
        >
          {isOutOfStock ? 'Out of Stock' : 'Add to Cart'}
        </button>
      </div>
    </motion.div>
  )
}

// 💫 Sortable Cart Item Component (same as before)
const SortableCartItem = ({ item, onUpdateQuantity, onRemove }) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: item.id })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  }

  const totalPrice = item.product.price * item.quantity

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`bg-white rounded-xl shadow-sm border border-gray-100 p-4 mb-3 transition-all ${
        isDragging ? 'shadow-lg rotate-1 z-50' : 'hover:shadow-md'
      }`}
    >
      <div className="flex items-center gap-4">
        {/* Drag Handle */}
        <div
          {...attributes}
          {...listeners}
          className="text-gray-400 hover:text-gray-600 cursor-grab active:cursor-grabbing p-1 rounded hover:bg-gray-100"
        >
          <GripVertical size={16} />
        </div>

        {/* Product Image */}
        <div className="w-16 h-16 bg-gradient-to-br from-purple-100 to-blue-100 rounded-lg flex-shrink-0 overflow-hidden">
          {item.product.images && item.product.images.length > 0 ? (
            <img
              src={item.product.images[0].url}
              alt={item.product.name}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <Package2 size={24} className="text-purple-400" />
            </div>
          )}
        </div>

        {/* Product Details */}
        <div className="flex-1 min-w-0">
          <h4 className="font-semibold text-gray-900 truncate text-sm">
            {item.product.name}
          </h4>
          <div className="flex items-center gap-2 mt-1">
            <span className="text-xs bg-purple-100 text-purple-700 px-2 py-1 rounded-full">
              {item.branch.charAt(0).toUpperCase() + item.branch.slice(1)}
            </span>
            <span className="text-sm font-medium text-purple-600">
              ${item.product.price}
            </span>
          </div>
        </div>

        {/* Quantity Controls */}
        <div className="flex items-center gap-2 bg-gray-50 rounded-lg p-1">
          <button
            onClick={() => onUpdateQuantity(item.id, item.quantity - 1)}
            className="w-8 h-8 rounded-lg bg-white shadow-sm flex items-center justify-center hover:bg-red-50 hover:text-red-600 transition-colors"
          >
            <Minus size={14} />
          </button>
          <span className="w-8 text-center font-semibold text-gray-900">
            {item.quantity}
          </span>
          <button
            onClick={() => onUpdateQuantity(item.id, item.quantity + 1)}
            className="w-8 h-8 rounded-lg bg-purple-600 text-white flex items-center justify-center hover:bg-purple-700 transition-colors"
          >
            <Plus size={14} />
          </button>
        </div>

        {/* Price & Remove */}
        <div className="text-right">
          <p className="font-bold text-gray-900 text-lg">
            ${totalPrice.toFixed(2)}
          </p>
          <button
            onClick={() => onRemove(item.id)}
            className="text-red-400 hover:text-red-600 mt-1 p-1 rounded-lg hover:bg-red-50 transition-colors"
          >
            <Trash2 size={16} />
          </button>
        </div>
      </div>
    </div>
  )
}

// Invoice downloaad
const generateInvoice = async (saleData) => {
  const invoiceElement = document.createElement('div')
  // Use RGB colors and more compact design
  invoiceElement.innerHTML = `
    <div style="font-family: 'Arial', sans-serif; max-width: 550px; margin: 0 auto; padding: 20px; background: rgb(255, 255, 255); color: rgb(51, 51, 51); line-height: 1.4;">
      
      <!-- Compact Header -->
      <div style="text-align: center; margin-bottom: 20px; padding-bottom: 15px; border-bottom: 2px solid rgb(139, 92, 246);">
        <h1 style="color: rgb(139, 92, 246); margin: 0 0 8px 0; font-size: 24px; font-weight: bold;">VWV VAPE SHOP</h1>
        <p style="margin: 0; color: rgb(107, 114, 128); font-size: 12px;">📍 123 Vape Street, Dhaka-1000 | 📞 +880-123-456-789 | 📧 sales@vwvvape.com</p>
      </div>

      <!-- Invoice Info & Customer - Side by Side -->
      <div style="display: flex; justify-content: space-between; margin-bottom: 20px; background: rgb(248, 250, 252); padding: 15px; border-radius: 8px;">
        <!-- Invoice Details -->
        <div style="flex: 1;">
          <h2 style="margin: 0 0 10px 0; color: rgb(139, 92, 246); font-size: 18px; font-weight: bold;">INVOICE</h2>
          <div style="font-size: 12px; color: rgb(55, 65, 81);">
            <p style="margin: 3px 0;"><strong>ID:</strong> ${
              saleData.saleId
            }</p>
            <p style="margin: 3px 0;"><strong>Date:</strong> ${new Date(
              saleData.timestamp
            ).toLocaleDateString()}</p>
            <p style="margin: 3px 0;"><strong>Time:</strong> ${new Date(
              saleData.timestamp
            ).toLocaleTimeString()}</p>
            <p style="margin: 3px 0;"><strong>Cashier:</strong> ${
              saleData.cashier
            }</p>
          </div>
        </div>
        
        <!-- Customer Details -->
        <div style="flex: 1; text-align: right;">
          <h3 style="margin: 0 0 10px 0; color: rgb(139, 92, 246); font-size: 14px; font-weight: bold;">CUSTOMER</h3>
          <div style="font-size: 12px; color: rgb(55, 65, 81);">
            <p style="margin: 3px 0;"><strong>Name:</strong> ${
              saleData.customer.name
            }</p>
            ${
              saleData.customer.phone
                ? `<p style="margin: 3px 0;"><strong>Phone:</strong> ${saleData.customer.phone}</p>`
                : ''
            }
            <span style="background: rgb(16, 185, 129); color: white; padding: 2px 8px; border-radius: 12px; font-size: 10px; font-weight: 600;">PAID</span>
          </div>
        </div>
      </div>

      <!-- Compact Items Table -->
      <div style="margin-bottom: 20px;">
        <h3 style="margin: 0 0 10px 0; color: rgb(55, 65, 81); font-size: 14px; font-weight: bold;">ITEMS PURCHASED</h3>
        <table style="width: 100%; border-collapse: collapse; font-size: 11px;">
          <thead>
            <tr style="background: rgb(139, 92, 246); color: white;">
              <th style="padding: 8px 6px; text-align: left; font-weight: 600;">#</th>
              <th style="padding: 8px 6px; text-align: left; font-weight: 600;">Product</th>
              <th style="padding: 8px 6px; text-align: center; font-weight: 600;">Branch</th>
              <th style="padding: 8px 6px; text-align: center; font-weight: 600;">Qty</th>
              <th style="padding: 8px 6px; text-align: right; font-weight: 600;">Price</th>
              <th style="padding: 8px 6px; text-align: right; font-weight: 600;">Total</th>
            </tr>
          </thead>
          <tbody>
            ${saleData.items
              .map(
                (item, index) => `
              <tr style="border-bottom: 1px solid rgb(229, 231, 235); ${
                index % 2 === 0
                  ? 'background: rgb(249, 250, 251);'
                  : 'background: white;'
              }">
                <td style="padding: 6px; font-weight: 600; color: rgb(107, 114, 128);">${
                  index + 1
                }</td>
                <td style="padding: 6px; font-weight: 500; color: rgb(55, 65, 81);">${
                  item.productName.length > 30
                    ? item.productName.substring(0, 30) + '...'
                    : item.productName
                }</td>
                <td style="padding: 6px; text-align: center;">
                  <span style="background: rgb(139, 92, 246); color: white; padding: 1px 6px; border-radius: 10px; font-size: 9px; font-weight: 600;">
                    ${item.branch.toUpperCase()}
                  </span>
                </td>
                <td style="padding: 6px; text-align: center; font-weight: 600; color: rgb(55, 65, 81);">${
                  item.quantity
                }</td>
                <td style="padding: 6px; text-align: right; font-weight: 500; color: rgb(55, 65, 81);">$${item.unitPrice.toFixed(
                  2
                )}</td>
                <td style="padding: 6px; text-align: right; font-weight: 700; color: rgb(5, 150, 105);">$${item.totalPrice.toFixed(
                  2
                )}</td>
              </tr>
            `
              )
              .join('')}
          </tbody>
        </table>
      </div>

      <!-- Payment & Totals Section -->
      <div style="margin-bottom: 20px;">
        <div style="display: flex; justify-content: space-between; gap: 15px;">
          <!-- Payment Method -->
          <div style="flex: 1; background: rgb(240, 253, 244); padding: 12px; border-radius: 8px; border-left: 3px solid rgb(16, 185, 129);">
            <h4 style="margin: 0 0 8px 0; color: rgb(5, 150, 105); font-size: 12px; font-weight: bold;">PAYMENT METHOD</h4>
            ${saleData.payment.methods
              .map(
                (method) => `
              <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 4px;">
                <span style="font-size: 11px; font-weight: 600; color: rgb(55, 65, 81);">
                  <span style="width: 6px; height: 6px; background: rgb(16, 185, 129); border-radius: 50%; display: inline-block; margin-right: 5px;"></span>
                  ${method.name}
                </span>
                <span style="font-size: 11px; font-weight: 700; color: rgb(5, 150, 105);">$${(
                  method.amount || saleData.totalAmount
                ).toFixed(2)}</span>
              </div>
            `
              )
              .join('')}
          </div>
          
          <!-- Totals -->
          <div style="flex: 1; background: rgb(254, 254, 254); padding: 12px; border-radius: 8px; border: 1px solid rgb(139, 92, 246);">
            <h4 style="margin: 0 0 8px 0; color: rgb(139, 92, 246); font-size: 12px; font-weight: bold;">TOTAL SUMMARY</h4>
            <div style="display: flex; justify-content: space-between; margin-bottom: 4px; font-size: 11px;">
              <span style="color: rgb(55, 65, 81);">Subtotal:</span>
              <span style="font-weight: 600;">$${saleData.totalAmount.toFixed(
                2
              )}</span>
            </div>
            <div style="border-top: 1px solid rgb(226, 232, 240); padding-top: 6px;">
              <div style="display: flex; justify-content: space-between; align-items: center; background: rgb(139, 92, 246); color: white; padding: 8px; border-radius: 4px;">
                <span style="font-size: 12px; font-weight: bold;">TOTAL:</span>
                <span style="font-size: 14px; font-weight: bold;">$${saleData.payment.totalPaid.toFixed(
                  2
                )}</span>
              </div>
              ${
                saleData.payment.change > 0
                  ? `
                <div style="display: flex; justify-content: space-between; align-items: center; background: rgb(16, 185, 129); color: white; padding: 6px; border-radius: 4px; margin-top: 4px;">
                  <span style="font-size: 11px; font-weight: 600;">Change:</span>
                  <span style="font-size: 12px; font-weight: bold;">$${saleData.payment.change.toFixed(
                    2
                  )}</span>
                </div>
              `
                  : ''
              }
            </div>
          </div>
        </div>
      </div>

      <!-- Compact Footer -->
      <div style="text-align: center; padding-top: 15px; border-top: 1px solid rgb(229, 231, 235); background: rgb(248, 250, 252); border-radius: 8px; padding: 15px;">
        <h3 style="margin: 0 0 8px 0; color: rgb(5, 150, 105); font-size: 14px; font-weight: bold;">Thank You for Your Business!</h3>
        <p style="margin: 0 0 10px 0; color: rgb(107, 114, 128); font-size: 11px;">We appreciate your trust in VWV Vape Shop</p>
        
        <div style="display: flex; justify-content: space-around; margin-bottom: 10px; font-size: 10px; color: rgb(107, 114, 128);">
          <div>
            <strong>Follow Us:</strong><br>
            📱 @vwvvapeshop<br>
            🌐 www.vwvvape.com
          </div>
          <div>
            <strong>Support:</strong><br>
            📧 support@vwvvape.com<br>
            📞 +880-123-456-789
          </div>
        </div>
        
        <div style="font-size: 9px; color: rgb(156, 163, 175); font-style: italic; line-height: 1.3; border-top: 1px solid rgb(229, 231, 235); padding-top: 8px;">
          • Please retain this invoice for warranty and return purposes •<br>
          • All sales are subject to our terms and conditions • Thank you for choosing VWV Vape Shop •
        </div>
      </div>
    </div>
  `

  invoiceElement.style.position = 'absolute'
  invoiceElement.style.left = '-9999px'
  invoiceElement.style.width = '550px'
  document.body.appendChild(invoiceElement)

  try {
    const canvas = await html2canvas(invoiceElement, {
      scale: 2,
      backgroundColor: '#ffffff',
      useCORS: true,
      allowTaint: true,
      height: invoiceElement.scrollHeight,
      width: 550,
    })

    const imgData = canvas.toDataURL('image/png', 1.0)
    const pdf = new jsPDF('p', 'mm', 'a4')

    const imgWidth = 210
    const pageHeight = 297
    const imgHeight = (canvas.height * imgWidth) / canvas.width
    let heightLeft = imgHeight
    let position = 0

    pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight)
    heightLeft -= pageHeight

    while (heightLeft >= 0) {
      position = heightLeft - imgHeight
      pdf.addPage()
      pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight)
      heightLeft -= pageHeight
    }

    // Save the PDF
    pdf.save(`VWV-Invoice-${saleData.saleId}.pdf`)

    // Show success message
    Swal.fire({
      icon: 'success',
      title: 'Invoice Generated!',
      text: 'Invoice PDF has been downloaded successfully',
      timer: 2000,
      showConfirmButton: false,
      toast: true,
      position: 'top-end',
    })
  } catch (error) {
    console.error('Error generating PDF:', error)
    Swal.fire({
      icon: 'error',
      title: 'Invoice Generation Failed',
      text: 'Could not generate invoice PDF. Please try again.',
    })
  } finally {
    document.body.removeChild(invoiceElement)
  }
}

// 💳 Compact Payment Method Selector
const PaymentMethodSelector = ({
  selectedMethods,
  onMethodChange,
  totalAmount,
}) => {
  const [amounts, setAmounts] = useState({})

  const handleMethodToggle = (method) => {
    const isSelected = selectedMethods.some((m) => m.id === method.id)

    if (isSelected) {
      onMethodChange(selectedMethods.filter((m) => m.id !== method.id))
      const newAmounts = { ...amounts }
      delete newAmounts[method.id]
      setAmounts(newAmounts)
    } else {
      const newMethod = { ...method, amount: totalAmount }
      onMethodChange([newMethod])
      setAmounts({ [method.id]: totalAmount })
    }
  }

  const handleAmountChange = (methodId, amount) => {
    const newAmounts = { ...amounts, [methodId]: parseFloat(amount) || 0 }
    setAmounts(newAmounts)

    const updatedMethods = selectedMethods.map((method) =>
      method.id === methodId
        ? { ...method, amount: parseFloat(amount) || 0 }
        : method
    )
    onMethodChange(updatedMethods)
  }

  const totalPaid = selectedMethods.reduce(
    (sum, method) => sum + (method.amount || 0),
    0
  )
  const remainingAmount = Math.max(0, totalAmount - totalPaid)

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h3 className="text-xl font-bold text-gray-900 mb-2 flex items-center justify-center gap-2">
          <CreditCard className="text-purple-600" size={24} />
          Payment Method
        </h3>
        <p className="text-gray-600">Choose payment option</p>
      </div>

      {/* 🔥 Compact Payment Method Grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
        {PAYMENT_METHODS.map((method) => {
          const IconComponent = method.icon
          const isSelected = selectedMethods.some((m) => m.id === method.id)

          return (
            <motion.button
              key={method.id}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => handleMethodToggle(method)}
              className={`relative p-4 rounded-xl border-2 transition-all duration-300 text-center ${
                isSelected
                  ? `${method.borderColor} ${method.bgColor} shadow-lg`
                  : 'border-gray-200 bg-white hover:border-gray-300 hover:shadow-md'
              }`}
            >
              {/* Selection Indicator */}
              {isSelected && (
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  className="absolute -top-1 -right-1 w-5 h-5 bg-green-500 text-white rounded-full flex items-center justify-center"
                >
                  <CheckCircle size={12} />
                </motion.div>
              )}

              {/* Icon */}
              <div
                className={`w-10 h-10 rounded-lg bg-gradient-to-br ${method.color} flex items-center justify-center mx-auto mb-2`}
              >
                <IconComponent size={20} className="text-white" />
              </div>

              {/* Method Name */}
              <h4
                className={`text-sm font-bold ${
                  isSelected ? method.textColor : 'text-gray-900'
                }`}
              >
                {method.name}
              </h4>

              {/* Badge */}
              {method.id === 'cash' && (
                <span className="inline-block mt-1 px-2 py-0.5 rounded-full text-xs font-semibold bg-green-100 text-green-800">
                  Instant
                </span>
              )}
              {method.type !== 'cash' && (
                <span className="inline-block mt-1 px-2 py-0.5 rounded-full text-xs font-semibold bg-blue-100 text-blue-800">
                  Online
                </span>
              )}
            </motion.button>
          )
        })}
      </div>

      {/* Amount Input for Selected Method */}
      {selectedMethods.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-4"
        >
          <div className="bg-gradient-to-r from-purple-50 to-blue-50 rounded-xl p-4 border border-purple-100">
            <h4 className="font-bold text-gray-900 text-lg mb-3 flex items-center gap-2">
              <DollarSign className="text-purple-600" size={20} />
              Payment Amount
            </h4>

            {selectedMethods.map((method) => {
              const IconComponent = method.icon
              return (
                <div
                  key={method.id}
                  className="bg-white rounded-lg p-3 shadow-sm"
                >
                  <div className="flex items-center gap-3 mb-3">
                    <div
                      className={`w-8 h-8 rounded-lg bg-gradient-to-br ${method.color} flex items-center justify-center`}
                    >
                      <IconComponent size={16} className="text-white" />
                    </div>
                    <span className="font-semibold text-gray-900">
                      {method.name}
                    </span>
                  </div>

                  <div className="relative">
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      max={totalAmount}
                      value={amounts[method.id] || ''}
                      onChange={(e) =>
                        handleAmountChange(method.id, e.target.value)
                      }
                      placeholder={`${totalAmount.toFixed(2)}`}
                      className="w-full p-3 pl-10 pr-4 text-lg font-semibold rounded-lg border-2 border-gray-200 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    />
                    <DollarSign
                      size={18}
                      className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                    />
                  </div>
                </div>
              )
            })}
          </div>

          {/* Compact Payment Summary */}
          <div className="bg-white p-4 rounded-xl border-2 border-purple-200 shadow-lg">
            <h4 className="font-bold text-gray-900 text-lg mb-3">Summary</h4>
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Total:</span>
                <span className="font-semibold">${totalAmount.toFixed(2)}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Paying:</span>
                <span className="font-semibold">${totalPaid.toFixed(2)}</span>
              </div>
              <div className="border-t pt-2">
                <div className="flex justify-between items-center text-lg font-bold text-purple-600">
                  <span>Balance:</span>
                  <span>${totalAmount.toFixed(2)}</span>
                </div>
              </div>
              {remainingAmount > 0 ? (
                <div className="bg-red-50 p-2 rounded text-red-700 font-semibold text-sm">
                  Remaining: ${remainingAmount.toFixed(2)}
                </div>
              ) : totalPaid > totalAmount ? (
                <div className="bg-green-50 p-2 rounded text-green-700 font-semibold text-sm">
                  Change: ${(totalPaid - totalAmount).toFixed(2)}
                </div>
              ) : null}
            </div>
          </div>
        </motion.div>
      )}
    </div>
  )
}

// Main SellPage Component
export default function SellPage() {
  // States (same as before)
  const [products, setProducts] = useState([])
  const [categories, setCategories] = useState({})
  const [branches, setBranches] = useState([])
  const [cart, setCart] = useState([])
  const [loading, setLoading] = useState(true)
  const [showBarcodeScanner, setShowBarcodeScanner] = useState(false)
  const [showCartModal, setShowCartModal] = useState(false)
  const [saleCompleted, setSaleCompleted] = useState(false)
  const [completedSaleData, setCompletedSaleData] = useState(null)

  // Filter states
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('')
  const [selectedSubcategory, setSelectedSubcategory] = useState('')
  const [barcodeFilter, setBarcodeFilter] = useState('')
  const [inStockOnly, setInStockOnly] = useState(false)

  // Payment states
  const [selectedPaymentMethods, setSelectedPaymentMethods] = useState([])
  const [customerName, setCustomerName] = useState('')
  const [customerPhone, setCustomerPhone] = useState('')

  // Pagination
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const itemsPerPage = 12

  // dnd-kit sensors
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  )

  // Load initial data
  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true)

        const categoriesRes = await fetch(
          '/api/products?getCategoriesOnly=true'
        )
        if (categoriesRes.ok) {
          const categoriesData = await categoriesRes.json()
          setCategories(categoriesData.categories)
        }

        const branchesRes = await fetch('/api/branches')
        if (branchesRes.ok) {
          const branchesData = await branchesRes.json()
          setBranches(branchesData.branches || ['mirpur', 'bashundhara'])
        } else {
          setBranches(['mirpur', 'bashundhara'])
        }

        fetchProducts()
      } catch (error) {
        console.error('Error loading data:', error)
        Swal.fire({
          icon: 'error',
          title: 'Error',
          text: 'Failed to load data',
        })
      }
    }

    loadData()
  }, [])

  // Fetch products with filters
  const fetchProducts = async () => {
    try {
      const params = new URLSearchParams({
        limit: itemsPerPage.toString(),
        page: currentPage.toString(),
        status: 'active',
      })

      if (searchTerm) params.append('search', searchTerm)
      if (selectedCategory) params.append('category', selectedCategory)
      if (selectedSubcategory) params.append('subcategory', selectedSubcategory)
      if (barcodeFilter) params.append('barcode', barcodeFilter) // 🔥 This should work now
      if (inStockOnly) params.append('inStock', 'true')

      console.log('Fetching with params:', params.toString()) // 🔍 Debug log

      const response = await fetch(`/api/products?${params}`)
      if (response.ok) {
        const data = await response.json()
        console.log('Products data:', data) // 🔍 Debug log
        setProducts(data.products || [])
        setTotalPages(data.pagination?.totalPages || 1)
      }
    } catch (error) {
      console.error('Error fetching products:', error)
    } finally {
      setLoading(false)
    }
  }

  // Apply filters
  useEffect(() => {
    setCurrentPage(1)
    fetchProducts()
  }, [
    searchTerm,
    selectedCategory,
    selectedSubcategory,
    barcodeFilter,
    inStockOnly,
  ])

  useEffect(() => {
    fetchProducts()
  }, [currentPage])

  // 🔍 Enhanced Barcode scan handler
  const handleBarcodeScan = async (data) => {
    try {
      if (data) {
        console.log('Scanned barcode:', data)
        setBarcodeFilter(data)
        setShowBarcodeScanner(false)

        // 🔥 Direct search for barcode
        const response = await fetch(
          `/api/products?barcode=${encodeURIComponent(data)}&limit=1`
        )
        if (response.ok) {
          const result = await response.json()
          console.log('Barcode search result:', result) // 🔍 Debug log

          if (result.products && result.products.length > 0) {
            const product = result.products[0]
            const defaultBranch = branches[0] || 'mirpur'
            handleAddToCart(product, defaultBranch)

            Swal.fire({
              icon: 'success',
              title: 'Product Found!',
              text: `${product.name} added to cart`,
              timer: 2000,
              showConfirmButton: false,
              toast: true,
              position: 'top-end',
            })
          } else {
            Swal.fire({
              icon: 'warning',
              title: 'Product Not Found',
              text: `No product found with barcode: ${data}`,
              timer: 3000,
              showConfirmButton: false,
              toast: true,
              position: 'top-end',
            })
          }
        }
      }
    } catch (error) {
      console.error('Barcode scanning error:', error)
      setBarcodeFilter(data || '')
      setShowBarcodeScanner(false)
    }
  }

  // Cart handlers (same as before)
  const handleAddToCart = (product, branch) => {
    const stock = product.stock?.[`${branch}_stock`] || 0

    if (stock <= 0) {
      Swal.fire({
        icon: 'error',
        title: 'Out of Stock',
        text: 'This product is out of stock in the selected branch',
      })
      return
    }

    const existingItem = cart.find(
      (item) => item.product._id === product._id && item.branch === branch
    )

    if (existingItem) {
      if (existingItem.quantity >= stock) {
        Swal.fire({
          icon: 'warning',
          title: 'Stock Limit',
          text: 'Cannot add more items than available stock',
        })
        return
      }
      handleUpdateQuantity(existingItem.id, existingItem.quantity + 1)
    } else {
      const newItem = {
        id: Date.now() + Math.random(),
        product,
        branch,
        quantity: 1,
      }
      setCart((prev) => [...prev, newItem])

      Swal.fire({
        icon: 'success',
        title: 'Added to Cart!',
        text: `${product.name} added to cart`,
        timer: 1500,
        showConfirmButton: false,
        toast: true,
        position: 'top-end',
      })
    }
  }

  const handleUpdateQuantity = (itemId, newQuantity) => {
    if (newQuantity <= 0) {
      handleRemoveFromCart(itemId)
      return
    }

    setCart((prev) =>
      prev.map((item) => {
        if (item.id === itemId) {
          const stock = item.product.stock?.[`${item.branch}_stock`] || 0
          if (newQuantity > stock) {
            Swal.fire({
              icon: 'warning',
              title: 'Stock Limit',
              text: 'Cannot add more items than available stock',
            })
            return item
          }
          return { ...item, quantity: newQuantity }
        }
        return item
      })
    )
  }

  const handleRemoveFromCart = (itemId) => {
    setCart((prev) => prev.filter((item) => item.id !== itemId))
  }

  const handleClearCart = () => {
    Swal.fire({
      title: 'Clear Cart?',
      text: 'This will remove all items from the cart',
      icon: 'question',
      showCancelButton: true,
      confirmButtonText: 'Yes, clear it!',
      cancelButtonText: 'Cancel',
    }).then((result) => {
      if (result.isConfirmed) {
        setCart([])
      }
    })
  }

  // Handle drag end for cart reordering
  const handleDragEnd = (event) => {
    const { active, over } = event

    if (active.id !== over?.id) {
      setCart((items) => {
        const oldIndex = items.findIndex((item) => item.id === active.id)
        const newIndex = items.findIndex((item) => item.id === over.id)

        return arrayMove(items, oldIndex, newIndex)
      })
    }
  }

  // Calculate totals
  const cartTotal = cart.reduce(
    (sum, item) => sum + item.product.price * item.quantity,
    0
  )
  const cartItemsCount = cart.reduce((sum, item) => sum + item.quantity, 0)

  // Enhanced Process Sale
  const handleProcessSale = async () => {
    if (cart.length === 0) {
      Swal.fire({
        icon: 'warning',
        title: 'Empty Cart',
        text: 'Please add items to cart before processing sale',
      })
      return
    }

    if (selectedPaymentMethods.length === 0) {
      Swal.fire({
        icon: 'warning',
        title: 'Select Payment Method',
        text: 'Please select a payment method to continue',
      })
      return
    }

    const paymentMethod = selectedPaymentMethods[0]
    const totalPaid = paymentMethod.amount || 0

    if (totalPaid < cartTotal) {
      Swal.fire({
        icon: 'error',
        title: 'Insufficient Payment',
        text: `Please ensure payment covers the full amount of $${cartTotal.toFixed(
          2
        )}`,
      })
      return
    }

    try {
      // Show loading
      Swal.fire({
        title: 'Processing Sale...',
        text: 'Please wait while we process your payment',
        allowOutsideClick: false,
        allowEscapeKey: false,
        showConfirmButton: false,
        didOpen: () => {
          Swal.showLoading()
        },
      })

      if (paymentMethod.type === 'cash') {
        // 💵 CASH PAYMENT - Direct processing
        console.log('Processing cash payment...')

        const saleData = {
          customer: {
            name: customerName || 'Walk-in Customer',
            phone: customerPhone || '',
          },
          items: cart.map((item) => ({
            productId: item.product._id,
            productName: item.product.name,
            branch: item.branch,
            quantity: item.quantity,
            unitPrice: item.product.price,
            totalPrice: item.product.price * item.quantity,
          })),
          payment: {
            methods: selectedPaymentMethods,
            totalAmount: cartTotal,
            totalPaid: totalPaid,
            change: totalPaid - cartTotal,
          },
          totalAmount: cartTotal,
          timestamp: new Date(),
          cashier: 'Admin',
          paymentType: 'cash',
          status: 'completed',
        }

        // 🔥 Use your existing sales API - it handles stock updates
        const response = await fetch('/api/sales', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(saleData),
        })

        if (response.ok) {
          const result = await response.json()
          Swal.close()

          // Use the saleId from the API response
          const completedSale = {
            ...saleData,
            saleId: result.saleId,
          }

          setCompletedSaleData(completedSale)
          setSaleCompleted(true)

          // Clear cart and reset form
          setCart([])
          setSelectedPaymentMethods([])
          setCustomerName('')
          setCustomerPhone('')
        } else {
          const errorData = await response.json()
          throw new Error(errorData.error || 'Failed to save sale')
        }
      } else {
        // 🌐 ONLINE PAYMENT - SSLCommerz Integration
        console.log('Processing online payment via SSLCommerz...')
        // Implement SSLCommerz integration here if needed
      }
    } catch (error) {
      console.error('Error processing sale:', error)
      Swal.fire({
        icon: 'error',
        title: 'Payment Failed',
        text:
          error.message ||
          'There was an error processing the payment. Please try again.',
      })
    }
  }

  const handlePrintInvoice = async () => {
    if (completedSaleData) {
      await generateInvoice(completedSaleData)
    }
  }

  const handleNewSale = () => {
    setSaleCompleted(false)
    setCompletedSaleData(null)
    setShowCartModal(false)
  }

  const subcategoryOptions =
    selectedCategory && categories[selectedCategory]
      ? categories[selectedCategory]
      : []

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-blue-50 to-indigo-100 p-4">
      <div className="max-w-7xl mx-auto">
        {/* Header with Cart Icon */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
          <div>
            <h1 className="text-4xl font-bold text-gray-900 mb-2">
              💰 Admin Sales Point
            </h1>
            <p className="text-gray-600">
              Process sales and manage transactions
            </p>
          </div>

          {/* Enhanced Cart Button */}
          <motion.button
            whileHover={{ scale: 1.02, y: -2 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => setShowCartModal(true)}
            className="relative bg-gradient-to-r from-purple-600 via-purple-700 to-indigo-600 text-white rounded-2xl shadow-xl p-6 flex items-center gap-4 hover:shadow-2xl transition-all min-w-[200px]"
          >
            <div className="relative">
              <ShoppingCart size={32} />
              {cartItemsCount > 0 && (
                <motion.span
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  className="absolute -top-2 -right-2 bg-red-500 text-white text-sm rounded-full w-7 h-7 flex items-center justify-center font-bold shadow-lg"
                >
                  {cartItemsCount}
                </motion.span>
              )}
            </div>
            <div className="text-left">
              <p className="text-sm opacity-90 font-medium">Shopping Cart</p>
              <p className="text-2xl font-bold">${cartTotal.toFixed(2)}</p>
            </div>
          </motion.button>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
            <div className="relative">
              <Search
                size={20}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
              />
              <input
                type="text"
                placeholder="Search products..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-3 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-purple-500"
              />
            </div>

            <div className="relative">
              <Hash
                size={20}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
              />
              <input
                type="text"
                placeholder="Filter by barcode..."
                value={barcodeFilter}
                onChange={(e) => setBarcodeFilter(e.target.value)}
                className="w-full pl-10 pr-12 py-3 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-purple-500"
              />
              <button
                onClick={() => setShowBarcodeScanner(true)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-purple-600 hover:text-purple-700"
                title="Scan Barcode"
              >
                <Camera size={20} />
              </button>
            </div>

            <select
              value={selectedCategory}
              onChange={(e) => {
                setSelectedCategory(e.target.value)
                setSelectedSubcategory('')
              }}
              className="w-full p-3 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-purple-500"
            >
              <option value="">All Categories</option>
              {Object.keys(categories).map((category) => (
                <option key={category} value={category}>
                  {category}
                </option>
              ))}
            </select>

            <select
              value={selectedSubcategory}
              onChange={(e) => setSelectedSubcategory(e.target.value)}
              disabled={!selectedCategory}
              className="w-full p-3 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-purple-500 disabled:opacity-50"
            >
              <option value="">All Subcategories</option>
              {subcategoryOptions.map((subcategory) => (
                <option key={subcategory} value={subcategory}>
                  {subcategory}
                </option>
              ))}
            </select>
          </div>

          <div className="flex justify-between items-center">
            <div className="flex items-center gap-4">
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={inStockOnly}
                  onChange={(e) => setInStockOnly(e.target.checked)}
                  className="rounded text-purple-600"
                />
                <span className="text-sm text-gray-700">In Stock Only</span>
              </label>
            </div>

            <button
              onClick={() => {
                setSearchTerm('')
                setBarcodeFilter('')
                setSelectedCategory('')
                setSelectedSubcategory('')
                setInStockOnly(false)
              }}
              className="px-4 py-2 text-purple-600 hover:text-purple-700"
            >
              Clear Filters
            </button>
          </div>
        </div>

        {/* Products Grid */}
        {loading ? (
          <div className="flex justify-center items-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {products.map((product) => (
                <ProductCard
                  key={product._id}
                  product={product}
                  onAddToCart={handleAddToCart}
                  branches={branches}
                />
              ))}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex justify-center items-center mt-8 gap-2">
                <button
                  onClick={() =>
                    setCurrentPage((prev) => Math.max(prev - 1, 1))
                  }
                  disabled={currentPage === 1}
                  className="px-4 py-2 bg-white border border-gray-300 rounded-lg disabled:opacity-50 hover:bg-gray-50 transition-colors"
                >
                  Previous
                </button>

                <span className="px-4 py-2 bg-white rounded-lg border">
                  Page {currentPage} of {totalPages}
                </span>

                <button
                  onClick={() =>
                    setCurrentPage((prev) => Math.min(prev + 1, totalPages))
                  }
                  disabled={currentPage === totalPages}
                  className="px-4 py-2 bg-white border border-gray-300 rounded-lg disabled:opacity-50 hover:bg-gray-50 transition-colors"
                >
                  Next
                </button>
              </div>
            )}

            {/* No Products */}
            {products.length === 0 && !loading && (
              <div className="text-center py-12">
                <Package size={64} className="mx-auto text-gray-400 mb-4" />
                <h3 className="text-xl font-semibold text-gray-900 mb-2">
                  No products found
                </h3>
                <p className="text-gray-600">
                  Try adjusting your filters or check your inventory.
                </p>
              </div>
            )}
          </>
        )}
      </div>

      {/* Barcode Scanner Modal (same as before) */}
      <AnimatePresence>
        {showBarcodeScanner && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white rounded-2xl p-8 max-w-md w-full mx-4"
            >
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
                  <Scan size={24} className="text-purple-600" />
                  Barcode Scanner
                </h3>
                <button
                  onClick={() => setShowBarcodeScanner(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X size={24} />
                </button>
              </div>

              <div className="bg-gray-100 rounded-xl p-4 mb-4">
                <BarcodeReader
                  onError={(err) => console.error('Barcode scan error:', err)}
                  onScan={handleBarcodeScan}
                  style={{ width: '100%' }}
                />
                <p className="text-gray-600 text-center mt-2">
                  Position barcode in the camera view
                </p>
              </div>

              <button
                onClick={() => setShowBarcodeScanner(false)}
                className="w-full py-3 bg-gray-300 text-gray-700 rounded-xl hover:bg-gray-400 transition-colors"
              >
                Cancel
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Enhanced Cart Modal - Wider */}
      <AnimatePresence>
        {showCartModal && (
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
              className="bg-white rounded-2xl max-w-6xl w-full max-h-[90vh] overflow-hidden flex flex-col shadow-2xl"
            >
              {/* Modal Header */}
              <div className="flex justify-between items-center p-8 border-b border-gray-200 bg-gradient-to-r from-purple-50 to-blue-50">
                <h3 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
                  <ShoppingCart size={32} className="text-purple-600" />
                  {saleCompleted ? '✅ Sale Completed' : '🛒 Shopping Cart'}
                </h3>
                <button
                  onClick={() => setShowCartModal(false)}
                  className="text-gray-400 hover:text-gray-600 p-3 rounded-xl hover:bg-gray-100 transition-colors"
                >
                  <X size={28} />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto">
                {saleCompleted ? (
                  /* Sale Completed View */
                  <div className="p-8">
                    <div className="text-center mb-8">
                      <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        className="w-24 h-24 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6"
                      >
                        <CheckCircle size={48} className="text-green-600" />
                      </motion.div>
                      <h2 className="text-4xl font-bold text-gray-900 mb-4">
                        Payment Successful!
                      </h2>
                      <p className="text-xl text-gray-600">
                        Transaction completed successfully
                      </p>
                    </div>

                    {completedSaleData && (
                      <div className="max-w-3xl mx-auto">
                        <div className="bg-gradient-to-r from-purple-50 to-blue-50 rounded-2xl p-8 mb-8 border border-purple-200">
                          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
                            <div>
                              <p className="text-sm font-medium text-gray-600 mb-1">
                                Sale ID
                              </p>
                              <p className="text-lg font-bold text-purple-600">
                                {completedSaleData.saleId}
                              </p>
                            </div>
                            <div>
                              <p className="text-sm font-medium text-gray-600 mb-1">
                                Customer
                              </p>
                              <p className="text-lg font-bold text-gray-900">
                                {completedSaleData.customer.name}
                              </p>
                            </div>
                            <div>
                              <p className="text-sm font-medium text-gray-600 mb-1">
                                Total Amount
                              </p>
                              <p className="text-lg font-bold text-green-600">
                                ${completedSaleData.totalAmount.toFixed(2)}
                              </p>
                            </div>
                            <div>
                              <p className="text-sm font-medium text-gray-600 mb-1">
                                Items
                              </p>
                              <p className="text-lg font-bold text-gray-900">
                                {completedSaleData.items.length} items
                              </p>
                            </div>
                          </div>
                        </div>

                        <div className="flex gap-6">
                          <motion.button
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                            onClick={handlePrintInvoice}
                            className="flex-1 py-4 bg-purple-600 text-white rounded-xl hover:bg-purple-700 font-bold text-lg flex items-center justify-center gap-3 shadow-lg"
                          >
                            <Printer size={24} />
                            Download Invoice PDF
                          </motion.button>
                          <motion.button
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                            onClick={handleNewSale}
                            className="flex-1 py-4 bg-green-600 text-white rounded-xl hover:bg-green-700 font-bold text-lg flex items-center justify-center gap-3 shadow-lg"
                          >
                            <Plus size={24} />
                            Start New Sale
                          </motion.button>
                        </div>
                      </div>
                    )}
                  </div>
                ) : cart.length === 0 ? (
                  /* Empty Cart */
                  <div className="flex flex-col items-center justify-center py-20">
                    <div className="w-32 h-32 bg-gradient-to-br from-purple-100 to-blue-100 rounded-full flex items-center justify-center mb-6">
                      <ShoppingCart size={48} className="text-purple-400" />
                    </div>
                    <h3 className="text-2xl font-bold text-gray-900 mb-4">
                      Your cart is empty
                    </h3>
                    <p className="text-gray-600 text-lg">
                      Add some products to get started with your sale
                    </p>
                  </div>
                ) : (
                  /* Cart Content - Wider Layout */
                  <div className="grid grid-cols-1 lg:grid-cols-5 gap-8 p-8">
                    {/* Cart Items - Takes more space */}
                    <div className="lg:col-span-3">
                      <h4 className="text-2xl font-bold text-gray-900 mb-6 flex items-center justify-between">
                        <span>Items in Cart ({cartItemsCount})</span>
                        <button
                          onClick={handleClearCart}
                          className="text-red-500 hover:text-red-700 text-base font-medium px-4 py-2 rounded-lg hover:bg-red-50 transition-colors"
                        >
                          Clear All
                        </button>
                      </h4>

                      <DndContext
                        sensors={sensors}
                        collisionDetection={closestCenter}
                        onDragEnd={handleDragEnd}
                      >
                        <SortableContext
                          items={cart.map((item) => item.id)}
                          strategy={verticalListSortingStrategy}
                        >
                          <div className="max-h-96 overflow-y-auto space-y-3">
                            {cart.map((item) => (
                              <SortableCartItem
                                key={item.id}
                                item={item}
                                onUpdateQuantity={handleUpdateQuantity}
                                onRemove={handleRemoveFromCart}
                              />
                            ))}
                          </div>
                        </SortableContext>
                      </DndContext>
                    </div>

                    {/* Order Summary & Payment - More space */}
                    <div className="lg:col-span-2 space-y-8">
                      {/* Customer Info */}
                      <div className="bg-gradient-to-br from-purple-50 to-blue-50 rounded-2xl p-6 border border-purple-200">
                        <h4 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                          <User size={20} className="text-purple-600" />
                          Customer Information
                        </h4>
                        <div className="space-y-4">
                          <input
                            type="text"
                            placeholder="Customer Name (Optional)"
                            value={customerName}
                            onChange={(e) => setCustomerName(e.target.value)}
                            className="w-full p-4 rounded-xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-purple-500 bg-white"
                          />
                          <input
                            type="tel"
                            placeholder="Customer Phone (Optional)"
                            value={customerPhone}
                            onChange={(e) => setCustomerPhone(e.target.value)}
                            className="w-full p-4 rounded-xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-purple-500 bg-white"
                          />
                        </div>
                      </div>

                      {/* Order Summary */}
                      <div className="bg-white rounded-2xl p-6 border-2 border-gray-200 shadow-lg">
                        <h4 className="text-xl font-bold text-gray-900 mb-4">
                          Order Summary
                        </h4>
                        <div className="space-y-4 text-lg">
                          <div className="flex justify-between items-center">
                            <span className="text-gray-600">
                              Subtotal ({cartItemsCount} items):
                            </span>
                            <span className="font-semibold">
                              ${cartTotal.toFixed(2)}
                            </span>
                          </div>
                          <div className="border-t-2 pt-4 flex justify-between items-center text-2xl font-bold">
                            <span>Total:</span>
                            <span className="text-purple-600">
                              ${cartTotal.toFixed(2)}
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Payment Methods */}
                      <PaymentMethodSelector
                        selectedMethods={selectedPaymentMethods}
                        onMethodChange={setSelectedPaymentMethods}
                        totalAmount={cartTotal}
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* Modal Footer */}
              {!saleCompleted && cart.length > 0 && (
                <div className="p-8 border-t border-gray-200 bg-gradient-to-r from-gray-50 to-purple-50">
                  <div className="flex gap-6">
                    <button
                      onClick={() => setShowCartModal(false)}
                      className="flex-1 py-4 bg-gray-200 text-gray-700 rounded-xl hover:bg-gray-300 transition-colors font-bold text-lg"
                    >
                      Continue Shopping
                    </button>
                    <button
                      onClick={handleProcessSale}
                      disabled={selectedPaymentMethods.length === 0}
                      className="flex-2 py-4 px-8 bg-gradient-to-r from-green-500 via-green-600 to-emerald-600 text-white rounded-xl font-bold text-lg hover:from-green-600 hover:to-emerald-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-3 shadow-lg"
                    >
                      <CheckCircle size={24} />
                      Complete Sale
                    </button>
                  </div>
                </div>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
