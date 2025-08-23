'use client'

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts'

const data = [
  { name: 'Jan', Sales: 4000, Revenue: 2400 },
  { name: 'Feb', Sales: 3000, Revenue: 1398 },
  { name: 'Mar', Sales: 2000, Revenue: 9800 },
  { name: 'Apr', Sales: 2780, Revenue: 3908 },
  { name: 'May', Sales: 1890, Revenue: 4800 },
  { name: 'Jun', Sales: 2390, Revenue: 3800 },
  { name: 'Jul', Sales: 3490, Revenue: 4300 },
]

export default function StatsPage() {
  return (
    <div className="p-6 space-y-6">
      {/* KPIs */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white shadow rounded-lg p-6 flex flex-col items-center">
          <h3 className="text-gray-500 text-sm font-medium">Total Users</h3>
          <p className="text-3xl font-bold mt-2">1,245</p>
        </div>
        <div className="bg-white shadow rounded-lg p-6 flex flex-col items-center">
          <h3 className="text-gray-500 text-sm font-medium">Total Sales</h3>
          <p className="text-3xl font-bold mt-2">$42,300</p>
        </div>
        <div className="bg-white shadow rounded-lg p-6 flex flex-col items-center">
          <h3 className="text-gray-500 text-sm font-medium">New Orders</h3>
          <p className="text-3xl font-bold mt-2">320</p>
        </div>
      </div>

      {/* Bar Chart */}
      <div className="bg-white shadow rounded-lg p-6">
        <h2 className="text-xl font-bold mb-4">Monthly Sales & Revenue</h2>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart
            data={data}
            margin={{ top: 20, right: 30, left: 0, bottom: 5 }}
          >
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="name" />
            <YAxis />
            <Tooltip />
            <Bar dataKey="Sales" fill="#4F46E5" barSize={20} />
            <Bar dataKey="Revenue" fill="#22C55E" barSize={20} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Optional: Additional cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <div className="bg-blue-100 p-6 rounded-lg shadow">
          <h3 className="text-blue-700 font-bold">Active Users</h3>
          <p className="mt-2 text-gray-700 text-xl">856</p>
        </div>
        <div className="bg-green-100 p-6 rounded-lg shadow">
          <h3 className="text-green-700 font-bold">Completed Orders</h3>
          <p className="mt-2 text-gray-700 text-xl">1,120</p>
        </div>
        <div className="bg-yellow-100 p-6 rounded-lg shadow">
          <h3 className="text-yellow-700 font-bold">Pending Orders</h3>
          <p className="mt-2 text-gray-700 text-xl">54</p>
        </div>
      </div>
    </div>
  )
}
