"use client"

import { Statistics } from "@/types"
import { formatProfitRate, formatAmount } from "@/lib/data/trades"

interface StatisticsCardsProps {
  statistics: Statistics
}

export function StatisticsCards({ statistics }: StatisticsCardsProps) {
  const cards = [
    {
      title: "총 회차",
      value: statistics.totalRounds,
      subtitle: `완료: ${statistics.completedRounds} | 진행중: ${statistics.activeRounds}`,
    },
    {
      title: "평균 수익률",
      value: formatProfitRate(statistics.averageProfitRate),
      subtitle: `최고: ${formatProfitRate(statistics.maxProfitRate)} (회차 ${statistics.maxProfitRound})`,
    },
    {
      title: "최저 수익률",
      value: formatProfitRate(statistics.minProfitRate),
      subtitle: `회차 ${statistics.minProfitRound}`,
      highlightLoss: true,
    },
    {
      title: "승률",
      value: `${statistics.winRate.toFixed(1)}%`,
      subtitle: statistics.standardDeviation
        ? `변동성: ${statistics.standardDeviation.toFixed(2)}%`
        : undefined,
    },
  ]

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
      {cards.map((card, index) => (
        <div
          key={index}
          className={`
            bg-white dark:bg-gray-800 rounded-lg p-4 border-2
            ${card.highlightLoss
              ? "border-red-200 dark:border-red-900"
              : "border-gray-200 dark:border-gray-700"
            }
          `}
        >
          <div className="text-sm text-black dark:text-white mb-1">
            {card.title}
          </div>
          <div
            className={`
              text-2xl font-bold
              ${card.highlightLoss ? "text-red-600 dark:text-red-400" : ""}
            `}
          >
            {card.value}
          </div>
          {card.subtitle && (
            <div className="text-xs text-black dark:text-white mt-1">
              {card.subtitle}
            </div>
          )}
        </div>
      ))}
    </div>
  )
}
