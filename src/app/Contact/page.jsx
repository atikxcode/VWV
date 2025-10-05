'use client';

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { motion } from 'framer-motion';
import emailjs from '@emailjs/browser';
import { 
  MapPin, 
  Phone, 
  Mail, 
  Clock, 
  Send, 
  MessageSquare,
  Facebook,
  Instagram,
  Twitter,
  CheckCircle,
  AlertCircle
} from 'lucide-react';

// Form validation schema with Zod
const contactFormSchema = z.object({
  firstName: z.string()
    .min(2, 'First name must be at least 2 characters')
    .max(50, 'First name is too long')
    .regex(/^[a-zA-Z\s]+$/, 'First name can only contain letters'),
  
  lastName: z.string()
    .min(2, 'Last name must be at least 2 characters')
    .max(50, 'Last name is too long')
    .regex(/^[a-zA-Z\s]+$/, 'Last name can only contain letters'),
  
  email: z.string()
    .email('Invalid email address')
    .min(5, 'Email is required'),
  
  phone: z.string()
    .regex(/^[\d\s\-\+\(\)]*$/, 'Invalid phone number format')
    .optional()
    .or(z.literal('')),
  
  subject: z.string()
    .min(1, 'Please select a subject'),
  
  message: z.string()
    .min(10, 'Message must be at least 10 characters')
    .max(1000, 'Message is too long (max 1000 characters)')
});

