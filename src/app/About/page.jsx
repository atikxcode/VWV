'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { 
  Award, 
  Users, 
  Shield, 
  Heart,
  TrendingUp,
  CheckCircle,
  Sparkles,
  Target,
  Zap,
  Package,
  ThumbsUp,
  Clock,
  MapPin,
  Star,
  Leaf,
  Globe
} from 'lucide-react';
import Image from 'next/image';

const AboutPage = () => {
  const [activeValue, setActiveValue] = useState(0);

  const stats = [
    { number: "5000+", label: "Happy Customers", icon: Users, color: "from-purple-500 to-pink-500" },
    { number: "500+", label: "Premium Products", icon: Package, color: "from-pink-500 to-rose-500" },
    { number: "3+", label: "Years Experience", icon: Award, color: "from-rose-500 to-orange-500" },
    { number: "100%", label: "Authentic Products", icon: Shield, color: "from-orange-500 to-yellow-500" }
  ];

  const values = [
    {
      icon: Shield,
      title: "Quality Assurance",
      description: "We only stock 100% authentic products from authorized distributors. Every item is verified for quality and safety.",
      color: "from-purple-500 to-pink-500"
    },
    {
      icon: Heart,
      title: "Customer First",
      description: "Your satisfaction is our priority. We provide exceptional service, expert guidance, and personalized recommendations.",
      color: "from-pink-500 to-rose-500"
    },
    {
      icon: Leaf,
      title: "Responsible Vaping",
      description: "We promote responsible vaping practices and provide education on safe usage for adult consumers.",
      color: "from-rose-500 to-orange-500"
    },
    {
      icon: Globe,
      title: "Community Focus",
      description: "Building a vibrant vaping community in Dhaka through events, education, and excellent customer relationships.",
      color: "from-orange-500 to-yellow-500"
    }
  ];

  const features = [
    {
      icon: Zap,
      title: "Fast Delivery",
      description: "Same-day delivery across Dhaka"
    },
    {
      icon: ThumbsUp,
      title: "Expert Support",
      description: "Knowledgeable staff to guide you"
    },
    {
      icon: Shield,
      title: "Warranty Included",
      description: "Protection on all devices"
    },
    {
      icon: Clock,
      title: "Open 7 Days",
      description: "10 AM - 10 PM every day"
    }
  ];

  const timeline = [
    {
      year: "2021",
      title: "The Beginning",
      description: "VWV Vape Shop opened its doors in Bashundhara, Dhaka with a mission to provide premium vaping products to Bangladesh."
    },
    {
      year: "2022",
      title: "Rapid Growth",
      description: "Expanded our product range and became one of the most trusted vape shops in Dhaka with thousands of satisfied customers."
    },
    {
      year: "2023",
      title: "Innovation",
      description: "Launched our online platform, making premium vaping products accessible across Bangladesh with fast delivery."
    },
    {
      year: "2024",
      title: "Industry Leader",
      description: "Recognized as the go-to destination for authentic vaping products, serving over 5000+ happy customers."
    }
  ];

  const team = [
    {
      name: "Founder & CEO",
      role: "Visionary Leader",
      description: "15+ years in retail industry"
    },
    {
      name: "Product Manager",
      role: "Quality Expert",
      description: "Ensures authentic products only"
    },
    {
      name: "Customer Support",
      role: "Your Guide",
      description: "Expert vaping knowledge"
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
      {/* Schema.org Structured Data */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            '@context': 'https://schema.org',
            '@type': 'Store',
            name: 'VWV Vape Shop',
            description: 'Premium vape shop in Bashundhara, Dhaka offering authentic e-liquids and vaping products',
            url: 'https://www.vwvvapeshop.com/about',
            foundingDate: '2021',
            address: {
              '@type': 'PostalAddress',
              streetAddress: 'Bashundhara RA',
              addressLocality: 'Dhaka',
              addressRegion: 'Dhaka Division',
              postalCode: '1229',
              addressCountry: 'BD'
            }
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
            <Sparkles className="w-8 h-8" />
          </motion.div>
          
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="text-4xl md:text-5xl lg:text-6xl font-bold mb-4 tracking-wider"
          >
            About VWV Vape Shop
          </motion.h1>
          
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="text-lg md:text-xl max-w-2xl mx-auto text-pink-100"
          >
            Your trusted destination for premium vaping products in Dhaka, Bangladesh
          </motion.p>
        </div>
      </motion.section>

      {/* Stats Section */}
      <motion.section
        variants={containerVariants}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, margin: '-100px' }}
        className="max-w-7xl mx-auto px-4 -mt-12 relative z-10"
      >
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {stats.map((stat, index) => {
            const Icon = stat.icon;
            return (
              <motion.div
                key={index}
                variants={itemVariants}
                whileHover={{ y: -8, scale: 1.05 }}
                className="bg-white rounded-2xl shadow-xl p-6 hover:shadow-2xl transition-all duration-300 border border-pink-100"
              >
                <div className={`inline-flex p-3 rounded-xl bg-gradient-to-br ${stat.color} mb-4`}>
                  <Icon className="w-6 h-6 text-white" />
                </div>
                <h3 className="text-3xl font-bold text-gray-900 mb-1">
                  {stat.number}
                </h3>
                <p className="text-gray-600 text-sm font-medium">
                  {stat.label}
                </p>
              </motion.div>
            );
          })}
        </div>
      </motion.section>

      {/* Our Story Section */}
      <section className="max-w-7xl mx-auto px-4 py-16">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          {/* Text Content */}
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <div className="inline-flex items-center gap-2 bg-pink-100 text-pink-600 px-4 py-2 rounded-full mb-4">
              <Heart className="w-4 h-4" />
              <span className="text-sm font-semibold">Our Story</span>
            </div>
            
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Passion for Quality Vaping
            </h2>
            
            <p className="text-gray-600 mb-4 leading-relaxed">
              Founded in 2021, <span className="font-semibold text-purple-600">VWV Vape Shop</span> started with a simple mission: to provide Dhaka's vaping community with authentic, high-quality products and exceptional customer service.
            </p>
            
            <p className="text-gray-600 mb-4 leading-relaxed">
              We noticed a gap in the market for <span className="font-semibold">genuine vaping products</span> and expert guidance. Many shops were selling counterfeit items, and customers had nowhere to turn for reliable advice.
            </p>
            
            <p className="text-gray-600 mb-6 leading-relaxed">
              Today, we're proud to be <span className="font-semibold text-pink-600">Bashundhara's most trusted vape shop</span>, serving thousands of satisfied customers with premium products from authorized distributors worldwide.
            </p>

            <div className="flex flex-wrap gap-4">
              <div className="flex items-center gap-2 text-green-600">
                <CheckCircle className="w-5 h-5" />
                <span className="font-medium">100% Authentic</span>
              </div>
              <div className="flex items-center gap-2 text-green-600">
                <CheckCircle className="w-5 h-5" />
                <span className="font-medium">Expert Support</span>
              </div>
              <div className="flex items-center gap-2 text-green-600">
                <CheckCircle className="w-5 h-5" />
                <span className="font-medium">Fast Delivery</span>
              </div>
            </div>
          </motion.div>

          {/* Image/Visual */}
          <motion.div
            initial={{ opacity: 0, x: 30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="relative"
          >
            <div className="relative bg-gradient-to-br from-purple-500 to-pink-500 rounded-2xl p-8 shadow-2xl">
              <div className="absolute inset-0 bg-white/10 rounded-2xl backdrop-blur-sm"></div>
              <div className="relative grid grid-cols-2 gap-4">
                {features.map((feature, index) => {
                  const Icon = feature.icon;
                  return (
                    <motion.div
                      key={index}
                      initial={{ opacity: 0, scale: 0.8 }}
                      whileInView={{ opacity: 1, scale: 1 }}
                      viewport={{ once: true }}
                      transition={{ delay: index * 0.1 }}
                      whileHover={{ scale: 1.05 }}
                      className="bg-white/20 backdrop-blur-sm rounded-xl p-4 text-white"
                    >
                      <Icon className="w-8 h-8 mb-2" />
                      <h4 className="font-semibold text-sm mb-1">{feature.title}</h4>
                      <p className="text-xs text-pink-100">{feature.description}</p>
                    </motion.div>
                  );
                })}
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Our Values Section */}
      <section className="max-w-7xl mx-auto px-4 py-16">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-12"
        >
          <div className="inline-flex items-center gap-2 bg-purple-100 text-purple-600 px-4 py-2 rounded-full mb-4">
            <Target className="w-4 h-4" />
            <span className="text-sm font-semibold">What We Stand For</span>
          </div>
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
            Our Core Values
          </h2>
          <p className="text-gray-600 max-w-2xl mx-auto">
            These principles guide everything we do at VWV Vape Shop
          </p>
        </motion.div>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
          {values.map((value, index) => {
            const Icon = value.icon;
            return (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
                whileHover={{ y: -8 }}
                onHoverStart={() => setActiveValue(index)}
                className={`bg-white rounded-2xl shadow-lg p-6 border-2 transition-all duration-300 cursor-pointer ${
                  activeValue === index
                    ? 'border-pink-500 shadow-xl'
                    : 'border-transparent hover:border-pink-200'
                }`}
              >
                <div className={`inline-flex p-3 rounded-xl bg-gradient-to-br ${value.color} mb-4`}>
                  <Icon className="w-6 h-6 text-white" />
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-2">
                  {value.title}
                </h3>
                <p className="text-gray-600 text-sm leading-relaxed">
                  {value.description}
                </p>
              </motion.div>
            );
          })}
        </div>
      </section>

      {/* Timeline Section */}
      <section className="max-w-7xl mx-auto px-4 py-16">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-12"
        >
          <div className="inline-flex items-center gap-2 bg-rose-100 text-rose-600 px-4 py-2 rounded-full mb-4">
            <TrendingUp className="w-4 h-4" />
            <span className="text-sm font-semibold">Our Journey</span>
          </div>
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
            Growth & Milestones
          </h2>
          <p className="text-gray-600 max-w-2xl mx-auto">
            From a small shop to Dhaka's leading vape destination
          </p>
        </motion.div>

        <div className="relative">
          {/* Timeline line */}
          <div className="absolute left-1/2 transform -translate-x-1/2 w-1 h-full bg-gradient-to-b from-purple-500 via-pink-500 to-rose-500 hidden lg:block"></div>

          <div className="space-y-12">
            {timeline.map((item, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, x: index % 2 === 0 ? -50 : 50 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                className={`flex flex-col lg:flex-row gap-8 items-center ${
                  index % 2 === 0 ? 'lg:flex-row-reverse' : ''
                }`}
              >
                {/* Content */}
                <div className="flex-1">
                  <div className={`bg-white rounded-2xl shadow-xl p-6 border-2 border-pink-100 ${
                    index % 2 === 0 ? 'lg:text-right' : ''
                  }`}>
                    <div className={`inline-flex items-center gap-2 bg-gradient-to-r from-purple-500 to-pink-500 text-white px-4 py-1 rounded-full mb-3 text-sm font-bold`}>
                      <Star className="w-4 h-4" />
                      {item.year}
                    </div>
                    <h3 className="text-xl font-bold text-gray-900 mb-2">
                      {item.title}
                    </h3>
                    <p className="text-gray-600">
                      {item.description}
                    </p>
                  </div>
                </div>

                {/* Timeline dot */}
                <div className="hidden lg:block">
                  <div className="w-6 h-6 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full border-4 border-white shadow-lg"></div>
                </div>

                {/* Spacer */}
                <div className="flex-1 hidden lg:block"></div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>


      

      {/* Why Choose Us Section */}
      <section className="bg-gradient-to-br from-purple-500 to-pink-500 text-white py-16">
        <div className="max-w-7xl mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-12"
          >
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              Why Choose VWV Shop?
            </h2>
            <p className="text-pink-100 max-w-2xl mx-auto">
              We're more than just a vape shop – we're your trusted partner in quality vaping
            </p>
          </motion.div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[
              {
                icon: Shield,
                title: "Authenticity Guaranteed",
                description: "Every product is sourced from authorized distributors with verification certificates"
              },
              {
                icon: Award,
                title: "Premium Selection",
                description: "Curated collection of the world's best vaping brands and products"
              },
              {
                icon: Users,
                title: "Expert Guidance",
                description: "Knowledgeable staff to help you choose the perfect products"
              },
              {
                icon: Zap,
                title: "Fast & Reliable",
                description: "Quick delivery across Dhaka with same-day options available"
              },
              {
                icon: ThumbsUp,
                title: "Customer Satisfaction",
                description: "5000+ happy customers trust us for their vaping needs"
              },
              {
                icon: Heart,
                title: "Community First",
                description: "Building relationships, not just transactions"
              }
            ].map((item, index) => {
              const Icon = item.icon;
              return (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: index * 0.1 }}
                  whileHover={{ scale: 1.05, y: -4 }}
                  className="bg-white/10 backdrop-blur-sm rounded-xl p-6 border border-white/20"
                >
                  <Icon className="w-10 h-10 mb-4" />
                  <h3 className="text-xl font-bold mb-2">{item.title}</h3>
                  <p className="text-pink-100 text-sm">{item.description}</p>
                </motion.div>
              );
            })}
          </div>
        </div>
      </section>




      {/* CTA Section */}
      <section className="max-w-7xl mx-auto px-4 py-16">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          className="bg-gradient-to-r from-purple-500 to-pink-500 rounded-3xl shadow-2xl p-12 text-center text-white relative overflow-hidden"
        >
          <div className="absolute inset-0">
            <div className="absolute top-0 left-0 w-72 h-72 bg-pink-400 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob"></div>
            <div className="absolute bottom-0 right-0 w-72 h-72 bg-purple-400 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob animation-delay-2000"></div>
          </div>

          <div className="relative z-10">
            <MapPin className="w-12 h-12 mx-auto mb-4" />
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              Visit Our Store Today
            </h2>
            <p className="text-pink-100 mb-8 max-w-2xl mx-auto">
              Experience the VWV difference in person. Our friendly staff is ready to help you find the perfect vaping products.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <motion.a
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                href="https://maps.google.com/?q=Vibe+with+vape+Bashundhara"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center gap-2 px-8 py-4 bg-white text-purple-600 rounded-xl font-semibold shadow-lg hover:shadow-xl transition-all"
              >
                <MapPin className="w-5 h-5" />
                Get Directions
              </motion.a>
              <motion.a
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                href="/Contact"
                className="inline-flex items-center justify-center gap-2 px-8 py-4 bg-white/20 backdrop-blur-sm text-white rounded-xl font-semibold border-2 border-white/50 hover:bg-white/30 transition-all"
              >
                Contact Us
              </motion.a>
            </div>
          </div>
        </motion.div>
      </section>

      {/* Add animations */}
      <style jsx>{`
        @keyframes blob {
          0%, 100% { transform: translate(0, 0) scale(1); }
          33% { transform: translate(30px, -50px) scale(1.1); }
          66% { transform: translate(-20px, 20px) scale(0.9); }
        }
        .animate-blob {
          animation: blob 7s infinite;
        }
        .animation-delay-2000 {
          animation-delay: 2s;
        }
        .animation-delay-4000 {
          animation-delay: 4s;
        }
      `}</style>
    </div>
  );
};

export default AboutPage;
