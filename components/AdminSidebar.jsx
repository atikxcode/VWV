'use client'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  FaHome,
  FaUser,
  FaPlus,
  FaPen,
  FaServicestack,
  FaCommentDots,
  FaCog,
  FaChartLine,
  FaEnvelope,
  FaFile,
  FaCube,
  FaChartPie,
  FaNewspaper,
  FaUsers,
  FaCubes,
} from 'react-icons/fa'

export default function AdminSidebar() {
  const pathname = usePathname()

  const sidebarOptions = [
    { href: '/admin/statsManage', icon: FaChartLine },
    { href: '/admin/userManage', icon: FaUsers },
    { href: '/admin/option3', icon: FaCubes },
    { href: '/admin/addProducts', icon: FaPlus },
    { href: '/admin/option4', icon: FaPen },
    { href: '/admin/option9', icon: FaCog },
    { href: '/', icon: FaHome },
  ]

  const isActive = (href) => pathname === href

  return (
    <aside className="fixed inset-y-0 left-0 z-30 w-24 h-screen overflow-y-auto  bg-white border-gray-700">
      <div className="text-xl flex items-center gap-2 justify-center p-4 text-white font-bold">
        <img
          className="w-[50px] h-[50px]"
          src="/Home_Category/company_logo.png"
          alt=""
        />
      </div>

      <nav className="flex flex-col mt-6  items-center ">
        {sidebarOptions.map(({ href, icon: Icon }) => (
          <Link
            key={href}
            href={href}
            className={`flex items-center  px-4 py-4 rounded-[50%]  mt-2  transition-colors text-xl ${
              isActive(href)
                ? 'bg-black text-white'
                : 'text-gray-500 hover:bg-gray-100 hover:text-gray-700'
            }`}
          >
            <Icon />
            {/* <span className="ml-3">{label}</span> */}
          </Link>
        ))}
      </nav>
    </aside>
  )
}