const ContactPage = () => {
  const [submitSuccess, setSubmitSuccess] = useState(false);
  const [submitError, setSubmitError] = useState('');
  const [openFaq, setOpenFaq] = useState(null);

  // Initialize EmailJS on component mount
  useEffect(() => {
    const publicKey = process.env.NEXT_PUBLIC_EMAILJS_PUBLIC_KEY;
    if (publicKey) {
      emailjs.init(publicKey);
      console.log('EmailJS initialized');
    } else {
      console.error('EmailJS Public Key is missing!');
    }
  }, []);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    reset,
    watch
  } = useForm({
    resolver: zodResolver(contactFormSchema),
    defaultValues: {
      firstName: '',
      lastName: '',
      email: '',
      phone: '',
      subject: '',
      message: ''
    },
    mode: 'onBlur'
  });

  const messageLength = watch('message')?.length || 0;

  const onSubmit = async (data) => {
    setSubmitError('');
    setSubmitSuccess(false);

    // Verify environment variables
    const serviceId = process.env.NEXT_PUBLIC_EMAILJS_SERVICE_ID;
    const templateId = process.env.NEXT_PUBLIC_EMAILJS_TEMPLATE_ID;
    const publicKey = process.env.NEXT_PUBLIC_EMAILJS_PUBLIC_KEY;

    console.log('Environment Check:', {
      serviceId: serviceId ? '✓ Found' : '✗ Missing',
      templateId: templateId ? '✓ Found' : '✗ Missing',
      publicKey: publicKey ? '✓ Found' : '✗ Missing',
    });

    if (!serviceId || !templateId || !publicKey) {
      setSubmitError('Email service is not configured. Please contact support.');
      console.error('Missing environment variables:', {
        NEXT_PUBLIC_EMAILJS_SERVICE_ID: serviceId,
        NEXT_PUBLIC_EMAILJS_TEMPLATE_ID: templateId,
        NEXT_PUBLIC_EMAILJS_PUBLIC_KEY: publicKey ? 'exists' : 'missing'
      });
      return;
    }

    try {
      // EmailJS Configuration - Match template variables EXACTLY
      const templateParams = {
        from_name: `${data.firstName} ${data.lastName}`,
        from_email: data.email,
        from_phone: data.phone || 'Not provided',
        subject: data.subject,
        message: data.message,
      };

      console.log('Sending email with params:', templateParams);

      // Send email via EmailJS
      const response = await emailjs.send(
        serviceId,
        templateId,
        templateParams,
        publicKey
      );

      console.log('EmailJS SUCCESS:', response);

      if (response.status === 200) {
        setSubmitSuccess(true);
        reset();
        
        // Auto-hide success message after 5 seconds
        setTimeout(() => {
          setSubmitSuccess(false);
        }, 5000);
      }
    } catch (error) {
      console.error('EmailJS Error Details:', {
        error: error,
        text: error.text,
        status: error.status,
        message: error.message
      });
      
      setSubmitError(
        error?.text || 
        error?.message || 
        'Failed to send message. Please try again or contact us directly via phone or email.'
      );
    }
  };

  const contactInfo = [
    {
      icon: MapPin,
      title: 'Visit Our Store',
      details: ['Bashundhara, Dhaka', 'Bangladesh'],
      link: 'https://maps.google.com/?q=Vibe+with+vape+Bashundhara',
      color: 'from-purple-500 to-pink-500'
    },
    {
      icon: Phone,
      title: 'Call Us',
      details: ['+880 1234-567890', 'Daily: 10AM - 10PM'],
      link: 'tel:+15551234567',
      color: 'from-purple-500 to-pink-500'
    },
    {
      icon: Mail,
      title: 'Email Us',
      details: ['info@vwvvapeshop.com', 'support@vwvvapeshop.com'],
      link: 'mailto:info@vwvvapeshop.com',
      color: 'from-purple-500 to-pink-500'
    },
    {
      icon: Clock,
      title: 'Business Hours',
      details: ['Mon-Fri: 9:00 AM - 8:00 PM', 'Sat-Sun: 10:00 AM - 6:00 PM'],
      color: 'from-purple-500 to-pink-500'
    }
  ];

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.1 }
    }
  };

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1,
      transition: { duration: 0.5, ease: 'easeOut' }
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-pink-50 to-white">
      {/* Rest of your JSX stays exactly the same */}
      {/* Schema.org Structured Data */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            '@context': 'https://schema.org',
            '@type': 'Store',
            name: 'VWV Vape Shop',
            description: 'Premium vape shop offering quality e-liquids and vaping products',
            url: 'https://www.vwvvapeshop.com/contact',
            telephone: '+1-555-123-4567',
            email: 'info@vwvvapeshop.com',
            address: {
              '@type': 'PostalAddress',
              streetAddress: 'Bashundhara RA',
              addressLocality: 'Dhaka',
              addressRegion: 'Dhaka Division',
              postalCode: '1229',
              addressCountry: 'BD'
            },
            openingHoursSpecification: [
              {
                '@type': 'OpeningHoursSpecification',
                dayOfWeek: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'],
                opens: '09:00',
                closes: '20:00'
              },
              {
                '@type': 'OpeningHoursSpecification',
                dayOfWeek: ['Saturday', 'Sunday'],
                opens: '10:00',
                closes: '18:00'
              }
            ]
          })
        }}
      />

      {/* Hero Section */}
      <motion.section
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="relative bg-gradient-to-r from-purple-500 to-pink-500 text-white py-20 px-4 overflow-hidden"
      >
        <div className="absolute inset-0 bg-black opacity-10"></div>
        <div className="absolute inset-0">
          <div className="absolute top-0 left-0 w-72 h-72 bg-pink-400 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-blob"></div>
          <div className="absolute top-0 right-0 w-72 h-72 bg-purple-400 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-blob animation-delay-2000"></div>
          <div className="absolute bottom-0 left-1/2 w-72 h-72 bg-rose-400 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-blob animation-delay-4000"></div>
        </div>
        
        <div className="relative max-w-7xl mx-auto text-center">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.2, type: 'spring', stiffness: 200 }}
            className="inline-block p-3 bg-white/20 rounded-full mb-4 backdrop-blur-sm"
          >
            <MessageSquare className="w-8 h-8" />
          </motion.div>
          
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="text-4xl md:text-5xl lg:text-6xl font-bold mb-4 tracking-wider"
          >
            Get in Touch
          </motion.h1>
          
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="text-lg md:text-xl max-w-2xl mx-auto text-pink-100"
          >
            Have questions about our products or services? We're here to help with all your vaping needs.
          </motion.p>
        </div>
      </motion.section>

      {/* Contact Info Cards */}
      <motion.section
        variants={containerVariants}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, margin: '-100px' }}
        className="max-w-7xl mx-auto px-4 -mt-12 relative z-10"
      >
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {contactInfo.map((info, index) => {
            const Icon = info.icon;
            return (
              <motion.div
                key={index}
                variants={itemVariants}
                whileHover={{ y: -8, transition: { duration: 0.3 } }}
                className="bg-white rounded-2xl shadow-xl p-6 hover:shadow-2xl transition-all duration-300 border border-pink-100"
              >
                <div className={`inline-flex p-3 rounded-xl bg-gradient-to-br ${info.color} mb-4`}>
                  <Icon className="w-6 h-6 text-white" />
                </div>
                
                <h3 className="text-lg font-bold text-gray-900 mb-3">
                  {info.title}
                </h3>
                
                <div className="space-y-1">
                  {info.details.map((detail, idx) => (
                    <p key={idx} className="text-gray-600 text-sm">
                      {detail}
                    </p>
                  ))}
                </div>
                
                {info.link && (
                  <a
                    href={info.link}
                    target={info.link.startsWith('http') ? '_blank' : undefined}
                    rel={info.link.startsWith('http') ? 'noopener noreferrer' : undefined}
                    className="inline-block mt-4 text-purple-500 hover:text-purple-700 font-medium text-sm transition-colors"
                  >
                    {info.title.includes('Visit') ? 'Get Directions →' : 
                     info.title.includes('Call') ? 'Call Now →' : 
                     info.title.includes('Email') ? 'Send Email →' : null}
                  </a>
                )}
              </motion.div>
            );
          })}
        </div>
      </motion.section>

       {/* Main Content */}
      <section className="max-w-7xl mx-auto px-4 py-16">
        <div className="grid lg:grid-cols-2 gap-12">
          {/* Contact Form */}
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <div className="bg-white rounded-2xl shadow-xl p-8 border border-pink-100">
              <h2 className="text-3xl font-bold text-gray-900 mb-2">
                Send Us a Message
              </h2>
              <p className="text-gray-600 mb-8">
                Fill out the form below and we'll get back to you within 24 hours.
              </p>

              {/* Success Message */}
              {submitSuccess && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg flex items-start space-x-3"
                >
                  <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-green-800 font-medium">Message sent successfully!</p>
                    <p className="text-green-700 text-sm mt-1">
                      We'll get back to you within 24 hours.
                    </p>
                  </div>
                </motion.div>
              )}

              {/* Error Message */}
              {submitError && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-start space-x-3"
                >
                  <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-red-800 font-medium">Failed to send message</p>
                    <p className="text-red-700 text-sm mt-1">{submitError}</p>
                  </div>
                </motion.div>
              )}

              <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                {/* First Name & Last Name */}
                <div className="grid md:grid-cols-2 gap-6">
                  <div>
                    <label htmlFor="firstName" className="block text-sm font-medium text-gray-700 mb-2">
                      First Name <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      id="firstName"
                      {...register('firstName')}
                      className={`w-full px-4 py-3 rounded-lg border ${
                        errors.firstName ? 'border-red-500 ring-2 ring-red-200' : 'border-gray-300'
                      } focus:ring-2 focus:ring-pink-500 focus:border-transparent transition-all outline-none`}
                      placeholder="John"
                    />
                    {errors.firstName && (
                      <p className="mt-1.5 text-sm text-red-600 flex items-center">
                        <AlertCircle className="w-4 h-4 mr-1" />
                        {errors.firstName.message}
                      </p>
                    )}
                  </div>

                  <div>
                    <label htmlFor="lastName" className="block text-sm font-medium text-gray-700 mb-2">
                      Last Name <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      id="lastName"
                      {...register('lastName')}
                      className={`w-full px-4 py-3 rounded-lg border ${
                        errors.lastName ? 'border-red-500 ring-2 ring-red-200' : 'border-gray-300'
                      } focus:ring-2 focus:ring-pink-500 focus:border-transparent transition-all outline-none`}
                      placeholder="Doe"
                    />
                    {errors.lastName && (
                      <p className="mt-1.5 text-sm text-red-600 flex items-center">
                        <AlertCircle className="w-4 h-4 mr-1" />
                        {errors.lastName.message}
                      </p>
                    )}
                  </div>
                </div>

                {/* Email & Phone */}
                <div className="grid md:grid-cols-2 gap-6">
                  <div>
                    <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                      Email Address <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="email"
                      id="email"
                      {...register('email')}
                      className={`w-full px-4 py-3 rounded-lg border ${
                        errors.email ? 'border-red-500 ring-2 ring-red-200' : 'border-gray-300'
                      } focus:ring-2 focus:ring-pink-500 focus:border-transparent transition-all outline-none`}
                      placeholder="john@example.com"
                    />
                    {errors.email && (
                      <p className="mt-1.5 text-sm text-red-600 flex items-center">
                        <AlertCircle className="w-4 h-4 mr-1" />
                        {errors.email.message}
                      </p>
                    )}
                  </div>

                  <div>
                    <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-2">
                      Phone Number
                    </label>
                    <input
                      type="tel"
                      id="phone"
                      {...register('phone')}
                      className={`w-full px-4 py-3 rounded-lg border ${
                        errors.phone ? 'border-red-500 ring-2 ring-red-200' : 'border-gray-300'
                      } focus:ring-2 focus:ring-pink-500 focus:border-transparent transition-all outline-none`}
                      placeholder="+880-123456-7890"
                    />
                    {errors.phone && (
                      <p className="mt-1.5 text-sm text-red-600 flex items-center">
                        <AlertCircle className="w-4 h-4 mr-1" />
                        {errors.phone.message}
                      </p>
                    )}
                  </div>
                </div>

                {/* Subject */}
                <div>
                  <label htmlFor="subject" className="block text-sm font-medium text-gray-700 mb-2">
                    Subject <span className="text-red-500">*</span>
                  </label>
                  <select
                    id="subject"
                    {...register('subject')}
                    className={`w-full px-4 py-3 rounded-lg border ${
                      errors.subject ? 'border-red-500 ring-2 ring-red-200' : 'border-gray-300'
                    } focus:ring-2 focus:ring-pink-500 focus:border-transparent transition-all outline-none bg-white`}
                  >
                    <option value="">Select a subject</option>
                    <option value="Product Inquiry">Product Inquiry</option>
                    <option value="Order Support">Order Support</option>
                    <option value="Technical Support">Technical Support</option>
                    <option value="Wholesale Inquiry">Wholesale Inquiry</option>
                    <option value="Feedback">Feedback</option>
                    <option value="Other">Other</option>
                  </select>
                  {errors.subject && (
                    <p className="mt-1.5 text-sm text-red-600 flex items-center">
                      <AlertCircle className="w-4 h-4 mr-1" />
                      {errors.subject.message}
                    </p>
                  )}
                </div>

                {/* Message */}
                <div>
                  <label htmlFor="message" className="block text-sm font-medium text-gray-700 mb-2">
                    Message <span className="text-red-500">*</span>
                  </label>
                  <textarea
                    id="message"
                    {...register('message')}
                    rows="5"
                    className={`w-full px-4 py-3 rounded-lg border ${
                      errors.message ? 'border-red-500 ring-2 ring-red-200' : 'border-gray-300'
                    } focus:ring-2 focus:ring-pink-500 focus:border-transparent transition-all outline-none resize-none`}
                    placeholder="Tell us how we can help you..."
                  ></textarea>
                  <div className="flex justify-between items-center mt-1.5">
                    {errors.message ? (
                      <p className="text-sm text-red-600 flex items-center">
                        <AlertCircle className="w-4 h-4 mr-1" />
                        {errors.message.message}
                      </p>
                    ) : (
                      <div></div>
                    )}
                    <p className={`text-sm ${messageLength > 1000 ? 'text-red-600' : 'text-gray-500'}`}>
                      {messageLength}/1000
                    </p>
                  </div>
                </div>

                {/* Submit Button */}
                <motion.button
                  whileHover={{ scale: isSubmitting ? 1 : 1.02 }}
                  whileTap={{ scale: isSubmitting ? 1 : 0.98 }}
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full bg-gradient-to-r from-purple-500 to-pink-500 text-white font-semibold py-4 px-6 rounded-lg hover:from-purple-700 hover:to-pink-700 transition-all duration-300 shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
                >
                  {isSubmitting ? (
                    <>
                      <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      <span>Sending...</span>
                    </>
                  ) : (
                    <>
                      <Send className="w-5 h-5" />
                      <span>Send Message</span>
                    </>
                  )}
                </motion.button>

                <p className="text-center text-sm text-gray-500 mt-4">
                  We typically respond within 24 hours during business days.
                </p>
              </form>
            </div>
          </motion.div>

          {/* Additional Info & Map */}
          <motion.div
            initial={{ opacity: 0, x: 30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="space-y-8"
          >
           
            {/* Map - Enhanced Design */}
            <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className="bg-white rounded-2xl shadow-xl overflow-hidden border border-pink-100 relative group"
            >
            {/* Header with Location Info */}
            <div className="absolute top-0 left-0 right-0 z-10 bg-gradient-to-b from-white via-white/95 to-transparent p-4">
                <div className="flex items-center space-x-3">
                <div className="p-2 bg-gradient-to-br from-purple-500 to-pink-500 rounded-lg shadow-lg">
                    <MapPin className="w-5 h-5 text-white" />
                </div>
                <div>
                    <h4 className="font-bold text-gray-900">Find Us Here</h4>
                    <p className="text-xs text-gray-600">Bashundhara, Dhaka</p>
                </div>
                </div>
            </div>

            {/* Map Container */}
            <div className="h-80 bg-gray-200 relative overflow-hidden">
                {/* Subtle border glow effect */}
                <div className="absolute inset-0 bg-gradient-to-r from-pink-500/20 via-transparent to-rose-500/20 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none z-10"></div>
                
                <iframe
                src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3650.0437297047088!2d90.42209221148978!3d23.817043978535757!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x3755c70059acce05%3A0x9c390407301336b4!2sVibe%20with%20vape%20(Bashundhara)-!5e0!3m2!1sen!2sbd!4v1759704349937!5m2!1sen!2sbd"
                width="100%"
                height="100%"
                style={{ border: 0 }}
                allowFullScreen=""
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
                title="Vibe with Vape Bashundhara Location"
                className="absolute inset-0 transition-transform duration-500 group-hover:scale-105"
                ></iframe>
            </div>

            {/* Bottom Action Bar */}
            <div className="p-4 bg-gradient-to-r from-pink-50 to-rose-50 border-t border-pink-100">
                <motion.a
                href="https://maps.google.com/?q=Vibe+with+vape+Bashundhara"
                target="_blank"
                rel="noopener noreferrer"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className="flex items-center justify-center space-x-2 w-full py-3 bg-gradient-to-r from-purple-500 to-pink-500 text-white font-semibold rounded-lg hover:from-purple-600 hover:to-pink-700 transition-all duration-300 shadow-md hover:shadow-lg"
                >
                <svg
                    className="w-5 h-5"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                >
                    <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7"
                    />
                </svg>
                <span>Get Directions</span>
                </motion.a>
            </div>
            </motion.div>






           
           {/* FAQ - Animated Accordion */}
            <div className="bg-white rounded-2xl shadow-xl p-8 border border-pink-100">
            <h3 className="text-2xl font-bold text-gray-900 mb-6 flex items-center">
                <span className="inline-block w-1 h-8 bg-gradient-to-b from-pink-500 to-rose-500 mr-3 rounded-full"></span>
                Frequently Asked Questions
            </h3>
            
            <div className="space-y-4">
                {[
                {
                    question: "What are your store hours?",
                    answer: "We're open daily from 10:00 AM to 10:00 PM, 7 days a week. Visit us anytime for the best vaping experience in Bashundhara!",
                    icon: "🕒"
                },
                {
                    question: "Do you offer wholesale pricing?",
                    answer: "Absolutely! We provide competitive wholesale rates for bulk orders. Contact us directly to discuss pricing and minimum order quantities.",
                    icon: "💼"
                },
                {
                    question: "What's your return policy?",
                    answer: "We accept returns within 7 days for unopened products with original packaging. Customer satisfaction is our priority!",
                    icon: "↩️"
                },
                {
                    question: "Do you deliver in Dhaka?",
                    answer: "Yes! We offer fast delivery across Dhaka. Free delivery on orders over ৳2000. Orders are typically delivered within 24-48 hours.",
                    icon: "🚚"
                },
                {
                    question: "Are your products authentic?",
                    answer: "100% authentic and imported products only. We source directly from authorized distributors to ensure quality and authenticity.",
                    icon: "✓"
                }
                ].map((faq, index) => (
                <motion.div
                    key={index}
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: index * 0.1 }}
                    className="group"
                >
                    <div 
                    className={`overflow-hidden rounded-xl border transition-all duration-300 ${
                        openFaq === index 
                        ? 'border-pink-300 shadow-md' 
                        : 'border-gray-200 hover:border-pink-300'
                    }`}
                    >
                    <button
                        onClick={() => setOpenFaq(openFaq === index ? null : index)}
                        className={`w-full flex items-center justify-between cursor-pointer px-6 py-4 transition-all duration-300 ${
                        openFaq === index
                            ? 'bg-gradient-to-r from-pink-100 to-rose-100'
                            : 'bg-gradient-to-r from-gray-50 to-pink-50 hover:from-pink-50 hover:to-rose-50'
                        }`}
                    >
                        <div className="flex items-center space-x-3">
                        <span className="text-2xl">{faq.icon}</span>
                        <h4 className={`font-semibold transition-colors text-left ${
                            openFaq === index ? 'text-pink-600' : 'text-gray-900'
                        }`}>
                            {faq.question}
                        </h4>
                        </div>
                        <motion.div
                        animate={{ rotate: openFaq === index ? 180 : 0 }}
                        transition={{ duration: 0.3, ease: "easeInOut" }}
                        className="ml-4 text-pink-500 flex-shrink-0"
                        >
                        <svg
                            className="w-5 h-5"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                        >
                            <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M19 9l-7 7-7-7"
                            />
                        </svg>
                        </motion.div>
                    </button>
                    
                    <motion.div
                        initial={false}
                        animate={{
                        height: openFaq === index ? "auto" : 0,
                        opacity: openFaq === index ? 1 : 0
                        }}
                        transition={{
                        height: { duration: 0.3, ease: "easeInOut" },
                        opacity: { duration: 0.2, ease: "easeInOut" }
                        }}
                        className="overflow-hidden"
                    >
                        <div className="px-6 py-4 bg-white border-t border-gray-100">
                        <p className="text-gray-600 text-sm leading-relaxed">
                            {faq.answer}
                        </p>
                        </div>
                    </motion.div>
                    </div>
                </motion.div>
                ))}
            </div>
            
            <motion.div
                initial={{ opacity: 0 }}
                whileInView={{ opacity: 1 }}
                viewport={{ once: true }}
                transition={{ delay: 0.5 }}
                className="mt-8 p-4 bg-gradient-to-r from-pink-50 to-rose-50 rounded-xl border border-pink-200"
            >
                <p className="text-sm text-gray-700 text-center">
                <span className="font-semibold text-pink-600">Still have questions?</span> 
                <br />
                Feel free to reach out – we're always happy to help!
                </p>
            </motion.div>
            </div>







            {/* Social Media */}
            <div className="bg-gradient-to-br from-purple-500 to-pink-500 rounded-2xl shadow-xl p-8 text-white">
              <h3 className="text-2xl font-bold mb-4">
                Follow Us on Social Media
              </h3>
              <p className="text-pink-100 mb-6">
                Stay updated with our latest products, promotions, and vaping tips!
              </p>
              
              <div className="flex space-x-4">
                <motion.a
                  whileHover={{ scale: 1.1, rotate: 5 }}
                  href="https://facebook.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-3 bg-white/20 rounded-full hover:bg-white/30 transition-all backdrop-blur-sm"
                  aria-label="Facebook"
                >
                  <Facebook className="w-6 h-6" />
                </motion.a>
                
                <motion.a
                  whileHover={{ scale: 1.1, rotate: 5 }}
                  href="https://instagram.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-3 bg-white/20 rounded-full hover:bg-white/30 transition-all backdrop-blur-sm"
                  aria-label="Instagram"
                >
                  <Instagram className="w-6 h-6" />
                </motion.a>
                
                <motion.a
                  whileHover={{ scale: 1.1, rotate: 5 }}
                  href="https://twitter.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-3 bg-white/20 rounded-full hover:bg-white/30 transition-all backdrop-blur-sm"
                  aria-label="Twitter"
                >
                  <Twitter className="w-6 h-6" />
                </motion.a>
              </div>
            </div>
          </motion.div>
        </div>
      </section>






      

      
    </div>
  );
};

export default ContactPage;
