'use client'
import React, { useState } from 'react';
import { Line } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';
import Link from 'next/link';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend);

const AdminDashboard = () => {
  const [activeTab, setActiveTab] = useState('overview');
  const [heroContent, setHeroContent] = useState({
    title: 'Welcome to Our Store',
    subtitle: 'Shop the latest trends',
    image: '/hero-default.jpg',
    ctaText: 'Shop Now',
    ctaLink: '/products',
  });

  const chartData = {
    labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'],
    datasets: [
      {
        label: 'Sales',
        data: [1200, 1900, 3000, 5000, 2300, 3400],
        borderColor: 'rgb(75, 192, 192)',
        tension: 0.1,
      },
    ],
  };

  const handleHeroSubmit = (e) => {
    e.preventDefault();
    // API call to update hero section
    console.log('Hero section updated:', heroContent);
  };

  return (
    <div className="min-h-screen bg-gray-100 flex">
      {/* Sidebar */}
      <div className="w-64 bg-gray-800 text-white p-6">
        <h1 className="text-2xl font-bold mb-8">Admin Dashboard</h1>
        <nav>
          <ul>
            <li>
              <button
                onClick={() => setActiveTab('overview')}
                className={`w-full text-left py-2 px-4 rounded ${
                  activeTab === 'overview' ? 'bg-gray-600' : 'hover:bg-gray-700'
                }`}
              >
                Overview
              </button>
            </li>
            <li>
              <button
                onClick={() => setActiveTab('products')}
                className={`w-full text-left py-2 px-4 rounded ${
                  activeTab === 'products' ? 'bg-gray-600' : 'hover:bg-gray-700'
                }`}
              >
                Products
              </button>
            </li>
            <li>
              <button
                onClick={() => setActiveTab('orders')}
                className={`w-full text-left py-2 px-4 rounded ${
                  activeTab === 'orders' ? 'bg-gray-600' : 'hover:bg-gray-700'
                }`}
              >
                Orders
              </button>
            </li>
            <li>
              <button
                onClick={() => setActiveTab('users')}
                className={`w-full text-left py-2 px-4 rounded ${
                  activeTab === 'users' ? 'bg-gray-600' : 'hover:bg-gray-700'
                }`}
              >
                Users
              </button>
            </li>
           <Link href="">
            <li>
              <button
                onClick={() => setActiveTab('hero')}
                className={`w-full text-left py-2 px-4 rounded ${
                  activeTab === 'hero' ? 'bg-gray-600' : 'hover:bg-gray-700'
                }`}
              >
                Hero Section
              </button>
            </li>
            </Link>
            <li>
              <button
                onClick={() => setActiveTab('analytics')}
                className={`w-full text-left py-2 px-4 rounded ${
                  activeTab === 'analytics' ? 'bg-gray-600' : 'hover:bg-gray-700'
                }`}
              >
                Analytics
              </button>
            </li>
          </ul>
        </nav>
      </div>

      {/* Main Content */}
      <div className="flex-1 p-8">
        {activeTab === 'overview' && (
          <div>
            <h2 className="text-3xl font-bold mb-6">Overview</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-white p-6 rounded-lg shadow">
                <h3 className="text-lg font-semibold">Total Sales</h3>
                <p className="text-2xl">$12,345</p>
              </div>
              <div className="bg-white p-6 rounded-lg shadow">
                <h3 className="text-lg font-semibold">Total Orders</h3>
                <p className="text-2xl">567</p>
              </div>
              <div className="bg-white p-6 rounded-lg shadow">
                <h3 className="text-lg font-semibold">Total Users</h3>
                <p className="text-2xl">1,234</p>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'products' && (
          <div>
            <h2 className="text-3xl font-bold mb-6">Product Management</h2>
            <button className="bg-blue-500 text-white px-4 py-2 rounded mb-4">
              Add New Product
            </button>
            <div className="bg-white p-6 rounded-lg shadow">
              <table className="w-full">
                <thead>
                  <tr>
                    <th className="text-left">Product</th>
                    <th className="text-left">Price</th>
                    <th className="text-left">Stock</th>
                    <th className="text-left">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td>Sample Product</td>
                    <td>$29.99</td>
                    <td>100</td>
                    <td>
                      <button className="text-blue-500 mr-2">Edit</button>
                      <button className="text-red-500">Delete</button>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        )}

        {activeTab === 'orders' && (
          <div>
            <h2 className="text-3xl font-bold mb-6">Order Management</h2>
            <div className="bg-white p-6 rounded-lg shadow">
              <table className="w-full">
                <thead>
                  <tr>
                    <th className="text-left">Order ID</th>
                    <th className="text-left">Customer</th>
                    <th className="text-left">Status</th>
                    <th className="text-left">Total</th>
                    <th className="text-left">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td>#12345</td>
                    <td>John Doe</td>
                    <td>Processing</td>
                    <td>$99.99</td>
                    <td>
                      <button className="text-blue-500 mr-2">View</button>
                      <button className="text-green-500">Update</button>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        )}

        {activeTab === 'users' && (
          <div>
            <h2 className="text-3xl font-bold mb-6">User Management</h2>
            <div className="bg-white p-6 rounded-lg shadow">
              <table className="w-full">
                <thead>
                  <tr>
                    <th className="text-left">Name</th>
                    <th className="text-left">Email</th>
                    <th className="text-left">Role</th>
                    <th className="text-left">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td>Jane Doe</td>
                    <td>jane@example.com</td>
                    <td>Customer</td>
                    <td>
                      <button className="text-blue-500 mr-2">Edit</button>
                      <button className="text-red-500">Delete</button>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        )}

       

        {activeTab === 'hero' && (
          <div>
            <h2 className="text-3xl font-bold mb-6">Edit Hero Section</h2>
            <div className="bg-white p-6 rounded-lg shadow">
              <form onSubmit={handleHeroSubmit}>
                <div className="mb-4">
                  <label className="block text-sm font-medium mb-2">Title</label>
                  <input
                    type="text"
                    value={heroContent.title}
                    onChange={(e) =>
                      setHeroContent({ ...heroContent, title: e.target.value })
                    }
                    className="w-full p-2 border rounded"
                  />
                </div>
                <div className="mb-4">
                  <label className="block text-sm font-medium mb-2">Subtitle</label>
                  <input
                    type="text"
                    value={heroContent.subtitle}
                    onChange={(e) =>
                      setHeroContent({ ...heroContent, subtitle: e.target.value })
                    }
                    className="w-full p-2 border rounded"
                  />
                </div>
                <div className="mb-4">
                  <label className="block text-sm font-medium mb-2">Image URL</label>
                  <input
                    type="text"
                    value={heroContent.image}
                    onChange={(e) =>
                      setHeroContent({ ...heroContent, image: e.target.value })
                    }
                    className="w-full p-2 border rounded"
                  />
                </div>
                <div className="mb-4">
                  <label className="block text-sm font-medium mb-2">CTA Text</label>
                  <input
                    type="text"
                    value={heroContent.ctaText}
                    onChange={(e) =>
                      setHeroContent({ ...heroContent, ctaText: e.target.value })
                    }
                    className="w-full p-2 border rounded"
                  />
                </div>
                <div className="mb-4">
                  <label className="block text-sm font-medium mb-2">CTA Link</label>
                  <input
                    type="text"
                    value={heroContent.ctaLink}
                    onChange={(e) =>
                      setHeroContent({ ...heroContent, ctaLink: e.target.value })
                    }
                    className="w-full p-2 border rounded"
                  />
                </div>
                <button type="submit" className="bg-blue-500 text-white px-4 py-2 rounded">
                  Save Hero Section
                </button>
              </form>
            </div>
          </div>
        )}

        {activeTab === 'analytics' && (
          <div>
            <h2 className="text-3xl font-bold mb-6">Analytics</h2>
            <div className="bg-white p-6 rounded-lg shadow">
              <Line data={chartData} />
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminDashboard;