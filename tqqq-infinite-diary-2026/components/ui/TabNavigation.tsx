import { TabFilter } from "@/types"

interface TabNavigationProps {
  activeTab: TabFilter
  onTabChange: (tab: TabFilter) => void
  counts: {
    all: number
    active: number
    completed: number
  }
}

export function TabNavigation({ activeTab, onTabChange, counts }: TabNavigationProps) {
  const tabs: { key: TabFilter; label: string }[] = [
    { key: "all", label: "전체" },
    { key: "active", label: "진행중" },
    { key: "completed", label: "완료" },
  ]

  return (
    <div className="flex gap-2 border-b border-gray-200 dark:border-gray-700 mb-6">
      {tabs.map((tab) => {
        const isActive = activeTab === tab.key
        const count = counts[tab.key]

        return (
          <button
            key={tab.key}
            onClick={() => onTabChange(tab.key)}
            className={`
              px-4 py-2 font-medium transition-colors relative
              ${isActive
                ? "text-blue-600 dark:text-blue-400"
                : "text-gray-900 hover:text-black dark:text-gray-100 dark:hover:text-white"
              }
            `}
          >
            <span>{tab.label}</span>
            {count > 0 && (
              <span
                className={`
                  ml-2 px-2 py-0.5 rounded-full text-xs font-medium
                  ${isActive
                    ? "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300"
                    : "bg-gray-200 text-gray-900 dark:bg-gray-800 dark:text-gray-100"
                  }
                `}
              >
                {count}
              </span>
            )}
            {isActive && (
              <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-600 dark:bg-blue-400" />
            )}
          </button>
        )
      })}
    </div>
  )
}
