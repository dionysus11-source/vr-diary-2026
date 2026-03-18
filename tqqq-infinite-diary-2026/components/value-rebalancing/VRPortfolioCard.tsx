"use client"

import { VRPortfolioStatus } from "@/types"

interface VRPortfolioCardProps {
  status: VRPortfolioStatus
}

export function VRPortfolioCard({ status }: VRPortfolioCardProps) {
  const {
    shares,
    pool,
    eValue,
    vValue,
    signal,
    benchmarkShares,
    benchmarkValue,
    totalValue,
    difference,
    differenceRate,
  } = status

  const getSignalColor = () => {
    switch (signal) {
      case "BUY":
        return "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300"
      case "SELL":
        return "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300"
      case "HOLD":
        return "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  const getSignalText = () => {
    switch (signal) {
      case "BUY":
        return "매수"
      case "SELL":
        return "매도"
      case "HOLD":
        return "대기"
      default:
        return "-"
    }
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 border border-gray-200 dark:border-gray-700">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-bold text-gray-900 dark:text-white">
          현재 포트폴리오
        </h2>
        <div className={`px-3 py-1 rounded-full text-sm font-bold ${getSignalColor()}`}>
          {getSignalText()}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {/* 주식수 */}
        <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg">
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">주식수</p>
          <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">
            {shares}주
          </p>
        </div>

        {/* 현금 */}
        <div className="bg-purple-50 dark:bg-purple-900/20 p-4 rounded-lg">
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">현금 (Pool)</p>
          <p className="text-2xl font-bold text-purple-600 dark:text-purple-400">
            ${pool.toFixed(2)}
          </p>
        </div>

        {/* 평가금액 */}
        <div className="bg-green-50 dark:bg-green-900/20 p-4 rounded-lg">
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">평가금액</p>
          <p className="text-2xl font-bold text-green-600 dark:text-green-400">
            ${eValue.toFixed(2)}
          </p>
        </div>

        {/* V값 */}
        <div className="bg-orange-50 dark:bg-orange-900/20 p-4 rounded-lg">
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">V값</p>
          <p className="text-2xl font-bold text-orange-600 dark:text-orange-400">
            ${vValue.toFixed(2)}
          </p>
        </div>
      </div>

      {/* VR vs 벤치마크 */}
      <div className="border-t border-gray-200 dark:border-gray-700 pt-6">
        <h3 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white">
          VR vs 벤치마크
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* VR 총 자산 */}
          <div>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
              VR 총 자산 (E + Pool)
            </p>
            <p className="text-3xl font-bold text-blue-600 dark:text-blue-400">
              ${totalValue.toFixed(2)}
            </p>
          </div>

          {/* 벤치마크 */}
          <div>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
              벤치마크 (전액 TQQQ)
            </p>
            <p className="text-3xl font-bold text-gray-700 dark:text-gray-300">
              ${benchmarkValue.toFixed(2)}
            </p>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              {benchmarkShares.toFixed(2)}주
            </p>
          </div>
        </div>

        {/* 차이 */}
        <div className="mt-6 p-4 rounded-lg bg-gray-50 dark:bg-gray-900/50">
          <div className="flex justify-between items-center">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">
                VR vs 벤치마크 차이
              </p>
              <p className="text-2xl font-bold">
                {difference >= 0 ? "+" : ""}${difference.toFixed(2)}
                <span className={`ml-2 text-lg ${difference >= 0 ? "text-green-600 dark:text-green-400" : "text-red-600 dark:text-red-400"}`}>
                  ({differenceRate >= 0 ? "+" : ""}{differenceRate.toFixed(2)}%)
                </span>
              </p>
            </div>
            {difference >= 0 ? (
              <span className="text-4xl">📈</span>
            ) : (
              <span className="text-4xl">📉</span>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
