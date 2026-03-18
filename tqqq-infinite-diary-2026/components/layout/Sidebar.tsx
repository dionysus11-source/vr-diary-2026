"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { useState } from "react"

interface SidebarItem {
  name: string
  href: string
  icon: string
}

const sidebarItems: SidebarItem[] = [
  {
    name: "무한 매수법",
    href: "/",
    icon: "📈",
  },
  {
    name: "밸류 리밸런싱",
    href: "/value-rebalancing",
    icon: "⚖️",
  },
]

export function Sidebar() {
  const pathname = usePathname()
  const [isCollapsed, setIsCollapsed] = useState(false)

  return (
    <aside
      className={`
        fixed left-0 top-0 h-screen bg-white dark:bg-gray-900 border-r border-gray-200 dark:border-gray-700
        transition-all duration-300 z-40
        ${isCollapsed ? "w-16" : "w-64"}
      `}
    >
      {/* 헤더 */}
      <div className="h-16 flex items-center justify-between px-4 border-b border-gray-200 dark:border-gray-700">
        {!isCollapsed && (
          <h1 className="text-lg font-bold text-gray-900 dark:text-white">
            TQQQ Diary
          </h1>
        )}
        <button
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
          aria-label={isCollapsed ? "사이드바 확장" : "사이드바 축소"}
        >
          {isCollapsed ? "→" : "←"}
        </button>
      </div>

      {/* 네비게이션 메뉴 */}
      <nav className="p-4 space-y-2">
        {sidebarItems.map((item) => {
          const isActive = pathname === item.href

          return (
            <Link
              key={item.href}
              href={item.href}
              className={`
                flex items-center gap-3 px-4 py-3 rounded-lg transition-all
                ${isActive
                  ? "bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 font-semibold"
                  : "text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800"
                }
              `}
              title={isCollapsed ? item.name : undefined}
            >
              <span className="text-xl">{item.icon}</span>
              {!isCollapsed && <span>{item.name}</span>}
            </Link>
          )
        })}
      </nav>
    </aside>
  )
}
