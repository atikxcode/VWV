// src/components/AdminHeader.jsx
export default function AdminHeader() {
  return (
    <header className="w-full bg-white shadow p-4 flex justify-between items-center">
      <h1 className="text-xl font-semibold">Dashboard</h1>
      <div className="flex items-center space-x-4">
        <button className="px-3 py-1 bg-blue-500 text-white rounded">
          Add User
        </button>
        <div className="w-8 h-8 rounded-full bg-gray-300"></div>{' '}
        {/* user avatar */}
      </div>
    </header>
  )
}
